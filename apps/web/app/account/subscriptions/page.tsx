import { currentUser } from "@clerk/nextjs/server";

export default async function SubscriptionsPage() {
  const user = await currentUser();
  return (
    <section className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Subscriptions</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user ? `Hi ${user.firstName ?? user.username ?? "there"}. Manage your active subscriptions here.` : "You must be signed in to view your subscriptions."}
      </p>
      <div className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
        {/* Placeholder content */}
        <div>No active subscriptions.</div>
      </div>
    </section>
  );
}
