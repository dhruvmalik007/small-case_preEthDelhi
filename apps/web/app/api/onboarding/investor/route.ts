import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  // Handle Clerk typings that may be sync or async across versions
  const authResult = typeof (auth as any) === "function" ? await (auth as any)() : (auth as any);
  const userId: string | undefined = authResult?.userId;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Support both object and function forms for clerkClient across versions
  const maybeClient = clerkClient as any;
  const client = typeof maybeClient === "function" ? await maybeClient() : maybeClient;

  await client.users.updateUser(userId, {
    publicMetadata: {
      role: "investor",
      kycStatus: "pending",
    },
  });

  return NextResponse.json({ ok: true });
}
