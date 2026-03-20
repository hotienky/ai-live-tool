import { reactive, computed } from 'vue'
import { apiFetch } from './useApi.js'

/**
 * useLanguages — Shared composable for language state across admin components.
 * Fetches and caches installed languages; exposes the default (source) language code.
 * The default language IS the source language — whichever has is_default=true.
 */

const state = reactive({
  languages: [],
  loaded: false,
})

export function useLanguages() {
  const languages = computed(() => state.languages)

  /** The code of the default (source/base) language */
  const defaultLangCode = computed(() => {
    const def = state.languages.find(l => l.is_default || l.isDefault)
    return def?.code || 'vi'
  })

  /** Load languages from API (cached — only fetches once) */
  async function loadLanguages() {
    if (state.loaded) return state.languages
    try {
      const res = await apiFetch('/languages')
      const json = await res.json()
      const data = Array.isArray(json) ? json : (json?.data || [])
      state.languages = data
      state.loaded = true
    } catch (e) {
      console.warn('[useLanguages] Failed to load:', e)
    }
    return state.languages
  }

  /** Force reload (e.g. after changing default language) */
  function invalidate() {
    state.loaded = false
  }

  /** Synchronous getter — returns cached value or 'vi' fallback */
  function getDefaultLangCode() {
    const def = state.languages.find(l => l.is_default || l.isDefault)
    return def?.code || 'vi'
  }

  return { languages, defaultLangCode, loadLanguages, invalidate, getDefaultLangCode }
}
