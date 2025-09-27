"use client";

import { useUser } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import Link from "next/link";

interface KYCStatusProps {
    showAlert?: boolean;
    className?: string;
}

export function KYCStatus({ showAlert = false, className = "" }: KYCStatusProps) {
    const { user, isSignedIn } = useUser();

    // Mock KYC status - in real implementation, this would come from your database
    const getKYCStatus = () => {
        if (!isSignedIn || !user) {
            return { status: "not_signed_in", verified: false };
        }

        // Check if user has completed KYC based on metadata or database
        const kycStatus = user.publicMetadata?.kycStatus as string;

        // Debug logging
        console.log("KYC Status Debug:", {
            isSignedIn,
            userId: user?.id,
            kycStatus,
            publicMetadata: user.publicMetadata
        });

        if (kycStatus === "completed" || kycStatus === "VERIFIED") {
            return { status: "verified", verified: true };
        } else if (kycStatus === "PENDING") {
            return { status: "pending", verified: false };
        } else if (kycStatus === "REJECTED") {
            return { status: "rejected", verified: false };
        } else {
            return { status: "not_verified", verified: false };
        }
    };

    const kycInfo = getKYCStatus();

    if (!showAlert) {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {kycInfo.verified ? (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        KYC Verified
                    </Badge>
                ) : (
                    <Badge variant="outline" className="border-orange-200 text-orange-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        KYC Required
                    </Badge>
                )}
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
            </AlertDescription>
        </Alert>
    );
}

export function useKYCStatus() {
    const { user, isSignedIn } = useUser();

    const getKYCStatus = () => {
        if (!isSignedIn || !user) {
            return { status: "not_signed_in", verified: false };
        }

        const kycStatus = user.publicMetadata?.kycStatus as string;

        // Debug logging
        console.log("useKYCStatus Debug:", {
            isSignedIn,
            userId: user?.id,
            kycStatus,
            publicMetadata: user.publicMetadata
        });

        if (kycStatus === "completed" || kycStatus === "VERIFIED") {
            return { status: "verified", verified: true };
        } else if (kycStatus === "PENDING") {
            return { status: "pending", verified: false };
        } else if (kycStatus === "REJECTED") {
            return { status: "rejected", verified: false };
        } else {
            return { status: "not_verified", verified: false };
        }
    };

    return getKYCStatus();
}
