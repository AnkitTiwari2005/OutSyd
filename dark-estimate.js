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

// TASK 3: EstimateFormShell
replaceInFile('app/estimate/_components/EstimateFormShell.tsx', [
    [/bg-white rounded-2xl border border-slate-200/g, 'bg-slate-900 rounded-2xl border border-white/10'],
    [/bg-red-50 border border-red-200 text-red-700/g, 'bg-red-950/50 border border-red-800/50 text-red-300'],
    [/bg-blue-50 text-blue-700 border-blue-200/g, 'bg-blue-950/50 text-blue-300 border-blue-800/50'],
    [/bg-emerald-50 text-emerald-700 border-emerald-200/g, 'bg-emerald-950/50 text-emerald-300 border-emerald-800/50'],
    [/border-slate-100/g, 'border-white/10'],
    [/className="btn-secondary"/g, 'className="btn-secondary border-white/15 bg-white/5 text-slate-300 hover:bg-white/8"'],
    [/text-slate-400 font-medium hidden sm:block/g, 'text-slate-500 font-medium hidden sm:block']
]);

// TASK 4: ProgressStepper
replaceInFile('app/estimate/_components/ProgressStepper.tsx', [
    [/border-slate-100/g, 'border-white/10'],
    [/bg-slate-100/g, 'bg-white/10'],
    [/bg-orange-500 border-orange-500 text-white/g, 'bg-emerald-500 border-emerald-500 text-white'],
    [/bg-white border-orange-500 text-orange-600 shadow-sm shadow-orange-100/g, 'bg-slate-900 border-orange-500 text-orange-400'],
    [/bg-white border-slate-200 text-slate-400/g, 'bg-slate-900 border-slate-700 text-slate-500'],
    [/text-orange-600/g, 'text-orange-400'],
    [/text-slate-500/g, 'text-emerald-500'], // done step label
    [/text-slate-300/g, 'text-slate-500'] // inactive step label text-[11px]
]);
