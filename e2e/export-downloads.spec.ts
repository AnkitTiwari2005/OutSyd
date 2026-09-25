import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { setupEstimateApiRoutes, fillStep1Canonical } from './test-helpers';

test.describe('E2E: Real Browser Binary Exports (PDF & Excel)', () => {
  test.beforeEach(async ({ page }) => {
    await setupEstimateApiRoutes(page);
  });

  test('Real browser PDF download validates binary %PDF- magic bytes and %%EOF footer', async ({ page }) => {
    await page.goto('/estimate');

    // Fill canonical inputs to advance to results
    await fillStep1Canonical(page);

    await page.locator('button[type="submit"]:has-text("Continue")').click();
    await page.locator('button[type="submit"]:has-text("Continue")').click();
    await page.locator('button[type="submit"]:has-text("Calculate Estimate")').click();

    await page.waitForURL('**/estimate/result');

    // Locate PDF BOQ download button
    const pdfBtn = page.locator('button:has-text("PDF BOQ")').first();
    await expect(pdfBtn).toBeVisible();

    // Trigger download and intercept event
    const downloadPromise = page.waitForEvent('download');
    await pdfBtn.click();
    const download = await downloadPromise;

    // Read download stream into buffer
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);

    // Validate PDF binary structure
    expect(pdfBuffer.length).toBeGreaterThan(1000);
    const header = pdfBuffer.toString('ascii', 0, 5);
    expect(header).toBe('%PDF-');

    const tail = pdfBuffer.toString('ascii', Math.max(0, pdfBuffer.length - 2048));
    expect(tail).toContain('%%EOF');
  });

  test('Real browser Excel download validates all 4 worksheets and workbook structure', async ({ page }) => {
    await page.goto('/estimate');

    // Fill canonical inputs to advance to results
    await fillStep1Canonical(page);

    await page.locator('button[type="submit"]:has-text("Continue")').click();
    await page.locator('button[type="submit"]:has-text("Continue")').click();
    await page.locator('button[type="submit"]:has-text("Calculate Estimate")').click();

    await page.waitForURL('**/estimate/result');

    // Locate Excel download button
    const excelBtn = page.locator('button:has-text("Excel")').first();
    await expect(excelBtn).toBeVisible();

    // Trigger download and intercept event
    const downloadPromise = page.waitForEvent('download');
    await excelBtn.click();
    const download = await downloadPromise;

    // Read download stream into buffer
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const excelBuffer = Buffer.concat(chunks);

    // Load with ExcelJS
    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(excelBuffer as any);

    // Validate worksheet existence
    const sheetNames = workbook.worksheets.map((ws) => ws.name);
    expect(sheetNames).toContain('Summary');
    expect(sheetNames).toContain('Full BOQ');
    expect(sheetNames).toContain('Labour & Timeline');
    expect(sheetNames).toContain('Wall Analysis');

    // Validate Summary sheet branding
    const summarySheet = workbook.getWorksheet('Summary');
    expect(summarySheet).toBeDefined();
    const brandingCell = summarySheet?.getCell('A1').value;
    expect(brandingCell).toBe('OUTSYD');
  });
});
