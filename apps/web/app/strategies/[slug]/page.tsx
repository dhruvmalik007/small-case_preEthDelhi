import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStrategy, strategies } from "@/data/strategies";
import { StrategyDetail } from "@/components/strategy/StrategyDetail";

export function generateStaticParams() {
  return strategies.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const s = getStrategy(params.slug);
  if (!s) return { title: "Strategy | DeFi Smallcases" };
  return { title: `${s.name} | DeFi Smallcases`, description: s.shortDescription };
}

export default function StrategyPage({ params }: { params: { slug: string } }) {
  const strategy = getStrategy(params.slug);
  if (!strategy) return notFound();
  return (
    <section className="container py-10 md:py-12">
      <StrategyDetail strategy={strategy} />
    </section>
  );
}
