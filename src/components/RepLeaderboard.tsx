import React, { useState } from 'react';
import { RepSummary, MetricType } from '../types/sales';
import { formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { 
  Trophy, 
  AlertTriangle, 
  TrendingUp, 
  ChevronDown, 
  ChevronUp, 
  ArrowUpDown, 
  UserCheck, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface RepLeaderboardProps {
  repSummaries: RepSummary[];
  selectedMetric: MetricType;
  onRepCoachingRequest: (rep: RepSummary) => void;
}

type SortField = 'revenue' | 'quotaAttainment' | 'dealsWon' | 'winRate' | 'avgDiscount' | 'avgCycleDays';

export const RepLeaderboard: React.FC<RepLeaderboardProps> = ({
  repSummaries,
  selectedMetric,
  onRepCoachingRequest,
}) => {
  const [sortField, setSortField] = useState<SortField>('quotaAttainment');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Group top performers and lagging reps
  const topPerformers = repSummaries.filter(r => r.quotaAttainment >= 100);
  const laggingReps = repSummaries.filter(r => r.quotaAttainment < 75);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortedReps = [...repSummaries].sort((a, b) => {
    let diff = 0;
    switch (sortField) {
      case 'revenue':
        diff = b.revenue - a.revenue;
        break;
      case 'quotaAttainment':
        diff = b.quotaAttainment - a.quotaAttainment;
        break;
      case 'dealsWon':
        diff = b.dealsWon - a.dealsWon;
        break;
      case 'winRate':
        diff = b.winRate - a.winRate;
        break;
      case 'avgDiscount':
        diff = b.avgDiscount - a.avgDiscount;
        break;
      case 'avgCycleDays':
        diff = b.avgCycleDays - a.avgCycleDays;
        break;
    }
    return sortAsc ? -diff : diff;
  });

  return (
    <section id="reps" className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Sales Rep Performance & Attention Matrix
            </h2>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs text-indigo-400 font-medium">Quota Attainment & Coaching Watchlist</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Key Question: <span className="text-slate-300 italic font-medium">Which sales persons are falling behind and need attention?</span>
          </p>
        </div>
      </div>

      {/* Two Focal Cards: Top Performers vs Lagging Reps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top Performers Spotlight */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Top Quota Achievers (100%+)</h3>
                <span className="text-[11px] text-slate-400 font-mono">Consistently exceeding targets</span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              {topPerformers.length} Reps
            </span>
          </div>

          <div className="space-y-3">
            {topPerformers.map(rep => (
              <div
                key={rep.name}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-950/80 border border-emerald-700/50 flex items-center justify-center text-emerald-300 font-mono text-xs font-bold">
                    {rep.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>{rep.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({rep.region})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {rep.dealsWon} won · {formatCurrency(rep.avgDealSize)} avg deal · {rep.winRate}% win rate
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                    {rep.quotaAttainment}%
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {formatCurrency(rep.revenue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Lagging Reps Watchlist */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Attention Watchlist (&lt;75% Quota)</h3>
                <span className="text-[11px] text-slate-400 font-mono">Underperforming or high deal friction</span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
              {laggingReps.length} Reps Needing Action
            </span>
          </div>

          <div className="space-y-3">
            {laggingReps.map(rep => {
              const gap = rep.quota - rep.revenue;
              return (
                <div
                  key={rep.name}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg hover:border-amber-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-950/80 border border-amber-700/50 flex items-center justify-center text-amber-300 font-mono text-xs font-bold">
                        {rep.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>{rep.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({rep.region})</span>
                        </div>
                        <div className="text-[11px] text-amber-300/80 font-mono">
                          Gap to target: {formatCurrency(gap)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-amber-400 font-mono tabular-nums">
                        {rep.quotaAttainment}%
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {formatCurrency(rep.revenue)} / {formatCurrency(rep.quota)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <div className="flex items-center gap-3 text-slate-400 font-mono">
                      <span>{rep.dealsLost} lost</span>
                      <span>·</span>
                      <span className={rep.avgDiscount > 12 ? 'text-amber-400' : ''}>
                        {rep.avgDiscount}% avg discount
                      </span>
                      <span>·</span>
                      <span>{rep.avgCycleDays}d cycle</span>
                    </div>

                    <button
                      onClick={() => onRepCoachingRequest(rep)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Coaching Plan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Full Interactive Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-200">
            All Representatives Ranked ({repSummaries.length} total)
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Click columns to sort</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-medium border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Sales Person</th>
                <th className="py-3 px-3">Region</th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('revenue')}
                >
                  <span className="inline-flex items-center gap-1">
                    Revenue
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('quotaAttainment')}
                >
                  <span className="inline-flex items-center gap-1">
                    Quota %
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('dealsWon')}
                >
                  <span className="inline-flex items-center gap-1">
                    Won / Lost
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('winRate')}
                >
                  <span className="inline-flex items-center gap-1">
                    Win Rate
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('avgDiscount')}
                >
                  <span className="inline-flex items-center gap-1">
                    Avg Disc.
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th 
                  className="py-3 px-3 text-right cursor-pointer hover:text-white"
                  onClick={() => handleSort('avgCycleDays')}
                >
                  <span className="inline-flex items-center gap-1">
                    Cycle (Days)
                    <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums text-slate-300">
              {sortedReps.map((rep, idx) => {
                const isTop = rep.quotaAttainment >= 100;
                const isLagging = rep.quotaAttainment < 75;

                return (
                  <tr key={rep.name} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-mono w-4">{idx + 1}.</span>
                      <span>{rep.name}</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {rep.region}
                    </td>
                    <td className="py-3 px-3 text-right text-white font-semibold">
                      {formatFullCurrency(rep.revenue)}
                    </td>
                    <td className={`py-3 px-3 text-right font-bold ${
                      isTop ? 'text-emerald-400' : isLagging ? 'text-amber-400' : 'text-indigo-400'
                    }`}>
                      {rep.quotaAttainment}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {rep.dealsWon}W / {rep.dealsLost}L
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {rep.winRate}%
                    </td>
                    <td className={`py-3 px-3 text-right ${rep.avgDiscount > 12 ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
                      {rep.avgDiscount}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400">
                      {rep.avgCycleDays}d
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isTop && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Exceeding Quota
                        </span>
                      )}
                      {isLagging && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Needs Coaching
                        </span>
                      )}
                      {!isTop && !isLagging && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-800 text-slate-400">
                          On Track
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
