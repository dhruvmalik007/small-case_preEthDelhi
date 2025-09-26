"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function MonthlyReturnsChart({
  monthlyReturns,
  className,
}: {
  monthlyReturns: number[];
  className?: string;
}) {
  const maxHeight = 100;
  const maxValue = Math.max(...monthlyReturns.map(Math.abs));
  const scale = maxValue > 0 ? maxHeight / maxValue : 1;

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  // Tooltip state
  const [hoveredBar, setHoveredBar] = React.useState<{index: number, value: number, month: string} | null>(null);

  return (
    <div className={cn("w-full space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Monthly Returns</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg border border-primary/20">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-primary font-medium">Best: {Math.max(...monthlyReturns).toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-lg border border-destructive/20">
            <div className="w-2 h-2 rounded-full bg-destructive"></div>
            <span className="text-destructive font-medium">Worst: {Math.min(...monthlyReturns).toFixed(1)}%</span>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="bg-card rounded-xl p-6 border shadow-sm">
        <div className="grid grid-cols-12 gap-3">
          {monthlyReturns.map((returnValue, idx) => {
            const height = Math.abs(returnValue) * scale;
            const isPositive = returnValue >= 0;
            const barColor = isPositive 
              ? "bg-gradient-to-t from-primary to-primary/80" 
              : "bg-gradient-to-t from-destructive to-destructive/80";
            
            return (
              <div key={idx} className="flex flex-col items-center gap-2 group">
                <div className="relative flex flex-col items-center w-full">
                  {/* Bar container */}
                  <div className="w-full flex flex-col items-center justify-end h-24 mb-2">
                    <div
                      className={`w-8 rounded-lg ${barColor} shadow-sm transition-all duration-300 hover:shadow-md group-hover:scale-105 cursor-pointer`}
                      style={{ 
                        height: `${Math.max(height, 4)}px`,
                        minHeight: returnValue === 0 ? "2px" : "4px"
                      }}
                      onMouseEnter={() => setHoveredBar({
                        index: idx,
                        value: returnValue,
                        month: months[idx]
                      })}
                      onMouseLeave={() => setHoveredBar(null)}
                    />
                  </div>
                </div>
                
                {/* Month label */}
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {months[idx]}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Custom Tooltip */}
        {hoveredBar && (
          <div className="absolute z-10 pointer-events-none">
            <div className="bg-popover border border-border rounded-lg shadow-lg p-3 min-w-[100px]">
              <div className="text-center">
                <div className="text-sm font-semibold text-popover-foreground mb-1">
                  {hoveredBar.month}
                </div>
                <div className={`text-lg font-bold ${
                  hoveredBar.value >= 0 ? 'text-primary' : 'text-destructive'
                }`}>
                  {hoveredBar.value.toFixed(1)}
                </div>
              </div>
              {/* Tooltip arrow */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-popover border-r border-b border-border rotate-45"></div>
            </div>
          </div>
        )}
        
        {/* Axis Labels */}
        <div className="mt-4 flex justify-between items-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Y-Axis: Monthly Return (%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>X-Axis: Months</span>
          </div>
        </div>
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
          <div className="text-sm text-primary font-medium mb-1">Average Return</div>
          <div className="text-2xl font-bold text-primary">
            {(monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length).toFixed(1)}%
          </div>
        </div>
        <div className="bg-secondary/5 rounded-xl p-4 border border-secondary/20">
          <div className="text-sm text-secondary-foreground font-medium mb-1">Volatility</div>
          <div className="text-2xl font-bold text-secondary-foreground">
            {Math.sqrt(
              monthlyReturns.reduce((acc, val) => acc + Math.pow(val - (monthlyReturns.reduce((a, b) => a + b, 0) / monthlyReturns.length), 2), 0) / monthlyReturns.length
            ).toFixed(1)}%
          </div>
        </div>
        <div className="bg-accent/5 rounded-xl p-4 border border-accent/20">
          <div className="text-sm text-accent-foreground font-medium mb-1">Positive Months</div>
          <div className="text-2xl font-bold text-accent-foreground">
            {monthlyReturns.filter(r => r > 0).length}/{monthlyReturns.length}
          </div>
        </div>
      </div>
    </div>
  );
}
