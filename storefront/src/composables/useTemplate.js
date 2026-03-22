/**
 * useTemplate — Template-aware composable for storefront
 * Reads layoutConfig.template to determine website type and drive UI behavior.
 * Templates: full_store | catalog | minimal | landing
 */
import { inject, computed, ref } from 'vue'

export function useTemplate() {
  const template = inject('template', ref('full_store'))

  const templateId = computed(() => template.value || 'full_store')

  const isFullStore = computed(() => templateId.value === 'full_store')
  const isCatalog = computed(() => templateId.value === 'catalog')
  const isMinimal = computed(() => templateId.value === 'minimal')
  const isLanding = computed(() => templateId.value === 'landing')

  // Landing pages typically have no products — hide ecom UI
  const shouldShowEcomUI = computed(() => !isLanding.value)
  // Catalog/minimal templates focus on products — hide blog/CMS
  const shouldShowBlogUI = computed(() => !isCatalog.value && !isMinimal.value)

  return {
    templateId,
    isFullStore,
    isCatalog,
    isMinimal,
    isLanding,
    shouldShowEcomUI,
    shouldShowBlogUI,
  }
}
