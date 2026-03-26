import { computed } from 'vue'

/**
 * Composable for managing multi-language form field bindings
 * @param {import('vue').Ref} formRef - Reference to the form object (must contain a .translations object)
 * @param {import('vue').Ref<string>} currentLangRef - Reference to the currently active language code
 * @param {string} defaultLang - The base language code (e.g. 'vi')
 */
export function useContentTranslations(formRef, currentLangRef, defaultLang = 'vi') {
  const tField = (key) => computed({
    get: () => {
      const lang = currentLangRef.value
      if (lang === defaultLang) {
        return formRef.value[key]
      }
      return formRef.value.translations?.[lang]?.[key] || ''
    },
    set: (val) => {
      const lang = currentLangRef.value
      if (lang === defaultLang) {
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
