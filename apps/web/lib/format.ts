export function formatCurrencyUSD(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    value
  );
}

export function formatPct(value: number, opts: { sign?: boolean; digits?: number } = {}) {
  const { sign = false, digits = 2 } = opts;
  const formatted = value.toFixed(digits) + "%";
  if (!sign) return formatted;
  return (value >= 0 ? "+" : "") + formatted;
}

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
