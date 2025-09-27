# Portfolio Manager (ERC-4626 Aggregator + Router)

This package implements a minimal portfolio manager that mints an ERC-4626 index vault and routes capital across child ERC-4626 vaults. It is designed for demo/e2e integration with adapters and a lightweight `Router` manager, and can be extended with real strategy integrations (e.g., Pendle, Lido, Euler, Hyperliquidity) via adapters.

The current implementation is an MVP focused on safe orchestration primitives. Core logic lives in:

- `src/contract/aggregator/PortfolioAggregator.sol`
- `src/contract/router/Router.sol`
- `src/contract/vaults/ChildVaultBase.sol`
- `src/contract/interfaces/*` and `src/contract/adapter/*` (adapter APIs and examples)

## Use Case

Create a diversified portfolio as an ERC-4626 index vault where deposits mint index shares. The `Router` then allocates underlying assets from the aggregator into child vaults representing individual strategies. Guardrails (caps, intervals, etc.) can be configured to constrain rebalances. Optional DeFi Saver integration allows forwarding encoded strategies via an adapter.

Example scenarios:

- Allocate a portion from a Pendle slice into a Hyperliquidity slice to chase yields.
- De-risk by moving assets from a higher-volatility vault into a reserve vault.
- Forward an off-chain constructed DeFi Saver recipe using the DFS adapter.

## Architecture Overview

- **`PortfolioAggregator`**: ERC-4626 vault that mints index shares and tracks allocations to child ERC-4626 vaults. Exposes `allocateToChild()` and `redeemFromChild()` callable by its `manager` (the `Router` in this MVP).
- **`Router`**: Ownable orchestrator that enforces guardrails and sequences rebalances between child vaults by calling the aggregator. Also forwards DeFi Saver strategies via an optional adapter.
- **`ChildVaultBase`**: Minimal ERC-4626 placeholder per strategy slice (same underlying as aggregator in MVP). Replace or extend with real strategy vaults or adapter-driven flows.
- **Adapters (`src/contract/adapter/*`)**: Integration points for real protocols. Includes `DefiSaverAdapter` for forwarding encoded strategies to a `StrategyExecutor`.

## Directory Structure

- `src/contract/aggregator/PortfolioAggregator.sol`: ERC-4626 index vault
- `src/contract/router/Router.sol`: orchestration + guardrails + DFS forwarder
- `src/contract/vaults/ChildVaultBase.sol`: placeholder child vault
- `src/contract/adapter/*`: example adapters (Pendle, Lido, Euler, Hyperliquidity, Reserve, DeFi Saver)
- `src/contract/interfaces/*`: adapter/router/aggregator interfaces
- `script/DeployPortfolio.s.sol`: end-to-end deployment (aggregator, vaults, router)
- `script/DeployDFSAdapter.s.sol`: deploy and wire the DeFi Saver adapter
- `script/Base.s.sol`: broadcast utilities and mnemonic handling

## Prerequisites

- Foundry (`forge`, `cast`): see `foundry.toml` for configuration
- Bun (for `prettier`/`solhint` scripts): optional but used by `package.json`
- An RPC endpoint and funded key for broadcasting transactions

## Setup

1. Copy `.env.example` and export the needed variables in your shell (or inject via your process manager):

   ```sh
   cp .env.example .env
   # then export or `source` accordingly
   export API_KEY_ALCHEMY=...       # for mainnet access (used by foundry.toml)
   export API_KEY_ETHERSCAN=...
   export MNEMONIC=...              # or set ETH_FROM directly
   export FOUNDRY_PROFILE=default
   ```

2. Install Node/Bun dev tooling (optional for Solidity compilation, but used for linting/formatting):

   ```sh
   bun install
   ```

3. Build and test:

   ```sh
   forge build
   forge test -vvv --gas-report
   ```

## Deploy (Aggregator + Child Vaults + Router)

The portfolio deploy expects a base ERC20 underlying (e.g., USDC or WETH) that is compatible with ERC-4626.

Required env vars for `script/DeployPortfolio.s.sol`:

- `ASSET`: address of the underlying ERC20
- `OWNER` (optional): Owner address for contracts; defaults to the broadcaster

Example (local anvil or any RPC):

```sh
forge script script/DeployPortfolio.s.sol \
  --rpc-url $RPC_URL \
  --broadcast
```

On success, this script deploys:

- `PortfolioAggregator`
- `ChildVaultBase` x5 (Pendle, Lido, Euler, Hyperliquidity, Reserve placeholders)
- `Router`, wires it to the aggregator and child vaults, sets default guardrails, and grants manager rights on the aggregator

## Optional: Deploy DeFi Saver Adapter

To enable forwarding of DFS strategies from `Router.forwardDFSStrategy(...)`:

Required env vars for `script/DeployDFSAdapter.s.sol`:

- `ROUTER`: address of the deployed Router
- `DFS_EXECUTOR`: DeFi Saver StrategyExecutor for the target chain
- `DFS_UNDERLYING` (optional): underlying token held by adapter; can be zero address

```sh
forge script script/DeployDFSAdapter.s.sol \
  --rpc-url $RPC_URL \
  --broadcast
```

