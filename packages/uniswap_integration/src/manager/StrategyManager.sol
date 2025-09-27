// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {OwnableLite} from "../utils/OwnableLite.sol";
import {IRebalanceableVault} from "../interfaces/IRebalanceableVault.sol";

/// @title StrategyManager (minimal)
/// @notice Optional manager/router to batch calls to strategy vaults
contract StrategyManager is OwnableLite {
    address public registry; // optional pointer
    address public keeper;

    event KeeperUpdated(address indexed keeper);
    event RegistryUpdated(address indexed registry);

    modifier onlyKeeperOrOwner() {
        require(msg.sender == keeper || msg.sender == owner, "SM:not auth");
        _;
    }

    constructor(address _owner) OwnableLite(_owner) {}

    function setKeeper(address k) external onlyOwner {
        keeper = k;
        emit KeeperUpdated(k);
    }

    function setRegistry(address r) external onlyOwner {
        registry = r;
        emit RegistryUpdated(r);
    }

    function rebalance(address vault) external onlyKeeperOrOwner {
        IRebalanceableVault(vault).rebalance();
    }

    function compound(address vault) external onlyKeeperOrOwner {
        IRebalanceableVault(vault).compoundFees();
    }

    function setParams(address vault, bytes calldata data) external onlyKeeperOrOwner {
        IRebalanceableVault(vault).setParams(data);
    }
}
