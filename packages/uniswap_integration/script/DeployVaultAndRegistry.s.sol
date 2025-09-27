// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {UniswapLPVault} from "../src/strategy/UniswapLPVault.sol";
import {UniswapStrategyRegistry} from "../src/registry/UniswapStrategyRegistry.sol";
import {StrategyManager} from "../src/manager/StrategyManager.sol";
import {PoolMetricsAdapter} from "../src/adapters/PoolMetricsAdapter.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";

/// @dev ENV:
/// ADMIN - owner/admin address (defaults to msg.sender)
/// MANAGER - optional manager/keeper address
/// STRATEGY_ID - hex bytes32 string id (e.g., 0x1234...)
contract DeployVaultAndRegistry is Script {
    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0));
        address admin = vm.envOr("ADMIN", address(0));
        if (admin == address(0)) {
            admin = pk != 0 ? vm.addr(pk) : msg.sender;
        }
        address manager = vm.envOr("MANAGER", address(0));
        if (manager == address(0)) manager = admin;
        bytes32 strategyId = vm.envBytes32("STRATEGY_ID");
        if (strategyId == bytes32(0)) {
            strategyId = keccak256(abi.encodePacked("DEMO-STRATEGY"));
        }
        bool metricsOnly = vm.envOr("METRICS_ONLY", false);

        if (pk != 0) vm.startBroadcast(pk); 
        else vm.startBroadcast();
        UniswapStrategyRegistry reg = new UniswapStrategyRegistry(admin);
        StrategyManager sm = new StrategyManager(admin);
        sm.setRegistry(address(reg));

        if (metricsOnly) {
            // Deploy metrics-only adapter and register
            PoolMetricsAdapter adapter = new PoolMetricsAdapter(strategyId, admin);
            // Set pool key via env
            address token0 = vm.envAddress("TOKEN0");
            address token1 = vm.envAddress("TOKEN1");
            uint256 fee = vm.envOr("FEE", uint256(500)); // default 0.05%
            int256 ts = vm.envOr("TICK_SPACING", int256(10));
            address hook = vm.envOr("HOOK", address(0));
            adapter.setPoolKey(token0, token1, uint24(fee), int24(ts), hook);
            // Seed baseline NAV
            uint256 seedNav = vm.envOr("SEED_NAV_1E18", uint256(100e18));
            adapter.seedBaseline(seedNav);
            // Register metrics strategy (no vault)
            reg.registerMetricsStrategy(strategyId, address(adapter), hook);
        } else {
            // Fallback: deploy vault-based strategy
            UniswapLPVault vault = new UniswapLPVault(strategyId, admin);
            reg.registerStrategy(strategyId, address(vault), address(0));
            vault.setManager(manager);
            reg.setVaultManager(strategyId, manager);
            // seed demo NAV to 100 USD
            vault.seedInitialNAV(100e18, 1e18);
        }
        vm.stopBroadcast();
    }
}
