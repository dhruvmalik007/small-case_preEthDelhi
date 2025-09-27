// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {MultiPolicyHook} from "../src/hooks/MultiPolicyHook.sol";
import {IStateViewMinimal} from "../src/interfaces/IStateViewMinimal.sol";
import {ChainConfig} from "../src/libraries/ChainConfig.sol";

contract DeployMultiPolicyHook is Script {
    function run() external {
        ChainConfig.V4Addresses memory a = ChainConfig.get(block.chainid);
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0));
        address admin = vm.envOr("ADMIN", address(0));
        if (admin == address(0)) {
            admin = pk != 0 ? vm.addr(pk) : msg.sender;
        }
        address keeper = vm.envOr("KEEPER", admin);
        address pm = vm.envOr("POOL_MANAGER", a.poolManager);
        address sv = vm.envOr("STATE_VIEW", a.stateView);

        if (pk != 0) vm.startBroadcast(pk); else vm.startBroadcast();
        MultiPolicyHook hook = new MultiPolicyHook(IPoolManager(pm), admin, IStateViewMinimal(sv));
        hook.setKeeper(keeper);
        vm.stopBroadcast();
    }
}
