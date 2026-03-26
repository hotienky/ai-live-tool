import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  appType: 'spa',
  resolve: {
    alias: {
      // Include Vue template compiler for plugin bundles that use `template` strings
      vue: 'vue/dist/vue.esm-bundler.js',
    },
  },
  server: {
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost',
        changeOrigin: false,
      },
      '/socket.io': {
        target: 'http://localhost',
        ws: true,
      },
    },
  },
})
