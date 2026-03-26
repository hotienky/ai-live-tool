// Shipping Plugin helpers — provides composables from the main app bridge

const getBridge = () => window.__APP_BRIDGE__ || {}

export function apiFetch(url, options = {}) {
  const bridge = getBridge()
  if (bridge.apiFetch) return bridge.apiFetch(url, options)
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

export function useToast() {
  const bridge = getBridge()
  return {
    showToast: bridge.showToast || ((msg, type) => console.log(`[Toast] ${type}: ${msg}`)),
  }
}

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

export function useUrlParam(...args) {
  const bridge = getBridge()
  if (bridge.useUrlParam) return bridge.useUrlParam(...args)
  const { ref } = window.Vue
  return ref(args[1] || null)
}

export function useSocket(...args) {
  const bridge = getBridge()
  if (bridge.useSocket) return bridge.useSocket(...args)
  return { subscribe: () => {}, unsubscribe: () => {} }
}
