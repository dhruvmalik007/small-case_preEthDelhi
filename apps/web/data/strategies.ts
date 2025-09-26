export type StrategyCategory =
  | "Lending"
  | "Liquid Staking"
  | "DEX LP"
  | "Perps Yield"
  | "Stable Savings"
  | "Restaking"
  | "Cross-Chain Yield"
  | "RWA"
  | "Points Farming"
  | "Index/Beta";

export type RiskLevel = "Conservative" | "Moderate" | "Aggressive";
export type Volatility = "Low" | "Medium" | "High";
export type Rebalancing = "Weekly" | "Biweekly" | "Monthly" | "Quarterly";

export interface StrategyHolding {
  protocol: string;
  asset: string;
  weightPct: number; // must sum to 100
}

export interface StrategyBacktest {
  cumulativeReturn1Y: number; // percent
  sharpe: number;
  bestMonthPct: number;
  worstMonthPct: number;
  monthlyReturns1Y: number[]; // length 12
}

export interface Strategy {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  category: StrategyCategory;
  expectedAPYRange: { min: number; max: number };
  historicalAPYOneYear: number;
  riskLevel: RiskLevel;
  volatility: Volatility;
  maxDrawdownPct: number;
  rebalancing: Rebalancing;
  minInvestmentUSD: number;
  fees: { managementPct: number; performancePct: number };
  chains: string[];

  protocols: string[];
  tags: string[];
  holdings: StrategyHolding[];
  backtest: StrategyBacktest;
  whyItWorks: string[];
  keyRisks: string[];
  investor?: {
    name: string;
    description: string;
  };
  benchmark?: {
    label: string; // e.g., "ETH" or "DeFi Index"
    monthlyReturns1Y: number[];
  };
}

function mR(r: number[]): StrategyBacktest {
  const best = Math.max(...r);
  const worst = Math.min(...r);
  const cumulative = r.reduce((acc, v) => acc * (1 + v / 100), 1) - 1;
  const avg = r.reduce((a, b) => a + b, 0) / r.length;
  const variance =
    r.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / Math.max(1, r.length - 1);
  const stdevMonthly = Math.sqrt(variance);
  const sharpe = (avg - 0.3) / Math.max(0.0001, stdevMonthly); // naive monthly sharpe approx
  return {
    cumulativeReturn1Y: +(cumulative * 100).toFixed(2),
    sharpe: +sharpe.toFixed(2),
    bestMonthPct: +best.toFixed(2),
    worstMonthPct: +worst.toFixed(2),
    monthlyReturns1Y: r.map((n) => +n.toFixed(2)),
  };
}

