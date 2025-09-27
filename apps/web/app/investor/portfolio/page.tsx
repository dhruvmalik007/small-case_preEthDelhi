import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getStrategy } from "@/data/strategies";
import { formatCurrencyUSD } from "@/lib/format";
import { clerkClient } from "@clerk/nextjs/server";

export default async function investorPortfolioPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in/investor");
  const kycStatus = (user.publicMetadata as any)?.kycStatus as string | undefined;
  if (kycStatus !== "completed") redirect("/investor/kyc");

  let investments = ((user.publicMetadata as any)?.investments as any[] | undefined) ?? [];

  // Optional activation via returnUrl parameter (demo flow without webhooks)
  const activateId = typeof searchParams?.activate === "string" ? searchParams?.activate : undefined;
  if (activateId) {
    const maybeClient: any = (clerkClient as unknown) as any;
    const client: any = typeof maybeClient === "function" ? await maybeClient() : maybeClient;
    const updated = investments.map((inv) => (inv.id === activateId ? { ...inv, status: "active" } : inv));
    investments = updated;
    await client.users.updateUser(user.id, {
      publicMetadata: { ...(user.publicMetadata as any), investments: updated },
    });
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your active and pending strategy subscriptions.</p>
      </div>

      {investments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holding yet.</p>
      ) : (
        <Table>
          <TableCaption>Investments are stored against your Clerk profile metadata for this demo.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Strategy</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Min Investment</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {investments.map((inv: any) => {
              const s = getStrategy(inv.strategySlug);
              return (
                <TableRow key={inv.id ?? inv.strategySlug}>
                  <TableCell className="font-medium">{s?.name ?? inv.strategySlug}</TableCell>
                  <TableCell>{inv.plan?.toUpperCase?.() ?? inv.plan}</TableCell>
                  <TableCell>{formatCurrencyUSD(Number(inv.amountUsd ?? 0))}</TableCell>
                  <TableCell>
                    <span className={`rounded-md px-2 py-0.5 text-xs ${inv.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {inv.status ?? "pending"}
                    </span>
                  </TableCell>
                  <TableCell>{s ? formatCurrencyUSD(s.minInvestmentUSD) : "—"}</TableCell>
                  <TableCell>{inv.createdAt ? new Date(inv.createdAt).toLocaleString() : "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
