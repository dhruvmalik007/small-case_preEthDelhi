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

        // Get current user metadata
        const user = await client.users.getUser(userId);
        const currentMetadata = user.publicMetadata || {};

        // Set KYC status to unlinked
        const updatedMetadata = {
            ...currentMetadata,
            kycStatus: "unlinked", // Mark as unlinked instead of removing
        };

        await client.users.updateUser(userId, {
            publicMetadata: updatedMetadata,
        });

        return NextResponse.json({
            success: true,
            message: "KYC verification has been unlinked from your account"
        });
    } catch (err) {
        console.error("Error unlinking KYC:", err);
        return NextResponse.json({
            error: "Failed to unlink KYC verification"
        }, { status: 500 });
    }
}
