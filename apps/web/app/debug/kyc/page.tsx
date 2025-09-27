"use client";

import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getKYCStatusInfo, debugKYCStatus } from "@/lib/kyc-status";
import { Shield, RefreshCw } from "lucide-react";
import { useState } from "react";

export default function KYCDebugPage() {
    const { user, isSignedIn } = useUser();
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = () => {
        setRefreshKey(prev => prev + 1);
    };

    const kycInfo = debugKYCStatus(user, isSignedIn);

    return (
        <div className="container py-10 md:py-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">KYC Status Debug</h1>
                        <p className="text-muted-foreground">
                            Debug KYC status and metadata for troubleshooting
                        </p>
                    </div>
                    <Button onClick={refresh} variant="outline" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Current Status
                            </CardTitle>
                            <CardDescription>
                                Computed KYC status information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Status</span>
                                <Badge variant={kycInfo.badgeVariant} className={kycInfo.badgeColor}>
                                    {kycInfo.displayText}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Verified</span>
                                <span className={kycInfo.verified ? "text-green-600" : "text-red-600"}>
                                    {kycInfo.verified ? "✅ Yes" : "❌ No"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Can Invest</span>
                                <span className={kycInfo.verified ? "text-green-600" : "text-red-600"}>
                                    {kycInfo.verified ? "✅ Yes" : "❌ No"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Raw Data</CardTitle>
                            <CardDescription>
                                Raw user data from Clerk
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Signed In</span>
                                    <span className="text-sm">{isSignedIn ? "✅ Yes" : "❌ No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">User ID</span>
                                    <span className="text-sm font-mono text-xs">{user?.id || "N/A"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm font-medium">Raw KYC Status</span>
                                    <span className="text-sm font-mono">{user?.publicMetadata?.kycStatus || "undefined"}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Full Metadata</CardTitle>
                        <CardDescription>
                            Complete user metadata from Clerk
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                            {JSON.stringify(user?.publicMetadata, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Flow</CardTitle>
                        <CardDescription>
                            Expected KYC status flow
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${!isSignedIn ? "bg-gray-100 text-gray-600" : "bg-green-100 text-green-600"
                                }`}>
                                1
                            </div>
                            <span className="text-sm">Sign in with Clerk</span>
                            <span className="text-xs text-muted-foreground">
                                {isSignedIn ? "✅ Complete" : "❌ Required"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isSignedIn && user?.publicMetadata?.role === "investor" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                }`}>
                                2
                            </div>
                            <span className="text-sm">Set investor role</span>
                            <span className="text-xs text-muted-foreground">
                                {user?.publicMetadata?.role === "investor" ? "✅ Complete" : "❌ Required"}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${kycInfo.verified ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                                }`}>
                                3
                            </div>
                            <span className="text-sm">Complete KYC verification</span>
                            <span className="text-xs text-muted-foreground">
                                {kycInfo.verified ? "✅ Complete" : "❌ Required"}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Test different KYC states
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex gap-2">
                            <Button asChild variant="outline" size="sm">
                                <a href="/investor/kyc">Go to KYC</a>
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <a href="/investor">Go to Investor Dashboard</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

