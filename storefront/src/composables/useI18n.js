import { reactive, computed } from 'vue'
import { apiFetch } from '../api.js'

/**
 * useI18n — Storefront internationalization composable
 * Loads translations from /api/storefront/translations/:lang
 * Stores selected language in localStorage
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

  async function loadLanguages() {
    try {
      const res = await apiFetch('/languages')
      state.languages = Array.isArray(res) ? res : []
      // Detect default language from API
      const defaultLang = state.languages.find(l => l.is_default) || state.languages[0]
      if (defaultLang) {
        state.defaultLangCode = defaultLang.code
      }
      // If current lang is empty or not in the list, fallback to default
      if (state.languages.length > 0) {
        const valid = state.currentLang && state.languages.find(l => l.code === state.currentLang)
        if (!valid) {
          state.currentLang = state.defaultLangCode || (state.languages[0]?.code) || 'vi'
          localStorage.setItem(LANG_KEY, state.currentLang)
        }
      }
    } catch (e) { console.warn('Failed to load languages:', e) }
  }

  async function loadTranslations(langCode) {
    try {
      const res = await apiFetch(`/translations/${langCode || state.currentLang}`)
      state.translations = res && typeof res === 'object' ? res : {}
      state.loaded = true
    } catch (e) {
      console.warn('Failed to load translations:', e)
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

  const defaultLangCode = computed(() => state.defaultLangCode)

  return { t, currentLang, defaultLangCode, languages, setLang, init, loadLanguages, loadTranslations }
}
