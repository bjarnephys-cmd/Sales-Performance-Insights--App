import React, { useState } from 'react';
import { ExecutiveReport } from '../types/sales';
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Printer, 
  RefreshCw, 
  Trophy, 
  AlertTriangle, 
  Globe, 
  CheckSquare,
  Package
} from 'lucide-react';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ExecutiveReport | null;
  isLoading: boolean;
  onRegenerate: (tone: string) => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  report,
  isLoading,
  onRegenerate,
}) => {
  const [selectedTone, setSelectedTone] = useState<string>('executive');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyMarkdown = () => {
    if (!report) return;

    const md = `
# Monthly Sales Executive Summary
**${report.headline}**

## Executive Overview
${report.executiveOverview}

## Regional Breakdown
${report.regionalBreakdown.map(r => `- **${r.region}** (${r.verdict}): ${r.commentary}`).join('\n')}

## Top Performers Spotlight
${report.topPerformers.map(p => `- **${p.name}**: ${p.highlight}\n  *Tactics to replicate:* ${p.tacticsToReplicate}`).join('\n')}

## Areas Needing Attention & Red Flags
${report.attentionAreas.map(a => `- **[${a.severity}] ${a.subject}**: ${a.issue}\n  *Recommended Action:* ${a.action}`).join('\n')}

## Product Insights
${report.productInsights.map(p => `- **${p.category}** (${p.status}): ${p.observation}`).join('\n')}

## 30-Day Manager Action Items
${report.managerActionItems.map(item => `- [ ] ${item}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                AI Monthly Executive Briefing
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                Plain-language report powered by Gemini 3.8 Flash
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              disabled={!report || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Markdown' : 'Copy Brief'}</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!report || isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tone Selector & Regenerate Bar */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium text-[11px]">Report Audience Tone:</span>
            <div className="flex gap-1">
              {[
                { id: 'executive', label: 'Executive Board' },
                { id: 'coaching', label: 'Manager & Coaching' },
                { id: 'all-hands', label: 'Team All-Hands' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTone(t.id);
                    onRegenerate(t.id);
                  }}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    selectedTone === t.id
                      ? 'bg-indigo-600 text-white font-medium shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => onRegenerate(selectedTone)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded border border-indigo-500/30 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Regenerate Summary</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 print:p-0">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
              <div className="text-sm font-semibold text-white">Synthesizing Monthly Sales Performance...</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm">
                Gemini 3.8 Flash is cross-referencing regional quotas, sales rep cycle times, and product revenues.
              </div>
            </div>
          ) : !report ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              No report generated yet. Click "Regenerate Summary" to analyze current data.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Headline Callout */}
              <div className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-xl">
                <div className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-1 font-semibold">
                  Executive Briefing Headline
                </div>
                <div className="text-base font-bold text-white leading-snug">
                  "{report.headline}"
                </div>
              </div>

              {/* Executive Overview */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold">
                  Executive Narrative
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/40 p-4 border border-slate-800 rounded-xl">
                  {report.executiveOverview}
                </p>
              </div>

              {/* Regional Breakdown Grid */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  Regional Performance Breakdown
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {report.regionalBreakdown.map((r, i) => (
                    <div key={i} className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-white">{r.region}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                          r.verdict.toLowerCase().includes('over')
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.verdict.toLowerCase().includes('under')
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }`}>
                          {r.verdict}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-normal">
                        {r.commentary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two Columns: Top Performers & Attention Areas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Top Performers */}
                <div className="bg-slate-950/40 border border-emerald-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-3 font-semibold flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5" />
                    Top Performers & Winning Tactics
                  </h4>
                  <div className="space-y-3">
                    {report.topPerformers.map((p, i) => (
                      <div key={i} className="text-xs border-b border-slate-800/80 pb-2.5 last:border-none last:pb-0">
                        <div className="font-semibold text-white mb-0.5">{p.name}</div>
                        <div className="text-slate-300 mb-1">{p.highlight}</div>
                        <div className="text-[11px] text-emerald-400/90 font-mono">
                          Replicate: {p.tacticsToReplicate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attention Areas */}
                <div className="bg-slate-950/40 border border-amber-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-3 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Areas Needing Attention & Red Flags
                  </h4>
                  <div className="space-y-3">
                    {report.attentionAreas.map((a, i) => (
                      <div key={i} className="text-xs border-b border-slate-800/80 pb-2.5 last:border-none last:pb-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-semibold text-white">{a.subject}</span>
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                            a.severity === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {a.severity} Priority
                          </span>
                        </div>
                        <div className="text-slate-300 mb-1">{a.issue}</div>
                        <div className="text-[11px] text-amber-300 font-mono">
                          Action: {a.action}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Product Dynamics */}
              <div>
                <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 font-semibold flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-indigo-400" />
                  Product & Category Dynamics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {report.productInsights.map((p, i) => (
                    <div key={i} className="bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-white">{p.category}</span>
                        <span className="text-[10px] font-mono text-indigo-400">{p.status}</span>
                      </div>
                      <p className="text-slate-300 leading-normal">{p.observation}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 30-Day Manager Action Items */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl">
                <h4 className="text-xs font-mono uppercase tracking-wider text-indigo-400 mb-3 font-semibold flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5" />
                  Tactical Action Items for Monthly Review
                </h4>
                <div className="space-y-2">
                  {report.managerActionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <span className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center shrink-0 mt-0.5 text-indigo-400">
                        {i + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
