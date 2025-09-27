// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {OwnableLite} from "../utils/OwnableLite.sol";
import {IStrategyMetrics} from "../interfaces/IStrategyMetrics.sol";
import {IStateViewMinimal} from "../interfaces/IStateViewMinimal.sol";
import {ChainConfig} from "../libraries/ChainConfig.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

/// @title PoolMetricsAdapter
/// @notice Read-only strategy metrics adapter that derives NAV/PPS/PnL from a Uniswap v4 pool price via StateView.
/// @dev Does not manage liquidity. Intended to replace vault-based metrics when delegating to pre-existing pools.
contract PoolMetricsAdapter is OwnableLite, IStrategyMetrics {
    bytes32 public immutable strategyId;

    // Pool identification
    address public token0;
    address public token1;
    uint24  public fee;
    int24   public tickSpacing;
    address public hook; // 0x0 for no-hook pools

    // Baseline for metrics
    uint256 public seedNav1e18;      // e.g., 100e18
    uint256 public baselinePrice1e18; // price1 per token0 in 1e18 scale at seeding
    uint256 public seedTimestamp;

    event BaselineSeeded(uint256 seedNav, uint256 baselinePrice1e18, uint256 ts);
    event PoolKeyUpdated(address token0, address token1, uint24 fee, int24 tickSpacing, address hook);

    constructor(bytes32 _strategyId, address _owner) OwnableLite(_owner) {
        require(_strategyId != bytes32(0), "Adapter:id=0");
        strategyId = _strategyId;
    }

    // ------------------ Admin ------------------

    function setPoolKey(
        address _token0,
        address _token1,
        uint24 _fee,
        int24 _tickSpacing,
        address _hook
    ) external onlyOwner {
        token0 = _token0;
        token1 = _token1;
        fee = _fee;
        tickSpacing = _tickSpacing;
        hook = _hook;
        emit PoolKeyUpdated(_token0, _token1, _fee, _tickSpacing, _hook);
    }

    /// @notice Seed baseline using current pool price; nav baseline defaults to 100e18 unless specified
    function seedBaseline(uint256 navBaseline1e18) external onlyOwner {
        uint256 px = _currentPrice1e18();
        require(px > 0, "Adapter:px=0");
        seedNav1e18 = navBaseline1e18 == 0 ? 100e18 : navBaseline1e18;
        baselinePrice1e18 = px;
        seedTimestamp = block.timestamp;
        emit BaselineSeeded(seedNav1e18, baselinePrice1e18, seedTimestamp);
    }

    // ------------------ IStrategyMetrics ------------------

    function nav() external view override returns (uint256 navUsd1e18) {
        (uint256 nav_, , ) = _computeMetrics();
        return nav_;
    }

    function pricePerShare() external view override returns (uint256 pps1e18) {
        (, uint256 pps_, ) = _computeMetrics();
        return pps_;
    }

    function pnlBps() external view override returns (int256 pnlBps_) {
        (, , int256 pnl_) = _computeMetrics();
        return pnl_;
    }

    function getStrategyMetrics()
        external
        view
        override
        returns (uint256 navUsd1e18, uint256 pps1e18, int256 pnlBps_)
    {
        return _computeMetrics();
    }

    // ------------------ Internals ------------------

    function _computeMetrics() internal view returns (uint256 nav_, uint256 pps_, int256 pnl_) {
        if (baselinePrice1e18 == 0 || seedNav1e18 == 0) {
            return (0, 0, 0);
        }
        uint256 px = _currentPrice1e18();
        if (px == 0) return (0, 0, 0);
        // nav scales with price ratio relative to baseline
        // nav = seedNav * px / baseline
        nav_ = (seedNav1e18 * px) / baselinePrice1e18;
        // pps = nav / seedNav
        pps_ = (nav_ * 1e18) / seedNav1e18;
        // pnl bps = (pps - 1e18) * 1e4 / 1e18
        if (pps_ >= 1e18) {
            pnl_ = int256(((pps_ - 1e18) * 10_000) / 1e18);
        } else {
            pnl_ = -int256(((1e18 - pps_) * 10_000) / 1e18);
        }
    }

    function _currentPrice1e18() internal view returns (uint256) {
        ChainConfig.V4Addresses memory a = ChainConfig.get(block.chainid);
        require(a.stateView != address(0), "Adapter:stateView=0");
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: fee,
            tickSpacing: tickSpacing,
            hooks: IHooks(hook)
        });
        (uint160 sqrtPriceX96, ) = IStateViewMinimal(a.stateView).getSlot0(key);
        if (sqrtPriceX96 == 0) return 0;
        // price1 per token0 = (sqrtP^2 / 2^192) * 10^(dec0 - dec1)
        uint256 dec0 = IERC20Metadata(token0).decimals();
        uint256 dec1 = IERC20Metadata(token1).decimals();
        uint256 ratioX192 = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
        // scale to 1e18: price = ratioX192 * 1e18 / 2^192 * 10^(dec0-dec1)
        // 2^192 = 6277101735386680763835789423207666416102355444464034512896
        uint256 Q192 = 2**192;
        uint256 base = (ratioX192 * 1e18) / Q192;
        if (dec0 > dec1) {
            uint256 pow = dec0 - dec1;
            return base * (10**pow);
        } else if (dec1 > dec0) {
            uint256 powd = dec1 - dec0;
            return base / (10**powd);
        }
        return base;
    }
}
