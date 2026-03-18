// Plugin API Bridge
// Main app exposes these to window.__APP_BRIDGE__ so plugins can use them
// without importing directly from the main app's modules

export function initPluginBridge(apiFetch, showToast) {
  window.__APP_BRIDGE__ = {
    apiFetch,
    showToast,
    Vue: window.Vue, // exposed by main app
  }
}

// Plugin-side helper to access the bridge
export function useAppBridge() {
  const bridge = window.__APP_BRIDGE__
  if (!bridge) {
    console.warn('[Plugin] App bridge not initialized')
    return {
      apiFetch: () => Promise.reject('Bridge not ready'),
      showToast: () => {},
    }
  }
  return bridge
}
