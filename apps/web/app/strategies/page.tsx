import { StrategiesListClient } from "@/components/strategy/StrategiesListClient";

export const metadata = {
  title: "Strategies | DeFi Smallcases",
};

export default function StrategiesPage() {
  return (
    <section className="container py-10 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">All Strategies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse curated baskets across lending, liquid staking, perps yield, stables, and more.
        </p>
      </div>
      <StrategiesListClient />
    </section>
  );
}
