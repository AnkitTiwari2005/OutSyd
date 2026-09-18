// scripts/fix-coefficients.mjs — removes duplicate keys from coefficients.ts
import fs from 'fs';

const file = 'lib/engine/coefficients.ts';
let content = fs.readFileSync(file, 'utf8');

// Remove 3rd occurrence of 'bhopal' (the duplicate in REGIONAL_RATE_INDEX — keep first two)
// Strategy: find all occurrences and remove duplicates
const lines = content.split('\n');
const seen = new Set();
const deduped = [];
for (const line of lines) {
  // Only deduplicate lines that look like key-value pairs in object literals
  const m = line.match(/^\s+'([^']+)'\s*:/);
  if (m) {
    const key = m[1];
    if (seen.has(key)) {
      console.log(`Removing duplicate: ${line.trim()}`);
      continue;
    }
    seen.add(key);
  }
  deduped.push(line);
}

fs.writeFileSync(file, deduped.join('\n'));
console.log('Done. Duplicates removed.');
