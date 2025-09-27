import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Normalize auth() return shape across versions
    const authResult: any = typeof (auth as any) === "function" ? await (auth as any)() : (auth as any);
    const userId: string | undefined = authResult?.userId;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Normalize clerkClient across versions (object vs function)
    const maybeClient: any = clerkClient as unknown as any;
    const client: any = typeof maybeClient === "function" ? await maybeClient() : maybeClient;

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "investor",
        // Don't set KYC status here - let it be undefined until user actually completes KYC
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
