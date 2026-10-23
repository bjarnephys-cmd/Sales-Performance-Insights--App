export type Region = 'US' | 'Europe' | 'Asia';

export type ProductCategory = 
  | 'Cloud & Infrastructure'
  | 'Security & Compliance'
  | 'AI & Data Intelligence'
  | 'Collaboration & Workflows';

export type DealStage = 'Closed Won' | 'Closed Lost' | 'In Pipeline';

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
  avgDiscount: number;
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
