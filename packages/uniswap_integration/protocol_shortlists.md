# Protocol Shortlists

This document lists curated Unichain pools and canonical token addresses for use in strategy configuration and tests.

## Unichain Mainnet (chainId: 130)

- Canonical tokens
  - USDC: `0x078d782b760474a361DDa0AF3839290B0eF57Ad6`
    - Source: Unichain Docs (Contract Addresses), Uniswap App (ETH/USDC pool page)
  - WETH (wrapped native): `0x4200000000000000000000000000000000000006` (commonly used on OP-stack chains)
    - Note: Unichain docs do not yet publish an explicit “WETH” entry; this is the standard wrapped native address pattern. Update if Unichain publishes a different canonical wrapper.

- Curated v4 pools (from Uniswap App)
  - ETH/USDC v4 0.05%
    - PoolId: `0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9`
    - Token0/Token1: WETH-like above and USDC (ordering by address)
    - Fee: 500 (0.05%)
    - TickSpacing: 10 (v3 mapping; v4 mirrors this mapping)
    - Source: https://app.uniswap.org/explore/pools/unichain/0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9

- Core/periphery addresses
  - PoolManager: `0x1f98400000000000000000000000000000000004`
  - PositionManager: `0x4529A01C7a0410167C5740c487A8DE60232617bF`
  - StateView: `0x86e8631a016f9068C3F085fAf484ee3F5FdEE8F2`
  - Quoter: `0x333E3c607b141B18Ff6De9F258Db6E77Fe7491E0`
  - UniversalRouter: `0xeF740Bf23acAE26F6492b10de645D6b98dc8eAF3`
  - Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`
  - Source: Unichain Docs (Contract Addresses)

## Unichain Sepolia (chainId: 1301)

- Canonical tokens
  - WETH9: `0x4200000000000000000000000000000000000006`
  - USDC : `0x31d0220469e10c4E71834a79b1f276d740d3768F`
  - Source: Unichain Docs (Contract Addresses), Blockscout

- Curated default pool
  - WETH/USDC v4 0.30%
    - Fee: 3000
    - TickSpacing: 60

- Core/periphery addresses (as used in tests)
  - PoolManager: `0x00B036B58a818B1BC34d502D3fE730Db729e62AC`
  - PositionManager: `0xf969Aee60879C54bAAed9F3eD26147Db216Fd664`
  - StateView: `0xc199F1072a74D4e905ABa1A84d9a45E2546B6222`
  - Quoter: `0x56DCD40A3F2d466F48e7F48bDBE5Cc9B92Ae4472`
  - UniversalRouter: `0xf70536B3bcC1bD1a972dc186A2cf84cC6da6Be5D`
  - Permit2: `0x000000000022D473030F116dDEE9F6B43aC78BA3`

## Sources
- Unichain Docs (Contract Addresses): https://docs.unichain.org/docs/technical-information/contract-addresses
- Unichain Docs (Network Information): https://docs.unichain.org/docs/technical-information/network-information
- Unichain Sepolia Blockscout Tokens: https://unichain-sepolia.blockscout.com/tokens
- Uniswap App (Unichain Pools): https://app.uniswap.org/explore/pools/unichain
- ETH/USDC Unichain Pool: https://app.uniswap.org/explore/pools/unichain/0x3258f413c7a88cda2fa8709a589d221a80f6574f63df5a5b6774485d8acc39d9
