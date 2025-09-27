# smallcase_defi — ETHGlobal New Delhi Hackathon 

# team participants
Mohit Agarwal (@mohitagarwal24)
Adesh (@sneaxhuh’s)
Raj Patel (imrraaj)
Dhruv Malik (@dhruvmalik007)


# About 
This monorepo contains the implementation for a DeFi-native “smallcase” platform built for ETHGlobal New Delhi.  

## What we’re building

- A rules-based, thematic portfolio manager for on-chain strategies (mutual-fund-like UX) with automated rebalancing and composable DeFi integrations.
- Wallet-first onboarding and compliance: Self Passport for PM and Investor verification, using on-chain attestations where applicable.
- Production-grade monorepo: web app (Next.js), shared UI kit, Safe Passport package, Uniswap integration, database ORM.

## Target prize tracks (typical ETHGlobal themes)

- DeFi (DEX, LPs, lending, structured products)
- Identity / KYC (on-chain or privacy-preserving verification)
- Account Abstraction & Wallet UX (better onboarding, signatures, flows)
- L2 Scaling and Deployments (build on an L2; testnet or mainnet)
- Data / Indexing / Analytics
- Cross-chain & Interoperability

Reference: ETHGlobal events regularly feature these tracks and sponsor bounties. See the ETHGlobal event listing for current details and prize announcements:
- ETHGlobal events: https://ethglobal.com/events
- ETHGlobal New Delhi info: https://ethglobal.com/events/newdelhi

## Package → Prize Track Mapping and Demo Plan

| Package | Primary Track(s) | Example Sponsors (typical) | What we’ll demo | Prize notes |
|---|---|---|---|---|
| `packages/safe-passport` | Identity verification and conditional tests | Privy, Polygon ID (identity), Safe/Stackup (AA) | Self Passport widget for PM + Investor flows; wallet-auth with Clerk Web3 signing; PM on-chain verification check | Strong fit for identity/KYC and onboarding prizes |
| `apps/web` (Next.js) | Wallet UX, AA, L2 deployments, DeFi | L2s (Optimism/Arbitrum/Polygon), Safe, MetaMask | End-to-end UX: account dropdown with Clerk Web3 auth, Investor KYC flow, PM onboarding wizard, dashboards | Can qualify for multiple sponsor bounties via integrations |
| `packages/uniswap_integration` | DeFi (DEX/LP) | Uniswap | Strategy trade routing/mock execution; quotes and pool data | Direct line to DEX sponsor bounties |
| `packages/database` | Data / Indexing / Analytics | The Graph, Covalent (ecosystem), Infra | Prisma schema + seed data for strategies, protocols, subscriptions; backtest placeholders | Supports data/indexing themes; complement DeFi track |
| `packages/ui` | Wallet UX, Developer Experience | — | Shared components (modals, buttons, dropdowns) for consistent UX | Helps UX judging; not a standalone bounty |
| `packages/portfolio_manager` | DeFi, Cross-chain (future) | L2s, bridging protocols | Strategy builder and publisher flows | Useful for DeFi category breadth |
| `packages/eslint-config`, `packages/typescript-config` | DX / Quality | — | Shared lint/ts config | Foundation only |

Notes on sponsors and prize pools: exact sponsors and amounts are announced per event; ETHGlobal circuits typically total >$100k in prizes across main awards and sponsor bounties. Always confirm current rules and categories on the official event pages.

## Demo checklist (by track)

- DeFi
  - Strategy cards, Uniswap quoting, portfolio/allocations UI.
- Identity / KYC
  - Investor: Self verification; PM: Self verification + on-chain attestation check; Clerk Web3 wallet sign-in.
- Wallet UX / AA
  - Connect wallet, sign nonce via Clerk Web3 (prepareVerification → personal_sign → attemptVerification), account modal UX.
- L2
  - Deploy and run flows on a target L2 RPC; document chain IDs used.
- Data/Indexing
  - Seed script to bootstrap strategy/protocol data and subscriptions.

## How to run locally

1) Install deps and generate Prisma client
```
pnpm -w install
pnpm --filter @repo/database generate
```
2) Set environment
```
# apps/web/.env
NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=...
NEXT_PUBLIC_SELF_ENDPOINT_TYPE=staging_celo

# DATABASE_URL in your shell or root .env for packages/database
```
3) Database (dev)
```
pnpm --filter @repo/database db:push
pnpm --filter @repo/database seed
```
4) Build packages and run web
```
pnpm --filter @smallcase_defi/safe-passport build
pnpm --filter web dev
```

## Links & references

- ETHGlobal events: https://ethglobal.com/events
- ETHGlobal New Delhi (info/registration): https://ethglobal.com/events/newdelhi
- Clerk Web3 (MetaMask signature-based auth): https://clerk.com/docs/authentication/web3/metamask

---

## Appendix: Turborepo Design System Starter

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
