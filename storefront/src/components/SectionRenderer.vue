<template>
  <component
    v-if="isPrimitiveNode"
    :is="primitiveTag"
    :id="section.params?.anchorId"
    :data-builder-id="section.id"
    :data-builder-type="section.type"
    :data-aos="section.settings?.aosAnim || undefined"
    :data-aos-delay="section.settings?.aosAnim ? (section.settings?.aosDelay || 0) : undefined"
    :class="[
      section.settings?.classes,
      section.params?.cssClass,
      section.params?.animation ? ('sf-anim-' + section.params.animation) : '',
      section.id ? 'sf-node-' + section.id : '',
      {
        'sf-full-width': section.params?.fullWidth,
        'hide-desktop': section.params?.hideDesktop,
        'hide-tablet': section.params?.hideTablet,
        'hide-mobile': section.params?.hideMobile
      }
    ]"
    v-bind="primitiveAttrs"
  >
    <template v-if="section.children && section.children.length > 0">
      <SectionRenderer
        v-for="(child, index) in section.children"
        :key="child.id || `${child.type}-${index}`"
        :section="child"
        :loop-context="loopContext"
      />
    </template>
    <template v-else-if="interpolatedContent !== undefined && interpolatedContent !== null && interpolatedContent !== ''">
      <template v-if="['text', 'heading', 'link', 'button'].includes(section.type)">
        <span v-html="interpolatedContent"></span>
      </template>
      <template v-else>{{ interpolatedContent }}</template>
    </template>
  </component>

  <div
    v-else-if="component"
    ref="sectionEl"
    :id="section.params?.anchorId"
    :class="[
      'sf-section',
      section.id ? 'sf-node-' + section.id : '',
      section.params?.cssClass,
      section.params?.animation ? ('sf-anim-' + section.params.animation) : '',
      {
        'sf-full-width': section.params?.fullWidth,
        'hide-desktop': section.params?.hideDesktop,
        'hide-tablet': section.params?.hideTablet,
        'hide-mobile': section.params?.hideMobile
      }
    ]"
    :style="sectionWrapStyle"
    :data-builder-id="section.id"
    :data-section-type="section.type"
    :data-section-index="section.order ?? 0"
    :data-aos="section.settings?.aosAnim || undefined"
    :data-aos-delay="section.settings?.aosAnim ? (section.settings?.aosDelay || 0) : undefined"
  >
    <component
      :is="component"
      :params="resolvedParams"
      :content="resolvedContent"
      :section="section"
    >
      <template v-if="section.children && section.children.length > 0">
        <SectionRenderer
          v-for="(child, index) in section.children"
          :key="child.id || `${child.type}-${index}`"
          :section="child"
          :loop-context="loopContext"
        />
      </template>
    </component>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, inject, ref, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import SectionRenderer from './SectionRenderer.vue'

const props = defineProps({
  section: {
    type: Object,
    required: true,
  },
  loopContext: {
    type: Object,
    default: null
  }
})

const { currentLang, defaultLangCode } = useI18n()
const injectedPluginSections = inject('pluginSections', ref([]))
const sectionEl = ref(null)

// ── Scroll animation observer ──
let animObserver = null
onMounted(() => {
  if (!props.section.params?.animation || !sectionEl.value) return
  animObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        entry.target.classList.add('sf-anim-visible')
        animObserver?.unobserve(entry.target)
      }
    }
  }, { threshold: 0.15 })
  animObserver.observe(sectionEl.value)
})
onBeforeUnmount(() => {
  animObserver?.disconnect()
})

/**
 * Normalize hyphen types to underscore canonical form (or vice versa).
 * This keeps the registry DRY — no need to register both variants.
 * Backend (PluginResolverRegistrar) uses underscore as canonical.
 */
