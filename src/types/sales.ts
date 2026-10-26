export type Region = 'US' | 'Europe' | 'Asia';

export type ProductCategory = 
  | 'Cloud & Infrastructure'
  | 'Security & Compliance'
  | 'AI & Data Intelligence'
  | 'Collaboration & Workflows'
  | 'Analytics & BI Intelligence'
  | 'Customer Success & Retention'
  | 'Developer Platforms & APIs'
  | string;

export type DealStage = 'Closed Won' | 'Closed Lost' | 'In Pipeline';

export type StageFilter = 'Closed Won' | 'In Pipeline' | 'Closed Lost' | 'ALL';

export interface Deal {
  id: string;
  date: string; // YYYY-MM-DD
  salesPerson: string;
  region: Region;
  category: ProductCategory;
  product: string;
  stage: DealStage;
  revenue: number; // In USD
  discountPct: number; // e.g. 10 for 10%
  salesCycleDays: number;
  accountName: string;
  tier: 'Enterprise' | 'Mid-Market' | 'Scale-Up';
}

export interface SalesRepProfile {
  name: string;
  region: Region;
  quota: number; // Monthly quota in USD
  annualQuota?: number; // Annual target in USD
  avatarInitials: string;
}

export type MetricType = 'revenue' | 'dealsClosed' | 'avgDealSize' | 'winRate' | 'quotaAttainment';

export interface RegionSummary {
  region: Region;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  totalDeals: number;
  avgDealSize: number;
  winRate: number;
  avgDiscount: number; // Primary discount (Won deals when reporting won metrics)
  avgDiscountWon: number; // Strictly Won deals discount (e.g. 8.6% for US)
  avgDiscountAll: number; // All stages discount (e.g. 10.3% for US)
  quota: number;
  quotaAttainment: number;
  topProduct: string;
  topRep: string;
}

export interface RepSummary {
  name: string;
  region: Region;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  totalDeals: number;
  avgDealSize: number;
  winRate: number;
  quota: number;
  quotaAttainment: number;
  avgDiscount: number;
  avgDiscountWon: number;
  avgDiscountAll: number;
  avgCycleDays: number;
  status: 'ahead' | 'on_track' | 'lagging';
}

export interface ProductSummary {
  product: string;
  category: ProductCategory;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  avgDealSize: number;
  winRate: number;
  avgDiscount: number;
  avgDiscountWon: number;
  avgDiscountAll: number;
}

export interface CategorySummary {
  category: ProductCategory;
  revenue: number;
  dealsWon: number;
  dealsLost: number;
  avgDealSize: number;
  winRate: number;
  products: ProductSummary[];
}

export interface MonthComparison {
  currentMonth: string; // YYYY-MM
  previousMonth: string; // YYYY-MM
  revenueCurrent: number;
  revenuePrevious: number;
  revenueDiff: number;
  revenuePctChange: number;
  dealsCurrent: number;
  dealsPrevious: number;
  dealsDiff: number;
  dealsPctChange: number;
  winRateCurrent: number;
  winRatePrevious: number;
  winRateDiff: number;
  topGainingRegion: { name: string; diffRevenue: number; pctChange: number } | null;
  topDecliningRegion: { name: string; diffRevenue: number; pctChange: number } | null;
  topSurgingProduct: { name: string; diffRevenue: number; pctChange: number } | null;
  topDecliningProduct: { name: string; diffRevenue: number; pctChange: number } | null;
  topMomentumRep: { name: string; diffRevenue: number; pctChange: number } | null;
  topDecliningRep: { name: string; diffRevenue: number; pctChange: number } | null;
}

export interface WeeklyTimePoint {
  weekKey: string; // YYYY-Www or YYYY-MM-DD
  weekLabel: string; // e.g. "Oct 12"
  timestamp: number;
  values: Record<string, number>; // item name -> value (revenue or deals)
  total: number;
}

export interface ExecutiveReport {
  headline: string;
  executiveOverview: string;
  regionalBreakdown: {
    region: string;
    verdict: string;
    commentary: string;
  }[];
  topPerformers: {
    name: string;
    highlight: string;
    tacticsToReplicate: string;
  }[];
  attentionAreas: {
    subject: string;
    severity: string;
    issue: string;
    action: string;
  }[];
  productInsights: {
    category: string;
    status: string;
    observation: string;
  }[];
  managerActionItems: string[];
}

