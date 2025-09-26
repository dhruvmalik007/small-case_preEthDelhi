// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

interface IStrategyAdapter {
    /// @notice Deposits `assets` of the adapter's underlying into the target strategy/vault
    /// @param assets amount of underlying to deposit
    /// @param data adapter-specific encoding (optional)
    /// @return shares number of strategy shares received
    function deposit(uint256 assets, bytes calldata data) external returns (uint256 shares);

    /// @notice Withdraws `shares` from strategy and returns underlying to caller
    /// @param shares amount of strategy shares to redeem
    /// @param data adapter-specific encoding (optional)
    /// @return assetsOut amount of underlying returned
    function withdraw(uint256 shares, bytes calldata data) external returns (uint256 assetsOut);

    /// @return nav net asset value in underlying units (best-effort)
    function getNAV() external view returns (uint256 nav);

    /// @return underlying token address used by this adapter
    function underlying() external view returns (address);
}
