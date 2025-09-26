"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Strategy } from "@/data/strategies";
import { useRouter } from "next/navigation";

type PlanKey = "6m" | "12m";

const planLabels: Record<PlanKey, string> = {
  "6m": "6 months",
  "12m": "12 months (best value)",
};

export function SubscribeDialog({ strategy }: { strategy: Strategy }) {
  const [open, setOpen] = React.useState(false);
  const [plan, setPlan] = React.useState<PlanKey>("12m");
  const [amount, setAmount] = React.useState<number>(strategy.minInvestmentUSD);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const onContinue = async () => {
    setError(null);
    if (!amount || amount < strategy.minInvestmentUSD) {
      setError(`Minimum investment is $${strategy.minInvestmentUSD.toFixed(2)}.`);
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/investments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategySlug: strategy.slug, plan, amountUsd: amount }),
      });
      if (res.status === 401) {
        setError("Please sign in as an investor and complete KYC to subscribe.");
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? "Failed to start subscription.");
        return;
      }
      const j = await res.json();
      // Optimistically navigate the current tab to portfolio while the checkout opens in this tab
      // and users can return to see the position listed after payment.
      if (j?.billingUrl) {
        window.location.href = j.billingUrl as string;
      } else {
        router.push("/investor/portfolio");
      }
    } catch (e: any) {
      setError(e?.message ?? "Unexpected error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Subscribe Now</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subscribe to {strategy.name}</DialogTitle>
          <DialogDescription>Select a plan and amount to start your subscription.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium">Select a plan</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {(["6m", "12m"] as PlanKey[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`rounded-md border px-3 py-2 text-sm ${plan === p ? "border-primary bg-primary/10" : "hover:bg-muted"}`}
                >
                  {planLabels[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Amount to invest (USD)</div>
            <input
              type="number"
              min={strategy.minInvestmentUSD}
              step={10}
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value))}
              className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="mt-1 text-xs text-muted-foreground">Minimum: ${strategy.minInvestmentUSD.toFixed(2)}</div>
          </div>
          {error && <div className="rounded-md border border-red-300 bg-red-50 p-2 text-xs text-red-700">{error}</div>}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={onContinue} disabled={submitting}>
              {submitting ? "Redirecting..." : "Continue"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
