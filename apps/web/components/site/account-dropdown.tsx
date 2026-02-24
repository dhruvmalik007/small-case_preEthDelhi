"use client";

import * as React from "react";
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser, useSignIn } from "@clerk/nextjs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, User } from "lucide-react";
import Link from "next/link";

export function AccountDropdown() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Not logged in";

  const [address, setAddress] = React.useState<`0x${string}` | null>(null);
  const [chainId, setChainId] = React.useState<string | null>(null);
  const [hasProvider, setHasProvider] = React.useState(false);
  const { signIn, isLoaded: signInLoaded } = useSignIn();

  React.useEffect(() => {
    const eth = (typeof window !== "undefined" ? (window as any).ethereum : undefined);
    if (!eth) { setHasProvider(false); return; }
    setHasProvider(true);

    const update = async () => {
      try {
        const [accts, cid] = await Promise.all([
          eth.request({ method: "eth_accounts" }),
          eth.request({ method: "eth_chainId" }).catch(() => null),
        ]);
        setAddress(accts?.[0] ?? null);
        if (cid) setChainId(cid);
      } catch {}
    };
    update();

    const onAccountsChanged = (accts: string[]) => setAddress(accts?.[0] as `0x${string}` ?? null);
    const onChainChanged = (cid: string) => setChainId(cid);
    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const chainLabel = React.useMemo(() => {
    if (!chainId) return "Unknown";
    try {
      const id = parseInt(chainId, 16);
      if (id === 42220) return "Celo";
      if (id === 44787) return "Celo Alfajores";
      if (id === 11155111) return "Sepolia";
      return `Chain #${id}`;
    } catch { return "Unknown"; }
  }, [chainId]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Account</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 p-0">
        <SignedOut>
          <div className="px-3 py-2">
            <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">Choose Account</DropdownMenuLabel>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Investor</div>
                  <div className="text-xs text-muted-foreground">Sign in or create an investor account</div>
                </div>
                <div className="flex gap-2">
                  <SignInButton mode="modal" signUpForceRedirectUrl="/investor">
                    <button className="rounded-md border px-2 py-1 text-xs">Sign in</button>
                  </SignInButton>
                  <SignInButton mode="modal" forceRedirectUrl="/investor">
                    <button className="rounded-md border px-2 py-1 text-xs">Sign up</button>
                  </SignInButton>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Portfolio Manager</div>
                  <div className="text-xs text-muted-foreground">Sign in or create a publisher account</div>
                </div>
                <div className="flex gap-2">
                  <SignInButton mode="modal" signUpForceRedirectUrl="/publisher/onboarding">
                    <button className="rounded-md border px-2 py-1 text-xs">Sign in</button>
                  </SignInButton>
                  <SignInButton mode="modal" forceRedirectUrl="/publisher/onboarding">
                    <button className="rounded-md border px-2 py-1 text-xs">Sign up</button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="px-3 py-2">
            <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">User</DropdownMenuLabel>
            <div className="mt-2 space-y-2 rounded-md border p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="font-medium">{displayName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Network</span>
                <span className="font-medium">{hasProvider ? chainLabel : "No wallet"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Address</span>
                <span className="font-mono text-xs">{address ? `${address.slice(0, 6)}…${address.slice(-4)}` : "—"}</span>
              </div>
              <button
                disabled={!hasProvider || !signInLoaded}
                onClick={async () => {
                  if (!hasProvider || !signIn) return;
                  try {
                    const eth = (window as any).ethereum;
                    const [addr] = await eth.request({ method: 'eth_requestAccounts' });
                    const si = await signIn.create({ identifier: addr, strategy: 'web3_metamask_signature' as any });
                    const { nonce } = await (si as any).prepareVerification();
                    const signature = await eth.request({ method: 'personal_sign', params: [nonce, addr] });
                    await (si as any).attemptVerification({ signature });
                    setAddress(addr);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="inline-flex h-9 items-center justify-center rounded-md border bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                {address ? 'Re-connect Wallet' : 'Connect Wallet'}
              </button>
              <div className="flex gap-2 pt-2">
                <Link href="/investor" className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs hover:bg-accent">
                  Investor Dashboard
                </Link>
                <Link href="/publisher/dashboard" className="inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs hover:bg-accent">
                  Publisher Dashboard
                </Link>
              </div>
            </div>
          </div>

          <div className="px-3 pb-3">
            <SignOutButton>
              <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
                <User className="h-4 w-4" /> Log Out
              </button>
            </SignOutButton>
          </div>
        </SignedIn>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
