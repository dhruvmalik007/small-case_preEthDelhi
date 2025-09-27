"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSelfVerification } from '@/lib/self-verification';
import { SELF_CONFIG } from '@/lib/self-config';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

interface SelfAppBuilderProps {
  onVerificationComplete?: (verified: boolean) => void;
}

export default function SelfAppBuilder({ onVerificationComplete }: SelfAppBuilderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selfApp, setSelfApp] = useState<any>(null);

  // Create provider and verification service
  const provider = new ethers.JsonRpcProvider(SELF_CONFIG.rpcUrl);
  const { verifyInvestorKYC, getVerificationStatus, getSelfAppBuilderConfig } = useSelfVerification(provider, signer || undefined);

  // Initialize SelfAppBuilder
  useEffect(() => {
    const initializeSelfApp = async () => {
      try {
        // Dynamic import of SelfAppBuilder
        const { SelfAppBuilder } = await import('@selfxyz/qrcode');
        
        const config = getSelfAppBuilderConfig();
        console.log('SelfAppBuilder config:', config);
        
        // Create SelfAppBuilder instance with user's wallet address
        const configWithUserId = {
          ...config,
          userId: address, // Set the connected wallet address as userId
        };
        
        const app = new SelfAppBuilder(configWithUserId);
        
        setSelfApp(app);
      } catch (err) {
        console.error('Error initializing SelfAppBuilder:', err);
        setError('Failed to initialize Self Protocol SDK');
      }
    };

    initializeSelfApp();
  }, []);

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
    if (address) {
      checkVerificationStatus();
    }
  }, [address]);

  const checkVerificationStatus = async () => {
    try {
      const status = await getVerificationStatus(address!);
      setVerificationStatus(status);
      setIsVerified(status.clientVerified);
    } catch (err) {
      console.error('Error checking verification status:', err);
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
    if (!address || !signer || !selfApp) {
      setError('Please connect your wallet and ensure Self Protocol is initialized');
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
      // Validate configuration
      const config = getSelfAppBuilderConfig();
      
      if (!config.endpoint || config.endpoint === '0x0000000000000000000000000000000000000000') {
        throw new Error('Contract endpoint not configured. Please set NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS.');
      }

      // Use SelfAppBuilder to get verification URL
      const verificationUrl = await selfApp.getVerificationUrl();
      console.log('Self verification URL:', verificationUrl);
      
      // Open verification in new window
      const popup = window.open(
        verificationUrl,
        'self-verification',
        'width=500,height=700,scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no'
      );

      if (!popup) {
        // Fallback: redirect to Self app in same window
        console.warn('Popup blocked, redirecting to Self app');
        window.location.href = verificationUrl;
        return;
      }

      // Listen for verification completion
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== SELF_CONFIG.selfAppUrl) return;

        if (event.data.type === 'SELF_VERIFICATION_SUCCESS') {
          try {
            // Verify the proof on-chain
            const success = await verifyInvestorKYC(address, event.data.proofData);
            
            if (success) {
              setIsVerified(true);
              setVerificationStatus({
                clientVerified: true,
                nationality: event.data.nationality || 'Unknown',
                lastVerified: Date.now()
              });
              
              if (onVerificationComplete) {
                onVerificationComplete(true);
              }
            } else {
              setError('Verification failed on-chain');
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
          } finally {
            setIsVerifying(false);
            popup.close();
            window.removeEventListener('message', handleMessage);
          }
        } else if (event.data.type === 'SELF_VERIFICATION_ERROR') {
          setError(event.data.error || 'Verification failed');
          setIsVerifying(false);
          popup.close();
          window.removeEventListener('message', handleMessage);
        }
      };

      window.addEventListener('message', handleMessage);

      // Handle popup close
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', handleMessage);
          if (isVerifying) {
            setIsVerifying(false);
            setError('Verification cancelled');
          }
        }
      }, 1000);

      // Timeout after 5 minutes
      setTimeout(() => {
        if (isVerifying) {
          popup.close();
          window.removeEventListener('message', handleMessage);
          setIsVerifying(false);
          setError('Verification timeout. Please try again.');
        }
      }, 5 * 60 * 1000);

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
        <CardTitle>Self Protocol KYC Verification</CardTitle>
        <CardDescription>
          Verify your identity using Self Protocol
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
            disabled={isVerifying || !selfApp}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Start Self Verification'
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
          <p>Scope: {SELF_CONFIG.scope}</p>
        </div>

        {/* Configuration Status */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <h4 className="font-medium text-blue-900 mb-2">Configuration Required</h4>
          <div className="space-y-1 text-xs text-blue-700">
            <p>• Set NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS in environment variables</p>
            <p>• Deploy your SafePassport contract on Celo Testnet</p>
            <p>• Set scope in self-config.ts (currently: {SELF_CONFIG.scope})</p>
            <p>• No App ID or Config ID needed - Self Protocol uses contract address</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
