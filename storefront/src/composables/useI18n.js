import { reactive, computed } from 'vue'
import { apiFetch } from '../api.js'

/**
 * useI18n — Storefront internationalization composable
 * All translations are loaded from the database via API.
 * JSON seed files are only kept on the backend for initial seeding.
 */

const LANG_KEY = 'sf_lang'

// Default language will be resolved from the API via loadLanguages(). 
// Use localStorage value if available, otherwise leave empty to auto-detect from API.
const state = reactive({
  currentLang: localStorage.getItem(LANG_KEY) || '',
  defaultLangCode: '',
  languages: [],
  translations: {},
  loaded: false,
})

export function useI18n() {
  const currentLang = computed(() => state.currentLang)
  const languages = computed(() => state.languages)

  /**
   * t(key, fallback) — Get translation, fallback to provided text or empty string
   * Keys use dot notation: "storefront.home" → "Trang chủ"
   * When key is not found: returns fallback if provided, otherwise '' (empty)
   */
  function t(key, fallback) {
    // Try full key first
    if (state.translations[key]) return state.translations[key]
    // Try with storefront prefix
    const sfKey = `storefront.${key}`
    if (state.translations[sfKey]) return state.translations[sfKey]
    // Return fallback or empty string (so || pattern works)
    return fallback !== undefined ? fallback : ''
  }

  function applyLanguages(langs) {
    if (!Array.isArray(langs) || langs.length === 0) return
    state.languages = langs
    const defaultLang = langs.find(l => l.is_default) || langs[0]
    if (defaultLang) state.defaultLangCode = defaultLang.code
    const valid = state.currentLang && langs.find(l => l.code === state.currentLang)
    if (!valid) {
      state.currentLang = state.defaultLangCode || langs[0]?.code || 'vi'
      localStorage.setItem(LANG_KEY, state.currentLang)
    }
  }

  /** Init languages from siteConfig.languages — skips /languages API call. */
  function initLanguagesFromConfig(languages) {
    applyLanguages(languages)
  }

  async function loadLanguages() {
    try {
      const res = await apiFetch('/languages')
      applyLanguages(Array.isArray(res) ? res : [])
    } catch (e) { console.warn('Failed to load languages:', e) }
  }

  async function loadTranslations(langCode) {
    const lang = langCode || state.currentLang || 'vi'
    try {
      const res = await apiFetch(`/translations/${lang}`)
      state.translations = res && typeof res === 'object' ? res : {}
    } catch (e) {
      console.warn('Failed to load translations:', e)
      state.translations = {}
    }
    state.loaded = true
  }

  async function setLang(code) {
    state.currentLang = code
    localStorage.setItem(LANG_KEY, code)
    await loadTranslations(code)
  }

  async function init() {
    if (!state.loaded) {
      // Skip /languages call if already populated from siteConfig
      if (state.languages.length === 0) await loadLanguages()
      await loadTranslations()
    }
  }

  const defaultLangCode = computed(() => state.defaultLangCode)

  return { t, currentLang, defaultLangCode, languages, setLang, init, initLanguagesFromConfig, loadLanguages, loadTranslations }
}
