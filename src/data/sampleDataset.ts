import { Deal, SalesRepProfile, Region, ProductCategory, DealStage } from '../types/sales';

export const REPS_CONFIG: SalesRepProfile[] = [
  // US Region (Annual: 1.8M + 1.6M + 1.7M + 1.4M = 6.50M/år · Måned: 0.5417M/md)
  { name: 'Marcus Vance', region: 'US', annualQuota: 1800000, quota: 150000, avatarInitials: 'MV' },
  { name: 'Sarah Chen', region: 'US', annualQuota: 1600000, quota: 133333, avatarInitials: 'SC' },
  { name: 'David Miller', region: 'US', annualQuota: 1700000, quota: 141667, avatarInitials: 'DM' },
  { name: 'Maya Rodriguez', region: 'US', annualQuota: 1400000, quota: 116667, avatarInitials: 'MR' },

  // Europe Region (Annual: 1.75M + 1.50M + 1.55M + 1.35M = 6.15M/år · Måned: 0.5125M/md)
  { name: 'Elena Rossi', region: 'Europe', annualQuota: 1750000, quota: 145833, avatarInitials: 'ER' },
  { name: 'Arthur Dubois', region: 'Europe', annualQuota: 1500000, quota: 125000, avatarInitials: 'AD' },
  { name: 'Liam Schmidt', region: 'Europe', annualQuota: 1550000, quota: 129167, avatarInitials: 'LS' },
  { name: 'Freja Lind', region: 'Europe', annualQuota: 1350000, quota: 112500, avatarInitials: 'FL' },

  // Asia Region (Annual: 1.65M + 1.45M + 1.50M + 1.30M = 5.90M/år · Måned: 0.4917M/md)
  { name: 'Kenji Tanaka', region: 'Asia', annualQuota: 1650000, quota: 137500, avatarInitials: 'KT' },
  { name: 'Priya Sharma', region: 'Asia', annualQuota: 1450000, quota: 120833, avatarInitials: 'PS' },
  { name: 'Wei Zhang', region: 'Asia', annualQuota: 1500000, quota: 125000, avatarInitials: 'WZ' },
  { name: 'Aiko Takahashi', region: 'Asia', annualQuota: 1300000, quota: 108333, avatarInitials: 'AT' },
];

export const CATEGORIES_WITH_PRODUCTS: Record<string, string[]> = {
  'Cloud & Infrastructure': [
    'CloudScale Engine',
    'Edge CDN Accelerator',
    'Kubernetes Fleet Manager',
    'Serverless Flow Runtime',
    'Database Cluster Pro',
    'Cloud Cost Optimizer',
  ],
  'Security & Compliance': [
    'ZeroTrust Access Gateway',
    'ThreatShield SIEM',
    'Compliance Vault Enterprise',
    'API Sentinel Guard',
    'Identity Governance Suite',
    'Vulnerability Radar X',
  ],
  'AI & Data Intelligence': [
    'Cognitive Copilot Studio',
    'AutoPipeline ML Ops',
    'DocuExtract Neural OCR',
    'VoiceStream Speech AI',
    'Predictive Churn Engine',
    'Vector Lake Search',
  ],
  'Collaboration & Workflows': [
    'TeamSync Workspace Pro',
    'DevKanban Agile Hub',
    'CustomerPortal Connect',
    'DocuSignify Enterprise',
    'OmniChannel Desk',
    'Async Video HQ',
  ],
  'Analytics & BI Intelligence': [
    'Executive KPI Dashboard',
    'Customer Journey Explorer',
    'Realtime Event Streamer',
    'Financial Forecaster AI',
    'Metric Attribution Suite',
  ],
  'Customer Success & Retention': [
    'ChurnGuard Early Warning',
    'Onboarding Playbook Pro',
    'NPS & Sentiment Pulse',
    'Ticket Escalation Bot',
    'Account Health Matrix',
  ],
  'Developer Platforms & APIs': [
    'API Gateway Mesh',
    'Webhook Dispatcher Pro',
    'Sandbox Environment Cloud',
    'Schema Registry Enterprise',
    'SDK Generator Suite',
  ],
};

