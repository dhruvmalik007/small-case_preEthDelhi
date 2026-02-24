"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSignIn } from "@clerk/nextjs";
import { SafePassportWidget } from "@/components/self/SafePassportWidget";

type Step = 1 | 2 | 3;

export function PMOnboardingWizard() {
  const [step, setStep] = useState<Step>(1);
  const [address, setAddress] = useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [hasProvider, setHasProvider] = useState(false);
  const [loading, setLoading] = useState(true);
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  const [orgName, setOrgName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  useEffect(() => {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined);
    if (!eth) { setHasProvider(false); setLoading(false); return; }
    setHasProvider(true);

    let mounted = true;
    (async () => {
      try {
        const [accts, cid] = await Promise.all([
          eth.request({ method: "eth_accounts" }),
          eth.request({ method: "eth_chainId" }).catch(() => null),
        ]);
        if (!mounted) return;
        setAddress(accts?.[0] ?? null);
        if (cid) setChainId(cid);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    const onAccountsChanged = (accts: string[]) => setAddress(accts?.[0] ?? null);
    const onChainChanged = (cid: string) => setChainId(cid);
    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const connect = useCallback(async () => {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined);
    if (!eth || !signInLoaded || !signIn) return;
    try {
      // 1) Request wallet accounts
      const [addr] = await eth.request({ method: "eth_requestAccounts" });
      // 2) Create Clerk sign-in with Web3 strategy
      const si: any = await signIn.create({ identifier: addr, strategy: "web3_metamask_signature" as any });
      // 3) Get nonce to sign
      const { nonce } = await si.prepareVerification();
      // 4) Ask wallet to sign nonce
      const signature = await eth.request({ method: "personal_sign", params: [nonce, addr] });
      // 5) Verify signature to complete auth
      await si.attemptVerification({ signature });

      setAddress(addr as `0x${string}`);
      const cid: string = await eth.request({ method: "eth_chainId" });
      setChainId(cid ?? null);
    } catch {}
  }, [signInLoaded, signIn]);

  const chainLabel = useMemo(() => {
    if (!chainId) return "Unknown";
    try {
      const id = parseInt(chainId, 16);
      if (id === 42220) return "Celo";
      if (id === 44787) return "Celo Alfajores";
      if (id === 11155111) return "Sepolia";
      return `Chain #${id}`;
    } catch { return "Unknown"; }
  }, [chainId]);

  async function handlePMVerified() {
    // After successful Self verification, finalize onboarding with profile
    try {
      const res = await fetch("/api/onboarding/publisher/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          profile: { orgName, displayName, bio },
        }),
      });
      if (!res.ok) throw new Error("Failed to complete publisher onboarding");
      setStep(3);
    } catch (e) {
      alert((e as any)?.message || "Failed to complete onboarding");
    }
  }

  return (
    <section className="container space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Publisher Onboarding</h1>
        <p className="mt-1 text-sm text-muted-foreground">Connect your wallet, verify as a Portfolio Manager, and set up your publisher profile.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-sm">
        <div className={`rounded-full px-2 py-1 ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</div>
        <span>Connect Wallet</span>
        <div className="opacity-50">→</div>
        <div className={`rounded-full px-2 py-1 ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</div>
        <span>Verify PM</span>
        <div className="opacity-50">→</div>
        <div className={`rounded-full px-2 py-1 ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>3</div>
        <span>Profile</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Current network: {hasProvider ? chainLabel : "No wallet"}</div>
          {!hasProvider && (
            <div className="rounded-md border p-3 text-sm text-red-600">No injected wallet detected. Install MetaMask or a compatible wallet.</div>
          )}
          {hasProvider && !address && (
            <button
              type="button"
              onClick={connect}
              className="inline-flex h-10 items-center justify-center rounded-md border bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              disabled={loading || !signInLoaded}
            >
              {loading ? "Checking wallet…" : "Authenticate Wallet"}
            </button>
          )}
          {address && (
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div className="font-mono">{address.slice(0, 6)}…{address.slice(-4)}</div>
              <button
                onClick={() => setStep(2)}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                Continue
              </button>
            </div>
          )}
        </div>
      )}

      {step === 2 && address && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Scan with Self app to verify as a Portfolio Manager.</div>
          <SafePassportWidget
            mode="pm"
            userAddress={address}
            onSuccess={handlePMVerified}
            onError={() => {}}
          />
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">Set up your public publisher profile.</div>
          <div className="space-y-2">
            <label className="block text-sm">Organization Name</label>
            <input value={orgName} onChange={e => setOrgName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="space-y-2">
            <label className="block text-sm">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm"
            >Back</button>
            <a
              href="/publisher/dashboard"
              className="inline-flex h-9 items-center justify-center rounded-md border bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
            >Go to Dashboard</a>
          </div>
        </div>
      )}
    </section>
  );
}
