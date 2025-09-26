"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield } from "lucide-react";
import type { Strategy } from "@/data/strategies";
import { formatPct, formatCurrencyUSD } from "@/lib/format";
import { Sparkline } from "@/components/charts/Sparkline";
import { WatchlistButton } from "@/components/strategy/WatchlistButton";

export function StrategyCard({ strategy, onHover }: { strategy: Strategy; onHover?: (s: Strategy) => void }) {
  const apy = `${strategy.expectedAPYRange.min.toFixed(1)}–${strategy.expectedAPYRange.max.toFixed(1)}%`;
  return (
    <Card
      className="group h-full overflow-hidden"
      onMouseEnter={() => onHover?.(strategy)}
      onFocus={() => onHover?.(strategy)}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{strategy.category}</Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" /> {strategy.riskLevel}
          </div>
        </div>
        <CardTitle className="text-lg">
          <Link href={`/strategies/${strategy.slug}`} className="line-clamp-1 hover:underline">
            {strategy.name}
          </Link>
        </CardTitle>
        <p className="line-clamp-2 text-sm text-muted-foreground">{strategy.shortDescription}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-3">
          <Sparkline returnsPct={strategy.backtest.monthlyReturns1Y} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <div className="text-muted-foreground">Expected APY</div>
              <div className="font-medium">{apy}</div>
            </div>
          </div>
          <div className="text-sm">
            <div className="text-muted-foreground">1Y APY (hist.)</div>
            <div className="font-medium">{formatPct(strategy.historicalAPYOneYear)}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="text-sm">
              <div className="text-muted-foreground">Minimum</div>
              <div className="font-medium">{formatCurrencyUSD(strategy.minInvestmentUSD)}</div>
            </div>
            <WatchlistButton slug={strategy.slug} />
            <Button asChild size="sm">
              <Link href={`/strategies/${strategy.slug}`}>View</Link>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {strategy.chains.slice(0, 3).map((c) => (
            <Badge key={c} variant="outline" className="font-normal">
              {c}
            </Badge>
          ))}
          {strategy.chains.length > 3 ? (
            <Badge variant="outline">+{strategy.chains.length - 3}</Badge>
          ) : null}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="line-clamp-1">
            Investor: <span className="font-medium text-foreground">{strategy.investor?.name ?? "DeFi Smallcases"}</span>
          </div>
          <div className="hidden gap-2 sm:flex">
            {strategy.tags.slice(0, 2).map((t) => (
              <span key={t} className="rounded bg-muted px-2 py-0.5">{t}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
