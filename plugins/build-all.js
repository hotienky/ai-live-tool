const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const pluginsDir = __dirname
const dirs = fs.readdirSync(pluginsDir).filter(d => {
  const p = path.join(pluginsDir, d)
  return fs.statSync(p).isDirectory() && d !== 'shared' && d !== 'node_modules'
    && fs.existsSync(path.join(p, 'package.json'))
})

console.log(`\n🔌 Building ${dirs.length} plugins...\n`)

for (const dir of dirs) {
  console.log(`📦 Building: ${dir}`)
  try {
    execSync('npm run build', { cwd: path.join(pluginsDir, dir), stdio: 'inherit' })
    console.log(`✅ ${dir} built successfully\n`)
  } catch (e) {
    console.error(`❌ ${dir} build failed\n`)
  }
}

console.log('🎉 All plugins built!')