const TYPE_ALIASES = {
  'featured-products':  'featured_products',
  'product-listing':    'product_listing',
  'product-categories': 'product_categories',
  'blog-collection':    'blog_collection',
  'latest-posts':       'latest_posts',
  'new-arrivals':       'new_arrivals',
  'flash-sale':         'flash_sale',
  'cms-pages':          'cms_pages',
  'blog-posts':         'blog_posts',
}

/**
 * P3 – Component whitelist: chỉ render component có trong registry.
 * Lazy load để tối ưu bundle size.
 *
 * Canonical type format: underscore (featured_products, blog_posts, …)
 * Block-builder hyphen types (hero-banner, rich-text, …) are kept as-is
 * since they have no underscore equivalent.
 */
const coreRegistry = {
  // ── Core sections (underscore canonical) ──
  banner:             defineAsyncComponent(() => import('../views/sections/BannerSection.vue')),
  categories:         defineAsyncComponent(() => import('../views/sections/CategoriesSection.vue')),
  flash_sale:         defineAsyncComponent(() => import('./FlashSale.vue')),
  featured_products:  defineAsyncComponent(() => import('../views/sections/FeaturedProductsSection.vue')),
  new_arrivals:       defineAsyncComponent(() => import('../views/sections/NewArrivalsSection.vue')),
  cms_pages:          defineAsyncComponent(() => import('../views/sections/CmsPagesSection.vue')),
  blog_posts:         defineAsyncComponent(() => import('../views/sections/BlogPostsSection.vue')),
  blog_collection:    defineAsyncComponent(() => import('../views/sections/BlogCollectionSection.vue')),
  latest_posts:       defineAsyncComponent(() => import('../views/sections/BlogCollectionSection.vue')),
  product_listing:    defineAsyncComponent(() => import('../views/sections/ProductListingSection.vue')),
  product_categories: defineAsyncComponent(() => import('../views/sections/ProductCategoriesSection.vue')),

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
  feature_links: defineAsyncComponent(() => import('./sections/HomeSectionFeatureLinks.vue')),
  image_banner:  defineAsyncComponent(() => import('./sections/HomeSectionImageBanner.vue')),

  // ── Structural ──
  custom_block: defineAsyncComponent(() => import('../views/sections/CustomBlockSection.vue')),
  grid:         defineAsyncComponent(() => import('./sections/GridSection.vue')),

  // ── Block-builder types with no underscore equivalent ──
  'hero-banner': defineAsyncComponent(() => import('../views/sections/HeroBannerSection.vue')),
  'rich-text':   defineAsyncComponent(() => import('../views/sections/RichTextSection.vue')),
  'spacer':      defineAsyncComponent(() => import('../views/sections/SpacerSection.vue')),
  'html-embed':  defineAsyncComponent(() => import('../views/sections/HtmlEmbedSection.vue')),
}

