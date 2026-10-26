# Enterprise SaaS Sales Performance & Analytics Dashboard

An enterprise-grade executive sales intelligence platform built for B2B SaaS revenue leaders, sales directors, and regional managers. The application provides transparent, mathematically rigorous sales analytics, quota management, regional benchmarking, and AI-powered executive synthesis.

---

## 1. Project Overview & Architecture

### Tech Stack
* **Framework**: React 19 SPA with TypeScript
* **Build System**: Vite 6
* **Styling**: Tailwind CSS with custom dark executive theme
* **Iconography**: Lucide React
* **AI Engine**: Google Gemini API (`@google/genai`) for executive reports & coaching briefs
* **Runtime / Deployment**: Node.js / Express proxy (`server.ts`) on port 3000

### Key Modules & File Structure
```
├── README.md                          # Technical documentation & business logic reference
├── package.json                       # Dependencies & scripts
├── vite.config.ts                     # Vite build configuration
├── src/
│   ├── App.tsx                        # Main application layout, state orchestration & filters
│   ├── types/
│   │   └── sales.ts                   # Core domain types (Deal, SalesRepProfile, RegionSummary, etc.)
│   ├── data/
│   │   └── sampleDataset.ts           # 500+ transactional deal records & baseline rep profiles
│   ├── utils/
│   │   └── salesAnalytics.ts          # Core analytical engine (metrics, quotas, discounts, MoM)
│   ├── components/
│   │   ├── KPICards.tsx               # Top-level executive cards with dynamic MoM & quota explainer
│   │   ├── FilterBar.tsx              # Scope filters (Period, Stage, Region, Category)
│   │   ├── RegionalInsights.tsx       # US, Europe & APAC benchmarking with Won vs All metrics
│   │   ├── RepLeaderboard.tsx         # Rep rankings, attention matrix & coaching triggers
│   │   ├── ProductPerformance.tsx     # 20 SaaS products revenue, win rate & discount table
│   │   ├── TargetSettingsModal.tsx    # Live quota manager, CSV import/export & mass scaling
│   │   ├── ExecutiveReportModal.tsx   # AI-generated executive briefing & strategic actions
│   │   └── RepCoachingModal.tsx       # AI personalized 1-on-1 rep coaching plan
│   └── index.css                      # Global Tailwind stylesheet
```

---

## 2. Key Business Logic & Concrete Number Examples

The dashboard enforces strict mathematical precision across deal stages, quota hierarchies, and discount metrics. Below are the core business problems, formulas, and real numbers solved in the codebase.

---

### Example A: The $22.26M Quota Hierarchy & Proportional Category Target
#### The Context & Problem
Revenue targets exist at three levels:
1. **Individual Sales Rep**: Monthly quota (e.g., Marcus Vance: $180,000/mo).
2. **Regional Quota**: Sum of reps in the region.
3. **Company Annual Budget**: Sum of all 12 sales reps over 12 months.

#### Base Rep Configuration (12 Reps)
* **United States (4 Reps)**:
  * Marcus Vance: $180,000/mo ($2,160,000/yr)
  * Sarah Chen: $160,000/mo ($1,920,000/yr)
  * David Miller: $170,000/mo ($2,040,000/yr)
  * Maya Rodriguez: $140,000/mo ($1,680,000/yr)
  * **US Monthly Sum**: $650,000/mo $\rightarrow$ **Annual Target**: **$7,800,000** ($7.80M)
* **Europe (4 Reps)**:
  * Elena Rossi: $175,000/mo ($2,100,000/yr)
  * Arthur Dubois: $150,000/mo ($1,800,000/yr)
  * Liam Schmidt: $155,000/mo ($1,860,000/yr)
  * Freja Lind: $135,000/mo ($1,620,000/yr)
  * **Europe Monthly Sum**: $615,000/mo $\rightarrow$ **Annual Target**: **$7,380,000** ($7.38M)
* **Asia-Pacific (4 Reps)**:
  * Kenji Tanaka: $165,000/mo ($1,980,000/yr)
  * Priya Sharma: $145,000/mo ($1,740,000/yr)
  * Wei Zhang: $150,000/mo ($1,800,000/yr)
  * Aiko Takahashi: $130,000/mo ($1,560,000/yr)
  * **Asia Monthly Sum**: $590,000/mo $\rightarrow$ **Annual Target**: **$7,080,000** ($7.08M)

