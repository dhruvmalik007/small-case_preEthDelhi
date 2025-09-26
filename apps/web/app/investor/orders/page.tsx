import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function InvestorOrdersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");
  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus !== "completed") redirect("/investor/kyc");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <p className="text-sm text-muted-foreground">No orders yet.</p>
    </section>
  );
}
