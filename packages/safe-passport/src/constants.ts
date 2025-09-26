export const DEFAULT_MIN_AGE = 18;
export const DEFAULT_ENDPOINT_TYPE = 'staging_celo' as const; // or 'celo'

// Action codes for dynamic configs
export const ACTION = {
  CLIENT_VERIFY: 1, // verify age + ofac + not sanctioned
  PM_VERIFY: 2,     // KYC jurisdiction + RIA license
} as const;

export type ActionCode = typeof ACTION[keyof typeof ACTION];

export const ZERO_BYTES32 = '0x0000000000000000000000000000000000000000000000000000000000000000';

// Known Self Hub addresses (from docs)
export const HUB_ADDRESSES = {
  celo: '0xe57F4773bd9c9d8b6Cd70431117d353298B9f5BF',
  staging_celo: '0x68c931C9a534D37aa78094877F46fE46a49F1A51',
} as const;

export type EndpointType = keyof typeof HUB_ADDRESSES;
