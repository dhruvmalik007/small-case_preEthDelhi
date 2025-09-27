// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {UniswapLPVault} from "../src/strategy/UniswapLPVault.sol";
import {UniswapStrategyRegistry} from "../src/registry/UniswapStrategyRegistry.sol";

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

        if (pk != 0) vm.startBroadcast(pk); else vm.startBroadcast();
        UniswapLPVault vault = new UniswapLPVault(strategyId, admin);
        UniswapStrategyRegistry reg = new UniswapStrategyRegistry(admin);

        vault.setManager(manager);
        reg.registerStrategy(strategyId, address(vault), address(0));
        reg.setVaultManager(strategyId, manager);

        // seed demo NAV to 100 USD
        vault.seedInitialNAV(100e18, 1e18);
        vm.stopBroadcast();
    }
}
