import { createApp } from 'vue'
import './style.css'
import './plugins-shared.css'
import './assets/builder-shared.css'
import App from './App.vue'
import router from './router.js'
import { registerStaticPlugins } from './pluginRegistry.js'

registerStaticPlugins()
createApp(App).use(router).mount('#app')

// Register Service Worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
