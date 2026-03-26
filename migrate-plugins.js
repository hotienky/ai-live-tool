const fs = require('fs')
const path = require('path')

const PLUGINS_DIR = path.join(__dirname, 'plugins')
const FRONTEND_SRC = path.join(__dirname, 'frontend/src')

const plugins = fs.readdirSync(PLUGINS_DIR).filter(d => fs.lstatSync(path.join(PLUGINS_DIR, d)).isDirectory())

let imports = []
let exportsMap = []

plugins.forEach(plugin => {
  const pluginSrc = path.join(PLUGINS_DIR, plugin, 'src')
  if (!fs.existsSync(pluginSrc)) return

  // 1. Move components
  const componentsDir = path.join(pluginSrc, 'components')
  const destComponentsDir = path.join(FRONTEND_SRC, 'components', 'plugins', plugin)
  fs.mkdirSync(destComponentsDir, { recursive: true })

  if (fs.existsSync(componentsDir)) {
    const components = fs.readdirSync(componentsDir)
    components.forEach(file => {
      fs.cpSync(path.join(componentsDir, file), path.join(destComponentsDir, file), { recursive: true })
    })
  }

  // 2. Read and transform index.js
  const indexJsPath = path.join(pluginSrc, 'index.js')
  if (fs.existsSync(indexJsPath)) {
    let indexCode = fs.readFileSync(indexJsPath, 'utf8')
    // Replace imports from './components/' to '../components/plugins/<name>/'
    indexCode = indexCode.replace(/from\s+['"]\.\/components\//g, `from '../components/plugins/${plugin}/`)
    
    // Replace window.__PLUGIN_REGISTRY__ things
    indexCode = indexCode.replace(/window\.__PLUGIN_REGISTRY__.*\n?/g, '')
    indexCode = indexCode.replace(/window\.dispatchEvent.*\n?/g, '')
    
    // Instead of executing hooks immediately, let's wrap the IF inside an exported init() function
    // Actually, Vue imports are hoisted, so we can't just wrap the whole file. 
    // We can export `initHooks: () => { ... }` alongside `export default plugin`
    
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
      
      // Update export
      indexCode = indexCode.replace(/export default plugin/, `plugin.initHooks = initHooks;\nexport default plugin`)
    }

    fs.mkdirSync(path.join(FRONTEND_SRC, 'plugins'), { recursive: true })
    fs.writeFileSync(path.join(FRONTEND_SRC, 'plugins', `${plugin}.js`), indexCode)
    
    imports.push(`import ${plugin}Plugin from './plugins/${plugin}.js';`)
    exportsMap.push(`  '${plugin}': ${plugin}Plugin,`)
  }
})

// Generate static registry
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
console.log('Migration script completed.')
