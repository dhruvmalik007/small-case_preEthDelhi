import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    const origin = new URL(req.url).origin;
    if (!userId) {
      return NextResponse.redirect(new URL("/sign-in/publisher", origin));
    }

    // Normalize clerkClient across versions (object vs function)
    const maybeClient: any = clerkClient as unknown as any;
    const client: any = typeof maybeClient === "function" ? await maybeClient() : maybeClient;

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "publisher",
      },
    });

    return NextResponse.redirect(new URL("/publisher/dashboard", origin));
  } catch (err) {
    const origin = new URL(req.url).origin;
    return NextResponse.redirect(new URL("/sign-in/publisher", origin));
  }
}
