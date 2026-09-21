// lib/excel/report-template.ts
// Professional Excel report using ExcelJS — 3 sheets
// Sheet 1: Summary | Sheet 2: Full BOQ | Sheet 3: Labour & Timeline

import ExcelJS from 'exceljs';
import type { EstimateResult } from '@/lib/engine/types';
import { computeLabourBreakdown, estimateTimeline } from '@/lib/utils';
import { calculateWallAnalysis } from '@/lib/engine';

const NAVY  = '1E2D4E';
const ORANGE = 'F97316';
const LIGHT_ORANGE = 'FFF7ED';
const WHITE = 'FFFFFF';
const GRAY_BG = 'F8FAFC';
const GRAY_TEXT = '64748B';
const DARK_TEXT = '0F172A';

// Category colours matching the app
const CAT_COLORS: Record<string, string> = {
  CAT_01: 'EF4444', CAT_02: '3B82F6', CAT_03: '14B8A6',
  CAT_04: '8B5CF6', CAT_05: 'F59E0B', CAT_06: '10B981',
  CAT_07: 'EC4899', CAT_08: '06B6D4', CAT_09: '84CC16',
  CAT_10: 'F97316', CAT_11: '6366F1', CAT_12: '78716C',
  CAT_13: 'D97706', CAT_14: '6B7280',
  CAT_15: '475569', // Parking & Basement
  CAT_16: '0EA5E9', // Swimming Pool & Recreation
  CAT_17: '16A34A', // Solar & Green Building
  CAT_18: 'D97706', // Preliminaries, Site & Contingency
};

const INR_FORMAT = '₹#,##,##0'; // Indian number format

