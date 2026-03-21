import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'Plugin_livestream',
      formats: ['iife'],
      fileName: () => 'bundle.js',
    },
    outDir: 'dist',
    rollupOptions: {
      external: ['vue', 'lucide-vue-next'],
      output: {
        globals: { vue: 'Vue', 'lucide-vue-next': 'LucideVueNext' },
        assetFileNames: 'style.css',
      },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
})
