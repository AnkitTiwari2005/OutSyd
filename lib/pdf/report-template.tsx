// lib/pdf/report-template.tsx
// PDF report using @react-pdf/renderer
// FR-7: Branded OUTSYD estimate report

import React from 'react';
import fs from 'fs';
import path from 'path';
import {
  Document, Page, Text, View, StyleSheet, Font,
} from '@react-pdf/renderer';
import type { EstimateResult } from '@/lib/engine/types';
import { calculateWallAnalysis } from '@/lib/engine';

function resolveFontPath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'lib', 'pdf', 'fonts', filename),
    path.join(process.cwd(), 'public', 'fonts', filename),
    path.join(__dirname, 'fonts', filename),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return null;
}

const regularFont = resolveFontPath('NotoSans-Regular.ttf');
const boldFont = resolveFontPath('NotoSans-Bold.ttf');
const hasUnicodeFont = Boolean(regularFont && boldFont);

if (hasUnicodeFont) {
  try {
    Font.register({
      family: 'Noto Sans',
      fonts: [
        { src: regularFont!, fontWeight: 'normal' },
        { src: boldFont!, fontWeight: 'bold' },
      ],
    });
  } catch (err) {
    console.warn('[PDF] Failed to register Noto Sans, falling back to Helvetica:', err);
  }
}

const fontName = hasUnicodeFont ? 'Noto Sans' : 'Helvetica';

