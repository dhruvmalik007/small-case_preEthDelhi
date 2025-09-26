# @acme/safe-passport

ZK-based identity verification package integrating Self Protocol V2 for:

- Client: prove age >= threshold and non-sanctioned (OFAC)
- Portfolio Manager (PM): prove KYC within jurisdiction and RIA certification

This package includes:

- Solidity contracts (`contracts/`) built with Foundry
- TypeScript SDK utilities for frontend integration (`src/`)
- Example E2E script (`e2e/e2e.ts`) using viem

## Contracts

Core contract: `SafePassport.sol`

- Extends `SelfVerificationRoot` from `@selfxyz/contracts`
- Dynamic config routing via `getConfigId()`
  - Action 1: Client verification (age + OFAC)
  - Action 2: PM verification (jurisdiction + RIA)
- Emits `ClientVerified` and `PMVerified`
- Admin methods:
  - `setConfigIds(bytes32 clientCfg, bytes32 pmCfg)`
  - `setScope(uint256 newScope)`
  - `setRiaRegistry(address registry)`

Mocks:

- `MockIdentityVerificationHub.sol` (simulates Hub V2 callback)
- `MockRIARegistry.sol` (simple on-chain registry for PM RIA certification checks)

### Build & Test

From monorepo root:

```bash
pnpm --filter @acme/safe-passport forge:build
pnpm --filter @acme/safe-passport forge:test
```

Note: Requires Foundry (`forge`). Install via:

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## Frontend SDK

Helpers in `src/` to configure Self App and encode user data:

- `getClientDisclosures({ minimumAge, requireNationality })`
- `getPmDisclosures({ excludedCountries, requireNationality, requireIssuingState })`
- `encodeUserData(action, accessCode)` → `0x` prefixed hex payload
- `buildFrontendConfig({ contractAddress, userId, endpointType, disclosures, userDefinedData })`

Example usage with Self QR code:

```tsx
import SelfQRcodeWrapper, { SelfAppBuilder } from '@selfxyz/qrcode';
import { ACTION, encodeUserData, getClientDisclosures, buildFrontendConfig } from '@acme/safe-passport';

const accessCode = '0x' + '00'.repeat(32);
const disclosures = getClientDisclosures({ minimumAge: 18 });
const userDefinedData = encodeUserData(ACTION.CLIENT_VERIFY, accessCode);

const cfg = buildFrontendConfig({
  contractAddress: process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}`,
  userId: walletAddress,
  endpointType: 'staging_celo',
  disclosures,
  userDefinedData,
});
const selfApp = new SelfAppBuilder(cfg).build();

return <SelfQRcodeWrapper selfApp={selfApp} size={256} />;
```

## Self Protocol Configuration

Use https://tools.self.xyz/ to create verification configs and get `configId` values.

- Client: configure minimum age and OFAC checks
- PM: configure forbidden countries and any other required attributes

Set those on-chain:

```solidity
safePassport.setConfigIds(clientConfigId, pmConfigId);
```

Set scope using the deployed contract address (via Self tools) then:

```solidity
safePassport.setScope(scope);
```

For PM RIA certification, deploy a registry contract (or integrate an existing one) and plug it in:

```solidity
safePassport.setRiaRegistry(riaRegistryAddress);
```

## E2E Script

Requires a local node (e.g., anvil) and a funded private key env var:

```bash
export RPC_URL=http://127.0.0.1:8545
export PRIVATE_KEY=0x... # anvil account
pnpm --filter @acme/safe-passport forge:build
pnpm --filter @acme/safe-passport e2e
```

The script deploys the mock hub and SafePassport, simulates a successful Client verification, and checks contract state.

## Web App Integration

- Investor page: `apps/web/app/investor/kyc/self-verify/page.tsx`
- PM page: `apps/web/app/publisher/dashboard/self-verify/page.tsx`
- Shared QR component: `apps/web/components/self/SafePassportWidget.tsx`

Set environment variables in `apps/web/.env`:

```
NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=0xYourDeployedContract
NEXT_PUBLIC_SELF_ENDPOINT_TYPE=staging_celo # or celo
```

Then run the app:

```bash
pnpm --filter web dev
```

## Notes

- Hub V2 addresses (from docs): Celo Mainnet `0xe57F...5BF`, Celo Testnet `0x68c9...A51`
- Ensure your Self App disclosures match your on-chain verification config
- `GenericDiscloseOutputV2` fields include nationality, dateOfBirth, olderThan, OFAC checks, etc.
