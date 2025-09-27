"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import type { ReactNode } from "react";

interface AppPrivyProviderProps {
    children: ReactNode;
}

export function AppPrivyProvider({ children }: AppPrivyProviderProps) {
    const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

    if (!privyAppId) {
        console.warn("NEXT_PUBLIC_PRIVY_APP_ID not found. Please set up Privy configuration.");
        return <>{children}</>;
    }

    return (
        <PrivyProvider
            appId={privyAppId}
            config={{
                appearance: {
                    theme: "light",
                    accentColor: "#676FFF",
                    logo: "https://your-domain.com/logo.png",
                },
                embeddedWallets: {
                    createOnLogin: "users-without-wallets",
                },
                loginMethods: ["email", "wallet", "google", "twitter"],
            }}
        >
            {children}
        </PrivyProvider>
    );
}