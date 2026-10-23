import { 
  Deal, 
  Region, 
  ProductCategory, 
  RegionSummary, 
  RepSummary, 
  ProductSummary, 
  CategorySummary,
  SalesRepProfile
} from '../types/sales';
import { REPS_CONFIG } from '../data/sampleDataset';

export interface ComprehensiveMetrics {
  totalRevenue: number;
  totalDealsWon: number;
  totalDealsLost: number;
  totalDealsClosed: number;
  totalDealsPipeline: number;
  winRate: number;
  avgDealSize: number;
  avgDiscount: number;
  avgSalesCycleDays: number;
  totalTeamQuota: number;
  totalQuotaAttainment: number;

  regionalSummaries: RegionSummary[];
  repSummaries: RepSummary[];
  topPerformers: RepSummary[];
  laggingReps: RepSummary[];
  productSummaries: ProductSummary[];
  categorySummaries: CategorySummary[];
  topProducts: ProductSummary[];
  bottomProducts: ProductSummary[];
}

export function computeSalesMetrics(
  deals: Deal[], 
  repsConfig: SalesRepProfile[] = REPS_CONFIG
): ComprehensiveMetrics {
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const lostDeals = deals.filter(d => d.stage === 'Closed Lost');
  const pipelineDeals = deals.filter(d => d.stage === 'In Pipeline');

  const totalRevenue = wonDeals.reduce((sum, d) => sum + d.revenue, 0);
  const totalDealsWon = wonDeals.length;
  const totalDealsLost = lostDeals.length;
  const totalDealsClosed = totalDealsWon + totalDealsLost;
  const totalDealsPipeline = pipelineDeals.length;

  const winRate = totalDealsClosed > 0 
    ? Math.round((totalDealsWon / totalDealsClosed) * 100) 
    : 0;

  const avgDealSize = totalDealsWon > 0 
    ? Math.round(totalRevenue / totalDealsWon) 
    : 0;

  const totalDiscount = deals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
  const avgDiscount = deals.length > 0 ? Number((totalDiscount / deals.length).toFixed(1)) : 0;

  const totalCycle = deals.reduce((sum, d) => sum + (d.salesCycleDays || 0), 0);
  const avgSalesCycleDays = deals.length > 0 ? Math.round(totalCycle / deals.length) : 0;

  // Reps Quota map
  const quotaMap = new Map<string, number>();
  repsConfig.forEach(r => quotaMap.set(r.name.toLowerCase(), r.quota));

  // --- REP SUMMARIES ---
  // Group by salesPerson
  const repGroups = new Map<string, Deal[]>();
  deals.forEach(d => {
    const list = repGroups.get(d.salesPerson) || [];
    list.push(d);
    repGroups.set(d.salesPerson, list);
  });

  const repSummaries: RepSummary[] = [];
  // Ensure all configured reps or present reps are calculated
  const repNames = new Set([...repsConfig.map(r => r.name), ...Array.from(repGroups.keys())]);

  repNames.forEach(repName => {
    const repDeals = repGroups.get(repName) || [];
    const repWon = repDeals.filter(d => d.stage === 'Closed Won');
    const repLost = repDeals.filter(d => d.stage === 'Closed Lost');
    const repRevenue = repWon.reduce((sum, d) => sum + d.revenue, 0);
    const repClosed = repWon.length + repLost.length;
    const repWinRate = repClosed > 0 ? Math.round((repWon.length / repClosed) * 100) : 0;
    const repAvgSize = repWon.length > 0 ? Math.round(repRevenue / repWon.length) : 0;

    const repConfig = repsConfig.find(r => r.name.toLowerCase() === repName.toLowerCase());
    const quota = repConfig?.quota || 150000;
    const region = repConfig?.region || (repDeals[0]?.region || 'US');

    const attainment = Math.round((repRevenue / quota) * 100);

    const discountSum = repDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const avgDisc = repDeals.length > 0 ? Number((discountSum / repDeals.length).toFixed(1)) : 0;

    const cycleSum = repDeals.reduce((sum, d) => sum + (d.salesCycleDays || 0), 0);
    const avgCyc = repDeals.length > 0 ? Math.round(cycleSum / repDeals.length) : 0;

    let status: 'ahead' | 'on_track' | 'lagging' = 'on_track';
    if (attainment >= 100) status = 'ahead';
    else if (attainment < 75) status = 'lagging';

    repSummaries.push({
      name: repName,
      region,
      revenue: repRevenue,
      dealsWon: repWon.length,
      dealsLost: repLost.length,
      totalDeals: repDeals.length,
      avgDealSize: repAvgSize,
      winRate: repWinRate,
      quota,
      quotaAttainment: attainment,
      avgDiscount: avgDisc,
      avgCycleDays: avgCyc,
      status,
    });
  });

  // Sort reps by revenue descending
  repSummaries.sort((a, b) => b.revenue - a.revenue);

  const topPerformers = repSummaries.filter(r => r.quotaAttainment >= 100);
  const laggingReps = repSummaries.filter(r => r.quotaAttainment < 75);

  const totalTeamQuota = repsConfig.reduce((sum, r) => sum + r.quota, 0);
  const totalQuotaAttainment = totalTeamQuota > 0 
    ? Math.round((totalRevenue / totalTeamQuota) * 100) 
    : 0;

  // --- REGIONAL SUMMARIES ---
  const regions: Region[] = ['US', 'Europe', 'Asia'];
  const regionalSummaries: RegionSummary[] = regions.map(reg => {
    const regDeals = deals.filter(d => d.region === reg);
    const regWon = regDeals.filter(d => d.stage === 'Closed Won');
    const regLost = regDeals.filter(d => d.stage === 'Closed Lost');
    const regRev = regWon.reduce((sum, d) => sum + d.revenue, 0);
    const regClosed = regWon.length + regLost.length;
    const regWinRate = regClosed > 0 ? Math.round((regWon.length / regClosed) * 100) : 0;
    const regAvgSize = regWon.length > 0 ? Math.round(regRev / regWon.length) : 0;

    const regReps = repsConfig.filter(r => r.region === reg);
    const regQuota = regReps.reduce((sum, r) => sum + r.quota, 0);
    const regAttainment = regQuota > 0 ? Math.round((regRev / regQuota) * 100) : 0;

    const regDiscountSum = regDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const regAvgDiscount = regDeals.length > 0 ? Number((regDiscountSum / regDeals.length).toFixed(1)) : 0;

    // Top product in region
    const productRevs = new Map<string, number>();
    regWon.forEach(d => {
      productRevs.set(d.product, (productRevs.get(d.product) || 0) + d.revenue);
    });
    let topProduct = 'N/A';
    let maxProdRev = 0;
    productRevs.forEach((val, key) => {
      if (val > maxProdRev) {
        maxProdRev = val;
        topProduct = key;
      }
    });

    // Top rep in region
    const regRepSummaries = repSummaries.filter(r => r.region === reg);
    const topRep = regRepSummaries[0]?.name || 'N/A';

    return {
      region: reg,
      revenue: regRev,
      dealsWon: regWon.length,
      dealsLost: regLost.length,
      totalDeals: regDeals.length,
      avgDealSize: regAvgSize,
      winRate: regWinRate,
      avgDiscount: regAvgDiscount,
      quota: regQuota,
      quotaAttainment: regAttainment,
      topProduct,
      topRep,
    };
  });

  // --- PRODUCT & CATEGORY SUMMARIES ---
  const productMap = new Map<string, Deal[]>();
  deals.forEach(d => {
    const list = productMap.get(d.product) || [];
    list.push(d);
    productMap.set(d.product, list);
  });

  const productSummaries: ProductSummary[] = [];
  productMap.forEach((pDeals, productName) => {
    const pWon = pDeals.filter(d => d.stage === 'Closed Won');
    const pLost = pDeals.filter(d => d.stage === 'Closed Lost');
    const pRevenue = pWon.reduce((sum, d) => sum + d.revenue, 0);
    const pClosed = pWon.length + pLost.length;
    const pWinRate = pClosed > 0 ? Math.round((pWon.length / pClosed) * 100) : 0;
    const pAvgSize = pWon.length > 0 ? Math.round(pRevenue / pWon.length) : 0;

    const pDiscSum = pDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const pAvgDisc = pDeals.length > 0 ? Number((pDiscSum / pDeals.length).toFixed(1)) : 0;

    productSummaries.push({
      product: productName,
      category: pDeals[0]?.category || 'Cloud & Infrastructure',
      revenue: pRevenue,
      dealsWon: pWon.length,
      dealsLost: pLost.length,
      avgDealSize: pAvgSize,
      winRate: pWinRate,
      avgDiscount: pAvgDisc,
    });
  });

  productSummaries.sort((a, b) => b.revenue - a.revenue);

  const topProducts = productSummaries.slice(0, 5);
  const bottomProducts = [...productSummaries]
    .filter(p => p.dealsWon + p.dealsLost > 0)
    .sort((a, b) => a.revenue - b.revenue)
    .slice(0, 5);

  // Group by category
  const categoryMap = new Map<ProductCategory, ProductSummary[]>();
  productSummaries.forEach(ps => {
    const list = categoryMap.get(ps.category) || [];
    list.push(ps);
    categoryMap.set(ps.category, list);
  });

  const categorySummaries: CategorySummary[] = Array.from(categoryMap.entries()).map(([cat, prods]) => {
    const catRevenue = prods.reduce((sum, p) => sum + p.revenue, 0);
    const catWon = prods.reduce((sum, p) => sum + p.dealsWon, 0);
    const catLost = prods.reduce((sum, p) => sum + p.dealsLost, 0);
    const catClosed = catWon + catLost;
    const catWinRate = catClosed > 0 ? Math.round((catWon / catClosed) * 100) : 0;
    const catAvgSize = catWon > 0 ? Math.round(catRevenue / catWon) : 0;

    return {
      category: cat,
      revenue: catRevenue,
      dealsWon: catWon,
      dealsLost: catLost,
      avgDealSize: catAvgSize,
      winRate: catWinRate,
      products: prods.sort((a, b) => b.revenue - a.revenue),
    };
  }).sort((a, b) => b.revenue - a.revenue);

  return {
    totalRevenue,
    totalDealsWon,
    totalDealsLost,
    totalDealsClosed,
    totalDealsPipeline,
    winRate,
    avgDealSize,
    avgDiscount,
    avgSalesCycleDays,
    totalTeamQuota,
    totalQuotaAttainment,

    regionalSummaries,
    repSummaries,
    topPerformers,
    laggingReps,
    productSummaries,
    categorySummaries,
    topProducts,
    bottomProducts,
  };
}

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

export function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}
