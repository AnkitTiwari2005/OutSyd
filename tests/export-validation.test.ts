import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import ExcelJS from 'exceljs';
import { renderToBuffer } from '@react-pdf/renderer';
import { generateEstimateExcel } from '../lib/excel/report-template';
import { OutsydReportDocument } from '../lib/pdf/report-template';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET } from '../lib/engine/coefficients';
import type { FullInput } from '../lib/engine/types';

const SAMPLE_PROJECT: FullInput = {
  lengthFt: 50,
  breadthFt: 40,
  heightFt: 30,
  plotAreaSqft: 5000,
  numFloors: 3,
  typology: 'Residential',
  buildingUse: '3BHK',
  soilType: 'Normal',
  locationRegion: 'Ludhiana',
  qualityTier: 'Standard',
  structuralSystem: 'RCC_Frame',
  foundationType: 'Isolated',
  numLifts: 0,
  numStaircases: 1,
  parkingLevels: 0,
  unitsPerFloor: 2,
  seismicZone: 'Zone_III',
  soilBearingCapacity: 200,
  windLoadZone: 'Moderate',
  serviceFloors: 0,
  podiumLevels: 0,
  facadeType: 'Conventional',
  fireHvacScope: 'Basic',
  targetTimelineMonths: 24,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

describe('PHASE 17: Export Validation (Real PDF & Excel Generation)', () => {
  const cls = classifyBuilding(SAMPLE_PROJECT);
  const items = runEstimationEngine(SAMPLE_PROJECT, cls, DEFAULT_DATASET, 1.0);
  const estimateResult = aggregateEstimate(items, SAMPLE_PROJECT, cls, DEFAULT_DATASET, 1.0);

  const inputSummary: Record<string, string> = {
    'Dimensions': '50ft × 40ft × 30ft',
    'Floors': '3',
    'Typology': 'Residential — 3BHK',
    'Soil Type': 'Normal',
    'Location': 'Ludhiana',
    'Quality Tier': 'Standard',
    'Structural System': 'RCC Frame',
    'Seismic Zone': 'Zone III',
  };

  it('generates a valid, readable Excel (.xlsx) workbook with 4 structured worksheets', async () => {
    const excelBuffer = await generateEstimateExcel(estimateResult, inputSummary);

    assert.ok(Buffer.isBuffer(excelBuffer), 'Excel output must be a Buffer');
    assert.ok(excelBuffer.length > 5000, `Excel buffer unexpectedly small: ${excelBuffer.length} bytes`);

    // Reload the generated buffer into ExcelJS to parse and verify internal workbook structure
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(excelBuffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

    // Verify expected worksheets
    const summarySheet = workbook.getWorksheet('Summary');
    const boqSheet = workbook.getWorksheet('Full BOQ');
    const labourSheet = workbook.getWorksheet('Labour & Timeline');
    const wallSheet = workbook.getWorksheet('Wall Analysis');

    assert.ok(summarySheet, 'Summary sheet missing');
    assert.ok(boqSheet, 'Full BOQ sheet missing');
    assert.ok(labourSheet, 'Labour & Timeline sheet missing');
    assert.ok(wallSheet, 'Wall Analysis sheet missing');

    // Verify Sheet 1: Summary contents
    const brandCell = summarySheet.getCell('A1').value;
    assert.equal(brandCell, 'OUTSYD', 'Branding header missing in Summary sheet');

    // Verify Sheet 2: BOQ contents
    let boqRowCount = 0;
    boqSheet.eachRow((row) => {
      boqRowCount++;
      // Verify numeric cells are valid
      const amountCell = row.getCell(7).value;
      if (typeof amountCell === 'number') {
        assert.ok(Number.isFinite(amountCell) && amountCell >= 0, `Invalid amount in BOQ row: ${amountCell}`);
      }
    });
    assert.ok(boqRowCount > 50, `Expected > 50 rows in Full BOQ, got ${boqRowCount}`);

    // Verify Sheet 3: Labour & Timeline
    let labourRowCount = 0;
    labourSheet.eachRow(() => {
      labourRowCount++;
    });
    assert.ok(labourRowCount >= 10, `Expected >= 10 rows in Labour sheet, got ${labourRowCount}`);

    // Verify Sheet 4: Wall Analysis
    let wallRowCount = 0;
    wallSheet.eachRow(() => {
      wallRowCount++;
    });
    assert.ok(wallRowCount >= 10, `Expected >= 10 rows in Wall Analysis sheet, got ${wallRowCount}`);
  });

  it('generates a valid, non-empty binary PDF document buffer with standard %PDF header', async () => {
    const pdfBuffer = await (renderToBuffer as unknown as (el: unknown) => Promise<Uint8Array | Buffer>)(
      React.createElement(OutsydReportDocument, {
        result: estimateResult,
        inputSummary,
      })
    );

    const bytes = new Uint8Array(
      Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer as unknown as ArrayBuffer)
    );

    assert.ok(bytes.byteLength > 10000, `PDF unexpectedly small: ${bytes.byteLength} bytes`);

    // Verify PDF magic header bytes: "%PDF-" (0x25, 0x50, 0x44, 0x46, 0x2D)
    assert.equal(bytes[0], 0x25, 'Expected % magic byte');
    assert.equal(bytes[1], 0x50, 'Expected P magic byte');
    assert.equal(bytes[2], 0x44, 'Expected D magic byte');
    assert.equal(bytes[3], 0x46, 'Expected F magic byte');
    assert.equal(bytes[4], 0x2d, 'Expected - magic byte');

    // Verify PDF end of file marker appears in the trailing bytes
    const tailStr = Buffer.from(bytes.slice(-1024)).toString('utf-8');
    assert.ok(tailStr.includes('%%EOF'), 'PDF missing %%EOF marker');
  });
});
