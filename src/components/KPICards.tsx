import React from 'react';
import { ComprehensiveMetrics, formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { DollarSign, Target, Award, ArrowUpRight, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface KPICardsProps {
  metrics: ComprehensiveMetrics;
}

export const KPICards: React.FC<KPICardsProps> = ({ metrics }) => {
  const attainmentColor = 
    metrics.totalQuotaAttainment >= 100 
      ? 'text-emerald-400' 
      : metrics.totalQuotaAttainment >= 80 
        ? 'text-indigo-400' 
        : 'text-amber-400';

  const attainmentBg = 
    metrics.totalQuotaAttainment >= 100 
      ? 'bg-emerald-500/10 border-emerald-500/20' 
      : metrics.totalQuotaAttainment >= 80 
        ? 'bg-indigo-500/10 border-indigo-500/20' 
        : 'bg-amber-500/10 border-amber-500/20';

  return (
    <div id="overview" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* KPI 1: Closed Won Revenue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Closed Won Revenue</span>
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
          {formatFullCurrency(metrics.totalRevenue)}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>{metrics.totalDealsWon} won deals this month</span>
          <span className="font-mono text-emerald-400 flex items-center">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
            +18.4% MoM
          </span>
        </div>
      </div>

      {/* KPI 2: Team Quota Attainment */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Team Quota Attainment</span>
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${attainmentColor}`}>
            {metrics.totalQuotaAttainment}%
          </div>
          <span className="text-xs text-slate-500 font-mono">
            of {formatCurrency(metrics.totalTeamQuota)}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              metrics.totalQuotaAttainment >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.min(100, metrics.totalQuotaAttainment)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
          <span>{metrics.topPerformers.length} reps over 100%</span>
          <span className="text-amber-400">{metrics.laggingReps.length} lagging</span>
        </div>
      </div>

      {/* KPI 3: Win Rate & Deal Volume */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Win Rate & Volume</span>
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Award className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
            {metrics.winRate}%
          </div>
          <span className="text-xs text-slate-400">
            ({metrics.totalDealsWon}W / {metrics.totalDealsLost}L)
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span>{metrics.totalDealsClosed} total closed decisions</span>
          <span className="font-mono text-slate-300">
            {metrics.totalDealsPipeline} in flight
          </span>
        </div>
      </div>

      {/* KPI 4: Average Deal Size & Discount */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs font-medium">Avg Deal Size & Discount</span>
          <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
            {formatFullCurrency(metrics.avgDealSize)}
          </div>
          <span className="text-xs text-slate-400">/ deal</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="font-mono">{metrics.avgSalesCycleDays}d</span> avg cycle
          </span>
          <span className={`font-mono ${metrics.avgDiscount > 10 ? 'text-amber-400' : 'text-slate-300'}`}>
            {metrics.avgDiscount}% avg discount
          </span>
        </div>
      </div>
    </div>
  );
};
