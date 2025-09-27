# Smallcase DeFi: Uniswap v4 Strategy Integration

This repository includes a Uniswap v4 hook- and strategy-based integration to power on-chain strategy analytics and a web UI. Below are end-to-end instructions to compile, deploy, create a pool with a hook, configure it, provision a strategy vault and registry, and emit snapshots for frontend charts.

## Contents added for Uniswap v4

- Contracts
  - `packages/uniswap_integration/src/hooks/MultiPolicyHook.sol`
  - `packages/uniswap_integration/src/strategy/UniswapLPVault.sol`
  - `packages/uniswap_integration/src/registry/UniswapStrategyRegistry.sol`
  - `packages/uniswap_integration/src/interfaces/*`
  - `packages/uniswap_integration/src/events/StrategyEvents.sol`
  - `packages/uniswap_integration/src/libraries/ChainConfig.sol`
- Scripts
  - `packages/uniswap_integration/script/DeployMultiPolicyHook.s.sol`
  - `packages/uniswap_integration/script/CreateHookedPool.s.sol`
  - `packages/uniswap_integration/script/ConfigureHook.s.sol`
  - `packages/uniswap_integration/script/DeployVaultAndRegistry.s.sol`
  - `packages/uniswap_integration/script/SnapshotAfterCheckpoint.s.sol`

## Prerequisites

- Foundry installed (`forge`, `cast`)
- Funded deployer on target testnet (e.g., Unichain Sepolia)
- Node RPC URL for the target network

## Environment variables

Create `packages/uniswap_integration/.env` with at least:

```bash
RPC_URL_UNICHAIN_SEPOLIA=https://unichain-sepolia.drpc.org
PRIVATE_KEY=0x... # EOA private key for deployer/manager/keeper

# Optional overrides (else use ChainConfig)
# POOL_MANAGER=0x...
# STATE_VIEW=0x...

# Pool creation/config
# TOKEN0=0x...
# TOKEN1=0x...
# HOOK=0x...
```

Notes:
- Keeper/manager default to the address derived from `PRIVATE_KEY`.
- For scripts that accept `bytes32` IDs, pass hex, e.g. `STRATEGY_ID=0x1234...`. If omitted, scripts use demo defaults.

## Dependencies and remappings


## Build

From `packages/uniswap_integration/`:

```bash
forge build -vv --via-ir
```

If you see checksum errors for addresses in `ChainConfig.sol`, ensure addresses are EIP-55 checksummed. The file contains checksummed literals already.

## Step 1. Deploy MultiPolicyHook

Script: `packages/uniswap_integration/script/DeployMultiPolicyHook.s.sol`

Uses `ChainConfig.get(block.chainid)` for default addresses, with env overrides.

```bash
forge script script/DeployMultiPolicyHook.s.sol:DeployMultiPolicyHook \
  --rpc-url $RPC_URL_UNICHAIN_SEPOLIA --broadcast
```

Env honored:
- `PRIVATE_KEY` (broadcast key; also used to default `ADMIN`/`KEEPER`)
- `ADMIN`, `KEEPER` (optional)
- `POOL_MANAGER`, `STATE_VIEW` (optional overrides)

Output: find deployed address in `broadcast/DeployMultiPolicyHook.s.sol/<chainid>/run-latest.json`.

## Step 2. Create a pool wired to the hook (ETH/USDC recommended)

Script: `packages/uniswap_integration/script/CreateHookedPool.s.sol`

```bash
export HOOK=0x...           # Deployed MultiPolicyHook
export TOKEN0=0x...         # token0 (e.g., WETH)
export TOKEN1=0x...         # token1 (e.g., USDC)
export FEE=3000             # default
export TICK_SPACING=60      # default
export SQRT_PRICE_X96=0     # optional; defaults to 2^96 (1:1)

forge script script/CreateHookedPool.s.sol:CreateHookedPool \
  --rpc-url $RPC_URL_UNICHAIN_SEPOLIA --broadcast
```

Note: PoolKey contains the `hooks` address; ensure the pool is initialized with the correct hook.

## Step 3. Configure policy parameters on the hook

Script: `packages/uniswap_integration/script/ConfigureHook.s.sol`

