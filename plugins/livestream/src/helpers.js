// Livestream Plugin — Bridge API Wrapper
// Provides access to core app utilities exposed via window.__APP_BRIDGE__

const bridge = window.__APP_BRIDGE__ || {}

export const apiFetch = bridge.apiFetch || (async () => new Response('{}'))
export const useToast = bridge.useToast || (() => ({ showToast: () => {} }))
export const useI18n = bridge.useI18n || (() => ({ t: (k, fb) => fb, formatCurrency: (v) => v }))
export const logger = bridge.logger || console
export const API_BASE = bridge.API_BASE || '/api'

// useUrlParam — sync a ref to a URL query param (bridge re-export or inline fallback)
export const useUrlParam = bridge.useUrlParam || function useUrlParam(key, defaultValue = '') {
  const { ref, watch, onMounted, onUnmounted } = window.Vue
  function readFromUrl() {
    const params = new URLSearchParams(window.location.search)
    return params.get(key) ?? defaultValue
  }
  const value = ref(readFromUrl())
  watch(value, (newVal) => {
    const url = new URL(window.location.href)
    if (newVal && newVal !== defaultValue) {
      url.searchParams.set(key, newVal)
    } else {
      url.searchParams.delete(key)
    }
    history.replaceState(history.state, '', url.pathname + url.search)
  })
  function onPopState() { value.value = readFromUrl() }
  onMounted(() => window.addEventListener('popstate', onPopState))
  onUnmounted(() => window.removeEventListener('popstate', onPopState))
  return value
}

// useSocket — shared socket composable from bridge (creates a new connection per call)
export const useSocket = bridge.useSocket || (() => ({
  socket: { value: null },
  isConnected: { value: false },
  connectionLost: { value: false },
  leads: { value: [] },
  allComments: { value: [] },
  stats: { value: { hot: 0, warm: 0, cold: 0, total: 0 } },
  crawlerStatus: { value: { status: 'waiting' } },
  viewerCount: { value: 0 },
  postLiveReport: { value: null },
  joinShop: () => {},
  startMock: () => {},
  resetStats: () => {},
}))

export default bridge
