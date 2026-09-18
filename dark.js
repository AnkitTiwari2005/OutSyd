const fs = require('fs');
const path = require('path');

function replaceInFile(filepath, replacements) {
    if (!fs.existsSync(filepath)) {
        console.error(`File not found: ${filepath}`);
        return;
    }
    let content = fs.readFileSync(filepath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filepath, content);
    console.log(`Updated ${filepath}`);
}

// TASK 1
replaceInFile('app/page.tsx', [
    [/value=\{14\}/g, 'value={18}'],
    [/value=\{116\}/g, 'value={200}'],
    [/value=\{43\}/g, 'value={160}'],
    [/const CATEGORIES = \[[\s\S]*?\];/, `const CATEGORIES = [
  'Substructure & Excavation', 'RCC Superstructure', 'Masonry & Plaster',
  'Waterproofing & Chemical', 'Roofing & False Ceiling', 'Doors & Windows',
  'Electrical & Low-Voltage', 'Plumbing & STP', 'Flooring & Tiling',
  'Wall Finishing & Painting', 'Kitchen & Woodwork', 'Exterior & Cladding',
  'Staircase & Lifts', 'HVAC & Fire Protection', 'Parking & Basement',
  'Pool & Recreation', 'Solar & Green Building', 'Preliminaries & Site'
];`],
    [/All 14 construction categories/g, 'All 18 construction categories'],
    [/14-category/g, '18-category'],
    [/116\+ Line Items/g, '200+ Line Items'],
    [/43 regional/g, '160+ cities'],
    [/43 regional indexes/g, '160+ city indexes'],
    [/43 Rate Indexes/g, '160+ City Indexes'],
    [/14 categories/g, '18 categories'],
    [/116\+ materials/g, '200+ materials']
]);

// TASK 2
replaceInFile('app/estimate/page.tsx', [
    [/bg-slate-50/g, 'bg-slate-950'],
    [/bg-white border-b border-slate-100/g, 'bg-slate-900 border-b border-white/10'],
    [/className="h-8 w-auto"/g, 'className="h-8 w-auto brightness-0 invert"'],
    [/text-slate-400 hover:text-slate-600/g, 'text-slate-400 hover:text-slate-300'],
    [/style=\{\{ color: '#1e2d4e' \}\}/g, 'className="text-white"'],
    [/<h1 className="text-2xl font-bold" className="text-white">/g, '<h1 className="text-2xl font-bold text-white">'] // fix if double className
]);
let estPage = fs.readFileSync('app/estimate/page.tsx', 'utf8');
estPage = estPage.replace('<h1 className="text-2xl font-bold" className="text-white">', '<h1 className="text-2xl font-bold text-white">');
fs.writeFileSync('app/estimate/page.tsx', estPage);

// TASK 3: app/estimate/_components/EstimateFormShell.tsx
replaceInFile('app/estimate/_components/EstimateFormShell.tsx', [
    [/bg-white rounded-2xl border border-slate-200/g, 'bg-slate-900 rounded-2xl border border-white/10'],
    [/bg-red-50 border border-red-200 text-red-700/g, 'bg-red-950/50 border border-red-800/50 text-red-300'],
    [/bg-blue-50 text-blue-700 border-blue-200/g, 'bg-blue-950/50 text-blue-300 border-blue-800/50'], // might be different class
    [/bg-emerald-50 text-emerald-700 border-emerald-200/g, 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'],
    [/border-slate-100/g, 'border-white/10'],
    [/btn-secondary/g, 'btn-secondary border-white/15 bg-white/5 text-slate-300 hover:bg-white/8'], // check exactly how to override inline
    [/text-slate-400/g, 'text-slate-500']
]);

// Let's refine Task 3 replacements by looking at the exact file contents next.
