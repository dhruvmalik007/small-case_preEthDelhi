// Unified KYC status management
// This centralizes all KYC status logic to prevent inconsistencies

export type KYCStatus = "not_signed_in" | "not_verified" | "pending" | "completed" | "verified" | "rejected" | "unlinked";

export interface KYCStatusInfo {
    status: KYCStatus;
    verified: boolean;
    displayText: string;
    badgeVariant: "default" | "secondary" | "outline" | "success" | "warning";
    badgeColor: string;
}

export function getKYCStatusInfo(kycStatus: string | undefined, isSignedIn: boolean): KYCStatusInfo {
    // Not signed in
    if (!isSignedIn) {
        return {
            status: "not_signed_in",
            verified: false,
            displayText: "Not Signed In",
            badgeVariant: "outline",
            badgeColor: "border-gray-200 text-gray-800"
        };
    }

    // No KYC status set
    if (!kycStatus) {
        return {
            status: "not_verified",
            verified: false,
            displayText: "KYC Required",
            badgeVariant: "outline",
            badgeColor: "border-orange-200 text-orange-800"
        };
    }

    // Handle unlinked status
    if (kycStatus === "unlinked") {
        return {
            status: "unlinked",
            verified: false,
            displayText: "KYC Unlinked",
            badgeVariant: "outline",
            badgeColor: "border-gray-200 text-gray-600"
        };
    }

    // Handle different status values
    switch (kycStatus.toLowerCase()) {
        case "completed":
        case "verified":
            return {
                status: "verified",
                verified: true,
                displayText: "KYC Verified",
                badgeVariant: "success",
                badgeColor: "bg-green-100 text-green-800 border-green-200"
            };

        case "pending":
            return {
                status: "pending",
                verified: false,
                displayText: "KYC Pending",
                badgeVariant: "warning",
                badgeColor: "bg-yellow-100 text-yellow-800 border-yellow-200"
            };

        case "rejected":
            return {
                status: "rejected",
                verified: false,
                displayText: "KYC Rejected",
                badgeVariant: "outline",
                badgeColor: "bg-red-100 text-red-800 border-red-200"
            };

        default:
            return {
                status: "not_verified",
                verified: false,
                displayText: "KYC Required",
                badgeVariant: "outline",
                badgeColor: "border-orange-200 text-orange-800"
            };
    }
}

// Debug function to log KYC status
export function debugKYCStatus(user: any, isSignedIn: boolean) {
    const kycStatus = user?.publicMetadata?.kycStatus;
    const statusInfo = getKYCStatusInfo(kycStatus, isSignedIn);

    console.log("🔍 KYC Status Debug:", {
        isSignedIn,
        userId: user?.id,
        rawKycStatus: kycStatus,
        publicMetadata: user?.publicMetadata,
        computedStatus: statusInfo.status,
        verified: statusInfo.verified,
        displayText: statusInfo.displayText
    });

    return statusInfo;
}

