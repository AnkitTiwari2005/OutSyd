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

const stepFiles = [
    'app/estimate/_components/Step1Basics.tsx',
    'app/estimate/_components/Step2Building.tsx',
    'app/estimate/_components/Step3Advanced.tsx',
    'app/estimate/_components/Step4Review.tsx'
];

const generalReplacements = [
    [/className="form-input/g, 'className="w-full rounded-xl border border-white/15 bg-slate-800/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400 transition-all duration-150'],
    [/text-slate-800/g, 'text-white'],
    [/text-slate-700/g, 'text-slate-200'],
    [/text-slate-600/g, 'text-slate-400'],
    [/border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50/g, 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/10'],
    [/bg-orange-50 text-orange-700/g, 'bg-orange-500/10 text-orange-400'],
    [/has-\[:checked\]:bg-orange-50/g, 'has-[:checked]:bg-orange-500/10'],
    [/bg-orange-50/g, 'bg-orange-500/10'],
    [/bg-blue-50/g, 'bg-blue-950/50'],
    [/bg-emerald-50/g, 'bg-emerald-950/50'],
    [/border-orange-100/g, 'border-orange-500/20'],
    [/border-blue-100/g, 'border-blue-500/20'],
    [/border-emerald-100/g, 'border-emerald-500/20'],
    [/text-orange-600/g, 'text-orange-400'],
    [/bg-slate-50/g, 'bg-slate-800/80'],
    [/border-slate-200/g, 'border-white/10'],
    [/hover:border-slate-300/g, 'hover:border-white/20'],
    [/text-slate-500/g, 'text-slate-500'], // wait, instructions say section-title labels text-slate-500. It's already 500 or maybe I shouldn't touch it. I'll just leave it.
];

for (const file of stepFiles) {
    replaceInFile(file, generalReplacements);
}

// And run the missing ones:
// dark.js, dark-estimate.js
// I'll just run them here.
require('./dark.js');
require('./dark-estimate.js');
