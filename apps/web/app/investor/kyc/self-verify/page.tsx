"use client";

import React, { useCallback, useEffect, useState } from "react";
import { SafePassportWidget } from "@/components/self/SafePassportWidget";

export default function InvestorSelfVerifyPage() {
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Silent detection and event wiring
  useEffect(() => {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined);
    if (!eth) {
      setHasProvider(false);
      setLoading(false);
      return;
    }
    setHasProvider(true);

    let mounted = true;
    (async () => {
      try {
        const [accounts, cid] = await Promise.all([
          eth.request({ method: "eth_accounts" }),
          eth.request({ method: "eth_chainId" }).catch(() => null),
        ]);
        if (!mounted) return;
        setAddress(accounts?.[0] ?? null);
        if (cid) setChainId(cid);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onAccountsChanged = (accts: string[]) => {
      setAddress(accts?.[0] ?? null);
    };
    const onChainChanged = (cid: string) => {
      setChainId(cid);
    };

    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);

    return () => {
      mounted = false;
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined);
    if (!eth) return;
    try {
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      setAddress(accounts?.[0] ?? null);
      const cid: string = await eth.request({ method: "eth_chainId" });
      setChainId(cid ?? null);
    } catch (e) {
      // user rejected or error
    }
  }, []);

  return (
    <section className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify with Safe Passport</h1>
        <p className="mt-1 text-sm text-muted-foreground">Prove you are 18+ and not OFAC-sanctioned using your e-passport.</p>
      </div>

      {!hasProvider && (
        <div className="rounded-md border p-3 text-sm text-red-600">No injected wallet detected. Install MetaMask or a compatible wallet.</div>
      )}

      {hasProvider && !address && (
        <button
          type="button"
          onClick={connect}
          className="inline-flex h-10 items-center justify-center rounded-md border bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          disabled={loading}
        >
          {loading ? "Checking wallet…" : "Connect Wallet"}
        </button>
      )}

      {address && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Connected {address.slice(0, 6)}…{address.slice(-4)} {chainId ? `(chain ${parseInt(chainId, 16)})` : ""}
          </div>
          <SafePassportWidget mode="client" userAddress={address} />
        </div>
      )}
    </section>
  );
}
