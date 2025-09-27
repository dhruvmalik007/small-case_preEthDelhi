import { NextResponse } from "next/server";

const CMC_API_KEY = process.env.NEXT_PUBLIC_CMC_API_KEY;
const CMC_BASE_URL = "https://pro-api.coinmarketcap.com/v1";

// CoinMarketCap API helper functions
async function fetchCMCCryptoListings(start = 1, limit = 100) {
  const response = await fetch(`${CMC_BASE_URL}/cryptocurrency/listings/latest?start=${start}&limit=${limit}&convert=USD`, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CMC API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchCMCCryptoQuotes(symbol: string) {
  const response = await fetch(`${CMC_BASE_URL}/cryptocurrency/quotes/latest?symbol=${symbol}&convert=USD`, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CMC API error: ${response.status}`);
  }
  
  return response.json();
}

async function fetchCMCCryptoHistorical(symbol: string, timeStart: string, timeEnd: string) {
  const response = await fetch(`${CMC_BASE_URL}/cryptocurrency/quotes/historical?symbol=${symbol}&time_start=${timeStart}&time_end=${timeEnd}&interval=hourly`, {
    headers: {
      'X-CMC_PRO_API_KEY': CMC_API_KEY,
      'Accept': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`CMC API error: ${response.status}`);
  }
  
  return response.json();
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    const timeframe = url.searchParams.get("timeframe") || "1h";
    const limit = parseInt(url.searchParams.get("limit") || "100");
    
    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 400 });
    }

    if (!CMC_API_KEY) {
      return NextResponse.json({ error: "CoinMarketCap API key not configured" }, { status: 500 });
    }

    // Extract symbol from token (e.g., "BTC/USDT" -> "BTC")
    const symbol = token.split('/')[0];
    
    // Get current quote
    const quoteData = await fetchCMCCryptoQuotes(symbol);
    const quote = quoteData.data?.[symbol]?.quote?.USD;
    
    if (!quote) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    const result: any = {
      symbol: symbol,
      name: quoteData.data[symbol].name,
      current_price: quote.price,
      market_cap: quote.market_cap,
      volume_24h: quote.volume_24h,
      percent_change_1h: quote.percent_change_1h,
      percent_change_24h: quote.percent_change_24h,
      percent_change_7d: quote.percent_change_7d,
      last_updated: quote.last_updated,
      cmc_rank: quoteData.data[symbol].cmc_rank
    };

    // Get historical data if timeframe is not 1h
    if (timeframe !== "1h") {
      try {
        const now = new Date();
        const timeEnd = now.toISOString();
        const timeStart = new Date(now.getTime() - (limit * 24 * 60 * 60 * 1000)).toISOString();
        
        const historicalData = await fetchCMCCryptoHistorical(symbol, timeStart, timeEnd);
        if (historicalData.data?.quotes) {
          result.historical = historicalData.data.quotes.map((quote: any) => ({
            timestamp: new Date(quote.timestamp).getTime(),
            close: quote.quote.USD.price
          }));
        }
      } catch (historicalError) {
        console.error("Historical data error:", historicalError);
        // Continue without historical data
      }
    }
    
    console.log("Fetched CMC data for:", symbol);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching CMC data:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Error fetching data", details: errorMessage },
      { status: 500 }
    );
  }
}