## Interacting

- `setAggregator(address)`, `setVaults(address,address,address,address,address)`
- `setGuardrails(Guardrails)` to configure `minIntervalSec`, `txPositionCap`, etc.
- `rebalancePortion(fromVault, toVault, assets)` to move a portion between child vaults
- `deriskVault4ToVault3(assets)` and `topupVault4FromVault1(assets)` helper flows
  - `setDFSAdapter(address)` and `forwardDFSStrategy(...)` for DeFi Saver forwarding

  The aggregator exposes standard ERC-4626 methods for deposits/withdrawals and two manager-only hooks used by the router:

  - `allocateToChild(childVault, assets)`
  - `redeemFromChild(childVault, assets)`
 
 ## Notes & Caveats
works and libraries mentioned above, so please consult their respective documentation
for details about their specific features.

For example, if you're interested in exploring Foundry in more detail, you should look at the
[Foundry Book](https://book.getfoundry.sh). In particular, you may be interested in reading the
[Writing Tests](https://book.getfoundry.sh/forge/writing-tests.html) tutorial.
## Notes & Caveats

This template comes with a set of sensible default configurations for you to use. These defaults can be found in the
following files:

```text
├── .editorconfig
├── .gitignore
├── .prettierignore
├── .prettierrc.yml
├── .solhint.json
├── foundry.toml
└── remappings.txt
```
### VSCode Integration

This template is IDE agnostic, but for the best user experience, you may want to use it in VSCode alongside Nomic
Foundation's [Solidity extension](https://marketplace.visualstudio.com/items?itemName=NomicFoundation.hardhat-solidity).

For guidance on how to integrate a Foundry project in VSCode, please refer to this
[guide](https://book.getfoundry.sh/config/vscode).

### GitHub Actions

This template comes with GitHub Actions pre-configured. Your contracts will be linted and tested on every push and pull
request made to the `main` branch.

You can edit the CI script in [.github/workflows/ci.yml](./.github/workflows/ci.yml).

## Installing Dependencies

Foundry typically uses git submodules to manage dependencies, but this template uses Node.js packages because
[submodules don't scale](https://twitter.com/PaulRBerg/status/1736695487057531328).

This is how to install dependencies:

1. Install the dependency using your preferred package manager, e.g. `bun install dependency-name`
    - Use this syntax to install from GitHub: `bun install github:username/repo-name`
2. Add a remapping for the dependency in [remappings.txt](./remappings.txt), e.g.
    `dependency-name=node_modules/dependency-name`

Note that OpenZeppelin Contracts is pre-installed, so you can follow that as an example.

## Writing Tests

To write a new test contract, you start by importing `Test` from `forge-std`, and then you inherit it in your test
contract. Forge Std comes with a pre-instantiated [cheatcodes](https://book.getfoundry.sh/cheatcodes/) environment
accessible via the `vm` property. If you would like to view the logs in the terminal output, you can add the `-vvv` flag
and use [console.log](https://book.getfoundry.sh/faq?highlight=console.log#how-do-i-use-consolelog).

This template comes with an example test contract [Foo.t.sol](./tests/Foo.t.sol)

## Usage

This is a list of the most frequently needed commands.

### Build

Build the contracts:

```sh
$ forge build
```
### Clean

Delete the build artifacts and cache directories:

```sh
$ forge clean
```
### Compile

Compile the contracts:

```sh
$ forge build
```
### Coverage

Get a test coverage report:

```sh
$ forge coverage
```
### Deploy

Deploy to Anvil:

```sh
$ forge script script/Deploy.s.sol --broadcast --fork-url http://localhost:8545
```
For this script to work, you need to have a `MNEMONIC` environment variable set to a valid
[BIP39 mnemonic](https://iancoleman.io/bip39/).

For instructions on how to deploy to a testnet or mainnet, check out the
[Solidity Scripting](https://book.getfoundry.sh/tutorials/solidity-scripting.html) tutorial.

### Format

Format the contracts:

```sh
$ forge fmt
```
### Gas Usage

Get a gas report:

```sh
$ forge test --gas-report
```
### Lint

Lint the contracts:

```sh
$ bun run lint
```
### Test

Run the tests:

```sh
$ forge test
```
### Test Coverage

Generate test coverage and output result to the terminal:

```sh
$ bun run test:coverage
```
### Test Coverage Report

Generate test coverage with lcov report (you'll have to open the `./coverage/index.html` file in your browser, to do so
simply copy paste the path):

```sh
$ bun run test:coverage:report
```
> [!NOTE]
>
> This command requires you to have [`lcov`](https://github.com/linux-test-project/lcov) installed on your machine. On
> macOS, you can install it with Homebrew: `brew install lcov`.

## Related Efforts

- [foundry-rs/forge-template](https://github.com/foundry-rs/forge-template)
- [abigger87/femplate](https://github.com/abigger87/femplate)
- [cleanunicorn/ethereum-smartcontract-template](https://github.com/cleanunicorn/ethereum-smartcontract-template)
- [FrankieIsLost/forge-template](https://github.com/FrankieIsLost/forge-template)

## License

This project is licensed under MIT.
