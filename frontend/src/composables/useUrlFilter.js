/**
 * useUrlFilter — sync filter state to URL query params
 *
 * Usage:
 *   const filterStatus = useUrlParam('status', '')
 *   const selectedDays = useUrlParam('days', '7')
 *
 * The ref reads its initial value from the URL. When the ref changes,
 * the URL is updated without a page reload. On popstate the ref is
 * updated from the URL again.
 */
import { ref, watch, onMounted, onUnmounted } from 'vue'

/**
 * Create a reactive ref synced to a URL query parameter.
 * @param {string} key   – query param name (e.g. 'status')
 * @param {string} defaultValue – fallback when param is absent
 * @returns {import('vue').Ref<string>}
 */
export function useUrlParam(key, defaultValue = '') {
  function readFromUrl() {
    const params = new URLSearchParams(window.location.search)
    return params.get(key) ?? defaultValue
  }

  const value = ref(readFromUrl())

  // Sync ref → URL
  watch(value, (newVal) => {
    const url = new URL(window.location.href)
    if (newVal && newVal !== defaultValue) {
      url.searchParams.set(key, newVal)
    } else {
      url.searchParams.delete(key)
    }
    // Replace state to avoid polluting browser history with every keystroke
    history.replaceState(history.state, '', url.pathname + url.search)
  })

  // Sync URL → ref on popstate (browser back/forward)
  function onPopState() {
    value.value = readFromUrl()
  }

  onMounted(() => window.addEventListener('popstate', onPopState))
  onUnmounted(() => window.removeEventListener('popstate', onPopState))

  return value
}

/**
 * Batch-read multiple filter values from URL at once.
 * Useful when a component has several filters.
 *
 * @param {Record<string, string>} defaults – e.g. { status: '', days: '7' }
 * @returns {Record<string, import('vue').Ref<string>>}
 */
export function useUrlFilters(defaults) {
  const result = {}
  for (const [key, defaultValue] of Object.entries(defaults)) {
    result[key] = useUrlParam(key, defaultValue)
  }
  return result
}
