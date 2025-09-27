// Self Protocol Configuration for DeFi Smallcases
export const SELF_CONFIG = {
    // Contract Configuration - Deployed SafePassport contract
    verificationContract: process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS || "0x420CbF7f02F4f566Fe3D5E53BF79aCA1725d1bc8",
    verificationChainId: parseInt(process.env.NEXT_PUBLIC_SAFE_PASSPORT_CHAIN_ID || "44787"), // Celo Alfajores Testnet
    
    // App Configuration
    appName: process.env.NEXT_PUBLIC_APP_NAME || "DeFi Smallcases",
    appIcon: "/logo.png", // Update with your app icon
    appDescription: "Decentralized investment strategies for DeFi",
    
    // Verification Configuration - Self Tools compatible
    verificationScope: process.env.NEXT_PUBLIC_APP_SCOPE || "defi-smallcases", // Your application scope
    scopeSeed: process.env.NEXT_PUBLIC_APP_SCOPE || "defi-smallcases", // For scope generation
    
    // Self Hub Configuration - Celo Alfajores Testnet
    selfHubAddress: process.env.NEXT_PUBLIC_SELF_HUB_ADDRESS || "0x16ECBA51e18a4a7e61fdC417f0d47AFEeDfbed74", // Celo Alfajores testnet hub
    endpointType: process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE || "staging_celo",
    
    // Scope Configuration - Generated using Self Tools method
    scope: process.env.NEXT_PUBLIC_APP_SCOPE || "defi-smallcases", // Your application identifier
    
    // RPC Configuration - Celo Alfajores Testnet
    rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org",
    
    // Self App Configuration - Use staging playground for testing
    selfAppUrl: "https://playground.staging.self.xyz",
    
    // Action Codes
    ACTIONS: {
      CLIENT_VERIFICATION: 1, // Age + OFAC verification
      PM_VERIFICATION: 2,     // KYC + RIA certification
    },
    
    // Verification Configs - Self Tools compatible
    VERIFICATION_CONFIGS: {
      CLIENT: {
        minAge: 18,
        ofacLevel: 1,
        countryRestrictions: [], // No restrictions
      },
      PM: {
        minAge: 21,
        ofacLevel: 2,
        countryRestrictions: [], // No restrictions
      },
    },
  } as const;
  
  // Verification status types
  export type VerificationStatus = {
    clientVerified: boolean;
    pmVerified: boolean;
    nationality?: string;
    lastVerified?: number;
  };
  
  // User data structure for verification
  export type UserVerificationData = {
    actionCode: number;
    accessCode: string;
    userAddress: string;
  };
  
  // Get the current scope for this app
  export function getCurrentScope(): string {
    return SELF_CONFIG.scope;
  }