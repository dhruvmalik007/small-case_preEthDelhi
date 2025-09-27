// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

/// @title IStateViewMinimal
/// @notice Minimal interface for Uniswap v4 periphery StateView to read pool price/tick
interface IStateViewMinimal {
    function getSlot0(PoolKey calldata key) external view returns (uint160 sqrtPriceX96, int24 tick);
}
