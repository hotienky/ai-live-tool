<template>
  <div class="home-page">
    <!-- SEO H1 (visually part of hero, but critical for heading hierarchy) -->
    <h1 class="sr-only">{{ t('storefront.home_seo_title') || 'Cửa hàng trực tuyến — Sản phẩm chất lượng cao' }}</h1>

    <!-- Dynamic sections rendered in configured order -->
    <template v-for="section in activeSections" :key="section.type + '-' + section.order">
      <div :id="section.params?.anchorId || undefined" :class="section.params?.cssClass || undefined" :style="sectionWrapStyle(section.params)">

      <!-- Banner -->
      <section v-if="section.type === 'banner'" class="home-hero container">
        <div v-if="loading" class="banner-skeleton">
          <div class="skeleton" style="width:100%;aspect-ratio:21/7;border-radius:16px"></div>
        </div>
        <BannerSlider
          v-else
          :banners="banners"
          :autoplay="section.params?.autoplay !== false"
          :interval="section.params?.interval || 5000"
        />
      </section>

      <!-- Categories -->
      <template v-if="section.type === 'categories'">
        <section class="home-section container" v-if="loading">
          <div class="skeleton" style="height:22px;width:200px;margin-bottom:16px;border-radius:6px"></div>
          <div style="display:flex;gap:14px">
            <div v-for="i in 6" :key="i" class="skeleton" style="width:120px;height:100px;border-radius:12px;flex-shrink:0"></div>
          </div>
        </section>
        <section class="home-section container" v-else-if="filteredCategories(section).length > 0">
          <h2 class="section-title">
            <Grid :size="22" class="section-title__accent" />
            {{ t('storefront.categories') || 'Danh mục sản phẩm' }}
          </h2>
          <CategoryGrid :categories="filteredCategories(section)" />
        </section>
      </template>

      <!-- Flash Sale -->
      <div v-if="section.type === 'flash_sale'" class="container">
        <FlashSale :params="section.params" />
      </div>

      <!-- Featured Products -->
      <section v-if="section.type === 'featured_products'" class="home-section container">
        <div class="home-section__header">
          <h2 class="section-title">
            <Sparkles :size="22" class="section-title__accent" />
            {{ rp(section)?.title || t('storefront.featured_products') || 'Sản phẩm nổi bật' }}
          </h2>
          <router-link :to="'/products'" class="home-section__viewall">
            {{ t('storefront.view_all') || 'Xem tất cả' }} <ArrowRight :size="14" />
          </router-link>
        </div>
        <div v-if="loading" class="product-skeleton-grid">
          <div v-for="i in (section.params?.count || 8)" :key="i" class="product-skeleton">
            <div class="skeleton" style="aspect-ratio:1"></div>
            <div class="skeleton" style="height:14px;width:70%;margin-top:12px"></div>
            <div class="skeleton" style="height:18px;width:40%;margin-top:8px"></div>
          </div>
        </div>
        <div v-else-if="products.length > 0" class="product-grid" :style="gridStyle(section.params?.columns)">
          <ProductCard v-for="p in products.slice(0, section.params?.count || 8)" :key="p.id" :product="p" />
        </div>
        <div v-else class="home-empty">
          <Package :size="48" />
          <p>{{ t('storefront.no_products') || 'Chưa có sản phẩm nào' }}</p>
        </div>
      </section>

      <!-- New Arrivals -->
      <section v-if="section.type === 'new_arrivals' && newProducts.length > 0" class="home-section container">
        <div class="home-section__header">
          <h2 class="section-title">
            <Clock :size="22" class="section-title__accent" />
            {{ rp(section)?.title || t('storefront.new_arrivals') || 'Hàng mới về' }}
          </h2>
        </div>
        <div class="product-grid" :style="gridStyle(section.params?.columns)">
          <ProductCard v-for="p in newProducts.slice(0, section.params?.count || 6)" :key="p.id" :product="p" />
        </div>
      </section>

      <!-- CMS Pages (requires cms module) -->
      <section v-if="section.type === 'cms_pages' && pages.length > 0" class="home-section container">
        <h2 class="section-title">
          <BookOpen :size="22" class="section-title__accent" />
          {{ t('storefront.info') || 'Thông tin' }}
        </h2>
        <div class="home-pages" :class="{ 'home-pages--list': section.params?.layout === 'list' }">
          <router-link
            v-for="pg in pages.slice(0, section.params?.maxPages || 6)"
            :key="pg.id"
            :to="`/page/${pg.alias || pg.id}`"
            class="home-page-card"
          >
            <img v-if="pg.image" :src="pg.image" :alt="pg.title" class="home-page-card__img" />
            <div v-else class="home-page-card__img home-page-card__img--empty">
              <FileText :size="28" />
            </div>
            <div class="home-page-card__info">
              <h4>{{ pg.title }}</h4>
              <span class="home-page-card__date">{{ formatDate(pg.created_at) }}</span>
            </div>
          </router-link>
        </div>
      </section>

      <!-- Blog Posts (requires blog module) -->
      <section v-if="section.type === 'blog_posts' && blogPosts.length > 0" class="home-section container">
        <div class="home-section__header">
          <h2 class="section-title">
            <BookOpen :size="22" class="section-title__accent" />
            {{ rp(section)?.title || t('storefront.latest_posts') || 'Bài viết mới nhất' }}
          </h2>
          <router-link to="/blog" class="home-section__viewall">
            {{ t('storefront.view_all') || 'Xem tất cả' }} <ArrowRight :size="14" />
          </router-link>
        </div>
        <div class="home-pages">
          <router-link
            v-for="post in blogPosts.slice(0, section.params?.count || 6)"
            :key="post.id"
            :to="`/blog/${post.slug || post.id}`"
            class="home-page-card"
          >
            <img v-if="post.featured_image || post.image" :src="post.featured_image || post.image" :alt="post.title" class="home-page-card__img" />
            <div v-else class="home-page-card__img home-page-card__img--empty">
              <BookOpen :size="28" />
            </div>
            <div class="home-page-card__info">
              <h4>{{ post.title }}</h4>
              <span class="home-page-card__date">{{ formatDate(post.published_at || post.created_at) }}</span>
            </div>
          </router-link>
        </div>
      </section>

      <!-- ═══ Custom Library Sections ═══ -->
      <HomeSectionTestimonials
        v-if="section.type === 'testimonials'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionFaq
        v-if="section.type === 'faq'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionGallery
        v-if="section.type === 'image_gallery'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionVideo
        v-if="section.type === 'video_embed'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionTextBlock
        v-if="section.type === 'text_block'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionNewsletter
        v-if="section.type === 'newsletter'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionSocial
        v-if="section.type === 'social_feed'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionBrands
        v-if="section.type === 'brands_slider'"
        :params="rp(section)"
        :content="rc(section)"
      />
      <HomeSectionTrustBadges
        v-if="section.type === 'trust_badges'"
        :params="rp(section)"
        :content="rc(section)"
      />

      <!-- Custom Block (Visual Builder HTML) -->
      <div
        v-if="section.type === 'custom_block' && (section.content || rp(section).title)"
        class="container custom-block-section"
      >
        <h2 v-if="rp(section).title" class="section-title">{{ rp(section).title }}</h2>
        <ShortcodeRenderer class="custom-block-content" :html="rc(section)" />
      </div>

      <!-- Plugin-provided sections (from storefront.js bundles) -->
      <component
        v-if="section._pluginComponent"
        :is="section._pluginComponent"
        :params="rp(section)"
        :content="rc(section)"
        :section="section"
      />
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { apiFetch } from '../api.js'
import BannerSlider from '../components/BannerSlider.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import ProductCard from '../components/ProductCard.vue'
import ProductCarousel from '../components/ProductCarousel.vue'
import FlashSale from '../components/FlashSale.vue'
import { useSeo } from '../composables/useSeo.js'
import { useI18n } from '../composables/useI18n.js'
import { useSanitize } from '../composables/useSanitize.js'
import { Grid, Sparkles, ArrowRight, Package, Clock, BookOpen, FileText } from 'lucide-vue-next'
import { useModules } from '../composables/useModules.js'

