import { reactive, computed } from 'vue'
import { apiFetch } from '../api.js'

// Import local locale files as base translations
import viLocale from '../locales/vi.json'
import enLocale from '../locales/en.json'
import jaLocale from '../locales/ja.json'

/**
 * useI18n — Storefront internationalization composable
 * Loads base translations from local JSON files,
 * then overlays API translations (DB) on top for per-tenant customization.
 */

const LANG_KEY = 'sf_lang'

const localLocales = { vi: viLocale, en: enLocale, ja: jaLocale }

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
    const lang = langCode || state.currentLang || 'vi'
    // Start with local locale file as base
    const base = localLocales[lang] || localLocales.vi || {}
    try {
      // Overlay API translations on top (per-tenant customization from DB)
      const res = await apiFetch(`/translations/${lang}`)
      const apiTranslations = res && typeof res === 'object' ? res : {}
      state.translations = { ...base, ...apiTranslations }
    } catch (e) {
      console.warn('Failed to load API translations, using local locale:', e)
      state.translations = { ...base }
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
      await loadLanguages()
      await loadTranslations()
    }
  }

  const defaultLangCode = computed(() => state.defaultLangCode)

  return { t, currentLang, defaultLangCode, languages, setLang, init, loadLanguages, loadTranslations }
}
