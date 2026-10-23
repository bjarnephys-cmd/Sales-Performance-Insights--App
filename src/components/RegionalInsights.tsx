import React from 'react';
import { RegionSummary, MetricType } from '../types/sales';
import { formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { Globe, Trophy, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';

interface RegionalInsightsProps {
  regionalSummaries: RegionSummary[];
  selectedMetric: MetricType;
  onSelectRegionFilter: (reg: string) => void;
}

export const RegionalInsights: React.FC<RegionalInsightsProps> = ({
  regionalSummaries,
  selectedMetric,
  onSelectRegionFilter,
}) => {
  // Sort regions by revenue or selected metric
  const sorted = [...regionalSummaries].sort((a, b) => {
    if (selectedMetric === 'dealsClosed') return b.dealsWon - a.dealsWon;
    if (selectedMetric === 'avgDealSize') return b.avgDealSize - a.avgDealSize;
    if (selectedMetric === 'winRate') return b.winRate - a.winRate;
    if (selectedMetric === 'quotaAttainment') return b.quotaAttainment - a.quotaAttainment;
    return b.revenue - a.revenue;
  });

  const topRegion = sorted[0];

  // Helper for metric value display
  const getMetricDisplay = (reg: RegionSummary) => {
    switch (selectedMetric) {
      case 'dealsClosed':
        return `${reg.dealsWon} won`;
      case 'avgDealSize':
        return formatCurrency(reg.avgDealSize);
      case 'winRate':
        return `${reg.winRate}%`;
      case 'quotaAttainment':
        return `${reg.quotaAttainment}%`;
      case 'revenue':
      default:
        return formatCurrency(reg.revenue);
    }
  };

  const getMetricValueForBar = (reg: RegionSummary) => {
    switch (selectedMetric) {
      case 'dealsClosed':
        return reg.dealsWon;
      case 'avgDealSize':
        return reg.avgDealSize;
      case 'winRate':
        return reg.winRate;
      case 'quotaAttainment':
        return reg.quotaAttainment;
      case 'revenue':
      default:
        return reg.revenue;
    }
  };

  const maxValue = Math.max(...regionalSummaries.map(getMetricValueForBar), 1);

  return (
    <section id="regions" className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Regional Performance Analysis
            </h2>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs text-indigo-400 font-medium">US, Europe & Asia</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Key Question: <span className="text-slate-300 italic font-medium">Which regions are performing best?</span>
          </p>
        </div>

        {topRegion && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-xs">
            <Trophy className="w-3.5 h-3.5" />
            <span>Top Performing Region: <strong className="font-semibold text-white">{topRegion.region}</strong></span>
          </div>
        )}
      </div>

      {/* Regional Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {regionalSummaries.map(reg => {
          const isTop = reg.region === topRegion?.region;
          const attainment = reg.quotaAttainment;

          return (
            <div
              key={reg.region}
              className={`bg-slate-900 border rounded-xl p-5 transition-all relative overflow-hidden ${
                isTop ? 'border-indigo-500/40 shadow-sm' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-semibold text-xs">
                    {reg.region === 'US' ? 'US' : reg.region === 'Europe' ? 'EU' : 'APAC'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {reg.region === 'US' ? 'United States' : reg.region === 'Europe' ? 'Europe (EMEA)' : 'Asia-Pacific (APAC)'}
                    </h3>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Target: {formatCurrency(reg.quota)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-base font-bold font-mono tabular-nums ${
                    attainment >= 100 ? 'text-emerald-400' : attainment >= 80 ? 'text-indigo-400' : 'text-amber-400'
                  }`}>
                    {attainment}%
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono">
                    Quota
                  </div>
                </div>
              </div>

              {/* Revenue & Deals summary */}
              <div className="space-y-2 py-3 border-y border-slate-800/80 my-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Revenue:</span>
                  <span className="text-white font-mono font-semibold tabular-nums">
                    {formatFullCurrency(reg.revenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Deals Won / Lost:</span>
                  <span className="text-slate-200 font-mono tabular-nums">
                    {reg.dealsWon}W / {reg.dealsLost}L ({reg.winRate}% win rate)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Deal Size:</span>
                  <span className="text-slate-200 font-mono tabular-nums">
                    {formatCurrency(reg.avgDealSize)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Discount:</span>
                  <span className={`font-mono tabular-nums ${reg.avgDiscount > 10 ? 'text-amber-400' : 'text-slate-300'}`}>
                    {reg.avgDiscount}%
                  </span>
                </div>
              </div>

              {/* Top rep & product footnotes */}
              <div className="text-[11px] space-y-1.5 text-slate-400">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Top Rep:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[140px]">{reg.topRep}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Top Product:</span>
                  <span className="text-slate-200 font-medium truncate max-w-[140px]">{reg.topProduct}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => onSelectRegionFilter(reg.region)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                >
                  <span>Filter by {reg.region}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Visual Benchmark Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-slate-400 font-medium">
            Side-by-Side Comparison: <strong className="text-slate-200 font-semibold">{selectedMetric.toUpperCase()}</strong>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">Normalized share of performance</span>
        </div>

        <div className="space-y-3">
          {regionalSummaries.map(reg => {
            const rawVal = getMetricValueForBar(reg);
            const pct = Math.round((rawVal / maxValue) * 100);
            return (
              <div key={reg.region} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    {reg.region}
                  </span>
                  <span className="text-white font-mono font-semibold tabular-nums">
                    {getMetricDisplay(reg)}
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800/80">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(5, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
