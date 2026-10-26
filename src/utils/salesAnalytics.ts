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
  avgDiscountWon: number;
  avgDiscountAll: number;
  avgSalesCycleDays: number;
  totalTeamQuota: number;
  totalQuotaAttainment: number;

  // Granular Scope Targets (Category, Region, Period)
  scopeTarget: number;
  scopeQuotaAttainment: number;
  portfolioSharePct: number;
  isFilteredScope: boolean;
  filterExplanation: {
    scopeName: string;
    actualWon: number;
    scopeTarget: number;
    scopeAttainment: number;
    totalCompanyQuota: number;
    portfolioSharePct: number;
    explanationDanish: string;
  };

  wonRevenue: number;
  pipelineRevenue: number;
  lostRevenue: number;
  stageFilter: string;
  timePeriod: string;
  periodLabel: string;
  periodQuotaMonths: number;
  filterMoMChange: {
    pct: number;
    diff: number;
    curMonth: string;
    prevMonth: string;
    curRev: number;
    prevRev: number;
  } | null;

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
  repsConfig: SalesRepProfile[] = REPS_CONFIG,
  options?: {
    stageFilter?: string;
    timePeriod?: string;
    allUnfilteredDeals?: Deal[];
    selectedCategory?: string;
    selectedRegion?: string;
  }
): ComprehensiveMetrics {
  const stageFilter = options?.stageFilter || 'Closed Won';
  const timePeriod = options?.timePeriod || 'ALL';
  const allUnfilteredDeals = options?.allUnfilteredDeals || deals;
  const selectedCategory = options?.selectedCategory || 'ALL';
  const selectedRegion = options?.selectedRegion || 'ALL';

  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  const lostDeals = deals.filter(d => d.stage === 'Closed Lost');
  const pipelineDeals = deals.filter(d => d.stage === 'In Pipeline');

  // -------------------------------------------------------------------------
  // 1. REVENUE & DEAL VOLUME ACCOUNTING
  // -------------------------------------------------------------------------
  // Revenue is tracked explicitly per stage:
  // - Closed Won: Realized revenue count towards quota and performance.
  // - Closed Lost: Forfeited potential, used to analyze pipeline leakage.
  // - In Pipeline: Active opportunity pipeline.
  const wonRevenue = wonDeals.reduce((sum, d) => sum + d.revenue, 0);
  const lostRevenue = lostDeals.reduce((sum, d) => sum + d.revenue, 0);
  const pipelineRevenue = pipelineDeals.reduce((sum, d) => sum + d.revenue, 0);

  // Total revenue display adapts to active stage filter (defaults to Won deals)
  let totalRevenue = wonRevenue;
  if (stageFilter === 'In Pipeline') totalRevenue = pipelineRevenue;
  else if (stageFilter === 'Closed Lost') totalRevenue = lostRevenue;
  else if (stageFilter === 'ALL') totalRevenue = wonRevenue + pipelineRevenue + lostRevenue;

  const totalDealsWon = wonDeals.length;
  const totalDealsLost = lostDeals.length;
  const totalDealsClosed = totalDealsWon + totalDealsLost;
  const totalDealsPipeline = pipelineDeals.length;

  // Win Rate: Calculated on CLOSED deals (Won / (Won + Lost))
  const winRate = totalDealsClosed > 0 
    ? Math.round((totalDealsWon / totalDealsClosed) * 100) 
    : 0;

  // Average Deal Size: Strictly on Won deals (Won Revenue / Won Deals Count)
  const avgDealSize = totalDealsWon > 0 
    ? Math.round(wonRevenue / totalDealsWon) 
    : 0;

  // -------------------------------------------------------------------------
  // 2. AVERAGE DISCOUNT CALCULATION (Won Deals vs. All Stages)
  // -------------------------------------------------------------------------
  // Mathematical Context:
  // - Won Deals Discount: Sum of discountPct of Closed Won deals divided by Won count.
  //   Example (USA): 732% discount sum / 85 won deals = 8.61% (8.6%).
  //   This directly corresponds to the realized revenue ($3,898,000) and avg deal size ($45.9k).
  // - All Stages Discount: Sum of discountPct across ALL deals (Won + Lost) divided by total deals.
  //   Example (USA): 1439% discount sum / 140 total deals = 10.28% (10.3%).
  // Lost deals often have aggressive discounts offered before losing (or high initial quotes),
  // which elevates the all-stages average.
  const wonDiscountSum = wonDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
  const avgDiscountWon = wonDeals.length > 0 ? Number((wonDiscountSum / wonDeals.length).toFixed(1)) : 0;

  const totalDiscount = deals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
  const avgDiscountAll = deals.length > 0 ? Number((totalDiscount / deals.length).toFixed(1)) : 0;

  // Primary average discount matches active stage filter (defaults to Won deals discount)
  const avgDiscount = stageFilter === 'Closed Won' ? avgDiscountWon : avgDiscountAll;

  const totalCycle = deals.reduce((sum, d) => sum + (d.salesCycleDays || 0), 0);
  const avgSalesCycleDays = deals.length > 0 ? Math.round(totalCycle / deals.length) : 0;

  // -------------------------------------------------------------------------
  // 3. QUOTA TARGET HIERARCHY & SCOPE SCALING
  // -------------------------------------------------------------------------
  // Base configuration:
  // - 12 sales reps with individual monthly quotas:
  //   US (4 reps): $180k + $160k + $170k + $140k = $650,000/mo ($7.80M/yr).
  //   Europe (4 reps): $175k + $150k + $155k + $135k = $615,000/mo ($7.38M/yr).
  //   Asia (4 reps): $165k + $145k + $150k + $130k = $590,000/mo ($7.08M/yr).
  // - Total monthly team quota: $1,855,000/mo.
  // - Total annual team quota (12 months): $1,855,000 * 12 = $22,260,000 ($22.26M).
  //
  // Handling Filtered Views (Category & Region):
  // When a user filters by e.g. "Cloud & Infrastructure":
  // - Comparing $2.91M won revenue directly against the $22.26M whole-company budget
  //   yields 13.1% ("Portfolio Share" - the category's share of company quota).
  // - To evaluate if the category is on target, we scale the quota by categoryShare
  //   (proportion of historical won revenue generated by that category):
  //   scopeTarget = scopedRepMonthlyQuota * monthsCount * categoryShare.
  //   scopeQuotaAttainment = wonRevenue / scopeTarget.
  const uniqueMonthsInDeals = new Set(deals.map(d => d.date?.substring(0, 7)).filter(Boolean));
  const monthsCount = timePeriod === 'ALL' 
    ? Math.max(1, uniqueMonthsInDeals.size || 12) 
    : 1;

  // Company-wide base quota
  const monthlyTeamBaseQuota = repsConfig.reduce((sum, r) => sum + r.quota, 0);
  const totalTeamQuota = monthlyTeamBaseQuota * monthsCount; // $22.26M for 12 months, or $1.855M for 1 month

  // Filtered scope calculations
  const isCategoryFiltered = selectedCategory !== 'ALL';
  const isRegionFiltered = selectedRegion !== 'ALL';
  const isFilteredScope = isCategoryFiltered || isRegionFiltered;

  // Relevant reps for region
  const scopedReps = isRegionFiltered 
    ? repsConfig.filter(r => r.region === selectedRegion) 
    : repsConfig;
  const scopedRepMonthlyQuota = scopedReps.reduce((sum, r) => sum + r.quota, 0);

  // Category weight calculation from all closed won deals
  const allWonDeals = allUnfilteredDeals.filter(d => d.stage === 'Closed Won');
  const totalAllWonRev = allWonDeals.reduce((sum, d) => sum + d.revenue, 0);
  const categoryWonRev = isCategoryFiltered 
    ? allWonDeals.filter(d => d.category === selectedCategory).reduce((sum, d) => sum + d.revenue, 0)
    : totalAllWonRev;

  // Expected category share (e.g. Cloud & Infrastructure is ~15.2% of won deals)
  const categoryShare = (isCategoryFiltered && totalAllWonRev > 0)
    ? (categoryWonRev / totalAllWonRev)
    : 1;

  // Target for active scope (Region + Category + Months)
  const scopeTarget = Math.round(scopedRepMonthlyQuota * monthsCount * (isCategoryFiltered ? categoryShare : 1));
  const scopeQuotaAttainment = scopeTarget > 0 ? Math.round((wonRevenue / scopeTarget) * 100) : 0;
  const portfolioSharePct = totalTeamQuota > 0 ? Number(((wonRevenue / totalTeamQuota) * 100).toFixed(1)) : 0;

  // Total Quota Attainment display value: show scope attainment if filtered, else company attainment
  const totalQuotaAttainment = isFilteredScope 
    ? scopeQuotaAttainment 
    : (totalTeamQuota > 0 ? Math.round((wonRevenue / totalTeamQuota) * 100) : 0);

  // Scope label for explanation
  let scopeName = 'Hele Porteføljen';
  if (isCategoryFiltered && isRegionFiltered) scopeName = `${selectedCategory} (${selectedRegion})`;
  else if (isCategoryFiltered) scopeName = selectedCategory;
  else if (isRegionFiltered) scopeName = selectedRegion;

  const filterExplanation = {
    scopeName,
    actualWon: wonRevenue,
    scopeTarget,
    scopeAttainment: scopeQuotaAttainment,
    totalCompanyQuota: totalTeamQuota,
    portfolioSharePct,
    explanationDanish: isCategoryFiltered 
      ? `De 13% du så i rækken er andelen af hele virksomhedens samlede årsbudget (${formatCurrency(totalTeamQuota)} på tværs af ALLE produktkategorier og ${repsConfig.length} sælgere). For kun "${selectedCategory}" er det proportionale budgetmål ${formatFullCurrency(scopeTarget)}, hvilket giver en reel målopfyldelse på ${scopeQuotaAttainment}%.`
      : isRegionFiltered
        ? `For region ${selectedRegion} er budgettet ${formatFullCurrency(scopeTarget)} for regionens sælgere (${scopeQuotaAttainment}% målopfyldelse).`
        : `Samlet målopfyldelse for hele virksomheden: ${totalQuotaAttainment}% af ${formatFullCurrency(totalTeamQuota)}.`,
  };

  // Period Label
  let periodLabel = '12 Months (Full Year)';
  if (timePeriod !== 'ALL') {
    periodLabel = formatMonthLabel(timePeriod);
  }

  // -------------------------------------------------------------------------
  // 4. REAL DYNAMIC MONTH-OVER-MONTH (MoM) CALCULATION
  // -------------------------------------------------------------------------
  // Mathematical Context:
  // - Compares the selected month (or latest available dataset month if 'ALL' is selected)
  //   against the immediately preceding month.
  // - Example: If dataset has 2026-11 and 2026-10:
  //   diff = curRev - prevRev
  //   pct = (diff / prevRev) * 100
  // - Adheres to active scope filters (Category & Region) so MoM dynamically reflects
  //   the exact subset of deals selected by the user.
  let filterMoMChange: ComprehensiveMetrics['filterMoMChange'] = null;
  const scopeDeals = allUnfilteredDeals.filter(d => {
    if (selectedRegion !== 'ALL' && d.region !== selectedRegion) return false;
    if (selectedCategory !== 'ALL' && d.category !== selectedCategory) return false;
    return true;
  });

  const availableMonths = getAvailableMonths(allUnfilteredDeals);
  if (availableMonths.length >= 2) {
    let curM = timePeriod !== 'ALL' ? timePeriod : availableMonths[availableMonths.length - 1];
    let curIdx = availableMonths.indexOf(curM);
    if (curIdx <= 0) curIdx = availableMonths.length - 1;
    curM = availableMonths[curIdx];
    const prevM = availableMonths[curIdx - 1];

    const curWonDeals = scopeDeals.filter(d => d.date.startsWith(curM) && d.stage === 'Closed Won');
    const prevWonDeals = scopeDeals.filter(d => d.date.startsWith(prevM) && d.stage === 'Closed Won');

    const curRev = curWonDeals.reduce((s, d) => s + d.revenue, 0);
    const prevRev = prevWonDeals.reduce((s, d) => s + d.revenue, 0);
    const diff = curRev - prevRev;
    const pct = prevRev > 0 ? Number(((diff / prevRev) * 100).toFixed(1)) : 0;

    filterMoMChange = {
      curMonth: curM,
      prevMonth: prevM,
      curRev,
      prevRev,
      diff,
      pct,
    };
  }

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
  const relevantRepList = isRegionFiltered ? scopedReps : repsConfig;
  const repNames = new Set([...relevantRepList.map(r => r.name), ...Array.from(repGroups.keys())]);

  repNames.forEach(repName => {
    const repDeals = repGroups.get(repName) || [];
    const repWon = repDeals.filter(d => d.stage === 'Closed Won');
    const repLost = repDeals.filter(d => d.stage === 'Closed Lost');
    const repRevenue = repWon.reduce((sum, d) => sum + d.revenue, 0);
    const repClosed = repWon.length + repLost.length;
    const repWinRate = repClosed > 0 ? Math.round((repWon.length / repClosed) * 100) : 0;
    const repAvgSize = repWon.length > 0 ? Math.round(repRevenue / repWon.length) : 0;

    const repConfig = repsConfig.find(r => r.name.toLowerCase() === repName.toLowerCase());
    const baseRepMonthlyQuota = repConfig?.quota || 150000;
    const region = repConfig?.region || (repDeals[0]?.region || 'US');

    // If region is filtered and this rep is not from that region, omit if no deals
    if (isRegionFiltered && region !== selectedRegion && repDeals.length === 0) {
      return;
    }

    // Scale individual rep target when category is filtered
    const repTarget = Math.round(baseRepMonthlyQuota * monthsCount * (isCategoryFiltered ? categoryShare : 1));
    const attainment = repTarget > 0 ? Math.round((repRevenue / repTarget) * 100) : 0;

    const repWonDiscountSum = repWon.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const repAvgDiscWon = repWon.length > 0 ? Number((repWonDiscountSum / repWon.length).toFixed(1)) : 0;

    const discountSum = repDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const repAvgDiscAll = repDeals.length > 0 ? Number((discountSum / repDeals.length).toFixed(1)) : 0;

    // Primary rep discount aligns with won deals
    const avgDisc = repWon.length > 0 ? repAvgDiscWon : repAvgDiscAll;

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
      quota: repTarget,
      quotaAttainment: attainment,
      avgDiscount: avgDisc,
      avgDiscountWon: repAvgDiscWon,
      avgDiscountAll: repAvgDiscAll,
      avgCycleDays: avgCyc,
      status,
    });
  });

  // Sort reps by revenue descending
  repSummaries.sort((a, b) => b.revenue - a.revenue);

  const topPerformers = repSummaries.filter(r => r.quotaAttainment >= 100);
  const laggingReps = repSummaries.filter(r => r.quotaAttainment < 75);

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
    const regQuota = regReps.reduce((sum, r) => sum + r.quota, 0) * monthsCount;
    const regAttainment = regQuota > 0 ? Math.round((regRev / regQuota) * 100) : 0;

    // Won deals discount (e.g. 8.61% for US: 732 / 85)
    const regWonDiscountSum = regWon.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const regAvgDiscountWon = regWon.length > 0 ? Number((regWonDiscountSum / regWon.length).toFixed(1)) : 0;

    // All stages discount (e.g. 10.28% for US: 1439 / 140)
    const regDiscountSum = regDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const regAvgDiscountAll = regDeals.length > 0 ? Number((regDiscountSum / regDeals.length).toFixed(1)) : 0;

    // Consistent with Won revenue ($3,898,000) and Won deal size ($45.9k), primary discount is Won discount (8.6%)
    const regAvgDiscount = regAvgDiscountWon;

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
      avgDiscountWon: regAvgDiscountWon,
      avgDiscountAll: regAvgDiscountAll,
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

    const pWonDiscSum = pWon.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const pAvgDiscWon = pWon.length > 0 ? Number((pWonDiscSum / pWon.length).toFixed(1)) : 0;

    const pDiscSum = pDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
    const pAvgDiscAll = pDeals.length > 0 ? Number((pDiscSum / pDeals.length).toFixed(1)) : 0;

    const pAvgDisc = pWon.length > 0 ? pAvgDiscWon : pAvgDiscAll;

    productSummaries.push({
      product: productName,
      category: pDeals[0]?.category || 'Cloud & Infrastructure',
      revenue: pRevenue,
      dealsWon: pWon.length,
      dealsLost: pLost.length,
      avgDealSize: pAvgSize,
      winRate: pWinRate,
      avgDiscount: pAvgDisc,
      avgDiscountWon: pAvgDiscWon,
      avgDiscountAll: pAvgDiscAll,
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
    avgDiscountWon,
    avgDiscountAll,
    avgSalesCycleDays,
    totalTeamQuota,
    totalQuotaAttainment,

    scopeTarget,
    scopeQuotaAttainment,
    portfolioSharePct,
    isFilteredScope,
    filterExplanation,

    wonRevenue,
    pipelineRevenue,
    lostRevenue,
    stageFilter,
    timePeriod,
    periodLabel,
    periodQuotaMonths: monthsCount,
    filterMoMChange,

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

// Helper to get all unique sorted YYYY-MM months in dataset
export function getAvailableMonths(deals: Deal[]): string[] {
  const months = new Set<string>();
  deals.forEach(d => {
    if (d.date && d.date.length >= 7) {
      months.add(d.date.substring(0, 7));
    }
  });
  return Array.from(months).sort();
}

// Format YYYY-MM to readable string e.g. "October 2026"
export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey.length < 7) return monthKey;
  const [yearStr, monthStr] = monthKey.split('-');
  const monthIdx = parseInt(monthStr, 10) - 1;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return `${monthNames[monthIdx] || monthStr} ${yearStr}`;
}

