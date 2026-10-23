import React from 'react';
import { MetricType, Region, ProductCategory } from '../types/sales';
import { DollarSign, CheckCircle2, TrendingUp, Percent, Target, Filter } from 'lucide-react';

interface MetricSwitcherProps {
  selectedMetric: MetricType;
  onSelectMetric: (metric: MetricType) => void;
  selectedRegion: Region | 'ALL';
  onSelectRegion: (region: Region | 'ALL') => void;
  selectedCategory: ProductCategory | 'ALL';
  onSelectCategory: (cat: ProductCategory | 'ALL') => void;
  activeDatasetName: string;
  onResetToDefault: () => void;
  isCustomDataset: boolean;
}

export const MetricSwitcher: React.FC<MetricSwitcherProps> = ({
  selectedMetric,
  onSelectMetric,
  selectedRegion,
  onSelectRegion,
  selectedCategory,
  onSelectCategory,
  activeDatasetName,
  onResetToDefault,
  isCustomDataset,
}) => {
  const metrics: { id: MetricType; label: string; icon: React.ReactNode }[] = [
    { id: 'revenue', label: 'Revenue ($)', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { id: 'dealsClosed', label: 'Deals Won (#)', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
    { id: 'avgDealSize', label: 'Avg Deal Size', icon: <TrendingUp className="w-3.5 h-3.5" /> },
    { id: 'winRate', label: 'Win Rate (%)', icon: <Percent className="w-3.5 h-3.5" /> },
    { id: 'quotaAttainment', label: 'Quota Attainment', icon: <Target className="w-3.5 h-3.5" /> },
  ];

  const regions: (Region | 'ALL')[] = ['ALL', 'US', 'Europe', 'Asia'];

  const categories: (ProductCategory | 'ALL')[] = [
    'ALL',
    'Cloud & Infrastructure',
    'Security & Compliance',
    'AI & Data Intelligence',
    'Collaboration & Workflows',
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Metric Switcher buttons */}
        <div>
          <div className="text-[11px] font-mono tracking-wider text-slate-400 mb-2 uppercase flex items-center gap-1.5">
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
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[220px]">
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

      {/* Filter Row: Region & Category */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          {/* Region filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 flex items-center gap-1 text-[11px]">
              <Filter className="w-3 h-3 text-slate-500" /> Region:
            </span>
            <div className="flex gap-1">
              {regions.map(reg => (
                <button
                  key={reg}
                  onClick={() => onSelectRegion(reg)}
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap cursor-pointer ${
                    selectedRegion === reg
                      ? 'bg-slate-700 text-white font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {reg === 'ALL' ? 'All Regions' : reg}
                </button>
              ))}
            </div>
          </div>

          <span className="hidden sm:inline text-slate-700">|</span>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-[11px]">Category:</span>
            <select
              value={selectedCategory}
              onChange={e => onSelectCategory(e.target.value as ProductCategory | 'ALL')}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs rounded px-2.5 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {categories.map(c => (
                <option key={c} value={c}>
                  {c === 'ALL' ? 'All Categories (20 Products)' : c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Filters Reset if not ALL */}
        {(selectedRegion !== 'ALL' || selectedCategory !== 'ALL') && (
          <button
            onClick={() => {
              onSelectRegion('ALL');
              onSelectCategory('ALL');
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
};
