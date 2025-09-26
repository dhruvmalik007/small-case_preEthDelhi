import { Hero } from "@/components/sections/hero";
import { PricingSection } from "@/components/sections/pricing";
import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <section id="featured" className="container py-12 md:py-16">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Invest in Curated Strategies</h2>
            <p className="text-sm text-muted-foreground">Browse and invest from the investor Portal.</p>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6 text-sm">
          <p>
            Strategy listings and investing are now available under the investor Portal. Head over to
            {" "}
            <Link href="/investor/strategies" className="font-medium underline">/investor/strategies</Link>
            {" "}
            to explore and subscribe.
          </p>
        </div>
      </section>
      <PricingSection />
    </div>
  );
}
