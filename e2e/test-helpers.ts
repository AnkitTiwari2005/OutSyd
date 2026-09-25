import React from 'react';
import type { Page as PlaywrightPage } from '@playwright/test';
import { runEstimationEngine } from '../lib/engine/estimator';
import { classifyBuilding } from '../lib/engine/classifier';
import { aggregateEstimate } from '../lib/engine/cost-calculator';
import { DEFAULT_DATASET, lookupRegionalIndex } from '../lib/engine/coefficients';
import { generateEstimateExcel } from '../lib/excel/report-template';
import { Document, Page, Text, View, renderToBuffer } from '@react-pdf/renderer';
import type { FullInput, EstimateResult } from '../lib/engine/types';

export const CANONICAL_E2E_INPUT: FullInput = {
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
  targetTimelineMonths: 12,
  greenCertTarget: 'None',
  localRateOverrides: [],
};

export function calculateCanonicalResult(input: FullInput = CANONICAL_E2E_INPUT): {
  result: EstimateResult;
  inputSummary: Record<string, string>;
} {
  const cls = classifyBuilding(input);
  const { index: ri } = lookupRegionalIndex(input.locationRegion);
  const items = runEstimationEngine(input, cls, DEFAULT_DATASET, ri);
  const result = aggregateEstimate(items, input, cls, DEFAULT_DATASET, ri);

  const inputSummary: Record<string, string> = {
    'Dimensions': `${input.lengthFt}ft × ${input.breadthFt}ft × ${input.heightFt}ft`,
    'Floors': `${input.numFloors}`,
    'Typology': `${input.typology} — ${input.buildingUse}`,
    'Soil Type': input.soilType,
    'Location': input.locationRegion,
    'Quality Tier': input.qualityTier,
    'Structural System': input.structuralSystem ?? 'RCC Frame',
    'Seismic Zone': input.seismicZone ?? 'Zone III',
  };

  return { result, inputSummary };
}

export async function fillStep1Canonical(page: PlaywrightPage) {
  // Dimensions
  await page.locator('input[placeholder="e.g. 50"]').fill('50');
  await page.locator('input[placeholder="e.g. 30"]').fill('40');
  await page.locator('input[placeholder="e.g. 35"]').fill('30');
  await page.locator('input[placeholder="e.g. 2400"]').fill('5000');
  await page.locator('input[placeholder="e.g. 3"]').fill('3');

  // Typology & Use
  await page.locator('#typology-card-Residential').click();
  await page.locator('select').selectOption({ label: '3BHK' });

  // Soil Bearing Condition
  await page.locator('button:has-text("Normal / Firm")').click();

  // City / Location
  await page.locator('input[placeholder*="Bengaluru"]').fill('Ludhiana');

  // Quality Tier
  await page.locator('#quality-card-Standard').click();
}

export async function setupEstimateApiRoutes(page: PlaywrightPage) {
  const { result, inputSummary } = calculateCanonicalResult();
  const estimateId = 'est-e2e-cert-999';
  const guestToken = 'guest-tok-cert-999';
  const projectId = 'proj-cert-999';

  // Intercept POST /api/estimate to guarantee fast, deterministic calculation without DB timeouts
  await page.route('**/api/estimate', async (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as Partial<FullInput>;
      const mergedInput: FullInput = { ...CANONICAL_E2E_INPUT, ...body };
      const computed = calculateCanonicalResult(mergedInput);

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          estimateId,
          guestToken,
          projectId,
          ...computed.result,
          regionalIndexNote: 'Regional index applied',
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Intercept PDF export route to deliver real %PDF binary
  await page.route(`**/api/estimate/${estimateId}/report*`, async (route) => {
    const doc = React.createElement(
      Document,
      null,
      React.createElement(
        Page,
        { size: 'A4' },
        React.createElement(
          View,
          null,
          React.createElement(Text, null, 'OUTSYD PRECISION ESTIMATE BOQ REPORT'),
          React.createElement(Text, null, `Project Typology: ${inputSummary['Typology'] ?? 'Residential'}`),
          React.createElement(Text, null, `Location: ${inputSummary['Location'] ?? 'Ludhiana'}`),
          React.createElement(Text, null, `Grand Total: ${result.grandTotalWithLabor}`)
        )
      )
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buffer = await renderToBuffer(doc as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bytes = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer as any);

    await route.fulfill({
      status: 200,
      contentType: 'application/pdf',
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OUTSYD-BOQ-${estimateId.slice(0, 8)}.pdf"`,
      },
      body: bytes,
    });
  });

  // Intercept Excel export route to deliver real .xlsx binary with 4 sheets
  await page.route(`**/api/estimate/${estimateId}/excel*`, async (route) => {
    const excelBuffer = await generateEstimateExcel(result, inputSummary);

    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="OUTSYD-BOQ-${estimateId.slice(0, 8)}.xlsx"`,
      },
      body: excelBuffer,
    });
  });

  return { estimateId, guestToken, projectId, result, inputSummary };
}
