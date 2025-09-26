// SPDX-License-Identifier: MIT
pragma solidity >=0.8.29 <0.9.0;

import {BaseScript} from "./Base.s.sol";
import {PortfolioAggregator} from "../src/contract/aggregator/PortfolioAggregator.sol";
import {ChildVaultBase} from "../src/contract/vaults/ChildVaultBase.sol";
import {Router} from "../src/contract/router/Router.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DeployPortfolio is BaseScript {
    struct Addresses {
        address owner;
        address asset; // base asset for Aggregator and child vaults (MVP assumes same underlying)
    }

    function _getAddrs() internal view returns (Addresses memory a) {
        a.owner = vm.envOr({ name: "OWNER", defaultValue: broadcaster });
        a.asset = vm.envAddress("ASSET");
    }

    function run()
        public
        broadcast
        returns (
            PortfolioAggregator aggregator,
            ChildVaultBase v1,
            ChildVaultBase v2,
            ChildVaultBase v3,
            ChildVaultBase v4,
            ChildVaultBase vR,
            Router router
        )
    {
        Addresses memory a = _getAddrs();

        // Deploy Aggregator (ERC-4626 portfolio index)
        // NOTE: Assumes ASSET is an ERC20 compatible with ERC-4626 vaults (e.g., USDC or WETH)
        aggregator = new PortfolioAggregator(IERC20(a.asset), "Portfolio X Index", "pX", a.owner);

        // Deploy child vaults (placeholder ERC-4626s using the same underlying as MVP)
        v1 = new ChildVaultBase(a.asset, "Vault1 Pendle sUSDCe", "v1PENDLE", a.owner);
        v2 = new ChildVaultBase(a.asset, "Vault2 Lido Earn", "v2LIDO", a.owner);
        v3 = new ChildVaultBase(a.asset, "Vault3 Euler RLUSD", "v3EULER", a.owner);
        v4 = new ChildVaultBase(a.asset, "Vault4 Hyperliquidity", "v4HYPER", a.owner);
        vR = new ChildVaultBase(a.asset, "VaultR Reserve", "vRRESERVE", a.owner);

        // Deploy Router and wire
        router = new Router(a.owner);
        router.setAggregator(address(aggregator));
        router.setVaults(address(v1), address(v2), address(v3), address(v4), address(vR));

        // Make router the manager of the aggregator
        aggregator.setManager(address(router));

        // Set basic guardrails (example values; adjust per env)
        Router.Guardrails memory g = Router.Guardrails({
            maxSlippageBps: 50,
            maxTurnoverBps: 200,
            minIntervalSec: 24 hours,
            maxPriceStaleness: 10 minutes,
            txPositionCap: 1_000_000e6 // example cap assuming 6 decimals (USDC); adjust after
        });
        router.setGuardrails(g);
    }
}
