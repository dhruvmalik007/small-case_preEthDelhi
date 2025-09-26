import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(1000px_400px_at_50%_-10%,hsl(var(--primary)/0.15),transparent)]" />
      <div className="container py-16 md:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Curated DeFi <span className="bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-400 bg-clip-text text-transparent">smallcases</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover themed baskets of DeFi strategies: lending, liquid staking, perps yield, stable savings, and more.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild>
              <Link href="/strategies">Explore strategies</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="#featured">View featured</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