export const strategies: Strategy[] = [
  {
    slug: "bluechip-lst-yield",
    name: "Bluechip LST Yield",
    shortDescription: "Diversified ETH liquid staking across Lido, Rocket Pool, and Ether.fi",
    longDescription:
      "Allocate across leading liquid staking protocols to capture ETH staking rewards with protocol diversification and liquidity depth. Pendle tranches enhance base yield on a portion of the position.",
    category: "Liquid Staking",
    expectedAPYRange: { min: 4.2, max: 7.8 },
    historicalAPYOneYear: 5.9,
    riskLevel: "Conservative",
    volatility: "Low",
    maxDrawdownPct: 5.8,
    rebalancing: "Monthly",
    minInvestmentUSD: 250,
    fees: { managementPct: 0.5, performancePct: 5 },
    chains: ["Ethereum", "Arbitrum", "Base"],
    protocols: ["Lido", "Rocket Pool", "Ether.fi", "Pendle"],
    tags: ["ETH", "Yield", "LST", "Pendle"],
    holdings: [
      { protocol: "Lido", asset: "stETH", weightPct: 38 },
      { protocol: "Rocket Pool", asset: "rETH", weightPct: 28 },
      { protocol: "Ether.fi", asset: "weETH", weightPct: 24 },
      { protocol: "Pendle", asset: "PT-stETH", weightPct: 10 },
    ],
    backtest: mR([0.8, 0.6, 0.5, 0.7, 0.9, 0.4, 0.5, 0.7, 0.6, 0.8, 0.5, 0.7]),
    whyItWorks: [
      "Base staking yield with diversified protocol risk",
      "Deepest LST liquidity reduces slippage",
      "Pendle fixed-yield boosts on a portion",
    ],
    keyRisks: [
      "Smart contract risk across multiple protocols",
      "LST depeg/liquidity premium risk",
      "Validator slashings (diversified)",
    ],
  },
  {
    slug: "stablecoin-trifecta",
    name: "Stablecoin Trifecta",
    shortDescription: "Conservative stable savings across Aave, Compound, and Maker DSR",
    longDescription:
      "A conservative basket allocating USDC/DAI across Aave v3 supply, Compound v3 base, and Maker DSR to target stable, low-volatility returns.",
    category: "Stable Savings",
    expectedAPYRange: { min: 5.0, max: 8.5 },
    historicalAPYOneYear: 6.7,
    riskLevel: "Conservative",
    volatility: "Low",
    maxDrawdownPct: 1.4,
    rebalancing: "Monthly",
    minInvestmentUSD: 100,
    fees: { managementPct: 0.3, performancePct: 0 },
    chains: ["Ethereum", "Base", "Polygon"],
    protocols: ["Aave", "Compound", "MakerDAO"],
    tags: ["Stablecoins", "USDC", "DAI", "Low Risk"],
    holdings: [
      { protocol: "Aave", asset: "aUSDC", weightPct: 42 },
      { protocol: "Compound", asset: "cUSDCv3", weightPct: 33 },
      { protocol: "MakerDAO", asset: "DAI DSR", weightPct: 25 },
    ],
    backtest: mR([0.6, 0.5, 0.55, 0.58, 0.6, 0.55, 0.57, 0.6, 0.62, 0.58, 0.6, 0.61]),
    whyItWorks: [
      "Multiple stablecoin lenders reduce dependency",
      "DSR provides base floor yield",
      "Dynamic rebalancing to best rate",
    ],
    keyRisks: [
      "Stablecoin depeg risk",
      "Lending market insolvency",
      "Oracle dependency on lending rates",
    ],
  },
  {
    slug: "arbitrum-perps-basis",
    name: "Arbitrum Perps Basis",
    shortDescription: "Funding and basis capture across GMX, Hyperliquid, and Drift",
    longDescription:
      "Systematic perps funding and basis capture strategy, market-neutral with strict risk controls, deployed primarily on Arbitrum and cross-exchange for diversification.",
    category: "Perps Yield",
    expectedAPYRange: { min: 10.5, max: 24.0 },
    historicalAPYOneYear: 14.8,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 12.4,
    rebalancing: "Weekly",
    minInvestmentUSD: 500,
    fees: { managementPct: 1.0, performancePct: 10 },
    chains: ["Arbitrum", "Base", "Solana"],
    protocols: ["GMX", "Hyperliquid", "Drift"],
    tags: ["Perps", "Funding", "Market Neutral"],
    holdings: [
      { protocol: "GMX", asset: "USDC Collateral", weightPct: 40 },
      { protocol: "Hyperliquid", asset: "USDC Collateral", weightPct: 35 },
      { protocol: "Drift", asset: "USDC Collateral", weightPct: 25 },
    ],
    backtest: mR([1.1, 0.8, -0.9, 2.2, 1.7, -0.6, 1.3, 1.1, 0.9, 1.4, -0.4, 1.6]),
    whyItWorks: [
      "Captures positive funding in choppy markets",
      "Diversified exchange exposure",
      "Tight risk controls and small leverage",
    ],
    keyRisks: [
      "Exchange risk and downtime",
      "Unexpected funding flips",
      "Execution and basis convergence risk",
    ],
  },
  {
    slug: "eth-restaking-ladder",
    name: "ETH Restaking Ladder",
    shortDescription: "Layered restaking across EigenLayer operators for yield + points",
    longDescription:
      "Staggered allocations to restaked LSTs across reputable operators to target ETH staking plus restaking incentives and points.",
    category: "Restaking",
    expectedAPYRange: { min: 7.2, max: 18.5 },
    historicalAPYOneYear: 9.6,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 8.9,
    rebalancing: "Monthly",
    minInvestmentUSD: 250,
    fees: { managementPct: 0.8, performancePct: 10 },
    chains: ["Ethereum"],
    protocols: ["EigenLayer", "Lido", "Ether.fi"],
    tags: ["Restaking", "ETH", "Points"],
    holdings: [
      { protocol: "EigenLayer", asset: "rsETH", weightPct: 40 },
      { protocol: "Lido", asset: "stETH", weightPct: 35 },
      { protocol: "Ether.fi", asset: "weETH", weightPct: 25 },
    ],
    backtest: mR([0.9, 0.7, 0.6, 1.1, 1.5, -0.3, 0.8, 0.9, 0.7, 0.6, 0.5, 0.9]),
    whyItWorks: [
      "Combines base staking + incentive layers",
      "Operator diversification",
      "Monthly rebalancing for emissions shifts",
    ],
    keyRisks: [
      "Slashing/incentive program changes",
      "Smart contract and operator risk",
      "LST liquidity risk",
    ],
  },
  {
    slug: "cross-chain-stable-saver",
    name: "Cross-Chain Stable Saver",
    shortDescription: "Auto-rotating stable yields across Aave, Morpho, and Pendle on L2s",
    longDescription:
      "A cross-chain stablecoin optimizer that rotates capital to the highest net APY venues across Aave/Morpho lenders and Pendle fixed yield tranches.",
    category: "Cross-Chain Yield",
    expectedAPYRange: { min: 7.0, max: 13.0 },
    historicalAPYOneYear: 9.2,
    riskLevel: "Moderate",
    volatility: "Low",
    maxDrawdownPct: 3.6,
    rebalancing: "Biweekly",
    minInvestmentUSD: 200,
    fees: { managementPct: 0.6, performancePct: 5 },
    chains: ["Arbitrum", "Base", "Polygon"],
    protocols: ["Aave", "Morpho", "Pendle"],
    tags: ["Stablecoins", "Optimizer", "L2"],
    holdings: [
      { protocol: "Aave", asset: "aUSDC", weightPct: 38 },
      { protocol: "Morpho", asset: "mUSDC", weightPct: 37 },
      { protocol: "Pendle", asset: "PT-USDC", weightPct: 25 },
    ],
    backtest: mR([0.8, 0.7, 0.9, 0.6, 0.7, 0.8, 0.5, 0.7, 0.8, 0.9, 0.6, 0.7]),
    whyItWorks: [
      "Routing to best net APY with fees considered",
      "Diversified protocol risk",
      "Pendle locks for known fixed yield",
    ],
    keyRisks: [
      "Bridge/cross-chain operational risk",
      "Stablecoin depeg risk",
      "Lockups on fixed yield positions",
    ],
  },
  {
    slug: "dex-lp-delta-neutral",
    name: "DEX LP Delta-Neutral",
    shortDescription: "Hedged LP positions on Uniswap v3 and Maverick with perps hedge",
    longDescription:
      "Deploy capital to concentrated liquidity pools and hedge delta using perps to harvest fees and incentives while minimizing price exposure.",
    category: "DEX LP",
    expectedAPYRange: { min: 12.0, max: 28.0 },
    historicalAPYOneYear: 16.4,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 15.3,
    rebalancing: "Weekly",
    minInvestmentUSD: 750,
    fees: { managementPct: 1.2, performancePct: 12 },
    chains: ["Ethereum", "Arbitrum", "Base"],
    protocols: ["Uniswap v3", "Maverick", "GMX"],
    tags: ["LP Fees", "Delta Neutral", "Hedged"],
    holdings: [
      { protocol: "Uniswap v3", asset: "ETH/USDC LP", weightPct: 45 },
      { protocol: "Maverick", asset: "USDC/USDT LP", weightPct: 35 },
      { protocol: "GMX", asset: "Short Hedge", weightPct: 20 },
    ],
    backtest: mR([2.4, 1.1, -1.8, 3.2, 2.0, -0.7, 1.8, 1.5, 0.9, 2.1, -0.6, 2.4]),
    whyItWorks: [
      "Concentrated fee capture",
      "Hedge neutralizes price risk",
      "Rebalances to maintain ranges",
    ],
    keyRisks: [
      "Range breaks and hedge slippage",
      "Impermanent loss on unhedged legs",
      "Incentive program variability",
    ],
  },
  {
    slug: "defi-index-beta",
    name: "DeFi Index Beta",
    shortDescription: "Broad DeFi beta exposure via leading governance tokens",
    longDescription:
      "A market beta basket of leading DeFi governance tokens with periodic reconstitution and cap-weight constraints to avoid concentration.",
    category: "Index/Beta",
    expectedAPYRange: { min: -20, max: 45 },
    historicalAPYOneYear: 21.3,
    riskLevel: "Aggressive",
    volatility: "High",
    maxDrawdownPct: 38.6,
    rebalancing: "Quarterly",
    minInvestmentUSD: 200,
    fees: { managementPct: 0.5, performancePct: 0 },
    chains: ["Ethereum"],
    protocols: ["Index Coop", "Uniswap v3"],
    tags: ["Index", "Governance", "Beta"],
    holdings: [
      { protocol: "Index Coop", asset: "INDEX", weightPct: 20 },
      { protocol: "Uniswap v3", asset: "UNI", weightPct: 22 },
      { protocol: "Aave", asset: "AAVE", weightPct: 18 },
      { protocol: "Curve", asset: "CRV", weightPct: 15 },
      { protocol: "Lido", asset: "LDO", weightPct: 15 },
      { protocol: "Synthetix", asset: "SNX", weightPct: 10 },
    ],
    backtest: mR([5.4, -3.1, 7.8, 2.6, -6.2, 8.3, 3.2, -1.4, 4.6, 6.1, -2.9, 7.5]),
    whyItWorks: [
      "Diversified sector exposure",
      "Periodic reconstitution",
      "Cap weights to reduce tail risk",
    ],
    keyRisks: [
      "High volatility and sector drawdowns",
      "Token-specific governance risk",
      "Liquidity shocks",
    ],
  },
  {
    slug: "solana-lst-boost",
    name: "Solana Liquid Staking Boost",
    shortDescription: "Stake SOL via Marinade/Jito with MEV and points boosts",
    longDescription:
      "SOL liquid staking diversified between Marinade and Jito with validator selection for MEV rebates and points accrual.",
    category: "Liquid Staking",
    expectedAPYRange: { min: 6.5, max: 12.0 },
    historicalAPYOneYear: 8.1,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 9.8,
    rebalancing: "Monthly",
    minInvestmentUSD: 150,
    fees: { managementPct: 0.6, performancePct: 5 },
    chains: ["Solana"],
    protocols: ["Marinade", "Jito"],
    tags: ["SOL", "LST", "Points"],
    holdings: [
      { protocol: "Marinade", asset: "mSOL", weightPct: 55 },
      { protocol: "Jito", asset: "jitoSOL", weightPct: 45 },
    ],
    backtest: mR([1.0, 0.8, 0.7, 0.9, 1.1, -0.2, 0.9, 0.8, 0.7, 0.9, 0.8, 0.9]),
    whyItWorks: [
      "Validator and MEV optimization",
      "Dual protocol diversification",
      "Low operational overhead",
    ],
    keyRisks: [
      "Protocol-level smart contract risk",
      "LST secondary market liquidity",
      "Validator performance variance",
    ],
  },
  {
    slug: "polygon-lending-optimizer",
    name: "Polygon Lending Optimizer",
    shortDescription: "Dynamic allocator across Aave, QiDAO, and Stargate pools",
    longDescription:
      "Targets best risk-adjusted lending yields on Polygon by routing to Aave, QiDAO vaults, and Stargate stable pools when attractive.",
    category: "Lending",
    expectedAPYRange: { min: 6.0, max: 12.5 },
    historicalAPYOneYear: 7.9,
    riskLevel: "Moderate",
    volatility: "Low",
    maxDrawdownPct: 4.1,
    rebalancing: "Biweekly",
    minInvestmentUSD: 100,
    fees: { managementPct: 0.4, performancePct: 5 },
    chains: ["Polygon"],
    protocols: ["Aave", "QiDAO", "Stargate"],
    tags: ["Polygon", "Lending", "Stable"],
    holdings: [
      { protocol: "Aave", asset: "aUSDC", weightPct: 45 },
      { protocol: "QiDAO", asset: "MAI Vault", weightPct: 30 },
      { protocol: "Stargate", asset: "USDC Pool", weightPct: 25 },
    ],
    backtest: mR([0.7, 0.8, 0.6, 0.9, 0.7, 0.6, 0.8, 0.7, 0.9, 0.8, 0.7, 0.6]),
    whyItWorks: [
      "Multi-protocol rate scanning",
      "Conservative stable exposure",
      "Low fees on Polygon",
    ],
    keyRisks: [
      "Bridge and L2 risk if migrating",
      "MAI stability risk",
      "Protocol insolvency",
    ],
  },
  {
    slug: "base-points-farmland",
    name: "Base Points Farmland",
    shortDescription: "Curated points farming on Base across L2-native protocols",
    longDescription:
      "Actively rotated positions to capture points emissions (and retroactive airdrops) on Base, balancing yield and airdrop potential.",
    category: "Points Farming",
    expectedAPYRange: { min: 0, max: 35 },
    historicalAPYOneYear: 12.4,
    riskLevel: "Aggressive",
    volatility: "High",
    maxDrawdownPct: 22.1,
    rebalancing: "Weekly",
    minInvestmentUSD: 100,
    fees: { managementPct: 1.2, performancePct: 15 },
    chains: ["Base"],
    protocols: ["Aerodrome", "BaseSwap", "Aave"],
    tags: ["Airdrops", "Emissions", "Active"],
    holdings: [
      { protocol: "Aerodrome", asset: "veAERO LP", weightPct: 45 },
      { protocol: "BaseSwap", asset: "USDC/ETH LP", weightPct: 35 },
      { protocol: "Aave", asset: "aUSDC (parking)", weightPct: 20 },
    ],
    backtest: mR([3.1, -1.2, 4.8, 2.5, -3.6, 5.2, 1.9, -0.8, 3.4, 4.1, -2.2, 4.6]),
    whyItWorks: [
      "Captures early protocol incentives",
      "Active rotation based on emissions",
      "Combines yield + potential airdrops",
    ],
    keyRisks: [
      "Program changes without notice",
      "DEX IL and bribe market dynamics",
      "High operational churn",
    ],
  },
  {
    slug: "rwa-treasury-ladder",
    name: "RWA Treasury Ladder",
    shortDescription: "Short-duration T-bill and stable RWA exposure via on-chain wrappers",
    longDescription:
      "Laddered exposure to tokenized T-bills and money market funds through reputable issuers, targeting conservative real-world yields.",
    category: "RWA",
    expectedAPYRange: { min: 4.5, max: 7.0 },
    historicalAPYOneYear: 5.6,
    riskLevel: "Conservative",
    volatility: "Low",
    maxDrawdownPct: 0.9,
    rebalancing: "Quarterly",
    minInvestmentUSD: 500,
    fees: { managementPct: 0.25, performancePct: 0 },
    chains: ["Ethereum", "Base"],
    protocols: ["BlackRock BUIDL", "Ondo", "Superstate"],
    tags: ["RWA", "Treasuries", "Conservative"],
    holdings: [
      { protocol: "BlackRock BUIDL", asset: "BUIDL", weightPct: 50 },
      { protocol: "Ondo", asset: "OUSG", weightPct: 30 },
      { protocol: "Superstate", asset: "USTB", weightPct: 20 },
    ],
    backtest: mR([0.4, 0.45, 0.5, 0.48, 0.46, 0.44, 0.47, 0.49, 0.5, 0.46, 0.45, 0.47]),
    whyItWorks: [
      "Off-chain yield brought on-chain",
      "Short duration reduces rate risk",
      "Issuer diversification",
    ],
    keyRisks: [
      "Issuer and custody counterparty risk",
      "Regulatory changes",
      "Redemption windows and liquidity",
    ],
  },
  {
    slug: "l2-yield-sampler",
    name: "L2 Yield Sampler",
    shortDescription: "Blend of Arbitrum/Base/Polygon stable and ETH yield plays",
    longDescription:
      "A diversified sampler across major L2s targeting stablecoin lending, LSTs, and fixed yield to showcase cross-ecosystem returns.",
    category: "Cross-Chain Yield",
    expectedAPYRange: { min: 6.0, max: 14.0 },
    historicalAPYOneYear: 8.7,
    riskLevel: "Moderate",
    volatility: "Low",
    maxDrawdownPct: 5.2,
    rebalancing: "Monthly",
    minInvestmentUSD: 100,
    fees: { managementPct: 0.5, performancePct: 5 },
    chains: ["Arbitrum", "Base", "Polygon"],
    protocols: ["Aave", "Lido", "Pendle"],
    tags: ["L2", "Diversified", "Sampler"],
    holdings: [
      { protocol: "Aave", asset: "aUSDC", weightPct: 36 },
      { protocol: "Lido", asset: "wstETH", weightPct: 34 },
      { protocol: "Pendle", asset: "PT-wstETH", weightPct: 30 },
    ],
    backtest: mR([0.9, 0.7, 0.6, 0.8, 0.9, 0.5, 0.7, 0.8, 0.6, 0.7, 0.9, 0.8]),
    whyItWorks: [
      "Cross-ecosystem diversification",
      "Stable + ETH yield mix",
      "Fixed yield sleeve via Pendle",
    ],
    keyRisks: [
      "Bridge risk and fragmentation",
      "Rate changes and lockups",
      "Smart contract risk",
    ],
  },
  {
    slug: "pendle-yield-harvest",
    name: "Pendle Yield Harvest",
    shortDescription: "Fixed + variable yield mix via Pendle tranches on LSTs",
    longDescription:
      "Harvest yield opportunities in Pendle by balancing principal tokens (PT) for fixed yield and yield tokens (YT) for optional upside.",
    category: "Lending",
    expectedAPYRange: { min: 9.0, max: 22.0 },
    historicalAPYOneYear: 12.9,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 13.1,
    rebalancing: "Monthly",
    minInvestmentUSD: 300,
    fees: { managementPct: 1.0, performancePct: 10 },
    chains: ["Arbitrum", "Ethereum"],
    protocols: ["Pendle", "Lido"],
    tags: ["Fixed Yield", "LST", "Pendle"],
    holdings: [
      { protocol: "Pendle", asset: "PT-wstETH", weightPct: 55 },
      { protocol: "Pendle", asset: "YT-wstETH", weightPct: 25 },
      { protocol: "Lido", asset: "wstETH", weightPct: 20 },
    ],
    backtest: mR([1.2, 0.9, -0.8, 1.4, 1.6, -0.9, 1.1, 1.0, 0.8, 1.3, -0.5, 1.5]),
    whyItWorks: [
      "Locks in known fixed yields",
      "Selective YT exposure for upside",
      "Rebalance PT/YT mix by market",
    ],
    keyRisks: [
      "YT underperforms in low vol",
      "Liquidity windows on expiries",
      "Smart contract risk",
    ],
  },
  {
    slug: "glp-hedged-yield",
    name: "GMX GLP Hedged",
    shortDescription: "GLP basis yield with perps hedge to reduce beta",
    longDescription:
      "Provide liquidity to GLP for fees and esGMX emissions while hedging market beta using perps to aim for smoother returns.",
    category: "Perps Yield",
    expectedAPYRange: { min: 8.0, max: 20.0 },
    historicalAPYOneYear: 11.7,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 17.5,
    rebalancing: "Weekly",
    minInvestmentUSD: 400,
    fees: { managementPct: 1.0, performancePct: 10 },
    chains: ["Arbitrum"],
    protocols: ["GMX"],
    tags: ["GLP", "Hedge", "Fees"],
    holdings: [
      { protocol: "GMX", asset: "GLP", weightPct: 80 },
      { protocol: "GMX", asset: "Perps Hedge", weightPct: 20 },
    ],
    backtest: mR([1.6, -0.9, 2.3, 1.4, 0.8, -1.2, 1.3, 1.1, 0.6, 1.2, -0.7, 1.8]),
    whyItWorks: [
      "Fees + incentives offset beta",
      "Hedge dampens drawdowns",
      "Active weekly re-hedging",
    ],
    keyRisks: [
      "Hedge slippage and funding",
      "Protocol risk on GMX",
      "GLP composition shocks",
    ],
  },
  {
    slug: "curve-tripool-balance",
    name: "Curve Tri-Pool Rebalancer",
    shortDescription: "Balanced exposure to 3Pool with boosted gauges and bribes",
    longDescription:
      "Allocates to Curve 3Pool and related metapools with vlCVX bribe participation to enhance yields while maintaining stablecoin mix.",
    category: "Stable Savings",
    expectedAPYRange: { min: 5.0, max: 11.0 },
    historicalAPYOneYear: 7.1,
    riskLevel: "Conservative",
    volatility: "Low",
    maxDrawdownPct: 2.2,
    rebalancing: "Monthly",
    minInvestmentUSD: 300,
    fees: { managementPct: 0.7, performancePct: 5 },
    chains: ["Ethereum"],
    protocols: ["Curve", "Convex"],
    tags: ["Stablecoins", "Boosted", "Bribes"],
    holdings: [
      { protocol: "Curve", asset: "3Pool LP", weightPct: 65 },
      { protocol: "Convex", asset: "cvxCRV Boost", weightPct: 35 },
    ],
    backtest: mR([0.6, 0.5, 0.7, 0.6, 0.8, 0.5, 0.7, 0.6, 0.7, 0.8, 0.5, 0.7]),
    whyItWorks: [
      "Gauge boosts via bribes",
      "Deep liquidity pools",
      "Stablecoin diversification",
    ],
    keyRisks: [
      "Bribe market variability",
      "CRV/CVX price exposure via boosts",
      "Smart contract risk",
    ],
  },
  {
    slug: "eigenlayer-points-yield",
    name: "EigenLayer Points + Yield",
    shortDescription: "Restaked LSTs to capture both ETH yield and EigenLayer points",
    longDescription:
      "Focuses on maximizing EigenLayer points accrual while keeping a baseline staking yield by diversifying across restaked LST wrappers.",
    category: "Restaking",
    expectedAPYRange: { min: 6.8, max: 16.0 },
    historicalAPYOneYear: 9.1,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 8.2,
    rebalancing: "Monthly",
    minInvestmentUSD: 200,
    fees: { managementPct: 1.0, performancePct: 10 },
    chains: ["Ethereum"],
    protocols: ["EigenLayer", "Ether.fi", "Kelp"],
    tags: ["Points", "ETH", "Restaking"],
    holdings: [
      { protocol: "Ether.fi", asset: "weETH", weightPct: 45 },
      { protocol: "EigenLayer", asset: "rsETH", weightPct: 35 },
      { protocol: "Kelp", asset: "rswETH", weightPct: 20 },
    ],
    backtest: mR([0.9, 0.8, 0.7, 1.0, 1.2, -0.3, 0.8, 0.9, 0.7, 0.6, 0.8, 0.9]),
    whyItWorks: [
      "Points + yield stack",
      "Operator and wrapper diversification",
      "Monthly reweights by incentives",
    ],
    keyRisks: [
      "Program rule changes",
      "Slashing and liquidity risk",
      "Smart contract risk",
    ],
  },
  {
    slug: "dex-beta-arb",
    name: "DEX Beta Arb",
    shortDescription: "Systematic rotation across DEX tokens with momentum tilt",
    longDescription:
      "A factor strategy that rotates among DEX tokens (UNI, GMX, AERO, RLB) with a momentum overlay and drawdown control.",
    category: "Index/Beta",
    expectedAPYRange: { min: -25, max: 55 },
    historicalAPYOneYear: 24.6,
    riskLevel: "Aggressive",
    volatility: "High",
    maxDrawdownPct: 33.7,
    rebalancing: "Monthly",
    minInvestmentUSD: 200,
    fees: { managementPct: 0.8, performancePct: 10 },
    chains: ["Ethereum", "Arbitrum", "Base"],
    protocols: ["Uniswap v3", "GMX", "Aerodrome"],
    tags: ["Momentum", "DEX", "Beta"],
    holdings: [
      { protocol: "Uniswap v3", asset: "UNI", weightPct: 35 },
      { protocol: "GMX", asset: "GMX", weightPct: 35 },
      { protocol: "Aerodrome", asset: "AERO", weightPct: 30 },
    ],
    backtest: mR([6.1, -2.8, 7.4, 3.6, -4.5, 8.0, 2.9, -1.9, 5.1, 6.8, -3.2, 7.9]),
    whyItWorks: [
      "Momentum tilt captures trends",
      "Diversified across DEX ecosystems",
      "Drawdown control reduces tail risk",
    ],
    keyRisks: [
      "High beta to crypto markets",
      "Rotation whipsaw risk",
      "Token emission overhangs",
    ],
  },
  {
    slug: "solana-perps-yield",
    name: "Solana Perps Yield",
    shortDescription: "Funding capture on Drift, Zeta, and Phoenix DEX perps",
    longDescription:
      "Market-neutral funding and basis strategies on Solana perps DEXs with strict leverage caps and risk management.",
    category: "Perps Yield",
    expectedAPYRange: { min: 9.0, max: 21.0 },
    historicalAPYOneYear: 13.4,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 14.6,
    rebalancing: "Weekly",
    minInvestmentUSD: 300,
    fees: { managementPct: 1.0, performancePct: 10 },
    chains: ["Solana"],
    protocols: ["Drift", "Zeta", "Phoenix"],
    tags: ["Perps", "Funding", "Neutral"],
    holdings: [
      { protocol: "Drift", asset: "USDC Collateral", weightPct: 40 },
      { protocol: "Zeta", asset: "USDC Collateral", weightPct: 35 },
      { protocol: "Phoenix", asset: "USDC Collateral", weightPct: 25 },
    ],
    backtest: mR([1.3, 1.1, -0.7, 2.1, 1.6, -0.6, 1.2, 1.0, 0.9, 1.4, -0.5, 1.7]),
    whyItWorks: [
      "Captures positive funding",
      "Diversified venues reduce venue risk",
      "Low leverage",
    ],
    keyRisks: [
      "DEX outages and liquidations",
      "Funding flips and basis shocks",
      "Operational risk",
    ],
  },
  {
    slug: "arbitrum-lp-stables",
    name: "Arbitrum Stable LP",
    shortDescription: "Stablecoin LP across Curve and Camelot with fee farming",
    longDescription:
      "Stable/stable pools on Arbitrum to harvest trading fees and bribe-driven incentives with low price risk.",
    category: "DEX LP",
    expectedAPYRange: { min: 8.0, max: 18.0 },
    historicalAPYOneYear: 10.2,
    riskLevel: "Moderate",
    volatility: "Low",
    maxDrawdownPct: 7.5,
    rebalancing: "Biweekly",
    minInvestmentUSD: 200,
    fees: { managementPct: 0.8, performancePct: 8 },
    chains: ["Arbitrum"],
    protocols: ["Curve", "Camelot"],
    tags: ["Stable LP", "Bribes", "Fees"],
    holdings: [
      { protocol: "Curve", asset: "USDC/USDT", weightPct: 60 },
      { protocol: "Camelot", asset: "USDC/USDT", weightPct: 40 },
    ],
    backtest: mR([1.1, 0.9, 0.8, 1.0, 1.2, 0.6, 0.8, 1.0, 0.9, 1.1, 0.7, 1.0]),
    whyItWorks: [
      "Low IL risk",
      "Bribes enhance fee yield",
      "Deep stable pools",
    ],
    keyRisks: [
      "Bribe dependence",
      "Pool composition and depeg risk",
      "Protocol smart contract risk",
    ],
  },
  {
    slug: "index-bluechip-eth",
    name: "Index: Bluechip ETH Ecosystem",
    shortDescription: "Cap-weighted index of ETH-aligned infra tokens",
    longDescription:
      "Exposure to the broader ETH ecosystem via a cap-weighted basket of core infrastructure tokens with caps to reduce concentration.",
    category: "Index/Beta",
    expectedAPYRange: { min: -30, max: 60 },
    historicalAPYOneYear: 26.8,
    riskLevel: "Aggressive",
    volatility: "High",
    maxDrawdownPct: 35.9,
    rebalancing: "Quarterly",
    minInvestmentUSD: 250,
    fees: { managementPct: 0.5, performancePct: 0 },
    chains: ["Ethereum"],
    protocols: ["Uniswap v3"],
    tags: ["ETH", "Infra", "Index"],
    holdings: [
      { protocol: "Lido", asset: "LDO", weightPct: 28 },
      { protocol: "Chainlink", asset: "LINK", weightPct: 30 },
      { protocol: "Arbitrum", asset: "ARB", weightPct: 22 },
      { protocol: "Optimism", asset: "OP", weightPct: 20 },
    ],
    backtest: mR([7.1, -3.9, 8.8, 4.2, -5.4, 9.6, 3.9, -2.2, 5.7, 7.2, -3.1, 8.6]),
    whyItWorks: [
      "Broad infra exposure",
      "Caps reduce single-name risk",
      "Quarterly reconstitution",
    ],
    keyRisks: [
      "Sector drawdowns",
      "Token unlocks and emissions",
      "Governance changes",
    ],
  },
  {
    slug: "curve-stable-index",
    name: "Curve Stable Index",
    shortDescription: "Diversified stablecoin metapools with auto-compounding",
    longDescription:
      "A diversified set of Curve stablecoin metapools with auto-compounding rewards via Convex and periodic pool rotation.",
    category: "Stable Savings",
    expectedAPYRange: { min: 5.0, max: 12.0 },
    historicalAPYOneYear: 7.4,
    riskLevel: "Conservative",
    volatility: "Low",
    maxDrawdownPct: 2.8,
    rebalancing: "Monthly",
    minInvestmentUSD: 150,
    fees: { managementPct: 0.6, performancePct: 5 },
    chains: ["Ethereum"],
    protocols: ["Curve", "Convex"],
    tags: ["Stable", "Auto-Compound", "Convex"],
    holdings: [
      { protocol: "Curve", asset: "FRAX/USDC", weightPct: 35 },
      { protocol: "Curve", asset: "LUSD/3Crv", weightPct: 35 },
      { protocol: "Convex", asset: "cvxCRV Boost", weightPct: 30 },
    ],
    backtest: mR([0.7, 0.6, 0.8, 0.6, 0.9, 0.7, 0.6, 0.8, 0.6, 0.7, 0.8, 0.7]),
    whyItWorks: [
      "Diversified stable metapools",
      "Boosted emissions via Convex",
      "Auto-compounding",
    ],
    keyRisks: [
      "Stable depeg risk",
      "Boost program variability",
      "Smart contract risk",
    ],
  },
  {
    slug: "restaking-eth-beta",
    name: "Restaking ETH Beta",
    shortDescription: "Restaked ETH index capturing operator diversity",
    longDescription:
      "An index-like basket of restaked ETH wrappers across major operators, targeting a balance of yield, points, and diversification.",
    category: "Restaking",
    expectedAPYRange: { min: 6.5, max: 15.0 },
    historicalAPYOneYear: 8.9,
    riskLevel: "Moderate",
    volatility: "Medium",
    maxDrawdownPct: 9.6,
    rebalancing: "Monthly",
    minInvestmentUSD: 200,
    fees: { managementPct: 0.7, performancePct: 5 },
    chains: ["Ethereum"],
    protocols: ["EigenLayer", "Ether.fi", "Kelp"],
    tags: ["ETH", "Restaking", "Index"],
    holdings: [
      { protocol: "Ether.fi", asset: "weETH", weightPct: 40 },
      { protocol: "Kelp", asset: "rswETH", weightPct: 30 },
      { protocol: "EigenLayer", asset: "rsETH", weightPct: 30 },
    ],
    backtest: mR([0.8, 0.9, 0.7, 1.0, 1.1, -0.2, 0.8, 0.9, 0.8, 0.7, 0.8, 1.0]),
    whyItWorks: [
      "Operator diversification",
      "Points + base yield stack",
      "Monthly reweights",
    ],
    keyRisks: [
      "Smart contract risk",
      "Slashing and liquidity risks",
      "Program changes",
    ],
  },
];

