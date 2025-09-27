// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {OwnableLite} from "../utils/OwnableLite.sol";
import {IStrategyMetrics} from "../interfaces/IStrategyMetrics.sol";
import {IRebalanceableVault} from "../interfaces/IRebalanceableVault.sol";
import {StrategyEvents} from "../events/StrategyEvents.sol";

/// @title UniswapLPVault (minimal)
/// @notice Minimal strategy vault skeleton exposing NAV/PPS/PnL metrics and manager entrypoints.
/// @dev This is a simplified vault to unblock frontend/backend integration; it does not yet hold ERC-4626 logic.
contract UniswapLPVault is OwnableLite, IStrategyMetrics, IRebalanceableVault {
    using StrategyEvents for *;

    // --- Config ---
    bytes32 public immutable strategyId;
    address public manager; // keeper/manager set by owner

    // --- Pool params configured by manager ---
    address public poolToken0;
    address public poolToken1;
    uint24  public poolFee;
    int24   public poolTickSpacing;
    address public poolHook;
    uint16  public slippageBps; // basis points for L/S ops

    // --- Metrics state (scaled) ---
    uint256 private _navUsd1e18;    // latest NAV
    uint256 private _pps1e18;       // price per share (1e18 = 1.0)
    int256  private _pnlBps;        // basis points
    uint256 private _seedNav1e18;   // seed NAV baseline
    uint256 public seedTimestamp;

    // --- Events ---
    event ManagerUpdated(address indexed manager);
    event ParamsUpdated(
        address token0,
        address token1,
        uint24 fee,
        int24 tickSpacing,
        address hook,
        uint16 slippageBps
    );

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner, "Vault:not manager");
        _;
    }

    constructor(bytes32 _strategyId, address _owner) OwnableLite(_owner) {
        require(_strategyId != bytes32(0), "Vault:id=0");
        strategyId = _strategyId;
        _pps1e18 = 1e18; // default
    }

    // ------------------ Admin/Manager ------------------

    function setManager(address m) external override onlyOwner {
        manager = m;
        emit ManagerUpdated(m);
    }

    function setParams(bytes calldata data) external override onlyManager {
        // abi.encode(token0, token1, fee, tickSpacing, hook, slippageBps)
        (
            address t0,
            address t1,
            uint24 fee,
            int24 ts,
            address hook,
            uint16 slippage
        ) = abi.decode(data, (address, address, uint24, int24, address, uint16));

        poolToken0 = t0;
        poolToken1 = t1;
        poolFee = fee;
        poolTickSpacing = ts;
        poolHook = hook;
        slippageBps = slippage;
        emit ParamsUpdated(t0, t1, fee, ts, hook, slippage);
    }

    // ------------------ NAV/PPS Seeding and Updates ------------------

    /// @notice Seed initial NAV and price per share (owner only)
    function seedInitialNAV(uint256 navUsd1e18, uint256 pps1e18) external onlyOwner {
        _navUsd1e18 = navUsd1e18;
        _pps1e18 = pps1e18 == 0 ? 1e18 : pps1e18;
        _seedNav1e18 = navUsd1e18;
        seedTimestamp = block.timestamp;
        _emitSnapshot();
    }

    /// @notice Manager can checkpoint NAV/PPS/PnL after rebalances/harvests
    function checkpoint(uint256 navUsd1e18, uint256 pps1e18, int256 pnlBps_) external onlyManager {
        _navUsd1e18 = navUsd1e18;
        _pps1e18 = pps1e18;
        _pnlBps = pnlBps_;
        _emitSnapshot();
    }

    /// @notice Convenience: checkpoint providing only NAV; computes PnL and PPS relative to seed
    function checkpointByNav(uint256 navUsd1e18) external onlyManager {
        _navUsd1e18 = navUsd1e18;
        if (_seedNav1e18 > 0) {
            // pps defaults to NAV/seed baseline scaled to 1e18
            _pps1e18 = (navUsd1e18 * 1e18) / _seedNav1e18;
            // pnl bps = (nav - seed) / seed * 1e4
            int256 diff = int256(navUsd1e18) - int256(_seedNav1e18);
            _pnlBps = int256((diff * 10_000) / int256(_seedNav1e18));
        }
        _emitSnapshot();
    }

    function _emitSnapshot() internal {
        emit StrategyEvents.NAVSnapshot(strategyId, _navUsd1e18, _pps1e18, _pnlBps, block.timestamp);
    }

    // ------------------ Metrics Views ------------------

    function nav() external view override returns (uint256 navUsd1e18) { return _navUsd1e18; }
    function pricePerShare() external view override returns (uint256 pps1e18) { return _pps1e18; }
    function pnlBps() external view override returns (int256 pnlBps_) { return _pnlBps; }

    function getStrategyMetrics()
        external
        view
        override
        returns (uint256 navUsd1e18, uint256 pps1e18, int256 pnlBps_)
    { return (_navUsd1e18, _pps1e18, _pnlBps); }

    // ------------------ Strategy actions (stubs) ------------------

    function rebalance() external override onlyManager {
        // future: call PositionManager to adjust ranges/liquidity per policy signals
    }

    function compoundFees() external override onlyManager {
        // future: collect & reinvest fees
    }
}
