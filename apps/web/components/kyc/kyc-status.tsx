"use client";

import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getKYCStatusInfo, debugKYCStatus } from "@/lib/kyc-status";

interface KYCStatusProps {
    showAlert?: boolean;
    className?: string;
}

export function KYCStatus({ showAlert = false, className = "" }: KYCStatusProps) {
    const { user, isSignedIn } = useUser();

    // Use unified KYC status management
    const kycInfo = debugKYCStatus(user, isSignedIn ?? false);

    if (!showAlert) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                <Badge variant={kycInfo.badgeVariant} className={kycInfo.badgeColor}>
                    {kycInfo.verified ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                        <AlertTriangle className="h-3 w-3 mr-1" />
                    )}
                    {kycInfo.displayText}
                </Badge>
            </div>
        );
    }

    if (kycInfo.verified) {
        return null; // Don't show alert if KYC is verified
    }

    return (
        <Alert className={className}>
            <Shield className="h-4 w-4" />
            <AlertDescription>
                {kycInfo.status === "not_signed_in" && (
                    <div className="space-y-2">
                        <p>You must be signed in to invest in strategies.</p>
                        <Button asChild size="sm">
                            <Link href="/sign-in">Sign In</Link>
                        </Button>
                    </div>
                )}
                {kycInfo.status === "not_verified" && (
                    <div className="space-y-2">
                        <p>KYC verification is required to invest in strategies.</p>
                        <Button asChild size="sm">
                            <Link href="/investor/kyc">Complete KYC</Link>
                        </Button>
                    </div>
                )}
                {kycInfo.status === "pending" && (
                    <div className="space-y-2">
                        <p>Your KYC verification is pending. Please wait for approval.</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/investor/kyc">Check Status</Link>
                        </Button>
                    </div>
                )}
                {kycInfo.status === "rejected" && (
                    <div className="space-y-2">
                        <p>Your KYC verification was rejected. Please contact support.</p>
                        <Button asChild variant="outline" size="sm">
                            <Link href="/support">Contact Support</Link>
                        </Button>
                    </div>
                )}
                {kycInfo.status === "unlinked" && (
                    <div className="space-y-2">
                        <p>Your KYC verification has been unlinked from your account.</p>
                        <Button asChild size="sm">
                            <Link href="/investor/kyc">Complete KYC Again</Link>
                        </Button>
                    </div>
                )}
            </AlertDescription>
        </Alert>
    );
}

export function useKYCStatus() {
    const { user, isSignedIn } = useUser();

    // Use unified KYC status management
    return debugKYCStatus(user, isSignedIn ?? false);
}
