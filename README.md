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

# Turborepo Design System Starter

This is a community-maintained example. If you experience a problem, please submit a pull request with a fix. GitHub Issues will be closed.

This guide explains how to use a React design system starter powered by:

- 🏎 [Turborepo](https://turborepo.com) — High-performance build system for Monorepos
- 🚀 [React](https://reactjs.org/) — JavaScript library for user interfaces
- 🛠 [Tsup](https://github.com/egoist/tsup) — TypeScript bundler powered by esbuild
- 📖 [Storybook](https://storybook.js.org/) — UI component environment powered by Vite

As well as a few others tools preconfigured:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting
- [Changesets](https://github.com/changesets/changesets) for managing versioning and changelogs
- [GitHub Actions](https://github.com/changesets/action) for fully automated package publishing

## Using this example

Run the following command:

```sh
npx create-turbo@latest -e design-system
```

### Useful Commands

- `pnpm build` - Build all packages, including the Storybook site
- `pnpm dev` - Run all packages locally and preview with Storybook
- `pnpm lint` - Lint all packages
- `pnpm changeset` - Generate a changeset
- `pnpm clean` - Clean up all `node_modules` and `dist` folders (runs each package's clean script)

## Turborepo

[Turborepo](https://turborepo.com) is a high-performance build system for JavaScript and TypeScript codebases. It was designed after the workflows used by massive software engineering organizations to ship code at scale. Turborepo abstracts the complex configuration needed for monorepos and provides fast, incremental builds with zero-configuration remote caching.

Using Turborepo simplifies managing your design system monorepo, as you can have a single lint, build, test, and release process for all packages. [Learn more](https://vercel.com/blog/monorepos-are-changing-how-teams-build-software) about how monorepos improve your development workflow.

## Apps & Packages

This Turborepo includes the following packages and applications:

- `apps/docs`: Component documentation site with Storybook
- `packages/ui`: Core React components
- `packages/typescript-config`: Shared `tsconfig.json`s used throughout the Turborepo
- `packages/eslint-config`: ESLint preset

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/). Workspaces enables us to "hoist" dependencies that are shared between packages to the root `package.json`. This means smaller `node_modules` folders and a better local dev experience. To install a dependency for the entire monorepo, use the `-w` workspaces flag with `pnpm add`.

This example sets up your `.gitignore` to exclude all generated files, other folders like `node_modules` used to store your dependencies.

### Compilation

To make the ui library code work across all browsers, we need to compile the raw TypeScript and React code to plain JavaScript. We can accomplish this with `tsup`, which uses `esbuild` to greatly improve performance.

Running `pnpm build` from the root of the Turborepo will run the `build` command defined in each package's `package.json` file. Turborepo runs each `build` in parallel and caches & hashes the output to speed up future builds.

For `@acme/ui`, the `build` command is equivalent to the following:

```bash
tsup src/*.tsx --format esm,cjs --dts --external react
```

`tsup` compiles all of the components in the design system individually, into both ES Modules and CommonJS formats as well as their TypeScript types. The `package.json` for `@acme/ui` then instructs the consumer to select the correct format:

```json:ui/package.json
{
  "name": "@acme/ui",
  "version": "0.0.0",
  "sideEffects": false,
  "exports":{
    "./button": {
      "types": "./src/button.tsx",
      "import": "./dist/button.mjs",
      "require": "./dist/button.js"
    }
  }
}
```

Run `pnpm build` to confirm compilation is working correctly. You should see a folder `ui/dist` which contains the compiled output.

```bash
ui
└── dist
    ├── button.d.ts  <-- Types
    ├── button.js    <-- CommonJS version
    ├── button.mjs   <-- ES Modules version
    └── button.d.mts   <-- ES Modules version with Types
```

## Components

Each file inside of `ui/src` is a component inside our design system. For example:

```tsx:ui/src/Button.tsx
import * as React from 'react';

export interface ButtonProps {
  children: React.ReactNode;
}

export function Button(props: ButtonProps) {
  return <button>{props.children}</button>;
}

Button.displayName = 'Button';
```

When adding a new file, ensure that its specifier is defined in `package.json` file:

```json:ui/package.json
{
  "name": "@acme/ui",
  "version": "0.0.0",
  "sideEffects": false,
  "exports":{
    "./button": {
      "types": "./src/button.tsx",
      "import": "./dist/button.mjs",
      "require": "./dist/button.js"
    }
    // Add new component exports here
  }
}
```

## Storybook

Storybook provides us with an interactive UI playground for our components. This allows us to preview our components in the browser and instantly see changes when developing locally. This example preconfigures Storybook to:

- Use Vite to bundle stories instantly (in milliseconds)
- Automatically find any stories inside the `stories/` folder
- Support using module path aliases like `@acme/ui` for imports
- Write MDX for component documentation pages

For example, here's the included Story for our `Button` component:

```js:apps/docs/stories/button.stories.mdx
import { Button } from '@acme/ui/button';
import { Meta, Story, Preview, Props } from '@storybook/addon-docs/blocks';

<Meta title="Components/Button" component={Button} />

# Button

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec euismod, nisl eget consectetur tempor, nisl nunc egestas nisi, euismod aliquam nisl nunc euismod.

## Props

<Props of={Box} />

## Examples

<Preview>
  <Story name="Default">
    <Button>Hello</Button>
  </Story>
</Preview>
```

This example includes a few helpful Storybook scripts:

- `pnpm dev`: Starts Storybook in dev mode with hot reloading at `localhost:6006`
- `pnpm build`: Builds the Storybook UI and generates the static HTML files
- `pnpm preview-storybook`: Starts a local server to view the generated Storybook UI

## Versioning & Publishing Packages

This example uses [Changesets](https://github.com/changesets/changesets) to manage versions, create changelogs, and publish to npm. It's preconfigured so you can start publishing packages immediately.

You'll need to create an `NPM_TOKEN` and `GITHUB_TOKEN` and add it to your GitHub repository settings to enable access to npm. It's also worth installing the [Changesets bot](https://github.com/apps/changeset-bot) on your repository.

### Generating the Changelog

To generate your changelog, run `pnpm changeset` locally:

1. **Which packages would you like to include?** – This shows which packages and changed and which have remained the same. By default, no packages are included. Press `space` to select the packages you want to include in the `changeset`.
1. **Which packages should have a major bump?** – Press `space` to select the packages you want to bump versions for.
1. If doing the first major version, confirm you want to release.
1. Write a summary for the changes.
1. Confirm the changeset looks as expected.
1. A new Markdown file will be created in the `changeset` folder with the summary and a list of the packages included.

### Releasing

When you push your code to GitHub, the [GitHub Action](https://github.com/changesets/action) will run the `release` script defined in the root `package.json`:

```bash
turbo run build --filter=docs^... && changeset publish
```

Turborepo runs the `build` script for all publishable packages (excluding docs) and publishes the packages to npm. By default, this example includes `acme` as the npm organization. To change this, do the following:

- Rename folders in `packages/*` to replace `acme` with your desired scope
- Search and replace `acme` with your desired scope
- Re-run `pnpm install`

To publish packages to a private npm organization scope, **remove** the following from each of the `package.json`'s

```diff
- "publishConfig": {
-  "access": "public"
- },
```
