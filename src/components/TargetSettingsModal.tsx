import React, { useState, useRef } from 'react';
import { SalesRepProfile, Region } from '../types/sales';
import { REPS_CONFIG } from '../data/sampleDataset';
import { formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { 
  Target, 
  X, 
  RotateCcw, 
  Save, 
  Calculator, 
  DollarSign, 
  Info, 
  Check, 
  Upload,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Sliders,
  Users,
  CheckCircle2
} from 'lucide-react';

interface TargetSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  repsConfig: SalesRepProfile[];
  onSaveRepsConfig: (updatedReps: SalesRepProfile[]) => void;
  onResetToDefault: () => void;
}

export const TargetSettingsModal: React.FC<TargetSettingsModalProps> = ({
  isOpen,
  onClose,
  repsConfig,
  onSaveRepsConfig,
  onResetToDefault,
}) => {
  // Local editable draft state
  const [draftReps, setDraftReps] = useState<SalesRepProfile[]>(repsConfig);
  const [hasSaved, setHasSaved] = useState(false);
  const [selectedRegionFilter, setSelectedRegionFilter] = useState<Region | 'ALL'>('ALL');
  const [uploadFeedback, setUploadFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync draft whenever modal opens or repsConfig changes
  React.useEffect(() => {
    if (isOpen) {
      setDraftReps(repsConfig);
      setHasSaved(false);
      setUploadFeedback(null);
    }
  }, [isOpen, repsConfig]);

  if (!isOpen) return null;

  // Totals calculation
  const totalAnnualTarget = draftReps.reduce((sum, r) => sum + (Number(r.annualQuota) || (Number(r.quota) * 12) || 0), 0);
  const totalMonthlyTarget = Math.round(totalAnnualTarget / 12);

  // Regional breakdown
  const regionalTotals = (['US', 'Europe', 'Asia'] as Region[]).map(region => {
    const regionReps = draftReps.filter(r => r.region === region);
    const annual = regionReps.reduce((sum, r) => sum + (Number(r.annualQuota) || (Number(r.quota) * 12) || 0), 0);
    const monthly = Math.round(annual / 12);
    return {
      region,
      repCount: regionReps.length,
      monthly,
      annual,
    };
  });

  // Handle editing Annual Target: auto-syncs Monthly Quota (annual / 12)
  const handleAnnualQuotaChange = (repName: string, newAnnual: number) => {
    const annual = Math.max(0, newAnnual);
    const monthly = Math.round(annual / 12);
    setDraftReps(prev =>
      prev.map(r => (r.name === repName ? { ...r, annualQuota: annual, quota: monthly } : r))
    );
  };

  // Handle editing Monthly Quota: auto-syncs Annual Target (monthly * 12)
  const handleMonthlyQuotaChange = (repName: string, newMonthly: number) => {
    const monthly = Math.max(0, newMonthly);
    const annual = monthly * 12;
    setDraftReps(prev =>
      prev.map(r => (r.name === repName ? { ...r, quota: monthly, annualQuota: annual } : r))
    );
  };

  // Quick percent adjustments on all reps
  const handleAdjustAllPercent = (pct: number) => {
    setDraftReps(prev =>
      prev.map(r => {
        const curAnnual = r.annualQuota || (r.quota * 12);
        const newAnnual = Math.round(curAnnual * (1 + pct / 100));
        return {
          ...r,
          annualQuota: newAnnual,
          quota: Math.round(newAnnual / 12),
        };
      })
    );
  };

  // Set uniform annual target
  const handleSetUniformAnnual = (annualAmount: number) => {
    setDraftReps(prev =>
      prev.map(r => ({
        ...r,
        annualQuota: annualAmount,
        quota: Math.round(annualAmount / 12),
      }))
    );
  };

  // Download template CSV file
  const handleDownloadTemplate = () => {
    const csvContent = [
      'SalesRep,Region,AnnualTarget,MonthlyTarget',
      'Marcus Vance,US,1800000,150000',
      'Sarah Chen,US,1600000,133333',
      'David Miller,US,1700000,141667',
      'Maya Rodriguez,US,1400000,116667',
      'Elena Rossi,Europe,1750000,145833',
      'Arthur Dubois,Europe,1500000,125000',
      'Liam Schmidt,Europe,1550000,129167',
      'Freja Lind,Europe,1350000,112500',
      'Kenji Tanaka,Asia,1650000,137500',
      'Priya Sharma,Asia,1450000,120833',
      'Wei Zhang,Asia,1500000,125000',
      'Aiko Takahashi,Asia,1300000,108333',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'salesrep_target.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Parse uploaded CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('Filen er tom.');

        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          throw new Error('CSV-filen skal have en overskriftsrække og mindst én sælgerrække.');
        }

        // Detect delimiter: semicolon or comma
        const headerLine = lines[0];
        let delim = ',';
        if (headerLine.includes(';') && headerLine.split(';').length > headerLine.split(',').length) {
          delim = ';';
        } else if (headerLine.includes('\t')) {
          delim = '\t';
        }

        const headers = headerLine.split(delim).map(h => h.trim().replace(/^["']|["']$/g, '').toLowerCase());
        const nameIdx = headers.findIndex(h => h.includes('rep') || h.includes('name') || h.includes('sælger') || h.includes('person'));
        const regionIdx = headers.findIndex(h => h.includes('region') || h.includes('område'));
        const annualIdx = headers.findIndex(h => h.includes('annual') || h.includes('år') || h.includes('year') || (h.includes('target') && !h.includes('month')));
        const monthlyIdx = headers.findIndex(h => h.includes('month') || h.includes('måned') || h.includes('quota') || h.includes('kvote'));

        if (nameIdx === -1) {
          throw new Error('Kolonnen med sælgernavn (fx "SalesRep" eller "Sælger") blev ikke fundet.');
        }

        const parseCleanNum = (raw: string): number => {
          if (!raw) return 0;
          let clean = raw.replace(/[$€£\s"']/g, '');
          if (clean.toLowerCase().endsWith('m')) {
            return Math.round(parseFloat(clean.replace(/[m|M]/, '').replace(',', '.')) * 1000000);
          }
          if (clean.toLowerCase().endsWith('k')) {
            return Math.round(parseFloat(clean.replace(/[k|K]/, '').replace(',', '.')) * 1000);
          }
          if (clean.includes('.') && clean.includes(',')) {
            if (clean.indexOf('.') < clean.indexOf(',')) {
              clean = clean.replace(/\./g, '').replace(',', '.');
            } else {
              clean = clean.replace(/,/g, '');
            }
          } else if (clean.includes(',') && !clean.includes('.')) {
            const parts = clean.split(',');
            if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
              clean = clean.replace(/,/g, '');
            } else {
              clean = clean.replace(',', '.');
            }
          } else if (clean.includes('.') && !clean.includes(',')) {
            const parts = clean.split('.');
            if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
              clean = clean.replace(/\./g, '');
            }
          }
          const num = parseFloat(clean);
          return isNaN(num) ? 0 : Math.round(num);
        };

        const parsed: SalesRepProfile[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(delim).map(c => c.trim().replace(/^["']|["']$/g, ''));
          if (cols.length <= nameIdx || !cols[nameIdx]) continue;

          const name = cols[nameIdx];
          let region: Region = 'US';
          if (regionIdx !== -1 && cols[regionIdx]) {
            const r = cols[regionIdx].toLowerCase();
            if (r.includes('eur') || r.includes('eu')) region = 'Europe';
            else if (r.includes('asia') || r.includes('asien') || r.includes('apac')) region = 'Asia';
            else region = 'US';
          }

          let annual = annualIdx !== -1 ? parseCleanNum(cols[annualIdx]) : 0;
          let monthly = monthlyIdx !== -1 ? parseCleanNum(cols[monthlyIdx]) : 0;

          if (annual > 0 && monthly === 0) {
            monthly = Math.round(annual / 12);
          } else if (monthly > 0 && annual === 0) {
            annual = monthly * 12;
          } else if (annual === 0 && monthly === 0) {
            annual = 1800000;
            monthly = 150000;
          }

          const initials = name
            .split(' ')
            .map(p => p[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')
            .toUpperCase() || 'SR';

          parsed.push({
            name,
            region,
            annualQuota: annual,
            quota: monthly,
            avatarInitials: initials,
          });
        }

        if (parsed.length === 0) {
          throw new Error('Ingen gyldige sælgerrækker blev fundet i CSV-filen.');
        }

        setDraftReps(parsed);
        const totalUploadedM = (parsed.reduce((s, r) => s + (r.annualQuota || r.quota * 12), 0) / 1000000).toFixed(2);
        setUploadFeedback({
          type: 'success',
          message: `Succes: Indlæste ${parsed.length} sælgere fra CSV! Samlet årsbudget: $${totalUploadedM}M. Klik "Gem" for at anvende.`,
        });
      } catch (err: any) {
        setUploadFeedback({
          type: 'error',
          message: err.message || 'Fejl under tolkning af CSV-filen.',
        });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = () => {
    onSaveRepsConfig(draftReps);
    setHasSaved(true);
    setTimeout(() => {
      setHasSaved(false);
      onClose();
    }, 600);
  };

  const handleReset = () => {
    if (confirm('Vil du nulstille alle salgskvoter til standardværdierne (US: $6.50M/år = 0.5417M/md, Total: $18.55M/år)?')) {
      setDraftReps(REPS_CONFIG);
      onResetToDefault();
      setUploadFeedback({
        type: 'success',
        message: 'Nulstillet til standard ($6.50M US · $18.55M samlet)',
      });
    }
  };

  const displayedReps = draftReps.filter(
    r => selectedRegionFilter === 'ALL' || r.region === selectedRegionFilter
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Målstyring & Års-targets</span>
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                  Annual Target Manager
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload CSV eller indtast individuelle års-targets for hver sælger. Månedskvoter beregnes automatisk som Årsmål ÷ 12.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Explanation Banner: Regnestykket & US forklaring */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 text-xs text-slate-300 leading-relaxed space-y-2.5">
            <div className="flex items-center gap-2 font-semibold text-indigo-300 text-sm">
              <Calculator className="w-4 h-4 text-indigo-400" />
              <span>Regnestykket for US og Års-targets vs. Månedsmål</span>
            </div>
            <p>
              Du har helt ret: Når sælgerne tildeles <strong>års-targets</strong> på henholdsvis <strong>$1.8M, $1.6M, $1.7M og $1.4M</strong>, er regnestykket for US:
            </p>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
              <div className="flex items-center justify-between text-indigo-300 font-semibold mb-1">
                <span>US Års-target: $1.8M + $1.6M + $1.7M + $1.4M</span>
                <span className="text-white">= $6.50M / år</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>US Månedsmål: $6.50M ÷ 12 måneder</span>
                <span className="text-emerald-400 font-bold">= $541.667 / md (0.5417M)</span>
              </div>
            </div>

            {/* Total cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 font-medium">1. Samlet Årsbudget (12 sælgere)</div>
                <div className="text-base font-bold font-mono text-indigo-400 mt-0.5">
                  {formatFullCurrency(totalAnnualTarget)}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  US ($6.50M) + Europe ($6.15M) + Asia ($5.90M)
                </div>
              </div>
              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-lg p-2.5">
                <div className="text-[11px] text-indigo-300 font-medium">2. Månedlig Teamkvote (1 md)</div>
                <div className="text-base font-bold font-mono text-white mt-0.5">
                  {formatFullCurrency(totalMonthlyTarget)}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Årsmål ÷ 12 = ${(totalMonthlyTarget/1000000).toFixed(4)}M/md
                </div>
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2.5">
                <div className="text-[11px] text-slate-400 font-medium">3. Målstyring Status</div>
                <div className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Klar til synkronisering</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Alle grafer, KPI'er og leaderboards opdateres
                </div>
              </div>
            </div>

            {/* Regional breakdown strip */}
            <div className="pt-2 border-t border-indigo-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              {regionalTotals.map(r => (
                <div key={r.region} className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/60 rounded border border-slate-800 font-mono">
                  <span className="text-slate-300 font-semibold">{r.region} ({r.repCount} reps):</span>
                  <span className="text-slate-400">
                    <strong className="text-white">${(r.annual/1000000).toFixed(2)}M/år</strong> · ${(r.monthly/1000000).toFixed(4)}M/md
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CSV Upload & Template Download Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span>Upload CSV med sælgernes års-target (`salesrep_target.csv`)</span>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-500/30 rounded-md transition-colors cursor-pointer"
                title="Download den færdige skabelonfil salesrep_target.csv"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Download `salesrep_target.csv`</span>
              </button>
            </div>

            {/* Drag & drop / upload input */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <label className="flex-1 w-full flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-slate-700 hover:border-indigo-500/80 rounded-xl bg-slate-900/50 hover:bg-slate-900 cursor-pointer transition-colors text-xs text-slate-300">
                <Upload className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Vælg eller træk en CSV-fil hertil for at indlæse nye års-targets</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Upload Feedback */}
            {uploadFeedback && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                uploadFeedback.type === 'success'
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-950/50 text-rose-300 border border-rose-500/30'
              }`}>
                {uploadFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{uploadFeedback.message}</span>
              </div>
            )}
          </div>

          {/* Quick Adjustment Tools */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>Hurtigjustering af mål for hele teamet:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => handleAdjustAllPercent(5)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
                >
                  +5% alle
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustAllPercent(10)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
                >
                  +10% alle
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustAllPercent(-10)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
                >
                  -10% alle
                </button>
                <button
                  type="button"
                  onClick={() => handleSetUniformAnnual(1800000)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded transition-colors cursor-pointer"
                  title="Sæt alle til $1.80M/år ($150k/md)"
                >
                  Sæt $1.8M/år
                </button>
              </div>
            </div>
          </div>

          {/* Table Header Controls */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Users className="w-4 h-4 text-indigo-400" />
              <span>Indtast eller tilpas mål per sælger (synkroniserer automatisk):</span>
            </div>

            {/* Region Filter for Table */}
            <div className="flex items-center gap-1 text-xs bg-slate-950 p-1 border border-slate-800 rounded-lg">
              {(['ALL', 'US', 'Europe', 'Asia'] as const).map(reg => (
                <button
                  key={reg}
                  type="button"
                  onClick={() => setSelectedRegionFilter(reg)}
                  className={`px-2.5 py-0.5 rounded text-xs transition-colors cursor-pointer ${
                    selectedRegionFilter === reg
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {reg === 'ALL' ? 'Alle regioner' : reg}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Rep Quota Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Sælger</th>
                  <th className="py-2.5 px-3">Region</th>
                  <th className="py-2.5 px-3">Års-target (USD)</th>
                  <th className="py-2.5 px-3 text-right">Månedskvote (År ÷ 12)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {displayedReps.map(rep => {
                  const annual = Number(rep.annualQuota) || (Number(rep.quota) * 12);
                  const monthly = Number(rep.quota) || Math.round(annual / 12);

                  return (
                    <tr key={rep.name} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-sans">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-800 text-indigo-400 font-mono font-bold text-[10px] flex items-center justify-center shrink-0 border border-slate-700">
                            {rep.avatarInitials}
                          </div>
                          <span className="font-semibold text-white">{rep.name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rep.region === 'US' 
                            ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                            : rep.region === 'Europe'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {rep.region}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="relative max-w-[200px]">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-xs">
                            $
                          </span>
                          <input
                            type="number"
                            step="10000"
                            min="50000"
                            max="20000000"
                            value={annual}
                            onChange={(e) => handleAnnualQuotaChange(rep.name, Number(e.target.value))}
                            className="w-full bg-slate-900 border border-slate-700 focus:border-indigo-500 rounded px-2.5 py-1 pl-6 text-xs text-white font-mono focus:outline-none"
                            title="Indtast årligt måltal"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="relative inline-block max-w-[160px] text-right">
                          <span className="text-slate-400 font-mono font-semibold">
                            {formatFullCurrency(monthly)} / md
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-900/90 border-t border-slate-800 font-mono text-xs">
                <tr>
                  <td colSpan={2} className="py-3 px-3 text-white font-semibold font-sans">
                    Samlet Total ({displayedReps.length} sælgere):
                  </td>
                  <td className="py-3 px-3 font-bold text-indigo-400">
                    {formatFullCurrency(displayedReps.reduce((s, r) => s + (Number(r.annualQuota) || (Number(r.quota) * 12) || 0), 0))} / år
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-indigo-400">
                    {formatFullCurrency(displayedReps.reduce((s, r) => s + (Number(r.quota) || 0), 0))} / md
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Nulstil til standard ($6.50M US)</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Annuller
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-md transition-all cursor-pointer"
            >
              {hasSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Gemt!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Gem og Opdater Dashboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
