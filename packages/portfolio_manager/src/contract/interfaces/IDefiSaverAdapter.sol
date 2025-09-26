// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {IDefiSaverStrategyExecutor} from "./IDefiSaverExecutor.sol";

interface IDefiSaverAdapter {
    function executeDefiSaverStrategy(
        uint256 subId,
        uint256 strategyIndex,
        bytes[] calldata triggerCallData,
        bytes[] calldata actionsCallData,
        IDefiSaverStrategyExecutor.StrategySub calldata sub
    ) external;
}
