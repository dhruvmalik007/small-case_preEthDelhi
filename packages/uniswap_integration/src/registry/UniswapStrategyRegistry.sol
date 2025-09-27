// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {OwnableLite} from "../utils/OwnableLite.sol";
import {IStrategyMetrics} from "../interfaces/IStrategyMetrics.sol";
import {IRebalanceableVault} from "../interfaces/IRebalanceableVault.sol";
import {StrategyEvents} from "../events/StrategyEvents.sol";

/// @title UniswapStrategyRegistry (minimal)
/// @notice Registry to manage strategy vaults and emit composite index snapshots.
contract UniswapStrategyRegistry is OwnableLite {
    using StrategyEvents for *;

    struct StrategyInfo {
        address vault;      // optional: implements IRebalanceableVault & IStrategyMetrics
        address metrics;    // optional: implements IStrategyMetrics (used when vault is not present)
        address hook;       // optional associated hook
        bool active;
    }

    struct IndexInfo {
        bytes32[] constituents; // array of strategyIds
        bool active;
    }

    // strategy id => info
    mapping(bytes32 => StrategyInfo) public strategies;
    // index id => info
    mapping(bytes32 => IndexInfo) public indices;

    event StrategyRegistered(bytes32 indexed id, address indexed vault, address hook);
    event StrategyActivated(bytes32 indexed id, bool active);
    event IndexRegistered(bytes32 indexed id, bytes32[] constituents);
    event IndexActivated(bytes32 indexed id, bool active);

    constructor(address _owner) OwnableLite(_owner) {}

    // ------------------ Strategies ------------------

    function registerStrategy(bytes32 id, address vault, address hook) external onlyOwner {
        require(id != bytes32(0), "REG:id=0");
        require(vault != address(0), "REG:vault=0");
        strategies[id] = StrategyInfo({vault: vault, metrics: address(0), hook: hook, active: true});
        emit StrategyRegistered(id, vault, hook);
        emit StrategyActivated(id, true);
    }

    /// @notice Register a metrics-only strategy (no vault). The metrics contract must implement IStrategyMetrics
    function registerMetricsStrategy(bytes32 id, address metrics, address hook) external onlyOwner {
        require(id != bytes32(0), "REG:id=0");
        require(metrics != address(0), "REG:metrics=0");
        strategies[id] = StrategyInfo({vault: address(0), metrics: metrics, hook: hook, active: true});
        emit StrategyRegistered(id, address(0), hook);
        emit StrategyActivated(id, true);
    }

    function setStrategyActive(bytes32 id, bool active) external onlyOwner {
        StrategyInfo storage s = strategies[id];
        require(s.vault != address(0) || s.metrics != address(0), "REG:unknown");
        s.active = active;
        emit StrategyActivated(id, active);
    }

    function setVaultManager(bytes32 id, address manager) external onlyOwner {
        StrategyInfo storage s = strategies[id];
        require(s.vault != address(0), "REG:unknown");
        IRebalanceableVault(s.vault).setManager(manager);
    }

    function rebalance(bytes32 id) external onlyOwner {
        StrategyInfo storage s = strategies[id];
        require(s.active, "REG:inactive");
        require(s.vault != address(0), "REG:no-vault");
        IRebalanceableVault(s.vault).rebalance();
    }

    function compound(bytes32 id) external onlyOwner {
        StrategyInfo storage s = strategies[id];
        require(s.active, "REG:inactive");
        require(s.vault != address(0), "REG:no-vault");
        IRebalanceableVault(s.vault).compoundFees();
    }

    // ------------------ Indices (composites) ------------------

    function registerIndex(bytes32 indexId, bytes32[] calldata constituents) external onlyOwner {
        require(indexId != bytes32(0), "REG:index=0");
        indices[indexId] = IndexInfo({constituents: constituents, active: true});
        emit IndexRegistered(indexId, constituents);
        emit IndexActivated(indexId, true);
    }

    function setIndexActive(bytes32 indexId, bool active) external onlyOwner {
        IndexInfo storage ix = indices[indexId];
        require(ix.constituents.length > 0, "REG:idx-unknown");
        ix.active = active;
        emit IndexActivated(indexId, active);
    }

    /// @notice Return the constituents array for an index id
    function getIndexConstituents(bytes32 indexId) external view returns (bytes32[] memory) {
        IndexInfo storage ix = indices[indexId];
        require(ix.constituents.length > 0, "REG:idx-unknown");
        return ix.constituents;
    }

    /// @notice Emit a composite NAV snapshot using TVL-weighted PPS and PnL across constituents
    function snapshotIndex(bytes32 indexId) external {
        IndexInfo storage ix = indices[indexId];
        require(ix.active, "REG:idx-inactive");
        uint256 len = ix.constituents.length;
        require(len > 0, "REG:idx-empty");
        uint256 totalNav;
        uint256 weightedPpsNumerator; // sum(pps * nav)
        int256 weightedPnlNumerator;  // sum(pnlBps * nav)
        for (uint256 i = 0; i < len; i++) {
            StrategyInfo storage s = strategies[ix.constituents[i]];
            if (!s.active) continue;
            address metricsProvider = s.metrics != address(0) ? s.metrics : s.vault;
            if (metricsProvider == address(0)) continue;
            (
                uint256 navUsd1e18,
                uint256 pps1e18,
                int256 pnlBps_
            ) = IStrategyMetrics(metricsProvider).getStrategyMetrics();
            totalNav += navUsd1e18;
            // accumulate weighted numerators; guard against overflow by using 256-bit
            weightedPpsNumerator += (pps1e18 * navUsd1e18) / 1e18; // keep result in 1e18 scale
            weightedPnlNumerator += (pnlBps_ * int256(navUsd1e18)) / int256(1e18);
        }
        // TVL-weighted metrics: divide by totalNav if nonzero
        uint256 ppsWeighted = totalNav == 0 ? 0 : weightedPpsNumerator / totalNav;
        int256 pnlWeightedBps = totalNav == 0 ? int256(0) : weightedPnlNumerator / int256(totalNav);
        emit StrategyEvents.CompositeNAVSnapshot(indexId, totalNav, ppsWeighted, pnlWeightedBps, block.timestamp);
    }

    function _activeCount(IndexInfo storage ix) internal view returns (uint256 n) {
        uint256 len = ix.constituents.length;
        for (uint256 i = 0; i < len; i++) {
            StrategyInfo storage s = strategies[ix.constituents[i]];
            if (s.active && s.vault != address(0)) n++;
        }
    }
}
