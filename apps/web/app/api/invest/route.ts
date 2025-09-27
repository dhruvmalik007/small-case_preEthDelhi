import { NextRequest, NextResponse } from "next/server";

// Minimal JSON-RPC helper for local Anvil node
async function rpc<T = any>(method: string, params: any[]): Promise<T> {
  const rpcUrl = process.env.RPC_URL_LOCAL || "http://127.0.0.1:8545";
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result as T;
}

function toHex(value: bigint, size = 32): string {
  const hex = value.toString(16);
  return "0x" + hex.padStart(size * 2, "0");
}

function padAddress(addr: string): string {
  // addr expected 0x-prefixed 20-byte hex
  return "0x" + addr.replace(/^0x/, "").padStart(64, "0");
}

export async function POST(req: NextRequest) {
  try {
    const { strategySlug, amount, walletAddress } = (await req.json()) as {
      strategySlug: string;
      amount: number; // USD, mock
      walletAddress: string;
    };

    if (!walletAddress || !strategySlug || !amount || amount <= 0) {
      return NextResponse.json({ success: false, error: "Invalid input" }, { status: 400 });
    }

    // 1) Impersonate the user's address on local anvil
    await rpc("anvil_impersonateAccount", [walletAddress]);
    // fund with 10 ETH
    await rpc("anvil_setBalance", [walletAddress, toHex(BigInt(10) * BigInt(10 ** 18))]);

    // 2) Perform a small real swap on Unichain mainnet fork via Uniswap V3 router
    // Allow overrides via env; defaults target Unichain mainnet
    const router = process.env.ROUTER_ADDRESS || "0xE592427A0AEce92De3Edee1F18E0157C05861564";
    const WETH = process.env.WETH_ADDRESS || "0x4200000000000000000000000000000000000006";
    const USDC = process.env.USDC_ADDRESS || "0x078d782b760474a361DDa0AF3839290B0eF57Ad6";

    // We'll send 0.001 ETH as input
    const amountInWei = BigInt(1_000_000_000_000_000); // 0.001 ETH
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

    // exactInputSingle selector 0x04e45aaf
    // Encoding of tuple (tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)
    const selector = "0x04e45aaf";
    const fee = 500; // 0.05% pool per curated ETH/USDC on Unichain
    const amountOutMin = BigInt(0);
    const sqrtPriceLimitX96 = BigInt(0);

    const data =
      selector +
      // tokenIn
      padAddress(WETH).slice(2) +
      // tokenOut
      padAddress(USDC).slice(2) +
      // fee (uint24)
      toHex(BigInt(fee)).slice(2).padStart(64, "0") +
      // recipient
      padAddress(walletAddress).slice(2) +
      // deadline
      toHex(deadline).slice(2) +
      // amountIn
      toHex(amountInWei).slice(2) +
      // amountOutMinimum
      toHex(amountOutMin).slice(2) +
      // sqrtPriceLimitX96 (uint160)
      toHex(sqrtPriceLimitX96).slice(2).replace(/^0+/, "").padStart(64, "0");

    // Send the transaction with value
    const txHash = await rpc<string>("eth_sendTransaction", [
      {
        from: walletAddress,
        to: router,
        value: toHex(amountInWei),
        data,
        // gas and gasPrice left for node to estimate; can be overridden via env if needed
      },
    ]);

    // Optionally: de-impersonate (no-op if unsupported)
    try { await rpc("anvil_stopImpersonatingAccount", [walletAddress]); } catch {}

    return NextResponse.json({ success: true, transactionHash: txHash });
  } catch (err: any) {
    console.error("/api/invest error:", err);
    return NextResponse.json({ success: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
