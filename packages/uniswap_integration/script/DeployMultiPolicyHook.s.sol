// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {MultiPolicyHook} from "../src/hooks/MultiPolicyHook.sol";
import {IStateViewMinimal} from "../src/interfaces/IStateViewMinimal.sol";
import {ChainConfig} from "../src/libraries/ChainConfig.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

contract DeployMultiPolicyHook is Script, StdCheats {
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

        // Optionally fund the broadcaster on local fork to avoid insufficient gas errors
        bool fund = vm.envOr("FUND_BROADCASTER", true);
        address sender = pk != 0 ? vm.addr(pk) : vm.envOr("SENDER", admin);
        if (fund) {
            vm.deal(sender, 100 ether);
        }
        // Optionally credit USDC (or any ERC20) to the broadcaster using StdCheats.deal
        address usdc = vm.envOr("USDC", address(0));
        uint256 usdcAmt = vm.envOr("USDC_DEAL", uint256(0));
        if (usdc != address(0) && usdcAmt > 0) {
            deal(usdc, sender, usdcAmt, true);
        }

        // Compute required flags from hook permissions
        uint160 flags = uint160(
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        );

        // Mine salt for CREATE2 so that the deployed address encodes the flags
        bytes memory constructorArgs = abi.encode(IPoolManager(pm), admin, IStateViewMinimal(sv));
        // In forge script, use the CREATE2 deployer proxy as the deployer parameter for HookMiner
        address CREATE2_FACTORY = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        (address minedAddr, bytes32 salt) = HookMiner.find(
            CREATE2_FACTORY,
            flags,
            type(MultiPolicyHook).creationCode,
            constructorArgs
        );

        if (pk != 0) {
            vm.startBroadcast(pk);
        } else {
            address s = vm.envOr("SENDER", address(0));
            require(s != address(0), "set PRIVATE_KEY or SENDER");
            vm.startBroadcast(s);
        }
        MultiPolicyHook hook = new MultiPolicyHook{salt: salt}(IPoolManager(pm), admin, IStateViewMinimal(sv));
        require(address(hook) == minedAddr, "hook address mismatch");
        hook.setKeeper(keeper);
        vm.stopBroadcast();
    }
}
