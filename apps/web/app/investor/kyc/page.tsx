import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { KYCWizard } from "../_components/KYCWizard";
import Link from "next/link";

export default async function InvestorKYCPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");
  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus === "completed") redirect("/investor");

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Verify your identity</h1>
        <p className="mt-1 text-sm text-muted-foreground">Complete KYC to start investing. This only takes a few minutes.</p>
      </div>
      <div className="rounded-md border p-3 text-sm">
        Prefer privacy-preserving verification with e-passport? Try Safe Passport.
        <Link href="/investor/kyc/self-verify" className="ml-2 text-blue-600 hover:underline">Verify with Self</Link>
      </div>
      <KYCWizard />
    </section>
  );
}