const component = computed(() => {
  // 1. Plugin-injected component (Bridge Pattern)
  if (props.section._pluginComponent) {
    return props.section._pluginComponent
  }

  // Normalize type: hyphen aliases → underscore canonical
  const type = TYPE_ALIASES[props.section.type] ?? props.section.type

  // 2. Fallback injected array (older pattern)
  const pluginMatch = injectedPluginSections.value.find(p => p.type === type || p.type === props.section.type)
  if (pluginMatch?.component) {
    return pluginMatch.component
  }

  // 3. Core registry — P3: chỉ render component có trong registry
  return coreRegistry[type] || null
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

const paddingMap = { sm: '16px 0', md: '32px 0', lg: '48px 0', xl: '64px 0' }

const sectionWrapStyle = computed(() => {
  const p = resolvedParams.value
  if (!p) return {}
  const bgColor = p.sectionBgColor || p.bgColor || undefined
  const padKey = p.sectionPadding
  return {
    padding: padKey && paddingMap[padKey] ? paddingMap[padKey] : undefined,
    paddingTop: p.paddingTop ? `${p.paddingTop}px` : undefined,
    paddingBottom: p.paddingBottom ? `${p.paddingBottom}px` : undefined,
    marginTop: p.marginTop ? `${p.marginTop}px` : undefined,
    marginBottom: p.marginBottom ? `${p.marginBottom}px` : undefined,
    backgroundColor: bgColor,
    backgroundImage: p.bgImage ? `url(${p.bgImage})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
})

// === Cấu trúc Primitive Nodes ===
const PRIMITIVE_TYPES = {
  container: 'div',
  card: 'div',
  row: 'div',
  col: 'div',
  grid: 'div',
  text: 'p',
  heading: 'h2',
  image: 'img',
  button: 'button',
  link: 'a',
  divider: 'hr',
  iframe: 'iframe',
  video: 'video'
}
const isPrimitiveNode = computed(() => !!PRIMITIVE_TYPES[props.section.type])
// === Interpolation Logic ===
function interpolateContext(str, context) {
  if (!str || typeof str !== 'string' || !context) return str;
  return str.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, path) => {
    let val = { item: context }; // Wraps context so {{ item.name }} works
    let fallback = false;
    const keys = path.split('.');
    for (const k of keys) {
      if (val == null) {
        fallback = true;
        break;
      }
      val = val[k];
    }
    return (!fallback && val !== undefined && val !== null) ? val : match;
  });
}

const interpolatedContent = computed(() => {
  if (typeof props.section.content === 'string') {
    return interpolateContext(props.section.content, props.loopContext)
  }
  return props.section.content
})

const getInterpSetting = (key) => {
  const val = props.section.settings?.[key];
  if (typeof val === 'string') return interpolateContext(val, props.loopContext);
  return val;
}

const primitiveTag = computed(() => getInterpSetting('tag') || PRIMITIVE_TYPES[props.section.type] || 'div')
const primitiveAttrs = computed(() => {
  const t = props.section.type
  const attrs = {}
  if (t === 'image' && props.section.settings?.src) {
    attrs.src = getInterpSetting('src')
    attrs.alt = getInterpSetting('alt') || ''
  } else if (t === 'link') {
    attrs.href = getInterpSetting('href') || '#'
    attrs.target = getInterpSetting('target') || '_self'
  } else if (t === 'iframe' && props.section.settings?.src) {
    attrs.src = getInterpSetting('src')
    attrs.frameborder = '0'
    attrs.allowfullscreen = true
  } else if (t === 'video') {
    attrs.src = getInterpSetting('src') || ''
    if (getInterpSetting('autoplay')) attrs.autoplay = true
    if (getInterpSetting('loop')) attrs.loop = true
    if (getInterpSetting('muted')) attrs.muted = true
    if (getInterpSetting('controls') !== false) attrs.controls = true
  }
  return attrs
})
</script>

<style scoped>
/* ── Full Width ── */
.sf-full-width {
  width: 100vw;
  position: relative;
  left: 50%;
  right: 50%;
  margin-left: -50vw;
  margin-right: -50vw;
}

/* ── Scroll Animations ── */
.sf-anim-fade-up,
.sf-anim-fade-in,
.sf-anim-slide-left,
.sf-anim-slide-right,
.sf-anim-zoom-in {
  opacity: 0;
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.sf-anim-fade-up { transform: translateY(30px); }
.sf-anim-slide-left { transform: translateX(-40px); }
.sf-anim-slide-right { transform: translateX(40px); }
.sf-anim-zoom-in { transform: scale(0.92); }

.sf-anim-fade-up.sf-anim-visible,
.sf-anim-fade-in.sf-anim-visible,
.sf-anim-slide-left.sf-anim-visible,
.sf-anim-slide-right.sf-anim-visible,
.sf-anim-zoom-in.sf-anim-visible {
  opacity: 1;
  transform: none;
}

/* ── Responsive Visibility ── */
@media (min-width: 1025px) {
  .hide-desktop { display: none !important; }
}
@media (min-width: 768px) and (max-width: 1024px) {
  .hide-tablet { display: none !important; }
}
@media (max-width: 767px) {
  .hide-mobile { display: none !important; }
}
</style>
