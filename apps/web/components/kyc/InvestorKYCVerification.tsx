"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSelfVerification } from '@/lib/self-verification';
import { SELF_CONFIG } from '@/lib/self-config';
import { Loader2 } from 'lucide-react';

interface InvestorKYCVerificationProps {
  onVerificationComplete?: (verified: boolean) => void;
}

export default function InvestorKYCVerification({ onVerificationComplete }: InvestorKYCVerificationProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Create provider and verification service
  const provider = new ethers.JsonRpcProvider(SELF_CONFIG.rpcUrl);
  const { verifyInvestorKYC, getVerificationStatus, getSelfAppConfig } = useSelfVerification(provider, signer || undefined);

  // Get wallet connection
  useEffect(() => {
    const getWalletConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            const provider = new ethers.BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            setSigner(signer);
          }
        } catch (error) {
          console.error('Error getting wallet connection:', error);
        }
      }
    };

    getWalletConnection();
  }, []);

  // Check verification status on mount
  useEffect(() => {
    if (address && isInitialLoad) {
      checkVerificationStatus();
      checkLocalStorageVerification();
      setIsInitialLoad(false);
    }
  }, [address, isInitialLoad]);

  // Check for verification data from Self app callback
  const checkLocalStorageVerification = () => {
    try {
      const verificationData = localStorage.getItem('self_verification_data');
      if (verificationData) {
        const data = JSON.parse(verificationData);
        if (data.verified) {
          console.log('Found verification data in localStorage:', data);
          setIsVerified(true);
          setVerificationStatus({
            clientVerified: true,
            nationality: data.nationality || 'Unknown',
            lastVerified: data.timestamp || Date.now()
          });
          
          if (onVerificationComplete) {
            onVerificationComplete(true);
          }
          
          // Clear the data after using it
          localStorage.removeItem('self_verification_data');
        }
      }
    } catch (err) {
      console.error('Error checking localStorage verification:', err);
    }
  };

  const checkVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus(address!);
      setVerificationStatus(status);
      setIsVerified(status.clientVerified);
      // Don't call onVerificationComplete on initial load
      // Only call it when user actively completes verification
      console.log('Verification status checked:', status);
    } catch (err) {
      console.error('Error checking verification status:', err);
      // Don't set verification to false on error, just log it
    }
  };

  const connectWallet = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer = await provider.getSigner();
          setSigner(signer);
        }
      } else {
        setError('Please install MetaMask or another Web3 wallet');
      }
    } catch (error) {
      setError('Failed to connect wallet');
      console.error('Wallet connection error:', error);
    }
  };

  const handleSelfVerification = async () => {
    if (!address || !signer) {
      setError('Please connect your wallet first');
      return;
    }

    if (isVerifying) {
      console.log('Verification already in progress, ignoring click');
      return;
    }

    console.log('Starting Self verification for:', address);
    
    setIsVerifying(true);
    setError(null);

    try {
      // Get Self app configuration
      const selfConfig = getSelfAppConfig();
      console.log('Self App Config:', selfConfig);
      
      // Validate configuration
      if (!selfConfig.appId || selfConfig.appId === '0x1234567890123456789012345678901234567890') {
        throw new Error('Self App ID not configured. Please set up your Self Protocol credentials.');
      }
      
      if (!selfConfig.verificationConfigId || selfConfig.verificationConfigId === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        throw new Error('Verification Config ID not set. Please generate and deploy your verification config using Self Tools.');
      }
      
      // Build Self app URL with proper parameters
      const params = new URLSearchParams({
        appId: selfConfig.appId,
        contract: selfConfig.verificationContract,
        chainId: selfConfig.verificationChainId.toString(),
        scope: selfConfig.verificationScope,
        action: selfConfig.verificationAction.toString(),
        configId: selfConfig.verificationConfigId,
        callback: selfConfig.callbackUrl,
        minAge: selfConfig.minAge.toString(),
        ofacLevel: selfConfig.ofacLevel.toString(),
        requiredDocuments: selfConfig.requiredDocuments.join(','),
        allowedCountries: selfConfig.allowedCountries.join(',')
      });
      
      const selfAppUrl = `${SELF_CONFIG.selfAppUrl}?${params.toString()}`;
      
      console.log('Redirecting to Self app:', selfAppUrl);
      
      // Redirect to Self app for verification
      window.location.href = selfAppUrl;
      return;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setIsVerifying(false);
    }
  };


  if (isVerified) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-green-600">✅ KYC Verified</CardTitle>
          <CardDescription>
            Your identity has been successfully verified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Investor Verified
            </Badge>
            {verificationStatus?.nationality && (
              <Badge variant="outline">
                {verificationStatus.nationality}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground text-center">
            You can now access investment strategies and make investments.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle>Investor KYC Verification</CardTitle>
        <CardDescription>
          Verify your identity to access investment strategies
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">What you'll need:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Valid passport or government ID</li>
            <li>• Self app installed on your phone</li>
            <li>• Be 18+ years old</li>
          </ul>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Verification process:</h4>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Scan your passport with Self app</li>
            <li>2. Complete age and OFAC verification</li>
            <li>3. Submit proof to blockchain</li>
          </ol>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!address ? (
          <Button 
            onClick={connectWallet}
            className="w-full"
          >
            Connect Wallet
          </Button>
        ) : (
          <Button 
            onClick={handleSelfVerification}
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Start KYC Verification'
            )}
          </Button>
        )}

        {address && (
          <div className="p-2 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xs text-green-600 text-center">
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          </div>
        )}
        
        <div className="space-y-2 text-xs text-muted-foreground text-center">
          <p>Contract: {SELF_CONFIG.verificationContract.slice(0, 6)}...{SELF_CONFIG.verificationContract.slice(-4)}</p>
          <p>Chain: Celo Testnet (Alfajores) - {SELF_CONFIG.verificationChainId}</p>
          <p>Self App: {SELF_CONFIG.selfAppUrl}</p>
          <p>Scope Seed: {SELF_CONFIG.scopeSeed}</p>
          <p>App ID: {SELF_CONFIG.selfAppId?.slice(0, 10)}...</p>
          <p>Config ID: {SELF_CONFIG.clientConfigId?.slice(0, 10)}...</p>
          <p>Callback: {typeof window !== 'undefined' ? window.location.origin + '/investor/kyc/self-verify/callback' : 'N/A'}</p>
        </div>

        {/* Configuration Status */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Configuration Required</h4>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• Set NEXT_PUBLIC_SELF_APP_ID in environment variables</p>
            <p>• Set NEXT_PUBLIC_SELF_CLIENT_CONFIG_ID in environment variables</p>
            <p>• Generate config using <a href="https://tools.self.xyz/" target="_blank" rel="noopener noreferrer" className="underline">Self Tools</a></p>
            <p>• Deploy verification config to get Config ID</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
