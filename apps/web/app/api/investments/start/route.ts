import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Normalize auth across versions
    const authResult: any = typeof (auth as any) === "function" ? await (auth as any)() : (auth as any);
    const userId: string | undefined = authResult?.userId;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Body params
    const { strategySlug, plan, amountUsd } = await req.json();
    if (!strategySlug || !amountUsd) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    // Normalize clerk client instance across versions
    const maybeClient: any = clerkClient as unknown as any;
    const client: any = typeof maybeClient === "function" ? await maybeClient() : maybeClient;

    // Fetch current user for metadata merge
    const user: any = await client.users.getUser(userId);
    const publicMetadata: any = (user?.publicMetadata as any) ?? {};
    const kycStatus: string | undefined = publicMetadata?.kycStatus as any;
    if (kycStatus !== "completed") {
      return NextResponse.json({ error: "KYC must be completed to subscribe." }, { status: 403 });
    }

    const investments: any[] = Array.isArray(publicMetadata?.investments) ? [...publicMetadata.investments] : [];
    const id = `inv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const newInvestment = {
      id,
      strategySlug,
      plan: String(plan ?? "12m"),
      amountUsd: Number(amountUsd),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    investments.push(newInvestment);

    await client.users.updateUser(userId, {
      publicMetadata: {
        ...publicMetadata,
        investments,
      },
    });

    // Attempt to create a Clerk Billing session (Stripe-hosted portal/checkout)
    let billingUrl: string | undefined = undefined;
    try {
      const billingApi = (client as any)?.billing?.sessions;
      if (billingApi && typeof billingApi.createBillingSession === "function") {
        const session = await billingApi.createBillingSession({ userId });
        billingUrl = session?.url as string | undefined;
      }
    } catch (err) {
      // Fallback to internal subscriptions page if Billing API unavailable
      billingUrl = "/account/subscriptions";
    }

    return NextResponse.json({ ok: true, billingUrl, investment: newInvestment });
  } catch (err) {
    console.error("/api/investments/start error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
