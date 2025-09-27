// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {UniswapStrategyRegistry} from "../src/registry/UniswapStrategyRegistry.sol";
import {UniswapLPVault} from "../src/strategy/UniswapLPVault.sol";

/// @notice Dummy checkpoint + composite snapshot to feed frontend charts
/// ENV:
/// - PRIVATE_KEY: broadcaster private key (required)
/// - REGISTRY: address of UniswapStrategyRegistry (required)
/// - VAULT: address of UniswapLPVault (required)
/// - STRATEGY_ID: bytes32 hex id for the vault (required)
/// - INDEX_ID: bytes32 hex id for the composite index (optional, default DEMO-INDEX)
/// - NAV_USD_1E18: uint NAV to checkpoint (optional, default +2% over seed)
contract SnapshotAfterCheckpoint is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        address regAddr = vm.envAddress("REGISTRY");
        bytes32 strategyId = vm.envBytes32("STRATEGY_ID");
        bytes32 indexId = vm.envOr("INDEX_ID", bytes32(0));
        if (indexId == bytes32(0)) indexId = keccak256(abi.encodePacked("DEMO-INDEX"));
        bool metricsOnly = vm.envOr("METRICS_ONLY", false);
        uint256 navOverride = vm.envOr("NAV_USD_1E18", uint256(0));

        UniswapStrategyRegistry reg = UniswapStrategyRegistry(regAddr);

        vm.startBroadcast(pk);
        if (!metricsOnly) {
            address vaultAddr = vm.envAddress("VAULT");
            UniswapLPVault vault = UniswapLPVault(vaultAddr);
            // Dummy rebalance (no-op) + checkpoint
            vault.rebalance();
            if (navOverride != 0) {
                vault.checkpointByNav(navOverride);
            } else {
                // bump NAV by +2% relative to last PPS if seeded at 1.0
                // In this minimal example we don't read previous NAV, just emit another snapshot
                vault.checkpointByNav(102e18);
            }
        }

        // Ensure index exists and includes the strategyId, then snapshot
        bytes32[] memory arr = new bytes32[](1);
        arr[0] = strategyId;
        reg.registerIndex(indexId, arr);
        reg.snapshotIndex(indexId);
        vm.stopBroadcast();
    }
}