$$\text{Company Monthly Base} = \$650,000 + \$615,000 + \$590,000 = \$1,855,000/\text{month}$$
$$\text{Total Company Annual Target (12 Months)} = \$1,855,000 \times 12 = \mathbf{\$22,260,000}\ (22.26\text{M})$$

#### The "Why 13%?" Problem & Scope Scaling
When a user filters the dashboard by a single category (e.g. *Cloud & Infrastructure*):
* Realized Won Revenue in that category: **$2,912,000**.
* If compared directly against the **whole company's total annual quota** ($22,260,000):
  $$\frac{\$2,912,000}{\$22,260,000} = 13.1%
  This is the category's **Portfolio Share** (how much of the entire company's revenue it represents), *not* its actual performance against its own product target.
* To provide meaningful performance tracking, the analytical engine computes a **Proportional Scope Target**:
  $$\text{Category Share} = \frac{\text{Historical Category Won Revenue}}{\text{Total Won Revenue}}  =15.2%
  $$\text{scopeTarget} = \  $22,260,000 *  15.2\% = $3,383,520
  $$\text{Actual Scope Attainment} = \frac{\$2,912,000}{\$3,383,520} = 86%
  
The UI exposes both values transparently with an interactive explanation accordion in `KPICards.tsx`.

---

### Example B: The Average Discount Discrepancy (Won vs. All Stages)
#### The Context & Problem
When auditing United States numbers (1 Year, All Categories):
* **Closed Won Deals Only (85 deals)**:
  * Deal Count: **85**
  * Revenue: **$3,898,000**
  * Average Deal Size: $\$3,898,000 \div 85 = \mathbf{\$45,858.82}$  = $45.9k
  * Sum of Discounts: **732%**
  * **Average Discount (Won Deals)**: $732\% \div 85 = \mathbf{8.61\%}$   =8.6%
* **All Stages (Won + Lost, 140 deals)**:
  * Total Deals: **140** (85 Closed Won + 55 Closed Lost)
  * Total Revenue of all quotes: **$6,261,000**
  * Average Deal Size across all stages: $\$6,261,000 \div 140 = \$44,721.43$
  * Sum of Discounts: **1439%**
  * **Average Discount (All Stages)**: $1439\% \div 140 = \mathbf{10.28\%}$ ($\approx 10.3\%$)

#### The Bug & Resolution
In initial versions, `regionalSummaries` used `regWon` for revenue and average deal size ($3.898M and $45.9k), but computed `discountSum` on `regDeals` (all 140 deals), showing `10.3%` alongside the Won revenue numbers.
We refactored the engine in `src/utils/salesAnalytics.ts` to compute both:
1. `avgDiscountWon`: Strictly for Closed Won deals (**8.6%** for US).
2. `avgDiscountAll`: Across all deals including Closed Lost (**10.3%** for US).
3. The UI in `RegionalInsights.tsx`, `KPICards.tsx`, `RepLeaderboard.tsx`, and `ProductPerformance.tsx` now explicitly displays **8.6% (Won)** with a secondary indicator for **10.3% alle stages**.

---

