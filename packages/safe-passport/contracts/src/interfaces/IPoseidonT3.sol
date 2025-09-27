// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title IPoseidonT3
 * @notice Interface for Poseidon hash function with 2 inputs
 * @dev This interface is required by SelfVerificationRoot
 */
interface IPoseidonT3 {
    /**
     * @notice Hash function for 2 inputs
     * @param input Array of 2 uint256 inputs
     * @return Hash result
     */
    function hash(uint256[2] memory input) external pure returns (uint256);
}
