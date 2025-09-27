// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title StrategyEvents
/// @notice Shared events for strategy metrics and composite index reporting
library StrategyEvents {
    /// @dev Emitted by a strategy/vault when a NAV checkpoint is taken
    /// @param strategyId arbitrary identifier chosen by the registry or vault
    /// @param navUsd1e18 strategy NAV in USD scaled to 1e18
    /// @param pricePerShare1e18 current PPS (1e18 = 1.0)
    /// @param pnlBps PnL in basis points (relative to seed or inception)
    /// @param timestamp block timestamp
    event NAVSnapshot(
        bytes32 indexed strategyId,
        uint256 navUsd1e18,
        uint256 pricePerShare1e18,
        int256 pnlBps,
        uint256 timestamp
    );

    /// @dev Emitted by the registry/manager for the composite index
    event CompositeNAVSnapshot(
        bytes32 indexed indexId,
        uint256 navUsd1e18,
        uint256 pricePerShare1e18,
        int256 pnlBps,
        uint256 timestamp
    );
}
