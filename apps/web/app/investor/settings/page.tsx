import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function InvestorSettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");
  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus !== "completed") redirect("/investor/kyc");

  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
      <p className="text-sm text-muted-foreground">Update your preferences.</p>
    </section>
  );
}
