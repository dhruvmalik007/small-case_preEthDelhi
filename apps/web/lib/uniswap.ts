// Uniswap integration utilities for vault investments
// This is a simplified implementation for demonstration purposes

export interface InvestmentParams {
        strategySlug: string;
        amount: number;
        walletAddress: string;
        tokenIn: string; // Input token (e.g., USDC)
        tokenOut: string; // Output token (e.g., strategy token)
}

export interface SwapQuote {
    inputAmount: string;
    outputAmount: string;
    priceImpact: string;
    gasEstimate: string;
    route: string[];
}

export interface InvestmentResult {
    success: boolean;
    transactionHash?: string;
    error?: string;
}

// Mock Uniswap V3 integration
export class UniswapV3Service {
    private readonly chainId = 1; // Ethereum mainnet
    private readonly routerAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3 Router

    async getSwapQuote(params: InvestmentParams): Promise<SwapQuote> {
        // In a real implementation, this would call Uniswap V3 API
        // For now, we'll return mock data
        return {
            inputAmount: params.amount.toString(),
            outputAmount: (params.amount * 0.98).toString(), // 2% slippage
            priceImpact: "0.1",
            gasEstimate: "150000",
            route: [params.tokenIn, params.tokenOut],
        };
    }

    async executeSwap(
        params: InvestmentParams,
        quote: SwapQuote,
        walletAddress: string
    ): Promise<InvestmentResult> {
        try {
            // Attempt a simulated wallet-sign step to prompt the user
            // We sign an intent message (not broadcast) and include it in the API call
            let signedMessage: string | undefined;
            let signMessage: string | undefined;
            const maybeWindow = typeof window !== "undefined" ? (window as any) : undefined;
            const provider = maybeWindow?.ethereum;
            if (provider && walletAddress) {
                try {
                    const ts = Math.floor(Date.now() / 1000);
                    const nonce = Math.random().toString(36).slice(2);
                    signMessage = `I authorize a simulated investment on local fork.\nStrategy: ${params.strategySlug}\nAmountIn: ${quote.inputAmount}\nFrom: ${walletAddress}\nTimestamp: ${ts}\nNonce: ${nonce}`;
                    const hex = (str: string) => {
                        const enc = new TextEncoder().encode(str);
                        let out = "0x";
                        for (let i = 0; i < enc.length; i++) out += enc[i].toString(16).padStart(2, "0");
                        return out;
                    };
                    // Ensure wallet is connected; will prompt if not
                    try { await provider.request({ method: "eth_requestAccounts" }); } catch {}
                    signedMessage = await provider.request({
                        method: "personal_sign",
                        params: [hex(signMessage), walletAddress],
                    });
                } catch (e) {
                    // Non-fatal: continue without signature
                    signedMessage = "";
                    signMessage = "";
                }
            }

            // Call local API which executes a real swap against the forked node
            const base = process.env.NEXT_PUBLIC_API_BASE || ""; // optional override
            const res = await fetch(`${base}/api/invest`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    strategySlug: params.strategySlug,
                    amount: Number(quote.inputAmount),
                    walletAddress,
                    // optional signing artifacts for audit/UX (server currently does not verify)
                    signMessage,
                    signature: signedMessage,
                }),
            });
            const json = await res.json();
            if (!res.ok || !json?.success) {
                return { success: false, error: json?.error || `HTTP ${res.status}` };
            }
            return { success: true, transactionHash: json.transactionHash };
        } catch (error) {
            return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
        }
    }

    async getTokenBalance(tokenAddress: string, walletAddress: string): Promise<string> {
        // Mock token balance check
        return "1000.0"; // Mock balance
    }

    async approveToken(
        tokenAddress: string,
        spenderAddress: string,
        amount: string,
        walletAddress: string
    ): Promise<InvestmentResult> {
        try {
            // Mock token approval
            console.log("Approving token:", {
                token: tokenAddress,
                spender: spenderAddress,
                amount,
                wallet: walletAddress,
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Approval failed",
            };
        }
    }
}

// Strategy-specific investment logic
export class StrategyInvestmentService {
    private uniswapService: UniswapV3Service;

    constructor() {
        this.uniswapService = new UniswapV3Service();
    }

    async investInStrategy(
        strategySlug: string,
        amount: number,
        walletAddress: string
    ): Promise<InvestmentResult> {
        try {
            // Get strategy configuration
            const strategyConfig = this.getStrategyConfig(strategySlug);

            // Check if user has sufficient balance
            const balance = await this.uniswapService.getTokenBalance(
                strategyConfig.inputToken,
                walletAddress
            );

            if (parseFloat(balance) < amount) {
                return {
                    success: false,
                    error: "Insufficient balance",
                };
            }

            // Get swap quote
            const quote = await this.uniswapService.getSwapQuote({
                strategySlug,
                amount,
                walletAddress,
                tokenIn: strategyConfig.inputToken,
                tokenOut: strategyConfig.outputToken,
            });

            // Approve token spending
            const approvalResult = await this.uniswapService.approveToken(
                strategyConfig.inputToken,
                this.uniswapService.routerAddress,
                amount.toString(),
                walletAddress
            );

            if (!approvalResult.success) {
                return approvalResult;
            }

            // Execute the swap
            const swapResult = await this.uniswapService.executeSwap(
                {
                    strategySlug,
                    amount,
                    walletAddress,
                    tokenIn: strategyConfig.inputToken,
                    tokenOut: strategyConfig.outputToken,
                },
                quote,
                walletAddress
            );

            return swapResult;
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Investment failed",
            };
        }
    }

    private getStrategyConfig(strategySlug: string) {
        // Strategy-specific token configurations
        const configs: Record<string, { inputToken: string; outputToken: string }> = {
            "stablecoin-trifecta": {
                inputToken: "0xA0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // USDC
                outputToken: "0xB0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // Strategy token
            },
            "bluechip-lst-yield": {
                inputToken: "0xA0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // USDC
                outputToken: "0xC0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // Strategy token
            },
            // Add more strategies as needed
        };

        return configs[strategySlug] || {
            inputToken: "0xA0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // Default USDC
            outputToken: "0xD0b86a33E6441c8C06DDD4e4c4c0c4c0c4c0c4c0", // Default strategy token
        };
    }
}

// Export singleton instance
export const strategyInvestmentService = new StrategyInvestmentService();
