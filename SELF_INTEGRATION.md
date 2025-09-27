# Self Protocol Integration Guide

This guide explains how to properly set up the Self Protocol integration for on-chain KYC verification following the [official Self Protocol documentation](https://docs.self.xyz/contract-integration/basic-integration).

## 🔧 Configuration Steps

### 1. Set Up Scope

1. **Scope Seed**: Set a simple string identifier (max 31 ASCII characters) in the contract
   - For example: `"defi-smallcases"`
   - This identifies your application in the Self Protocol
   - The contract automatically generates a scope from this seed

### 2. Update Environment Variables

Create `.env.local` with the following variables:

```env
# SafePassport Contract Configuration
NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS=YOUR_DEPLOYED_CONTRACT_ADDRESS
NEXT_PUBLIC_SAFE_PASSPORT_CHAIN_ID=44787

# Self Protocol Configuration
NEXT_PUBLIC_SELF_ENDPOINT_TYPE=staging_celo
```

### 3. Deploy SimpleSafePassport Contract

Deploy your contract following the Self Protocol basic integration pattern:

```bash
cd packages/safe-passport
forge script contracts/script/Script.s.sol:DeployAndSimulate --rpc-url https://alfajores-forno.celo-testnet.org --broadcast --verify
```

### 4. Test the Integration

1. Start the development server:
   ```bash
   pnpm dev
   ```

2. Navigate to `/investor/kyc/self-verify`
3. Connect your wallet
4. Click "Start KYC Verification"
5. Complete verification in Self app
6. Return to see verification status

## 🚀 How It Works

1. **User clicks "Start Self Verification"**
2. **SelfAppBuilder generates verification URL with proper parameters**
3. **User completes verification in Self app**
4. **Self app sends verification result via postMessage**
5. **System verifies proof on-chain using SimpleSafePassport contract**
6. **User gains access to investment features**

## 🔧 Implementation Details

### Contract Integration

The contract follows the [Self Protocol basic integration pattern](https://docs.self.xyz/contract-integration/basic-integration):

```solidity
contract SimpleSafePassport is SelfVerificationRoot {
    constructor(
        address identityVerificationHubV2,
        string memory scopeSeed,
        SelfUtils.UnformattedVerificationConfigV2 memory _verificationConfig
    ) SelfVerificationRoot(identityVerificationHubV2, scopeSeed) {
        // Format and register the verification config
        verificationConfig = SelfUtils.formatVerificationConfigV2(_verificationConfig);
        verificationConfigId = IIdentityVerificationHubV2(identityVerificationHubV2).setVerificationConfigV2(verificationConfig);
    }
}
```

### SelfAppBuilder Integration

The frontend configuration must **exactly match** the contract's verification config:

```typescript
import { SelfAppBuilder } from '@selfxyz/qrcode';

const app = new SelfAppBuilder({
  appName: "DeFi Smallcases",
  scope: "defi-smallcases",
  endpoint: "0x...", // Your deployed contract address
  endpointType: "staging_celo",
  userId: "0x...", // User's wallet address
  userIdType: "hex",
  version: 2,
  disclosures: {
    // Must match contract's UnformattedVerificationConfigV2
    date_of_birth: true,
    nationality: true,
    name: true,
    issuing_state: true,
    passport_number: true,
    gender: true,
    expiry_date: true,
    minimumAge: 18, // matches contract's olderThan: 18
    excludedCountries: [], // matches contract's forbiddenCountries: []
    ofac: true // matches contract's ofacEnabled: [true, false, false]
  },
  devMode: true
});

const verificationUrl = await app.getVerificationUrl();
```

### On-Chain Verification

The verification process includes:

1. **Proof Generation**: Self app generates ZK proof
2. **Hub Verification**: Identity Verification Hub V2 verifies the proof
3. **Contract Callback**: Hub calls `customVerificationHook` on your contract
4. **Status Update**: User verification status is updated
5. **Access Granted**: User can access protected features

## 🧪 Testing

### Demo Mode
- Toggle the "Demo Mode" checkbox
- Click "Start Demo Verification"
- Simulates successful verification for testing

### Real Mode
- Ensure you have a real App ID and Secret from Self Protocol
- Click "Start KYC Verification"
- Redirects to Self app for real verification

## 📋 Required Setup

1. **Scope Seed**: Set simple string identifier in contract constructor
2. **Contract Deployment**: Deploy SimpleSafePassport contract on Celo Testnet
3. **Environment Variables**: Set contract address and endpoint type
4. **Config Matching**: Frontend disclosures must exactly match contract verification config
5. **No App ID needed**: Self Protocol V2 uses contract address directly

## 🔗 Resources

- [Self Documentation](https://docs.self.xyz/) - Full integration guide
- [Celo Testnet Faucet](https://faucet.celo.org/) - Get test tokens

## ⚠️ Important Notes

- **Testnet**: Use Celo Testnet (Alfajores) for development
- **Scope Seed**: Simple string identifier (max 31 ASCII characters)
- **Contract**: Must be deployed before verification works
- **Config Matching**: Frontend and contract verification configs must match exactly
- **No App ID needed**: Self Protocol V2 uses contract address directly
