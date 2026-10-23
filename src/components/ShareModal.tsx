import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Link as LinkIcon, 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2 
} from 'lucide-react';
import { ComprehensiveMetrics, formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: ComprehensiveMetrics;
  selectedMetric: string;
  selectedRegion: string;
  selectedCategory: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  metrics,
  selectedMetric,
  selectedRegion,
  selectedCategory,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  if (!isOpen) return null;

  // Build current shareable URL with parameters
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.set('metric', selectedMetric);
  currentUrl.searchParams.set('region', selectedRegion);
  currentUrl.searchParams.set('category', selectedCategory);
  const shareableUrl = currentUrl.toString();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const generateQuickSummaryText = () => {
    const topRep = metrics.topPerformers[0]?.name || 'N/A';
    const topProd = metrics.topProducts[0]?.product || 'N/A';
    const topReg = [...metrics.regionalSummaries].sort((a, b) => b.revenue - a.revenue)[0]?.region || 'N/A';

    return `
Sales Performance Insights (Monthly Review):
- Total Closed Won: ${formatFullCurrency(metrics.totalRevenue)} (${metrics.totalDealsWon} deals)
- Team Quota Attainment: ${metrics.totalQuotaAttainment}%
- Win Rate: ${metrics.winRate}% (Avg Deal: ${formatCurrency(metrics.avgDealSize)})
- Top Region: ${topReg}
- Top Performer: ${topRep} (${metrics.topPerformers.length} reps over 100% quota)
- Leading Product: ${topProd}
- Attention Areas: ${metrics.laggingReps.length} reps currently under 75% quota attainment.

View full dashboard: ${shareableUrl}
    `.trim();
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateQuickSummaryText());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Share Sales Insights Dashboard
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Easily distribute reports to leadership and the sales team
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Option 1: Copy Direct Link with Filters */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Direct Link with Current Filters</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Preserves active metric ({selectedMetric}), region filter ({selectedRegion}), and category filter.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono truncate select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Option 2: Copy Slack / Email Plain Summary */}
          <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>Slack / Email Executive Snippet</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Formatted bullet points with key numbers ready to paste into Slack or email.
            </p>
            <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 whitespace-pre-wrap max-h-32 overflow-y-auto">
              {generateQuickSummaryText()}
            </pre>
            <button
              onClick={handleCopySummary}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied to Clipboard' : 'Copy Formatted Snippet'}</span>
            </button>
          </div>

          {/* Option 3: Print / PDF export */}
          <div className="pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Need a printable report for senior leadership?</span>
            <button
              onClick={() => {
                onClose();
                window.print();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
