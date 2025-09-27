// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {ChainConfig} from "../src/libraries/ChainConfig.sol";

/// @notice Create a new Uniswap v4 pool initialized with MultiPolicyHook
/// ENV:
/// - PRIVATE_KEY: broadcaster private key (required for broadcast)
/// - TOKEN0: address for token0 (required)
/// - TOKEN1: address for token1 (required)
/// - HOOK: address of deployed MultiPolicyHook (required)
/// - FEE: uint24 fee in ppm (default 3000)
/// - TICK_SPACING: int24 tick spacing (default 60)
/// - SQRT_PRICE_X96: uint256 optional initial sqrt price; defaults to Q96 (1:1)
/// - POOL_MANAGER: override address; defaults from ChainConfig
contract CreateHookedPool is Script, StdCheats {
    using CurrencyLibrary for Currency;

    function run() external {
        ChainConfig.V4Addresses memory a = ChainConfig.get(block.chainid);
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0));
        // Optionally fund broadcaster and credit USDC on local fork
        address sender = pk != 0 ? vm.addr(pk) : msg.sender;
        bool fund = vm.envOr("FUND_BROADCASTER", true);
        if (fund) vm.deal(sender, 10 ether);
        address usdc = vm.envOr("USDC", address(0));
        uint256 usdcAmt = vm.envOr("USDC_DEAL", uint256(0));
        if (usdc != address(0) && usdcAmt > 0) {
            deal(usdc, sender, usdcAmt, true);
        }
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        address hookAddr = vm.envAddress("HOOK");
        require(token0 != address(0) && token1 != address(0), "tokens=0");
        require(hookAddr != address(0), "hook=0");

        uint256 feeTmp = vm.envOr("FEE", uint256(3000));
        uint256 tsTmp = vm.envOr("TICK_SPACING", uint256(60));
        uint256 sqrtEnv = vm.envOr("SQRT_PRICE_X96", uint256(0));
        uint160 sqrtPriceX96 = sqrtEnv != 0 ? uint160(sqrtEnv) : uint160(79228162514264337593543950336); // 2^96

        address pmAddr = vm.envOr("POOL_MANAGER", a.poolManager);
        IPoolManager poolManager = IPoolManager(pmAddr);

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: uint24(feeTmp),
            tickSpacing: int24(int256(tsTmp)),
            hooks: IHooks(hookAddr)
        });

        if (pk != 0) vm.startBroadcast(pk); else vm.startBroadcast();
        poolManager.initialize(key, sqrtPriceX96);
        vm.stopBroadcast();
    }
}
