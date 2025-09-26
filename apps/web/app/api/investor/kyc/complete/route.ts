import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clerkClient.users.updateUser(userId, {
    publicMetadata: { kycStatus: "completed" },
  });
  return NextResponse.json({ ok: true });
}
