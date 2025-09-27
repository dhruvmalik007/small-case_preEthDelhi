# @repo/database

Type-safe ORM package for `smallcase_defi`, modeled after the `vercel/next-forge` `packages/database` reference. It bundles:

- Prisma Client configured for Postgres (Neon adapter by default)
- Zod-based env validation for `DATABASE_URL`
- Schemas covering protocol ingestion, strategies, users, and analytics fields

## Contents

- `prisma/schema.prisma` — Prisma schema and enums
- `index.ts` — Exports a singleton Prisma client and re-exports generated types
- `keys.ts` — `DATABASE_URL` loader/validator
- `.env.example` — sample connection string

## Setup

1) Create a Postgres database (Neon/Supabase/local) and set `DATABASE_URL`.

```
cp packages/database/.env.example .env
# or set DATABASE_URL in your process environment
```

2) Generate Prisma Client for this package:

```
pnpm --filter @repo/database build
# or
pnpm -F @repo/database build
```

This runs `prisma generate` and writes the client to `packages/database/generated/client`.

3) (Optional) Apply the schema to your DB (development):

```
# create an initial migration and push
pnpm -F @repo/database prisma migrate dev --name init
# or just push without migrations (non-prod)
pnpm -F @repo/database prisma db push
```

## Usage

Import the client and generated types in server-side code only:

```ts
// apps/web (server only files, e.g., app/api routes, server actions)
import { database, StrategyCategory, Rebalancing, RiskLevel, Volatility } from "@repo/database";

export async function createStrategy() {
  await database.strategy.create({
    data: {
      slug: "bluechip-lst-yield",
      name: "Bluechip LST Yield",
      category: StrategyCategory.LIQUID_STAKING,
      rebalancing: Rebalancing.MONTHLY,
      riskLevel: RiskLevel.CONSERVATIVE,
      volatility: Volatility.LOW,
      expectedApyMin: "4.2",
      expectedApyMax: "7.8",
      historicalApyOneYear: "5.9",
      maxDrawdownPct: "5.8",
      minInvestmentUsd: "250",
      managementFeePct: "0.5",
      performanceFeePct: "5",
      chains: ["Ethereum", "Arbitrum", "Base"],
      protocols: ["Lido", "Rocket Pool", "Ether.fi", "Pendle"],
      tags: ["ETH", "Yield", "LST", "Pendle"],
      holdings: {
        createMany: {
          data: [
            { protocol: "Lido", asset: "stETH", weightBps: 3800 },
            { protocol: "Rocket Pool", asset: "rETH", weightBps: 2800 },
            { protocol: "Ether.fi", asset: "weETH", weightBps: 2400 },
            { protocol: "Pendle", asset: "PT-stETH", weightBps: 1000 },
          ],
        },
      },
    },
  });
}
```

Note: Percentages are stored as basis points (`weightBps`), decimal strings for `Decimal` fields per Prisma recommendation.

## Schema overview

- **Protocol/Asset Universe** — mirrors DeFiLlama ingestion (`protocol`, `asset_universe`, optional `yield_snapshots`).
- **Users** — `user` (wallet-first) with role-based access.
- **Strategy** — aligns with `apps/web/data/strategies.ts` and the architecture doc, including:
  - enums: `StrategyCategory`, `RiskLevel`, `Volatility`, `Rebalancing`
  - arrays: `chains`, `protocols`, `tags`
  - relations: `holdings`, `targets`, `backtest`, `benchmark`, `investorProfile`

## Conventions

- Use `StrategyHolding.weightBps` for weights (must sum to 10000 bps).
- Keep protocol shortlists dynamic at runtime via ingestion; avoid hardcoding. (If documenting shortlists, prefer a separate `protocol_shortlists.md`.)
- Import from this package on the server only. `index.ts` uses `server-only` to prevent client-side bundling.

## Maintenance

- Update schema and run a new migration when data model changes.
- If you switch away from Neon, convert `index.ts` to use a standard `PrismaClient` (remove the Neon adapter) and ensure `DATABASE_URL` works for your provider.
