import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// Shared Vite config for building plugin bundles
// Each plugin builds to a single IIFE bundle that registers to window.__PLUGIN_REGISTRY__
export function createPluginConfig(pluginId, entry = 'src/index.js') {
  return defineConfig({
    plugins: [vue()],
    build: {
      lib: {
        entry: resolve(process.cwd(), entry),
        name: `Plugin_${pluginId}`,
        formats: ['iife'],
        fileName: () => 'bundle.js',
      },
      outDir: 'dist',
      rollupOptions: {
        external: ['vue'],
        output: {
          globals: { vue: 'Vue' },
          assetFileNames: 'style.css',
        },
      },
      cssCodeSplit: false,
      minify: 'terser',
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  })
}
