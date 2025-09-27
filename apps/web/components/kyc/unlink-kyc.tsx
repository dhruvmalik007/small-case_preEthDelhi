"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface UnlinkKYCProps {
    trigger?: React.ReactNode;
    onUnlink?: () => void;
}

export function UnlinkKYC({ trigger, onUnlink }: UnlinkKYCProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleUnlink = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch("/api/kyc/unlink", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to unlink KYC");
            }

            const result = await response.json();

            // Close dialog
            setOpen(false);

            // Call callback if provided
            if (onUnlink) {
                onUnlink();
            }

            // Refresh the page to update KYC status
            router.refresh();

        } catch (err: any) {
            setError(err.message || "An error occurred while unlinking KYC");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm">
                        <Shield className="h-4 w-4 mr-2" />
                        Unlink KYC
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Unlink KYC Verification
                    </DialogTitle>
                    <DialogDescription>
                        This will remove your KYC verification from your account. You will need to complete KYC again to invest in strategies.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Alert>
                        <Shield className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Important:</strong> Unlinking your KYC verification means:
                            <ul className="mt-2 ml-4 list-disc space-y-1">
                                <li>You won't be able to invest in strategies</li>
                                <li>You'll need to complete KYC verification again</li>
                                <li>Your previous KYC data will be removed from our system</li>
                            </ul>
                        </AlertDescription>
                    </Alert>

                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleUnlink}
                        disabled={isLoading}
                    >
                        {isLoading ? "Unlinking..." : "Yes, Unlink KYC"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
