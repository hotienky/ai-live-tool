import { reactive, computed } from 'vue'
import { apiFetch } from './useApi.js'

/**
 * useI18n — Admin Frontend internationalization composable
 * Loads translations from /api/translations/:lang
 * Stores selected language in localStorage
 */

const LANG_KEY = 'admin_lang'

const state = reactive({
  currentLang: localStorage.getItem(LANG_KEY) || 'vi',
  languages: [],
  translations: {},
  loaded: false,
})

export function useI18n() {
  const currentLang = computed(() => state.currentLang)
  const languages = computed(() => state.languages)

  /**
   * t(key, fallback) — Get translation, fallback to provided fallback or key
   * Keys use dot notation: "admin.dashboard" → "Dashboard"
   */
  function t(key, fallback) {
    if (state.translations[key]) return state.translations[key]
    // Try with admin prefix
    const adminKey = `admin.${key}`
    if (state.translations[adminKey]) return state.translations[adminKey]
    return fallback || ''
  }

  async function loadLanguages() {
    try {
      const res = await apiFetch('/languages')
      const json = await res.json()
      state.languages = Array.isArray(json) ? json : (json?.data || [])
      if (state.languages.length > 0) {
        const valid = state.languages.find(l => l.code === state.currentLang)
        if (!valid) {
          const defaultLang = state.languages.find(l => l.is_default) || state.languages[0]
          state.currentLang = defaultLang.code
          localStorage.setItem(LANG_KEY, state.currentLang)
        }
      }
    } catch (e) { console.warn('Failed to load admin languages:', e) }
  }

  async function loadTranslations(langCode) {
    try {
      const res = await apiFetch(`/translations/${langCode || state.currentLang}`)
      const json = await res.json()
      state.translations = json && typeof json === 'object' ? json : {}
      state.loaded = true
    } catch (e) {
      console.warn('Failed to load admin translations:', e)
      state.translations = {}
    }
  }

  async function setLang(code) {
    state.currentLang = code
    localStorage.setItem(LANG_KEY, code)
    await loadTranslations(code)
  }

  async function init() {
    if (!state.loaded) {
      await loadLanguages()
      await loadTranslations()
    }
  }

  return { t, currentLang, languages, setLang, init, loadLanguages, loadTranslations }
}
