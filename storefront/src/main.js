import { createApp } from 'vue'
import App from './App.vue'
import router from './router.js'
import './assets/styles.css'
import { initErrorTracking, createVueErrorHandler } from './utils/errorTracking.js'

// Initialize global error tracking (JS errors, promise rejections, Web Vitals)
initErrorTracking()

const app = createApp(App)

// Capture Vue component errors
app.config.errorHandler = createVueErrorHandler()

app.use(router).mount('#app')
