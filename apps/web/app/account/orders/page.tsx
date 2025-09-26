import { currentUser } from "@clerk/nextjs/server";

export default async function OrdersPage() {
  const user = await currentUser();
  return (
    <section className="container py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {user ? `Hello ${user.firstName ?? user.username ?? "there"}. Here are your recent orders.` : "You must be signed in to view your orders."}
      </p>
      <div className="mt-6 rounded-lg border p-6 text-sm text-muted-foreground">
        {/* Placeholder content */}
        <div>No orders yet.</div>
      </div>
    </section>
  );
}