function setCell(
  ws: ExcelJS.Worksheet,
  col: number,
  row: number,
  value: ExcelJS.CellValue,
  opts?: {
    bold?: boolean; size?: number; color?: string; bg?: string;
    align?: ExcelJS.Alignment['horizontal']; numFmt?: string;
    border?: boolean; italic?: boolean; wrapText?: boolean;
  }
) {
  const c = ws.getCell(row, col);
  c.value = value;
  c.font = {
    name: 'Calibri',
    bold: opts?.bold ?? false,
    size: opts?.size ?? 11,
    color: { argb: `FF${opts?.color ?? DARK_TEXT}` },
    italic: opts?.italic ?? false,
  };
  if (opts?.bg) {
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${opts.bg}` } };
  }
  c.alignment = {
    horizontal: opts?.align ?? 'left',
    vertical: 'middle',
    wrapText: opts?.wrapText ?? false,
  };
  if (opts?.numFmt) c.numFmt = opts.numFmt;
  if (opts?.border) {
    c.border = {
      top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
    };
  }
  return c;
}

function headerRow(ws: ExcelJS.Worksheet, row: number, cols: string[], colStart = 1) {
  cols.forEach((h, i) => {
    setCell(ws, colStart + i, row, h, {
      bold: true, size: 10, color: GRAY_TEXT, bg: GRAY_BG, align: i > 2 ? 'right' : 'left', border: true,
    });
  });
}

export async function generateEstimateExcel(
  result: EstimateResult,
  inputSummary: Record<string, string>,
  numFloors = 1,
  typology = 'Residential',
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'OUTSYD';
  wb.created = new Date();
  wb.modified = new Date();

  // ── Sheet 1: Summary ────────────────────────────────────────────────────────
  const ws1 = wb.addWorksheet('Summary', { properties: { tabColor: { argb: `FF${ORANGE}` } } });
  ws1.getColumn(1).width = 32;
  ws1.getColumn(2).width = 26;
  ws1.getRow(1).height = 36;

  // Brand header row
  ws1.mergeCells('A1:B1');
  const brandCell = ws1.getCell('A1');
  brandCell.value = 'OUTSYD';
  brandCell.font = { name: 'Calibri', bold: true, size: 22, color: { argb: `FF${WHITE}` } };
  brandCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  brandCell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Subtitle
  ws1.mergeCells('A2:B2');
  const subtitleCell = ws1.getCell('A2');
  subtitleCell.value = 'Construction Cost Estimate Report';
  subtitleCell.font = { name: 'Calibri', size: 12, color: { argb: `FF${WHITE}` }, italic: true };
  subtitleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  subtitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws1.getRow(2).height = 22;

  // Date / dataset row
  ws1.mergeCells('A3:B3');
  const dateCell = ws1.getCell('A3');
  dateCell.value = `Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}   |   Dataset: ${result.coefficientDatasetVersion}`;
  dateCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' }, italic: true };
  dateCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  dateCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws1.getRow(3).height = 18;

  let row = 5;

  // Accuracy Band
  ws1.mergeCells(`A${row}:B${row}`);
  const bandColors: Record<string, string> = { Preliminary_15_20: 'FEF3C7', Standard_10_15: 'DBEAFE', Advanced_5_10: 'D1FAE5' };
  const bandTextColors: Record<string, string> = { Preliminary_15_20: '92400E', Standard_10_15: '1E40AF', Advanced_5_10: '065F46' };
  const bandCell2 = ws1.getCell(`A${row}`);
  bandCell2.value = `⬤  ${result.accuracyBandDisplay}`;
  bandCell2.font = { name: 'Calibri', bold: true, size: 13, color: { argb: `FF${bandTextColors[result.accuracyBand] ?? '92400E'}` } };
  bandCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${bandColors[result.accuracyBand] ?? 'FEF3C7'}` } };
  bandCell2.alignment = { horizontal: 'left', vertical: 'middle' };
  const thinBorder = {
    top: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    bottom: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    left: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
    right: { style: 'thin' as const, color: { argb: 'FFE2E8F0' } },
  };
  bandCell2.border = thinBorder;
  ws1.getCell(`B${row}`).border = thinBorder;
  ws1.getRow(row).height = 28;

  // Classification info row
  ws1.mergeCells(`A${row + 1}:B${row + 1}`);
  const classCell = ws1.getCell(`A${row + 1}`);
  classCell.value = `Classification: Tier ${result.classification.tier} — ${result.classification.category.replace(/_/g, ' ')}`;
  classCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' }, italic: true };
  classCell.alignment = { horizontal: 'left', vertical: 'middle' };
  ws1.getRow(row + 1).height = 18;
  row += 3;

  // Summary metrics
  const buaSqft = result.derivedDimensions.totalBuaSqft;
  const metrics = [
    ['Material Cost (Direct)', result.grandTotalMaterialCost],
    ['With Labour (+30%)', result.grandTotalWithLabor],
    ['Cost per sqft (Material)', buaSqft > 0 ? result.grandTotalMaterialCost / buaSqft : 0],
    ['All-in per sqft (with Labour)', buaSqft > 0 ? result.grandTotalWithLabor / buaSqft : 0],
    ['Plinth Area Estimate', result.plinthAreaEstimate],
    ['Total BUA (sqft)', null],
  ] as [string, number | null][];

  // Section header
  ws1.mergeCells(`A${row}:B${row}`);
  const secHdr = ws1.getCell(`A${row}`);
  secHdr.value = 'COST SUMMARY';
  secHdr.font = { name: 'Calibri', bold: true, size: 10, color: { argb: `FF${WHITE}` } };
  secHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  secHdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws1.getRow(row).height = 22;
  row++;

  metrics.forEach(([label, val]) => {
    const isHighlight = label === 'With Labour (+30%)';
    setCell(ws1, 1, row, label, {
      bold: isHighlight, size: 11,
      color: isHighlight ? ORANGE : DARK_TEXT,
      bg: isHighlight ? LIGHT_ORANGE : (row % 2 === 0 ? GRAY_BG : WHITE),
      border: true,
    });
    if (val !== null) {
      setCell(ws1, 2, row, val, {
        bold: isHighlight, size: 11, align: 'right',
        color: isHighlight ? ORANGE : DARK_TEXT,
        bg: isHighlight ? LIGHT_ORANGE : (row % 2 === 0 ? GRAY_BG : WHITE),
        numFmt: label.includes('sqft') ? '₹#,##0' : INR_FORMAT,
        border: true,
      });
    } else {
      setCell(ws1, 2, row, `${buaSqft.toLocaleString('en-IN')} sqft`, {
        size: 11, align: 'right', border: true,
        bg: row % 2 === 0 ? GRAY_BG : WHITE,
      });
    }
    ws1.getRow(row).height = 20;
    row++;
  });

  row += 2;

  // Project details section
  ws1.mergeCells(`A${row}:B${row}`);
  const projHdr = ws1.getCell(`A${row}`);
  projHdr.value = 'PROJECT DETAILS';
  projHdr.font = { name: 'Calibri', bold: true, size: 10, color: { argb: `FF${WHITE}` } };
  projHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  projHdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws1.getRow(row).height = 22;
  row++;

  Object.entries(inputSummary).forEach(([k, v]) => {
    setCell(ws1, 1, row, k, { size: 10, color: GRAY_TEXT, bg: row % 2 === 0 ? GRAY_BG : WHITE, border: true });
    setCell(ws1, 2, row, v, { bold: true, size: 10, bg: row % 2 === 0 ? GRAY_BG : WHITE, border: true });
    ws1.getRow(row).height = 18;
    row++;
  });

  // Disclaimer
  row += 2;
  ws1.mergeCells(`A${row}:B${row + 2}`);
  const discCell = ws1.getCell(`A${row}`);
  discCell.value = `DISCLAIMER: ${result.disclaimer}\n\nAll figures are preliminary estimates only. Not a substitute for detailed BOQ by a licensed quantity surveyor.`;
  discCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' }, italic: true };
  discCell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  ws1.getRow(row).height = 25;
  ws1.getRow(row + 1).height = 25;
  ws1.getRow(row + 2).height = 25;

  // ── Sheet 2: Full BOQ ────────────────────────────────────────────────────────
  const ws2 = wb.addWorksheet('Full BOQ', { properties: { tabColor: { argb: `FF3B82F6` } } });
  ws2.getColumn(1).width = 12;  // Code
  ws2.getColumn(2).width = 36;  // Description
  ws2.getColumn(3).width = 26;  // Grade/Spec
  ws2.getColumn(4).width = 12;  // Qty
  ws2.getColumn(5).width = 8;   // Unit
  ws2.getColumn(6).width = 15;  // Rate
  ws2.getColumn(7).width = 17;  // Amount

  // BOQ Brand header
  ws2.mergeCells('A1:G1');
  const boqBrand = ws2.getCell('A1');
  boqBrand.value = 'OUTSYD — Full Bill of Quantities';
  boqBrand.font = { name: 'Calibri', bold: true, size: 16, color: { argb: `FF${WHITE}` } };
  boqBrand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  boqBrand.alignment = { horizontal: 'left', vertical: 'middle' };
  ws2.getRow(1).height = 36;

  ws2.mergeCells('A2:G2');
  const boqSub = ws2.getCell('A2');
  boqSub.value = `Generated: ${new Date().toLocaleDateString('en-IN')}   |   Dataset: ${result.coefficientDatasetVersion}   |   Regional Index: ${result.regionalIndexApplied}×`;
  boqSub.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' }, italic: true };
  boqSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  boqSub.alignment = { horizontal: 'left', vertical: 'middle' };
  ws2.getRow(2).height = 18;

  ws2.getRow(3).height = 5; // spacer

  // Column headers (row 4)
  headerRow(ws2, 4, ['Code', 'Item Description', 'Grade / Specification', 'Quantity', 'Unit', 'Unit Rate (₹)', 'Amount (₹)']);
  ws2.getRow(4).height = 22;

  // Freeze rows 1-4
  ws2.views = [{ state: 'frozen', xSplit: 0, ySplit: 4 }];

  // Auto-filter on row 4
  ws2.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: 7 } };

  let boqRow = 5;

  result.categoryTotals.forEach(cat => {
    const items = result.lineItems.filter(li => li.categoryCode === cat.categoryCode);
    if (items.length === 0) return;

    const catColor = CAT_COLORS[cat.categoryCode] ?? NAVY;

    // Category header row
    ws2.mergeCells(`A${boqRow}:C${boqRow}`);
    const catHdrCell = ws2.getCell(`A${boqRow}`);
    catHdrCell.value = `${cat.categoryCode}  —  ${cat.name}`;
    catHdrCell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
    catHdrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${catColor}` } };
    catHdrCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws2.getRow(boqRow).height = 22;

    // Amount header cells in same row
    ['Quantity', 'Unit', 'Unit Rate (₹)', 'Amount (₹)'].forEach((_, i) => {
      const c = ws2.getCell(boqRow, 4 + i);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${catColor}` } };
      c.border = { top: { style: 'thin', color: { argb: 'FFE2E8F0' } }, bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } } };
    });
    boqRow++;

    // Line items
    items.forEach((item, idx) => {
      const bg = idx % 2 === 0 ? WHITE : GRAY_BG;
      setCell(ws2, 1, boqRow, item.materialItemCode, { size: 9, color: GRAY_TEXT, bg, border: true });
      setCell(ws2, 2, boqRow, item.name, { size: 10, bold: false, bg, border: true, wrapText: false });
      setCell(ws2, 3, boqRow, item.recommendedGrade, { size: 9, color: GRAY_TEXT, bg, border: true, wrapText: true });
      setCell(ws2, 4, boqRow, item.quantity, { size: 10, align: 'right', bg, numFmt: '#,##0.##', border: true });
      setCell(ws2, 5, boqRow, item.unit, { size: 10, color: GRAY_TEXT, bg, border: true });
      setCell(ws2, 6, boqRow, item.unitRate, { size: 10, align: 'right', bg, numFmt: INR_FORMAT, border: true });
      setCell(ws2, 7, boqRow, item.lineCost, { size: 10, align: 'right', bold: true, bg, numFmt: INR_FORMAT, border: true });
      ws2.getRow(boqRow).height = 18;
      boqRow++;
    });

    // Category subtotal row
    const pct = result.grandTotalMaterialCost > 0
      ? ((cat.subtotal / result.grandTotalMaterialCost) * 100).toFixed(1)
      : '0';
    ws2.mergeCells(`A${boqRow}:C${boqRow}`);
    const subtotalLabel = ws2.getCell(`A${boqRow}`);
    subtotalLabel.value = `  Subtotal: ${cat.name}  (${pct}% of total)`;
    subtotalLabel.font = { name: 'Calibri', bold: true, size: 10, color: { argb: `FF${NAVY}` } };
    subtotalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_ORANGE}` } };
    subtotalLabel.alignment = { horizontal: 'right', vertical: 'middle' };

    for (let c = 4; c <= 6; c++) {
      const emptyCell = ws2.getCell(boqRow, c);
      emptyCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_ORANGE}` } };
    }
    const subtotalVal = ws2.getCell(boqRow, 7);
    subtotalVal.value = cat.subtotal;
    subtotalVal.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${NAVY}` } };
    subtotalVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_ORANGE}` } };
    subtotalVal.alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalVal.numFmt = INR_FORMAT;
    ws2.getRow(boqRow).height = 22;
    boqRow += 2;
  });

  // Grand Total row
  ws2.mergeCells(`A${boqRow}:F${boqRow}`);
  const grandLabel = ws2.getCell(`A${boqRow}`);
  grandLabel.value = 'GRAND TOTAL — MATERIALS';
  grandLabel.font = { name: 'Calibri', bold: true, size: 12, color: { argb: `FF${WHITE}` } };
  grandLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ORANGE}` } };
  grandLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const grandVal = ws2.getCell(boqRow, 7);
  grandVal.value = result.grandTotalMaterialCost;
  grandVal.font = { name: 'Calibri', bold: true, size: 14, color: { argb: `FF${WHITE}` } };
  grandVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ORANGE}` } };
  grandVal.alignment = { horizontal: 'right', vertical: 'middle' };
  grandVal.numFmt = INR_FORMAT;
  ws2.getRow(boqRow).height = 28;
  boqRow += 1;

  // With Labour row
  ws2.mergeCells(`A${boqRow}:F${boqRow}`);
  const labourLabel = ws2.getCell(`A${boqRow}`);
  labourLabel.value = 'WITH LABOUR (+30%)';
  labourLabel.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${NAVY}` } };
  labourLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_ORANGE}` } };
  labourLabel.alignment = { horizontal: 'right', vertical: 'middle' };

  const labourVal = ws2.getCell(boqRow, 7);
  labourVal.value = result.grandTotalWithLabor;
  labourVal.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${NAVY}` } };
  labourVal.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${LIGHT_ORANGE}` } };
  labourVal.alignment = { horizontal: 'right', vertical: 'middle' };
  labourVal.numFmt = INR_FORMAT;
  ws2.getRow(boqRow).height = 22;

  // ── Sheet 3: Labour & Timeline ───────────────────────────────────────────────
  const ws3 = wb.addWorksheet('Labour & Timeline', { properties: { tabColor: { argb: 'FF10B981' } } });
  ws3.getColumn(1).width = 32;
  ws3.getColumn(2).width = 20;
  ws3.getColumn(3).width = 16;

  ws3.mergeCells('A1:C1');
  const ls3Brand = ws3.getCell('A1');
  ls3Brand.value = 'OUTSYD — Labour Breakdown & Construction Timeline';
  ls3Brand.font = { name: 'Calibri', bold: true, size: 14, color: { argb: `FF${WHITE}` } };
  ls3Brand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  ls3Brand.alignment = { horizontal: 'left', vertical: 'middle' };
  ws3.getRow(1).height = 32;

  let lr = 3;

  // Labour section
  ws3.mergeCells(`A${lr}:C${lr}`);
  const labHdr = ws3.getCell(`A${lr}`);
  labHdr.value = 'LABOUR BREAKDOWN (30% of material cost)';
  labHdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  labHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  labHdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws3.getRow(lr).height = 22;
  lr++;

  headerRow(ws3, lr, ['Trade', 'Amount (₹)', 'Share (%)']);
  ws3.getRow(lr).height = 20;
  lr++;

  const labourRows = computeLabourBreakdown(Math.max(0, result.grandTotalWithLabor - result.grandTotalMaterialCost));
  const labourTotal = labourRows.reduce((s, r) => s + r.amount, 0);

  labourRows.forEach((r, idx) => {
    const bg = idx % 2 === 0 ? WHITE : GRAY_BG;
    setCell(ws3, 1, lr, r.trade, { size: 10, bg, border: true });
    setCell(ws3, 2, lr, r.amount, { size: 10, align: 'right', bg, numFmt: INR_FORMAT, border: true });
    setCell(ws3, 3, lr, r.pct / 100, { size: 10, align: 'right', bg, numFmt: '0.0%', border: true });
    ws3.getRow(lr).height = 18;
    lr++;
  });

  // Labour total
  setCell(ws3, 1, lr, 'Total Labour Cost', { bold: true, bg: LIGHT_ORANGE, border: true });
  setCell(ws3, 2, lr, labourTotal, { bold: true, align: 'right', bg: LIGHT_ORANGE, numFmt: INR_FORMAT, border: true });
  setCell(ws3, 3, lr, '', { bg: LIGHT_ORANGE, border: true });
  ws3.getRow(lr).height = 22;
  lr += 3;

  // Timeline
  const buaForTimeline = result.derivedDimensions.totalBuaSqft;
  const timeline = estimateTimeline(buaForTimeline, numFloors, typology);

  ws3.mergeCells(`A${lr}:C${lr}`);
  const timeHdr = ws3.getCell(`A${lr}`);
  timeHdr.value = `CONSTRUCTION TIMELINE (~${timeline.totalMonths[0]}–${timeline.totalMonths[1]} months)`;
  timeHdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  timeHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  timeHdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws3.getRow(lr).height = 22;
  lr++;

  headerRow(ws3, lr, ['Phase', 'Duration', 'Share (%)']);
  ws3.getRow(lr).height = 20;
  lr++;

  timeline.phases.forEach((p, idx) => {
    const bg = idx % 2 === 0 ? WHITE : GRAY_BG;
    setCell(ws3, 1, lr, p.name, { size: 10, bg, border: true });
    setCell(ws3, 2, lr, `Month ${p.months[0]}–${p.months[1]}`, { size: 10, bg, border: true });
    setCell(ws3, 3, lr, p.pct / 100, { size: 10, align: 'right', bg, numFmt: '0%', border: true });
    ws3.getRow(lr).height = 18;
    lr++;
  });

  lr += 2;
  ws3.mergeCells(`A${lr}:C${lr}`);
  const note = ws3.getCell(`A${lr}`);
  note.value = '* Timeline is indicative only. Actual duration depends on contractor capacity, monsoon, approvals, and site conditions.';
  note.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' }, italic: true };
  note.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
  ws3.getRow(lr).height = 32;

  // ── Sheet 4: Wall Analysis (IS 1200 / CPWD DSR) ──────────────────────────────
  const ws4 = wb.addWorksheet('Wall Analysis', { properties: { tabColor: { argb: 'FF10B981' } } });
  ws4.getColumn(1).width = 28;  // Parameter / Wall Orientation
  ws4.getColumn(2).width = 30;  // Formula / Rule
  ws4.getColumn(3).width = 16;  // Dimension / Length
  ws4.getColumn(4).width = 14;  // Qty / Floor
  ws4.getColumn(5).width = 20;  // Cost/Wall (Material)
  ws4.getColumn(6).width = 20;  // Cost/Wall (Turnkey)
  ws4.getColumn(7).width = 22;  // Total All Floors (₹)

  // Header banner
  ws4.mergeCells('A1:G1');
  const wallBrand = ws4.getCell('A1');
  wallBrand.value = 'OUTSYD — Wall Quantity Survey & Method Analysis';
  wallBrand.font = { name: 'Calibri', bold: true, size: 16, color: { argb: `FF${WHITE}` } };
  wallBrand.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  wallBrand.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(1).height = 36;

  ws4.mergeCells('A2:G2');
  const wallSub = ws4.getCell('A2');
  wallSub.value = 'IS 1200 / CPWD DSR Superstructure Masonry Takeoff · Long Wall - Short Wall vs Center Line Method';
  wallSub.font = { name: 'Calibri', size: 9, color: { argb: 'FF94A3B8' }, italic: true };
  wallSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  wallSub.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(2).height = 18;

  ws4.getRow(3).height = 8; // spacer

  // Calculate Wall Analysis
  const cat03Subtotal = result.categoryTotals.find(c => c.categoryCode === 'CAT_03')?.subtotal ?? 0;
  let lenFt = 40;
  let brdFt = 30;
  let htFt = 20;

  if (inputSummary['Dimensions']) {
    const m = inputSummary['Dimensions'].match(/(\d+(\.\d+)?)\s*ft\s*[×x]\s*(\d+(\.\d+)?)\s*ft\s*[×x]\s*(\d+(\.\d+)?)\s*ft/i);
    if (m) {
      lenFt = parseFloat(m[1]);
      brdFt = parseFloat(m[3]);
      htFt = parseFloat(m[5]);
    }
  }

  const wallAnalysis = calculateWallAnalysis(
    {
      lengthFt: lenFt,
      breadthFt: brdFt,
      heightFt: htFt,
      numFloors,
      typology,
    },
    cat03Subtotal,
  );

  let wr = 4;

  // Section 1: Dimensions & Rate Summary
  ws4.mergeCells(`A${wr}:G${wr}`);
  const sec1Hdr = ws4.getCell(`A${wr}`);
  sec1Hdr.value = 'WALL DIMENSIONS & LINEAR RATES';
  sec1Hdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  sec1Hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${NAVY}` } };
  sec1Hdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(wr).height = 22;
  wr++;

  const dimMetrics = [
    ['Envelope Dimensions (Out-to-Out)', `${wallAnalysis.inputs.outerLengthFt} ft × ${wallAnalysis.inputs.outerBreadthFt} ft`, 'Floors / Clear Height', `${wallAnalysis.inputs.numFloors} floor(s) · ${wallAnalysis.inputs.floorHeightFt} ft clear ht`],
    ['Nominal Wall Thickness', `${wallAnalysis.inputs.wallThicknessMm} mm (${wallAnalysis.inputs.wallThicknessFt} ft / 9")`, 'Centerline Perimeter / Flr', `${wallAnalysis.centerToCenter.totalCenterLinePerFloorFt} ft / floor`],
    ['Total Centerline Running Length', `${wallAnalysis.centerToCenter.totalCenterLineAllFloorsFt} RFT (All floors)`, 'Gross Surface Wall Area', `${wallAnalysis.reconciliation.totalWallAreaSqft.toLocaleString('en-IN')} sqft`],
    ['Wall Material Cost / RFT', wallAnalysis.rates.materialCostPerRft, 'Turnkey Cost / RFT (+30%)', wallAnalysis.rates.turnkeyCostPerRft],
    ['Total Masonry Material Cost', wallAnalysis.totalWallMaterialCost, 'Total Turnkey Wall Cost', wallAnalysis.totalWallTurnkeyCost],
  ];

  dimMetrics.forEach((m, idx) => {
    const bg = idx % 2 === 0 ? WHITE : GRAY_BG;
    setCell(ws4, 1, wr, m[0], { size: 10, color: GRAY_TEXT, bg, border: true });
    if (typeof m[1] === 'number') {
      setCell(ws4, 2, wr, m[1], { bold: true, size: 10, align: 'right', bg, numFmt: INR_FORMAT, border: true });
    } else {
      setCell(ws4, 2, wr, m[1], { bold: true, size: 10, bg, border: true });
    }
    setCell(ws4, 3, wr, m[2], { size: 10, color: GRAY_TEXT, bg, border: true });
    if (typeof m[3] === 'number') {
      ws4.mergeCells(`D${wr}:G${wr}`);
      setCell(ws4, 4, wr, m[3], { bold: true, size: 10, align: 'right', bg, numFmt: INR_FORMAT, border: true });
    } else {
      ws4.mergeCells(`D${wr}:G${wr}`);
      setCell(ws4, 4, wr, m[3], { bold: true, size: 10, bg, border: true });
    }
    ws4.getRow(wr).height = 20;
    wr++;
  });

  wr += 2;

  // Section 2: Method 1 — Long Wall - Short Wall Method
  ws4.mergeCells(`A${wr}:G${wr}`);
  const sec2Hdr = ws4.getCell(`A${wr}`);
  sec2Hdr.value = 'METHOD 1: LONG WALL - SHORT WALL METHOD (SEPARATE WALL TAKEOFF)';
  sec2Hdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  sec2Hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F97316' } };
  sec2Hdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(wr).height = 22;
  wr++;

  headerRow(ws4, wr, ['Wall Orientation', 'Measurement Rule', 'Length (ft)', 'Walls / Flr', 'Cost/Wall (Material)', 'Cost/Wall (Turnkey)', 'Total All Floors (₹)']);
  ws4.getRow(wr).height = 20;
  wr++;

  // Long wall row
  setCell(ws4, 1, wr, 'Long Wall (Lengthwise)', { bold: true, size: 10, bg: WHITE, border: true });
  setCell(ws4, 2, wr, 'Out-to-out (c/c + T = L)', { size: 10, color: GRAY_TEXT, bg: WHITE, border: true });
  setCell(ws4, 3, wr, wallAnalysis.longShortWallMethod.longWallLengthFt, { align: 'right', bg: WHITE, border: true });
  setCell(ws4, 4, wr, 2, { align: 'center', bg: WHITE, border: true });
  setCell(ws4, 5, wr, wallAnalysis.longShortWallMethod.costPerLongWallMat, { align: 'right', bg: WHITE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.longShortWallMethod.costPerLongWallTurnkey, { align: 'right', bold: true, bg: WHITE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.longShortWallMethod.totalLongWallsCostMat, { align: 'right', bold: true, color: NAVY, bg: WHITE, numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 20;
  wr++;

  // Short wall row
  setCell(ws4, 1, wr, 'Short Wall (Crosswise)', { bold: true, size: 10, bg: GRAY_BG, border: true });
  setCell(ws4, 2, wr, 'In-to-in (c/c - T = B - 2T)', { size: 10, color: GRAY_TEXT, bg: GRAY_BG, border: true });
  setCell(ws4, 3, wr, wallAnalysis.longShortWallMethod.shortWallLengthFt, { align: 'right', bg: GRAY_BG, border: true });
  setCell(ws4, 4, wr, 2, { align: 'center', bg: GRAY_BG, border: true });
  setCell(ws4, 5, wr, wallAnalysis.longShortWallMethod.costPerShortWallMat, { align: 'right', bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.longShortWallMethod.costPerShortWallTurnkey, { align: 'right', bold: true, bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.longShortWallMethod.totalShortWallsCostMat, { align: 'right', bold: true, color: NAVY, bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 20;
  wr++;

  // Long/Short total row
  setCell(ws4, 1, wr, 'Total (Long + Short Walls)', { bold: true, size: 10, bg: LIGHT_ORANGE, border: true });
  setCell(ws4, 2, wr, '2×L_out + 2×B_in', { size: 10, color: GRAY_TEXT, bg: LIGHT_ORANGE, border: true });
  setCell(ws4, 3, wr, `${wallAnalysis.longShortWallMethod.effectivePerimeterPerFloorFt} ft/flr`, { align: 'right', bold: true, bg: LIGHT_ORANGE, border: true });
  setCell(ws4, 4, wr, `${numFloors * 4} total`, { align: 'center', bold: true, bg: LIGHT_ORANGE, border: true });
  setCell(ws4, 5, wr, wallAnalysis.longShortWallMethod.totalCostMat, { align: 'right', bold: true, bg: LIGHT_ORANGE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.longShortWallMethod.totalCostTurnkey, { align: 'right', bold: true, color: ORANGE, bg: LIGHT_ORANGE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.longShortWallMethod.totalCostMat, { align: 'right', bold: true, color: NAVY, bg: LIGHT_ORANGE, numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 22;
  wr++;

  wr += 2;

  // Section 3: Method 2 — Center Line Method
  ws4.mergeCells(`A${wr}:G${wr}`);
  const sec3Hdr = ws4.getCell(`A${wr}`);
  sec3Hdr.value = 'METHOD 2: CENTER LINE METHOD (CONTINUOUS AXIS TAKEOFF)';
  sec3Hdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  sec3Hdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '3B82F6' } };
  sec3Hdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(wr).height = 22;
  wr++;

  headerRow(ws4, wr, ['Wall Axis', 'Centerline Dimension', 'Length (ft)', 'Axes / Flr', 'Cost/Axis (Material)', 'Cost/Axis (Turnkey)', 'Total All Floors (₹)']);
  ws4.getRow(wr).height = 20;
  wr++;

  // Long wall axis
  setCell(ws4, 1, wr, 'Long Wall Axis', { bold: true, size: 10, bg: WHITE, border: true });
  setCell(ws4, 2, wr, 'L_cc = L - T', { size: 10, color: GRAY_TEXT, bg: WHITE, border: true });
  setCell(ws4, 3, wr, wallAnalysis.centerToCenter.lengthCcFt, { align: 'right', bg: WHITE, border: true });
  setCell(ws4, 4, wr, 2, { align: 'center', bg: WHITE, border: true });
  setCell(ws4, 5, wr, wallAnalysis.centerLineMethod.costPerLongWallMat, { align: 'right', bg: WHITE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.centerLineMethod.costPerLongWallTurnkey, { align: 'right', bold: true, bg: WHITE, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.centerLineMethod.totalLongWallsCostMat, { align: 'right', bold: true, color: NAVY, bg: WHITE, numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 20;
  wr++;

  // Short wall axis
  setCell(ws4, 1, wr, 'Short Wall Axis', { bold: true, size: 10, bg: GRAY_BG, border: true });
  setCell(ws4, 2, wr, 'B_cc = B - T', { size: 10, color: GRAY_TEXT, bg: GRAY_BG, border: true });
  setCell(ws4, 3, wr, wallAnalysis.centerToCenter.breadthCcFt, { align: 'right', bg: GRAY_BG, border: true });
  setCell(ws4, 4, wr, 2, { align: 'center', bg: GRAY_BG, border: true });
  setCell(ws4, 5, wr, wallAnalysis.centerLineMethod.costPerShortWallMat, { align: 'right', bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.centerLineMethod.costPerShortWallTurnkey, { align: 'right', bold: true, bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.centerLineMethod.totalShortWallsCostMat, { align: 'right', bold: true, color: NAVY, bg: GRAY_BG, numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 20;
  wr++;

  // Centerline total row
  setCell(ws4, 1, wr, 'Total Centerline Takeoff', { bold: true, size: 10, bg: 'EFF6FF', border: true });
  setCell(ws4, 2, wr, '2×(L_cc + B_cc) × numFloors', { size: 10, color: GRAY_TEXT, bg: 'EFF6FF', border: true });
  setCell(ws4, 3, wr, `${wallAnalysis.centerLineMethod.effectivePerimeterPerFloorFt} ft/flr`, { align: 'right', bold: true, bg: 'EFF6FF', border: true });
  setCell(ws4, 4, wr, `${numFloors * 4} axes`, { align: 'center', bold: true, bg: 'EFF6FF', border: true });
  setCell(ws4, 5, wr, wallAnalysis.centerLineMethod.totalCostMat, { align: 'right', bold: true, bg: 'EFF6FF', numFmt: INR_FORMAT, border: true });
  setCell(ws4, 6, wr, wallAnalysis.centerLineMethod.totalCostTurnkey, { align: 'right', bold: true, color: '3B82F6', bg: 'EFF6FF', numFmt: INR_FORMAT, border: true });
  setCell(ws4, 7, wr, wallAnalysis.centerLineMethod.totalCostMat, { align: 'right', bold: true, color: NAVY, bg: 'EFF6FF', numFmt: INR_FORMAT, border: true });
  ws4.getRow(wr).height = 22;
  wr++;

  wr += 2;

  // Section 4: Best Approach Recommendation
  ws4.mergeCells(`A${wr}:G${wr}`);
  const recHdr = ws4.getCell(`A${wr}`);
  recHdr.value = `BEST APPROACH RECOMMENDATION: ${wallAnalysis.bestApproachRecommendation.verdictTitle.toUpperCase()}`;
  recHdr.font = { name: 'Calibri', bold: true, size: 11, color: { argb: `FF${WHITE}` } };
  recHdr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } };
  recHdr.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(wr).height = 24;
  wr++;

  ws4.mergeCells(`A${wr}:G${wr}`);
  const recSub = ws4.getCell(`A${wr}`);
  recSub.value = `Primary Engineering Justification: ${wallAnalysis.bestApproachRecommendation.primaryReason}`;
  recSub.font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF0F172A' } };
  recSub.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
  recSub.alignment = { horizontal: 'left', vertical: 'middle' };
  ws4.getRow(wr).height = 20;
  wr++;

  wallAnalysis.bestApproachRecommendation.rationaleDetails.forEach((rat) => {
    ws4.mergeCells(`A${wr}:G${wr}`);
    const rCell = ws4.getCell(`A${wr}`);
    rCell.value = `• ${rat}`;
    rCell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF334155' } };
    rCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
    rCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws4.getRow(wr).height = 18;
    wr++;
  });

  ws4.mergeCells(`A${wr}:G${wr}`);
  const altCell = ws4.getCell(`A${wr}`);
  altCell.value = `When to use Long Wall - Short Wall Method: ${wallAnalysis.bestApproachRecommendation.whenToUseAlternative}`;
  altCell.font = { name: 'Calibri', size: 9, color: { argb: 'FF64748B' }, italic: true };
  altCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F0FDF4' } };
  altCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
  ws4.getRow(wr).height = 24;

  // Return buffer
  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
