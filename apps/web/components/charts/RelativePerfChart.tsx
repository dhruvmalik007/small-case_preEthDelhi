"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function cumulativeIndex(returnsPct: number[]) {
  const out: number[] = [];
  let v = 1;
  for (const r of returnsPct) {
    v *= 1 + r / 100;
    out.push(v);
  }
  return out;
}

export function RelativePerfChart({
  strategyLabel,
  strategyMonthly,
  className,
}: {
  strategyLabel: string;
  strategyMonthly: number[];
  className?: string;
}) {
  const w = 560;
  const h = 220;
  const pad = 24;

  const strat = cumulativeIndex(strategyMonthly);
  const min = Math.min(...strat);
  const max = Math.max(...strat);
  const sx = (i: number) => pad + (i / Math.max(1, strat.length - 1)) * (w - pad * 2);
  const sy = (v: number) =>
    max === min ? h / 2 : h - (pad + ((v - min) / (max - min)) * (h - pad * 2));

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ");

  const lastStrat = strat[strat.length - 1];
  const totalReturn = ((lastStrat - 1) * 100).toFixed(1);

  // Tooltip state
  const [hoveredPoint, setHoveredPoint] = React.useState<{index: number, value: number, x: number, y: number} | null>(null);

  return (
    <div className={cn("w-full overflow-hidden rounded-xl border bg-card shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary shadow-sm"></div>
            <span className="font-semibold text-foreground">{strategyLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg shadow-sm border">
          <span className="text-sm text-muted-foreground">Total Return</span>
          <span className="text-lg font-bold text-foreground">{totalReturn}%</span>
        </div>
      </div>
      
      {/* Chart Area */}
      <div className="p-6">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-[240px] w-full">
          <defs>
            {/* Gradient for the line */}
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6"/>
            </linearGradient>
            
            {/* Area gradient */}
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02"/>
            </linearGradient>
            
            {/* Grid pattern */}
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="hsl(var(--muted))" strokeWidth="0.5"/>
            </pattern>
          </defs>
          
          {/* Background */}
          <rect x={0} y={0} width={w} height={h} fill="transparent" />
          
          {/* Grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y-axis lines */}
          <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth="1"/>
          <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="hsl(var(--border))" strokeWidth="1"/>
          
          {/* Y-axis labels */}
          <text x="12" y="25" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="start" className="font-medium">
            {max.toFixed(2)}
          </text>
          <text x="12" y="125" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="start" className="font-medium">
            {((min + max) / 2).toFixed(2)}
          </text>
          <text x="12" y="215" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="start" className="font-medium">
            {min.toFixed(2)}
          </text>
          
          {/* X-axis labels */}
          <text x="24" y="230" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="middle" className="font-medium">0</text>
          <text x="280" y="230" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="middle" className="font-medium">6M</text>
          <text x="536" y="230" fontSize="11" fill="hsl(var(--muted-foreground))" textAnchor="middle" className="font-medium">12M</text>
          
          {/* Area under curve */}
          <path d={`${path(strat)} L ${sx(strat.length - 1)},${h - pad} L ${pad},${h - pad} Z`} fill="url(#areaGradient)" />
          
          {/* Chart line */}
          <path d={path(strat)} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Data points with hover tooltips */}
          {strat.map((value, index) => {
            if (index % 2 === 0 || index === strat.length - 1) {
              return (
                <g key={index} className="cursor-pointer">
                  <circle 
                    cx={sx(index)} 
                    cy={sy(value)} 
                    r="4" 
                    fill="hsl(var(--background))" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth="2" 
                    className="drop-shadow-sm hover:r-6 transition-all duration-200"
                    onMouseEnter={() => setHoveredPoint({
                      index,
                      value,
                      x: sx(index),
                      y: sy(value)
                    })}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            }
            return null;
          })}
          
          {/* Custom Tooltip */}
          {hoveredPoint && (
            <g>
              {/* Tooltip background */}
              <rect
                x={hoveredPoint.x - 50}
                y={hoveredPoint.y - 35}
                width="100"
                height="30"
                rx="8"
                fill="hsl(var(--popover))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                className="drop-shadow-lg"
              />
              {/* Tooltip content */}
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 20}
                textAnchor="middle"
                fontSize="12"
                fill="hsl(var(--popover-foreground))"
                className="font-semibold"
              >
                Month {hoveredPoint.index + 1}
              </text>
              <text
                x={hoveredPoint.x}
                y={hoveredPoint.y - 8}
                textAnchor="middle"
                fontSize="14"
                fill="hsl(var(--popover-foreground))"
                className="font-bold"
              >
                {hoveredPoint.value.toFixed(2)}
              </text>
              {/* Tooltip arrow */}
              <polygon
                points={`${hoveredPoint.x - 6},${hoveredPoint.y - 5} ${hoveredPoint.x + 6},${hoveredPoint.y - 5} ${hoveredPoint.x},${hoveredPoint.y + 1}`}
                fill="hsl(var(--popover))"
                stroke="hsl(var(--border))"
                strokeWidth="1"
              />
            </g>
          )}
        </svg>
        
        {/* Axis Labels */}
        <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Y-Axis: Cumulative Return</span>
          </div>
          <div className="flex items-center gap-2">
            <span>X-Axis: Time (Months)</span>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">Start: <span className="font-semibold text-foreground">{strat[0].toFixed(2)}</span></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-muted-foreground">End: <span className="font-semibold text-foreground">{strat[strat.length - 1].toFixed(2)}</span></span>
            </div>
          </div>
          <div className="text-muted-foreground text-xs">
            Data from CoinMarketCap
          </div>
        </div>
      </div>
    </div>
  );
}
