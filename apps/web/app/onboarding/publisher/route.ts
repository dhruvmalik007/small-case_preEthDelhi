import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = auth();
  const origin = new URL(req.url).origin;
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in/publisher", origin));
  }

  await clerkClient.users.updateUser(userId, {
    publicMetadata: {
      role: "publisher",
    },
  });

  return NextResponse.redirect(new URL("/publisher/dashboard", origin));
}
