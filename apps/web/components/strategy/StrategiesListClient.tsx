"use client";

import * as React from "react";
import { Strategy, strategies as allStrategies, StrategyCategory, RiskLevel } from "@/data/strategies";
import { StrategyCardWithRealData } from "@/components/strategy/StrategyCardWithRealData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RelativePerfChart } from "@/components/charts/RelativePerfChart";
import { defaultBenchmarkFor } from "@/data/strategies";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrencyUSD, formatPct } from "@/lib/format";

const categories: StrategyCategory[] = [
  "Lending",
  "Liquid Staking",
  "DEX LP",
  "Perps Yield",
  "Stable Savings",
  "Restaking",
  "Cross-Chain Yield",
  "RWA",
  "Points Farming",
  "Index/Beta",
];

const risks: RiskLevel[] = ["Conservative", "Moderate", "Aggressive"];

type SortKey = "featured" | "apy_desc" | "risk_asc";

export function StrategiesListClient() {
  const [query, setQuery] = React.useState("");
  const [activeCategories, setActiveCategories] = React.useState<Set<StrategyCategory>>(new Set());
  const [activeRisks, setActiveRisks] = React.useState<Set<RiskLevel>>(new Set());
  const [sort, setSort] = React.useState<SortKey>("featured");
  const [hoveredSlug, setHoveredSlug] = React.useState<string | null>(null);

  const toggleCategory = (c: StrategyCategory) => {
    setActiveCategories((s) => {
      const next = new Set(s);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };
  const toggleRisk = (r: RiskLevel) => {
    setActiveRisks((s) => {
      const next = new Set(s);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });
  };

  const strategies = React.useMemo(() => {
    let s = allStrategies.slice();
    if (query.trim()) {
      const q = query.toLowerCase();
      s = s.filter(
        (x) =>
          x.name.toLowerCase().includes(q) ||
          x.shortDescription.toLowerCase().includes(q) ||
          x.category.toLowerCase().includes(q)
      );
    }
    if (activeCategories.size) {
      s = s.filter((x) => activeCategories.has(x.category));
    }
    if (activeRisks.size) {
      s = s.filter((x) => activeRisks.has(x.riskLevel));
    }
    if (sort === "apy_desc") {
      s.sort((a, b) => b.expectedAPYRange.max - a.expectedAPYRange.max);
    } else if (sort === "risk_asc") {
      const order: Record<RiskLevel, number> = {
        Conservative: 0,
        Moderate: 1,
        Aggressive: 2,
      };
      s.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
    }
    return s;
  }, [query, activeCategories, activeRisks, sort]);

  // Keep a selected/hovered strategy for charts and dialogs
  const selected = React.useMemo(() => {
    if (!strategies.length) return null;
    const byHover = hoveredSlug && strategies.find((s) => s.slug === hoveredSlug);
    return byHover ?? strategies[0];
  }, [hoveredSlug, strategies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1">
          <label className="text-sm text-muted-foreground">Search</label>
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search by name, category..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex items-end gap-3">
          <div>
            <label className="text-sm text-muted-foreground">Sort</label>
            <select
              className="mt-1 rounded-md border bg-background px-3 py-2 text-sm"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="featured">Featured</option>
              <option value="apy_desc">APY (High to Low)</option>
              <option value="risk_asc">Risk (Low to High)</option>
            </select>
          </div>
          <Button variant="outline" onClick={() => { setQuery(""); setActiveCategories(new Set()); setActiveRisks(new Set()); setSort("featured"); }}>Reset</Button>
        </div>
      </div>

      {selected && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              Selected: <span className="font-medium text-foreground">{selected.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">Methodology</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Methodology — {selected.name}</DialogTitle>
                    <DialogDescription>{selected.shortDescription}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="leading-relaxed">{selected.longDescription}</p>
                    <div>
                      <div className="font-medium">Why it works</div>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {selected.whyItWorks.map((w, i) => (<li key={i}>{w}</li>))}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium">Key risks</div>
                      <ul className="mt-1 list-disc space-y-1 pl-5">
                        {selected.keyRisks.map((w, i) => (<li key={i}>{w}</li>))}
                      </ul>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">Factsheet</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Factsheet — {selected.name}</DialogTitle>
                    <DialogDescription>{selected.shortDescription}</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 text-sm md:grid-cols-2">
                    <div>
                      <div className="text-muted-foreground">Minimum Investment</div>
                      <div className="font-medium">{formatCurrencyUSD(selected.minInvestmentUSD)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Rebalancing</div>
                      <div className="font-medium">{selected.rebalancing}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Fees</div>
                      <div className="font-medium">Mgmt {formatPct(selected.fees.managementPct)}, Perf {formatPct(selected.fees.performancePct)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Risk / Volatility</div>
                      <div className="font-medium">{selected.riskLevel} / {selected.volatility}</div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-muted-foreground">Chains</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.chains.map((c) => (<Badge key={c} variant="outline" className="font-normal">{c}</Badge>))}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <div className="text-muted-foreground">Protocols</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {selected.protocols.map((p) => (<Badge key={p} variant="outline" className="font-normal">{p}</Badge>))}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <RelativePerfChart
            strategyLabel={selected.name}
            strategyMonthly={selected.backtest.monthlyReturns1Y}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Categories:</span>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => toggleCategory(c)}
              className={`text-xs ${activeCategories.has(c) ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} rounded-md px-2.5 py-1 transition-colors`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Risk:</span>
          {risks.map((r) => (
            <Badge
              key={r}
              onClick={() => toggleRisk(r)}
              className={`cursor-pointer ${activeRisks.has(r) ? "bg-primary text-primary-foreground" : ""}`}
              variant={activeRisks.has(r) ? "default" : "outline"}
            >
              {r}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {strategies.map((s: Strategy) => (
          <StrategyCardWithRealData key={s.slug} strategy={s} onHover={(x) => setHoveredSlug(x.slug)} />
        ))}
      </div>

      {strategies.length === 0 && (
        <div className="rounded-lg border bg-card p-10 text-center text-sm text-muted-foreground">
          No strategies match your filters.
        </div>
      )}
    </div>
  );
}
