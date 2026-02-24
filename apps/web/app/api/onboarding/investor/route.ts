import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { buildInvestorSelfConfig, type EndpointType } from "@smallcase_defi/safe-passport";

export async function POST(request: Request) {
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

    // Parse incoming body for investor onchain address and optional parameters
    let investorAddress: `0x${string}` | undefined;
    let accessCode: `0x${string}` | undefined;
    let endpointType: EndpointType | undefined;
    let contractAddress: `0x${string}` | undefined;
    try {
      const body = await request.json();
      if (body?.address && typeof body.address === "string" && body.address.startsWith("0x")) {
        investorAddress = body.address as `0x${string}`;
      }
      if (body?.accessCode && typeof body.accessCode === "string" && body.accessCode.startsWith("0x")) {
        accessCode = body.accessCode as `0x${string}`;
      }
      if (body?.endpointType && typeof body.endpointType === "string") {
        endpointType = body.endpointType as EndpointType;
      }
      if (body?.contractAddress && typeof body.contractAddress === "string" && body.contractAddress.startsWith("0x")) {
        contractAddress = body.contractAddress as `0x${string}`;
      }
    } catch {}

    // Resolve contract address and endpoint type from env as fallback
    const envContract = process.env.NEXT_PUBLIC_SAFE_PASSPORT_ADDRESS as `0x${string}` | undefined;
    const envEndpointType = process.env.NEXT_PUBLIC_SELF_ENDPOINT_TYPE as EndpointType | undefined;
    contractAddress = contractAddress ?? envContract;
    endpointType = endpointType ?? envEndpointType ?? ("staging_celo" as EndpointType);

    if (!contractAddress) {
      return NextResponse.json({ error: "SAFE_PASSPORT address not configured on server" }, { status: 500 });
    }
    if (!investorAddress) {
      return NextResponse.json({ error: "Missing investor address in request body" }, { status: 400 });
    }

    await client.users.updateUser(userId, {
      publicMetadata: {
        role: "investor",
        kycStatus: "pending",
      },
    });

    // Build Self configuration to be used by the client to render QR
    const self = buildInvestorSelfConfig({
      contractAddress,
      investorAddress,
      endpointType,
      accessCode,
    });

    return NextResponse.json({ ok: true, self });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
