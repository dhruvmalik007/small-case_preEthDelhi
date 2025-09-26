// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title PortfolioAggregator
/// @notice ERC-4626 portfolio index vault that routes capital into child ERC-4626 vaults
/// @dev Skeleton for compile-time; real strategy logic handled by router/adapters
contract PortfolioAggregator is ERC4626, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    /// @dev manager address allowed to call allocate/redeem from child vaults (can be a Router)
    address public manager;

    /// @dev tracking child vault balances (underlying asset accounted)
    mapping(address => uint256) public childDeposits;

    /// @dev optional target allocations in basis points (sum <= 10000)
    mapping(address => uint16) public targetBps;

    event ManagerUpdated(address indexed manager);
    event TargetUpdated(address indexed child, uint16 bps);
    event Allocated(address indexed child, uint256 assets);
    event RedeemedFromChild(address indexed child, uint256 assets);

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner(), "PM: not manager");
        _;
    }

    constructor(IERC20 asset_, string memory name_, string memory symbol_, address owner_)
        ERC20(name_, symbol_)
        ERC4626(asset_)
        Ownable(owner_)
    {}

    /// @notice set external manager (e.g., RouterDiamond)
    function setManager(address m) external onlyOwner {
        manager = m;
        emit ManagerUpdated(m);
    }

    /// @notice set target bps for a child vault
    function setTargetBps(address childVault, uint16 bps) external onlyOwner {
        require(childVault != address(0), "zero child");
        require(bps <= 10_000, "bps>100%");
        targetBps[childVault] = bps;
        emit TargetUpdated(childVault, bps);
    }

    /// @notice allocate underlying assets from the Aggregator into a child ERC-4626 vault
    function allocateToChild(address childVault, uint256 assets) external onlyManager nonReentrant {
        require(assets > 0, "zero assets");
        IERC20(asset()).safeApprove(childVault, 0);
        IERC20(asset()).safeApprove(childVault, assets);
        uint256 shares = ERC4626(childVault).deposit(assets, address(this));
        (shares); // silence warning; child shares retained by aggregator
        childDeposits[childVault] += assets;
        emit Allocated(childVault, assets);
    }

    /// @notice pull underlying assets back from a child ERC-4626 vault
    function redeemFromChild(address childVault, uint256 assets) external onlyManager nonReentrant {
        require(assets > 0, "zero assets");
        // Withdraw exact assets back to this contract
        uint256 sharesBurned = ERC4626(childVault).withdraw(assets, address(this), address(this));
        (sharesBurned);
        if (childDeposits[childVault] >= assets) {
            childDeposits[childVault] -= assets;
        } else {
            childDeposits[childVault] = 0;
        }
        emit RedeemedFromChild(childVault, assets);
    }
}
