import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// Build a single plugin bundle
// Usage: PLUGIN=blog npx vite build -c vite.plugin.config.js
const plugin = process.env.PLUGIN || 'blog'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: `../backend-laravel/public/plugins/${plugin}`,
    emptyOutDir: false,
    lib: {
      entry: `plugins-src/${plugin}/index.js`,
      name: `Plugin_${plugin}`,
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    rollupOptions: {
      external: ['vue', 'lucide-vue-next'],
      output: {
        globals: { vue: 'Vue', 'lucide-vue-next': 'LucideVueNext' },
      },
    },
  },
})
