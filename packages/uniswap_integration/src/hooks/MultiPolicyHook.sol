// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

// OpenZeppelin Uniswap v4 hooks base
import {BaseHook} from "../../lib/uniswap-hooks/src/base/BaseHook.sol";

// Uniswap v4 core
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {IPoolManager, SwapParams, ModifyLiquidityParams} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {IStateViewMinimal} from "../interfaces/IStateViewMinimal.sol";
import {ChainConfig} from "../libraries/ChainConfig.sol";

/// @title MultiPolicyHook
/// @notice A composable Uniswap v4 hook implementing:
/// - Range/TWAP rebalancing signal
/// - Volatility-adaptive width selection
/// - EWMA-based Sharpe ratio signal
/// - Fee compounding signal flag
///
/// The hook only enforces policy constraints in beforeAdd/Remove and updates signals in afterSwap.
/// Actual liquidity movements are performed by a Strategy Manager/Vault.
contract MultiPolicyHook is BaseHook {
    using PoolIdLibrary for PoolKey;

    struct RangeParams {
        int24 tickLower;
        int24 tickUpper;
        uint32 twapLookback;         // seconds
        uint16 twapThresholdBps;     // deviation threshold
        uint32 rebalanceCooldown;    // seconds
        uint32 lastRebalanceTs;      // last time manager rebalanced
        bool enabled;
    }

    struct VolatilityParams {
        // EWMA parameters
        uint16 lambdaBps;            // decay in bps, e.g., 9950 = 0.995
        int128 ewMean;               // scaled 1e9
        int128 ewVar;                // scaled 1e9
        uint32 lastUpdateTs;
        uint24 minSwapNotionalBps;   // ignore very small swaps vs TVL proxy
        int24 minWidth;              // min ticks width
        int24 maxWidth;              // max ticks width
        int24 targetWidth;           // output signal (ticks)
        int16 sharpeLow;             // thresholds in 1e2 scale (e.g., 100 = 1.0)
        int16 sharpeHigh;
        bool enabled;
    }

    struct FeeParams {
        uint32 lastCompoundTs;
        uint32 compoundCooldown;
        uint128 minFeesToCompound;   // strategy-defined units
        bool enabled;
    }

    struct PoolState {
        RangeParams range;
        VolatilityParams vol;
        FeeParams fees;
        uint160 lastPriceX96;        // last observed sqrtPriceX96
        bool rebalanceNeeded;        // signal
        bool paused;
    }

    mapping(PoolId => PoolState) public poolState;

    address public keeper; // authorized off-chain agent
    address public admin;  // owner/admin
    IStateViewMinimal public stateView; // periphery view lens

    event KeeperUpdated(address indexed keeper);
    event AdminUpdated(address indexed admin);
    event PoolParamsUpdated(PoolId indexed id);
    event PoolPaused(PoolId indexed id, bool paused);
    event RebalanceSignal(PoolId indexed id, bool needed, uint160 priceX96);
    event PoolReturnSample(PoolId indexed id, uint160 priceX96, int128 rScaled1e9, uint256 timestamp);
    event WidthTargetUpdated(PoolId indexed id, int24 targetWidth);

    modifier onlyAdmin() {
        require(msg.sender == admin, "MPH:not admin");
        _;
    }

    modifier onlyKeeperOrAdmin() {
        require(msg.sender == keeper || msg.sender == admin, "MPH:not auth");
        _;
    }

    constructor(IPoolManager _poolManager, address _admin, IStateViewMinimal _stateView) BaseHook(_poolManager) {
        require(_admin != address(0), "admin=0");
        admin = _admin;
        stateView = _stateView;
        emit AdminUpdated(_admin);
    }

    function setKeeper(address k) external onlyAdmin {
        keeper = k;
        emit KeeperUpdated(k);
    }

    function setAdmin(address a) external onlyAdmin {
        admin = a;
        emit AdminUpdated(a);
    }

    // ------------------ Hook permissions ------------------
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: false,
            beforeAddLiquidity: true,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: true,
            afterRemoveLiquidity: false,
            beforeSwap: false,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    // ------------------ Admin configuration ------------------

    function configurePool(
        PoolKey calldata key,
        RangeParams calldata range,
        VolatilityParams calldata vol,
        FeeParams calldata fees
    ) external onlyAdmin {
        PoolId id = key.toId();
        poolState[id].range = range;
        poolState[id].vol = vol;
        poolState[id].fees = fees;
        emit PoolParamsUpdated(id);
    }

    function pausePool(PoolKey calldata key, bool p) external onlyAdmin {
        PoolId id = key.toId();
        poolState[id].paused = p;
        emit PoolPaused(id, p);
    }

    // ------------------ Policy enforcement ------------------

    function _beforeAddLiquidity(
        address, 
        PoolKey calldata key, 
        ModifyLiquidityParams calldata params, 
        bytes calldata
    ) internal override returns (bytes4) {
        PoolState storage st = poolState[key.toId()];
        require(!st.paused, "MPH:paused");
        if (st.range.enabled) {
            // enforce width bounds
            int24 width = params.tickUpper - params.tickLower;
            if (st.vol.enabled) {
                // if volatility policy set a target width, enforce within min/max
                if (st.vol.targetWidth != 0) {
                    require(width >= st.vol.minWidth && width <= st.vol.maxWidth, "MPH:width-bounds");
                }
            }
        }
        return BaseHook.beforeAddLiquidity.selector;
    }

    function _beforeRemoveLiquidity(
        address, 
        PoolKey calldata key, 
        ModifyLiquidityParams calldata, 
        bytes calldata
    ) internal override returns (bytes4) {
        PoolState storage st = poolState[key.toId()];
        require(!st.paused, "MPH:paused");
        return BaseHook.beforeRemoveLiquidity.selector;
    }

    // ------------------ Signals and analytics ------------------

    function _afterSwap(
        address, 
        PoolKey calldata key, 
        SwapParams calldata, 
        BalanceDelta, 
        bytes calldata
    ) internal override returns (bytes4, int128) {
        PoolId id = key.toId();
        PoolState storage st = poolState[id];
        if (st.paused) return (BaseHook.afterSwap.selector, 0);

        // Query current price from pool manager (slot0-like)
        // NOTE: In v4, price can be derived from PoolManager slot or passed context; keeping abstract here.
        (uint160 priceX96,) = _getSqrtPriceX96(key);

        if (st.vol.enabled) {
            // compute return r in scaled int128 (1e9) using log-price approx: r = (p - p_prev)/p_prev
            if (st.lastPriceX96 != 0 && priceX96 != 0) {
                int256 p = int256(uint256(priceX96));
                int256 p0 = int256(uint256(st.lastPriceX96));
                int128 r = int128(( (p - p0) * 1e9 ) / p0);
                _updateEWMA(id, st, r);
                _updateWidthSignal(id, st);
                emit PoolReturnSample(id, priceX96, r, block.timestamp);
            }
        }

        st.lastPriceX96 = priceX96;
        // TWAP deviation checks could be added here using StateView on the manager per PoolKey
        _updateRebalanceSignal(id, st, priceX96);

        return (BaseHook.afterSwap.selector, 0);
    }

    /// @notice Manually refresh signals without requiring a swap
    /// @dev Useful for managing pre-existing pools not created with this hook address
    function poke(PoolKey calldata key) external onlyKeeperOrAdmin {
        PoolId id = key.toId();
        PoolState storage st = poolState[id];
        if (st.paused) return;
        (uint160 priceX96,) = _getSqrtPriceX96(key);
        if (priceX96 == 0) return;
        if (st.vol.enabled) {
            if (st.lastPriceX96 != 0) {
                int256 p = int256(uint256(priceX96));
                int256 p0 = int256(uint256(st.lastPriceX96));
                int128 r = int128(((p - p0) * 1e9) / p0);
                _updateEWMA(id, st, r);
                _updateWidthSignal(id, st);
                emit PoolReturnSample(id, priceX96, r, block.timestamp);
            }
        }
        st.lastPriceX96 = priceX96;
        _updateRebalanceSignal(id, st, priceX96);
    }

    

    function _getSqrtPriceX96(PoolKey calldata key) internal view returns (uint160 priceX96, int24 tick) {
        // Preferred path: use injected StateView lens
        if (address(stateView) != address(0)) {
            try stateView.getSlot0(key) returns (uint160 px, int24 tk) {
                return (px, tk);
            } catch {}
        }
        // Fallback: resolve lens from ChainConfig for the current chain
        ChainConfig.V4Addresses memory a = ChainConfig.get(block.chainid);
        if (a.stateView != address(0)) {
            try IStateViewMinimal(a.stateView).getSlot0(key) returns (uint160 px2, int24 tk2) {
                return (px2, tk2);
            } catch {}
        }
        return (0, 0);
    }

    function _updateEWMA(PoolId id, PoolState storage st, int128 r) internal {
        uint16 lbps = st.vol.lambdaBps == 0 ? 9950 : st.vol.lambdaBps; // default 0.995/ meaning 5% change in the value param
        // ewMean = λ * mean + (1-λ) * r
        // ewVar  = λ * var  + (1-λ) * (r - mean)^2
        int128 mean = st.vol.ewMean;
        int128 var_ = st.vol.ewVar;
        int256 lbpsInt = int256(uint256(lbps));
        int256 oneMinusInt = int256(uint256(10_000) - uint256(lbps));
        // scale in bps; convert to 1e4 denominator
        // newMean = (lbps*mean + (1-lbps)*r) / 1e4
        int128 newMean = int128( ( lbpsInt * mean + oneMinusInt * r ) / 10_000 );
        int128 diff = r - newMean;
        int128 diff2 = int128( ( int256(diff) * int256(diff) ) / 1e9 ); // keep 1e9 scale
        int128 newVar = int128( ( lbpsInt * var_ + oneMinusInt * diff2 ) / 10_000 );
        st.vol.ewMean = newMean;
        st.vol.ewVar = newVar;
        st.vol.lastUpdateTs = uint32(block.timestamp);
    }

    function _updateWidthSignal(PoolId id, PoolState storage st) internal {
        // Sharpe = mean / sqrt(var)
        int128 mean = st.vol.ewMean; // 1e9 scale
        int128 var_ = st.vol.ewVar;  // 1e9 scale
        if (var_ <= 0) return;
        // sqrt via rough integer sqrt (Newton or Babylonian); keep it simple
        uint256 v = uint256(int256(var_));
        uint256 s = _isqrt(v * 1e9); // bring back to 1e9 scale under sqrt
        if (s == 0) return;
        int256 sharpe_e2 = (int256(mean) * 1e11) / int256(s); // scale ~1e2 (100 = 1.0)
        int24 width = st.vol.targetWidth;
        if (sharpe_e2 < st.vol.sharpeLow) {
            // widen within bounds
            int24 widened = width + (st.vol.maxWidth - st.vol.minWidth) / 10;
            if (widened > st.vol.maxWidth) widened = st.vol.maxWidth;
            st.vol.targetWidth = widened;
            emit WidthTargetUpdated(id, st.vol.targetWidth);
        } else if (sharpe_e2 > st.vol.sharpeHigh) {
            // narrow within bounds
            int24 narrowed = width - (st.vol.maxWidth - st.vol.minWidth) / 10;
            if (narrowed < st.vol.minWidth) narrowed = st.vol.minWidth;
            st.vol.targetWidth = narrowed;
            emit WidthTargetUpdated(id, st.vol.targetWidth);
        }
    }

    function _isqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;
        uint256 z = (x + 1) / 2;
        y = x;
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function _updateRebalanceSignal(PoolId id, PoolState storage st, uint160 priceX96) internal {
        bool need = false;
        if (st.range.enabled) {
            // If cooldown elapsed and TWAP threshold logic indicates drift, set need
            if (block.timestamp > st.range.lastRebalanceTs + st.range.rebalanceCooldown) {
                // Without TWAP feed here, use price change as proxy
                if (st.lastPriceX96 != 0 && priceX96 != 0) {
                    int256 p = int256(uint256(priceX96));
                    int256 p0 = int256(uint256(st.lastPriceX96));
                    int256 bps = ((p - p0) * 10_000) / p0;
                    if (bps < 0) bps = -bps;
                    if (uint256(bps) >= st.range.twapThresholdBps) {
                        need = true;
                    }
                }
            }
        }
        st.rebalanceNeeded = need;
        emit RebalanceSignal(id, need, priceX96);
    }

    // ------------------ Views ------------------

    function getPoolState(PoolKey calldata key) external view returns (PoolState memory) {
        return poolState[key.toId()];
    }

    function getSignals(PoolKey calldata key)
        external
        view
        returns (
            bool paused,
            bool rebalanceNeeded,
            int24 targetWidth,
            uint160 lastPriceX96
        )
    {
        PoolState storage st = poolState[key.toId()];
        return (st.paused, st.rebalanceNeeded, st.vol.targetWidth, st.lastPriceX96);
    }
}
