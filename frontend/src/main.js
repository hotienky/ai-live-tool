import { createApp } from 'vue'
import './style.css'
import './plugins-shared.css'
import App from './App.vue'

createApp(App).mount('#app')

// Register Service Worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}
