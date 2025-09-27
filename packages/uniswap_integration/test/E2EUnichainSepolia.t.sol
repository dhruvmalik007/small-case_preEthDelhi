// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Test} from "forge-std/Test.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";

import {ChainConfig} from "../src/libraries/ChainConfig.sol";
import {IStateViewMinimal} from "../src/interfaces/IStateViewMinimal.sol";
import {MultiPolicyHook} from "../src/hooks/MultiPolicyHook.sol";
import {UniswapLPVault} from "../src/strategy/UniswapLPVault.sol";
import {PoolMetricsAdapter} from "../src/adapters/PoolMetricsAdapter.sol";
import {UniswapStrategyRegistry} from "../src/registry/UniswapStrategyRegistry.sol";
import {Vm} from "forge-std/Vm.sol";
import {console2 as console} from "forge-std/console2.sol";

contract E2EUnichainSepoliaTest is Test {
    using CurrencyLibrary for Currency;

    // Fork
    uint256 forkId;

    // Chain config
    ChainConfig.V4Addresses a;

    // Accounts
    address admin;
    address keeper;

    // Real tokens on Unichain Sepolia (can be overridden via env)
    address TOKEN_WETH;
    address TOKEN_USDC;

    // In forge tests, HookMiner.find must use the actual deployer for CREATE2 which is address(this)

    function setUp() public {
        string memory rpc = vm.envString("RPC_URL_UNICHAIN_SEPOLIA");
        forkId = vm.createFork(rpc);
        vm.selectFork(forkId);

        a = ChainConfig.get(ChainConfig.CHAINID_UNICHAIN_SEPOLIA);
        admin = address(0xA11CE);
        keeper = address(0xBEEF);

        // Canonical tokens (can be overridden by env)
        // WETH9: 0x4200000000000000000000000000000000000006
        // USDC : 0x31d0220469e10c4e71834a79b1f276d740d3768f
        address defaultWETH = 0x4200000000000000000000000000000000000006;
        address defaultUSDC = 0x31d0220469e10c4E71834a79b1f276d740d3768F;
        // Allow overrides
        TOKEN_WETH = vm.envOr("TOKEN_WETH", defaultWETH);
        TOKEN_USDC = vm.envOr("TOKEN_USDC", defaultUSDC);

        console.log("[setUp] Fork created");
        console.log("  PoolManager:"); console.logAddress(a.poolManager);
        console.log("  StateView  :"); console.logAddress(a.stateView);
        console.log("  PositionMgr:"); console.logAddress(a.positionManager);
        console.log("  Quoter     :"); console.logAddress(a.quoter);
        console.log("  WETH       :"); console.logAddress(TOKEN_WETH);
        console.log("  USDC       :"); console.logAddress(TOKEN_USDC);
        console.log("  timestamp  :"); console.logUint(block.timestamp);
    }

/// Metrics-only test: no vault, adapter reads pool via StateView and registry snapshots from metrics
contract MetricsOnlyRegistryTest is Test {
    using CurrencyLibrary for Currency;

    ChainConfig.V4Addresses a;
    address admin;
    address TOKEN_WETH;
    address TOKEN_USDC;

    function _sort(address aAddr, address bAddr) internal pure returns (address, address) {
        return aAddr < bAddr ? (aAddr, bAddr) : (bAddr, aAddr);
    }

    function setUp() public {
        string memory rpc = vm.envString("RPC_URL_UNICHAIN_SEPOLIA");
        vm.createSelectFork(rpc);
        a = ChainConfig.get(ChainConfig.CHAINID_UNICHAIN_SEPOLIA);
        admin = address(0xA11CE);
        TOKEN_WETH = vm.envOr("TOKEN_WETH", address(0x4200000000000000000000000000000000000006));
        TOKEN_USDC = vm.envOr("TOKEN_USDC", address(0x31d0220469e10c4E71834a79b1f276d740d3768F));
    }

    function test_metrics_only_index_snapshot() public {
        // Build a poolKey with no hook to simulate pre-existing pool; initialize at 1:1 price
        (address token0, address token1) = _sort(TOKEN_WETH, TOKEN_USDC);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: uint24(3000),
            tickSpacing: int24(60),
            hooks: IHooks(address(0))
        });
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // 2^96
        IPoolManager(a.poolManager).initialize(key, sqrtPriceX96);

        // Metrics adapter seeded off current price
        bytes32 strategyId = keccak256(abi.encodePacked("METRICS-ONLY-STRATEGY"));
        PoolMetricsAdapter adapter = new PoolMetricsAdapter(strategyId, admin);
        vm.prank(admin);
        adapter.setPoolKey(token0, token1, uint24(3000), int24(60), address(0));
        vm.prank(admin);
        adapter.seedBaseline(100e18);

        // Register metrics-only strategy and snapshot an index
        UniswapStrategyRegistry reg = new UniswapStrategyRegistry(admin);
        vm.prank(admin);
        reg.registerMetricsStrategy(strategyId, address(adapter), address(0));
        bytes32 indexId = keccak256(abi.encodePacked("METRICS-ONLY-INDEX"));
        bytes32[] memory cons = new bytes32[](1); cons[0] = strategyId;
        vm.prank(admin); reg.registerIndex(indexId, cons);

        vm.recordLogs(); reg.snapshotIndex(indexId);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        bool foundComposite = false;
        bytes32 topic = keccak256("CompositeNAVSnapshot(bytes32,uint256,uint256,int256,uint256)");
        for (uint256 i = 0; i < logs.length; i++) { if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) { foundComposite = true; break; } }
        assertTrue(foundComposite, "CompositeNAVSnapshot not emitted (metrics-only)");
    }
}

    // --- Helpers: number to string and pretty single-line logs ---
    function _uToStr(uint256 v) internal pure returns (string memory s) {
        if (v == 0) return "0";
        uint256 temp = v; uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (v != 0) { digits -= 1; buf[digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(buf);
    }

    function _pad2(uint256 v) internal pure returns (string memory) {
        if (v < 10) return string(abi.encodePacked("0", _uToStr(v)));
        return _uToStr(v);
    }

    // Pretty print scaled 1e18 amounts as $ with 2 decimals on a SINGLE line
    function _logUSD2dp(string memory label, uint256 amt1e18) internal view {
        uint256 usd2 = amt1e18 / 1e16; // amount scaled to 2 decimals
        uint256 dollars = usd2 / 100;
        uint256 cents = usd2 % 100;
        string memory line = string(abi.encodePacked(label, ": $", _uToStr(dollars), ".", _pad2(cents)));
        console.log(line);
    }

    function _logPPS2dp(string memory label, uint256 pps1e18) internal view {
        _logUSD2dp(label, pps1e18);
    }

    function _logPnLPercent(string memory label, int256 pnlBps) internal view {
        bool neg = pnlBps < 0;
        uint256 abps = uint256(neg ? -pnlBps : pnlBps);
        uint256 pct2 = abps / 100; // two decimals
        uint256 whole = pct2 / 100;
        uint256 frac = pct2 % 100;
        string memory sign = neg ? "-" : "+";
        string memory line = string(abi.encodePacked(label, ": ", sign, _uToStr(whole), ".", _pad2(frac), "%"));
        console.log(line);
    }

/// Additional test to mirror the script-driven rebalance + snapshot flow

        function _sort(address aAddr, address bAddr) internal pure returns (address, address) {
            return aAddr < bAddr ? (aAddr, bAddr) : (bAddr, aAddr);
        }



function test_E2E_flow_flags_pool_vault_index() public {
        // 1) Mine salt for CREATE2 such that address encodes flags
        uint160 flags = uint160(
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        );
        console.log("[E2E] Required flags mask:"); console.logUint(flags);
        bytes memory constructorArgs = abi.encode(
            IPoolManager(a.poolManager),
            admin,
            IStateViewMinimal(a.stateView)
        );
        (address minedAddr, bytes32 salt) = HookMiner.find(
            address(this),
            flags,
            type(MultiPolicyHook).creationCode,
            constructorArgs
        );
        console.log("[E2E] Mined hook address:"); console.logAddress(minedAddr);
        console.log("[E2E] Mined salt:"); console.logBytes32(salt);

        // Deploy hook via CREATE2 and verify mined address + flags mask
        MultiPolicyHook hook = new MultiPolicyHook{salt: salt}(
            IPoolManager(a.poolManager),
            admin,
            IStateViewMinimal(a.stateView)
        );
        assertEq(address(hook), minedAddr, "hook addr!=mined");
        assertEq(uint160(address(hook)) & Hooks.ALL_HOOK_MASK, flags, "flags mismatch");
        console.log("[E2E] Deployed hook:"); console.logAddress(address(hook));
        console.log("[E2E] Address & mask:"); console.logUint(uint160(address(hook)) & Hooks.ALL_HOOK_MASK);

        // set keeper
        vm.prank(admin);
        hook.setKeeper(keeper);
        console.log("[E2E] Keeper set:"); console.logAddress(keeper);


        // 2) Initialize pool with hook using sorted tokens and Q96 price
        // In v4, there are no standalone pool contracts; the PoolKey identifies pool state inside PoolManager.
        // Ensure currency ordering: currency0 < currency1
        (address token0, address token1) = _sort(TOKEN_WETH, TOKEN_USDC);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: uint24(3000),
            tickSpacing: int24(60),
            hooks: IHooks(address(hook))
        });
        console.log("[E2E] PoolKey");
        console.log("  token0:"); console.logAddress(token0);
        console.log("  token1:"); console.logAddress(token1);
        console.log("  fee   :"); console.logUint(3000);
        console.log("  tick  :"); console.logInt(60);

        // sqrtPriceX96 default 1:1 (2^96)
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // 2^96
        console.log("[E2E] sqrtPriceX96:"); console.logUint(sqrtPriceX96);

        // initialize should succeed with mocks as long as they are deployed ERC20s;
        // no transfers occur during initialize
        IPoolManager(a.poolManager).initialize(key, sqrtPriceX96);
        console.log("[E2E] Pool initialized in PoolManager");

        // 3) Configure hook params and assert state is persisted
        MultiPolicyHook.RangeParams memory range = MultiPolicyHook.RangeParams({
            tickLower: -60000,
            tickUpper: 60000,
            twapLookback: 120,
            twapThresholdBps: 100,
            rebalanceCooldown: 300,
            lastRebalanceTs: 0,
            enabled: true
        });
        MultiPolicyHook.VolatilityParams memory vol = MultiPolicyHook.VolatilityParams({
            lambdaBps: 9950,
            ewMean: 0,
            ewVar: 0,
            lastUpdateTs: 0,
            minSwapNotionalBps: 0,
            minWidth: 120,
            maxWidth: 600,
            targetWidth: 240,
            sharpeLow: 50,
            sharpeHigh: 150,
            enabled: true
        });
        MultiPolicyHook.FeeParams memory fees = MultiPolicyHook.FeeParams({
            lastCompoundTs: 0,
            compoundCooldown: 3600,
            minFeesToCompound: 0,
            enabled: true
        });

        vm.prank(admin);
        hook.configurePool(key, range, vol, fees);
        console.log("[E2E] Hook configured (range/vol/fees)");

        // Time: advance beyond rebalanceCooldown to showcase time-dependent logic
        console.log("[E2E][time] before skip, ts:"); console.logUint(block.timestamp);
        skip(301);
        console.log("[E2E][time] after 301s skip, ts:"); console.logUint(block.timestamp);

        (
            bool paused,
            bool rebalanceNeeded,
            int24 targetWidth,
            uint160 lastPriceX96
        ) = hook.getSignals(key);
        assertEq(paused, false, "paused");
        assertEq(rebalanceNeeded, false, "rebalanceNeeded");
        assertEq(targetWidth, 240, "targetWidth");
        assertEq(lastPriceX96, 0, "lastPriceX96");
        console.log("[E2E] Signals");
        console.log("  paused:"); console.logBool(paused);
        console.log("  need  :"); console.logBool(rebalanceNeeded);
        console.log("  width :"); console.logInt(targetWidth);
        console.log("  priceX96:"); console.logUint(lastPriceX96);

        // 4) Vault seeding and checkpoint metrics
        bytes32 strategyId = keccak256(abi.encodePacked("DEMO-STRATEGY"));
        UniswapLPVault vault = new UniswapLPVault(strategyId, admin);
        // seed NAV=100e18, PPS=1e18
        vm.prank(admin);
        vault.seedInitialNAV(100e18, 1e18);
        console.log("[E2E] Vault seeded NAV=100e18, PPS=1e18");
        console.log("[E2E] seedTimestamp:"); console.logUint(vault.seedTimestamp());

        // check views
        {
            (uint256 navUsd, uint256 pps, int256 pnl) = vault.getStrategyMetrics();
            assertEq(navUsd, 100e18, "seed nav");
            assertEq(pps, 1e18, "seed pps");
            assertEq(pnl, 0, "seed pnl");
            console.log("[E2E] Metrics after seed");
            _logUSD2dp("  NAV $ (2dp)", navUsd);
            _logPPS2dp("  PPS $ (2dp)", pps);
            _logPnLPercent("  PnL % (2dp)", pnl);
        }

        // Set manager and configure pool params in the vault
        vm.prank(admin);
        vault.setManager(admin);
        vm.prank(admin);
        vault.setParams(abi.encode(token0, token1, uint24(3000), int24(60), address(hook), uint16(50)));
        assertEq(vault.poolToken0(), token0, "poolToken0");
        assertEq(vault.poolToken1(), token1, "poolToken1");
        assertEq(vault.poolFee(), 3000, "poolFee");
        assertEq(vault.poolTickSpacing(), 60, "poolTickSpacing");
        assertEq(vault.poolHook(), address(hook), "poolHook");
        assertEq(vault.slippageBps(), 50, "slippageBps");
        console.log("[E2E] Vault params set");

        // Time: advance 1 hour before checkpointing metrics
        console.log("[E2E][time] before warp, ts:"); console.logUint(block.timestamp);
        vm.warp(block.timestamp + 3600);
        console.log("[E2E][time] after +3600s warp, ts:"); console.logUint(block.timestamp);

        // manager checkpointByNav: 102e18 => pps 1.02e18, pnl +200 bps
        vm.prank(admin);
        vault.checkpointByNav(102e18);
        {
            (uint256 navUsd, uint256 pps, int256 pnl) = vault.getStrategyMetrics();
            assertEq(navUsd, 102e18, "nav");
            assertEq(pps, 1_020_000_000_000_000_000, "pps 1.02e18");
            assertEq(pnl, 200, "pnl +200bps");
            console.log("[E2E] Metrics after checkpointByNav(102e18)");
            _logUSD2dp("  NAV $ (2dp)", navUsd);
            _logPPS2dp("  PPS $ (2dp)", pps);
            _logPnLPercent("  PnL % (2dp)", pnl);
        }

        // 5) Registry register + index snapshot
        UniswapStrategyRegistry reg = new UniswapStrategyRegistry(admin);
        vm.prank(admin);
        reg.registerStrategy(strategyId, address(vault), address(hook));
        console.log("[E2E] Strategy registered in registry");

        bytes32 indexId = keccak256(abi.encodePacked("DEMO-INDEX"));
        bytes32[] memory constituents = new bytes32[](1);
        constituents[0] = strategyId;
        vm.prank(admin);
        reg.registerIndex(indexId, constituents);
        console.log("[E2E] Index registered"); console.logBytes32(indexId);

        // Portfolio Manager: execute and audit composite NAV snapshot for index
        console.log("[PM] snapshotIndex: Initiating composite NAV snapshot for index:"); console.logBytes32(indexId);
        vm.recordLogs();
        reg.snapshotIndex(indexId);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        console.log("[PM] snapshotIndex: total logs emitted:"); console.logUint(logs.length);
        bool foundComposite = false;
        bytes32 topic = keccak256(
            "CompositeNAVSnapshot(bytes32,uint256,uint256,int256,uint256)"
        );
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) {
                foundComposite = true;
                break;
            }
        }
        console.log("[PM] snapshotIndex: CompositeNAVSnapshot present:"); console.logBool(foundComposite);
        assertTrue(foundComposite, "CompositeNAVSnapshot not emitted");
    }
}