// Compute Month-over-Month Key Changes
export function computeMonthOverMonth(deals: Deal[], targetMonthKey?: string): import('../types/sales').MonthComparison | null {
  const allMonths = getAvailableMonths(deals);
  if (allMonths.length === 0) return null;

  const curMonth = targetMonthKey || allMonths[allMonths.length - 1];
  const curIdx = allMonths.indexOf(curMonth);
  const prevMonth = curIdx > 0 ? allMonths[curIdx - 1] : allMonths[0];

  const currentDeals = deals.filter(d => d.date.startsWith(curMonth));
  const previousDeals = curIdx > 0 ? deals.filter(d => d.date.startsWith(prevMonth)) : [];

  const curWon = currentDeals.filter(d => d.stage === 'Closed Won');
  const prevWon = previousDeals.filter(d => d.stage === 'Closed Won');

  const curRev = curWon.reduce((s, d) => s + d.revenue, 0);
  const prevRev = prevWon.reduce((s, d) => s + d.revenue, 0);
  const revDiff = curRev - prevRev;
  const revPctChange = prevRev > 0 ? Math.round((revDiff / prevRev) * 100) : 0;

  const curDealsCount = curWon.length;
  const prevDealsCount = prevWon.length;
  const dealsDiff = curDealsCount - prevDealsCount;
  const dealsPctChange = prevDealsCount > 0 ? Math.round((dealsDiff / prevDealsCount) * 100) : 0;

  const curDecided = currentDeals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
  const prevDecided = previousDeals.filter(d => d.stage === 'Closed Won' || d.stage === 'Closed Lost').length;
  const curWinRate = curDecided > 0 ? Math.round((curDealsCount / curDecided) * 100) : 0;
  const prevWinRate = prevDecided > 0 ? Math.round((prevDealsCount / prevDecided) * 100) : 0;
  const winRateDiff = curWinRate - prevWinRate;

  // Regional MoM changes
  const regions: Region[] = ['US', 'Europe', 'Asia'];
  const regionalChanges = regions.map(reg => {
    const rCurRev = curWon.filter(d => d.region === reg).reduce((s, d) => s + d.revenue, 0);
    const rPrevRev = prevWon.filter(d => d.region === reg).reduce((s, d) => s + d.revenue, 0);
    const diff = rCurRev - rPrevRev;
    const pct = rPrevRev > 0 ? Math.round((diff / rPrevRev) * 100) : 0;
    return { name: reg, diffRevenue: diff, pctChange: pct };
  });

  regionalChanges.sort((a, b) => b.diffRevenue - a.diffRevenue);
  const topGainingRegion = regionalChanges[0]?.diffRevenue > 0 ? regionalChanges[0] : null;
  const topDecliningRegion = regionalChanges[regionalChanges.length - 1]?.diffRevenue < 0 ? regionalChanges[regionalChanges.length - 1] : null;

  // Product MoM changes
  const allProds = Array.from(new Set([...currentDeals.map(d => d.product), ...previousDeals.map(d => d.product)]));
  const productChanges = allProds.map(prod => {
    const pCurRev = curWon.filter(d => d.product === prod).reduce((s, d) => s + d.revenue, 0);
    const pPrevRev = prevWon.filter(d => d.product === prod).reduce((s, d) => s + d.revenue, 0);
    const diff = pCurRev - pPrevRev;
    const pct = pPrevRev > 0 ? Math.round((diff / pPrevRev) * 100) : 0;
    return { name: prod, diffRevenue: diff, pctChange: pct };
  });

  productChanges.sort((a, b) => b.diffRevenue - a.diffRevenue);
  const topSurgingProduct = productChanges[0]?.diffRevenue > 0 ? productChanges[0] : null;
  const topDecliningProduct = productChanges[productChanges.length - 1]?.diffRevenue < 0 ? productChanges[productChanges.length - 1] : null;

  // Rep MoM changes
  const allReps = Array.from(new Set([...currentDeals.map(d => d.salesPerson), ...previousDeals.map(d => d.salesPerson)]));
  const repChanges = allReps.map(rep => {
    const repCurRev = curWon.filter(d => d.salesPerson === rep).reduce((s, d) => s + d.revenue, 0);
    const repPrevRev = prevWon.filter(d => d.salesPerson === rep).reduce((s, d) => s + d.revenue, 0);
    const diff = repCurRev - repPrevRev;
    const pct = repPrevRev > 0 ? Math.round((diff / repPrevRev) * 100) : 0;
    return { name: rep, diffRevenue: diff, pctChange: pct };
  });

  repChanges.sort((a, b) => b.diffRevenue - a.diffRevenue);
  const topMomentumRep = repChanges[0]?.diffRevenue > 0 ? repChanges[0] : null;
  const topDecliningRep = repChanges[repChanges.length - 1]?.diffRevenue < 0 ? repChanges[repChanges.length - 1] : null;

  return {
    currentMonth: curMonth,
    previousMonth: prevMonth,
    revenueCurrent: curRev,
    revenuePrevious: prevRev,
    revenueDiff: revDiff,
    revenuePctChange: revPctChange,
    dealsCurrent: curDealsCount,
    dealsPrevious: prevDealsCount,
    dealsDiff: dealsDiff,
    dealsPctChange: dealsPctChange,
    winRateCurrent: curWinRate,
    winRatePrevious: prevWinRate,
    winRateDiff: winRateDiff,
    topGainingRegion,
    topDecliningRegion,
    topSurgingProduct,
    topDecliningProduct,
    topMomentumRep,
    topDecliningRep,
  };
}

