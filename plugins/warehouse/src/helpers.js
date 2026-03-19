// Plugin helper — provides apiFetch and showToast from the main app bridge
// Used by plugin components instead of importing from main app's composables

export function apiFetch(url, options = {}) {
  const bridge = window.__APP_BRIDGE__
  if (!bridge || !bridge.apiFetch) {
    console.warn('[Plugin] App bridge not available, using fallback fetch')
    // Fallback: direct fetch with current tenant headers
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
  return bridge.apiFetch(url, options)
}

export function useToast() {
  const bridge = window.__APP_BRIDGE__
  return {
    showToast: bridge?.showToast || ((msg, type) => {
      console.log(`[Plugin Toast] ${type}: ${msg}`)
    }),
  }
}

export function useI18n() {
  const bridge = window.__APP_BRIDGE__
  return {
    t: bridge?.t || ((key, fallback) => fallback || key)
  }
}