```bash
export HOOK=0x...
export TOKEN0=0x...
export TOKEN1=0x...
export FEE=3000
export TICK_SPACING=60

# Range
export TICK_LOWER=-60000
export TICK_UPPER=60000
export TWAP_LOOKBACK=120
export TWAP_THRESHOLD_BPS=100
export REBALANCE_COOLDOWN=300

# Volatility
export LAMBDA_BPS=9950
export MIN_SWAP_NOTIONAL_BPS=0
export MIN_WIDTH=120
export MAX_WIDTH=600
export TARGET_WIDTH=240
export SHARPE_LOW_E2=50
export SHARPE_HIGH_E2=150

# Fees
export COMPOUND_COOLDOWN=3600
export MIN_FEES=0

forge script script/ConfigureHook.s.sol:ConfigureHook \
  --rpc-url $RPC_URL_UNICHAIN_SEPOLIA --broadcast
```

## Step 4. Deploy Vault and Registry

Script: `packages/uniswap_integration/script/DeployVaultAndRegistry.s.sol`

```bash
# Optional: STRATEGY_ID as bytes32; if omitted, defaults to keccak("DEMO-STRATEGY")
# export STRATEGY_ID=0x...

forge script script/DeployVaultAndRegistry.s.sol:DeployVaultAndRegistry \
  --rpc-url $RPC_URL_UNICHAIN_SEPOLIA --broadcast
```

Outputs:
- `UniswapLPVault` deployed and seeded with NAV=100e18, PPS=1e18
- `UniswapStrategyRegistry` deployed and strategy registered (active)
- Manager set to the `PRIVATE_KEY` address by default

### Vault setParams ABI shape + on-chain example

`UniswapLPVault.setParams(bytes data)` expects the following ABI-encoded tuple:

```text
abi.encode(
  address token0,
  address token1,
  uint24  fee,
  int24   tickSpacing,
  address hook,
  uint16  slippageBps
)
```

Notes:
- Ensure `token0 < token1` (address ordering) to match Uniswap v4 `PoolKey` currency ordering.
- Only the manager (or owner) can call `setParams`.

Example using cast to set params on-chain:

```bash
export RPC_URL=$RPC_URL_UNICHAIN_SEPOLIA
export VAULT=0x...      # deployed UniswapLPVault
export TOKEN0=0x...     # e.g., WETH  on Unichain Sepolia: 0x4200000000000000000000000000000000000006
export TOKEN1=0x...     # e.g., USDC on Unichain Sepolia: 0x31d0220469e10c4e71834a79b1f276d740d3768f
export FEE=3000
export TICK_SPACING=60
export HOOK=0x...       # deployed MultiPolicyHook
export SLIPPAGE_BPS=50  # 0.50%

cast send "$VAULT" "setParams(bytes)" \
  $(cast abi-encode "(address,address,uint24,int24,address,uint16)" \
      $TOKEN0 $TOKEN1 $FEE $TICK_SPACING $HOOK $SLIPPAGE_BPS) \
  --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY"

# Verify stored fields
cast call "$VAULT" "poolToken0()(address)" --rpc-url "$RPC_URL"
cast call "$VAULT" "poolToken1()(address)" --rpc-url "$RPC_URL"
cast call "$VAULT" "poolFee()(uint24)" --rpc-url "$RPC_URL"
cast call "$VAULT" "poolTickSpacing()(int24)" --rpc-url "$RPC_URL"
cast call "$VAULT" "poolHook()(address)" --rpc-url "$RPC_URL"
cast call "$VAULT" "slippageBps()(uint16)" --rpc-url "$RPC_URL"
```

## Step 5. Emit snapshots for frontend charts

Script: `packages/uniswap_integration/script/SnapshotAfterCheckpoint.s.sol`

```bash
export REGISTRY=0x...
export VAULT=0x...
export STRATEGY_ID=0x...
# Optional: INDEX_ID=0x..., NAV_USD_1E18=...

forge script script/SnapshotAfterCheckpoint.s.sol:SnapshotAfterCheckpoint \
  --rpc-url $RPC_URL_UNICHAIN_SEPOLIA --broadcast
```