// Helper to calculate Monday of week for YYYY-MM-DD date string
export function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

// Compute Weekly Time Series data for Products or Reps
export function computeWeeklyTrends(
  deals: Deal[],
  groupBy: 'product' | 'rep',
  metric: 'revenue' | 'dealsClosed' = 'revenue'
): {
  weeks: import('../types/sales').WeeklyTimePoint[];
  itemsSorted: { name: string; totalRevenue: number; totalDeals: number; subLabel: string }[];
} {
  const wonDeals = deals.filter(d => d.stage === 'Closed Won');
  
  // Aggregate items totals
  const itemMap = new Map<string, { totalRevenue: number; totalDeals: number; subLabel: string }>();

  wonDeals.forEach(d => {
    const key = groupBy === 'product' ? d.product : d.salesPerson;
    const subLabel = groupBy === 'product' ? d.category : d.region;
    const existing = itemMap.get(key) || { totalRevenue: 0, totalDeals: 0, subLabel };
    existing.totalRevenue += d.revenue;
    existing.totalDeals += 1;
    itemMap.set(key, existing);
  });

  const itemsSorted = Array.from(itemMap.entries()).map(([name, data]) => ({
    name,
    totalRevenue: data.totalRevenue,
    totalDeals: data.totalDeals,
    subLabel: data.subLabel,
  })).sort((a, b) => b.totalRevenue - a.totalRevenue);

  // Group by week Monday
  const weekBuckets = new Map<string, { timestamp: number; values: Record<string, number>; total: number }>();

  // Determine chronological date span
  if (deals.length > 0) {
    const dates = deals.map(d => d.date).sort();
    const minDate = new Date(dates[0]);
    const maxDate = new Date(dates[dates.length - 1]);

    // Build all Monday slots so no weeks are skipped
    const cur = new Date(minDate);
    const day = cur.getDay();
    cur.setDate(cur.getDate() - day + (day === 0 ? -6 : 1));

    while (cur <= maxDate) {
      const monStr = cur.toISOString().split('T')[0];
      weekBuckets.set(monStr, {
        timestamp: cur.getTime(),
        values: {},
        total: 0,
      });
      cur.setDate(cur.getDate() + 7);
    }
  }

  // Populate buckets
  wonDeals.forEach(d => {
    const weekMonday = getMondayOfWeek(d.date);
    let bucket = weekBuckets.get(weekMonday);
    if (!bucket) {
      const ts = new Date(weekMonday).getTime();
      bucket = { timestamp: ts, values: {}, total: 0 };
      weekBuckets.set(weekMonday, bucket);
    }

    const key = groupBy === 'product' ? d.product : d.salesPerson;
    const val = metric === 'revenue' ? d.revenue : 1;
    bucket.values[key] = (bucket.values[key] || 0) + val;
    bucket.total += val;
  });

  const sortedWeeks = Array.from(weekBuckets.keys()).sort();
  const weeks: import('../types/sales').WeeklyTimePoint[] = sortedWeeks.map(weekKey => {
    const b = weekBuckets.get(weekKey)!;
    const d = new Date(weekKey);
    const monthShort = d.toLocaleString('en-US', { month: 'short' });
    const dayNum = String(d.getDate()).padStart(2, '0');
    const weekLabel = `${monthShort} ${dayNum}`;

    return {
      weekKey,
      weekLabel,
      timestamp: b.timestamp,
      values: b.values,
      total: b.total,
    };
  });

  return { weeks, itemsSorted };
}

