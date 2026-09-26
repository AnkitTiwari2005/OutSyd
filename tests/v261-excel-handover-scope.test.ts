import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { generateEstimateExcel } from '../lib/excel/report-template';
import { renderToBuffer } from '@react-pdf/renderer';
import React from 'react';
import { OutsydReportDocument } from '../lib/pdf/report-template';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import type { FullInput } from '../lib/engine/types';

// Helper mirroring app/api/estimate/[id]/excel/route.ts inputSummary builder
function buildExcelInputSummary(input: FullInput): Record<string, string> {
  const inputSummary: Record<string, string> = {};
  inputSummary['Dimensions']   = `${input.lengthFt}ft × ${input.breadthFt}ft × ${input.heightFt}ft`;
  inputSummary['Floors']       = `${input.numFloors}`;
  inputSummary['Typology']     = `${input.typology} — ${input.buildingUse}`;
  inputSummary['Soil Type']    = input.soilType;
  inputSummary['Location']     = input.locationRegion;
  inputSummary['Quality Tier'] = input.qualityTier;
  if (input.structuralSystem && input.structuralSystem !== 'Not_sure')
    inputSummary['Structural System'] = input.structuralSystem.replace(/_/g, ' ');
  if (input.seismicZone && input.seismicZone !== 'Not_sure')
    inputSummary['Seismic Zone'] = input.seismicZone.replace(/_/g, ' ');

  // Resolve effective Handover Scope for summary display (v2.6.1 specification)
  let effectiveHandoverScope: string | undefined;
  const rawScope = input.handoverScope as string | undefined;
  if (input.typology === 'Commercial') {
    const scope = (rawScope && rawScope !== 'Not_Sure' && rawScope !== 'Not_sure')
      ? rawScope
      : 'Core_Shell';
    effectiveHandoverScope = scope.replace(/_/g, ' ');
  } else if (input.typology === 'Institutional') {
    const scope = (rawScope === 'Bare_Shell' || rawScope === 'Core_Shell' || rawScope === 'Warm_Shell')
      ? rawScope
      : 'Fully_Fitted';
    effectiveHandoverScope = scope.replace(/_/g, ' ');
  } else if (rawScope && rawScope !== 'Not_Sure' && rawScope !== 'Not_sure') {
    effectiveHandoverScope = rawScope.replace(/_/g, ' ');
  }

  if (effectiveHandoverScope) {
    inputSummary['Handover Scope'] = effectiveHandoverScope;
  }
  if (input.plotAreaSqft)
    inputSummary['Built-up Area'] = `${(input.lengthFt * input.breadthFt * input.numFloors).toLocaleString('en-IN')} sqft`;

  return inputSummary;
}

