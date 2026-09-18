// lib/pdf/report-template.tsx
// PDF report using @react-pdf/renderer
// FR-7: Branded OUTSYD estimate report

import React from 'react';
import {
  Document, Page, Text, View, StyleSheet,
} from '@react-pdf/renderer';
import type { EstimateResult } from '@/lib/engine/types';

const INR = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

const styles = StyleSheet.create({
  page         : { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1e293b' },
  header       : { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  brand        : { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#f97316' },
  tagline      : { fontSize: 7, color: '#94a3b8', marginTop: 3 },
  title        : { fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  subtitle     : { fontSize: 9, color: '#64748b' },
  bandBox      : { padding: 10, borderRadius: 6, marginBottom: 16 },
  bandGreen    : { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  bandBlue     : { backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  bandAmber    : { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  bandText     : { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  sectionTitle : { fontSize: 11, fontFamily: 'Helvetica-Bold', marginTop: 16, marginBottom: 6, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 4 },
  row          : { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f8fafc' },
  col          : { flex: 1 },
  colRight     : { flex: 1, textAlign: 'right' },
  colNarrow    : { width: 60, textAlign: 'right' },
  thead        : { flexDirection: 'row', backgroundColor: '#f8fafc', paddingVertical: 5, paddingHorizontal: 4, borderRadius: 4 },
  theadText    : { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#64748b' },
  totalRow     : { flexDirection: 'row', paddingVertical: 6, backgroundColor: '#fff7ed', marginTop: 4 },
  disclaimer   : { fontSize: 7, color: '#94a3b8', marginTop: 20, lineHeight: 1.5, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 10 },
  summaryCard  : { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card         : { flex: 1, padding: 10, backgroundColor: '#f8fafc', borderRadius: 6 },
  cardLabel    : { fontSize: 8, color: '#94a3b8' },
  cardValue    : { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginTop: 3 },
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
          <Text style={{ fontSize: 8, marginTop: 3, color: '#475569' }}>
            Classification: Tier {result.classification.tier} — {result.classification.category.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCard}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Material Cost</Text>
            <Text style={styles.cardValue}>{INR(result.grandTotalMaterialCost)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>With Labour (+30%)</Text>
            <Text style={styles.cardValue}>{INR(result.grandTotalWithLabor)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Plinth Area Estimate</Text>
            <Text style={styles.cardValue}>{INR(result.plinthAreaEstimate)}</Text>
          </View>
        </View>

        {/* Input Summary */}
        <Text style={styles.sectionTitle}>Project Details</Text>
        {Object.entries(inputSummary).map(([k, v]) => (
          <View key={k} style={styles.row}>
            <Text style={styles.col}>{k}</Text>
            <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>{v}</Text>
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
              <Text style={styles.colRight}>{INR(cat.subtotal)}</Text>
              <Text style={styles.colNarrow}>{pct}%</Text>
            </View>
          );
        })}
        <View style={styles.totalRow}>
          <Text style={[styles.col, { fontFamily: 'Helvetica-Bold' }]}>Grand Total (Materials)</Text>
          <Text style={[styles.colRight, { fontFamily: 'Helvetica-Bold', color: '#f97316' }]}>{INR(result.grandTotalMaterialCost)}</Text>
          <Text style={styles.colNarrow}></Text>
        </View>
      </Page>

      {/* Page 2 — Line Items */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.brand}>OUTSYD</Text>
        <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Material Line Items</Text>
        <View style={styles.thead}>
          <Text style={[styles.theadText, { flex: 3 }]}>Item</Text>
          <Text style={[styles.theadText, { flex: 2 }]}>Grade</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Qty</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Unit</Text>
          <Text style={[styles.theadText, styles.colNarrow]}>Rate</Text>
          <Text style={[styles.theadText, styles.colRight]}>Amount</Text>
        </View>
        {result.lineItems.map((item) => (
          <View key={item.materialItemCode} style={styles.row}>
            <Text style={{ flex: 3 }}>{item.name}</Text>
            <Text style={{ flex: 2, fontSize: 8, color: '#64748b' }}>{item.recommendedGrade}</Text>
            <Text style={[styles.colNarrow, { fontSize: 8 }]}>{item.quantity.toLocaleString('en-IN')}</Text>
            <Text style={[styles.colNarrow, { fontSize: 8, color: '#94a3b8' }]}>{item.unit}</Text>
            <Text style={[styles.colNarrow, { fontSize: 8 }]}>{INR(item.unitRate)}</Text>
            <Text style={[styles.colRight]}>{INR(item.lineCost)}</Text>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          ⚠ DISCLAIMER: {result.disclaimer}
          {'\n\n'}Coefficient dataset version: {result.coefficientDatasetVersion} · Regional index applied: {result.regionalIndexApplied}×
          {'\n'}Report generated by OUTSYD · Ideated & created by Ankit Kumar Tiwari · {new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}
