import React, { useState, useEffect, useMemo } from 'react';
import { SAMPLE_DEALS, REPS_CONFIG } from './data/sampleDataset';
import { Deal, MetricType, Region, ProductCategory, ExecutiveReport, RepSummary } from './types/sales';
import { computeSalesMetrics } from './utils/salesAnalytics';
import { triggerDownload } from './utils/spreadsheetParser';

import { Header } from './components/Header';
import { KPICards } from './components/KPICards';
import { MetricSwitcher } from './components/MetricSwitcher';
import { RegionalInsights } from './components/RegionalInsights';
import { RepLeaderboard } from './components/RepLeaderboard';
import { ProductPerformance } from './components/ProductPerformance';
import { AskSalesAssistant } from './components/AskSalesAssistant';
import { ExecutiveReportModal } from './components/ExecutiveReportModal';
import { SpreadsheetUploadModal } from './components/SpreadsheetUploadModal';
import { ShareModal } from './components/ShareModal';

export default function App() {
  const [deals, setDeals] = useState<Deal[]>(SAMPLE_DEALS);
  const [datasetName, setDatasetName] = useState<string>(
    'Master SaaS Dataset (Europe, Asia, US · 20 Products)'
  );
  const [isCustomDataset, setIsCustomDataset] = useState<boolean>(false);

  // URL query parameter parsing for sharing
  const urlParams = new URLSearchParams(window.location.search);
  const initialMetric = (urlParams.get('metric') as MetricType) || 'revenue';
  const initialRegion = (urlParams.get('region') as Region | 'ALL') || 'ALL';
  const initialCat = (urlParams.get('category') as ProductCategory | 'ALL') || 'ALL';

  const [selectedMetric, setSelectedMetric] = useState<MetricType>(initialMetric);
  const [selectedRegion, setSelectedRegion] = useState<Region | 'ALL'>(initialRegion);
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'ALL'>(initialCat);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);

  // AI Executive Report State
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Filter deals based on active filters
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (selectedRegion !== 'ALL' && deal.region !== selectedRegion) return false;
      if (selectedCategory !== 'ALL' && deal.category !== selectedCategory) return false;
      return true;
    });
  }, [deals, selectedRegion, selectedCategory]);

  // Compute comprehensive metrics
  const metrics = useMemo(() => {
    return computeSalesMetrics(filteredDeals, REPS_CONFIG);
  }, [filteredDeals]);

  // Generate executive summary via server-side Gemini API
  const handleGenerateReport = async (tone = 'executive') => {
    setIsGeneratingReport(true);
    try {
      const payload = {
        focusArea: selectedCategory !== 'ALL' ? `Category: ${selectedCategory}` : 'Full Portfolio',
        tone,
        datasetSummary: {
          period: 'Current Month (October 2026)',
          totalRevenueWonUSD: metrics.totalRevenue,
          teamQuotaAttainmentPct: metrics.totalQuotaAttainment,
          winRatePct: metrics.winRate,
          avgDealSizeUSD: metrics.avgDealSize,
          avgDiscountPct: metrics.avgDiscount,
          avgSalesCycleDays: metrics.avgSalesCycleDays,
          regionalBreakdown: metrics.regionalSummaries.map(r => ({
            region: r.region,
            revenueWonUSD: r.revenue,
            quotaAttainmentPct: r.quotaAttainment,
            winRatePct: r.winRate,
            avgDiscountPct: r.avgDiscount,
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
            avgDiscountPct: r.avgDiscount,
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
      // Fallback local report generation in case server is unavailable
      setReport({
        headline: `Team achieves ${metrics.totalQuotaAttainment}% quota with ${metrics.topPerformers.length} reps exceeding targets while ${metrics.laggingReps.length} require coaching.`,
        executiveOverview: `During this monthly review cycle, total closed won revenue reached ${metrics.totalRevenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} across ${metrics.totalDealsWon} deals with a ${metrics.winRate}% win rate. US performance led overall volume, while high average deal sizes in Europe bolstered Cloud and Security revenues. Attention is required on discount discipline in lagging reps.`,
        regionalBreakdown: metrics.regionalSummaries.map(r => ({
          region: r.region,
          verdict: r.quotaAttainment >= 100 ? 'Overperforming' : r.quotaAttainment >= 80 ? 'On Track' : 'Underperforming',
          commentary: `${r.region} attained ${r.quotaAttainment}% of target with ${r.dealsWon} won deals. ${r.topRep} led production.`,
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
          observation: `Generated ${c.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} across ${c.dealsWon} won deals.`,
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
        totalRevenueUSD: metrics.totalRevenue,
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
  const handleRepCoachingRequest = (rep: RepSummary) => {
    const el = document.getElementById('ask-ai');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle sample dataset download
  const handleDownloadSample = () => {
    // Fetch the sample CSV from /public or export current deals
    fetch('/sample_sales_data.csv')
      .then(res => res.text())
      .then(csv => {
        triggerDownload(csv, 'saas_sales_sample_dataset.csv');
      })
      .catch(() => {
        // Fallback: direct browser trigger
        window.open('/sample_sales_data.csv', '_blank');
      });
  };

  // Load custom spreadsheet data
  const handleDataLoaded = (newDeals: Deal[], name: string) => {
    setDeals(newDeals);
    setDatasetName(name);
    setIsCustomDataset(true);
    setReport(null); // invalidate previous AI report for new dataset
  };

  // Reset to default master dataset
  const handleResetToDefault = () => {
    setDeals(SAMPLE_DEALS);
    setDatasetName('Master SaaS Dataset (Europe, Asia, US · 20 Products)');
    setIsCustomDataset(false);
    setSelectedRegion('ALL');
    setSelectedCategory('ALL');
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
          activeDatasetName={datasetName}
          onResetToDefault={handleResetToDefault}
          isCustomDataset={isCustomDataset}
        />

        {/* Executive KPI Summary Strip */}
        <KPICards metrics={metrics} />

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
            <span>Monthly Performance Review Dashboard</span>
          </div>
          <div className="text-[11px] text-slate-600 font-mono">
            Europe · Asia · US Regions · 4 Categories · 20 SaaS Products
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
    </div>
  );
}
