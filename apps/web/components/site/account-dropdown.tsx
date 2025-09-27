"use client";

import * as React from "react";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, SignOutButton, useUser } from "@clerk/nextjs";
import { KYCStatus } from "@/components/kyc/kyc-status";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  User,
  FileText,
  HelpCircle,
  MessageSquare,
  ClipboardList,
  Shield,
} from "lucide-react";

export function AccountDropdown() {
  const { user } = useUser();
  const displayName = user?.fullName || user?.primaryEmailAddress?.emailAddress || "Not logged in";
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role as
    | "investor"
    | "publisher"
    | undefined;

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
        <div className="px-3 py-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">Accounts</DropdownMenuLabel>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Investor Account</div>
                {role === "investor" ? (
                  <Link href="/investor" className="text-xs text-blue-600 hover:underline">Go to dashboard</Link>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Link href="/sign-in/investor" className="text-blue-600 hover:underline">Connect Investor Account</Link>
                    <span className="px-1">·</span>
                    <Link href="/sign-up/investor" className="hover:underline">Sign up</Link>
                  </div>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Publisher Account</div>
                {role === "publisher" ? (
                  <Link href="/publisher/dashboard" className="text-xs text-blue-600 hover:underline">Go to dashboard</Link>
                ) : (
                  <div className="text-xs text-muted-foreground">
                    <Link href="/sign-in/publisher" className="text-blue-600 hover:underline">Setup publisher</Link>
                    <span className="px-1">·</span>
                    <Link href="/sign-up/publisher" className="hover:underline">Sign up</Link>
                  </div>
                )}
              </div>
              <div className="h-8 w-8 rounded-full bg-muted" />
            </div>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-3 py-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">Personal Info</DropdownMenuLabel>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span className="text-muted-foreground">{displayName}</span>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="text-blue-600 hover:underline">Log in</button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link href="/user" className="text-blue-600 hover:underline">Edit</Link>
              </SignedIn>
            </div>
            <SignedIn>
              <div className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span className="text-muted-foreground">KYC Status</span>
                <KYCStatus />
              </div>
            </SignedIn>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-3 py-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">Activity</DropdownMenuLabel>
          <div className="mt-2 space-y-1">
            <DropdownMenuItem asChild>
              <Link href="/account/orders" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <ClipboardList className="h-4 w-4" /> Orders
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/investor/kyc" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <Shield className="h-4 w-4" /> KYC Status
              </Link>
            </DropdownMenuItem>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-3 py-2">
          <DropdownMenuLabel className="px-0 py-0 text-[11px] uppercase tracking-wide">Resources</DropdownMenuLabel>
          <div className="mt-2 space-y-1">
            <DropdownMenuItem asChild>
              <Link href="/docs" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <FileText className="h-4 w-4" /> Docs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/support/faqs" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <HelpCircle className="h-4 w-4" /> FAQs
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/support/chat" className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
                <MessageSquare className="h-4 w-4" /> Chat with us
              </Link>
            </DropdownMenuItem>
          </div>
        </div>

        <DropdownMenuSeparator />

        <div className="px-3 py-2">
          <div className="space-y-1">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
                  {/* Using generic icon from lucide-react User */}
                  <User className="h-4 w-4" /> Log In
                </button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <SignOutButton>
                <button className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent">
                  <User className="h-4 w-4" /> Log Out
                </button>
              </SignOutButton>
            </SignedIn>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
