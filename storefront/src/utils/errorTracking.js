/**
 * Global error tracking utility.
 * Captures unhandled errors and promise rejections,
 * batches them, and sends to analytics/logging endpoint.
 *
 * Usage: import and call initErrorTracking() in main.js
 */

const ERROR_ENDPOINT = '/api/storefront/error-log' // optional backend endpoint
const MAX_ERRORS = 20 // prevent infinite loops
let errorCount = 0
const errorBuffer = []
let flushTimer = null

/**
 * Initialize global error tracking.
 * @param {Object} options
 * @param {string} options.endpoint - Backend endpoint to send errors (optional)
 * @param {boolean} options.logToConsole - Also log to console (default: true)
 * @param {Function} options.onError - Custom error handler callback
 */
export function initErrorTracking(options = {}) {
  const {
    endpoint = ERROR_ENDPOINT,
    logToConsole = true,
    onError = null,
  } = options

  // Unhandled JS errors
  window.addEventListener('error', (event) => {
    if (errorCount >= MAX_ERRORS) return
    errorCount++

    const error = {
      type: 'js_error',
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      col: event.colno,
      stack: event.error?.stack?.slice(0, 500) || '',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }

    if (logToConsole) console.error('[ErrorTracker]', error.message)
    if (onError) onError(error)
    bufferError(error, endpoint)
  })

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    if (errorCount >= MAX_ERRORS) return
    errorCount++

    const reason = event.reason
    const error = {
      type: 'promise_rejection',
      message: reason?.message || String(reason),
      stack: reason?.stack?.slice(0, 500) || '',
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    }

    if (logToConsole) console.error('[ErrorTracker] Unhandled rejection:', error.message)
    if (onError) onError(error)
    bufferError(error, endpoint)
  })

  // Performance: long tasks (>50ms)
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > 200) { // Only log tasks > 200ms
            bufferError({
              type: 'long_task',
              duration: Math.round(entry.duration),
              url: window.location.href,
              timestamp: new Date().toISOString(),
            }, endpoint)
          }
        })
      })
      observer.observe({ type: 'longtask', buffered: true })
    } catch { /* PerformanceObserver not supported */ }
  }

  // Report Web Vitals
  reportWebVitals(endpoint)
}

/**
 * Buffer errors and flush in batch every 5 seconds.
 */
function bufferError(error, endpoint) {
  errorBuffer.push(error)

  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushErrors(endpoint)
      flushTimer = null
    }, 5000)
  }
}

function flushErrors(endpoint) {
  if (!errorBuffer.length) return
  const batch = errorBuffer.splice(0, errorBuffer.length)

  // Send to backend (fire-and-forget)
  if (endpoint && navigator.sendBeacon) {
    try {
      navigator.sendBeacon(endpoint, JSON.stringify({ errors: batch }))
    } catch { /* ignore */ }
  }

  // Also store in localStorage for debugging
  try {
    const key = 'sf_error_log'
    const existing = JSON.parse(localStorage.getItem(key) || '[]')
    const merged = [...existing, ...batch].slice(-50) // keep last 50
    localStorage.setItem(key, JSON.stringify(merged))
  } catch { /* storage full */ }
}

/**
 * Core Web Vitals tracking (LCP, FID, CLS).
 */
function reportWebVitals(endpoint) {
  if (!('PerformanceObserver' in window)) return

  // LCP (Largest Contentful Paint)
  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const last = entries[entries.length - 1]
      if (last) {
        bufferError({
          type: 'web_vital',
          metric: 'LCP',
          value: Math.round(last.startTime),
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }, endpoint)
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true })
  } catch { /* not supported */ }

  // CLS (Cumulative Layout Shift)
  try {
    let clsValue = 0
    new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      })
    }).observe({ type: 'layout-shift', buffered: true })

    // Report CLS on page hide
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        bufferError({
          type: 'web_vital',
          metric: 'CLS',
          value: Math.round(clsValue * 1000) / 1000,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }, endpoint)
        flushErrors(endpoint)
      }
    })
  } catch { /* not supported */ }
}

/**
 * Vue error handler — attach to app.config.errorHandler.
 */
export function createVueErrorHandler(options = {}) {
  return (err, instance, info) => {
    if (errorCount >= MAX_ERRORS) return
    errorCount++

    const error = {
      type: 'vue_error',
      message: err?.message || String(err),
      stack: err?.stack?.slice(0, 500) || '',
      component: instance?.$options?.name || instance?.$options?.__name || 'Unknown',
      info,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    }

    console.error(`[Vue Error] ${error.component}:`, err)
    if (options.onError) options.onError(error)
    bufferError(error, options.endpoint || ERROR_ENDPOINT)
  }
}
