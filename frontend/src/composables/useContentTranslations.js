import { computed } from 'vue'
import { useLanguages } from './useLanguages.js'

/**
 * Composable for managing multi-language form field bindings
 * @param {import('vue').Ref} formRef - Reference to the form object (must contain a .translations object)
 * @param {import('vue').Ref<string>} currentLangRef - Reference to the currently active language code
 * @param {string} [defaultLang] - Override for base language code (auto-detected from useLanguages if omitted)
 */
export function useContentTranslations(formRef, currentLangRef, defaultLang) {
  const { getDefaultLangCode } = useLanguages()
  const baseLang = defaultLang || getDefaultLangCode()
  const tField = (key) => computed({
    get: () => {
      const lang = currentLangRef.value
      if (lang === baseLang) {
        return formRef.value[key]
      }
      return formRef.value.translations?.[lang]?.[key] || ''
    },
    set: (val) => {
      const lang = currentLangRef.value
      if (lang === baseLang) {
        formRef.value[key] = val
      } else {
        if (!formRef.value.translations) formRef.value.translations = {}
        if (!formRef.value.translations[lang]) formRef.value.translations[lang] = {}
        formRef.value.translations[lang][key] = val
      }
    }
  })

  return {
    tField
  }
}
