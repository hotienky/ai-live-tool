/**
 * useModules — Module-aware composable for storefront
 * Provides reactive helpers to check which modules are installed.
 * Data comes from /site-config response, injected via App.vue.
 */
import { inject, computed, ref } from 'vue'

export function useModules() {
  const installedModules = inject('installedModules', ref([]))

  function hasModule(id) {
    return installedModules.value.includes(id)
  }

  const isEcom = computed(() => hasModule('ecom'))
  const isBlog = computed(() => hasModule('blog'))
  const isCms = computed(() => hasModule('cms'))
  const isBanners = computed(() => hasModule('banners'))
  const isMarketing = computed(() => hasModule('marketing'))
  const isShipping = computed(() => hasModule('shipping'))
  const isCrm = computed(() => hasModule('crm'))

  return {
    installedModules,
    hasModule,
    isEcom,
    isBlog,
    isCms,
    isBanners,
    isMarketing,
    isShipping,
    isCrm,
  }
}
