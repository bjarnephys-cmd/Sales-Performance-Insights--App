import Papa from 'papaparse';
import { Deal, Region, ProductCategory, DealStage } from '../types/sales';

export interface ParseResult {
  deals: Deal[];
  errors: string[];
  totalRowsParsed: number;
  detectedColumns: {
    salesPersonCol?: string;
    regionCol?: string;
    categoryCol?: string;
    productCol?: string;
    revenueCol?: string;
    stageCol?: string;
    dateCol?: string;
  };
}

export function parseSpreadsheetData(csvText: string): ParseResult {
  const result: ParseResult = {
    deals: [],
    errors: [],
    totalRowsParsed: 0,
    detectedColumns: {},
  };

  const parsed = Papa.parse<Record<string, any>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (parsed.errors.length > 0) {
    result.errors.push(...parsed.errors.map(e => `Row ${e.row}: ${e.message}`));
  }

  const rows = parsed.data;
  if (!rows || rows.length === 0) {
    result.errors.push('No data rows found in spreadsheet.');
    return result;
  }

  const headers = Object.keys(rows[0] || {});
  const findHeader = (patterns: string[]): string | undefined => {
    return headers.find(h => {
      const clean = h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return patterns.some(p => clean.includes(p.replace(/[^a-z0-9]/g, '')));
    });
  };

  const repCol = findHeader(['salesperson', 'salesrep', 'rep', 'owner', 'accountrep', 'agent']);
  const regionCol = findHeader(['region', 'territory', 'geo', 'area', 'location']);
  const catCol = findHeader(['category', 'productline', 'segment', 'type']);
  const prodCol = findHeader(['product', 'item', 'sku', 'productname', 'solution']);
  const revCol = findHeader(['revenue', 'amount', 'dealsize', 'value', 'price', 'arr', 'acv']);
  const stageCol = findHeader(['stage', 'status', 'dealstage', 'outcome', 'state']);
  const dateCol = findHeader(['date', 'closedate', 'createdate', 'day', 'month']);
  const discountCol = findHeader(['discount', 'discountpct', 'disc']);
  const cycleCol = findHeader(['salescycle', 'duration', 'cycledays', 'days']);
  const accountCol = findHeader(['account', 'company', 'client', 'customer', 'customername']);
  const tierCol = findHeader(['tier', 'segment', 'customertier']);

  result.detectedColumns = {
    salesPersonCol: repCol,
    regionCol: regionCol,
    categoryCol: catCol,
    productCol: prodCol,
    revenueCol: revCol,
    stageCol: stageCol,
    dateCol: dateCol,
  };

  rows.forEach((row, idx) => {
    const rawRep = repCol ? String(row[repCol] || '').trim() : `Rep ${((idx % 4) + 1)}`;
    const rawRegion = regionCol ? String(row[regionCol] || '').trim().toUpperCase() : 'US';
    const rawCat = catCol ? String(row[catCol] || '').trim() : 'Cloud & Infrastructure';
    const rawProd = prodCol ? String(row[prodCol] || '').trim() : 'SaaS Core';
    const rawStage = stageCol ? String(row[stageCol] || '').trim() : 'Closed Won';
    const rawRev = revCol ? row[revCol] : 25000;
    const rawDate = dateCol ? String(row[dateCol] || '').trim() : '2026-10-15';
    const rawDiscount = discountCol ? row[discountCol] : 5;
    const rawCycle = cycleCol ? row[cycleCol] : 25;
    const rawAccount = accountCol ? String(row[accountCol] || '').trim() : `Enterprise Client ${idx + 1}`;
    const rawTier = tierCol ? String(row[tierCol] || '').trim() : 'Enterprise';

    // Normalize Region
    let region: Region = 'US';
    if (rawRegion.includes('EU') || rawRegion.includes('EUROPE') || rawRegion.includes('EMEA')) {
      region = 'Europe';
    } else if (rawRegion.includes('ASIA') || rawRegion.includes('APAC') || rawRegion.includes('JAPAN')) {
      region = 'Asia';
    } else {
      region = 'US';
    }

    // Normalize Stage
    let stage: DealStage = 'Closed Won';
    const cleanStage = rawStage.toLowerCase();
    if (cleanStage.includes('lost') || cleanStage.includes('churn') || cleanStage.includes('fail')) {
      stage = 'Closed Lost';
    } else if (cleanStage.includes('pipeline') || cleanStage.includes('progress') || cleanStage.includes('negotiat') || cleanStage.includes('open')) {
      stage = 'In Pipeline';
    } else {
      stage = 'Closed Won';
    }

    // Clean revenue
    const cleanRevStr = String(rawRev).replace(/[^0-9.-]+/g, '');
    const revenue = Math.max(0, parseFloat(cleanRevStr) || 0);

    const cleanDiscStr = String(rawDiscount).replace(/[^0-9.-]+/g, '');
    const discountPct = Math.min(100, Math.max(0, parseFloat(cleanDiscStr) || 0));

    const cleanCycleStr = String(rawCycle).replace(/[^0-9.-]+/g, '');
    const salesCycleDays = Math.max(1, parseInt(cleanCycleStr, 10) || 20);

    // Normalize Category
    let category: ProductCategory = rawCat || 'Cloud & Infrastructure';
    const cleanCat = rawCat.toLowerCase();
    if (cleanCat.includes('sec') || cleanCat.includes('threat') || cleanCat.includes('complian')) {
      category = 'Security & Compliance';
    } else if (cleanCat.includes('ai') || cleanCat.includes('intel') || cleanCat.includes('copilot') || cleanCat.includes('ml')) {
      category = 'AI & Data Intelligence';
    } else if (cleanCat.includes('collab') || cleanCat.includes('work') || cleanCat.includes('team') || cleanCat.includes('desk')) {
      category = 'Collaboration & Workflows';
    } else if (cleanCat.includes('analytic') || cleanCat.includes('bi') || cleanCat.includes('forecast') || cleanCat.includes('metric')) {
      category = 'Analytics & BI Intelligence';
    } else if (cleanCat.includes('success') || cleanCat.includes('retention') || cleanCat.includes('churn') || cleanCat.includes('nps')) {
      category = 'Customer Success & Retention';
    } else if (cleanCat.includes('dev') || cleanCat.includes('api') || cleanCat.includes('webhook') || cleanCat.includes('sdk')) {
      category = 'Developer Platforms & APIs';
    } else if (cleanCat.includes('cloud') || cleanCat.includes('infra') || cleanCat.includes('server') || cleanCat.includes('db')) {
      category = 'Cloud & Infrastructure';
    } else if (rawCat.trim()) {
      category = rawCat.trim();
    }

    let tier: 'Enterprise' | 'Mid-Market' | 'Scale-Up' = 'Enterprise';
    if (rawTier.toLowerCase().includes('mid')) tier = 'Mid-Market';
    else if (rawTier.toLowerCase().includes('scale') || rawTier.toLowerCase().includes('grow')) tier = 'Scale-Up';

    if (rawRep && revenue >= 0) {
      result.deals.push({
        id: row['Deal ID'] || row['id'] || `DL-UP-${1000 + idx}`,
        date: rawDate,
        salesPerson: rawRep,
        region,
        category,
        product: rawProd || 'Standard Plan',
        stage,
        revenue,
        discountPct,
        salesCycleDays,
        accountName: rawAccount,
        tier,
      });
    }
  });

  result.totalRowsParsed = result.deals.length;
  return result;
}

export function exportDealsToCSV(deals: Deal[]): string {
  return Papa.unparse(
    deals.map(d => ({
      'Deal ID': d.id,
      'Date': d.date,
      'Sales Person': d.salesPerson,
      'Region': d.region,
      'Category': d.category,
      'Product': d.product,
      'Stage': d.stage,
      'Revenue USD': d.revenue,
      'Discount Pct': d.discountPct,
      'Sales Cycle Days': d.salesCycleDays,
      'Account Name': d.accountName,
      'Customer Tier': d.tier,
    }))
  );
}

export function triggerDownload(content: string, filename: string, mimeType = 'text/csv') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
