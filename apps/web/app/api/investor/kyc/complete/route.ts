import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createPublicClient, http } from "viem";
import { SAFE_PASSPORT_ABI } from "@smallcase_defi/safe-passport";

export async function POST(request: Request) {
  const client = await clerkClient();
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse body for investor address and optional contract address
    let investorAddress: `0x${string}` | undefined;
    let contractAddress: `0x${string}` | undefined;
    try {
      const body = await request.json();
      if (body?.address && typeof body.address === "string" && body.address.startsWith("0x")) {
        investorAddress = body.address as `0x${string}`;
      }
      if (body?.contractAddress && typeof body.contractAddress === "string" && body.contractAddress.startsWith("0x")) {
        contractAddress = body.contractAddress as `0x${string}`;
      }
    } catch {}

    // Fallbacks from env
    contractAddress = contractAddress ?? (process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}` | undefined);
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;

    if (!investorAddress) {
      return NextResponse.json({ error: "Missing investor address" }, { status: 400 });
    }
    if (!contractAddress) {
      return NextResponse.json({ error: "SAFE_PASSPORT address not configured on server" }, { status: 500 });
    }
    if (!rpcUrl) {
      return NextResponse.json({ error: "RPC URL not configured" }, { status: 500 });
    }

    const publicClient = createPublicClient({ transport: http(rpcUrl) });
    const isVerified = await publicClient.readContract({
      address: contractAddress,
      abi: SAFE_PASSPORT_ABI,
      functionName: "clientVerified",
      args: [investorAddress],
    });

    if (!isVerified) {
      return NextResponse.json({ error: "Investor not verified yet" }, { status: 400 });
    }

    await client.users.updateUser(userId, {
      publicMetadata: { kycStatus: "completed" },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
