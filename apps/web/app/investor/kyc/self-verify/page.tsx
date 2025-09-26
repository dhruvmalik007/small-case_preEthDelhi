"use client";

import React, { useEffect, useState } from "react";
import { SafePassportWidget } from "@/components/self/SafePassportWidget";

export default function InvestorSelfVerifyPage() {
  const [address, setAddress] = useState<`0x${string}` | "">("");

  useEffect(() => {
    async function detect() {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        try {
          const accounts: string[] = await (window as any).ethereum.request({ method: "eth_requestAccounts" });
          if (accounts?.[0]) setAddress(accounts[0] as `0x${string}`);
        } catch {}
      }
    }
    detect();
  }, []);

  return (
    <section className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify with Safe Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prove you are 18+ and not OFAC-sanctioned using your e-passport.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Your Wallet Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value as `0x${string}`)}
          placeholder="0x..."
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </div>

      {address ? (
        <SafePassportWidget mode="client" userAddress={address} />
      ) : (
        <p className="text-sm text-muted-foreground">Connect your wallet or paste your address to continue.</p>
      )}
    </section>
  );
}