// Deterministic Pseudo-Random Generator (Mulberry32) for reproducible 1-year data
function createPrng(seed: number) {
  let s = seed;
  return function () {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ACCOUNTS = [
  'Horizon Fintech', 'Aegis Healthcare', 'Beacon Logistics', 'Silverline Media',
  'Quantum Capital', 'BioHealth Labs', 'Strata Commerce', 'Optima Retail Systems',
  'Vertex Design Group', 'NextGen Payments', 'Kite Logistics', 'Pinnacle Legal Services',
  'StreamWave Gaming', 'Elevate Telephony', 'Solaris Energy', 'Pacific Rim Bank',
  'Metro Broadcast Inc', 'Cascade Mutual Insurers', 'AppWorks Studio', 'Apex Health Systems',
  'Milano Assicurazioni', 'Swiss Alpine Tech AG', 'Bavaria Motor Components', 'Iberia Telecom',
  'Lille Logistics Hub', 'Bruxelles Public Services', 'AeroParis Engineering', 'GrandMagasin eCommerce',
  'Frankfurt Digital Bank', 'Dusseldorf Steel Corp', 'Stuttgart Mobility Labs', 'Vienna Cloud Services',
  'Nordic Forest Products', 'Stockholm Fintech AB', 'Helsinki Cargo Lines', 'Oslo Media Group',
  'Tokyo Precision Robotics', 'Osaka Chemical Systems', 'Seoul Semiconductor', 'Yokohama Smart Transit',
  'Bengaluru Tech Park', 'Singapore Financial Network', 'Hyderabad Telecom', 'Jakarta eCommerce Express',
  'Shenzhen Hardware Cloud', 'Shanghai Container Shipping', 'Guangzhou Commercial Bank', 'Taipei Gaming Cloud',
  'Fukuoka Insurance Corp', 'Kyoto Interactive Apps', 'Manila Offshore Services', 'Sapporo Creative Agency'
];

function generateOneYearDataset(): Deal[] {
  const prng = createPrng(42);
  const deals: Deal[] = [];

  const startDate = new Date('2025-11-01');
  const endDate = new Date('2026-10-24');
  const totalDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  const allCategories = Object.keys(CATEGORIES_WITH_PRODUCTS);

  // Rep profiles with win-rate bias and deal size bias
  const repBiases: Record<string, { winRate: number; sizeMul: number; discAvg: number }> = {
    'Marcus Vance': { winRate: 0.82, sizeMul: 1.35, discAvg: 6 },
    'Sarah Chen': { winRate: 0.86, sizeMul: 1.15, discAvg: 5 },
    'David Miller': { winRate: 0.44, sizeMul: 0.95, discAvg: 18 },
    'Maya Rodriguez': { winRate: 0.72, sizeMul: 1.0, discAvg: 8 },

    'Elena Rossi': { winRate: 0.84, sizeMul: 1.30, discAvg: 6 },
    'Arthur Dubois': { winRate: 0.76, sizeMul: 1.10, discAvg: 7 },
    'Liam Schmidt': { winRate: 0.73, sizeMul: 1.05, discAvg: 8 },
    'Freja Lind': { winRate: 0.52, sizeMul: 0.90, discAvg: 14 },

    'Kenji Tanaka': { winRate: 0.85, sizeMul: 1.25, discAvg: 5 },
    'Priya Sharma': { winRate: 0.78, sizeMul: 0.95, discAvg: 8 },
    'Wei Zhang': { winRate: 0.74, sizeMul: 1.15, discAvg: 8 },
    'Aiko Takahashi': { winRate: 0.48, sizeMul: 0.85, discAvg: 16 },
  };

  let dealIndex = 1000;

  // Generate ~520 realistic deals across the 52 weeks (approx 10-12 deals per week)
  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset += 1) {
    const curDate = new Date(startDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const dayOfWeek = curDate.getDay(); // 0 is Sunday, 6 is Saturday
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends for B2B deal closings

    // End-of-month and end-of-quarter volume push
    const dayOfMonth = curDate.getDate();
    const month = curDate.getMonth(); // 0-11
    const isQuarterEnd = dayOfMonth >= 20 && (month === 2 || month === 5 || month === 8 || month === 9);
    const isMonthEnd = dayOfMonth >= 22;

    const dealsTodayCount = isQuarterEnd ? (prng() > 0.3 ? 3 : 2) : isMonthEnd ? (prng() > 0.4 ? 2 : 1) : (prng() > 0.55 ? 2 : 1);

    for (let d = 0; d < dealsTodayCount; d++) {
      dealIndex++;
      // Pick rep
      const rep = REPS_CONFIG[Math.floor(prng() * REPS_CONFIG.length)];
      const bias = repBiases[rep.name] || { winRate: 0.7, sizeMul: 1.0, discAvg: 8 };

      // Pick category
      const category = allCategories[Math.floor(prng() * allCategories.length)];
      const products = CATEGORIES_WITH_PRODUCTS[category];
      const product = products[Math.floor(prng() * products.length)];

      // Determine stage
      const roll = prng();
      let stage: DealStage = 'Closed Won';
      if (curDate > new Date('2026-10-15') && prng() > 0.65) {
        stage = 'In Pipeline';
      } else if (roll > bias.winRate) {
        stage = 'Closed Lost';
      }

      // Base pricing per category
      let basePrice = 28000;
      if (category === 'Cloud & Infrastructure') basePrice = 45000;
      else if (category === 'Security & Compliance') basePrice = 42000;
      else if (category === 'AI & Data Intelligence') basePrice = 52000;
      else if (category === 'Analytics & BI Intelligence') basePrice = 36000;
      else if (category === 'Developer Platforms & APIs') basePrice = 34000;
      else if (category === 'Customer Success & Retention') basePrice = 26000;
      else if (category === 'Collaboration & Workflows') basePrice = 24000;

      // Special top products premium
      if (product === 'CloudScale Engine' || product === 'Cognitive Copilot Studio' || product === 'Compliance Vault Enterprise') {
        basePrice *= 1.4;
      }

      // Apply rep size multiplier + variation
      const priceVariation = 0.7 + prng() * 0.6; // 0.7x to 1.3x
      const revenue = Math.round((basePrice * bias.sizeMul * priceVariation) / 1000) * 1000;

      // Discount %
      const discountPct = Math.max(0, Math.min(25, Math.round(bias.discAvg + (prng() - 0.5) * 8)));

      // Sales cycle days
      const baseCycle = stage === 'Closed Lost' ? 44 : 26;
      const salesCycleDays = Math.max(10, Math.round(baseCycle + (prng() - 0.5) * 20));

      const accountName = ACCOUNTS[Math.floor(prng() * ACCOUNTS.length)];
      const tierRoll = prng();
      const tier: 'Enterprise' | 'Mid-Market' | 'Scale-Up' = 
        revenue > 55000 ? 'Enterprise' : tierRoll > 0.4 ? 'Mid-Market' : 'Scale-Up';

      const dateStr = curDate.toISOString().split('T')[0];

      deals.push({
        id: `DL-${rep.region}-${dealIndex}`,
        date: dateStr,
        salesPerson: rep.name,
        region: rep.region,
        category,
        product,
        stage,
        revenue,
        discountPct,
        salesCycleDays,
        accountName,
        tier,
      });
    }
  }

  // Sort by date ascending
  deals.sort((a, b) => a.date.localeCompare(b.date));
  return deals;
}

export const SAMPLE_DEALS: Deal[] = generateOneYearDataset();
