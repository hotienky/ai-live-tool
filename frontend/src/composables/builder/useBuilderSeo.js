import { ref, watch } from 'vue'

export function useBuilderSeo(
  { activePageId, dynamicPages, pageConfigs },
  { activeBuiltinPage },
  apiFetch
) {
  const showSeoSettings = ref(false)

  const currentSeoConfig = ref({
    meta_title: '',
    meta_description: '',
    og_image: '',
    robots: 'index, follow',
    schema_json: ''
  })

  watch(showSeoSettings, (val) => {
    if (val) {
      if (activePageId.value && !activeBuiltinPage.value) {
        // CmsPage SEO
        const p = dynamicPages.value.find(dp => dp.id === activePageId.value)
        if (p) {
          currentSeoConfig.value = p.seo_meta || { meta_title: p.meta_title || '', meta_description: p.meta_description || '' }
        }
      } else {
        // LayoutPage SEO
        const key = activePageId.value || 'home'
        if (!pageConfigs.value[key]) pageConfigs.value[key] = {}
        currentSeoConfig.value = pageConfigs.value[key].seo || {}
      }
    }
  })

  function saveSeoConfig() {
    if (activePageId.value && !activeBuiltinPage.value) {
      // CmsPage mode -> We just update dynamicPages, real save uses useBuilderPersistence
      const p = dynamicPages.value.find(dp => dp.id === activePageId.value)
      if (p) p.seo_meta = { ...currentSeoConfig.value }
    } else {
      // LayoutPage mode
      const key = activePageId.value || 'home'
      if (!pageConfigs.value[key]) pageConfigs.value[key] = {}
      pageConfigs.value[key].seo = { ...currentSeoConfig.value }
    }
    showSeoSettings.value = false
    window.dispatchEvent(new CustomEvent('toast', { detail: { msg: 'Đã lưu cấu hình SEO. (Cần xuất bản để lưu vĩnh viễn trên server)', type: 'success' }}))
  }

  return {
    showSeoSettings,
    currentSeoConfig,
    saveSeoConfig,
  }
}
