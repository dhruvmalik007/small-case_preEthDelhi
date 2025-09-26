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
  benchmarkLabel = "Benchmark",
  benchmarkMonthly,
  className,
}: {
  strategyLabel: string;
  strategyMonthly: number[];
  benchmarkLabel?: string;
  benchmarkMonthly?: number[];
  className?: string;
}) {
  const w = 560;
  const h = 220;
  const pad = 24;

  const strat = cumulativeIndex(strategyMonthly);
  const bench = cumulativeIndex(
    benchmarkMonthly && benchmarkMonthly.length === strategyMonthly.length
      ? benchmarkMonthly
      : Array.from({ length: strategyMonthly.length }, () => 0) // flat index if no benchmark
  );

  const min = Math.min(...strat, ...bench);
  const max = Math.max(...strat, ...bench);
  const sx = (i: number) => pad + (i / Math.max(1, strat.length - 1)) * (w - pad * 2);
  const sy = (v: number) =>
    max === min ? h / 2 : h - (pad + ((v - min) / (max - min)) * (h - pad * 2));

  const path = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ");

  const lastStrat = strat[strat.length - 1];
  const lastBench = bench[bench.length - 1];
  const rel = ((lastStrat / bench[0] - lastBench / bench[0]) * 100).toFixed(1);

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border bg-card", className)}>
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-blue-500"></span>{strategyLabel}</div>
          <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500"></span>{benchmarkLabel}</div>
        </div>
        <div>
          Relative vs {benchmarkLabel}: <span className="font-medium text-foreground">{rel}%</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-[220px] w-full">
        <rect x={0} y={0} width={w} height={h} fill="transparent" />
        <path d={path(bench)} fill="none" stroke="#10b981" strokeWidth={2} />
        <path d={path(strat)} fill="none" stroke="#3b82f6" strokeWidth={2} />
      </svg>
    </div>
  );
}