const INR = (n: number) =>
  hasUnicodeFont
    ? `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
    : `Rs. ${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const styles = StyleSheet.create({
  page         : { padding: 36, paddingBottom: 48, fontFamily: fontName, fontSize: 9, color: '#0f172a' },
  header       : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  brand        : { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f' },
  tagline      : { fontSize: 7, color: '#64748b', marginTop: 2 },
  title        : { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  subtitle     : { fontSize: 8, color: '#64748b' },
  bandBox      : { padding: 6, borderRadius: 4, marginBottom: 10 },
  bandGreen    : { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  bandBlue     : { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  bandAmber    : { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  bandText     : { fontSize: 9.5, fontWeight: 'bold', color: '#1e3a5f' },
  sectionTitle : { fontSize: 9.5, fontWeight: 'bold', color: '#1e3a5f', marginTop: 6, marginBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 2 },
  row          : { flexDirection: 'row', paddingVertical: 2.2, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  col          : { flex: 1 },
  colRight     : { flex: 1, textAlign: 'right' },
  colNarrow    : { width: 45, textAlign: 'right' },
  thead        : { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 2.5, paddingHorizontal: 3, borderRadius: 3, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 2 },
  theadText    : { fontSize: 7, fontWeight: 'bold', color: '#475569' },
  totalRow     : { flexDirection: 'row', paddingVertical: 4, backgroundColor: '#eff4fa', marginTop: 4, paddingHorizontal: 4, borderRadius: 3 },
  disclaimer   : { fontSize: 6.5, color: '#64748b', marginTop: 16, lineHeight: 1.4, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8 },
  summaryCard  : { flexDirection: 'row', gap: 8, marginBottom: 14 },
  card         : { flex: 1, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  cardLabel    : { fontSize: 7.5, color: '#64748b' },
  cardValue    : { fontSize: 12, fontWeight: 'bold', color: '#0f172a', marginTop: 2 },
  catHeaderRow : {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#eff4fa',
    paddingVertical: 3.5,
    paddingHorizontal: 6,
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 2,
    borderLeftWidth: 3,
    borderLeftColor: '#1e3a5f',
  },
  catHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  catHeaderSubtotal: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#1e3a5f',
  },
  pageFooter   : {
    position: 'absolute',
    bottom: 18,
    left: 36,
    right: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
  },
  pageFooterText: {
    fontSize: 7,
    color: '#94a3b8',
  },
});

interface Props {
  result  : EstimateResult;
  inputSummary: Record<string, string>;
  rawInput?: {
    lengthFt: number;
    breadthFt: number;
    heightFt: number;
    numFloors: number;
  };
}

export function OutsydReportDocument({ result, inputSummary, rawInput }: Props) {
  const bandStyle =
    result.accuracyBandColor === 'green' ? styles.bandGreen :
    result.accuracyBandColor === 'blue'  ? styles.bandBlue  : styles.bandAmber;

  // Extract dimensions for wall quantity takeoff analysis
  const cat03 = result.categoryTotals.find((c) => c.categoryCode === 'CAT_03')?.subtotal ?? 0;
  let lengthFt = 40;
  let breadthFt = 30;
  let heightFt = 20;
  let numFloors = 2;

  if (rawInput) {
    lengthFt = rawInput.lengthFt;
    breadthFt = rawInput.breadthFt;
    heightFt = rawInput.heightFt;
    numFloors = rawInput.numFloors;
  } else if (inputSummary['Dimensions']) {
    const m = inputSummary['Dimensions'].match(/(\d+(\.\d+)?)\s*ft\s*[×x]\s*(\d+(\.\d+)?)\s*ft\s*[×x]\s*(\d+(\.\d+)?)\s*ft/i);
    if (m) {
      lengthFt = parseFloat(m[1]);
      breadthFt = parseFloat(m[3]);
      heightFt = parseFloat(m[5]);
    }
    if (inputSummary['Floors']) {
      const fl = parseInt(inputSummary['Floors'], 10);
      if (!isNaN(fl) && fl > 0) numFloors = fl;
    }
  }

  const wallAnalysis = calculateWallAnalysis(
    {
      lengthFt,
      breadthFt,
      heightFt,
      numFloors,
      typology: inputSummary['Typology']?.split(' — ')[0] || 'Residential',
    },
    cat03,
  );

  return (
    <Document title="OUTSYD Estimate Report" author="OUTSYD — Ankit Kumar Tiwari">
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>OUTSYD</Text>
            <Text style={styles.tagline}>Outside · User-focused · Technology for · Smart · Yield-based · Design Estimation</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.title}>Construction Cost Estimate</Text>
            <Text style={styles.subtitle}>Generated: {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            <Text style={styles.subtitle}>Dataset: {result.coefficientDatasetVersion}</Text>
          </View>
        </View>

        {/* Accuracy Band */}
        <View style={[styles.bandBox, bandStyle]}>
          <Text style={styles.bandText}>{result.accuracyBandDisplay}</Text>
          <Text style={{ fontSize: 7.5, marginTop: 2, color: '#475569' }}>
            Classification: Tier {result.classification.tier} — {result.classification.category.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCard}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Material Cost (Direct)</Text>
            <Text style={styles.cardValue}>{INR(result.grandTotalMaterialCost)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>With Labour (+30%)</Text>
            <Text style={styles.cardValue}>{INR(result.grandTotalWithLabor)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Plinth Area Benchmark</Text>
            <Text style={styles.cardValue}>{INR(result.plinthAreaEstimate)}</Text>
          </View>
        </View>

        {/* Two-Column Section: Project Specs (Left) & Category Breakdown (Right) */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
          {/* Left Column: Specifications */}
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>Project Specifications</Text>
            {Object.entries(inputSummary).map(([k, v]) => (
              <View key={k} style={styles.row}>
                <Text style={[styles.col, { color: '#64748b', fontSize: 7.5 }]}>{k}</Text>
                <Text style={[{ flex: 1.1, textAlign: 'right', fontWeight: 'bold', fontSize: 7.5 }]}>{v}</Text>
              </View>
            ))}
          </View>

          {/* Right Column: Category Breakdown */}
          <View style={{ flex: 1.35 }}>
            <Text style={styles.sectionTitle}>Category-wise Breakdown</Text>
            <View style={styles.thead}>
              <Text style={[styles.theadText, styles.col]}>Category</Text>
              <Text style={[styles.theadText, styles.colRight]}>Amount</Text>
              <Text style={[styles.theadText, styles.colNarrow]}>%</Text>
            </View>
            {result.categoryTotals.map((cat) => {
              const pct = result.grandTotalMaterialCost > 0
                ? ((cat.subtotal / result.grandTotalMaterialCost) * 100).toFixed(1)
                : '0.0';
              return (
                <View key={cat.categoryCode} style={styles.row}>
                  <Text style={[styles.col, { fontSize: 7 }]}>{cat.categoryCode} — {cat.name.split(' / ')[0]}</Text>
                  <Text style={[styles.colRight, { fontSize: 7 }]}>{cat.subtotal > 0 ? INR(cat.subtotal) : '₹0'}</Text>
                  <Text style={[styles.colNarrow, { fontSize: 7 }]}>{pct}%</Text>
                </View>
              );
            })}
            <View style={styles.totalRow}>
              <Text style={[styles.col, { fontWeight: 'bold', fontSize: 7.5 }]}>Grand Total (Mat)</Text>
              <Text style={[styles.colRight, { fontWeight: 'bold', color: '#1e3a5f', fontSize: 7.5 }]}>{INR(result.grandTotalMaterialCost)}</Text>
              <Text style={styles.colNarrow}></Text>
            </View>
          </View>
        </View>

        {/* Page 1 Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>OUTSYD Construction Cost & BOQ Report</Text>
          <Text
            style={styles.pageFooterText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* ── Page 2: Wall Quantity Survey & Method Analysis (IS 1200 / CPWD) ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>OUTSYD</Text>
            <Text style={styles.tagline}>Wall Quantity Survey & Method Analysis (IS 1200 / CPWD DSR)</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.subtitle}>Superstructure Masonry & Enclosure</Text>
            <Text style={styles.subtitle}>Method Comparison & Reconciliation</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 2 }]}>
          Superstructure Wall Takeoff & Per-Wall Costing
        </Text>
        <Text style={{ fontSize: 7, color: '#64748b', marginBottom: 8, lineHeight: 1.3 }}>
          Comparative engineering takeoff using classical Indian quantity surveying methods.
          Nominal envelope wall thickness: {wallAnalysis.inputs.wallThicknessMm}mm ({wallAnalysis.inputs.wallThicknessFt} ft / 9 in.) · Clear floor height: {wallAnalysis.inputs.floorHeightFt} ft.
        </Text>

        {/* Dimension & Rate Summary Cards */}
        <View style={styles.summaryCard}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Centerline Perimeter</Text>
            <Text style={styles.cardValue}>{wallAnalysis.centerToCenter.totalCenterLinePerFloorFt} ft</Text>
            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
              Total: {wallAnalysis.centerToCenter.totalCenterLineAllFloorsFt} RFT across {wallAnalysis.inputs.numFloors} floor(s)
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Wall Area</Text>
            <Text style={styles.cardValue}>{wallAnalysis.reconciliation.totalWallAreaSqft.toLocaleString('en-IN')} sqft</Text>
            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
              Gross surface face area
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Linear Rate (Material)</Text>
            <Text style={styles.cardValue}>{INR(wallAnalysis.rates.materialCostPerRft)} / RFT</Text>
            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
              Turnkey (+30%): {INR(wallAnalysis.rates.turnkeyCostPerRft)} / RFT
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Total Masonry Cost</Text>
            <Text style={styles.cardValue}>{INR(wallAnalysis.totalWallMaterialCost)}</Text>
            <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 2 }}>
              Turnkey: {INR(wallAnalysis.totalWallTurnkeyCost)}
            </Text>
          </View>
        </View>

        {/* Method 1: Long Wall - Short Wall Method */}
        <Text style={[styles.sectionTitle, { marginTop: 6 }]}>
          1. Long Wall - Short Wall Method (Separate Wall Method)
        </Text>
        <Text style={{ fontSize: 6.8, color: '#64748b', marginBottom: 4 }}>
          {wallAnalysis.longShortWallMethod.description}
        </Text>

        <View style={styles.thead}>
          <Text style={[styles.theadText, { flex: 2 }]}>Wall Orientation</Text>
          <Text style={[styles.theadText, { flex: 1.6 }]}>Measurement Rule</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Length (ft)</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Walls/Flr</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Cost/Wall (Mat)</Text>
          <Text style={[styles.theadText, styles.colRight]}>Cost/Wall (Turnkey)</Text>
        </View>

        <View style={styles.row}>
          <Text style={[{ flex: 2 }, { fontWeight: 'bold' }]}>Long Wall (Lengthwise)</Text>
          <Text style={[{ flex: 1.6 }, { color: '#64748b', fontSize: 7.5 }]}>Out-to-out (c/c + T)</Text>
          <Text style={styles.colNarrow}>{wallAnalysis.longShortWallMethod.longWallLengthFt} ft</Text>
          <Text style={styles.colNarrow}>2 walls</Text>
          <Text style={styles.colNarrow}>{INR(wallAnalysis.longShortWallMethod.costPerLongWallMat)}</Text>
          <Text style={[styles.colRight, { fontWeight: 'bold' }]}>{INR(wallAnalysis.longShortWallMethod.costPerLongWallTurnkey)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={[{ flex: 2 }, { fontWeight: 'bold' }]}>Short Wall (Crosswise)</Text>
          <Text style={[{ flex: 1.6 }, { color: '#64748b', fontSize: 7.5 }]}>In-to-in (c/c - T)</Text>
          <Text style={styles.colNarrow}>{wallAnalysis.longShortWallMethod.shortWallLengthFt} ft</Text>
          <Text style={styles.colNarrow}>2 walls</Text>
          <Text style={styles.colNarrow}>{INR(wallAnalysis.longShortWallMethod.costPerShortWallMat)}</Text>
          <Text style={[styles.colRight, { fontWeight: 'bold' }]}>{INR(wallAnalysis.longShortWallMethod.costPerShortWallTurnkey)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={[{ flex: 3.6 }, { fontWeight: 'bold' }]}>
            Total ({wallAnalysis.inputs.numFloors * 4} envelope walls across {wallAnalysis.inputs.numFloors} floor(s))
          </Text>
          <Text style={[styles.colNarrow, { fontWeight: 'bold' }]}>
            {wallAnalysis.longShortWallMethod.totalRunningLengthFt} RFT
          </Text>
          <Text style={[styles.colNarrow, { fontWeight: 'bold' }]}>
            {INR(wallAnalysis.longShortWallMethod.totalCostMat)}
          </Text>
          <Text style={[styles.colRight, { fontWeight: 'bold', color: '#1e3a5f' }]}>
            {INR(wallAnalysis.longShortWallMethod.totalCostTurnkey)}
          </Text>
        </View>

        {/* Method 2: Center Line Method */}
        <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
          2. Center Line Method (Continuous Centerline Axis)
        </Text>
        <Text style={{ fontSize: 6.8, color: '#64748b', marginBottom: 4 }}>
          {wallAnalysis.centerLineMethod.description}
        </Text>

        <View style={styles.thead}>
          <Text style={[styles.theadText, { flex: 2 }]}>Wall Axis</Text>
          <Text style={[styles.theadText, { flex: 1.6 }]}>Centerline Dimension</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Length (ft)</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Axes/Flr</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Cost/Axis (Mat)</Text>
          <Text style={[styles.theadText, styles.colRight]}>Cost/Axis (Turnkey)</Text>
        </View>

        <View style={styles.row}>
          <Text style={[{ flex: 2 }, { fontWeight: 'bold' }]}>Long Wall Axis</Text>
          <Text style={[{ flex: 1.6 }, { color: '#64748b', fontSize: 7.5 }]}>L_cc = L - T</Text>
          <Text style={styles.colNarrow}>{wallAnalysis.centerToCenter.lengthCcFt} ft</Text>
          <Text style={styles.colNarrow}>2 axes</Text>
          <Text style={styles.colNarrow}>{INR(wallAnalysis.centerLineMethod.costPerLongWallMat)}</Text>
          <Text style={[styles.colRight, { fontWeight: 'bold' }]}>{INR(wallAnalysis.centerLineMethod.costPerLongWallTurnkey)}</Text>
        </View>

        <View style={styles.row}>
          <Text style={[{ flex: 2 }, { fontWeight: 'bold' }]}>Short Wall Axis</Text>
          <Text style={[{ flex: 1.6 }, { color: '#64748b', fontSize: 7.5 }]}>B_cc = B - T</Text>
          <Text style={styles.colNarrow}>{wallAnalysis.centerToCenter.breadthCcFt} ft</Text>
          <Text style={styles.colNarrow}>2 axes</Text>
          <Text style={styles.colNarrow}>{INR(wallAnalysis.centerLineMethod.costPerShortWallMat)}</Text>
          <Text style={[styles.colRight, { fontWeight: 'bold' }]}>{INR(wallAnalysis.centerLineMethod.costPerShortWallTurnkey)}</Text>
        </View>

        <View style={styles.totalRow}>
          <Text style={[{ flex: 3.6 }, { fontWeight: 'bold' }]}>
            Total Centerline Takeoff (2 × [L_cc + B_cc] × {wallAnalysis.inputs.numFloors} floors)
          </Text>
          <Text style={[styles.colNarrow, { fontWeight: 'bold' }]}>
            {wallAnalysis.centerLineMethod.totalRunningLengthFt} RFT
          </Text>
          <Text style={[styles.colNarrow, { fontWeight: 'bold' }]}>
            {INR(wallAnalysis.centerLineMethod.totalCostMat)}
          </Text>
          <Text style={[styles.colRight, { fontWeight: 'bold', color: '#1e3a5f' }]}>
            {INR(wallAnalysis.centerLineMethod.totalCostTurnkey)}
          </Text>
        </View>

        {/* Best Approach Recommendation Box */}
        <View style={[styles.bandBox, styles.bandBlue, { marginTop: 10, padding: 7 }]}>
          <Text style={[styles.bandText, { color: '#1e3a5f', fontSize: 8.5 }]}>
            ★ BEST APPROACH RECOMMENDATION: {wallAnalysis.bestApproachRecommendation.verdictTitle}
          </Text>
          <Text style={{ fontSize: 7.5, color: '#1e293b', marginTop: 2.5, fontWeight: 'bold' }}>
            {wallAnalysis.bestApproachRecommendation.primaryReason}
          </Text>
          {wallAnalysis.bestApproachRecommendation.rationaleDetails.map((detail, idx) => (
            <Text key={idx} style={{ fontSize: 6.8, color: '#334155', marginTop: 1.5 }}>
              • {detail}
            </Text>
          ))}
          <Text style={{ fontSize: 6.5, color: '#64748b', marginTop: 3.5 }}>
            {wallAnalysis.bestApproachRecommendation.whenToUseAlternative}
          </Text>
        </View>

        {/* Page 2 Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>OUTSYD Construction Cost & BOQ Report</Text>
          <Text
            style={styles.pageFooterText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* ── Page 3+: Detailed Categorized Line Items BOQ ── */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.brand}>OUTSYD</Text>
            <Text style={styles.tagline}>Detailed Bill of Quantities (BOQ)</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={styles.subtitle}>Tier {result.classification.tier} · {result.classification.category.replace(/_/g, ' ')}</Text>
            <Text style={styles.subtitle}>{result.accuracyBandDisplay}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 4 }]}>Itemized Material Takeoff</Text>

        {/* Fixed Column Headers Repeating on Every Page */}
        <View style={styles.thead} fixed>
          <Text style={[styles.theadText, { flex: 3 }]}>Item Description</Text>
          <Text style={[styles.theadText, { flex: 2 }]}>Grade / Specification</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Quantity</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Unit</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Rate</Text>
          <Text style={[styles.theadText, styles.colRight]}>Amount</Text>
        </View>

        {/* Grouped by Category with Subtotals */}
        {result.categoryTotals.map((cat) => {
          const items = result.lineItems.filter((item) => item.categoryCode === cat.categoryCode);
          if (items.length === 0 && cat.subtotal === 0) return null;

          return (
            <View key={cat.categoryCode} style={{ marginBottom: 4 }}>
              {/* Category Group Header */}
              <View style={styles.catHeaderRow}>
                <Text style={styles.catHeaderText}>
                  {cat.categoryCode} — {cat.name}
                </Text>
                <Text style={styles.catHeaderSubtotal}>
                  Subtotal: {INR(cat.subtotal)}
                </Text>
              </View>

              {/* Line Items */}
              {items.map((item) => (
                <View key={item.materialItemCode} style={styles.row}>
                  <Text style={{ flex: 3, fontSize: 8 }}>{item.name}</Text>
                  <Text style={{ flex: 2, fontSize: 7.5, color: '#64748b' }}>{item.recommendedGrade}</Text>
                  <Text style={[styles.colNarrow, { fontSize: 8 }]}>{item.quantity.toLocaleString('en-IN')}</Text>
                  <Text style={[styles.colNarrow, { fontSize: 7.5, color: '#64748b' }]}>{item.unit}</Text>
                  <Text style={[styles.colNarrow, { fontSize: 8 }]}>{INR(item.unitRate)}</Text>
                  <Text style={[styles.colRight, { fontSize: 8, fontWeight: 'bold' }]}>{INR(item.lineCost)}</Text>
                </View>
              ))}
            </View>
          );
        })}

        {/* Disclaimer */}
        <Text style={styles.disclaimer}>
          ⚠ DISCLAIMER: {result.disclaimer}
          {'\n\n'}Coefficient dataset version: {result.coefficientDatasetVersion} · Regional index applied: {result.regionalIndexApplied}×
          {'\n'}Report generated by OUTSYD · Ideated & created by Ankit Kumar Tiwari · {new Date().getFullYear()}
        </Text>

        {/* Page 2+ Footer */}
        <View style={styles.pageFooter} fixed>
          <Text style={styles.pageFooterText}>OUTSYD Construction Cost & BOQ Report</Text>
          <Text
            style={styles.pageFooterText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
