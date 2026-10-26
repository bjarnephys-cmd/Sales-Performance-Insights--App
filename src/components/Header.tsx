import React from 'react';
import { 
  BarChart3, 
  UploadCloud, 
  Share2, 
  FileText, 
  Download, 
  Lock,
  Sparkles,
  Target
} from 'lucide-react';

interface HeaderProps {
  onOpenUpload: () => void;
  onOpenReport: () => void;
  onOpenShare: () => void;
  onDownloadSample: () => void;
  onOpenTargetSettings?: () => void;
  isAiGenerating?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenUpload,
  onOpenReport,
  onOpenShare,
  onDownloadSample,
  onOpenTargetSettings,
  isAiGenerating,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-semibold text-white tracking-tight leading-none whitespace-nowrap">
                SalesPulse
              </div>
              <div className="text-[11px] text-slate-400 font-mono tracking-wide mt-1 flex items-center gap-1.5">
                <span>Monthly Review Engine</span>
                <span className="text-slate-600">·</span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <Lock className="w-2.5 h-2.5" />
                  Local & Private
                </span>
              </div>
            </div>
          </div>

          {/* Zone 2: Concise single-line navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-300">
            <a href="#overview" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Overview
            </a>
            <a href="#regions" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Regional Performance
            </a>
            <a href="#reps" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Rep Quota & Coaching
            </a>
            <a href="#products" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Product Revenue
            </a>
            <a href="#ask-ai" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
              Manager Q&A
            </a>
          </nav>

          {/* Zone 3: Primary Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={onDownloadSample}
              title="Download sample spreadsheet CSV (20 products, 3 regions)"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sample CSV</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload Sheet</span>
            </button>

            <button
              onClick={onOpenShare}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {onOpenTargetSettings && (
              <button
                onClick={onOpenTargetSettings}
                title="Se, upload & justér sælgernes års-targets (CSV eller manuelt)"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 text-indigo-400" />
                <span>Års-targets & Kvoter</span>
              </button>
            )}

            <button
              onClick={onOpenReport}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-sm transition-all whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isAiGenerating ? 'animate-spin' : ''}`} />
              <span>Executive Briefing</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
