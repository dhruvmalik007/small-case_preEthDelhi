import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, AlertTriangle, Clock, FileText } from "lucide-react";

export default async function KYCStatusPage() {
    const user = await currentUser();

    if (!user) {
        redirect("/sign-in");
    }

    const kycStatus = user.publicMetadata?.kycStatus as string;

    return (
        <div className="container py-10 md:py-12">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold">KYC Status</h1>
                    <p className="text-muted-foreground">
                        Check your identity verification status
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Current Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Verification Status</span>
                            {kycStatus === "VERIFIED" ? (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                </Badge>
                            ) : kycStatus === "PENDING" ? (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending Review
                                </Badge>
                            ) : kycStatus === "REJECTED" ? (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Rejected
                                </Badge>
                            ) : (
                                <Badge variant="outline">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Not Started
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-medium">User ID</span>
                            <span className="text-sm text-muted-foreground font-mono">
                                {user.id}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <span className="font-medium">Email</span>
                            <span className="text-sm text-muted-foreground">
                                {user.primaryEmailAddress?.emailAddress}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {kycStatus === "VERIFIED" && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <CheckCircle className="h-12 w-12 mx-auto text-green-500" />
                                <div>
                                    <h3 className="text-lg font-semibold text-green-800">Verification Complete</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your identity has been successfully verified. You can now invest in all available strategies.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {kycStatus === "PENDING" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5" />
                                Under Review
                            </CardTitle>
                            <CardDescription>
                                Your verification documents are being reviewed
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 flex items-center justify-center text-sm font-medium">
                                        <Clock className="h-3 w-3" />
                                    </div>
                                    <span className="text-sm">Documents submitted</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-medium">
                                        <FileText className="h-3 w-3" />
                                    </div>
                                    <span className="text-sm">Under review</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-sm font-medium">
                                        <CheckCircle className="h-3 w-3" />
                                    </div>
                                    <span className="text-sm">Verification complete</span>
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                    ⏳ Your verification is being reviewed. This usually takes 1-2 business days.
                                    You will receive an email notification once the review is complete.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {kycStatus === "REJECTED" && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5" />
                                Verification Rejected
                            </CardTitle>
                            <CardDescription>
                                Your verification was rejected. Please review the reasons below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-sm text-red-800">
                                    ❌ Your verification was rejected. Common reasons include:
                                </p>
                                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                                    <li>Document quality is too low</li>
                                    <li>Information doesn't match your account</li>
                                    <li>Document is expired or invalid</li>
                                    <li>Missing required documents</li>
                                </ul>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                                    Contact Support
                                </button>
                                <button className="flex-1 border border-input bg-background px-4 py-2 rounded-md text-sm font-medium hover:bg-accent">
                                    Try Again
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!kycStatus && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Start Verification
                            </CardTitle>
                            <CardDescription>
                                Complete your identity verification to invest in strategies
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-sm text-blue-800">
                                    📋 You haven't started the verification process yet. Complete KYC to invest in strategies.
                                </p>
                            </div>

                            <button className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
                                Start Verification
                            </button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
