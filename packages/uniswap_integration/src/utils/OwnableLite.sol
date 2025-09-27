// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title OwnableLite
/// @notice Minimal ownable with onlyOwner modifier.
contract OwnableLite {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "Ownable: not owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Ownable: zero owner");
        owner = _owner;
        emit OwnershipTransferred(address(0), _owner);
    }

    function transferOwnership(address newOwner) public onlyOwner {
        require(newOwner != address(0), "Ownable: zero newOwner");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }
}
