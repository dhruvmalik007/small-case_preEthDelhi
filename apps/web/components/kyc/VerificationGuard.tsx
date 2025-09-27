"use client";

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useSelfVerification } from '@/lib/self-verification';
import { SELF_CONFIG } from '@/lib/self-config';
import InvestorKYCVerification from './InvestorKYCVerification';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface VerificationGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function VerificationGuard({ children, fallback }: VerificationGuardProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  // Create provider and verification service
  const provider = new ethers.JsonRpcProvider(SELF_CONFIG.rpcUrl);
  const { getVerificationStatus } = useSelfVerification(provider, undefined);

  // Check for wallet connection
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        try {
          const accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setIsConnected(false);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
          setIsConnected(false);
        }
      } else {
        setIsConnected(false);
      }
    };

    checkWalletConnection();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      checkVerificationStatus();
    } else {
      setIsLoading(false);
      setIsVerified(false);
    }
  }, [isConnected, address]);

  const checkVerificationStatus = async () => {
    try {
      setIsLoading(true);
      const status = await getVerificationStatus(address!);
      setIsVerified(status.clientVerified);
    } catch (error) {
      console.error('Error checking verification status:', error);
      setIsVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationComplete = (verified: boolean) => {
    console.log('Verification completed:', verified);
    setIsVerified(verified);
    setShowVerification(false);
    // Don't reload the page, just update the state
    // The component will re-render and show the protected content
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Checking verification status...</p>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>Wallet Required</CardTitle>
          <CardDescription>
            Please connect your wallet to access this feature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center">
            You need to connect your wallet to verify your identity and access investment features.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!isVerified) {
    if (showVerification) {
      return (
        <div className="space-y-6">
          <InvestorKYCVerification onVerificationComplete={handleVerificationComplete} />
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => setShowVerification(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle>KYC Verification Required</CardTitle>
          <CardDescription>
            Complete identity verification to access investment strategies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What you'll get access to:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Browse investment strategies</li>
              <li>• Make investments</li>
              <li>• Track your portfolio</li>
              <li>• Access exclusive features</li>
            </ul>
          </div>

          <Button 
            onClick={() => setShowVerification(true)}
            className="w-full"
          >
            Start KYC Verification
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your verification is stored on-chain and can be used across DeFi applications
          </p>
        </CardContent>
      </Card>
    );
  }

  // User is verified, show the protected content
  return <>{children}</>;
}