// Populate default investor info per category if not provided explicitly
const defaultInvestors: Record<StrategyCategory, { name: string; description: string }> = {
  "Stable Savings": {
    name: "Stable Yield Desk",
    description: "Conservative multi-lender stablecoin sleeves optimized for net yield and risk controls.",
  },
  Lending: {
    name: "Stable Yield Desk",
    description: "Rate-optimized lending allocations across blue-chip venues with auto-rotation.",
  },
  "Liquid Staking": {
    name: "ETH Staking Collective",
    description: "Diversified LST exposure with liquidity and operator diligence.",
  },
  Restaking: {
    name: "ETH Staking Collective",
    description: "Restaked ETH wrappers and operator diversification to stack yield and points.",
  },
  "DEX LP": {
    name: "Market Making Lab",
    description: "Hedged liquidity provision and fee optimization strategies.",
  },
  "Perps Yield": {
    name: "Market Neutral Strategies",
    description: "Funding and basis capture with strict risk, low leverage, and venue diversification.",
  },
  "Cross-Chain Yield": {
    name: "L2 Yield Team",
    description: "Cross-ecosystem rate routing and fixed-yield allocations on leading L2s.",
  },
  RWA: {
    name: "RWA Desk",
    description: "Tokenized treasuries and money markets with issuer diligence and short duration.",
  },
  "Points Farming": {
    name: "Incentive Strategies",
    description: "Emissions and airdrop rotations with guardrails and program monitoring.",
  },
  "Index/Beta": {
    name: "Index Research",
    description: "Rules-based DeFi and crypto beta indices with reconstitution policies.",
  },
};

