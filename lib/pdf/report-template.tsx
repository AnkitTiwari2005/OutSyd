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

function resolveFontPath(filename: string): string | null {
  const candidates = [
    path.join(process.cwd(), 'lib', 'pdf', 'fonts', filename),
    path.join(process.cwd(), 'public', 'fonts', filename),
    path.join(__dirname, 'fonts', filename),
  ];
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) return candidate;
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
  header       : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
  brand        : { fontSize: 18, fontWeight: 'bold', color: '#1e3a5f' },
  tagline      : { fontSize: 7, color: '#64748b', marginTop: 2 },
  title        : { fontSize: 13, fontWeight: 'bold', color: '#0f172a', marginBottom: 2 },
  subtitle     : { fontSize: 8, color: '#64748b' },
  bandBox      : { padding: 8, borderRadius: 4, marginBottom: 14 },
  bandGreen    : { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  bandBlue     : { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  bandAmber    : { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  bandText     : { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f' },
  sectionTitle : { fontSize: 10, fontWeight: 'bold', color: '#1e3a5f', marginTop: 14, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 3 },
  row          : { flexDirection: 'row', paddingVertical: 3.5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  col          : { flex: 1 },
  colRight     : { flex: 1, textAlign: 'right' },
  colNarrow    : { width: 55, textAlign: 'right' },
  thead        : { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 4, paddingHorizontal: 4, borderRadius: 3, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', marginBottom: 4 },
  theadText    : { fontSize: 7.5, fontWeight: 'bold', color: '#475569' },
  totalRow     : { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#eff4fa', marginTop: 6, paddingHorizontal: 6, borderRadius: 3 },
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
}

export function OutsydReportDocument({ result, inputSummary }: Props) {
  const bandStyle =
    result.accuracyBandColor === 'green' ? styles.bandGreen :
    result.accuracyBandColor === 'blue'  ? styles.bandBlue  : styles.bandAmber;

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

        {/* Input Summary */}
        <Text style={styles.sectionTitle}>Project Specifications</Text>
        {Object.entries(inputSummary).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={[styles.col, { color: '#64748b' }]}>{k}</Text>
            <Text style={[styles.col, { fontWeight: 'bold' }]}>{v}</Text>
          </View>
        ))}

        {/* Category Breakdown */}
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
              <Text style={styles.col}>{cat.categoryCode} — {cat.name}</Text>
              <Text style={styles.colRight}>{cat.subtotal > 0 ? INR(cat.subtotal) : '₹0 (N/A)'}</Text>
              <Text style={styles.colNarrow}>{pct}%</Text>
            </View>
          );
        })}
        <View style={styles.totalRow}>
          <Text style={[styles.col, { fontWeight: 'bold' }]}>Grand Total (Materials)</Text>
          <Text style={[styles.colRight, { fontWeight: 'bold', color: '#1e3a5f' }]}>{INR(result.grandTotalMaterialCost)}</Text>
          <Text style={styles.colNarrow}></Text>
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

      {/* ── Page 2+: Detailed Categorized Line Items BOQ ── */}
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
