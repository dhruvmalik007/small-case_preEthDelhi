"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Basic",
    monthly: 10,
    features: [
      "AI-powered analytics",
      "Basic support",
      "5 projects limit",
      "Access to basic AI tools",
    ],
  },
  {
    name: "Premium",
    monthly: 20,
    featured: true,
    features: [
      "Advanced AI insights",
      "Priority support",
      "Unlimited projects",
      "Access to all AI tools",
    ],
  },
  {
    name: "Enterprise",
    monthly: 50,
    features: [
      "Custom AI solutions",
      "24/7 dedicated support",
      "Unlimited projects",
      "Access to all AI tools",
    ],
  },
  {
    name: "Ultimate",
    monthly: 80,
    features: [
      "Bespoke AI development",
      "White-glove support",
      "Unlimited projects",
      "Priority access to new AI tools",
    ],
  },
] as const;

function currency(amount: number) {
  return `$${amount}`;
}

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="container py-16 md:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">Pricing</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-5xl">
          Simple pricing for everyone.
        </h2>
        <p className="mt-3 text-base text-muted-foreground md:text-lg">
          Choose an affordable plan that's packed with features to help you build, launch, and grow.
        </p>
        <div className="mt-6 inline-flex items-center gap-3 rounded-full border bg-background px-2 py-1 text-sm">
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={annual}
              onChange={() => setAnnual((v) => !v)}
              aria-label="Toggle annual billing"
            />
            <div className="h-6 w-11 rounded-full bg-muted after:absolute after:ml-[2px] after:mt-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
          </label>
          <span>Annual</span>
          <Badge className="rounded-full bg-black px-3 py-1 text-white dark:bg-white dark:text-black">
            2 months free ✨
          </Badge>
        </div>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {plans.map((plan) => {
          const price = annual ? plan.monthly * 10 : plan.monthly; // mock: 2 months free on annual
          return (
            <Card
              key={plan.name}
              className={[
                "flex flex-col justify-between rounded-2xl border p-6 transition-shadow",
                plan ? "shadow-[0_0_0_2px_rgb(0,0,0)] dark:shadow-[0_0_0_2px_rgb(255,255,255)]" : "",
              ].join(" ")}
            >
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-4 text-4xl font-bold">
                  {currency(price)} <span className="text-base font-medium text-muted-foreground">/ month</span>
                </p>
                <Button className="mt-4 w-full" variant={plan ? "default" : "secondary"}>
                  Subscribe
                </Button>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-0.5 rounded-full bg-emerald-500/10 p-1 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-4 w-4" />
                      </span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
