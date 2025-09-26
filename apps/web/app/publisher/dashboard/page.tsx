import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";

export default async function PublisherDashboardPage() {
  const user = await currentUser();

  return (
    <section className="container py-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Publisher Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {user ? `Welcome ${user.firstName ?? user.username ?? "Publisher"}.` : "You must be signed in."}
          </p>
        </div>
        <Link href="/strategies" className="text-sm text-blue-600 hover:underline">Browse strategies</Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Your Strategies</h3>
          <p className="mt-1 text-sm text-muted-foreground">No strategies yet. Publish your first one.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Subscribers</h3>
          <p className="mt-1 text-sm text-muted-foreground">Coming soon.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Payments</h3>
          <p className="mt-1 text-sm text-muted-foreground">Connect payouts to start earning.</p>
        </div>
        <div className="rounded-lg border p-6">
          <h3 className="font-medium">Verify as RIA</h3>
          <p className="mt-1 text-sm text-muted-foreground">Complete PM verification using Safe Passport.</p>
          <Link href="/publisher/dashboard/self-verify" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Start verification</Link>
        </div>
      </div>
    </section>
  );
}
