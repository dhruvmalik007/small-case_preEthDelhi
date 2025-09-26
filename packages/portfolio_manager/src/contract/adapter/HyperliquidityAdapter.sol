// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";

/// @notice Placeholder adapter for Hyperliquidity vaults (stub/proxy for same-chain)
contract HyperliquidityAdapter is IStrategyAdapter, Ownable {
    using SafeERC20 for IERC20;

    address public immutable UNDERLYING;
    address public manager;

    event ManagerUpdated(address indexed mgr);

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner(), "HLA: not mgr");
        _;
    }

    constructor(address underlying_, address owner_) Ownable(owner_) {
        UNDERLYING = underlying_;
    }

    function setManager(address m) external onlyOwner {
        manager = m;
        emit ManagerUpdated(m);
    }

    function deposit(uint256 assets, bytes calldata /*data*/ ) external override onlyManager returns (uint256 shares) {
        require(assets > 0, "zero");
        IERC20(UNDERLYING).safeTransferFrom(msg.sender, address(this), assets);
        return assets;
    }

    function withdraw(uint256 shares, bytes calldata /*data*/ ) external override onlyManager returns (uint256 assetsOut) {
        require(shares > 0, "zero");
        IERC20(UNDERLYING).safeTransfer(msg.sender, shares);
        return shares;
    }

    function getNAV() external view override returns (uint256 nav) {
        return IERC20(UNDERLYING).balanceOf(address(this));
    }

    function underlying() external view override returns (address) { return UNDERLYING; }
}
