import React from 'react';
import { ComprehensiveMetrics, formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { 
  DollarSign, 
  Target, 
  Award, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Clock, 
  Layers, 
  Info,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface KPICardsProps {
  metrics: ComprehensiveMetrics;
  selectedCategory?: string;
  selectedRegion?: string;
  selectedStage?: string;
  selectedTimePeriod?: string;
  onOpenTargetSettings?: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ 
  metrics,
  selectedCategory = 'ALL',
  selectedRegion = 'ALL',
  selectedStage = 'Closed Won',
  selectedTimePeriod = 'ALL',
  onOpenTargetSettings,
}) => {
  const attainmentColor = 
    metrics.totalQuotaAttainment >= 100 
      ? 'text-emerald-400' 
      : metrics.totalQuotaAttainment >= 80 
        ? 'text-indigo-400' 
        : 'text-amber-400';

  const mom = metrics.filterMoMChange;
  const isMomPositive = mom ? mom.pct >= 0 : true;

  // Determine title for Card 1 based on stage
  let revCardTitle = 'Closed Won Revenue';
  if (selectedStage === 'In Pipeline') revCardTitle = 'Active Pipeline Value';
  else if (selectedStage === 'Closed Lost') revCardTitle = 'Closed Lost Value';
  else if (selectedStage === 'ALL') revCardTitle = 'Total Value (Won + Pipeline + Lost)';

  const [showQuotaExplainer, setShowQuotaExplainer] = React.useState(false);

  // Quota Card Title
  let quotaCardTitle = 'Team Quota Attainment';
  if (selectedCategory !== 'ALL' && selectedRegion !== 'ALL') {
    quotaCardTitle = `${selectedCategory} (${selectedRegion}) Target`;
  } else if (selectedCategory !== 'ALL') {
    quotaCardTitle = `${selectedCategory} Target`;
  } else if (selectedRegion !== 'ALL') {
    quotaCardTitle = `${selectedRegion} Quota Target`;
  }

  return (
    <div id="overview" className="mb-8">
      {/* Scope & Stage Explanation Banner */}
      <div className="mb-3 px-3 py-1.5 bg-slate-900/90 border border-slate-800 rounded-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span>
            Active Scope: <strong className="text-white">{metrics.periodLabel}</strong> · Region: <strong className="text-white">{selectedRegion === 'ALL' ? 'All Regions' : selectedRegion}</strong> · Category: <strong className="text-white">{selectedCategory === 'ALL' ? 'All Categories' : selectedCategory}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-slate-500">Stage Filter:</span>
          <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {selectedStage === 'ALL' ? 'All Stages (Won + Pipeline + Lost)' : selectedStage}
          </span>
        </div>
      </div>

      {/* The 4 Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Revenue with REAL Dynamic MoM */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-200">{revCardTitle}</span>
              <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
              {formatFullCurrency(metrics.totalRevenue)}
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>
                {selectedTimePeriod === 'ALL' ? (
                  <span>{metrics.totalDealsWon} won deals (12 Mo.)</span>
                ) : (
                  <span>{metrics.totalDealsWon} won deals ({metrics.periodLabel.split(' ')[0]})</span>
                )}
              </span>

              {/* Real Mathematical MoM Badge */}
              {mom ? (
                <span 
                  className={`font-mono text-xs font-semibold flex items-center px-1.5 py-0.5 rounded ${
                    isMomPositive 
                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                      : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                  }`}
                  title={`${mom.curMonth} ($${(mom.curRev/1000).toFixed(0)}k) vs ${mom.prevMonth} ($${(mom.prevRev/1000).toFixed(0)}k)`}
                >
                  {isMomPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                  {isMomPositive ? '+' : ''}{mom.pct}% MoM
                </span>
              ) : (
                <span className="text-slate-500 text-[11px] font-mono">Baseline</span>
              )}
            </div>

            {mom && (
              <div className="text-[10px] text-slate-500 font-mono text-right">
                vs {mom.prevMonth.split('-')[1]}/{mom.prevMonth.split('-')[0].substring(2)} ({formatCurrency(mom.prevRev)})
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: Team / Scope Quota Attainment (Scaled properly by period and category) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-200 truncate pr-2" title={quotaCardTitle}>
                {quotaCardTitle}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                {onOpenTargetSettings && (
                  <button
                    type="button"
                    onClick={onOpenTargetSettings}
                    title="Se & indtast sælgerkvoter og årsbudget ($22.26M)"
                    className="text-[10px] text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>Indtast mål</span>
                  </button>
                )}
                <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Target className="w-4 h-4" />
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className={`text-2xl font-bold font-mono tabular-nums tracking-tight ${attainmentColor}`}>
                {metrics.totalQuotaAttainment}%
              </div>
              <span className="text-xs text-slate-400 font-mono">
                af {formatCurrency(metrics.scopeTarget)} {metrics.isFilteredScope ? 'mål' : 'kvote'}
              </span>
            </div>

            {metrics.isFilteredScope && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-mono text-indigo-400">
                <span className="text-slate-500">Portefølje-andel:</span>
                <span className="bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-300 font-semibold">
                  {metrics.portfolioSharePct}% af {formatCurrency(metrics.totalTeamQuota)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800/80">
            {/* Progress bar */}
            <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden mb-1.5">
              <div 
                className={`h-full transition-all duration-500 ${
                  metrics.totalQuotaAttainment >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, metrics.totalQuotaAttainment)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="text-slate-500 font-mono">
                {selectedTimePeriod === 'ALL' ? 'Årsbudget (12 mdr)' : '1 Måned'}
              </span>
              <span className="text-slate-300 font-mono">
                {metrics.topPerformers.length} foran · {metrics.laggingReps.length} bagud
              </span>
            </div>

            {/* Explanation button and accordion for user clarification */}
            <div className="mt-2 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                onClick={() => setShowQuotaExplainer(!showQuotaExplainer)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Info className="w-3 h-3" />
                <span>{showQuotaExplainer ? 'Skjul forklaring' : `Hvorfor portefølje-andel vs ${formatCurrency(metrics.totalTeamQuota)}? (Forklaring)`}</span>
              </button>

              {showQuotaExplainer && (
                <div className="mt-2 p-2.5 bg-slate-950/90 border border-indigo-500/30 rounded-lg text-[11px] text-slate-300 space-y-1.5 leading-relaxed font-sans">
                  <div className="font-semibold text-white text-[11px]">
                    Beregning for {metrics.filterExplanation.scopeName}:
                  </div>
                  <div>
                    • <strong>Virksomhedens samlede årsbudget:</strong> {formatFullCurrency(metrics.totalTeamQuota)} (sum af alle sælgeres års-targets).
                  </div>
                  <div>
                    • <strong>Hvorfor 13%?</strong> Vundne handler for {metrics.filterExplanation.scopeName} er {formatFullCurrency(metrics.filterExplanation.actualWon)}. {formatFullCurrency(metrics.filterExplanation.actualWon)} ÷ {formatFullCurrency(metrics.totalTeamQuota)} = <strong className="text-amber-400">{metrics.portfolioSharePct}%</strong>.
                  </div>
                  <div>
                    • <strong>Kategoriens eget budgetmål:</strong> {formatFullCurrency(metrics.scopeTarget)} (proportional andel af porteføljen).
                  </div>
                  <div className="text-emerald-400 font-medium">
                    ✓ Målopfyldelse for selve kategorien er <strong className="text-white">{metrics.scopeQuotaAttainment}%</strong>, og sælgernes mål er nu skaleret til kategorien.
                  </div>
                  {onOpenTargetSettings && (
                    <div className="pt-2 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">Vil du se eller indtaste nye mål for sælgerne?</span>
                      <button
                        type="button"
                        onClick={onOpenTargetSettings}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                      >
                        Åbn Målstyring &rarr;
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3: Win Rate & Explicit Stage Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-200">Win Rate & Stage Breakdown</span>
              <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
                {metrics.winRate}%
              </div>
              <span className="text-xs text-slate-400 font-mono">
                ({metrics.totalDealsWon}W / {metrics.totalDealsLost}L)
              </span>
            </div>
          </div>

          {/* Explicit stage accounting */}
          <div className="mt-4 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono space-y-0.5">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Won:
              </span>
              <span>{metrics.totalDealsWon} deals ({formatCurrency(metrics.wonRevenue)})</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-rose-400" /> Lost:
              </span>
              <span>{metrics.totalDealsLost} deals ({formatCurrency(metrics.lostRevenue)})</span>
            </div>
            <div className="flex items-center justify-between text-indigo-300">
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" /> Pipeline:
              </span>
              <span>{metrics.totalDealsPipeline} deals ({formatCurrency(metrics.pipelineRevenue)})</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Average Deal Size & Discount */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold text-slate-200">Avg Deal Size & Discount</span>
              <div className="w-7 h-7 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <div className="text-2xl font-bold text-white font-mono tabular-nums tracking-tight">
                {formatFullCurrency(metrics.avgDealSize)}
              </div>
              <span className="text-xs text-slate-400">/ won deal</span>
            </div>
          </div>

          <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1 text-[11px]">
              <Clock className="w-3 h-3 text-slate-500" />
              <span className="font-mono">{metrics.avgSalesCycleDays}d</span> avg cycle
            </span>
            <span className="text-[11px] font-mono text-right" title={`Rabat på vundne: ${metrics.avgDiscountWon}% · Rabat på alle stages (Won+Lost): ${metrics.avgDiscountAll}%`}>
              <span className={metrics.avgDiscountWon > 10 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                {metrics.avgDiscountWon}%
              </span>
              <span className="text-slate-300 font-normal"> (Won)</span>
              <span className="text-slate-500 font-normal text-[10px] ml-1">· {metrics.avgDiscountAll}% alle</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
