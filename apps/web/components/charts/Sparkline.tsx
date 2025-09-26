"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function toCumulativeIndex(returnsPct: number[]) {
  const idx: number[] = [];
  let value = 1;
  for (const r of returnsPct) {
    value *= 1 + r / 100;
    idx.push(value);
  }
  return idx;
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
    <svg viewBox={`0 0 ${width} ${height}`} className={cn("h-9 w-[120px]", className)}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={2} />
      <circle cx={scaleX(data.length - 1)} cy={scaleY(data[data.length - 1])} r={2.5} fill={positive ? "hsl(var(--primary))" : "hsl(var(--destructive))"} />
    </svg>
  );
}
