// E-com Plugin helpers — provides composables from the main app bridge
// Used by plugin components instead of importing from main app's composables

const getBridge = () => window.__APP_BRIDGE__ || {}

// ── Core API ──
export function apiFetch(url, options = {}) {
  const bridge = getBridge()
  if (bridge.apiFetch) return bridge.apiFetch(url, options)
  // Fallback: direct fetch
  const token = localStorage.getItem('token')
  const tenantSlug = localStorage.getItem('shopId')
  return fetch(`/api${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(tenantSlug ? { 'X-Tenant': tenantSlug } : {}),
      ...(options.headers || {}),
    },
  })
}

export function getApiBase() {
  return getBridge().API_BASE || '/api'
}

export const API_BASE = getApiBase()

// ── Toast ──
export function useToast() {
  const bridge = getBridge()
  return {
    showToast: bridge.showToast || ((msg, type) => {
      console.log(`[Plugin Toast] ${type}: ${msg}`)
    }),
  }
}

// ── i18n ──
export function useI18n() {
  const bridge = getBridge()
  return {
    t: bridge.t || ((key, fallback) => fallback || key),
    formatCurrency: bridge.formatCurrency || ((v) => Number(v || 0).toLocaleString('vi-VN') + 'đ'),
    currencyLocale: bridge.currencyLocale || (() => 'vi-VN'),
    currencySymbol: bridge.currencySymbol || (() => 'đ'),
    currentLang: bridge.currentLang || { value: 'vi' },
  }
}

// ── Content Translations ──
export function useContentTranslations(...args) {
  const bridge = getBridge()
  if (bridge.useContentTranslations) return bridge.useContentTranslations(...args)
  // Minimal fallback
  return { translatedFields: {}, setTranslation: () => {}, getTranslations: () => ({}) }
}

// ── Languages ──
export function useLanguages(...args) {
  const bridge = getBridge()
  if (bridge.useLanguages) return bridge.useLanguages(...args)
  return { languages: { value: [] }, defaultLang: { value: 'vi' }, fetchLanguages: () => {} }
}

// ── Shop Customers ──
export function useShopCustomers(...args) {
  const bridge = getBridge()
  if (bridge.useShopCustomers) return bridge.useShopCustomers(...args)
  return { customers: { value: [] }, fetchCustomers: () => {} }
}

// ── URL Param ──
export function useUrlParam(...args) {
  const bridge = getBridge()
  if (bridge.useUrlParam) return bridge.useUrlParam(...args)
  const { ref } = window.Vue
  return ref(args[1] || null)
}

// ── Socket ──
export function useSocket(...args) {
  const bridge = getBridge()
  if (bridge.useSocket) return bridge.useSocket(...args)
  return { subscribe: () => {}, unsubscribe: () => {} }
}

// ── Logger ──
export const logger = (() => {
  const bridge = getBridge()
  return bridge.logger || {
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  }
})()

// ── Shared Components ──
export function getSharedComponent(name) {
  const bridge = getBridge()
  return bridge.components?.[name] || null
}

// Convenience exports for specific shared components
export const MediaPicker = (() => getSharedComponent('MediaPicker'))
export const LanguageTabs = (() => getSharedComponent('LanguageTabs'))
export const CurrencyInput = (() => getSharedComponent('CurrencyInput'))
