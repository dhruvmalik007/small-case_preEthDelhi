// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IStrategyAdapter} from "../interfaces/IStrategyAdapter.sol";
import {IDefiSaverStrategyExecutor} from "../interfaces/IDefiSaverExecutor.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title DefiSaverAdapter
/// @notice Generic adapter that forwards encoded strategies/recipes to DeFi Saver StrategyExecutor
/// @dev NOTE: Calling StrategyExecutor.executeStrategy requires caller to be an approved bot in BotAuth
///      and execution occurs via user's smart wallet (DSProxy or Safe Module). This adapter is an MVP
///      shell to integrate with DFS infra once auth is configured off-chain.
contract DefiSaverAdapter is IStrategyAdapter, Ownable {
    using SafeERC20 for IERC20;

    /// @notice Optional underlying used for reserve-style holding; not required for DFS execution
    address public immutable UNDERLYING;

    /// @notice Manager (Router/Aggregator) that can call execution functions
    address public manager;

    /// @notice DFS StrategyExecutor address (chain-specific)
    address public strategyExecutor;

    event ManagerUpdated(address indexed manager);
    event StrategyExecutorUpdated(address indexed executor);
    event StrategyForwarded(uint256 indexed subId, uint256 indexed strategyIndex);

    modifier onlyManager() {
        require(msg.sender == manager || msg.sender == owner(), "DFS: not mgr");
        _;
    }

    constructor(address underlying_, address owner_) Ownable(owner_) {
        UNDERLYING = underlying_;
    }

    function setManager(address m) external onlyOwner {
        manager = m;
        emit ManagerUpdated(m);
    }

    function setStrategyExecutor(address exec) external onlyOwner {
        strategyExecutor = exec;
        emit StrategyExecutorUpdated(exec);
    }

    // -------------------------------------------------------------
    // IStrategyAdapter (placeholder 1:1 semantics for deposits/withdraws)
    // -------------------------------------------------------------

    function deposit(uint256 assets, bytes calldata) external override onlyManager returns (uint256 shares) {
        if (UNDERLYING != address(0) && assets > 0) {
            IERC20(UNDERLYING).safeTransferFrom(msg.sender, address(this), assets);
        }
        return assets; // 1:1 placeholder
    }

    function withdraw(uint256 shares, bytes calldata) external override onlyManager returns (uint256 assetsOut) {
        if (UNDERLYING != address(0) && shares > 0) {
            IERC20(UNDERLYING).safeTransfer(msg.sender, shares);
        }
        return shares; // 1:1 placeholder
    }

    function getNAV() external view override returns (uint256 nav) {
        if (UNDERLYING == address(0)) return 0;
        return IERC20(UNDERLYING).balanceOf(address(this));
    }

    function underlying() external view override returns (address) { return UNDERLYING; }

    // -------------------------------------------------------------
    // DFS Strategy forwarding (requires auth setup in DFS infra)
    // -------------------------------------------------------------

    function executeDefiSaverStrategy(
        uint256 subId,
        uint256 strategyIndex,
        bytes[] calldata triggerCallData,
        bytes[] calldata actionsCallData,
        IDefiSaverStrategyExecutor.StrategySub calldata sub
    ) external onlyManager {
        require(strategyExecutor != address(0), "DFS: exec not set");
        IDefiSaverStrategyExecutor(strategyExecutor).executeStrategy(
            subId,
            strategyIndex,
            triggerCallData,
            actionsCallData,
            sub
        );
        emit StrategyForwarded(subId, strategyIndex);
    }
}
