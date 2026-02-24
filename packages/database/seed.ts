import { database, StrategyCategory, Rebalancing, RiskLevel, Volatility, Visibility, Role, KycStatus } from './index';

async function main() {
  console.log('Seeding database...');

  // Upsert sample users (investor + portfolio manager)
  const investor = await database.user.upsert({
    where: { walletAddress: '0x1111111111111111111111111111111111111111' },
    update: {},
    create: {
      walletAddress: '0x1111111111111111111111111111111111111111',
      displayName: 'Demo Investor',
      email: 'investor@example.com',
      role: Role.INVESTOR,
      kycStatus: KycStatus.VERIFIED,
      riskLevel: RiskLevel.MODERATE,
    },
  });

  const pm = await database.user.upsert({
    where: { walletAddress: '0x2222222222222222222222222222222222222222' },
    update: {},
    create: {
      walletAddress: '0x2222222222222222222222222222222222222222',
      displayName: 'Demo PM',
      email: 'pm@example.com',
      role: Role.PM,
      kycStatus: KycStatus.VERIFIED,
    },
  });

  // Seed a few protocols (minimal fields)
  await database.protocol.upsert({
    where: { slug: 'lido' },
    update: {},
    create: { slug: 'lido', name: 'Lido', category: 'LIQUID_STAKING' },
  });
  await database.protocol.upsert({
    where: { slug: 'rocket-pool' },
    update: {},
    create: { slug: 'rocket-pool', name: 'Rocket Pool', category: 'LIQUID_STAKING' },
  });
  await database.protocol.upsert({
    where: { slug: 'pendle' },
    update: {},
    create: { slug: 'pendle', name: 'Pendle', category: 'DEX_LP' },
  });

  // Seed strategies aligned with the architecture
  const strat1 = await database.strategy.upsert({
    where: { slug: 'bluechip-lst-yield' },
    update: {},
    create: {
      slug: 'bluechip-lst-yield',
      name: 'Bluechip LST Yield',
      shortDescription: 'Core ETH liquid staking allocation with diversified providers',
      category: StrategyCategory.LIQUID_STAKING,
      expectedApyMin: '4.2',
      expectedApyMax: '7.8',
      historicalApyOneYear: '5.9',
      riskLevel: RiskLevel.CONSERVATIVE,
      volatility: Volatility.LOW,
      maxDrawdownPct: '5.8',
      rebalancing: Rebalancing.MONTHLY,
      minInvestmentUsd: '250',
      managementFeePct: '0.50',
      performanceFeePct: '5.0',
      chains: ['Ethereum', 'Arbitrum', 'Base'],
      protocols: ['Lido', 'Rocket Pool', 'Pendle'],
      tags: ['ETH', 'Yield', 'LST', 'Pendle'],
      visibility: Visibility.PUBLIC,
      managerId: pm.id,
      holdings: {
        createMany: {
          data: [
            { protocol: 'Lido', asset: 'stETH', weightBps: 3800 },
            { protocol: 'Rocket Pool', asset: 'rETH', weightBps: 2800 },
            { protocol: 'Pendle', asset: 'PT-stETH', weightBps: 1000 },
            { protocol: 'Ether.fi', asset: 'weETH', weightBps: 1400 },
          ],
        },
      },
    },
  });

  const strat2 = await database.strategy.upsert({
    where: { slug: 'stable-savings-plus' },
    update: {},
    create: {
      slug: 'stable-savings-plus',
      name: 'Stable Savings Plus',
      shortDescription: 'Conservative stablecoin vaults diversified across chains',
      category: StrategyCategory.STABLE_SAVINGS,
      expectedApyMin: '6.0',
      expectedApyMax: '10.0',
      riskLevel: RiskLevel.CONSERVATIVE,
      volatility: Volatility.LOW,
      rebalancing: Rebalancing.MONTHLY,
      chains: ['Ethereum', 'Base', 'Optimism'],
      protocols: ['Aave', 'Compound', 'Curve'],
      tags: ['USD stable', 'Savings'],
      visibility: Visibility.PUBLIC,
      managerId: pm.id,
      holdings: {
        createMany: {
          data: [
            { protocol: 'Aave', asset: 'USDC', weightBps: 4000 },
            { protocol: 'Compound', asset: 'USDT', weightBps: 3000 },
            { protocol: 'Curve', asset: '3Pool', weightBps: 3000 },
          ],
        },
      },
    },
  });

  // Seed a subscription linking investor->strategy
  await database.subscription.upsert({
    where: { investorId_strategyId: { investorId: investor.id, strategyId: strat1.id } },
    update: {},
    create: {
      investorId: investor.id,
      strategyId: strat1.id,
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await database.$disconnect();
  });
