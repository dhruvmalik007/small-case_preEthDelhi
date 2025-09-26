import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Strategy } from "@/data/strategies";
import { formatPct, formatCurrencyUSD } from "@/lib/format";
import { RelativePerfChart } from "@/components/charts/RelativePerfChart";
import { defaultBenchmarkFor } from "@/data/strategies";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

function HoldingsBar({ weights }: { weights: { label: string; weight: number }[] }) {
  const total = weights.reduce((a, b) => a + b.weight, 0) || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full border">
      {weights.map((w) => (
        <div
          key={w.label}
          className="h-full bg-gradient-to-r from-blue-500/70 to-cyan-400/70"
          style={{ width: `${(w.weight / total) * 100}%` }}
          title={`${w.label}: ${w.weight.toFixed(1)}%`}
        />
      ))}
    </div>
  );
}

export function StrategyDetail({ strategy }: { strategy: Strategy }) {
  const apyLabel = `${strategy.expectedAPYRange.min.toFixed(1)}–${strategy.expectedAPYRange.max.toFixed(1)}%`;
  const weights = strategy.holdings.map((h) => ({ label: `${h.protocol} ${h.asset}`.trim(), weight: h.weightPct }));

  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{strategy.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <button className="rounded-md border bg-background px-3 py-1.5 text-sm">Methodology</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Methodology — {strategy.name}</DialogTitle>
                  <DialogDescription>{strategy.shortDescription}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <p className="leading-relaxed">{strategy.longDescription}</p>
                  <div>
                    <div className="font-medium">Why it works</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {strategy.whyItWorks.map((w, i) => (<li key={i}>{w}</li>))}
                    </ul>
                  </div>
                  <div>
                    <div className="font-medium">Key risks</div>
                    <ul className="mt-1 list-disc space-y-1 pl-5">
                      {strategy.keyRisks.map((w, i) => (<li key={i}>{w}</li>))}
                    </ul>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog>
              <DialogTrigger asChild>
                <button className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground">Factsheet</button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Factsheet — {strategy.name}</DialogTitle>
                  <DialogDescription>{strategy.shortDescription}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div>
                    <div className="text-muted-foreground">Minimum Investment</div>
                    <div className="font-medium">{formatCurrencyUSD(strategy.minInvestmentUSD)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Rebalancing</div>
                    <div className="font-medium">{strategy.rebalancing}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Fees</div>
                    <div className="font-medium">Mgmt {formatPct(strategy.fees.managementPct)}, Perf {formatPct(strategy.fees.performancePct)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Risk / Volatility</div>
                    <div className="font-medium">{strategy.riskLevel} / {strategy.volatility}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Chains</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {strategy.chains.map((c) => (<Badge key={c} variant="outline" className="font-normal">{c}</Badge>))}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-muted-foreground">Protocols</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {strategy.protocols.map((p) => (<Badge key={p} variant="outline" className="font-normal">{p}</Badge>))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <RelativePerfChart
          strategyLabel={strategy.name}
          strategyMonthly={strategy.backtest.monthlyReturns1Y}
          benchmarkLabel={(strategy.benchmark ?? defaultBenchmarkFor(strategy)).label}
          benchmarkMonthly={(strategy.benchmark ?? defaultBenchmarkFor(strategy)).monthlyReturns1Y}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{strategy.name}</CardTitle>
              <CardDescription>{strategy.shortDescription}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{strategy.category}</Badge>
              <Badge variant="outline">{strategy.riskLevel}</Badge>
              <Badge variant="outline">{strategy.volatility} Vol</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <div className="text-sm text-muted-foreground">Expected APY</div>
              <div className="text-2xl font-semibold">{apyLabel}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">1Y APY (hist.)</div>
              <div className="text-2xl font-semibold">{formatPct(strategy.historicalAPYOneYear)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Max Drawdown</div>
              <div className="text-2xl font-semibold">{formatPct(strategy.maxDrawdownPct)}</div>
            </div>
          </div>
          <p className="mt-6 text-sm text-muted-foreground leading-relaxed">{strategy.longDescription}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            {strategy.tags.map((t) => (
              <Badge key={t} variant="outline" className="font-normal">{t}</Badge>
            ))}
          </div>
          {strategy.investor && (
            <div className="mt-6 rounded-md border p-4">
              <div className="text-sm text-muted-foreground">Investor</div>
              <div className="font-medium">{strategy.investor.name}</div>
              <div className="text-sm text-muted-foreground">{strategy.investor.description}</div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Holdings</CardTitle>
            <CardDescription>Protocol and asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <HoldingsBar weights={weights} />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {strategy.holdings.map((h) => (
                <div key={`${h.protocol}-${h.asset}`} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="text-sm font-medium">{h.protocol}</div>
                    <div className="text-xs text-muted-foreground">{h.asset}</div>
                  </div>
                  <div className="text-sm font-semibold">{h.weightPct.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>Operational parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Rebalancing</div>
                <div className="font-medium">{strategy.rebalancing}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Min. Investment</div>
                <div className="font-medium">{formatCurrencyUSD(strategy.minInvestmentUSD)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fees (Mgmt)</div>
                <div className="font-medium">{formatPct(strategy.fees.managementPct)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Fees (Perf)</div>
                <div className="font-medium">{formatPct(strategy.fees.performancePct)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Chains</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {strategy.chains.map((c) => (
                    <Badge key={c} variant="outline" className="font-normal">{c}</Badge>
                  ))}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-muted-foreground">Protocols</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  {strategy.protocols.map((p) => (
                    <Badge key={p} variant="outline" className="font-normal">{p}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Why it works</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {strategy.whyItWorks.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key risks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {strategy.keyRisks.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Backtest</CardTitle>
          <CardDescription>1Y summary stats</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <div className="text-sm text-muted-foreground">Cumulative 1Y</div>
              <div className="text-xl font-semibold">{formatPct(strategy.backtest.cumulativeReturn1Y)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Sharpe (approx)</div>
              <div className="text-xl font-semibold">{strategy.backtest.sharpe.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Best Month</div>
              <div className="text-xl font-semibold">{formatPct(strategy.backtest.bestMonthPct)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Worst Month</div>
              <div className="text-xl font-semibold">{formatPct(strategy.backtest.worstMonthPct)}</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-12 gap-1">
            {strategy.backtest.monthlyReturns1Y.map((m, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-3 rounded-sm ${m >= 0 ? "bg-green-500/80" : "bg-red-500/80"}`}
                  style={{ height: `${Math.min(100, Math.abs(m)) + 10}px` }}
                  title={`${m.toFixed(1)}%`}
                />
                <span className="text-[10px] text-muted-foreground">M{idx + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
