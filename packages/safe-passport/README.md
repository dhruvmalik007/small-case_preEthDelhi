# @smallcase_defi/safe-passport

ZK-based identity verification (Self Protocol V2) for:

- Client: prove age >= threshold and non-sanctioned (OFAC)
- Portfolio Manager (PM): prove KYC within jurisdiction and optionally on-chain RIA certification

This package includes:

- Solidity contracts (`contracts/`) built with Foundry
- TypeScript SDK utilities for frontend integration (`src/`)
- Example E2E script (`e2e/e2e.ts`) using viem

## Contracts

Core contract: `contracts/src/SafePassport.sol`

- Extends `SelfVerificationRoot` from `@selfxyz/contracts` and uses the on-chain `IdentityVerificationHub`.
- Dynamic config routing via `getConfigId()` using first byte of `userDefinedData`:
  - Action `1`: Client verification (age + OFAC) per your Self config.
  - Action `2`: PM verification (jurisdiction) per your Self config.
- Additional on-chain rule enforcement (admin configurable):
  - `setRules(minAgeRequired, requiredNationality, enforceAge, enforceNationality)`
  - Default rules: min age 18, nationality = `IND` (Indian Aadhaar), both enforced.
- Optional PM RIA: `setRiaRegistry(address)` to enforce external certification in PM flow.
- Emits `ClientVerified` and `PMVerified` on success.

Mocks for local tests:

- `contracts/src/mocks/MockIdentityVerificationHub.sol` (simulates Hub V2 callback)
- `contracts/src/mocks/MockRIARegistry.sol` (simple certification registry)

### Build & Unit Test

From monorepo root:

```bash
pnpm --filter @smallcase_defi/safe-passport forge:build
pnpm --filter @smallcase_defi/safe-passport forge:test
```

Install Foundry if needed:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Mainnet-Fork Tests

Run tests against a fork (no real proofs; still uses mock hub):

```bash
export FORK_URL=https://celo.drpc.org
pnpm --filter @smallcase_defi/safe-passport forge:test:fork
```

## Deployment (Celo mainnet or Celo Sepolia)

Deploy script: `contracts/script/Deploy.s.sol` (deploy-only)

Environment variables:

- `PRIVATE_KEY` — deployer private key (0x-prefixed or not)
- `SELF_HUB` — (recommended) IdentityVerificationHub address to use
  - Celo mainnet (real passports): `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
  - Celo Sepolia testnet (mock passports): `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
- `NETWORK` — optional fallback when `SELF_HUB` is not set: `celo` or anything else (uses testnet hub)
- `CLIENT_CFG_ID` — bytes32 Self config ID for Client flow
- `PM_CFG_ID` — bytes32 Self config ID for PM flow
- `SCOPE` — uint scope for your Self app

Deploy (example to Celo mainnet):

```bash
export PRIVATE_KEY=0x...
export SELF_HUB=0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF
export CLIENT_CFG_ID=0x... # from tools.self.xyz
export PM_CFG_ID=0x...     # from tools.self.xyz
export SCOPE=0
pnpm --filter @smallcase_defi/safe-passport forge:build
pnpm --filter @smallcase_defi/safe-passport deploy
```

Post-deploy (optional):

```solidity
// tighten or loosen on-chain checks (Indian Aadhaar & >=18 by default)
safePassport.setRules(18, "IND", true, true);
// require PM certification via external registry
safePassport.setRiaRegistry(0xYourRegistry);
```

### Verification

Sourcify verification is automatic in `forge verify-contract`. For explorer (Celoscan):

- Pass constructor args as individual quoted args:

```bash
forge verify-contract \
  --rpc-url https://celo.drpc.org \
  --chain celo \
  0xYourSafePassport \
  packages/safe-passport/contracts/src/SafePassport.sol:SafePassport \
  --constructor-args \
    "0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF" \
    "0" \
    "0x0000000000000000000000000000000000000000000000000000000000000000" \
    "0x0000000000000000000000000000000000000000000000000000000000000000" \
  --etherscan-api-key <CELOSCAN_API_KEY>
```

