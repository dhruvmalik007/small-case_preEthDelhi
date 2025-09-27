import { SELF_CONFIG } from "../self-config";

// Contract ABI for SafePassport
export const SAFE_PASSPORT_ABI = [
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "clientVerified",
    "outputs": [{"name": "ok", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "pmVerified", 
    "outputs": [{"name": "ok", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "lastNationality",
    "outputs": [{"name": "nationality", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "configId", "type": "bytes32"},
      {"name": "minAge", "type": "uint256"},
      {"name": "countryRestrictions", "type": "bool[]"},
      {"name": "ofacLevel", "type": "uint256"}
    ],
    "name": "createVerificationConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "minAge", "type": "uint256"},
      {"name": "countryRestrictions", "type": "bool[]"},
      {"name": "ofacLevel", "type": "uint256"}
    ],
    "name": "generateConfigId",
    "outputs": [{"name": "configId", "type": "bytes32"}],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "user", "type": "address"},
      {"name": "configId", "type": "bytes32"}
    ],
    "name": "assignUserConfig",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"name": "user", "type": "address"}],
    "name": "getUserConfig",
    "outputs": [
      {
        "components": [
          {"name": "minAge", "type": "uint256"},
          {"name": "countryRestrictions", "type": "bool[]"},
          {"name": "ofacLevel", "type": "uint256"},
          {"name": "isActive", "type": "bool"}
        ],
        "name": "config",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"name": "scopeSeed", "type": "string"},
      {"name": "contractAddress", "type": "address"}
    ],
    "name": "generateScope",
    "outputs": [{"name": "scope", "type": "uint256"}],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;

export const SAFE_PASSPORT_CONTRACT = {
  address: SELF_CONFIG.verificationContract as `0x${string}`,
  abi: SAFE_PASSPORT_ABI,
  chainId: SELF_CONFIG.verificationChainId,
} as const;

// Helper functions for contract interactions
export class SafePassportContract {
  static getContractAddress(): string {
    return SELF_CONFIG.verificationContract;
  }

  static isDeployed(): boolean {
    return SELF_CONFIG.verificationContract !== "0x0000000000000000000000000000000000000000";
  }

  static generateConfigId(minAge: number, countryRestrictions: boolean[], ofacLevel: number): string {
    // This would be called on the contract, but we can pre-calculate for UI
    return "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join("");
  }

  static getClientConfigId(): string {
    const config = SELF_CONFIG.VERIFICATION_CONFIGS.CLIENT;
    return this.generateConfigId(config.minAge, config.countryRestrictions, config.ofacLevel);
  }

  static getPMConfigId(): string {
    const config = SELF_CONFIG.VERIFICATION_CONFIGS.PM;
    return this.generateConfigId(config.minAge, config.countryRestrictions, config.ofacLevel);
  }
}