const COMM_OFFICE: FullInput = {
  lengthFt: 80,
  breadthFt: 60,
  heightFt: 44,
  plotAreaSqft: 10000,
  numFloors: 4,
  typology: 'Commercial',
  buildingUse: 'Office',
  soilType: 'Normal',
  locationRegion: 'Bengaluru',
  qualityTier: 'Standard',
  structuralSystem: 'RCC_Frame',
  foundationType: 'Isolated',
  seismicZone: 'Zone_II',
  numLifts: 2,
  numStaircases: 2,
  unitsPerFloor: 1,
  parkingLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 24,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

const INST_SCHOOL: FullInput = {
  ...COMM_OFFICE,
  typology: 'Institutional',
  buildingUse: 'School',
};

describe('v2.6.1 — Excel Export Handover Scope Patch Verification', () => {

  it('1. Excel Sheet 1 contains "Handover Scope" and NOT "Foundation Type"', async () => {
    const cls = classifyBuilding(COMM_OFFICE);
    const items = runEstimationEngine(COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const est = aggregateEstimate(items, COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const summary = buildExcelInputSummary(COMM_OFFICE);

    const buffer = await generateEstimateExcel(est, summary, COMM_OFFICE.numFloors, COMM_OFFICE.typology);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws1 = wb.getWorksheet('Summary')!;

    let foundHandoverScope = false;
    let foundFoundationType = false;
    let handoverScopeValue = '';

    ws1.eachRow((row) => {
      const col1 = row.getCell(1).value?.toString();
      const col2 = row.getCell(2).value?.toString();
      if (col1 === 'Handover Scope') {
        foundHandoverScope = true;
        handoverScopeValue = col2 ?? '';
      }
      if (col1 === 'Foundation Type') {
        foundFoundationType = true;
      }
    });

    assert.ok(foundHandoverScope, 'Sheet 1 must contain "Handover Scope" row');
    assert.equal(foundFoundationType, false, 'Sheet 1 must NOT contain "Foundation Type" as handover field');
    assert.equal(handoverScopeValue, 'Core Shell', 'Commercial default must display "Core Shell"');
  });

  it('2. Commercial: displays correct effective scope for undefined, Not_Sure, and Fully_Fitted', async () => {
    // Case A: undefined -> Core Shell
    const sumUndef = buildExcelInputSummary({ ...COMM_OFFICE, handoverScope: undefined });
    assert.equal(sumUndef['Handover Scope'], 'Core Shell');

    // Case B: Not_Sure -> Core Shell
    const sumNotSure = buildExcelInputSummary({ ...COMM_OFFICE, handoverScope: 'Not_Sure' });
    assert.equal(sumNotSure['Handover Scope'], 'Core Shell');

    // Case C: Fully_Fitted -> Fully Fitted
    const sumFitted = buildExcelInputSummary({ ...COMM_OFFICE, handoverScope: 'Fully_Fitted' });
    assert.equal(sumFitted['Handover Scope'], 'Fully Fitted');

    // Case D: Bare_Shell -> Bare Shell
    const sumBare = buildExcelInputSummary({ ...COMM_OFFICE, handoverScope: 'Bare_Shell' });
    assert.equal(sumBare['Handover Scope'], 'Bare Shell');
  });

  it('3. Institutional: displays correct effective scope for undefined, Not_Sure, and Bare_Shell', async () => {
    // Institutional undefined -> Fully Fitted (public facility default)
    const sumUndef = buildExcelInputSummary({ ...INST_SCHOOL, handoverScope: undefined });
    assert.equal(sumUndef['Handover Scope'], 'Fully Fitted');

    // Institutional Not_Sure -> Fully Fitted
    const sumNotSure = buildExcelInputSummary({ ...INST_SCHOOL, handoverScope: 'Not_Sure' });
    assert.equal(sumNotSure['Handover Scope'], 'Fully Fitted');

    // Institutional Bare_Shell -> Bare Shell
    const sumBare = buildExcelInputSummary({ ...INST_SCHOOL, handoverScope: 'Bare_Shell' });
    assert.equal(sumBare['Handover Scope'], 'Bare Shell');
  });

  it('4. Residential & Industrial: preserve existing behavior (no irrelevant handover scope)', async () => {
    const resi: FullInput = { ...COMM_OFFICE, typology: 'Residential', buildingUse: 'Apartment' };
    const sumResi = buildExcelInputSummary(resi);
    assert.equal(sumResi['Handover Scope'], undefined, 'Residential must not include Handover Scope in summary');

    const ind: FullInput = { ...COMM_OFFICE, typology: 'Industrial', buildingUse: 'Warehouse' };
    const sumInd = buildExcelInputSummary(ind);
    assert.equal(sumInd['Handover Scope'], undefined, 'Industrial must not include Handover Scope in summary');
  });

  it('5. Excel BOQ quantities and grand totals remain identical to engine calculations', async () => {
    const cls = classifyBuilding(COMM_OFFICE);
    const items = runEstimationEngine(COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const est = aggregateEstimate(items, COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const summary = buildExcelInputSummary(COMM_OFFICE);

    const buffer = await generateEstimateExcel(est, summary, COMM_OFFICE.numFloors, COMM_OFFICE.typology);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    const ws2 = wb.getWorksheet('Full BOQ')!;

    // Check that BOQ rows match line items
    let matchedItems = 0;
    ws2.eachRow((row) => {
      const code = row.getCell(1).value?.toString();
      const qty = row.getCell(4).value;
      if (code && typeof qty === 'number') {
        const engineItem = est.lineItems.find(i => i.materialItemCode === code);
        if (engineItem) {
          assert.equal(qty, engineItem.quantity, `Quantity mismatch for ${code}`);
          matchedItems++;
        }
      }
    });

    assert.ok(matchedItems > 50, `Expected > 50 matched items, got ${matchedItems}`);

    // Verify Cost Summary with Labour in Sheet 1 matches est.grandTotalWithLabor
    const ws1 = wb.getWorksheet('Summary')!;
    let laborRowTotal = 0;
    ws1.eachRow((row) => {
      const label = row.getCell(1).value?.toString();
      if (label === 'With Labour (+30%)') {
        laborRowTotal = Number(row.getCell(2).value);
      }
    });
    assert.equal(laborRowTotal, est.grandTotalWithLabor, 'Grand total in Excel must equal engine grandTotalWithLabor');
  });

  it('6. PDF export remains functional and unchanged', async () => {
    const cls = classifyBuilding(COMM_OFFICE);
    const items = runEstimationEngine(COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const est = aggregateEstimate(items, COMM_OFFICE, cls, DEFAULT_DATASET, 1.0);
    const summary = buildExcelInputSummary(COMM_OFFICE);

    const pdfBuffer = await (renderToBuffer as unknown as (el: unknown) => Promise<Uint8Array | Buffer>)(
      React.createElement(OutsydReportDocument, {
        result: est,
        inputSummary: summary,
      })
    );
    assert.ok(Buffer.isBuffer(pdfBuffer));
    assert.ok(pdfBuffer.length > 5000, 'PDF buffer must be valid and non-empty');
  });
});
