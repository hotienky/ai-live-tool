const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pluginsDir = path.join(__dirname, 'backend-laravel/public/plugins');

// 1. Get all routes from artisan
console.log("Loading routes from artisan...");
const routeOutput = execSync('php artisan route:list --path=api --json', { cwd: path.join(__dirname, 'backend-laravel') }).toString();
const definedRoutes = JSON.parse(routeOutput);

// Convert definedRoutes to easily matchable format
// Route paths look like: api/booking/services
// We want them like: /api/booking/services
const validPaths = definedRoutes.map(r => ({
    method: r.method.split('|'), // GET|HEAD
    uri: '/' + r.uri.replace(/\{[^}]+\}/g, '{id}') // /api/booking/services/{id}
}));

// 2. Extract frontend plugin calls
const missing = [];
const plugins = fs.readdirSync(pluginsDir);
for (const p of plugins) {
    const bundlePath = path.join(pluginsDir, p, 'bundle.js');
    if (!fs.existsSync(bundlePath)) continue;
    
    const content = fs.readFileSync(bundlePath, 'utf8');
    const regex = /apiFetch\(\s*(['"`])(.*?)\1(?:.*?method:\s*(['"`])(.*?)\3)?/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        let pStr = match[2];
        pStr = pStr.replace(/['"`]\s*\+\s*[a-zA-Z0-9_.]+\s*\+\s*['"`]/g, '{id}');
        pStr = pStr.replace(/['"`]\s*\+\s*[a-zA-Z0-9_.]+/g, '{id}');
        pStr = pStr.replace(/\$\{.*?\}/g, '{id}');
        pStr = pStr.split('?')[0]; // Remove query string
        
        if (!pStr.startsWith('/')) pStr = '/' + pStr;
        // Frontend API fetch typically prepends '/api' inside useApi.js, but is it '/api/plugin' or what?
        // Wait, useApi.js says apiFetch(url). If url is `/booking/services`, it might become `/api/booking/services`
        let absolutePath = pStr;
        if (!absolutePath.startsWith('/api')) {
             absolutePath = '/api' + absolutePath;
        }
        
        const method = (match[4] || 'GET').toUpperCase();
        
        // Ignore external
        if (absolutePath.includes('://')) continue;
        
        // Validate
        let found = false;
        for (const r of validPaths) {
            if (r.uri === absolutePath || r.uri === absolutePath + 's' || absolutePath === r.uri + 's') { 
                if (r.method.includes(method) || r.method.includes('ANY')) {
                    found = true;
                    break;
                }
            }
        }
        
        if (!found) {
            missing.push(`[${p}] ${method} ${absolutePath}`);
        }
    }
}

const uniqueMissing = [...new Set(missing)];
if (uniqueMissing.length > 0) {
    console.log("--- MISSING OR MISMATCHED ROUTES ---");
    uniqueMissing.forEach(m => console.log(m));
} else {
    console.log("No missing routes found!");
}
