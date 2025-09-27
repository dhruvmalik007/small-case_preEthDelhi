import { ethers } from 'ethers';
import { SELF_CONFIG, getCurrentScope, type VerificationStatus, type UserVerificationData } from './self-config';

// Self SDK imports (you'll need to install @selfxyz/qrcode)
// import { SelfAppBuilder } from '@selfxyz/qrcode';

// SafePassport Contract ABI (minimal interface)
const SAFE_PASSPORT_ABI = [
  "function verifySelfProof(bytes calldata proofPayload, bytes calldata userContextData) external",
  "function clientVerified(address user) external view returns (bool)",
  "function pmVerified(address user) external view returns (bool)",
  "function lastNationality(address user) external view returns (string)",
  "event ClientVerified(address indexed user, string nationality)",
  "event PMVerified(address indexed user, string nationality)"
];

export class SelfVerificationService {
  private contract: ethers.Contract;
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
    this.contract = new ethers.Contract(
      SELF_CONFIG.verificationContract,
      SAFE_PASSPORT_ABI,
      signer || provider
    );
  }

  /**
   * Verify investor KYC onchain using Self protocol
   * @param userAddress - User's wallet address
   * @param proofData - Proof data from Self app
   */
  async verifyInvestorKYC(
    userAddress: string,
    proofData: {
      proofPayload: string;
      userContextData: string;
    }
  ): Promise<boolean> {
    try {
      if (!this.signer) {
        throw new Error("Signer required for onchain verification");
      }

      // Encode user data for investor verification (Action Code 1)
      const userData = this.encodeUserData(SELF_CONFIG.ACTIONS.CLIENT_VERIFICATION, "0x0000000000000000000000000000000000000000000000000000000000000000");
      
      // Call the contract's verifySelfProof function
      const tx = await this.contract.verifySelfProof(
        proofData.proofPayload,
        userData
      );

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log("KYC verification successful:", receipt.transactionHash);
        return true;
      } else {
        console.error("KYC verification failed");
        return false;
      }
    } catch (error) {
      console.error("Error during KYC verification:", error);
      return false;
    }
  }

  /**
   * Check verification status for a user
   * @param userAddress - User's wallet address
   */
  async getVerificationStatus(userAddress: string): Promise<VerificationStatus> {
    try {
      const [clientVerified, pmVerified, nationality] = await Promise.all([
        this.contract.clientVerified(userAddress),
        this.contract.pmVerified(userAddress),
        this.contract.lastNationality(userAddress)
      ]);

      return {
        clientVerified,
        pmVerified,
        nationality: nationality || undefined,
        lastVerified: Date.now()
      };
    } catch (error) {
      console.error("Error checking verification status:", error);
      return {
        clientVerified: false,
        pmVerified: false
      };
    }
  }

  /**
   * Listen for verification events
   * @param userAddress - User's wallet address
   * @param callback - Callback function for events
   */
  onVerificationEvent(
    userAddress: string,
    callback: (event: { type: 'ClientVerified' | 'PMVerified', nationality: string }) => void
  ) {
    const clientFilter = this.contract.filters.ClientVerified(userAddress);
    const pmFilter = this.contract.filters.PMVerified(userAddress);

    this.contract.on(clientFilter, (user, nationality) => {
      callback({ type: 'ClientVerified', nationality });
    });

    this.contract.on(pmFilter, (user, nationality) => {
      callback({ type: 'PMVerified', nationality });
    });
  }

  /**
   * Encode user data for verification
   * @param actionCode - Action code (1 or 2)
   * @param accessCode - Access code (32 bytes)
   */
  private encodeUserData(actionCode: number, accessCode: string): string {
    const userData = new Uint8Array(33);
    userData[0] = actionCode;
    
    // Convert access code to bytes
    const accessCodeBytes = ethers.getBytes(accessCode);
    userData.set(accessCodeBytes, 1);
    
    return ethers.hexlify(userData);
  }

  /**
   * Get Self app configuration for frontend integration
   */
  getSelfAppConfig() {
    const currentScope = getCurrentScope();
    
    return {
      // Self V2 Configuration
      appName: SELF_CONFIG.appName,
      appIcon: SELF_CONFIG.appIcon,
      appDescription: SELF_CONFIG.appDescription,
      
      // Verification Configuration
      verificationContract: SELF_CONFIG.verificationContract,
      verificationChainId: SELF_CONFIG.verificationChainId,
      verificationScope: currentScope, // Use generated scope
      verificationAction: SELF_CONFIG.ACTIONS.CLIENT_VERIFICATION,
      verificationConfigId: SELF_CONFIG.clientConfigId,
      
      // Self Hub Configuration
      selfHubAddress: SELF_CONFIG.selfHubAddress,
      endpointType: SELF_CONFIG.endpointType,
      selfAppUrl: SELF_CONFIG.selfAppUrl,
      
      // Verification Requirements (based on Self Tools example)
      verificationType: 'client', // or 'pm' for portfolio manager verification
      requiredDocuments: ['passport'], // Required document types
      allowedCountries: [], // Empty array = allow all countries
      minAge: 18, // Minimum age requirement
      maxAge: 100, // Maximum age requirement
      
      // OFAC Compliance (based on Self Tools)
      ofacLevel: 1, // Basic OFAC screening
      
      // Flow Configuration
      flowType: 'kyc', // 'kyc' or 'age_verification'
      callbackUrl: typeof window !== 'undefined' ? window.location.origin + '/investor/kyc/self-verify/callback' : '',
      
      // Self V2 specific fields
      rpcUrl: SELF_CONFIG.rpcUrl,
      actions: SELF_CONFIG.ACTIONS,
      scope: SELF_CONFIG.scope,
    };
  }

  /**
   * Get SelfAppBuilder configuration for on-chain verification
   * Must match the contract's verification config exactly
   */
  getSelfAppBuilderConfig() {
    return {
      // SelfAppBuilder configuration - Based on Self docs
      appName: SELF_CONFIG.appName,
      scope: SELF_CONFIG.scope,
      endpoint: SELF_CONFIG.verificationContract,
      endpointType: SELF_CONFIG.endpointType,
      userId: "", // Will be set when user connects wallet
      userIdType: "hex", // "uuid" or "hex"
      version: 2, // V2 configuration
      
      // V2 Disclosures - Must match contract config exactly
      disclosures: {
        // Passport data fields - must match contract's UnformattedVerificationConfigV2
        date_of_birth: true,
        nationality: true,
        name: true,
        issuing_state: true,
        passport_number: true,
        gender: true,
        expiry_date: true,
        
        // Verification rules - must match contract config
        minimumAge: 18, // matches contract's olderThan: 18
        excludedCountries: [], // matches contract's forbiddenCountries: []
        ofac: true // matches contract's ofacEnabled: [true, false, false]
      },
      
      // Development mode
      devMode: true, // Set to false for production
      userDefinedData: "", // Optional: custom data passed to contract
    };
  }
}

// Hook for React components
export function useSelfVerification(provider: ethers.Provider, signer?: ethers.Signer) {
  const verificationService = new SelfVerificationService(provider, signer);
  
  return {
    verifyInvestorKYC: verificationService.verifyInvestorKYC.bind(verificationService),
    getVerificationStatus: verificationService.getVerificationStatus.bind(verificationService),
    onVerificationEvent: verificationService.onVerificationEvent.bind(verificationService),
    getSelfAppConfig: verificationService.getSelfAppConfig.bind(verificationService),
    getSelfAppBuilderConfig: verificationService.getSelfAppBuilderConfig.bind(verificationService)
  };
}
