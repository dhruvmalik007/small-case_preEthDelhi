// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ChildVaultBase
/// @notice Minimal ERC-4626 vault used as a placeholder per strategy slice
/// @dev Strategy integrations are handled by adapters or upgraded vaults later
contract ChildVaultBase is ERC4626, Ownable {
    constructor(address asset_, string memory name_, string memory symbol_, address owner_)
        ERC20(name_, symbol_)
        ERC4626(ERC20(asset_))
        Ownable(owner_)
    {}
}
