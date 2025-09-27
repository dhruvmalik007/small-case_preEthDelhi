import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { database } from "@repo/database";
import { createPublicClient, http } from "viem";
import { SAFE_PASSPORT_ABI } from "@smallcase_defi/safe-passport";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let address: `0x${string}` | undefined;
    let profile: { orgName?: string; displayName?: string; bio?: string } | undefined;
    try {
      const body = await request.json();
      if (body?.address && typeof body.address === "string" && body.address.startsWith("0x")) {
        address = body.address as `0x${string}`;
      }
      if (body?.profile && typeof body.profile === "object") {
        profile = body.profile;
      }
    } catch {}

    if (!address) return NextResponse.json({ error: "Missing address" }, { status: 400 });

    // Optional on-chain verification check for PM flow
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    const contractAddress = process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}` | undefined;
    if (rpcUrl && contractAddress) {
      try {
        const publicClient = createPublicClient({ transport: http(rpcUrl) });
        const ok = await publicClient.readContract({
          address: contractAddress,
          abi: SAFE_PASSPORT_ABI,
          functionName: "pmVerified",
          args: [address],
        });
        if (!ok) return NextResponse.json({ error: "PM not verified on-chain yet" }, { status: 400 });
      } catch {
        // If RPC/read fails, we do not block, but you can uncomment to enforce strictness.
        // return NextResponse.json({ error: "Failed to check on-chain PM verification" }, { status: 500 });
      }
    }

    // Upsert or create PM user in DB
    await database.user.upsert({
      where: { walletAddress: address },
      update: {
        role: "PM",
        displayName: profile?.displayName ?? profile?.orgName ?? undefined,
      },
      create: {
        walletAddress: address,
        role: "PM",
        displayName: profile?.displayName ?? profile?.orgName ?? undefined,
      },
    });

    // Update Clerk public metadata to mark role
    const maybeClient: any = clerkClient as unknown as any;
    const client: any = typeof maybeClient === "function" ? await maybeClient() : maybeClient;
    await client.users.updateUser(userId, {
      publicMetadata: { role: "publisher" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
