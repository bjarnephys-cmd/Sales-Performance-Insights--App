import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  ArrowRight 
} from 'lucide-react';
import { parseSpreadsheetData, ParseResult } from '../utils/spreadsheetParser';
import { Deal } from '../types/sales';

interface SpreadsheetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataLoaded: (deals: Deal[], datasetName: string) => void;
  onDownloadSample: () => void;
  onLoadMasterSample: () => void;
}

export const SpreadsheetUploadModal: React.FC<SpreadsheetUploadModalProps> = ({
  isOpen,
  onClose,
  onDataLoaded,
  onDownloadSample,
  onLoadMasterSample,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const result = parseSpreadsheetData(text);
        setParseResult(result);
      }
      setIsLoading(false);
    };
    reader.onerror = () => {
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleApply = () => {
    if (parseResult && parseResult.deals.length > 0) {
      onDataLoaded(parseResult.deals, fileName || 'Uploaded Spreadsheet');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Upload Sales Spreadsheet
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">
                CSV or TSV format with auto-column mapping
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

        {/* Privacy Callout Banner */}
        <div className="px-6 py-2.5 bg-emerald-950/30 border-b border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>
            <strong>Data Privacy Guaranteed:</strong> Your spreadsheet is processed 100% in-browser. Raw transactions are never saved to external databases.
          </span>
        </div>

        <div className="p-6 space-y-5">
          {/* File Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-500/10'
                : 'border-slate-700 hover:border-slate-600 bg-slate-950/50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              accept=".csv,.tsv,.txt"
              className="hidden"
            />
            <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-white">
              {fileName ? fileName : 'Click to select or drag and drop your spreadsheet here'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              Accepts CSV files with columns for Rep, Region, Category, Product, Stage, and Revenue
            </div>
          </div>

          {/* Quick presets & sample template options */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400">Need a test dataset to experiment with?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onDownloadSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample CSV</span>
              </button>
              <button
                onClick={() => {
                  onLoadMasterSample();
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md border border-indigo-500/30 transition-colors cursor-pointer"
              >
                <span>Load Master Sample</span>
              </button>
            </div>
          </div>

          {/* Parsed Result Diagnostics */}
          {parseResult && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Parsed {parseResult.totalRowsParsed} deals successfully</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {parseResult.errors.length} formatting warnings
                </span>
              </div>

              {/* Detected Column mapping badges */}
              <div className="text-xs text-slate-400">
                <div className="text-[11px] font-mono uppercase text-slate-500 mb-1">Detected Columns:</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Rep: <span className="text-indigo-400">{parseResult.detectedColumns.salesPersonCol || 'Auto'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Region: <span className="text-indigo-400">{parseResult.detectedColumns.regionCol || 'Auto'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Category: <span className="text-indigo-400">{parseResult.detectedColumns.categoryCol || 'Auto'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Product: <span className="text-indigo-400">{parseResult.detectedColumns.productCol || 'Auto'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Revenue: <span className="text-indigo-400">{parseResult.detectedColumns.revenueCol || 'Auto'}</span>
                  </div>
                  <div className="p-1.5 bg-slate-900 border border-slate-800 rounded">
                    Stage: <span className="text-indigo-400">{parseResult.detectedColumns.stageCol || 'Auto'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={!parseResult || parseResult.deals.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-lg transition-colors cursor-pointer"
            >
              <span>Apply to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
