// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Script} from "forge-std/Script.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";

import {MultiPolicyHook} from "../src/hooks/MultiPolicyHook.sol";

/// @notice Configure range/vol/fees policy params for a given pool key in MultiPolicyHook
/// ENV:
/// - PRIVATE_KEY: broadcaster private key (required for broadcast)
/// - HOOK: address of deployed MultiPolicyHook (required)
/// - TOKEN0: address for token0 (required)
/// - TOKEN1: address for token1 (required)
/// - FEE: uint24 fee in ppm (default 3000)
/// - TICK_SPACING: int24 tick spacing (default 60)
/// Range params (defaults reasonable for demo):
/// - TICK_LOWER: int24 (default -60000)
/// - TICK_UPPER: int24 (default  60000)
/// - TWAP_LOOKBACK: uint32 seconds (default 120)
/// - TWAP_THRESHOLD_BPS: uint16 bps (default 100)
/// - REBALANCE_COOLDOWN: uint32 seconds (default 300)
/// Vol params:
/// - LAMBDA_BPS: uint16 decay (default 9950)
/// - MIN_SWAP_NOTIONAL_BPS: uint24 (default 0)
/// - MIN_WIDTH: int24 (default 120)
/// - MAX_WIDTH: int24 (default 600)
/// - TARGET_WIDTH: int24 (default 240)
/// - SHARPE_LOW_E2: int16 (default 50)
/// - SHARPE_HIGH_E2: int16 (default 150)
/// Fee params:
/// - COMPOUND_COOLDOWN: uint32 seconds (default 3600)
/// - MIN_FEES: uint128 units (default 0)
contract ConfigureHook is Script {
    function run() external {
        uint256 pk = vm.envOr("PRIVATE_KEY", uint256(0));
        address hookAddr = vm.envAddress("HOOK");
        address token0 = vm.envAddress("TOKEN0");
        address token1 = vm.envAddress("TOKEN1");
        require(hookAddr != address(0), "hook=0");
        require(token0 != address(0) && token1 != address(0), "tokens=0");

        uint256 feeTmp = vm.envOr("FEE", uint256(3000));
        uint256 tsTmp = vm.envOr("TICK_SPACING", uint256(60));

        int256 tickLowerI = vm.envOr("TICK_LOWER", int256(-60000));
        int256 tickUpperI = vm.envOr("TICK_UPPER", int256(60000));
        uint256 twapLookback = vm.envOr("TWAP_LOOKBACK", uint256(120));
        uint256 twapThreshold = vm.envOr("TWAP_THRESHOLD_BPS", uint256(100));
        uint256 cooldown = vm.envOr("REBALANCE_COOLDOWN", uint256(300));

        uint256 lambdaBps = vm.envOr("LAMBDA_BPS", uint256(9950));
        uint256 minSwapNotionalBps = vm.envOr("MIN_SWAP_NOTIONAL_BPS", uint256(0));
        int256 minWidthI = vm.envOr("MIN_WIDTH", int256(120));
        int256 maxWidthI = vm.envOr("MAX_WIDTH", int256(600));
        int256 targetWidthI = vm.envOr("TARGET_WIDTH", int256(240));
        int256 sharpeLowI = vm.envOr("SHARPE_LOW_E2", int256(50));
        int256 sharpeHighI = vm.envOr("SHARPE_HIGH_E2", int256(150));

        uint256 compCooldown = vm.envOr("COMPOUND_COOLDOWN", uint256(3600));
        uint256 minFees = vm.envOr("MIN_FEES", uint256(0));

        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: uint24(feeTmp),
            tickSpacing: int24(int256(tsTmp)),
            hooks: IHooks(hookAddr)
        });

        MultiPolicyHook.RangeParams memory range = MultiPolicyHook.RangeParams({
            tickLower: int24(tickLowerI),
            tickUpper: int24(tickUpperI),
            twapLookback: uint32(twapLookback),
            twapThresholdBps: uint16(twapThreshold),
            rebalanceCooldown: uint32(cooldown),
            lastRebalanceTs: 0,
            enabled: true
        });

        MultiPolicyHook.VolatilityParams memory vol = MultiPolicyHook.VolatilityParams({
            lambdaBps: uint16(lambdaBps),
            ewMean: 0,
            ewVar: 0,
            lastUpdateTs: 0,
            minSwapNotionalBps: uint24(minSwapNotionalBps),
            minWidth: int24(minWidthI),
            maxWidth: int24(maxWidthI),
            targetWidth: int24(targetWidthI),
            sharpeLow: int16(sharpeLowI),
            sharpeHigh: int16(sharpeHighI),
            enabled: true
        });

        MultiPolicyHook.FeeParams memory fees = MultiPolicyHook.FeeParams({
            lastCompoundTs: 0,
            compoundCooldown: uint32(compCooldown),
            minFeesToCompound: uint128(minFees),
            enabled: true
        });

        if (pk != 0) vm.startBroadcast(pk); else vm.startBroadcast();
        MultiPolicyHook(hookAddr).configurePool(key, range, vol, fees);
        vm.stopBroadcast();
    }
}
