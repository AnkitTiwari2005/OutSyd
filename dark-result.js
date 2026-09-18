const fs = require('fs');

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

// TASK 6: app/estimate/result/page.tsx
replaceInFile('app/estimate/result/page.tsx', [
    [/min-h-screen bg-slate-50/g, 'min-h-screen bg-slate-950'],
    [/bg-white border-b border-slate-200/g, 'bg-slate-900 border-b border-white/10'], // top nav
    [/bg-white rounded-2xl border border-slate-200/g, 'bg-slate-900 rounded-2xl border border-white/10'], // SectionCard, CollapseSection, save dialog
    [/bg-white rounded-xl border border-slate-200/g, 'bg-slate-900 rounded-xl border border-white/10'], // CategorySection
    [/bg-slate-50\/70/g, 'bg-white/5'], // hover state
    [/bg-slate-50\/60/g, 'bg-white/5'], // hover state table row
    [/border-slate-100/g, 'border-white/10'],
    [/border-slate-200/g, 'border-white/10'],
    [/bg-slate-50/g, 'bg-slate-900'], // various backgrounds including table head, CategorySection fallback
    [/bg-white\/95/g, 'bg-slate-950/95'], // sticky nav
    [/bg-white/g, 'bg-slate-900'], // tooltip, summary cards background
    [/text-slate-900/g, 'text-white'],
    [/text-slate-800/g, 'text-white'],
    [/text-slate-700/g, 'text-slate-200'],
    [/text-slate-600/g, 'text-slate-300'],
    [/text-slate-500/g, 'text-slate-400'],
    [/text-slate-400/g, 'text-slate-500'], // flip the lighter ones
    [/h-1.5 bg-slate-100/g, 'h-1.5 bg-white/8'], // category bars track
    [/bg-slate-100/g, 'bg-white/10'], // chips background
    [/border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/g, 'border border-white/15 bg-slate-800/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 text-white placeholder:text-slate-500 transition-all'],
    [/text-orange-700/g, 'text-orange-400'],
    [/bg-orange-100/g, 'bg-orange-500/20'],
    [/bg-orange-50/g, 'bg-orange-500/10'],
    [/border-orange-200/g, 'border-orange-500/20'],
    [/text-emerald-800/g, 'text-emerald-300'],
    [/text-emerald-700/g, 'text-emerald-400'],
    [/bg-emerald-50/g, 'bg-emerald-500/10'],
    [/border-emerald-200/g, 'border-emerald-500/20']
]);

// TASK 7: auth pages
const authFiles = ['app/(auth)/login/page.tsx', 'app/(auth)/register/page.tsx'];
const authReplacements = [
    [/min-h-screen bg-slate-50/g, 'min-h-screen bg-slate-950'],
    [/bg-white p-8 rounded-3xl shadow-xl border border-slate-100/g, 'bg-slate-900 p-8 rounded-3xl shadow-2xl border border-white/10'],
    [/bg-white rounded-3xl shadow-xl border border-slate-100/g, 'bg-slate-900 rounded-3xl shadow-2xl border border-white/10'],
    [/text-slate-900/g, 'text-white'],
    [/text-slate-800/g, 'text-white'],
    [/text-slate-700/g, 'text-slate-300'], // labels
    [/text-slate-600/g, 'text-slate-300'],
    [/text-slate-500/g, 'text-slate-400'],
    [/className="form-input/g, 'className="w-full rounded-xl border border-white/15 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all duration-150'],
    [/text-orange-600 hover:text-orange-700/g, 'text-orange-400 hover:text-orange-300'],
    [/className="h-8 w-auto/g, 'className="h-8 w-auto brightness-0 invert']
];
for (const file of authFiles) {
    replaceInFile(file, authReplacements);
}

// TASK 8: dashboard
const dashReplacements = [
    [/min-h-screen bg-slate-50/g, 'min-h-screen bg-slate-950'],
    [/bg-white rounded-2xl border border-slate-200/g, 'bg-slate-900 rounded-2xl border border-white/10'],
    [/bg-white border-b border-slate-100/g, 'bg-slate-900 border-b border-white/10'],
    [/border-slate-100/g, 'border-white/10'],
    [/border-slate-200/g, 'border-white/10'],
    [/bg-slate-50/g, 'bg-white/5'], // hover table row, table head
    [/text-slate-900/g, 'text-white'],
    [/text-slate-800/g, 'text-white'],
    [/text-slate-700/g, 'text-slate-200'],
    [/text-slate-600/g, 'text-slate-300'],
    [/text-slate-500/g, 'text-slate-400'],
    [/text-slate-400/g, 'text-slate-500'],
    [/className="h-7 w-auto"/g, 'className="h-7 w-auto brightness-0 invert"']
];
replaceInFile('app/dashboard/page.tsx', dashReplacements);
