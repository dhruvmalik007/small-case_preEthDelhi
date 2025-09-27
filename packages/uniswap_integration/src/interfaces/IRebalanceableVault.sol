// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title IRebalanceableVault
/// @notice Minimal manager interface for vaults controlled by a registry/keeper
interface IRebalanceableVault {
    function setManager(address m) external;
    function rebalance() external;
    function compoundFees() external;
    function setParams(bytes calldata data) external;
}
