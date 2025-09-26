// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract MockRIARegistry {
    mapping(address => bool) public certified;

    function setCertified(address user, bool isCertifiedBool) external {
        certified[user] = isCertifiedBool;
    }

    function isCertified(address user) external view returns (bool) {
        return certified[user];
    }
}