for (const s of strategies) {
  if (!s.investor) {
    const inv = defaultInvestors[s.category] ?? {
      name: "DeFi Smallcases Research",
      description: "Curated baskets by the DeFi Smallcases research team.",
    };
    s.investor = inv;
  }
}

export function getStrategy(slug: string): Strategy | undefined {
  return strategies.find((s) => s.slug === slug);
}

export function defaultBenchmarkFor(s: Strategy): { label: string; monthlyReturns1Y: number[] } {
  const months = 12;
  const flat = (x: number) => Array.from({ length: months }, () => x);
  switch (s.category) {
    case "Stable Savings":
    case "Lending":
      return { label: "Stable Index", monthlyReturns1Y: flat(0.45) };
    case "Liquid Staking":
    case "Restaking":
      // approximate ETH monthly with modest vol
      return { label: "ETH", monthlyReturns1Y: [3.2, -1.1, 2.4, 1.8, -2.3, 4.1, 1.6, -0.9, 2.2, 3.0, -1.5, 2.7] };
    case "DEX LP":
    case "Perps Yield":
      return { label: "DeFi Beta", monthlyReturns1Y: [2.8, -1.9, 3.5, 2.1, -3.2, 4.6, 1.9, -1.2, 2.7, 3.4, -2.1, 3.9] };
    case "Index/Beta":
      return { label: "Crypto Market", monthlyReturns1Y: [5.1, -3.4, 6.2, 2.9, -6.0, 7.5, 3.1, -2.2, 4.8, 6.0, -3.0, 7.2] };
    case "Cross-Chain Yield":
    case "RWA":
    default:
      return { label: "Balanced Index", monthlyReturns1Y: [0.9, 0.7, 0.8, 0.9, 0.8, 0.7, 0.9, 0.8, 0.7, 0.9, 0.8, 0.7] };
  }
}
