import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StrategiesListClient } from "@/components/strategy/StrategiesListClient";

export const metadata = { title: "Investor Strategies | DeFi Smallcases" };

export default async function InvestorStrategiesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");
  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus !== "completed") redirect("/investor/kyc");

  return (
    <section className="container py-10 md:py-12">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Strategies</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse curated baskets and subscribe to invest.
        </p>
      </div>
      <StrategiesListClient />
    </section>
  );
}
