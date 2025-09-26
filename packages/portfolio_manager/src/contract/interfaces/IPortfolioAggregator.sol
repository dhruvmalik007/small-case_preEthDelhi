// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

interface IPortfolioAggregator /* is IERC4626 */ {
    function asset() external view returns (address);
    function setManager(address m) external;
    function allocateToChild(address childVault, uint256 assets) external;
    function redeemFromChild(address childVault, uint256 assets) external;
}
