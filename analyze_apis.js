const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, 'backend-laravel');
const pluginsDir = path.join(baseDir, 'public', 'plugins');
const routesDir = path.join(baseDir, 'routes', 'tenantModules');

function extractApiCalls() {
    const apiCalls = [];
    const plugins = fs.readdirSync(pluginsDir);
    for (const p of plugins) {
        const bundlePath = path.join(pluginsDir, p, 'bundle.js');
        if (!fs.existsSync(bundlePath)) continue;
        
        const content = fs.readFileSync(bundlePath, 'utf8');
        // Match apiFetch('...', { method: '...' })
        const regex = /apiFetch\(\s*(['"`])(.*?)\1(?:.*?method:\s*(['"`])(.*?)\3)?/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            let pStr = match[2];
            // Normalize path, replacing concatenated vars
            pStr = pStr.replace(/['"`]\s*\+\s*[a-zA-Z0-9_.]+\s*\+\s*['"`]/g, '{id}');
            pStr = pStr.replace(/['"`]\s*\+\s*[a-zA-Z0-9_.]+/g, '{id}');
            pStr = pStr.replace(/\$\{.*?\}/g, '{id}');
            
            pStr = pStr.split('?')[0]; // Remove query strings
            
            if (!pStr.startsWith('/')) pStr = '/' + pStr;
            
            apiCalls.push({
                plugin: p,
                path: pStr,
                method: (match[4] || 'GET').toUpperCase()
            });
        }
    }
    return apiCalls;
}

function extractRoutes() {
    const routes = [];
    const routeFiles = fs.readdirSync(routesDir);
    for (const file of routeFiles) {
        if (!file.endsWith('.php')) continue;
        const content = fs.readFileSync(path.join(routesDir, file), 'utf8');
        
        // Find Route::group prefix
        let prefix = '';
        const prefixMatch = content.match(/'prefix'\s*=>\s*'([^']+)'/);
        if (prefixMatch) prefix = prefixMatch[1];
        
        const regex = /Route::(get|post|put|patch|delete)\s*\(\s*'([^']+)'/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
            let rPath = match[2];
            if (prefix) {
                rPath = prefix + (rPath === '/' ? '' : (rPath.startsWith('/') ? rPath : '/' + rPath));
            }
            if (!rPath.startsWith('/')) rPath = '/' + rPath;
            if (rPath.endsWith('/')) rPath = rPath.slice(0, -1);
            if (rPath === '') rPath = '/';
            
            // Normalize parameter names to {id}
            rPath = rPath.replace(/\{[^}]+\}/g, '{id}');
            
            routes.push({
                file: file,
                method: match[1].toUpperCase(),
                path: rPath
            });
        }
    }
    return routes;
}

const apiCalls = extractApiCalls();
const definedRoutes = extractRoutes();

console.log(`Found ${apiCalls.length} frontend API calls and ${definedRoutes.length} backend routes.\n`);

const missing = [];

for (const call of apiCalls) {
    // Ignore external APIs or special auth routes
    if (call.path.startsWith('/auth') || call.path.includes('://')) continue;
    
    // Check if route exists
    let found = false;
    for (const route of definedRoutes) {
        // Regex match equivalent paths
        const routeRegexSource = '^' + route.path.replace(/\{id\}/g, '[^/]+') + '$';
        const regex = new RegExp(routeRegexSource);
        
        // Frontend paths might have literal {id} from our normalization
        let testPath = call.path.replace(/\{id\}/g, '123');
        if (testPath.endsWith('/')) testPath = testPath.slice(0, -1);

        if (regex.test(testPath) && (route.method === call.method || route.method === 'ANY')) {
            found = true;
            break;
        }
    }
    
    if (!found) {
        missing.push(`${call.method} ${call.path} (in frontend plugin: ${call.plugin})`);
    }
}

const uniqueMissing = [...new Set(missing)];
if (uniqueMissing.length > 0) {
    console.log("POSSIBLE MISSING OR MISMATCHED ROUTES:");
    uniqueMissing.forEach(m => console.log(m));
} else {
    console.log("No mismatched routes found static analysis.");
}
