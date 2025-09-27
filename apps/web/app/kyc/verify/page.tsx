import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export default async function KYCVerifyPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const kycStatus = user.publicMetadata?.kycStatus as string;

    return (
        <div className="container py-10 md:py-12">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">KYC Verification</h1>
                    <p className="text-muted-foreground">
                        Complete your identity verification to invest in strategies
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Verification Status
                        </CardTitle>
                        <CardDescription>
                            Your current KYC verification status
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span>Status</span>
                            {kycStatus === "VERIFIED" ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            ) : kycStatus === "PENDING" ? (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                </Badge>
                            ) : kycStatus === "REJECTED" ? (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Rejected
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Not Verified
                                </Badge>
                            )}
                        </div>

                        {kycStatus === "VERIFIED" && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-sm text-green-800">
                                    ✅ Your identity has been verified. You can now invest in strategies.
                                </p>
                            </div>
                        )}

                        {kycStatus === "PENDING" && (
                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⏳ Your verification is being reviewed. Please wait for approval.
                                </p>
                            </div>
                        )}

                        {kycStatus === "REJECTED" && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                    ❌ Your verification was rejected. Please contact support for assistance.
                                </p>
                            </div>
                        )}

                        {!kycStatus && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    📋 Please complete the verification process to invest in strategies.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {!kycStatus && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Start Verification</CardTitle>
                            <CardDescription>
                                Complete the following steps to verify your identity
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                        1
                                    </div>
                                    <span className="text-sm">Provide personal information</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                        2
                                    </div>
                                    <span className="text-sm">Upload identity documents</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                                        3
                                    </div>
                                    <span className="text-sm">Complete video verification</span>
                                </div>
                            </div>

                            <Button className="w-full">
                                Start Verification Process
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {kycStatus === "PENDING" && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <Clock className="h-12 w-12 mx-auto text-yellow-500" />
                                <div>
                                    <h3 className="text-lg font-semibold">Verification in Progress</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your documents are being reviewed. This usually takes 1-2 business days.
                                    </p>
                                </div>
                                <Button variant="outline">
                                    Check Status
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {kycStatus === "REJECTED" && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <AlertTriangle className="h-12 w-12 mx-auto text-red-500" />
                                <div>
                                    <h3 className="text-lg font-semibold">Verification Rejected</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your verification was rejected. Please contact support for assistance.
                                    </p>
                                </div>
                                <div className="flex gap-2 justify-center">
                                    <Button variant="outline">
                                        Contact Support
                                    </Button>
                                    <Button>
                                        Try Again
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
