// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title IStrategyMetrics
/// @notice Minimal view interface for strategy/vault metrics consumed by registries and frontends
interface IStrategyMetrics {
    /// @notice Returns Net Asset Value (USD scaled to 1e18)
    function nav() external view returns (uint256 navUsd1e18);

    /// @notice Returns price per share (1e18 = 1.0)
    function pricePerShare() external view returns (uint256 pps1e18);

    /// @notice Returns PnL in basis points (relative to seed or inception)
    function pnlBps() external view returns (int256 pnlBps_);

    /// @notice Convenience view to get all core metrics in one call
    function getStrategyMetrics()
        external
        view
        returns (
            uint256 navUsd1e18,
            uint256 pps1e18,
            int256 pnlBps_
        );
}
