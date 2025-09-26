// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IPortfolioAggregator} from "../interfaces/IPortfolioAggregator.sol";

/// @title Router (MVP)
/// @notice Lightweight manager that orchestrates allocations between child ERC-4626 vaults via the Aggregator
/// @dev Diamond facets can be introduced later; this MVP focuses on safe orchestration primitives
contract Router is Ownable {
    struct Guardrails {
        uint16 maxSlippageBps;    // not enforced in MVP (DEX agg stub)
        uint16 maxTurnoverBps;    // per-day cap (not enforced in MVP)
        uint32 minIntervalSec;    // min time between rebalances
        uint32 maxPriceStaleness; // seconds (oracle stub)
        uint256 txPositionCap;    // per-tx size cap
    }

    IPortfolioAggregator public aggregator;

    // optional addressing for convenience
    address public vault1; // Pendle
    address public vault2; // Lido
    address public vault3; // Euler
    address public vault4; // Hyperliquidity
    address public vaultR; // Reserve

    Guardrails public limits;
    uint256 public lastRebalanceTs;

    event AggregatorSet(address indexed agg);
    event VaultsSet(address v1, address v2, address v3, address v4, address vR);
    event GuardrailsSet(Guardrails limits);
    event Rebalanced(address indexed fromVault, address indexed toVault, uint256 assets);

    constructor(address owner_) Ownable(owner_) {}

    function setAggregator(address agg) external onlyOwner {
        aggregator = IPortfolioAggregator(agg);
        emit AggregatorSet(agg);
    }

    function setVaults(address v1, address v2, address v3, address v4, address vR) external onlyOwner {
        vault1 = v1; vault2 = v2; vault3 = v3; vault4 = v4; vaultR = vR;
        emit VaultsSet(v1, v2, v3, v4, vR);
    }

    function setGuardrails(Guardrails calldata g) external onlyOwner {
        limits = g;
        emit GuardrailsSet(g);
    }

    /// @notice Rebalance a portion: withdraw from fromVault, allocate to toVault (same underlying)
    function rebalancePortion(address fromVault, address toVault, uint256 assets) external onlyOwner {
        require(block.timestamp >= lastRebalanceTs + limits.minIntervalSec, "interval");
        require(assets <= limits.txPositionCap, "cap");
        aggregator.redeemFromChild(fromVault, assets);
        aggregator.allocateToChild(toVault, assets);
        lastRebalanceTs = block.timestamp;
        emit Rebalanced(fromVault, toVault, assets);
    }

    /// @notice Helper matching your scenario: move all from Vault4 to Vault3
    function deriskVault4ToVault3(uint256 assets) external onlyOwner {
        rebalancePortion(vault4, vault3, assets);
    }

    /// @notice Helper matching your scenario: move from Vault1 (Pendle) into Vault4 (Hyperliquidity)
    function topupVault4FromVault1(uint256 assets) external onlyOwner {
        rebalancePortion(vault1, vault4, assets);
    }
}
