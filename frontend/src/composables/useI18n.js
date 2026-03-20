import { reactive, computed } from 'vue'
import { apiFetch } from './useApi.js'

/**
 * useI18n — Admin Frontend internationalization composable
 * Loads translations from:
 * 1. Local JSON locale files (primary, bundled with app)
 * 2. Database via API (overrides, for admin-edited translations)
 */

const LANG_KEY = 'admin_lang'

// Import all locale JSON files from /locales/*.json at build time
const localeModules = import.meta.glob('../locales/*.json', { eager: true })

// Build locale map: { vi: {...}, en: {...}, ja: {...} }
const localTranslations = {}
for (const [path, mod] of Object.entries(localeModules)) {
  const code = path.match(/\/([^/]+)\.json$/)?.[1]
  if (code) localTranslations[code] = mod.default || mod
}

const _initLang = localStorage.getItem(LANG_KEY) || 'vi'

const state = reactive({
  currentLang: _initLang,
  languages: [],
  // Immediately load translations from bundled JSON so t() works before init()
  translations: localTranslations[_initLang] ? { ...localTranslations[_initLang] } : {},
  dbTranslations: {},
  loaded: false,
})

export function useI18n() {
  const currentLang = computed(() => state.currentLang)
  const languages = computed(() => state.languages)

  /**
   * t(key, fallback) — Get translation for current language
   * Priority: DB translation > local JSON file > fallback param
   */
  function t(key, fallback) {
    // 1. Check merged translations (local + DB overrides)
    if (state.translations[key]) return state.translations[key]
    // 2. Try with admin prefix
    const adminKey = `admin.${key}`
    if (state.translations[adminKey]) return state.translations[adminKey]
    // 3. Return fallback
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

  function mergeTranslations(code) {
    // Start with local JSON translations for this language
    const local = localTranslations[code] || {}
    // Merge DB translations on top (DB overrides local)
    const db = state.dbTranslations
    state.translations = { ...local, ...db }
  }

  async function loadTranslations(langCode) {
    const code = langCode || state.currentLang
    // Load DB translations
    try {
      const res = await apiFetch(`/translations/${code}`)
      const json = await res.json()
      const translations = json?.data || json
      state.dbTranslations = translations && typeof translations === 'object' && !Array.isArray(translations) ? translations : {}
    } catch (e) {
      console.warn('Failed to load admin translations:', e)
      state.dbTranslations = {}
    }
    // Merge local + DB
    mergeTranslations(code)
    state.loaded = true
  }

  async function setLang(code) {
    state.currentLang = code
    localStorage.setItem(LANG_KEY, code)
    // Reload page to re-evaluate all static t() calls
    window.location.reload()
  }

  async function init() {
    if (!state.loaded) {
      await loadLanguages()
      await loadTranslations()
    }
  }

  return { t, currentLang, languages, setLang, init, loadLanguages, loadTranslations }
}
