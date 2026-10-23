import React, { useState } from 'react';
import { CategorySummary, ProductSummary, MetricType } from '../types/sales';
import { formatCurrency, formatFullCurrency } from '../utils/salesAnalytics';
import { Package, TrendingUp, Layers, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';

interface ProductPerformanceProps {
  categorySummaries: CategorySummary[];
  allProducts: ProductSummary[];
  selectedMetric: MetricType;
}

export const ProductPerformance: React.FC<ProductPerformanceProps> = ({
  categorySummaries,
  allProducts,
  selectedMetric,
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('ALL');

  // Top overall revenue product
  const topProduct = allProducts[0];
  const maxProductRevenue = Math.max(...allProducts.map(p => p.revenue), 1);
  const totalSaaSRevenue = categorySummaries.reduce((sum, c) => sum + c.revenue, 0);

  const displayedProducts = activeCategoryTab === 'ALL'
    ? allProducts
    : allProducts.filter(p => p.category === activeCategoryTab);

  return (
    <section id="products" className="mb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Product & Category Revenue Matrix
            </h2>
            <span className="text-xs text-slate-500 font-mono">·</span>
            <span className="text-xs text-indigo-400 font-medium">4 Categories · 5 Products Each</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Key Question: <span className="text-slate-300 italic font-medium">Which products drive the most revenue?</span>
          </p>
        </div>

        {topProduct && (
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-md text-indigo-400 text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>#1 Revenue Driver: <strong className="font-semibold text-white">{topProduct.product}</strong> ({formatCurrency(topProduct.revenue)})</span>
          </div>
        )}
      </div>

      {/* 4 Category Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {categorySummaries.map(cat => {
          const sharePct = totalSaaSRevenue > 0 ? Math.round((cat.revenue / totalSaaSRevenue) * 100) : 0;
          return (
            <div
              key={cat.category}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-white truncate max-w-[170px]" title={cat.category}>
                  {cat.category}
                </span>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                  {sharePct}%
                </span>
              </div>

              <div className="text-lg font-bold text-white font-mono tabular-nums">
                {formatFullCurrency(cat.revenue)}
              </div>

              <div className="mt-2 w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${Math.min(100, sharePct * 2.5)}%` }}
                />
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>{cat.dealsWon} deals won</span>
                <span>{cat.winRate}% win rate</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Category Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg mb-4 overflow-x-auto">
        <button
          onClick={() => setActiveCategoryTab('ALL')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
            activeCategoryTab === 'ALL'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All 20 Products
        </button>
        {categorySummaries.map(c => (
          <button
            key={c.category}
            onClick={() => setActiveCategoryTab(c.category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              activeCategoryTab === c.category
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {c.category} (5)
          </button>
        ))}
      </div>

      {/* 20 Products Table with Revenue Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 font-medium border-b border-slate-800 uppercase font-mono text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Revenue Bar</th>
                <th className="py-3 px-3 text-right">Revenue</th>
                <th className="py-3 px-3 text-right">Deals Won</th>
                <th className="py-3 px-3 text-right">Win Rate</th>
                <th className="py-3 px-3 text-right">Avg Deal</th>
                <th className="py-3 px-3 text-right">Discount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono tabular-nums text-slate-300">
              {displayedProducts.map((p, idx) => {
                const revenuePct = Math.round((p.revenue / maxProductRevenue) * 100);
                const isUnderperforming = p.winRate < 60 || p.revenue < 30000;

                return (
                  <tr key={p.product} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-sans font-medium text-white flex items-center gap-2">
                      <span className="text-slate-500 text-[11px] font-mono w-4">{idx + 1}.</span>
                      <span>{p.product}</span>
                      {idx === 0 && activeCategoryTab === 'ALL' && (
                        <span className="text-[10px] font-sans font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                          Top Driver
                        </span>
                      )}
                      {isUnderperforming && (
                        <span className="text-[10px] font-sans font-medium text-amber-400/90 bg-amber-500/10 px-1.5 py-0.2 rounded">
                          Low Traction
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-400">
                      {p.category}
                    </td>
                    <td className="py-3 px-3 w-40">
                      <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            p.revenue >= 100000 ? 'bg-emerald-500' : 'bg-indigo-500'
                          }`}
                          style={{ width: `${Math.max(4, revenuePct)}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right text-white font-semibold">
                      {formatFullCurrency(p.revenue)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200">
                      {p.dealsWon} won ({p.dealsLost} lost)
                    </td>
                    <td className={`py-3 px-3 text-right font-medium ${
                      p.winRate >= 75 ? 'text-emerald-400' : p.winRate < 60 ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {p.winRate}%
                    </td>
                    <td className="py-3 px-3 text-right text-slate-300">
                      {formatCurrency(p.avgDealSize)}
                    </td>
                    <td className={`py-3 px-3 text-right ${p.avgDiscount > 12 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {p.avgDiscount}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
