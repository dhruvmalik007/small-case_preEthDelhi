"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield } from "lucide-react";
import type { Strategy } from "@/data/strategies";
import { formatPct, formatCurrencyUSD } from "@/lib/format";
import { SparklineWithRealData } from "@/components/charts/SparklineWithRealData";
import { WatchlistButton } from "@/components/strategy/WatchlistButton";
import { fetchMultipleTokens, calculateStrategyPerformance, getTokenSymbolFromHolding } from "@/lib/data-service";
import { useEffect, useState } from "react";

export function StrategyCardWithRealData({ 
  strategy, 
  onHover 
}: { 
  strategy: Strategy; 
  onHover?: (s: Strategy) => void;
}) {
  const [realTimePerformance, setRealTimePerformance] = useState<{
    totalReturn: number;
    weightedReturn: number;
    monthlyReturns: number[];
    currentValue: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // Get unique token symbols from holdings
      const tokenSymbols = Array.from(
        new Set(
          strategy.holdings.map(holding => 
            getTokenSymbolFromHolding(holding)
          )
        )
      );

      // Fetch data for all tokens
      const tokenData = await fetchMultipleTokens(tokenSymbols);

      // Calculate strategy performance
      const performance = calculateStrategyPerformance(strategy.holdings, tokenData);
      setRealTimePerformance(performance);
      
      setLoading(false);
    }

    fetchData();
  }, [strategy]);

  const apy = `${strategy.expectedAPYRange.min.toFixed(1)}–${strategy.expectedAPYRange.max.toFixed(1)}%`;
  
  return (
    <Card
      className="group h-full overflow-hidden bg-card border shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
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
        <div className="mb-4">
          {loading ? (
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">Live Performance</span>
                <div className={`text-xs font-bold px-2 py-1 rounded-full ${
                  realTimePerformance && realTimePerformance.totalReturn >= 0
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-destructive/10 text-destructive border border-destructive/20'
                }`}>
                  {realTimePerformance ? 
                    `${realTimePerformance.totalReturn.toFixed(1)}%` : 
                    "Loading..."
                  }
                </div>
              </div>
              <SparklineWithRealData 
                holding={strategy.holdings[0]} // Use first holding for sparkline
              />
            </div>
          )}
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
            <div className="text-muted-foreground">
              {loading ? "Loading..." : "Real-time"}
            </div>
            <div className="font-medium">
              {loading ? "..." : realTimePerformance ? formatPct(realTimePerformance.totalReturn) : formatPct(strategy.historicalAPYOneYear)}
            </div>
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
        {loading && (
          <div className="mt-2 text-xs text-muted-foreground">
            Loading real-time data from CoinMarketCap...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