This performs a dummy `rebalance()` on the vault, checkpoints NAV (by default to 102e18), registers a simple 1-constituent index if needed, and emits a `CompositeNAVSnapshot`.

## Integrate on-chain metrics with the Web App

Target pages/components:
- `apps/web/app/strategies/page.tsx`
- `apps/web/components/strategy/StrategiesListClient.tsx`

The current UI renders a curated static list from `apps/web/data/strategies.ts`. To overlay live on-chain metrics (NAV, PPS, PnL) from `UniswapLPVault` while keeping the same UI, add a small server-side fetch and merge the metrics into the existing list by `slug`.

### 1) Produce ABIs from the Solidity build

- From `packages/uniswap_integration/`, run: `forge build`
- Foundry outputs ABIs under `packages/uniswap_integration/out/`
  - `out/src/strategy/UniswapLPVault.sol/UniswapLPVault.json` (has `getStrategyMetrics()`)
  - `out/src/registry/UniswapStrategyRegistry.sol/UniswapStrategyRegistry.json`

Alternatively, define a minimal ABI inline on the web side for reads only:
- `UniswapLPVault.getStrategyMetrics() -> (uint256 navUsd1e18, uint256 pps1e18, int256 pnlBps)`

### 2) Configure web env and a mapping from strategy slugs to vault addresses

Create `apps/web/.env.local` with:

```bash
NEXT_PUBLIC_RPC_URL_UNICHAIN_SEPOLIA=https://unichain-sepolia.drpc.org
# Optional: if reading composite index
NEXT_PUBLIC_REGISTRY_ADDRESS=0x...
```

Create a config file mapping UI strategy slugs to deployed vaults and optional `strategyId` used on-chain. Example path:
- `apps/web/config/onchain.strategies.json`

Example shape:
```json
{
  "uniswap-lp-eth-usdc": {
    "vault": "0x...",
    "strategyId": "0x..."  
  },
  "another-strategy": {
    "vault": "0x...",
    "strategyId": "0x..."
  }
}
```

Keep this file in the repo (or generate it after deploy) and update as you add strategies.

### 3) Add a small on-chain fetcher (server-side)

Install a lightweight RPC client in the web app (viem):

```bash
cd apps/web && pnpm add viem
```

Create `apps/web/lib/onchain.ts` with a minimal ABI and helpers:

```ts:apps/web/lib/onchain.ts
import "server-only";
import { createPublicClient, http } from "viem";

// Minimal ABI: UniswapLPVault.getStrategyMetrics()
const vaultAbi = [
  {
    "type": "function",
    "name": "getStrategyMetrics",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "name": "navUsd1e18", "type": "uint256" },
      { "name": "pps1e18", "type": "uint256" },
      { "name": "pnlBps", "type": "int256" }
    ]
  }
 ] as const;

const RPC = process.env.NEXT_PUBLIC_RPC_URL_UNICHAIN_SEPOLIA!;
export const publicClient = createPublicClient({ transport: http(RPC) });

export type Metrics = { navUsd1e18: bigint; pps1e18: bigint; pnlBps: bigint };

export async function fetchStrategyMetrics(vault: `0x${string}`): Promise<Metrics> {
  const [navUsd1e18, pps1e18, pnlBps] = await publicClient.readContract({
    address: vault,
    abi: vaultAbi,
    functionName: "getStrategyMetrics",
  });
  return { navUsd1e18, pps1e18, pnlBps } as Metrics;
}

export async function fetchAllMetrics(mapping: Record<string, { vault: `0x${string}` }>) {
  const out: Record<string, Metrics> = {};
  for (const [slug, { vault }] of Object.entries(mapping)) {
    try { out[slug] = await fetchStrategyMetrics(vault); } catch {}
  }
  return out;
}
```

Notes:
- This runs server-side only. In the Next.js App Router you can safely import this into a route handler.

### 4) Expose an API route for the client component

Create `apps/web/app/api/strategy-metrics/route.ts`:

```ts:apps/web/app/api/strategy-metrics/route.ts
import { NextResponse } from "next/server";
import mapping from "@/config/onchain.strategies.json";
import { fetchAllMetrics } from "@/lib/onchain";

export async function GET() {
  try {
    const data = await fetchAllMetrics(mapping as Record<string, { vault: `0x${string}` }>);
    return NextResponse.json(data, {
      status: 200,
      headers: { "cache-control": "s-maxage=15, stale-while-revalidate=60" },
    });
  } catch (e) {
    return NextResponse.json({}, { status: 200 });
  }
}
```

This keeps RPC calls on the server and the existing UI unchanged.

### 5) Merge metrics in `StrategiesListClient.tsx`

In `apps/web/components/strategy/StrategiesListClient.tsx` add a tiny client fetch and overlay, leaving the cards intact:

```tsx diff:apps/web/components/strategy/StrategiesListClient.tsx
@@
 export function StrategiesListClient() {
+  const [metrics, setMetrics] = React.useState<Record<string, { navUsd1e18: string; pps1e18: string; pnlBps: string }>>({});
@@
+  React.useEffect(() => {
+    fetch("/api/strategy-metrics")
+      .then((r) => r.json())
+      .then((j) => setMetrics(j))
+      .catch(() => {});
+  }, []);
@@
         {strategies.map((s: Strategy) => (
           <StrategyCard key={s.slug} strategy={s} onHover={(x) => setHoveredSlug(x.slug)} />
         ))}
@@
        {selected && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
@@
            <div className="flex items-center gap-2">
+              {metrics[selected.slug] && (
+                <div className="text-xs text-muted-foreground">
+                  Live PPS: {(Number(metrics[selected.slug].pps1e18) / 1e18).toFixed(4)} •
+                  PnL: {(Number(metrics[selected.slug].pnlBps) / 100).toFixed(2)}%
+                </div>
+              )}
```

You may also show the live snippet inside each `StrategyCard` using the same `metrics[s.slug]` lookup instead.

### 6) Optional: Composite Index on the web

If you want to show a composite/benchmark line based on the on-chain registry:
- Use `UniswapStrategyRegistry.getIndexConstituents(indexId)` to list strategy ids
- Call `fetchStrategyMetrics` for each constituent’s vault
- Compute TVL-weighted `ppsWeighted` / `pnlWeightedBps` on the server (same math as in `snapshotIndex`)
- Serve this via an API route like `/api/index-metrics?indexId=0x...`

You can also emit and consume `CompositeNAVSnapshot` events, but direct views are simpler for initial integration.

### 7) Persisting snapshots (optional)

If you’d like historical charts driven by on-chain data, add a background job that:
- Periodically calls vault `getStrategyMetrics()` and writes to your database (see `packages/database/prisma/schema.prisma`)
- Emits `NAVSnapshot` from contracts when meaningful on-chain actions occur (already implemented in `UniswapLPVault`)
- The frontend can then query the DB for timeseries, keeping the UI fast and deterministic

### 8) Minimal testing checklist

- Deploy contracts and record addresses in `onchain.strategies.json`
- Hit `/api/strategy-metrics` and verify JSON output
- Load `/strategies` and confirm overlays appear for strategies with configured vaults
- Verify nothing breaks when metrics are missing (fallback gracefully)

## Notes on price reads and safety (Uniswap v4)

- `MultiPolicyHook._getSqrtPriceX96` uses a periphery `StateView` lens and falls back to `ChainConfig` for the current chain. Calls are wrapped in `try/catch` to avoid hook reverts.
- Best practice inside hooks is to read `PoolManager` storage directly for gas/atomicity. You can refactor `_getSqrtPriceX96` accordingly once stable.

## Troubleshooting

- Address checksum errors: ensure EIP-55 checksummed literals in `ChainConfig.sol`.
- Import resolution for `BaseHook.sol`:
  - The project imports via a vendored path `../../lib/uniswap-hooks/src/base/BaseHook.sol` inside `MultiPolicyHook.sol`.
  - Alternatively, use the remapping key `uniswap-hooks/` if you prefer.
- Missing libs: if imports fail, ensure the vendored `lib/uniswap-hooks` exists. If switching to `forge install` instead of vendoring, update remappings accordingly.
- Broadcast files: Foundry writes to `packages/uniswap_integration/broadcast/...`. The repo `.gitignore` excludes these.

---
