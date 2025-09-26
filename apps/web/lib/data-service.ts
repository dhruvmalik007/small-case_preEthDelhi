// Data service for fetching real cryptocurrency data
export interface TokenData {
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  volume_24h: number;
  percent_change_1h: number;
  percent_change_24h: number;
  percent_change_7d: number;
  last_updated: string;
  cmc_rank: number;
  historical?: Array<{
    timestamp: number;
    close: number;
  }>;
}

// Mapping strategy holdings to real token symbols
export const HOLDING_TO_TOKEN_MAP: Record<string, string> = {
  // ETH Liquid Staking Tokens
  'stETH': 'ETH', // Lido staked ETH -> ETH price
  'rETH': 'ETH', // Rocket Pool staked ETH -> ETH price
  'weETH': 'ETH', // Ether.fi staked ETH -> ETH price
  'wstETH': 'ETH', // Wrapped staked ETH -> ETH price
  'rsETH': 'ETH', // Restaked ETH -> ETH price
  'rswETH': 'ETH', // Kelp restaked ETH -> ETH price
  
  // Stablecoins
  'USDC': 'USDC',
  'DAI': 'DAI',
  'USDT': 'USDT',
  'FRAX': 'FRAX',
  'LUSD': 'LUSD',
  'MAI': 'MAI',
  'BUSD': 'BUSD',
  
  // Governance Tokens
  'UNI': 'UNI',
  'AAVE': 'AAVE',
  'CRV': 'CRV',
  'LDO': 'LDO',
  'SNX': 'SNX',
  'GMX': 'GMX',
  'AERO': 'AERO',
  'RLB': 'RLB',
  'HYPE': 'HYPE',
  
  // Other tokens
  'LINK': 'LINK',
  'ARB': 'ARB',
  'OP': 'OP',
  'SOL': 'SOL',
  'mSOL': 'SOL', // Marinade staked SOL -> SOL price
  'jitoSOL': 'SOL', // Jito staked SOL -> SOL price
  
  // Pendle tokens (use underlying asset)
  'PT-stETH': 'ETH',
  'PT-wstETH': 'ETH',
  'PT-USDC': 'USDC',
  'YT-stETH': 'ETH',
  'YT-wstETH': 'ETH',
  'YT-USDC': 'USDC',
  
  // Index tokens
  'INDEX': 'INDEX',
  'GLP': 'GLP',
  'cvxCRV': 'CRV',
  'veAERO': 'AERO',
  
  // RWA tokens
  'BUIDL': 'BUIDL',
  'OUSG': 'OUSG',
  'USTB': 'USTB',
};

export async function fetchTokenData(symbol: string): Promise<TokenData | null> {
  try {
    const response = await fetch(`/api/data?token=${symbol}/USDT`);
    if (!response.ok) {
      console.error(`Failed to fetch data for ${symbol}:`, response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

export async function fetchMultipleTokens(symbols: string[]): Promise<Record<string, TokenData | null>> {
  const results: Record<string, TokenData | null> = {};
  
  // Fetch all tokens in parallel
  const promises = symbols.map(async (symbol) => {
    const data = await fetchTokenData(symbol);
    return { symbol, data };
  });
  
  const responses = await Promise.all(promises);
  
  responses.forEach(({ symbol, data }) => {
    results[symbol] = data;
  });
  
  return results;
}

export function calculateStrategyPerformance(
  holdings: Array<{ protocol: string; asset: string; weightPct: number }>,
  tokenData: Record<string, TokenData | null>
): {
  totalReturn: number;
  weightedReturn: number;
  monthlyReturns: number[];
  currentValue: number;
} {
  let weightedReturn = 0;
  let totalWeight = 0;
  const monthlyReturns: number[] = [];
  
  // Calculate weighted returns based on holdings
  holdings.forEach((holding) => {
    const tokenSymbol = HOLDING_TO_TOKEN_MAP[holding.asset] || holding.asset;
    const data = tokenData[tokenSymbol];
    
    if (data) {
      // Use 24h change as a proxy for recent performance
      const holdingReturn = data.percent_change_24h || 0;
      weightedReturn += (holdingReturn * holding.weightPct) / 100;
      totalWeight += holding.weightPct;
    }
  });
  
  // Normalize by total weight
  const normalizedReturn = totalWeight > 0 ? weightedReturn / (totalWeight / 100) : 0;
  
  // Generate monthly returns based on current performance
  // This is a simplified approach - in production, you'd want historical data
  for (let i = 0; i < 12; i++) {
    // Simulate monthly returns with some variation
    const baseReturn = normalizedReturn / 12; // Distribute annual return across months
    const variation = (Math.random() - 0.5) * 2; // Add some randomness
    monthlyReturns.push(baseReturn + variation);
  }
  
  return {
    totalReturn: normalizedReturn,
    weightedReturn,
    monthlyReturns,
    currentValue: 100 + normalizedReturn, // Starting value of 100
  };
}

export function getTokenSymbolFromHolding(holding: { protocol: string; asset: string }): string {
  return HOLDING_TO_TOKEN_MAP[holding.asset] || holding.asset;
}
