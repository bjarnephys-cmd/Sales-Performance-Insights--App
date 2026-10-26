import React, { useState, useEffect, useMemo } from 'react';
import { SAMPLE_DEALS, REPS_CONFIG } from './data/sampleDataset';
import { Deal, MetricType, Region, ProductCategory, StageFilter, ExecutiveReport, RepSummary, SalesRepProfile } from './types/sales';
import { computeSalesMetrics, getAvailableMonths, formatCurrency, formatFullCurrency } from './utils/salesAnalytics';
import { triggerDownload, exportDealsToCSV } from './utils/spreadsheetParser';

import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { MonthOverMonthBanner } from './components/MonthOverMonthBanner';
import { MetricSwitcher } from './components/MetricSwitcher';
import { ProductTrendChart } from './components/ProductTrendChart';
import { RepTrendChart } from './components/RepTrendChart';
import { RegionalInsights } from './components/RegionalInsights';
import { RepLeaderboard } from './components/RepLeaderboard';
import { ProductPerformance } from './components/ProductPerformance';
import { AskSalesAssistant } from './components/AskSalesAssistant';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { SpreadsheetUploadModal } from './components/SpreadsheetUploadModal';
import { ShareModal } from './components/ShareModal';
import { TargetSettingsModal } from './components/TargetSettingsModal';

