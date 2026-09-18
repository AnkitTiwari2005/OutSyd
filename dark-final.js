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

const authFiles = ['app/(auth)/login/page.tsx', 'app/(auth)/register/page.tsx'];
const authReplacements = [
    [/className="card p-6 space-y-4"/g, 'className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4"'],
    [/style=\{\{ color: '#1e2d4e' \}\}/g, 'className="text-white"'],
    [/<h1 className="text-xl font-bold" className="text-white">/g, '<h1 className="text-xl font-bold text-white">'], // fix double className
    [/className="h-10 w-auto mx-auto"/g, 'className="h-10 w-auto mx-auto brightness-0 invert"'],
    [/bg-red-50 border border-red-200 text-red-700/g, 'bg-red-950/50 border border-red-800/50 text-red-300']
];

for (const file of authFiles) {
    replaceInFile(file, authReplacements);
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('<h1 className="text-xl font-bold" className="text-white">', '<h1 className="text-xl font-bold text-white">');
    fs.writeFileSync(file, content);
}

// Ensure app/estimate/page.tsx doesn't have duplicate className
let estPage = fs.readFileSync('app/estimate/page.tsx', 'utf8');
estPage = estPage.replace('<h1 className="text-2xl font-bold" className="text-white">', '<h1 className="text-2xl font-bold text-white">');
fs.writeFileSync('app/estimate/page.tsx', estPage);
