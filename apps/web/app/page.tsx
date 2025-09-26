import { Hero } from "@/components/sections/hero";
import { StrategyCardWithRealData } from "@/components/strategy/StrategyCardWithRealData";
import { strategies } from "@/data/strategies";
import { PricingSection } from "@/components/sections/pricing";

export default function HomePage() {
  const featured = strategies.slice(0, 8);
  return (
    <div>
      <Hero />
      <section id="featured" className="container py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Featured Strategies</h2>
            <p className="text-sm text-muted-foreground">Handpicked baskets with real-time market data from CoinMarketCap.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {featured.map((s) => (
            <StrategyCardWithRealData key={s.slug} strategy={s} />
          ))}
        </div>
      </section>
      <PricingSection />
    </div>
  );
}
