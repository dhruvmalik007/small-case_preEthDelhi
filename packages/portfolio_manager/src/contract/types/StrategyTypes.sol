// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

library StrategyTypes {
    enum StepType { Swap, Stake, Unstake, Lend, Withdraw, Borrow, Repay, Deposit, Custom }

    struct Guardrails {
        uint16 maxSlippageBps;    // e.g., 50 = 0.50%
        uint16 maxTurnoverBps;    // per-day budget
        uint32 minIntervalSec;    // min time between rebalances
        uint32 maxPriceStaleness; // seconds
        uint256 txPositionCap;    // max amount per tx
    }

    struct Step {
        StepType step;
        address adapter;          // target adapter or router
        address tokenIn;          // optional
        address tokenOut;         // optional
        uint256 amount;           // exact or 0 = use previous step output
        bytes data;               // adapter-specific params
    }

    struct Plan {
        address portfolio;        // entrypoint (aggregator)
        Step[] steps;
        Guardrails limits;
        uint256 nonce;
        uint256 deadline;
    }
}
