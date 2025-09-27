# Investment Feature Setup

This document explains how to set up the investment functionality for the DeFi Smallcases platform.

## Features Implemented

### 1. Wallet Connection
- **Location**: Navbar (top right)
- **Provider**: Privy (supports multiple wallet types)
- **Features**: 
  - Connect wallet
  - Copy wallet address
  - Disconnect wallet
  - Shows connection status

### 2. Investment Modal
- **Location**: Strategy detail pages (e.g., `/strategies/stablecoin-trifecta`)
- **Features**:
  - Investment amount input
  - Fee calculation (management fees)
  - Investment review step
  - Uniswap integration simulation
  - Transaction processing status

### 3. Uniswap Integration
- **Location**: `lib/uniswap.ts`
- **Features**:
  - Mock Uniswap V3 integration
  - Token approval simulation
  - Swap execution simulation
  - Strategy-specific token routing

## Setup Instructions

### 1. Configure Privy (Required for wallet connection)

1. Go to [Privy Dashboard](https://dashboard.privy.io/)
2. Create a new app
3. Copy your App ID
4. Create `.env.local` file in the web app directory:

```bash
NEXT_PUBLIC_PRIVY_APP_ID=your-privy-app-id-here
```

### 2. Test the Investment Flow

1. Start the development server:
```bash
pnpm dev
```

2. Navigate to a strategy page:
```
http://localhost:3000/strategies/stablecoin-trifecta
```

3. Click "Connect Wallet" in the navbar
4. Connect your wallet using Privy
5. Click the "Invest" button on the strategy page
6. Enter an investment amount
7. Review and confirm the investment

## File Structure

```
apps/web/
├── components/
│   ├── wallet/
│   │   └── wallet-connect.tsx          # Wallet connection component
│   ├── investment/
│   │   └── invest-modal.tsx            # Investment modal
│   ├── providers/
│   │   └── privy-provider.tsx          # Privy provider wrapper
│   └── ui/                             # UI components
│       ├── input.tsx
│       ├── label.tsx
│       ├── separator.tsx
│       └── alert.tsx
├── lib/
│   └── uniswap.ts                      # Uniswap integration
└── app/
    └── strategies/
        └── [slug]/
            └── page.tsx                 # Strategy detail page
```

## Customization

### Adding New Strategies
Update the `getStrategyConfig` method in `lib/uniswap.ts`:

```typescript
const configs: Record<string, { inputToken: string; outputToken: string }> = {
  "your-new-strategy": {
    inputToken: "0x...", // Input token address (e.g., USDC)
    outputToken: "0x...", // Strategy token address
  },
};
```

### Styling
- Investment button: Green background (`bg-green-600`)
- Modal: Uses shadcn/ui components
- Responsive design for mobile and desktop

## Production Considerations

1. **Real Uniswap Integration**: Replace mock functions with actual Uniswap V3 SDK calls
2. **Error Handling**: Add comprehensive error handling for failed transactions
3. **Gas Estimation**: Implement real gas estimation
4. **Transaction Monitoring**: Add transaction status monitoring
5. **Security**: Implement proper input validation and security checks

## Dependencies Added

- `@radix-ui/react-label` - For form labels
- `@radix-ui/react-separator` - For visual separators
- `@privy-io/react-auth` - For wallet connection (already present)

## Troubleshooting

### Wallet Connection Issues
- Ensure `NEXT_PUBLIC_PRIVY_APP_ID` is set correctly
- Check browser console for Privy errors
- Verify Privy app configuration in dashboard

### Investment Modal Issues
- Check that all UI components are properly imported
- Verify strategy data structure matches expected format
- Ensure wallet is connected before attempting investment

### Build Issues
- Run `pnpm install` to ensure all dependencies are installed
- Check for TypeScript errors in the console
- Verify all imports are correct
