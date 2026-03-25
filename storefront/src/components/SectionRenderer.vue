<template>
  <div v-if="component" :id="section.params?.anchorId" :class="section.params?.cssClass" :style="sectionWrapStyle">
    <component
      :is="component"
      :params="resolvedParams"
      :content="resolvedContent"
      :section="section"
    >
      <!-- Đệ quy children cho grid/nested layouts -->
      <template v-if="section.children && section.children.length > 0">
        <SectionRenderer
          v-for="(child, index) in section.children"
          :key="child.id || `${child.type}-${index}`"
          :section="child"
        />
      </template>
    </component>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, inject, ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import SectionRenderer from './SectionRenderer.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
})

const { currentLang, defaultLangCode } = useI18n()
const injectedPluginSections = inject('pluginSections', ref([]))

/**
 * P3 – Component whitelist: chỉ render component có trong registry.
 * Lazy load để tối ưu bundle size.
 *
 * Hỗ trợ cả hai format:
 *   - Old Shopify-style sections: type dùng underscore (banner, featured_products, …)
 *   - New block-builder sections: type dùng hyphen (hero-banner, rich-text, …)
 */
const coreRegistry = {
  // ── Old Shopify-style sections ──
  banner:            defineAsyncComponent(() => import('../views/sections/BannerSection.vue')),
  categories:        defineAsyncComponent(() => import('../views/sections/CategoriesSection.vue')),
  flash_sale:        defineAsyncComponent(() => import('./FlashSale.vue')),
  featured_products: defineAsyncComponent(() => import('../views/sections/FeaturedProductsSection.vue')),
  new_arrivals:      defineAsyncComponent(() => import('../views/sections/NewArrivalsSection.vue')),
  cms_pages:         defineAsyncComponent(() => import('../views/sections/CmsPagesSection.vue')),
  blog_posts:        defineAsyncComponent(() => import('../views/sections/BlogPostsSection.vue')),

  // ── Custom library sections ──
  testimonials:  defineAsyncComponent(() => import('./sections/HomeSectionTestimonials.vue')),
  faq:           defineAsyncComponent(() => import('./sections/HomeSectionFaq.vue')),
  image_gallery: defineAsyncComponent(() => import('./sections/HomeSectionGallery.vue')),
  video_embed:   defineAsyncComponent(() => import('./sections/HomeSectionVideo.vue')),
  text_block:    defineAsyncComponent(() => import('./sections/HomeSectionTextBlock.vue')),
  newsletter:    defineAsyncComponent(() => import('./sections/HomeSectionNewsletter.vue')),
  social_feed:   defineAsyncComponent(() => import('./sections/HomeSectionSocial.vue')),
  brands_slider: defineAsyncComponent(() => import('./sections/HomeSectionBrands.vue')),
  trust_badges:  defineAsyncComponent(() => import('./sections/HomeSectionTrustBadges.vue')),

  // ── Structural ──
  custom_block: defineAsyncComponent(() => import('../views/sections/CustomBlockSection.vue')),
  grid:         defineAsyncComponent(() => import('./sections/GridSection.vue')),

  // ── New block-builder types (hyphen format) ──
  'hero-banner':       defineAsyncComponent(() => import('../views/sections/HeroBannerSection.vue')),
  'rich-text':         defineAsyncComponent(() => import('../views/sections/RichTextSection.vue')),
  'image-banner':      defineAsyncComponent(() => import('../views/sections/ImageBannerSection.vue')),
  'spacer':            defineAsyncComponent(() => import('../views/sections/SpacerSection.vue')),
  'html-embed':        defineAsyncComponent(() => import('../views/sections/HtmlEmbedSection.vue')),
  'blog-collection':   defineAsyncComponent(() => import('../views/sections/BlogCollectionSection.vue')),
  'latest-posts':      defineAsyncComponent(() => import('../views/sections/BlogCollectionSection.vue')),
  'product-listing':   defineAsyncComponent(() => import('../views/sections/ProductListingSection.vue')),
  'featured-products': defineAsyncComponent(() => import('../views/sections/FeaturedProductsSection.vue')),
  'product-categories':defineAsyncComponent(() => import('../views/sections/ProductCategoriesSection.vue')),
}

const component = computed(() => {
  // 1. Plugin-injected component (Bridge Pattern)
  if (props.section._pluginComponent) {
    return props.section._pluginComponent
  }

  // 2. Fallback injected array (older pattern)
  const pluginMatch = injectedPluginSections.value.find(p => p.type === props.section.type)
  if (pluginMatch?.component) {
    return pluginMatch.component
  }

  // 3. Core registry — P3: chỉ render component có trong registry
  return coreRegistry[props.section.type] || null
})

/**
 * Normalize params: hỗ trợ cả section.params (Shopify-style)
 * và section.settings (new block-builder format).
 * BFF data được inject vào params.resolvedData bởi LayoutResolver.
 */
const resolvedParams = computed(() => {
  const lang = currentLang.value
  // Merge params và settings để tương thích cả hai format
  const p = { ...(props.section.settings || {}), ...(props.section.params || {}) }
  // BFF: copy props.resolvedData vào params.resolvedData nếu có
  if (props.section.props?.resolvedData && !p.resolvedData) {
    p.resolvedData = props.section.props.resolvedData
  }

  if (!lang || lang === defaultLangCode.value) return p

  const tp = props.section.translations?.[lang]?.params
  if (!tp) return p

  const merged = { ...p }
  for (const [k, v] of Object.entries(tp)) {
    if (v && String(v).trim()) merged[k] = v
  }
  return merged
})

const resolvedContent = computed(() => {
  const lang = currentLang.value
  const c = props.section.content
  if (!lang || lang === defaultLangCode.value) return c

  const tc = props.section.translations?.[lang]?.content
  if (!tc) return c

  if (Array.isArray(tc) && Array.isArray(c)) {
    return c.map((item, i) => {
      if (!tc[i]) return item
      const merged = { ...item }
      for (const [k, v] of Object.entries(tc[i])) {
        if (v && String(v).trim()) merged[k] = v
      }
      return merged
    })
  }

  if (typeof tc === 'string' && tc.trim()) return tc
  return c
})

const sectionWrapStyle = computed(() => {
  const p = resolvedParams.value
  if (!p) return {}
  return {
    paddingTop: p.paddingTop ? `${p.paddingTop}px` : undefined,
    paddingBottom: p.paddingBottom ? `${p.paddingBottom}px` : undefined,
    marginTop: p.marginTop ? `${p.marginTop}px` : undefined,
    marginBottom: p.marginBottom ? `${p.marginBottom}px` : undefined,
    backgroundColor: p.bgColor || undefined,
    backgroundImage: p.bgImage ? `url(${p.bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})
</script>
