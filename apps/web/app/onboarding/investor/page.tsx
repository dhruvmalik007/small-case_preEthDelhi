"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePrivy } from "@privy-io/react-auth";

export default function InvestorOnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID as string | undefined;
  const [status, setStatus] = useState<"idle" | "working" | "done" | "error">("idle");
  const [message, setMessage] = useState<string>("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [homeAddress, setHomeAddress] = useState("");

  useEffect(() => {
    let aborted = false;
    async function run() {
      if (!user || status !== "idle") return;
      setStatus("working");
      setMessage("Setting up your investor account...");
      try {
        const res = await fetch("/api/onboarding/investor", { method: "POST" });
        if (!res.ok) throw new Error("Failed to set metadata");
        if (aborted) return;
        setStatus("done");
        router.replace("/investor/kyc");
      } catch (e: any) {
        if (aborted) return;
        setStatus("error");
        setMessage(e.message || "An error occurred while onboarding.");
      }
    }
    run();
    return () => {
      aborted = true;
    };
  }, [user, router, status]);


function WalletLoginSection({ onOpenDetails }: { onOpenDetails: () => void }) {
  const { ready, authenticated, login } = usePrivy();
  const [loading, setLoading] = useState(false);

  async function handle() {
    try {
      setLoading(true);
      await login();
      onOpenDetails();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handle} disabled={!ready || loading} variant="default">
        {authenticated ? "Connected Wallet" : loading ? "Connecting…" : "Continue with Wallet"}
      </Button>
      <span className="text-xs text-muted-foreground">Wallet-only login powered by Privy</span>
    </div>
  );
}

  async function submitDetails() {
    try {
      // If Clerk session exists, persist role/kyc via API
      if (user) {
        const res = await fetch("/api/onboarding/investor", { method: "POST" });
        if (!res.ok) throw new Error("Failed to set metadata");
      } else {
        // Fallback: store locally so the flow continues; backend persistence will occur after Clerk sign-in
        localStorage.setItem("investor_details", JSON.stringify({ fullName, homeAddress }));
      }
      setDetailsOpen(false);
      router.replace("/investor/kyc");
    } catch (e: any) {
      setMessage(e.message || "Failed to save details");
      setStatus("error");
    }
  }

  return (
    <section className="container mx-auto max-w-xl py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Investor Onboarding</h1>
      <p className="mt-2 text-sm text-muted-foreground">Choose a sign-in method to continue.</p>

      <div className="mt-6 rounded-lg border p-4">
        <div className="flex flex-col gap-3">
          {privyAppId ? (
            <WalletLoginSection onOpenDetails={() => setDetailsOpen(true)} />
          ) : (
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Wallet login is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID to enable.
            </div>
          )}
          <div className="text-xs text-muted-foreground">or</div>
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="secondary">Sign in with Email</Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <p className="text-sm">{message || (status === "idle" ? "Waiting for session…" : "Working…")}</p>
          </SignedIn>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Personal details</DialogTitle>
            <DialogDescription>Provide your basic info to continue to KYC.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Satoshi Nakamoto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Address</label>
              <input
                value={homeAddress}
                onChange={(e) => setHomeAddress(e.target.value)}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                placeholder="Street, City, Country"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submitDetails} disabled={!fullName || !homeAddress}>Continue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