contract RebalanceWorkflowTest is Test {
    using CurrencyLibrary for Currency;

        function _sort(address aAddr, address bAddr) internal pure returns (address, address) {
            return aAddr < bAddr ? (aAddr, bAddr) : (bAddr, aAddr);
        }

    // --- Helpers (string formatting) ---
    function _uToStr(uint256 v) internal pure returns (string memory s) {
        if (v == 0) return "0";
        uint256 temp = v; uint256 digits;
        while (temp != 0) { digits++; temp /= 10; }
        bytes memory buf = new bytes(digits);
        while (v != 0) { digits -= 1; buf[digits] = bytes1(uint8(48 + v % 10)); v /= 10; }
        return string(buf);
    }
    function _pad2(uint256 v) internal pure returns (string memory) {
        if (v < 10) return string(abi.encodePacked("0", _uToStr(v)));
        return _uToStr(v);
    }
    function _logUSD2dp(string memory label, uint256 amt1e18) internal view {
        uint256 usd2 = amt1e18 / 1e16; uint256 dollars = usd2 / 100; uint256 cents = usd2 % 100;
        console.log(string(abi.encodePacked(label, ": $", _uToStr(dollars), ".", _pad2(cents))));
    }
    function _logPPS2dp(string memory label, uint256 pps1e18) internal view { _logUSD2dp(label, pps1e18); }
    function _logPnLPercent(string memory label, int256 pnlBps) internal view {
        bool neg = pnlBps < 0; uint256 abps = uint256(neg ? -pnlBps : pnlBps);
        uint256 pct2 = abps / 100; uint256 whole = pct2 / 100; uint256 frac = pct2 % 100;
        console.log(string(abi.encodePacked(label, ": ", (neg ? "-" : "+"), _uToStr(whole), ".", _pad2(frac), "%")));
    }

    ChainConfig.V4Addresses a;
    address admin;
    address keeper;
    address TOKEN_WETH;
    address TOKEN_USDC;

    function setUp() public {
        string memory rpc = vm.envString("RPC_URL_UNICHAIN_SEPOLIA");
        vm.createSelectFork(rpc);
        a = ChainConfig.get(ChainConfig.CHAINID_UNICHAIN_SEPOLIA);
        admin = address(0xA11CE);
        keeper = address(0xBEEF);
        TOKEN_WETH = vm.envOr("TOKEN_WETH", address(0x4200000000000000000000000000000000000006));
        TOKEN_USDC = vm.envOr("TOKEN_USDC", address(0x31d0220469e10c4E71834a79b1f276d740d3768F));
        console.log("[Rebalance] setup done");
    }

    function test_RebalanceFlow_scriptsParity() public {
        // 1) Deploy hook with correct flags (same as DeployMultiPolicyHook)
        uint160 flags = uint160(
            Hooks.AFTER_SWAP_FLAG |
            Hooks.BEFORE_ADD_LIQUIDITY_FLAG |
            Hooks.BEFORE_REMOVE_LIQUIDITY_FLAG
        );
        bytes memory args = abi.encode(IPoolManager(a.poolManager), admin, IStateViewMinimal(a.stateView));
        (address minedAddr, bytes32 salt) = HookMiner.find(address(this), flags, type(MultiPolicyHook).creationCode, args);
        MultiPolicyHook hook = new MultiPolicyHook{salt: salt}(IPoolManager(a.poolManager), admin, IStateViewMinimal(a.stateView));
        assertEq(address(hook), minedAddr);
        console.log("[Rebalance] hook:"); console.logAddress(address(hook));

        // 2) Create pool with hook (mirror CreateHookedPool)
        (address token0, address token1) = _sort(TOKEN_WETH, TOKEN_USDC);
        PoolKey memory key = PoolKey({
            currency0: Currency.wrap(token0),
            currency1: Currency.wrap(token1),
            fee: uint24(3000),
            tickSpacing: int24(60),
            hooks: IHooks(address(hook))
        });
        uint160 sqrtPriceX96 = 79228162514264337593543950336; // 2^96
        IPoolManager(a.poolManager).initialize(key, sqrtPriceX96);
        console.log("[Rebalance] pool initialized");

        // 3) Configure hook policies (mirror ConfigureHook)
        MultiPolicyHook.RangeParams memory range = MultiPolicyHook.RangeParams({
            tickLower: -60000,
            tickUpper: 60000,
            twapLookback: 120,
            twapThresholdBps: 100,
            rebalanceCooldown: 300,
            lastRebalanceTs: 0,
            enabled: true
        });
        MultiPolicyHook.VolatilityParams memory vol = MultiPolicyHook.VolatilityParams({
            lambdaBps: 9950,
            ewMean: 0,
            ewVar: 0,
            lastUpdateTs: 0,
            minSwapNotionalBps: 0,
            minWidth: 120,
            maxWidth: 600,
            targetWidth: 240,
            sharpeLow: 50,
            sharpeHigh: 150,
            enabled: true
        });
        MultiPolicyHook.FeeParams memory fees = MultiPolicyHook.FeeParams({ lastCompoundTs: 0, compoundCooldown: 3600, minFeesToCompound: 0, enabled: true });
        vm.prank(admin); hook.configurePool(key, range, vol, fees);
        console.log("[Rebalance] hook configured");

        // Time: advance beyond rebalanceCooldown to showcase time-dependent logic
        console.log("[Rebalance][time] before skip, ts:"); console.logUint(block.timestamp);
        skip(301);
        console.log("[Rebalance][time] after 301s skip, ts:"); console.logUint(block.timestamp);

        // 4) Deploy vault/registry and run a dummy rebalance + checkpoint (mirror SnapshotAfterCheckpoint)
        bytes32 strategyId = keccak256(abi.encodePacked("DEMO-STRATEGY"));
        UniswapLPVault vault = new UniswapLPVault(strategyId, admin);
        vm.prank(admin); 
        vault.seedInitialNAV(100e18, 1e18);
        vm.prank(admin);
        vault.setManager(admin);
        vm.prank(admin);vault.setParams(abi.encode(token0, token1, uint24(3000), int24(60), address(hook), uint16(75)));

        // rebalance() is a stub for now; ensure it is callable by manager
        vm.prank(admin);vault.rebalance();
        console.log("[Rebalance] vault.rebalance() called");

        // Time: advance 1 hour before checkpoint NAV as scripts do
        console.log("[Rebalance][time] before warp, ts:"); console.logUint(block.timestamp);
        vm.warp(block.timestamp + 3600);
        console.log("[Rebalance][time] after +3600s warp, ts:"); console.logUint(block.timestamp);

        // then checkpoint NAV as scripts do
        vm.prank(admin);vault.checkpointByNav(105e18);
        (uint256 navUsd, uint256 pps, int256 pnl) = vault.getStrategyMetrics();
        console.log("[Rebalance] after checkpointByNav(105e18)");
        _logUSD2dp("  NAV $ (2dp)", navUsd);
        _logPPS2dp("  PPS $ (2dp)", pps);
        _logPnLPercent("  PnL % (2dp)", pnl);
        assertEq(navUsd, 105e18);
        assertEq(pps, 1_050_000_000_000_000_000);
        assertEq(pnl, 500);

        UniswapStrategyRegistry reg = new UniswapStrategyRegistry(admin);
        vm.prank(admin); reg.registerStrategy(strategyId, address(vault), address(hook));
        bytes32 indexId = keccak256(abi.encodePacked("DEMO-INDEX"));
        bytes32[] memory cons = new bytes32[](1); cons[0] = strategyId;
        vm.prank(admin); reg.registerIndex(indexId, cons);
        console.log("[PM] snapshotIndex: Initiating composite NAV snapshot for index:"); console.logBytes32(indexId);
        vm.recordLogs(); reg.snapshotIndex(indexId);
        Vm.Log[] memory logs = vm.getRecordedLogs();
        console.log("[PM] snapshotIndex: total logs emitted:"); console.logUint(logs.length);
        bool foundComposite = false; bytes32 topic = keccak256("CompositeNAVSnapshot(bytes32,uint256,uint256,int256,uint256)");
        for (uint256 i = 0; i < logs.length; i++) { if (logs[i].topics.length > 0 && logs[i].topics[0] == topic) { foundComposite = true; break; } }
        console.log("[PM] snapshotIndex: CompositeNAVSnapshot present:"); console.logBool(foundComposite);
        assertTrue(foundComposite);

        // --- Month-long time warp and large NAV checkpoint (e.g., $10,000+) ---
        console.log("[Rebalance][time] before +30d warp, ts:"); console.logUint(block.timestamp);
        vm.warp(block.timestamp + 30 days);
        console.log("[Rebalance][time] after +30d warp, ts:"); console.logUint(block.timestamp);

        // Simulate large capital NAV and pretty print
        vm.prank(admin); vault.checkpointByNav(10_000e18);
        (uint256 navBig, uint256 ppsBig, int256 pnlBig) = vault.getStrategyMetrics();
        console.log("[Rebalance] After large NAV checkpoint");
        _logUSD2dp("  NAV", navBig);
        _logPPS2dp("  PPS", ppsBig);
        _logPnLPercent("  PnL", pnlBig);

        // Snapshot again to verify event emission still works after long time
        vm.recordLogs(); reg.snapshotIndex(indexId);
        Vm.Log[] memory logs2 = vm.getRecordedLogs();
        bool foundComposite2 = false; bytes32 topic2 = keccak256("CompositeNAVSnapshot(bytes32,uint256,uint256,int256,uint256)");
        for (uint256 i = 0; i < logs2.length; i++) { if (logs2[i].topics.length > 0 && logs2[i].topics[0] == topic2) { foundComposite2 = true; break; } }
        console.log("[Rebalance] Composite snapshot after 30d + large NAV:"); console.logBool(foundComposite2);
    }
 
}