import React from 'react';
import { MetricType, Region, ProductCategory, StageFilter } from '../types/sales';
import { formatMonthLabel } from '../utils/salesAnalytics';
import { 
  DollarSign, 
  CheckCircle2, 
  TrendingUp, 
  Percent, 
  Target, 
  Filter, 
  Calendar, 
  Layers,
  X 
} from 'lucide-react';

interface MetricSwitcherProps {
  selectedMetric: MetricType;
  onSelectMetric: (metric: MetricType) => void;
  selectedRegion: Region | 'ALL';
  onSelectRegion: (region: Region | 'ALL') => void;
  selectedCategory: ProductCategory | 'ALL';
  onSelectCategory: (cat: ProductCategory | 'ALL') => void;
  selectedStage: StageFilter;
  onSelectStage: (stage: StageFilter) => void;
  selectedTimePeriod: string; // 'ALL' or 'YYYY-MM'
  onSelectTimePeriod: (period: string) => void;
  availableMonths: string[];
  activeDatasetName: string;
  onResetToDefault: () => void;
  isCustomDataset: boolean;
  availableCategories?: string[];
}

export const MetricSwitcher: React.FC<MetricSwitcherProps> = ({
  selectedMetric,
  onSelectMetric,
  selectedRegion,
  onSelectRegion,
  selectedCategory,
  onSelectCategory,
  selectedStage,
  onSelectStage,
  selectedTimePeriod,
  onSelectTimePeriod,
  availableMonths,
  activeDatasetName,
  onResetToDefault,
  isCustomDataset,
  availableCategories,
}) => {
  const metrics: { id: MetricType; label: string; icon: React.ReactNode }[] = [
    { id: 'revenue', label: 'Revenue ($)', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'dealsClosed', label: 'Deals Won (#)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'avgDealSize', label: 'Avg Deal Size', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'winRate', label: 'Win Rate (%)', icon: <Percent className="w-3.5 h-3.5" /> },
    { id: 'quotaAttainment', label: 'Quota Attainment', icon: <Target className="w-3.5 h-3.5" /> },
  ];

  const regions: (Region | 'ALL')[] = ['ALL', 'US', 'Europe', 'Asia'];

  const stageOptions: { id: StageFilter; label: string; desc: string }[] = [
    { id: 'Closed Won', label: 'Closed Won', desc: 'Realized Revenue' },
    { id: 'ALL', label: 'All Stages', desc: 'Won + Pipeline + Lost' },
    { id: 'In Pipeline', label: 'In Pipeline', desc: 'Active Opportunities' },
    { id: 'Closed Lost', label: 'Closed Lost', desc: 'Lost Deals' },
  ];

  const defaultCategories = [
    'Cloud & Infrastructure',
    'Security & Compliance',
    'AI & Data Intelligence',
    'Collaboration & Workflows',
    'Analytics & BI Intelligence',
    'Customer Success & Retention',
    'Developer Platforms & APIs',
  ];

  const categoryList: (string | 'ALL')[] = [
    'ALL',
    ...(availableCategories && availableCategories.length > 0 ? availableCategories : defaultCategories),
  ];

  const hasActiveFilters = 
    selectedRegion !== 'ALL' || 
    selectedCategory !== 'ALL' || 
    selectedStage !== 'Closed Won' || 
    selectedTimePeriod !== 'ALL';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm mb-6 space-y-4">
      {/* Row 1: Primary Metric Switcher & Dataset Info */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-mono tracking-wider text-slate-400 mb-1.5 uppercase flex items-center gap-1.5">
            <span>Primary Analysis Metric</span>
            <span className="text-slate-600">·</span>
            <span className="text-slate-500 font-sans normal-case">Controls all charts & rankings below</span>
          </div>
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-lg">
            {metrics.map(m => {
              const active = selectedMetric === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => onSelectMetric(m.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dataset source indicator */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-mono text-slate-400">Current Dataset</div>
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[240px]">
              {activeDatasetName}
            </div>
          </div>
          {isCustomDataset && (
            <button
              onClick={onResetToDefault}
              className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer whitespace-nowrap"
            >
              Reset to Master Sample
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Deep Filters (Time Period, Stage, Region, Category) */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Time Period Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Calendar className="w-3 h-3 text-indigo-400" /> Period:
            </span>
            <select
              value={selectedTimePeriod}
              onChange={e => onSelectTimePeriod(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-mono"
            >
              <option value="ALL">All 12 Months (Full Year)</option>
              {availableMonths.map((m, idx) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)} {idx === availableMonths.length - 1 ? '(Latest)' : ''}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Deal Stage Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Layers className="w-3 h-3 text-emerald-400" /> Stage:
            </span>
            <select
              value={selectedStage}
              onChange={e => onSelectStage(e.target.value as StageFilter)}
              className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer font-medium"
            >
              {stageOptions.map(s => (
                <option key={s.id} value={s.id}>
                  {s.label} ({s.desc})
                </option>
              ))}
            </select>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Region filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-slate-500" /> Region:
            </span>
            <div className="flex gap-1">
              {regions.map(reg => (
                <button
                  key={reg}
                  onClick={() => onSelectRegion(reg)}
                  className={`px-2 py-0.5 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedRegion === reg
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {reg === 'ALL' ? 'All' : reg}
                </button>
              ))}
            </div>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => onSelectCategory(e.target.value as ProductCategory | 'ALL')}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categoryList.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => {
              onSelectRegion('ALL');
              onSelectCategory('ALL');
              onSelectStage('Closed Won');
              onSelectTimePeriod('ALL');
            }}
            className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-medium cursor-pointer underline"
          >
            <X className="w-3 h-3" />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    </div>
  );
};