### Example C: Real Dynamic Month-over-Month (MoM) Delta
Instead of a static mock percentage, the application evaluates the dataset dynamically:
$$\Delta\text{Rev} = \text{Revenue}_{\text{currentMonth}} - \text{Revenue}_{\text{previousMonth}}$$
$$\text{MoM \%} = \left(\frac{\Delta\text{Rev}}{\text{Revenue}_{\text{previousMonth}}}\right) \times 100$$
* Adheres to active scope filters (e.g. if filtered to "Europe", MoM compares Europe's latest month vs prior month).
* Displays the baseline comparison labels in the card footer (e.g. `vs 10/26 ($312k)`).
 
---

## 3. Core Workflows & Features

### 1. Multi-Dimensional Scope Filtering
Users can slice data across four independent dimensions:
* **Time Period**: `Full Year (12 Mo.)` or individual calendar months (`Jan 2026` – `Dec 2026`).
* **Deal Stage**: `Closed Won` (default), `In Pipeline`, `Closed Lost`, or `ALL`.
* **Region**: `ALL`, `US`, `Europe`, `Asia`.
* **Product Category**: `ALL` or 7 specialized enterprise SaaS categories.

### 2. Live Target Settings & CSV Upload/Download
Accessible via the **"Indtast mål" / "Målstyring"** button:
* **Interactive Editing**: Modify monthly quota or annual target per sales rep with bidirectional auto-sync:
  $$\text{Monthly} = \text{round}(\text{Annual} / 12) \quad\longleftrightarrow\quad \text{Annual} = \text{Monthly} \times 12$$
* **Quick Mass Scaling**: Scale all targets (+5%, +10%, -5%) or apply a uniform target across all reps.
* **CSV Download**: Downloads the current configuration as `salesrep_target.csv`.
* **CSV Import**: Upload a customized CSV file with automatic header synonym detection, delimiter detection (comma or semicolon), number cleaning, and error validation.

#### Sample CSV Template (`salesrep_target.csv`)
```csv
SalesRep,Region,AnnualTarget,MonthlyTarget
Marcus Vance,US,1800000,150000
Sarah Chen,US,1600000,133333
David Miller,US,1700000,141667
Maya Rodriguez,US,1400000,116667
Elena Rossi,Europe,1750000,145833
Arthur Dubois,Europe,1500000,125000
Liam Schmidt,Europe,1550000,129167
Freja Lind,Europe,1350000,112500
Kenji Tanaka,Asia,1650000,137500
Priya Sharma,Asia,1450000,120833
Wei Zhang,Asia,1500000,125000
Aiko Takahashi,Asia,1300000,108333
```

### 3. Regional Comparative Benchmarking
* Cards for **United States**, **Europe (EMEA)**, and **Asia-Pacific (APAC)**.
* Displays Total Revenue, Won/Lost deal counts, Win Rate %, Avg Deal Size, and dual Avg Discount (Won vs All Stages).
* Interactive bar showing normalized comparative share across regions for any chosen metric.

### 4. Sales Rep Coaching Matrix & Attention Watchlist
* Separates top performers ($\ge 100\%$ quota) from lagging reps ($< 75\%$ quota).
* One-click trigger to generate a personalized **AI Coaching Plan** identifying deal size vs volume gaps, discounting habits, and sales cycle duration.

### 5. Product Revenue Distribution
* Detailed breakdown across 20 products.
* Flags high-traction vs low-traction products.
* Displays won/lost volume, win rate, average deal size, and Won vs All discount.

---

## 4. Key Process Logic & Inline Code Highlights

Below are representative code segments from `src/utils/salesAnalytics.ts` and `src/components/RegionalInsights.tsx` showing the mathematical accounting and inline documentation:

### Highlight 1: Dual Discount Calculation (`salesAnalytics.ts`)
```typescript
// -------------------------------------------------------------------------
// AVERAGE DISCOUNT CALCULATION (Won Deals vs. All Stages)
// -------------------------------------------------------------------------
// - Won Deals Discount: Sum of discountPct of Closed Won deals divided by Won count.
//   Example (USA): 732% discount sum / 85 won deals = 8.61% (8.6%).
//   Matches realized revenue ($3,898,000) and avg deal size ($45.9k).
// - All Stages Discount: Sum of discountPct across ALL deals (Won + Lost) / total deals.
//   Example (USA): 1439% discount sum / 140 total deals = 10.28% (10.3%).
const wonDiscountSum = wonDeals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
const avgDiscountWon = wonDeals.length > 0 
  ? Number((wonDiscountSum / wonDeals.length).toFixed(1)) 
  : 0;

const totalDiscount = deals.reduce((sum, d) => sum + (d.discountPct || 0), 0);
const avgDiscountAll = deals.length > 0 
  ? Number((totalDiscount / deals.length).toFixed(1)) 
  : 0;

// Primary average discount matches active stage filter (defaults to Won deals discount)
const avgDiscount = stageFilter === 'Closed Won' ? avgDiscountWon : avgDiscountAll;
```

### Highlight 2: Proportional Quota Scaling & Portfolio Share (`salesAnalytics.ts`)
```typescript
// -------------------------------------------------------------------------
// QUOTA TARGET HIERARCHY & SCOPE SCALING
// -------------------------------------------------------------------------
// Company-wide base quota: $1.855M/mo * 12 = $22.26M/yr
const monthlyTeamBaseQuota = repsConfig.reduce((sum, r) => sum + r.quota, 0);
const totalTeamQuota = monthlyTeamBaseQuota * monthsCount;

// Category weight calculation from all closed won deals
const allWonDeals = allUnfilteredDeals.filter(d => d.stage === 'Closed Won');
const totalAllWonRev = allWonDeals.reduce((sum, d) => sum + d.revenue, 0);
const categoryWonRev = isCategoryFiltered 
  ? allWonDeals.filter(d => d.category === selectedCategory).reduce((sum, d) => sum + d.revenue, 0)
  : totalAllWonRev;

// Expected category share (e.g. Cloud & Infrastructure is ~15.2% of won deals)
const categoryShare = (isCategoryFiltered && totalAllWonRev > 0)
  ? (categoryWonRev / totalAllWonRev)
  : 1;

// Target for active scope (Region + Category + Months)
const scopeTarget = Math.round(scopedRepMonthlyQuota * monthsCount * (isCategoryFiltered ? categoryShare : 1));
const scopeQuotaAttainment = scopeTarget > 0 ? Math.round((wonRevenue / scopeTarget) * 100) : 0;
const portfolioSharePct = totalTeamQuota > 0 ? Number(((wonRevenue / totalTeamQuota) * 100).toFixed(1)) : 0;
```

### Highlight 3: Transparent UI Representation (`RegionalInsights.tsx`)
```tsx
{/* Revenue & Deals summary */}
<div className="flex items-center justify-between text-xs">
  <span className="text-slate-400">Total Revenue (Won):</span>
  <span className="text-white font-mono font-semibold tabular-nums">
    {formatFullCurrency(reg.revenue)}
  </span>
</div>
<div className="flex items-center justify-between text-xs">
  <span className="text-slate-400">Avg Deal Size (Won):</span>
  <span className="text-slate-200 font-mono tabular-nums">
    {formatCurrency(reg.avgDealSize)}
  </span>
</div>
<div className="flex items-center justify-between text-xs pt-0.5">
  <span className="text-slate-400">Avg Discount (Won):</span>
  <div className="text-right">
    <span className={`font-mono tabular-nums font-semibold ${
      reg.avgDiscountWon > 10 ? 'text-amber-400' : 'text-emerald-400'
    }`}>
      {reg.avgDiscountWon}%
    </span>
    <span 
      className="text-[10px] text-slate-400 font-mono ml-1.5 bg-slate-800/60 px-1 py-0.5 rounded border border-slate-700/60"
      title={`Gennemsnitlig rabat på alle ${reg.totalDeals} handler i ${reg.region} (både Closed Won og Closed Lost)`}
    >
      {reg.avgDiscountAll}% alle stages
    </span>
  </div>
</div>
```

---

## 5. Developer & Operational Instructions

### Local Development Setup
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Dev Server**:
   ```bash
   npm run dev
   ```
   The dev server runs at `http://localhost:3000`.

3. **Validate TypeScript & Lint**:
   ```bash
   npm run lint
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

---

## 6. Summary of Key Formulas for Executive Reference

| Metric | Scope | Mathematical Formula | US Example (1 Year) |
| :--- | :--- | :--- | :--- |
| **Total Revenue** | Closed Won | $\sum \text{revenue}_{\text{Won}}$ | **$3,898,000** |
| **Deals Count** | Closed Won | $\text{count}(\text{Won})$ | **85 deals** |
| **Average Deal Size** | Closed Won | $\frac{\sum \text{revenue}_{\text{Won}}}{\text{count}(\text{Won})}$ | **$45,858.82** ($45.9k) |
| **Average Discount (Won)** | Closed Won | $\frac{\sum \text{discountPct}_{\text{Won}}}{\text{count}(\text{Won})}$ | **8.61%** (8.6%) |
| **Average Discount (All Stages)** | Won + Lost | $\frac{\sum \text{discountPct}_{\text{All}}}{\text{count}(\text{All})}$ | **10.28%** (10.3%) |
| **Win Rate** | Closed Deals | $\frac{\text{count}(\text{Won})}{\text{count}(\text{Won}) + \text{count}(\text{Lost})} \times 100$ | $85 / (85+55) = \mathbf{61\%}$ |
| **US Annual Target** | 4 Reps $\times$ 12 Mo. | $(\$180k + \$160k + \$170k + \$140k) \times 12$ | **$7,800,000** ($7.80M) |
| **Company Annual Target** | 12 Reps $\times$ 12 Mo. | $\$1,855,000/\text{month} \times 12$ | **$22,260,000** ($22.26M) |
