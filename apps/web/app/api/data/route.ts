import { NextResponse } from "next/server";
import ccxt from "ccxt";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const timeframe = url.searchParams.get("timeframe") || "1m";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }
    const exchange = new ccxt.binance({
      enableRateLimit: true,
      sandbox: false,
      options: {
        'defaultType': 'spot'
      }
    });
    const ohlcv = await exchange.fetchOHLCV(token, timeframe, undefined, limit);
    const formattedOhlcv = ohlcv.map(([timestamp, , , , close]) => ({ timestamp, close }));
    console.log("Fetched OHLCV data:", formattedOhlcv);
    return NextResponse.json(formattedOhlcv);
  } catch (error) {
    console.error("Error fetching OHLCV data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error fetching OHLCV data", details: errorMessage },
      { status: 500 }
    );
  }
}