const { t, currentLang, defaultLangCode } = useI18n()
const { isEcom, isBlog, isCms, hasModule } = useModules()
const { sanitize } = useSanitize()

// Inject plugin sections from App.vue (loaded via __SF_BRIDGE__)
const injectedPluginSections = inject('pluginSections', ref([]))

// ── Section type → required module mapping ──
const sectionModuleMap = {
  categories: 'ecom',
  flash_sale: 'ecom',
  featured_products: 'ecom',
  new_arrivals: 'ecom',
  cms_pages: 'cms',
  blog_posts: 'blog',
  // banner, testimonials, faq, gallery, video, text_block, newsletter, social, brands_slider, trust_badges → always allowed
}

// ── Resolve section translations based on current storefront language ──
function rp(section) {
  const lang = currentLang.value
  if (!lang || lang === defaultLangCode.value) return section.params || {}
  const tp = section.translations?.[lang]?.params
  if (!tp) return section.params || {}
  const merged = { ...(section.params || {}) }
  for (const [k, v] of Object.entries(tp)) {
    if (v && String(v).trim()) merged[k] = v
  }
  return merged
}

function rc(section) {
  const lang = currentLang.value
  if (!lang || lang === defaultLangCode.value) return section.content
  const tc = section.translations?.[lang]?.content
  if (!tc) return section.content
  if (Array.isArray(tc) && Array.isArray(section.content)) {
    return section.content.map((item, i) => {
      if (!tc[i]) return item
      const merged = { ...item }
      for (const [k, v] of Object.entries(tc[i])) {
        if (v && String(v).trim()) merged[k] = v
      }
      return merged
    })
  }
  if (typeof tc === 'string' && tc.trim()) return tc
  return section.content
}

