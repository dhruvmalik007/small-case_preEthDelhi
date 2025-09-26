"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fetchTokenData, getTokenSymbolFromHolding, type TokenData } from "@/lib/data-service";

function toCumulativeIndex(returnsPct: number[]) {
  const idx: number[] = [];
  let value = 1;
  for (const r of returnsPct) {
    value *= 1 + r / 100;
    idx.push(value);
  }
  return idx;
}

export function SparklineWithRealData({
  holding,
  className,
  stroke = "hsl(var(--primary))",
}: {
  holding: { protocol: string; asset: string; weightPct: number };
  className?: string;
  stroke?: string;
}) {
  const [tokenData, setTokenData] = React.useState<TokenData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchData() {
      const symbol = getTokenSymbolFromHolding(holding);
      const data = await fetchTokenData(symbol);
      setTokenData(data);
      setLoading(false);
    }
    fetchData();
  }, [holding]);

  if (loading) {
    return (
      <svg viewBox="0 0 120 36" className={cn("h-9 w-[120px]", className)}>
        <rect x="0" y="0" width="120" height="36" fill="transparent" />
        <rect x="0" y="16" width="120" height="4" fill="hsl(var(--muted))" rx="2" />
      </svg>
    );
  }

  if (!tokenData) {
    // Fallback to a flat line if no data
    return (
      <svg viewBox="0 0 120 36" className={cn("h-9 w-[120px]", className)}>
        <rect x="0" y="0" width="120" height="36" fill="transparent" />
        <line x1="0" y1="18" x2="120" y2="18" stroke="hsl(var(--muted-foreground))" strokeWidth="2" />
      </svg>
    );
  }

  // Generate a simple trend based on 24h change
  const trend = tokenData.percent_change_24h || 0;
  const data = Array.from({ length: 12 }, (_, i) => {
    const progress = i / 11;
    const baseValue = 1 + (trend / 100) * progress;
    const noise = (Math.random() - 0.5) * 0.02; // Add some noise
    return baseValue + noise;
  });

  const width = 120;
  const height = 36;
  const padding = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const scaleX = (i: number) => padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
  const scaleY = (v: number) => {
    if (max === min) return height / 2;
    return height - (padding + ((v - min) / (max - min)) * (height - padding * 2));
  };
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  const positive = data[data.length - 1] >= data[0];
  const finalStroke = positive ? "hsl(var(--primary))" : "hsl(var(--destructive))";

  return (
    <div className="relative group">
      <div className="bg-card rounded-lg p-3 border shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-8 w-[100px]", className)}>
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={finalStroke} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={finalStroke} stopOpacity="0.4"/>
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke="url(#sparklineGradient)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle 
            cx={scaleX(data.length - 1)} 
            cy={scaleY(data[data.length - 1])} 
            r="3" 
            fill="hsl(var(--background))" 
            stroke={finalStroke} 
            strokeWidth={2} 
            className="drop-shadow-sm cursor-pointer hover:r-4 transition-all duration-200"
          />
        </svg>
        {/* Enhanced Tooltip */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
          <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 min-w-[80px]">
            <div className="text-center">
              <div className={`text-sm font-bold ${
                positive 
                  ? 'text-primary' 
                  : 'text-destructive'
              }`}>
                {data[data.length - 1].toFixed(2)}
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Sparkline({
  returnsPct,
  className,
  stroke = "hsl(var(--primary))",
}: {
  returnsPct: number[];
  className?: string;
  stroke?: string;
}) {
  const data = toCumulativeIndex(returnsPct);
  const width = 120;
  const height = 36;
  const padding = 4;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const scaleX = (i: number) => padding + (i / Math.max(1, data.length - 1)) * (width - padding * 2);
  const scaleY = (v: number) => {
    if (max === min) return height / 2;
    return height - (padding + ((v - min) / (max - min)) * (height - padding * 2));
  };
  const d = data
    .map((v, i) => `${i === 0 ? "M" : "L"}${scaleX(i)},${scaleY(v)}`)
    .join(" ");

  const positive = data[data.length - 1] >= data[0];

  return (
    <div className="relative group">
      <div className="bg-card rounded-lg p-3 border shadow-sm">
        <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-8 w-[100px]", className)}>
          <defs>
            <linearGradient id="sparklineGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={stroke} stopOpacity="0.8"/>
              <stop offset="100%" stopColor={stroke} stopOpacity="0.4"/>
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke="url(#sparklineGradient2)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          <circle 
            cx={scaleX(data.length - 1)} 
            cy={scaleY(data[data.length - 1])} 
            r="3" 
            fill="hsl(var(--background))" 
            stroke={positive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} 
            strokeWidth={2} 
            className="drop-shadow-sm cursor-pointer hover:r-4 transition-all duration-200"
          />
        </svg>
        {/* Enhanced Tooltip */}
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-10">
          <div className="bg-popover border border-border rounded-lg shadow-lg px-3 py-2 min-w-[80px]">
            <div className="text-center">
              <div className={`text-sm font-bold ${
                positive 
                  ? 'text-primary' 
                  : 'text-destructive'
              }`}>
                {data[data.length - 1].toFixed(2)}
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-popover"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
