const fs = require('fs')
const path = require('path')

const PLUGINS_DIR = path.join(__dirname, 'plugins')
const FRONTEND_SRC = path.join(__dirname, 'frontend/src')
const PLUGINS_SRC_DEST = path.join(FRONTEND_SRC, 'plugins-src')

if (fs.existsSync(PLUGINS_SRC_DEST)) {
  fs.rmSync(PLUGINS_SRC_DEST, { recursive: true, force: true })
}
fs.mkdirSync(PLUGINS_SRC_DEST, { recursive: true })

const plugins = fs.readdirSync(PLUGINS_DIR).filter(d => fs.lstatSync(path.join(PLUGINS_DIR, d)).isDirectory())

let imports = []
let exportsMap = []

plugins.forEach(plugin => {
  const pluginSrc = path.join(PLUGINS_DIR, plugin, 'src')
  if (!fs.existsSync(pluginSrc)) return

  // 1. Copy the entire src directory to frontend/src/plugins-src/<plugin>
  const destDir = path.join(PLUGINS_SRC_DEST, plugin)
  fs.cpSync(pluginSrc, destDir, { recursive: true })

  // 2. Read and transform index.js inside the copied folder
  const indexJsPath = path.join(destDir, 'index.js')
  if (fs.existsSync(indexJsPath)) {
    let indexCode = fs.readFileSync(indexJsPath, 'utf8')
    
    // Replace window.__PLUGIN_REGISTRY__ things
    indexCode = indexCode.replace(/window\.__PLUGIN_REGISTRY__.*\n?/g, '')
    indexCode = indexCode.replace(/window\.dispatchEvent.*\n?/g, '')
    
    // Wrap hook registrations in initHooks function
    let hookBodyMatch = indexCode.match(/if\s*\(hooks\)\s*\{([\s\S]*?)\n\}\s*\nconst\s+plugin\s+=/)
    if (hookBodyMatch) {
      let hookCode = hookBodyMatch[1]
      indexCode = indexCode.replace(hookBodyMatch[0], `
const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const t = bridge?.t || ((k, fb) => fb)
  const Icons = window.LucideVueNext || {}
  if (hooks) {
    ${hookCode}
  }
}
const plugin =`)
      
      indexCode = indexCode.replace(/export default plugin/, `plugin.initHooks = initHooks;\nexport default plugin`)
    }

    fs.writeFileSync(indexJsPath, indexCode)
    
    imports.push(`import ${plugin}Plugin from './plugins-src/${plugin}/index.js';`)
    exportsMap.push(`  '${plugin}': ${plugin}Plugin,`)
  }
})

// Generate static registry in frontend/src
const registryCode = `
${imports.join('\n')}

export const STATIC_PLUGINS = {
${exportsMap.join('\n')}
};

export function registerStaticPlugins() {
  window.__STATIC_PLUGINS__ = STATIC_PLUGINS;
}
`

fs.writeFileSync(path.join(FRONTEND_SRC, 'pluginRegistry.js'), registryCode.trim())
console.log('Migration script V2 completed.')
