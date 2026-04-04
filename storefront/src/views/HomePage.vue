<template>
  <div class="home-page">
    <h1 class="sr-only">{{ t('storefront.home_seo_title') || 'Cửa hàng trực tuyến — Sản phẩm chất lượng cao' }}</h1>

    <div v-if="!sectionsReady" class="home-loading-skeletons">
      <div class="banner-skeleton" style="margin-bottom: 24px;">
        <div class="skeleton" style="width:100%;aspect-ratio:21/7;border-radius:16px"></div>
      </div>
      <div class="container" style="display:flex;gap:14px;margin-bottom:32px;">
        <div v-for="i in 6" :key="'cat'+i" class="skeleton" style="width:120px;height:100px;border-radius:12px;flex-shrink:0"></div>
      </div>
      <div class="product-skeleton-grid container">
        <div v-for="i in 8" :key="'prod'+i" class="product-skeleton">
          <div class="skeleton" style="aspect-ratio:1"></div>
          <div class="skeleton" style="height:14px;width:70%;margin-top:12px"></div>
          <div class="skeleton" style="height:18px;width:40%;margin-top:8px"></div>
        </div>
      </div>
    </div>

    <!--
      P2 – UI render từ JSON layout (không hardcode).
      P3 – SectionRenderer chỉ render component có trong registry.
      P5 – sections.params.resolvedData đã được inject server-side qua LayoutResolver
           trong buildSiteConfig(). Component không fetch API riêng.
    -->
    <template v-else>
      <SectionRenderer
        v-for="(section, index) in activeSections"
        :key="section.id || `${section.type}-${index}`"
        :section="section"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, inject, ref, onMounted } from 'vue'
import SectionRenderer from '../components/SectionRenderer.vue'
import { useSeo } from '../composables/useSeo.js'
import { useI18n } from '../composables/useI18n.js'
import { useModules } from '../composables/useModules.js'
import { usePersonalization } from '../composables/usePersonalization.js'

const { t } = useI18n()
const { hasModule } = useModules()
const { setPageSeo } = useSeo()
const { evaluateConditions } = usePersonalization()

// layoutConfig injected từ App.vue — đã chứa sections với data được resolve BFF
const layoutConfig = inject('layoutConfig', ref(null))
const storeInfo = inject('storeInfo', ref({}))

// Inject plugin sections từ App.vue (__SF_BRIDGE__)
const injectedPluginSections = inject('pluginSections', ref([]))

// ── Section type → required module mapping ──
const sectionModuleMap = {
  categories:        'ecom',
  flash_sale:        'ecom',
  featured_products: 'ecom',
  'featured-products': 'ecom',
  new_arrivals:      'ecom',
  'product-listing': 'ecom',
  'product-categories': 'ecom',
  cms_pages:         'cms',
  blog_posts:        'blog',
  'blog-collection': 'blog',
  'latest-posts':    'blog',
}

const sectionsReady = computed(() => layoutConfig.value !== null)

const activeSections = computed(() => {
  const raw = layoutConfig.value?.sections || []

  // Filter theo module availability + enabled flag + rule engine (personalization)
  const filtered = raw.filter(s => {
    if (s.enabled === false) return false
    
    // Evaluate Personalization Rules
    if (!evaluateConditions(s.conditions)) return false
    
    const requiredModule = sectionModuleMap[s.type]
    if (requiredModule && !hasModule(requiredModule)) return false
    return true
  })

  // Plugin-provided sections (via __SF_BRIDGE__)
  const pluginMap = {}
  ;(injectedPluginSections.value || []).forEach(ps => {
    const key = ps.type || `plugin_${ps.moduleId}`
    pluginMap[key] = ps
  })

  // Attach _pluginComponent cho các section match plugin types
  const enhanced = filtered.map(s => {
    if (pluginMap[s.type]) {
      return { ...s, _pluginComponent: pluginMap[s.type].component, moduleId: pluginMap[s.type].moduleId }
    }
    return s
  })

  // Append plugin sections chưa có trong layout config
  const usedTypes = new Set(filtered.map(s => s.type))
  const extra = Object.entries(pluginMap)
    .filter(([key]) => !usedTypes.has(key))
    .map(([key, ps]) => ({
      type: key,
      enabled: true,
      order: ps.order ?? 999,
      params: ps.params || {},
      _pluginComponent: ps.component,
      moduleId: ps.moduleId,
    }))

  return [...enhanced, ...extra].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
})

onMounted(() => {
  // SEO: set từ storeInfo (đã có từ siteConfig, không cần fetch riêng)
  const info = storeInfo.value
  setPageSeo({
    title: info?.meta_title || info?.shop_name
      ? `${info.shop_name} — Cửa hàng trực tuyến`
      : 'Trang chủ — Cửa hàng trực tuyến',
    description: info?.meta_description || info?.description || '',
    type: 'website',
  })
})
</script>

<style scoped>
.home-page { padding-bottom: 60px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.product-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
.product-skeleton {
  padding: 16px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
}

@media (max-width: 1024px) {
  .product-skeleton-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
}
@media (max-width: 768px) {
  .product-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
