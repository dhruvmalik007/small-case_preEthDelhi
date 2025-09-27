"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

export default function SelfVerifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing verification...');
  const [verificationData, setVerificationData] = useState<any>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const success = searchParams.get('success');
        const error = searchParams.get('error');
        const proofData = searchParams.get('proofData');
        const nationality = searchParams.get('nationality');
        const userId = searchParams.get('userId');

        console.log('Self callback received:', { success, error, proofData, nationality, userId });

        if (success === 'true' && proofData) {
          // Verification successful
          setStatus('success');
          setMessage('Verification completed successfully!');
          setVerificationData({
            proofData,
            nationality,
            userId,
            timestamp: Date.now()
          });

          // Store verification data in localStorage for the main app
          localStorage.setItem('self_verification_data', JSON.stringify({
            verified: true,
            nationality,
            userId,
            timestamp: Date.now()
          }));

          // Redirect back to the main verification page after 3 seconds
          setTimeout(() => {
            router.push('/investor/kyc/self-verify');
          }, 3000);

        } else if (error) {
          // Verification failed
          setStatus('error');
          setMessage(`Verification failed: ${error}`);
        } else {
          // Unknown status
          setStatus('error');
          setMessage('Unknown verification status');
        }
      } catch (err) {
        console.error('Error processing callback:', err);
        setStatus('error');
        setMessage('Error processing verification callback');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  const handleReturn = () => {
    router.push('/investor/kyc/self-verify');
  };

  return (
    <div className="container mx-auto max-w-md py-10">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin" />}
            {status === 'success' && <CheckCircle className="h-6 w-6 text-green-600" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-red-600" />}
            Self Verification
          </CardTitle>
          <CardDescription>
            {status === 'loading' && 'Processing your verification...'}
            {status === 'success' && 'Verification completed successfully!'}
            {status === 'error' && 'Verification failed'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          {status === 'success' && verificationData && (
            <div className="space-y-2">
              <div className="flex items-center justify-center space-x-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Verified
                </Badge>
                {verificationData.nationality && (
                  <Badge variant="outline">
                    {verificationData.nationality}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Redirecting back to verification page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Badge variant="destructive">Verification Failed</Badge>
              </div>
              <Button onClick={handleReturn} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {status === 'loading' && (
            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Please wait while we process your verification...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
