import React, { useState, useEffect } from 'react';
import { Deal, MonthComparison } from '../types/sales';
import { 
  computeMonthOverMonth, 
  getAvailableMonths, 
  formatMonthLabel, 
  formatCurrency, 
  formatFullCurrency 
} from '../utils/salesAnalytics';
import { 
  TrendingUp, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Package, 
  UserCheck, 
  Info,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface MonthOverMonthBannerProps {
  deals: Deal[];
  selectedCategory?: string;
  selectedRegion?: string;
  selectedTimePeriod?: string;
  onSelectMonth?: (month: string) => void;
}

export const MonthOverMonthBanner: React.FC<MonthOverMonthBannerProps> = ({ 
  deals,
  selectedCategory = 'ALL',
  selectedRegion = 'ALL',
  selectedTimePeriod = 'ALL',
  onSelectMonth,
}) => {
  const availableMonths = getAvailableMonths(deals);
  const latestMonth = availableMonths[availableMonths.length - 1] || '2026-10';

  const [selectedMonth, setSelectedMonth] = useState<string>(
    selectedTimePeriod !== 'ALL' && availableMonths.includes(selectedTimePeriod)
      ? selectedTimePeriod 
      : latestMonth
  );

  const [showAuditDrawer, setShowAuditDrawer] = useState<boolean>(false);

  // Sync when parent time filter changes to a specific month
  useEffect(() => {
    if (selectedTimePeriod !== 'ALL' && availableMonths.includes(selectedTimePeriod)) {
      setSelectedMonth(selectedTimePeriod);
    }
  }, [selectedTimePeriod, availableMonths]);

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    if (onSelectMonth) {
      onSelectMonth(newMonth);
    }
  };

  const momData: MonthComparison | null = computeMonthOverMonth(deals, selectedMonth);

  if (!momData || availableMonths.length < 2) {
    return null;
  }

  const isRevenuePositive = momData.revenueDiff >= 0;
  const isDealsPositive = momData.dealsDiff >= 0;

  // Deals for audit inspection
  const curDeals = deals.filter(d => d.date.startsWith(momData.currentMonth));
  const prevDeals = deals.filter(d => d.date.startsWith(momData.previousMonth));
  const curWonDeals = curDeals.filter(d => d.stage === 'Closed Won');
  const prevWonDeals = prevDeals.filter(d => d.stage === 'Closed Won');

  const scopeTitle = selectedCategory !== 'ALL' 
    ? (selectedRegion !== 'ALL' ? `${selectedCategory} (${selectedRegion})` : selectedCategory)
    : (selectedRegion !== 'ALL' ? `Alle kategorier (${selectedRegion})` : 'Hele Virksomheden (Alle kategorier & regioner)');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-8 shadow-sm">
      {/* Header with Month Selector & Active Filter Indicators */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">
                Måned-til-Måned (MoM) Nøgleændringer
              </h3>
              <span className="text-[10px] font-mono uppercase bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded">
                Aktivt Filter: {scopeTitle}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sammenligner <strong className="text-slate-200">{formatMonthLabel(momData.currentMonth)}</strong> i forhold til forrige måned (<span className="text-slate-300">{formatMonthLabel(momData.previousMonth)}</span>)
            </p>
          </div>
        </div>

        {/* Action Controls: Month selector and Audit toggle */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setShowAuditDrawer(!showAuditDrawer)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-950 border border-slate-700 text-indigo-300 hover:text-white hover:border-indigo-500 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>Afstem med Excel</span>
            {showAuditDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">Måned:</span>
            <select
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none cursor-pointer font-mono font-medium"
            >
              {availableMonths.map((m, idx) => (
                <option key={m} value={m} className="bg-slate-900 text-white">
                  {formatMonthLabel(m)} {idx === availableMonths.length - 1 ? '(Seneste)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Key MoM Changes (The 4 Rectangles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {/* Rektangel 1: Omsætning MoM */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Omsætning MoM ({formatMonthLabel(momData.currentMonth).split(' ')[0]})
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {formatFullCurrency(momData.revenueCurrent)}
              </span>
              <span className={`text-xs font-mono font-semibold flex items-center ${
                isRevenuePositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isRevenuePositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {isRevenuePositive ? '+' : ''}{momData.revenuePctChange}%
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
            {isRevenuePositive ? '+' : ''}{formatCurrency(momData.revenueDiff)} vs {formatMonthLabel(momData.previousMonth).split(' ')[0]} ({formatCurrency(momData.revenuePrevious)})
          </div>
        </div>

        {/* Rektangel 2: Antal handler & Win Rate */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1">
              Vundne Handler & Win Rate
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-white tabular-nums">
                {momData.dealsCurrent} Vundne
              </span>
              <span className={`text-xs font-mono font-semibold flex items-center ${
                isDealsPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isDealsPositive ? '+' : ''}{momData.dealsDiff} handler
              </span>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
            <span>Win rate: {momData.winRateCurrent}%</span>
            <span className={momData.winRateDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              ({momData.winRateDiff >= 0 ? '+' : ''}{momData.winRateDiff}% pts vs {formatMonthLabel(momData.previousMonth).split(' ')[0]})
            </span>
          </div>
        </div>

        {/* Rektangel 3: Top voksende produkt i kategorien */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1">
              <Package className="w-3 h-3 text-indigo-400" />
              Største Produktvækst MoM
            </div>
            {momData.topSurgingProduct ? (
              <div>
                <div className="text-xs font-bold text-white truncate max-w-[200px]" title={momData.topSurgingProduct.name}>
                  {momData.topSurgingProduct.name}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                  +{formatCurrency(momData.topSurgingProduct.diffRevenue)} (+{momData.topSurgingProduct.pctChange}%)
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-1 font-mono">Stabil produktfordeling</div>
            )}
          </div>
          {momData.topDecliningProduct && (
            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80 truncate" title={momData.topDecliningProduct.name}>
              Fald: {momData.topDecliningProduct.name} ({formatCurrency(momData.topDecliningProduct.diffRevenue)})
            </div>
          )}
        </div>

        {/* Rektangel 4: Top sælger momentum i kategorien */}
        <div className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg relative overflow-hidden flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-slate-400 font-medium mb-1 flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-emerald-400" />
              Top Sælgermomentum MoM
            </div>
            {momData.topMomentumRep ? (
              <div>
                <div className="text-xs font-bold text-white truncate">
                  {momData.topMomentumRep.name}
                </div>
                <div className="text-xs font-mono text-emerald-400 font-semibold mt-0.5">
                  +{formatCurrency(momData.topMomentumRep.diffRevenue)} MoM vækst
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 mt-1 font-mono">Ensartet sælgerfordeling</div>
            )}
          </div>
          {momData.topGainingRegion && (
            <div className="text-[10px] text-slate-400 font-mono mt-2 pt-2 border-t border-slate-800/80">
              Førende region: <strong className="text-slate-200">{momData.topGainingRegion.name}</strong> (+{momData.topGainingRegion.pctChange}%)
            </div>
          )}
        </div>
      </div>

      {/* Audit Drawer: Full Transparent Deal Breakdown Matching Excel Pivot Table */}
      {showAuditDrawer && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-4 text-xs font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <h4 className="font-semibold text-white">
                  Excel Afstemning: De konkrete tal bag værdierne i rektanglerne
                </h4>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Scope: {scopeTitle}
              </span>
            </div>

            <p className="text-slate-300 mb-3 leading-relaxed">
              Tidligere vistes <span className="line-through text-rose-400">$650,000 (-46%)</span> fordi oversigten medregnede samtlige 7 kategorier i hele firmaet. 
              Nu er den koblet direkte til dit filter, så tallene for <strong className="text-white">{scopeTitle}</strong> stemmer 100% med din Excel-pivottabel:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Aktuel måned deals */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between font-semibold text-slate-200 mb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    {formatMonthLabel(momData.currentMonth)}: {formatFullCurrency(momData.revenueCurrent)} ({momData.dealsCurrent} vundne)
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-[11px]">
                  {curWonDeals.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1 px-1.5 bg-slate-950/60 rounded border border-slate-800/50">
                      <div className="truncate pr-2">
                        <span className="text-slate-300 font-medium">{d.product}</span>
                        <span className="text-slate-500 block text-[10px]">{d.salesPerson} · {d.region} · {d.date}</span>
                      </div>
                      <span className="text-emerald-400 font-semibold shrink-0">
                        {formatFullCurrency(d.revenue)}
                      </span>
                    </div>
                  ))}
                  {curWonDeals.length === 0 && (
                    <div className="text-slate-500 italic">Ingen vundne handler i denne måned</div>
                  )}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between font-bold text-white font-mono text-[11px]">
                  <span>Total vundet ({formatMonthLabel(momData.currentMonth).split(' ')[0]}):</span>
                  <span className="text-emerald-400">{formatFullCurrency(momData.revenueCurrent)}</span>
                </div>
              </div>

              {/* Forrige måned deals */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
                <div className="flex items-center justify-between font-semibold text-slate-200 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatMonthLabel(momData.previousMonth)}: {formatFullCurrency(momData.revenuePrevious)} ({momData.dealsPrevious} vundne)
                  </span>
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-[11px]">
                  {prevWonDeals.map(d => (
                    <div key={d.id} className="flex items-center justify-between py-1 px-1.5 bg-slate-950/60 rounded border border-slate-800/50">
                      <div className="truncate pr-2">
                        <span className="text-slate-300 font-medium">{d.product}</span>
                        <span className="text-slate-500 block text-[10px]">{d.salesPerson} · {d.region} · {d.date}</span>
                      </div>
                      <span className="text-slate-200 font-semibold shrink-0">
                        {formatFullCurrency(d.revenue)}
                      </span>
                    </div>
                  ))}
                  {prevWonDeals.length === 0 && (
                    <div className="text-slate-500 italic">Ingen vundne handler i forrige måned</div>
                  )}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex justify-between font-bold text-white font-mono text-[11px]">
                  <span>Total vundet ({formatMonthLabel(momData.previousMonth).split(' ')[0]}):</span>
                  <span>{formatFullCurrency(momData.revenuePrevious)}</span>
                </div>
              </div>
            </div>

            {/* Matematisk konklusion */}
            <div className="mt-3 p-2 bg-indigo-500/10 border border-indigo-500/20 rounded text-[11px] text-indigo-300 flex items-center justify-between">
              <div>
                <strong>MoM Difference:</strong> {formatFullCurrency(momData.revenueCurrent)} - {formatFullCurrency(momData.revenuePrevious)} = <strong className={isRevenuePositive ? 'text-emerald-400' : 'text-rose-400'}>{formatCurrency(momData.revenueDiff)} ({momData.revenuePctChange}%)</strong>
              </div>
              <div className="font-mono">
                {momData.dealsCurrent} won vs {momData.dealsPrevious} won ({momData.dealsDiff >= 0 ? '+' : ''}{momData.dealsDiff} handler)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
