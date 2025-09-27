// SPDX-License-Identifier: MIT
pragma solidity >=0.8.29 <0.9.0;

import {BaseScript} from "./Base.s.sol";
import {DefiSaverAdapter} from "../src/contract/adapter/DefiSaverAdapter.sol";

contract DeployDFSAdapter is BaseScript {
    struct Params {
        address owner;
        address underlying;         // optional underlying held by adapter (e.g., USDC); can be zero address
        address routerManager;       // Router (or PM) that will be set as manager on adapter
        address strategyExecutor;    // DeFi Saver StrategyExecutor address for target chain
    }

    function _params() internal view returns (Params memory p) {
        p.owner = vm.envOr({ name: "OWNER", defaultValue: broadcaster });
        p.underlying = vm.envOr({ name: "DFS_UNDERLYING", defaultValue: address(0) });
        p.routerManager = vm.envAddress("ROUTER");
        p.strategyExecutor = vm.envAddress("DFS_EXECUTOR");
    }

    function run() public broadcast returns (DefiSaverAdapter adapter) {
        Params memory p = _params();

        adapter = new DefiSaverAdapter(p.underlying, p.owner);
        adapter.setManager(p.routerManager);
        adapter.setStrategyExecutor(p.strategyExecutor);
    }
}