- Or use ABI-encoded constructor args (most robust):

```bash
forge verify-contract \
  --rpc-url https://celo.drpc.org \
  --chain celo \
  0xYourSafePassport \
  packages/safe-passport/contracts/src/SafePassport.sol:SafePassport \
  --constructor-args $(cast abi-encode \
    "constructor(address,uint256,bytes32,bytes32)" \
    0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF \
    0 \
    0x0000000000000000000000000000000000000000000000000000000000000000 \
    0x0000000000000000000000000000000000000000000000000000000000000000) \
  --etherscan-api-key <CELOSCAN_API_KEY>
```

Tip: Avoid JSON-like `[ ... ]` when invoking from zsh; each arg must be quoted or ABI-encoded.

## Self Protocol Configuration

Create verification configs in Self tools and use their IDs:

- Client config: minimum age, OFAC, nationality disclosure as needed
- PM config: jurisdiction and any additional disclosures you require

Set on-chain IDs and scope:

```solidity
safePassport.setConfigIds(clientConfigId, pmConfigId);
safePassport.setScope(scope);
```

Docs: https://docs.self.xyz/contract-integration/deployed-contracts

## Frontend SDK

Exports from `src/` for building the Self QR App and user data:

- `getClientDisclosures({ minimumAge, requireNationality })`
- `getPmDisclosures({ excludedCountries, requireNationality, requireIssuingState })`
- `encodeUserData(action, accessCode)` → `0x...`
- `buildFrontendConfig({ contractAddress, userId, endpointType, disclosures, userDefinedData })`
- `buildInvestorSelfConfig({ contractAddress, investorAddress, endpointType, minimumAge, accessCode })`
- `buildPmSelfConfig({ contractAddress, pmAddress, endpointType, excludedCountries, accessCode })`

Example (client QR):

```tsx
import { SelfQRcodeWrapper, SelfAppBuilder } from '@selfxyz/qrcode';
import { ACTION, encodeUserData, getClientDisclosures, buildFrontendConfig } from '@smallcase_defi/safe-passport';

const accessCode = '0x' + '00'.repeat(32);
const disclosures = getClientDisclosures({ minimumAge: 18, requireNationality: true });
const userDefinedData = encodeUserData(ACTION.CLIENT_VERIFY, accessCode);

const cfg = buildFrontendConfig({
  contractAddress: process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}`,
  userId: walletAddress as `0x${string}`,
  endpointType: (process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE as any) ?? 'staging_celo',
  disclosures,
  userDefinedData,
});
const selfApp = new SelfAppBuilder(cfg).build();

return <SelfQRcodeWrapper selfApp={selfApp} size={256} />;
```

## Web App Integration

- API route builds Self config: `apps/web/app/api/onboarding/investor/route.ts` (returns JSON payload via `buildInvestorSelfConfig`).
- Client widget: `apps/web/components/self/SafePassportWidget.tsx` renders the QR with `@selfxyz/qrcode`.

Set env in `apps/web/.env`:

```
NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=0xYourDeployedContract
NEXT_PUBLIC_SELF_ENDPOINT_TYPE=staging_celo # or celo
```

Run the app:

```bash
pnpm --filter web dev
```

## E2E (local anvil)

```bash
export RPC_URL=http://127.0.0.1:8545
export PRIVATE_KEY=0x... # anvil account
pnpm --filter @smallcase_defi/safe-passport forge:build
pnpm --filter @smallcase_defi/safe-passport e2e
```

The script deploys a mock hub and `SafePassport`, then simulates client and PM verifications.

## Addresses (from Self docs)

- Celo mainnet — `IdentityVerificationHub`: `0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF`
- Celo Sepolia (testnet, mock passports) — `IdentityVerificationHub`: `0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74`
