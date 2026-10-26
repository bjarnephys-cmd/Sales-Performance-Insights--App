import React, { useState, useMemo } from 'react';
import { Deal } from '../types/sales';
import { computeWeeklyTrends, formatCurrency } from '../utils/salesAnalytics';
import { TrendingUp, Layers, Check, Filter, ChevronDown, ChevronUp } from 'lucide-react';

interface ProductTrendChartProps {
  deals: Deal[];
}

const LINE_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#e11d48', // Rose
  '#84cc16', // Lime
  '#a855f7', // Purple
];

export const ProductTrendChart: React.FC<ProductTrendChartProps> = ({ deals }) => {
  const [metric, setMetric] = useState<'revenue' | 'dealsClosed'>('revenue');
  const [topN, setTopN] = useState<number>(5);
  const [selectedProductNames, setSelectedProductNames] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Compute weekly trends
  const { weeks, itemsSorted } = useMemo(() => {
    return computeWeeklyTrends(deals, 'product', metric);
  }, [deals, metric]);

  // If user hasn't manually customized selection, use top N
  const activeProducts = useMemo(() => {
    if (selectedProductNames.length > 0) {
      return itemsSorted.filter(item => selectedProductNames.includes(item.name));
    }
    return itemsSorted.slice(0, topN);
  }, [itemsSorted, selectedProductNames, topN]);

  // Handle setting Top N
  const handleSetTopN = (n: number) => {
    setTopN(n);
    setSelectedProductNames([]); // reset custom selection to default top N
  };

  // Toggle specific product in checklist
  const handleToggleProduct = (prodName: string) => {
    let current = selectedProductNames.length > 0 
      ? [...selectedProductNames] 
      : activeProducts.map(p => p.name);

    if (current.includes(prodName)) {
      if (current.length > 1) {
        current = current.filter(n => n !== prodName);
      }
    } else {
      current.push(prodName);
    }
    setSelectedProductNames(current);
  };

  // SVG Chart Dimensions & Math
  const chartWidth = 900;
  const chartHeight = 280;
  const padding = { top: 20, right: 30, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Calculate Max Value across active series
  const maxValue = useMemo(() => {
    let max = 0;
    weeks.forEach(w => {
      activeProducts.forEach(p => {
        const val = w.values[p.name] || 0;
        if (val > max) max = val;
      });
    });
    return max > 0 ? max * 1.15 : 10000;
  }, [weeks, activeProducts]);

  // Generate SVG paths for each product
  const seriesPaths = useMemo(() => {
    if (weeks.length === 0) return [];

    return activeProducts.map((p, pIdx) => {
      const color = LINE_COLORS[pIdx % LINE_COLORS.length];
      const points = weeks.map((w, wIdx) => {
        const x = padding.left + (wIdx / Math.max(1, weeks.length - 1)) * innerWidth;
        const val = w.values[p.name] || 0;
        const y = padding.top + innerHeight - (val / maxValue) * innerHeight;
        return { x, y, val, week: w };
      });

      // Build smooth path
      const pathD = points.reduce((acc, pt, idx) => {
        if (idx === 0) return `M ${pt.x} ${pt.y}`;
        // Bezier smoothing
        const prev = points[idx - 1];
        const cx1 = prev.x + (pt.x - prev.x) / 2;
        const cx2 = cx1;
        return `${acc} C ${cx1} ${prev.y}, ${cx2} ${pt.y}, ${pt.x} ${pt.y}`;
      }, '');

      return {
        product: p,
        color,
        pathD,
        points,
      };
    });
  }, [weeks, activeProducts, maxValue, innerWidth, innerHeight, padding]);

  // Y-axis grid ticks (4 ticks)
  const yTicks = [0, 0.33, 0.66, 1].map(ratio => ratio * maxValue);

  // X-axis label interval (e.g. every 6-8 weeks)
  const xLabelInterval = Math.max(1, Math.floor(weeks.length / 8));

  // Hover data
  const hoveredWeek = hoverIndex !== null && weeks[hoverIndex] ? weeks[hoverIndex] : null;

  return (
    <section id="product-trends" className="mb-10 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Weekly Product Trend Analysis
            </h2>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs text-indigo-400 font-medium">Timeline curve per week</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare the <strong className="text-slate-200">top {activeProducts.length} SaaS products</strong> over time to detect surges, momentum shifts, and product life-cycles.
          </p>
        </div>

        {/* Action Controls: Top N Stepper + Metric Toggle + Filter Drawer Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Preset Top N */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-[11px] text-slate-400 px-2 font-mono">Top N:</span>
            {[3, 5, 8, 12].map(n => (
              <button
                key={n}
                onClick={() => handleSetTopN(n)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                  topN === n && selectedProductNames.length === 0
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setMetric('revenue')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                metric === 'revenue'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Revenue ($)
            </button>
            <button
              onClick={() => setMetric('dealsClosed')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                metric === 'dealsClosed'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Deals Won (#)
            </button>
          </div>

          {/* Filter Drawer Toggle */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <span>Select Products ({activeProducts.length})</span>
            {isFilterOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expandable Product Checklist Filter */}
      {isFilterOpen && (
        <div className="mb-6 p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="text-slate-300 font-semibold">
              Filter Products (sorted by revenue descending):
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSetTopN(5)}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Reset to Top 5
              </button>
              <button
                onClick={() => setSelectedProductNames(itemsSorted.map(p => p.name))}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Select All ({itemsSorted.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {itemsSorted.map((item, idx) => {
              const isChecked = activeProducts.some(p => p.name === item.name);
              const colorIdx = activeProducts.findIndex(p => p.name === item.name);
              const color = colorIdx >= 0 ? LINE_COLORS[colorIdx % LINE_COLORS.length] : '#475569';

              return (
                <div
                  key={item.name}
                  onClick={() => handleToggleProduct(item.name)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-slate-900 border-indigo-500/40 text-white'
                      : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0" 
                      style={{ backgroundColor: isChecked ? color : '#475569' }} 
                    />
                    <div className="truncate">
                      <div className="font-medium truncate text-xs">{item.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{item.subLabel}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[11px] text-slate-300">
                    {metric === 'revenue' ? formatCurrency(item.totalRevenue) : `${item.totalDeals}w`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Interactive Line Chart Container */}
      <div className="relative w-full overflow-x-auto bg-slate-950/70 border border-slate-800 rounded-xl p-4">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto min-w-[700px] select-none"
          onMouseLeave={() => setHoverIndex(null)}
        >
          {/* Y-axis Grid Lines & Labels */}
          {yTicks.map((tickVal, i) => {
            const y = padding.top + innerHeight - (tickVal / maxValue) * innerHeight;
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="end"
                >
                  {metric === 'revenue' ? formatCurrency(tickVal) : Math.round(tickVal)}
                </text>
              </g>
            );
          })}

          {/* X-axis ticks & dates */}
          {weeks.map((w, wIdx) => {
            if (wIdx % xLabelInterval !== 0 && wIdx !== weeks.length - 1) return null;
            const x = padding.left + (wIdx / Math.max(1, weeks.length - 1)) * innerWidth;
            return (
              <g key={w.weekKey}>
                <line
                  x1={x}
                  y1={padding.top + innerHeight}
                  x2={x}
                  y2={padding.top + innerHeight + 5}
                  stroke="#334155"
                />
                <text
                  x={x}
                  y={padding.top + innerHeight + 18}
                  fill="#94a3b8"
                  fontSize="10"
                  fontFamily="monospace"
                  textAnchor="middle"
                >
                  {w.weekLabel}
                </text>
              </g>
            );
          })}

          {/* Multi-line series curves */}
          {seriesPaths.map((series) => (
            <g key={series.product.name}>
              <path
                d={series.pathD}
                fill="none"
                stroke={series.color}
                strokeWidth={hoverIndex !== null ? 2 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.9}
              />
              {/* Highlight active hovered point dot */}
              {hoverIndex !== null && series.points[hoverIndex] && (
                <circle
                  cx={series.points[hoverIndex].x}
                  cy={series.points[hoverIndex].y}
                  r="4.5"
                  fill={series.color}
                  stroke="#020617"
                  strokeWidth="2"
                />
              )}
            </g>
          ))}

          {/* Interactive Hover Vertical Cursor Line */}
          {hoverIndex !== null && (
            <line
              x1={padding.left + (hoverIndex / Math.max(1, weeks.length - 1)) * innerWidth}
              y1={padding.top}
              x2={padding.left + (hoverIndex / Math.max(1, weeks.length - 1)) * innerWidth}
              y2={padding.top + innerHeight}
              stroke="#cbd5e1"
              strokeDasharray="3 3"
              strokeWidth="1.5"
            />
          )}

          {/* Invisible hover overlay rectangles for each week */}
          {weeks.map((_, idx) => {
            const segWidth = innerWidth / Math.max(1, weeks.length);
            const x = padding.left + idx * segWidth - segWidth / 2;
            return (
              <rect
                key={idx}
                x={Math.max(0, x)}
                y={padding.top}
                width={segWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoverIndex(idx)}
              />
            );
          })}
        </svg>

        {/* Floating Tooltip during hover */}
        {hoveredWeek && hoverIndex !== null && (
          <div 
            className="absolute z-20 pointer-events-none p-3 bg-slate-900/95 border border-slate-700 rounded-lg shadow-xl text-xs backdrop-blur-md"
            style={{
              left: `${Math.min(75, Math.max(15, (hoverIndex / weeks.length) * 100))}%`,
              top: '25px',
              transform: 'translateX(-50%)',
            }}
          >
            <div className="font-mono text-slate-400 font-semibold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between gap-4">
              <span>Week of {hoveredWeek.weekLabel}</span>
              <span className="text-[10px] text-slate-500">{hoveredWeek.weekKey}</span>
            </div>
            <div className="space-y-1">
              {activeProducts
                .map((p, idx) => ({
                  product: p,
                  color: LINE_COLORS[idx % LINE_COLORS.length],
                  val: hoveredWeek.values[p.name] || 0,
                }))
                .sort((a, b) => b.val - a.val)
                .map((item) => (
                  <div key={item.product.name} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="truncate max-w-[150px]">{item.product.name}</span>
                    </span>
                    <span className="font-mono font-semibold text-white">
                      {metric === 'revenue' ? formatCurrency(item.val) : `${item.val} won`}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend below chart */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
        {activeProducts.map((p, idx) => {
          const color = LINE_COLORS[idx % LINE_COLORS.length];
          return (
            <div key={p.name} className="flex items-center gap-2 text-xs text-slate-300">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-medium text-white">{p.name}</span>
              <span className="font-mono text-slate-400 text-[11px]">
                ({metric === 'revenue' ? formatCurrency(p.totalRevenue) : `${p.totalDeals} won`})
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