export default function App() {
  const [deals, setDeals] = useState<Deal[]>(SAMPLE_DEALS);
  const [datasetName, setDatasetName] = useState<string>(
    'Master SaaS Dataset (1 Year · Europe, Asia, US · 7 Categories · 39 Products)'
  );
  const [isCustomDataset, setIsCustomDataset] = useState<boolean>(false);

  // URL query parameter parsing for sharing
  const urlParams = new URLSearchParams(window.location.search);
  const initialMetric = (urlParams.get('metric') as MetricType) || 'revenue';
  const initialRegion = (urlParams.get('region') as Region | 'ALL') || 'ALL';
  const initialCat = (urlParams.get('category') as ProductCategory | 'ALL') || 'ALL';
  const initialStage = (urlParams.get('stage') as StageFilter) || 'Closed Won';
  const initialPeriod = urlParams.get('period') || 'ALL';

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(initialMetric);
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>(initialCat);
  const [selectedStage, setSelectedStage] = useState<StageFilter>(initialStage);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<string>(initialPeriod);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isTargetSettingsOpen, setIsTargetSettingsOpen] = useState(false);

  // Sales Rep Quota / Target Configurations (persisted in localStorage)
  const [repsConfig, setRepsConfig] = useState<SalesRepProfile[]>(() => {
    try {
      const saved = localStorage.getItem('salespulse_reps_config_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse saved reps config', e);
    }
    return REPS_CONFIG;
  });

  const handleSaveRepsConfig = (updatedReps: SalesRepProfile[]) => {
    setRepsConfig(updatedReps);
    try {
      localStorage.setItem('salespulse_reps_config_v2', JSON.stringify(updatedReps));
    } catch (e) {
      console.error('Failed to save reps config to localStorage', e);
    }
  };

  const handleResetRepsConfig = () => {
    setRepsConfig(REPS_CONFIG);
    try {
      localStorage.removeItem('salespulse_reps_config_v2');
      localStorage.removeItem('salespulse_reps_config');
    } catch (e) {
      console.error('Failed to remove saved reps config', e);
    }
  };

  // AI Executive Report State
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Available unique months in loaded dataset
  const availableMonths = useMemo(() => {
    return getAvailableMonths(deals);
  }, [deals]);

  // Dynamic categories from loaded deals
  const availableCategories = useMemo(() => {
    return Array.from(new Set(deals.map(d => d.category))).filter(Boolean);
  }, [deals]);

  // Filter deals based on active filters (Region, Category, TimePeriod)
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedRegion !== 'ALL' && deal.region !== selectedRegion) return false;
      if (selectedCategory !== 'ALL' && deal.category !== selectedCategory) return false;
      if (selectedTimePeriod !== 'ALL' && !deal.date.startsWith(selectedTimePeriod)) return false;
      return true;
    });
  }, [deals, selectedRegion, selectedCategory, selectedTimePeriod]);

  // Deals filtered by Region & Category across all 12 months (for MoM calculations)
  const categoryAndRegionFilteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedRegion !== 'ALL' && deal.region !== selectedRegion) return false;
      if (selectedCategory !== 'ALL' && deal.category !== selectedCategory) return false;
      return true;
    });
  }, [deals, selectedRegion, selectedCategory]);

  // Compute comprehensive metrics with full context and dynamic rep quotas
  const metrics = useMemo(() => {
    return computeSalesMetrics(filteredDeals, repsConfig, {
      stageFilter: selectedStage,
      timePeriod: selectedTimePeriod,
      allUnfilteredDeals: deals,
      selectedCategory,
      selectedRegion,
    });
  }, [filteredDeals, repsConfig, deals, selectedStage, selectedTimePeriod, selectedCategory, selectedRegion]);

  // Generate executive summary via server-side Gemini API
  const handleGenerateReport = async (tone = 'executive') => {
    setIsGeneratingReport(true);
    try {
      const payload = {
        focusArea: selectedCategory !== 'ALL' ? `Category: ${selectedCategory}` : 'Full Portfolio',
        tone,
        datasetSummary: {
          period: metrics.periodLabel,
          stageMeasured: selectedStage,
          totalRevenueUSD: metrics.totalRevenue,
          wonRevenueUSD: metrics.wonRevenue,
          pipelineRevenueUSD: metrics.pipelineRevenue,
          lostRevenueUSD: metrics.lostRevenue,
          teamQuotaAttainmentPct: metrics.totalQuotaAttainment,
          winRatePct: metrics.winRate,
          avgDealSizeUSD: metrics.avgDealSize,
          avgDiscountPct: metrics.avgDiscountWon,
          avgDiscountWonPct: metrics.avgDiscountWon,
          avgDiscountAllPct: metrics.avgDiscountAll,
          avgSalesCycleDays: metrics.avgSalesCycleDays,
          momChange: metrics.filterMoMChange,
          regionalBreakdown: metrics.regionalSummaries.map(r => ({
            region: r.region,
            revenueWonUSD: r.revenue,
            quotaAttainmentPct: r.quotaAttainment,
            winRatePct: r.winRate,
            avgDiscountWonPct: r.avgDiscountWon,
            avgDiscountAllPct: r.avgDiscountAll,
            topProduct: r.topProduct,
            topRep: r.topRep,
          })),
          topPerformingReps: metrics.topPerformers.map(r => ({
            name: r.name,
            region: r.region,
            revenueUSD: r.revenue,
            quotaAttainmentPct: r.quotaAttainment,
            dealsWon: r.dealsWon,
          })),
          laggingRepsNeedingAttention: metrics.laggingReps.map(r => ({
            name: r.name,
            region: r.region,
            revenueUSD: r.revenue,
            quotaAttainmentPct: r.quotaAttainment,
            gapToQuotaUSD: r.quota - r.revenue,
            dealsLost: r.dealsLost,
            avgDiscountPct: r.avgDiscountWon,
            avgDiscountAllPct: r.avgDiscountAll,
          })),
          topRevenueProducts: metrics.topProducts.map(p => ({
            product: p.product,
            category: p.category,
            revenueUSD: p.revenue,
            winRatePct: p.winRate,
          })),
          underperformingProducts: metrics.bottomProducts.map(p => ({
            product: p.product,
            category: p.category,
            revenueUSD: p.revenue,
            winRatePct: p.winRate,
          })),
        },
      };

      const res = await fetch('/api/gemini/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.summary) {
        setReport(data.summary);
      }
    } catch (err: any) {
      console.error('Failed to generate report:', err);
      // Fallback local report generation
      setReport({
        headline: `Scope: ${metrics.periodLabel} · Closed Won Revenue reaches ${formatFullCurrency(metrics.wonRevenue)} with ${metrics.winRate}% win rate across ${metrics.totalDealsWon} deals.`,
        executiveOverview: `During ${metrics.periodLabel}, closed won revenue stood at ${formatFullCurrency(metrics.wonRevenue)}, while active pipeline accounts for ${formatFullCurrency(metrics.pipelineRevenue)} across ${metrics.totalDealsPipeline} opportunities. Regionally, ${metrics.regionalSummaries[0]?.region || 'US'} led volume. Disciplinary focus is advised on discount rates exceeding 10% on Enterprise deals.`,
        regionalBreakdown: metrics.regionalSummaries.map(r => ({
          region: r.region,
          verdict: r.quotaAttainment >= 100 ? 'Overperforming' : r.quotaAttainment >= 80 ? 'On Track' : 'Underperforming',
          commentary: `${r.region} recorded ${formatCurrency(r.revenue)} in won revenue across ${r.dealsWon} won deals. ${r.topRep} is top producer.`,
        })),
        topPerformers: metrics.topPerformers.map(r => ({
          name: r.name,
          highlight: `Attained ${r.quotaAttainment}% of quota with ${r.dealsWon} won deals.`,
          tacticsToReplicate: 'Shorter deal cycles with under 6% discounting.',
        })),
        attentionAreas: metrics.laggingReps.map(r => ({
          subject: `${r.name} (${r.region})`,
          severity: r.quotaAttainment < 50 ? 'High' : 'Medium',
          issue: `Struggling at ${r.quotaAttainment}% quota with high discount rate (${r.avgDiscount}%).`,
          action: 'Audit pipeline stage progression and restrict discount approvals over 10%.',
        })),
        productInsights: metrics.categorySummaries.map(c => ({
          category: c.category,
          status: `${c.winRate}% Win Rate`,
          observation: `Generated ${formatCurrency(c.revenue)} across ${c.dealsWon} won deals.`,
        })),
        managerActionItems: [
          'Schedule 1-on-1 pipeline audits with reps under 75% quota attainment.',
          'Enforce strict discounting guardrails on Enterprise deals to protect deal margin.',
          'Double down on top-performing CloudScale and Copilot product motions in Europe and Asia.',
        ],
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Generate initial briefing when user first opens the report modal
  const handleOpenReportModal = () => {
    setIsReportOpen(true);
    if (!report) {
      handleGenerateReport();
    }
  };

  // Handle Q&A query
  const handleAskQuestion = async (question: string): Promise<string> => {
    const payload = {
      question,
      datasetSummary: {
        activeScope: metrics.periodLabel,
        activeStage: selectedStage,
        totalRevenueUSD: metrics.totalRevenue,
        wonRevenueUSD: metrics.wonRevenue,
        pipelineRevenueUSD: metrics.pipelineRevenue,
        lostRevenueUSD: metrics.lostRevenue,
        quotaAttainmentPct: metrics.totalQuotaAttainment,
        winRatePct: metrics.winRate,
        regionalPerformance: metrics.regionalSummaries,
        repPerformance: metrics.repSummaries,
        topProducts: metrics.topProducts,
        bottomProducts: metrics.bottomProducts,
      },
    };

    const res = await fetch('/api/gemini/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Failed to answer: ${res.statusText}`);
    }

    const data = await res.json();
    return data.answer || 'No answer generated.';
  };

  // Rep coaching shortcut from leaderboard
  const handleRepCoachingRequest = (_rep: RepSummary) => {
    const el = document.getElementById('ask-ai');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sample dataset download
  const handleDownloadSample = () => {
    const csvContent = exportDealsToCSV(deals);
    triggerDownload(csvContent, 'saas_sales_1year_dataset.csv');
  };

  // Load custom spreadsheet data
  const handleDataLoaded = (newDeals: Deal[], name: string) => {
    setDeals(newDeals);
    setDatasetName(name);
    setIsCustomDataset(true);
    setSelectedTimePeriod('ALL');
    setSelectedStage('Closed Won');
    setReport(null);
  };

  // Reset to default master dataset
  const handleResetToDefault = () => {
    setDeals(SAMPLE_DEALS);
    setDatasetName('Master SaaS Dataset (1 Year · Europe, Asia, US · 7 Categories · 39 Products)');
    setIsCustomDataset(false);
    setSelectedRegion('ALL');
    setSelectedCategory('ALL');
    setSelectedStage('Closed Won');
    setSelectedTimePeriod('ALL');
    setReport(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReport={handleOpenReportModal}
        onOpenShare={() => setIsShareOpen(true)}
        onDownloadSample={handleDownloadSample}
        onOpenTargetSettings={() => setIsTargetSettingsOpen(true)}
        isAiGenerating={isGeneratingReport}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Switcher Toolbar & Filter Strip */}
        <MetricSwitcher
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
          selectedRegion={selectedRegion}
          onSelectRegion={setSelectedRegion}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedStage={selectedStage}
          onSelectStage={setSelectedStage}
          selectedTimePeriod={selectedTimePeriod}
          onSelectTimePeriod={setSelectedTimePeriod}
          availableMonths={availableMonths}
          availableCategories={availableCategories}
          activeDatasetName={datasetName}
          onResetToDefault={handleResetToDefault}
          isCustomDataset={isCustomDataset}
        />

        {/* Executive KPI Summary Strip with Stage Transparency & Real MoM Math */}
        <KPICards 
          metrics={metrics}
          selectedCategory={selectedCategory}
          selectedRegion={selectedRegion}
          selectedStage={selectedStage}
          selectedTimePeriod={selectedTimePeriod}
          onOpenTargetSettings={() => setIsTargetSettingsOpen(true)}
        />

        {/* Month-over-Month (MoM) Shift Highlights */}
        <MonthOverMonthBanner 
          deals={categoryAndRegionFilteredDeals}
          selectedCategory={selectedCategory}
          selectedRegion={selectedRegion}
          selectedTimePeriod={selectedTimePeriod}
          onSelectMonth={(m) => setSelectedTimePeriod(m)}
        />

        {/* Weekly Trend Curve: Top N Products */}
        <ProductTrendChart deals={filteredDeals} />

        {/* Weekly Trend Curve: Top N Sales Reps */}
        <RepTrendChart deals={filteredDeals} />

        {/* Section 1: Which regions are performing best? */}
        <RegionalInsights
          regionalSummaries={metrics.regionalSummaries}
          selectedMetric={selectedMetric}
          onSelectRegionFilter={(reg) => setSelectedRegion(reg as Region)}
        />

        {/* Section 2: Which sales persons are falling behind? */}
        <RepLeaderboard
          repSummaries={metrics.repSummaries}
          selectedMetric={selectedMetric}
          onRepCoachingRequest={handleRepCoachingRequest}
        />

        {/* Section 3: Which products drive the most revenue? */}
        <ProductPerformance
          categorySummaries={metrics.categorySummaries}
          allProducts={metrics.productSummaries}
          selectedMetric={selectedMetric}
        />

        {/* Section 4: Manager Q&A with Gemini 3.8 Flash */}
        <AskSalesAssistant onAskQuestion={handleAskQuestion} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>SalesPulse Analytics Engine</span>
            <span>·</span>
            <span>Monthly & Annual Performance Review Dashboard</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Europe · Asia · US Regions · 7 Categories · 39 SaaS Products · 52-Week Resolution
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ExecutiveReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        report={report}
        isLoading={isGeneratingReport}
        onRegenerate={handleGenerateReport}
      />

      <SpreadsheetUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onDataLoaded={handleDataLoaded}
        onDownloadSample={handleDownloadSample}
        onLoadMasterSample={handleResetToDefault}
      />

      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        metrics={metrics}
        selectedMetric={selectedMetric}
        selectedRegion={selectedRegion}
        selectedCategory={selectedCategory}
      />

      <TargetSettingsModal
        isOpen={isTargetSettingsOpen}
        onClose={() => setIsTargetSettingsOpen(false)}
        repsConfig={repsConfig}
        onSaveRepsConfig={handleSaveRepsConfig}
        onResetToDefault={handleResetRepsConfig}
      />
    </div>
  );
}