// Custom section components
import HomeSectionTestimonials from '../components/sections/HomeSectionTestimonials.vue'
import HomeSectionFaq from '../components/sections/HomeSectionFaq.vue'
import HomeSectionGallery from '../components/sections/HomeSectionGallery.vue'
import HomeSectionVideo from '../components/sections/HomeSectionVideo.vue'
import HomeSectionTextBlock from '../components/sections/HomeSectionTextBlock.vue'
import HomeSectionNewsletter from '../components/sections/HomeSectionNewsletter.vue'
import HomeSectionSocial from '../components/sections/HomeSectionSocial.vue'
import HomeSectionBrands from '../components/sections/HomeSectionBrands.vue'
import HomeSectionTrustBadges from '../components/sections/HomeSectionTrustBadges.vue'
import ShortcodeRenderer from '../components/ShortcodeRenderer.vue'

const { setPageSeo } = useSeo()

const layoutConfig = inject('layoutConfig', ref(null))

const banners = ref([])
const categories = ref([])
const products = ref([])
const newProducts = ref([])
const pages = ref([])
const blogPosts = ref([])
const loading = ref(true)

// ── Dynamic default sections based on installed modules ──
const defaultSections = computed(() => {
  const sections = []
  let order = 0

  // Banner is always available
  sections.push({ type: 'banner', enabled: true, order: order++ })

  if (isEcom.value) {
    sections.push({ type: 'categories', enabled: true, order: order++ })
    sections.push({ type: 'flash_sale', enabled: true, order: order++ })
    sections.push({ type: 'featured_products', enabled: true, order: order++ })
    sections.push({ type: 'new_arrivals', enabled: true, order: order++ })
  }

  if (isBlog.value) {
    sections.push({ type: 'blog_posts', enabled: true, order: order++ })
  }

  if (isCms.value) {
    sections.push({ type: 'cms_pages', enabled: true, order: order++ })
  }

  sections.push({ type: 'trust_badges', enabled: true, order: order++ })
  return sections
})

const activeSections = computed(() => {
  const sections = layoutConfig.value?.sections || defaultSections.value
  const filtered = sections
    .filter(s => {
      if (!s.enabled) return false
      // Check if this section type requires a specific module
      const requiredModule = sectionModuleMap[s.type]
      if (requiredModule && !hasModule(requiredModule)) return false
      return true
    })

  // Merge plugin-provided sections (from storefront.js bundles)
  const pluginSects = (injectedPluginSections.value || []).map(ps => ({
    type: ps.type || `plugin_${ps.moduleId}`,
    enabled: true,
    order: ps.order ?? 999,
    params: ps.params || {},
    _pluginComponent: ps.component,
    moduleId: ps.moduleId,
  }))

  return [...filtered, ...pluginSects].sort((a, b) => a.order - b.order)
})

function gridStyle(columns) {
  if (!columns) return {}
  return { gridTemplateColumns: `repeat(${columns}, 1fr)` }
}

