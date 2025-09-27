"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useUser } from "@clerk/nextjs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Wallet, TrendingUp, AlertTriangle, Shield } from "lucide-react";
import type { Strategy } from "@/data/strategies";
import { strategyInvestmentService } from "@/lib/uniswap";
import { KYCStatus, useKYCStatus } from "@/components/kyc/kyc-status";
import Link from "next/link";

interface InvestModalProps {
    strategy: Strategy;
    children: React.ReactNode;
}

export function InvestModal({ strategy, children }: InvestModalProps) {
    const { authenticated, user: privyUser } = usePrivy();
    const { user: clerkUser, isSignedIn } = useUser();
    const kycStatus = useKYCStatus();
    const [amount, setAmount] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState<"input" | "review" | "processing" | "success">("input");

    const handleInvest = async () => {
        if (!authenticated || !privyUser?.wallet?.address) {
            return;
        }

        setIsProcessing(true);
        setStep("processing");

        try {
            // Use Uniswap integration for investment
            const result = await strategyInvestmentService.investInStrategy(
                strategy.slug,
                parseFloat(amount),
                privyUser.wallet.address
            );

            if (result.success) {
                console.log("Investment successful:", result.transactionHash);
                setStep("success");
            } else {
                console.error("Investment failed:", result.error);
                setStep("input");
                // You could show an error message to the user here
            }
        } catch (error) {
            console.error("Investment failed:", error);
            setStep("input");
        } finally {
            setIsProcessing(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(value);
    };

    const investmentAmount = parseFloat(amount) || 0;
    const managementFee = investmentAmount * (strategy.fees.managementPct / 100);
    const totalInvestment = investmentAmount + managementFee;

    return (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Invest in {strategy.name}
                    </DialogTitle>
                    <DialogDescription>
                        Enter your investment amount and review the details before proceeding.
                    </DialogDescription>
                </DialogHeader>

                {!isSignedIn ? (
                    <div className="space-y-4">
                        <Alert>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                You must be signed in to invest in strategies.
                                <Button asChild className="ml-2" size="sm">
                                    <Link href="/sign-in">Sign In</Link>
                                </Button>
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : !authenticated ? (
                    <div className="space-y-4">
                        <Alert>
                            <Wallet className="h-4 w-4" />
                            <AlertDescription>
                                Please connect your wallet to invest in this strategy.
                            </AlertDescription>
                        </Alert>
                    </div>
                ) : !kycStatus.verified ? (
                    <div className="space-y-4">
                        <KYCStatus showAlert={true} />
                    </div>
                ) : step === "input" ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Investment Details</CardTitle>
                                <CardDescription>
                                    Enter the amount you want to invest in this strategy.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="amount">Investment Amount (USD)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="1000"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min={strategy.minInvestmentUSD}
                                        step="0.01"
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Minimum investment: {formatCurrency(strategy.minInvestmentUSD)}
                                    </p>
                                </div>

                                {investmentAmount > 0 && (
                                    <div className="space-y-3">
                                        <Separator />
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Investment Amount</span>
                                                <span>{formatCurrency(investmentAmount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Management Fee ({strategy.fees.managementPct}%)</span>
                                                <span>{formatCurrency(managementFee)}</span>
                                            </div>
                                            <Separator />
                                            <div className="flex justify-between font-semibold">
                                                <span>Total Investment</span>
                                                <span>{formatCurrency(totalInvestment)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Strategy Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Expected APY</span>
                                    <span className="font-semibold">
                                        {strategy.expectedAPYRange.min}% - {strategy.expectedAPYRange.max}%
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Risk Level</span>
                                    <Badge variant="outline">{strategy.riskLevel}</Badge>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Rebalancing</span>
                                    <span className="text-sm">{strategy.rebalancing}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setStep("review")}
                                disabled={!amount || investmentAmount < strategy.minInvestmentUSD}
                                className="flex-1"
                            >
                                Review Investment
                            </Button>
                        </div>
                    </div>
                ) : step === "review" ? (
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Review Your Investment</CardTitle>
                                <CardDescription>
                                    Please review the details before confirming your investment.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span>Strategy</span>
                                        <span className="font-medium">{strategy.name}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Investment Amount</span>
                                        <span className="font-medium">{formatCurrency(investmentAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Management Fee</span>
                                        <span className="font-medium">{formatCurrency(managementFee)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-semibold text-lg">
                                        <span>Total Investment</span>
                                        <span>{formatCurrency(totalInvestment)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                By proceeding, you agree to invest in this strategy. Your investment will be processed through Uniswap and allocated according to the strategy's holdings.
                            </AlertDescription>
                        </Alert>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setStep("input")}
                                className="flex-1"
                            >
                                Back
                            </Button>
                            <Button
                                onClick={handleInvest}
                                className="flex-1"
                            >
                                Confirm Investment
                            </Button>
                        </div>
                    </div>
                ) : step === "processing" ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="flex justify-center mb-4">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Processing Investment</h3>
                            <p className="text-sm text-muted-foreground">
                                Please wait while we process your investment through Uniswap...
                            </p>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Transaction Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span>Strategy</span>
                                    <span className="font-medium">{strategy.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Amount</span>
                                    <span className="font-medium">{formatCurrency(investmentAmount)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Network</span>
                                    <span className="font-medium">Ethereum Mainnet</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>DEX</span>
                                    <span className="font-medium">Uniswap V3</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : step === "success" ? (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold">Investment Successful!</h3>
                            <p className="text-sm text-muted-foreground">
                                Your investment of {formatCurrency(investmentAmount)} has been processed successfully.
                            </p>
                        </div>
                        <Button
                            onClick={() => {
                                setStep("input");
                                setAmount("");
                            }}
                            className="w-full"
                        >
                            Make Another Investment
                        </Button>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
