// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

/// @notice Minimal interface for DeFi Saver StrategyExecutor.executeStrategy
interface IDefiSaverStrategyExecutor {
    struct StrategySub {
        uint64 strategyOrBundleId;
        bool isBundle;
        bytes[] triggerData;
        bytes32[] subData;
    }
    function executeStrategy(
        uint256 _subId,
        uint256 _strategyIndex,
        bytes[] calldata _triggerCallData,
        bytes[] calldata _actionsCallData,
        StrategySub calldata _sub
    ) external;
}
