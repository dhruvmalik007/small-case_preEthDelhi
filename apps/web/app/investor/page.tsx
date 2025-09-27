import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UnlinkKYC } from "@/components/kyc/unlink-kyc";
import { Shield } from "lucide-react";

export default async function InvestorDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");

  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus !== "completed") redirect("/investor/kyc");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Welcome {user.firstName ?? user.username ?? "Investor"}.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Open Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>PnL (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            KYC Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Your KYC verification is active and linked to your account.
              </p>
            </div>
            <UnlinkKYC />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
