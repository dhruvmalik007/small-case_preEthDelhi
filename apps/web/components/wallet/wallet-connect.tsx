"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut, Copy, Check, User } from "lucide-react";
import { useState } from "react";

export function WalletConnect() {
    const { ready, authenticated, user: privyUser, login, logout } = usePrivy();
    const { user: clerkUser, isSignedIn } = useUser();
    const [copied, setCopied] = useState(false);

    // Handle case when Privy is not configured
    if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
        return (
            <Button variant="outline" disabled>
                <Wallet className="h-4 w-4 mr-2" />
                Wallet (Configure Privy)
            </Button>
        );
    }

    // Check if user is logged in with Clerk but not connected to wallet
    if (isSignedIn && !authenticated) {
        return (
            <Button onClick={login} variant="outline">
                <User className="h-4 w-4 mr-2" />
                Connect Wallet
            </Button>
        );
    }

    // Check if user is not logged in with Clerk
    if (!isSignedIn) {
        return (
            <Button variant="outline" disabled>
                <User className="h-4 w-4 mr-2" />
                Sign In Required
            </Button>
        );
    }

    const copyAddress = async () => {
        if (privyUser?.wallet?.address) {
            await navigator.clipboard.writeText(privyUser.wallet.address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    if (!ready) {
        return (
            <Button variant="outline" disabled>
                <Wallet className="h-4 w-4 mr-2" />
                Loading...
            </Button>
        );
    }

    // Show wallet connection status when both Clerk and Privy are authenticated
    if (isSignedIn && authenticated) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    onClick={copyAddress}
                    className="gap-2"
                >
                    {copied ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <Copy className="h-4 w-4" />
                    )}
                    {privyUser?.wallet?.address && formatAddress(privyUser.wallet.address)}
                </Button>
                <Button onClick={logout} variant="ghost" size="sm">
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    // Fallback for other states
    return (
        <Button variant="outline" disabled>
            <Wallet className="h-4 w-4 mr-2" />
            Connect Wallet
        </Button>
    );
}