const paddingMap = { sm: '16px 0', md: '32px 0', lg: '48px 0', xl: '64px 0' }
function sectionWrapStyle(params) {
  if (!params) return {}
  const s = {}
  if (params.sectionBgColor) s.background = params.sectionBgColor
  if (params.sectionPadding) s.padding = paddingMap[params.sectionPadding] || ''
  return s
}

function filteredCategories(section) {
  const ids = section.params?.selectedCategoryIds
  if (!ids || !ids.length) return categories.value
  return categories.value.filter(c => ids.includes(c.id))
}

async function loadAll() {
  loading.value = true
  try {
    const fetches = [
      apiFetch('/banners').catch(() => []),
    ]

    // Only fetch e-commerce data if ecom module is installed
    if (isEcom.value) {
      fetches.push(
        apiFetch('/categories').catch(() => []),
        apiFetch('/products', { limit: 16, sort: 'created_at', order: 'desc' }).catch(() => []),
        apiFetch('/products', { limit: 12, sort: 'created_at', order: 'desc', page: 1 }).catch(() => []),
      )
    } else {
      fetches.push(Promise.resolve([]), Promise.resolve([]), Promise.resolve([]))
    }

    // Only fetch CMS pages if cms module is installed
    if (isCms.value) {
      fetches.push(apiFetch('/pages').catch(() => []))
    } else {
      fetches.push(Promise.resolve([]))
    }

    // Only fetch blog posts if blog module is installed
    if (isBlog.value) {
      fetches.push(apiFetch('/blog/posts', { limit: 6, sort: 'published_at', order: 'desc' }).catch(() => []))
    } else {
      fetches.push(Promise.resolve([]))
    }

    const [bannersRes, catsRes, prodsRes, newRes, pagesRes, postsRes] = await Promise.all(fetches)
    banners.value = bannersRes || []
    categories.value = catsRes || []
    const prodData = prodsRes || []
    products.value = Array.isArray(prodData) ? prodData : (prodData.data || [])
    const newData = newRes || []
    newProducts.value = Array.isArray(newData) ? newData : (newData.data || [])
    pages.value = pagesRes || []
    const postData = postsRes || []
    blogPosts.value = Array.isArray(postData) ? postData : (postData.data || [])
  } catch { /* ignore */ }
  loading.value = false

  setPageSeo({
    title: 'Trang chủ — Cửa hàng trực tuyến',
    description: 'Khám phá các sản phẩm thời trang chất lượng cao, giá tốt nhất. Miễn phí giao hàng cho đơn từ 500K.',
    type: 'website',
  })
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => loadAll())
</script>

<style scoped>
.home-page { padding-bottom: 60px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

.home-hero { padding-top: 24px; padding-bottom: 8px; }
.banner-skeleton { border-radius: 16px; overflow: hidden; }

.home-section { padding-top: 40px; }

.home-section__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}
.home-section__header .section-title { margin-bottom: 0; }

.home-section__viewall {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--sf-accent-light);
  transition: all 0.2s; text-decoration: none;
}
.home-section__viewall:hover { color: #fff; gap: 10px; }

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

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

/* CMS pages */
.home-pages {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}
.home-pages--list {
  grid-template-columns: 1fr;
}

.home-page-card {
  display: flex; gap: 14px; padding: 16px; border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  transition: all var(--sf-transition); text-decoration: none; color: inherit;
}
.home-page-card:hover { border-color: var(--sf-accent); transform: translateY(-2px); box-shadow: var(--sf-shadow-sm); }

.home-page-card__img { width: 80px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.home-page-card__img--empty {
  display: flex; align-items: center; justify-content: center;
  background: var(--sf-bg-card-hover); color: var(--sf-text-muted);
}

.home-page-card__info h4 { font-size: 14px; font-weight: 700; margin: 0 0 4px; line-height: 1.3; }
.home-page-card__date { font-size: 11px; color: var(--sf-text-muted); }

/* Empty */
.home-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px; color: var(--sf-text-muted); text-align: center;
}
.home-empty p { font-size: 15px; font-weight: 600; }

/* Tablet */
@media (max-width: 1024px) {
  .product-grid, .product-skeleton-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .home-pages { grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); }
}
/* Mobile */
@media (max-width: 768px) {
  .product-grid, .product-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .home-pages { grid-template-columns: 1fr; }
  .home-section { padding-top: 24px; }
  .home-section__header { margin-bottom: 16px; }
}
</style>
