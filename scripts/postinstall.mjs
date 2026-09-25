// scripts/postinstall.mjs
// Ensures @react-pdf/hyphenate package.json exports include default for CJS/Node interop
import fs from 'node:fs';
import path from 'node:path';

const hyphenatePkgPath = path.join(process.cwd(), 'node_modules', '@react-pdf', 'hyphenate', 'package.json');
if (fs.existsSync(hyphenatePkgPath)) {
  try {
    const raw = fs.readFileSync(hyphenatePkgPath, 'utf8');
    const pkg = JSON.parse(raw);
    if (pkg.exports) {
      if (pkg.exports['.'] && !pkg.exports['.']['default']) {
        pkg.exports['.']['default'] = pkg.exports['.']['import'] || './lib/index.js';
      }
      if (pkg.exports['./*'] && !pkg.exports['./*']['default']) {
        pkg.exports['./*']['default'] = pkg.exports['./*']['import'] || './lib/*.js';
      }
      fs.writeFileSync(hyphenatePkgPath, JSON.stringify(pkg, null, 2));
    }
  } catch (err) {
    console.warn('[postinstall] Note: could not patch @react-pdf/hyphenate:', err.message);
  }
}
