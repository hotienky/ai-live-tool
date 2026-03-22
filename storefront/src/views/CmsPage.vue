<template>
  <div class="cms-page">
    <!-- Breadcrumb (only for static pages or if configured) -->
    <nav class="breadcrumb container" v-if="page && !page.is_dynamic" style="margin-top: 24px">
      <router-link :to="'/'">{{ t('storefront.home') || 'Trang chủ' }}</router-link>
      <ChevronRight :size="12" />
      <span>{{ page.title || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="cms-loading container" style="margin-top: 24px">
      <div class="skeleton" style="height:32px;width:60%;margin-bottom:16px"></div>
      <div class="skeleton" style="height:200px;width:100%"></div>
    </div>

    <!-- Page Content -->
    <div v-else-if="page">
      
      <!-- ─── DYNAMIC PAGE LAYOUT (Shopify-style) ─── -->
      <div v-if="page.is_dynamic" class="dynamic-page-wrap">
        <h1 class="sr-only">{{ page.title }}</h1>
        <template v-for="section in activeSections" :key="section.type + '-' + section.order">
          <div :id="section.params?.anchorId || undefined" :class="section.params?.cssClass || undefined" :style="sectionWrapStyle(section.params)">

            <!-- Banner -->
            <section v-if="section.type === 'banner'" class="home-hero container">
              <BannerSlider
                :banners="banners"
                :autoplay="section.params?.autoplay !== false"
                :interval="section.params?.interval || 5000"
              />
            </section>

            <!-- Categories -->
            <template v-if="section.type === 'categories'">
              <section class="home-section container" v-if="filteredCategories(section).length > 0">
                <h2 class="section-title">
                  <Grid :size="22" class="section-title__accent" />
                  {{ t('storefront.product_categories') || 'Danh mục sản phẩm' }}
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
                  {{ section.params?.title || t('storefront.featured_products') || 'Sản phẩm nổi bật' }}
                </h2>
                <router-link :to="'/products'" class="home-section__viewall">
                  {{ t('storefront.view_all') || 'Xem tất cả' }} <ArrowRight :size="14" />
                </router-link>
              </div>
              <div v-if="products.length > 0" class="product-grid" :style="gridStyle(section.params?.columns)">
                <ProductCard v-for="p in products.slice(0, section.params?.count || 8)" :key="p.id" :product="p" />
              </div>
            </section>

            <!-- New Arrivals -->
            <section v-if="section.type === 'new_arrivals' && newProducts.length > 0" class="home-section container">
              <div class="home-section__header">
                <h2 class="section-title">
                  <Clock :size="22" class="section-title__accent" />
                  {{ section.params?.title || t('storefront.new_arrivals') || 'Hàng mới về' }}
                </h2>
              </div>
              <div class="product-grid">
                <ProductCard v-for="p in newProducts.slice(0, section.params?.count || 4)" :key="p.id" :product="p" />
              </div>
            </section>

            <!-- CMS Pages -->
            <section v-if="section.type === 'cms_pages' && cmsPagesList.length > 0" class="home-section container">
              <h2 class="section-title">
                <BookOpen :size="22" class="section-title__accent" />
                {{ t('storefront.information') || 'Thông tin' }}
              </h2>
              <div class="home-pages" :class="{ 'home-pages--list': section.params?.layout === 'list' }">
                <router-link
                  v-for="pg in cmsPagesList.slice(0, section.params?.maxPages || 6)"
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

            <!-- Custom Library Sections -->
            <HomeSectionTestimonials v-if="section.type === 'testimonials'" :params="section.params" :content="section.content" />
            <HomeSectionFaq v-if="section.type === 'faq'" :params="section.params" :content="section.content" />
            <HomeSectionGallery v-if="section.type === 'image_gallery'" :params="section.params" :content="section.content" />
            <HomeSectionVideo v-if="section.type === 'video_embed'" :params="section.params" :content="section.content" />
            <HomeSectionTextBlock v-if="section.type === 'text_block'" :params="section.params" :content="section.content" />
            <HomeSectionNewsletter v-if="section.type === 'newsletter'" :params="section.params" :content="section.content" />
            <HomeSectionSocial v-if="section.type === 'social_feed'" :params="section.params" :content="section.content" />
            <HomeSectionBrands v-if="section.type === 'brands_slider'" :params="section.params" :content="section.content" />
            <HomeSectionTrustBadges v-if="section.type === 'trust_badges'" :params="section.params" :content="section.content" />

            <!-- Custom Block (Visual Builder HTML) -->
            <div
              v-if="section.type === 'custom_block' && (section.content || section.params?.title)"
              class="container custom-block-section"
            >
              <h2 v-if="section.params?.title" class="section-title">{{ section.params.title }}</h2>
              <ShortcodeRenderer class="custom-block-content" :html="section.content" />
            </div>

          </div>
        </template>
      </div>

      <!-- ─── STATIC PAGE LAYOUT (WYSIWYG) ─── -->
      <article v-else class="cms-article container">
        <header class="cms-header">
          <h1>{{ page.title }}</h1>
          <time v-if="page.created_at" class="cms-date">
            <Calendar :size="14" />
            {{ formatDate(page.created_at) }}
          </time>
        </header>
        <div class="cms-banner" v-if="page.image">
          <img :src="page.image" :alt="page.title" />
        </div>
        <ShortcodeRenderer class="cms-body" :html="page.content" />
      </article>

    </div>

    <!-- Not Found -->
    <div v-else class="cms-404 container" style="margin-top: 24px">
      <FileQuestion :size="64" />
      <h2>{{ t('storefront.page_not_found') || 'Trang không tồn tại' }}</h2>
      <router-link :to="'/'" class="btn btn--primary">
        <ArrowLeft :size="16" /> {{ t('storefront.back_home') || 'Về trang chủ' }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { apiFetch } from '../api.js'
import { useSeo } from '../composables/useSeo.js'
import { ChevronRight, Calendar, FileQuestion, ArrowLeft, Grid, Sparkles, ArrowRight, Package, Clock, BookOpen, FileText } from 'lucide-vue-next'

import BannerSlider from '../components/BannerSlider.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import ProductCard from '../components/ProductCard.vue'
import FlashSale from '../components/FlashSale.vue'

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
import { useI18n } from '../composables/useI18n.js'
import { useSanitize } from '../composables/useSanitize.js'

const { t } = useI18n()
const { sanitize } = useSanitize()
const { setPageSeo } = useSeo()

const props = defineProps({
  slug: { type: String, required: true },
})

const page = ref(null)
const loading = ref(true)

// Dynamic Page Data
const banners = ref([])
const categories = ref([])
const products = ref([])
const newProducts = ref([])
const cmsPagesList = ref([])

const activeSections = computed(() => {
  if (!page.value || !page.value.layout_data) return []
  return (Array.isArray(page.value.layout_data) ? page.value.layout_data : [])
    .filter(s => s.enabled)
    .sort((a, b) => a.order - b.order)
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

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function loadDependencies() {
  // Only load if the page is dynamic
  try {
    const [bannersRes, catsRes, prodsRes, newRes, pagesRes] = await Promise.allSettled([
      apiFetch('/banners'),
      apiFetch('/categories'),
      apiFetch('/products', { limit: 16, sort: 'created_at', order: 'desc' }),
      apiFetch('/products', { limit: 12, sort: 'created_at', order: 'desc', page: 1 }),
      apiFetch('/pages'),
    ])
    banners.value = bannersRes.status === 'fulfilled' ? bannersRes.value : []
    categories.value = catsRes.status === 'fulfilled' ? catsRes.value : []
    const prodData = prodsRes.status === 'fulfilled' ? prodsRes.value : []
    products.value = Array.isArray(prodData) ? prodData : (prodData.data || [])
    const newData = newRes.status === 'fulfilled' ? newRes.value : []
    newProducts.value = Array.isArray(newData) ? newData : (newData.data || [])
    cmsPagesList.value = pagesRes.status === 'fulfilled' ? pagesRes.value : []
  } catch { /* ignore */ }
}

async function loadPage() {
  loading.value = true
  try {
    page.value = await apiFetch(`/pages/${props.slug}`)
    if (page.value?.title) {
      document.title = `${page.value.title} — Cửa hàng`
      setPageSeo({
        title: page.value.title + ' — Cửa hàng',
        description: page.value.meta_description || page.value.content?.replace(/<[^>]*>/g, '').slice(0, 160) || '',
        keywords: page.value.meta_keywords || '',
      })
    }

    if (page.value?.is_dynamic) {
      await loadDependencies()
    }
  } catch (err) {
    console.error('[CmsPage] Load failed:', err)
    page.value = null
  }
  loading.value = false
}

onMounted(() => loadPage())
watch(() => props.slug, () => loadPage())
</script>

<style scoped>
.cms-page { padding-bottom: 60px; }
.dynamic-page-wrap { padding-top: 0; }

.breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-muted); margin-bottom: 24px;
}
.breadcrumb a { color: var(--sf-text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--sf-accent-light); }
.breadcrumb span { color: var(--sf-text-primary); font-weight: 600; }

.cms-article { max-width: 840px; margin: 0 auto; padding-top: 24px; }
.cms-header { margin-bottom: 24px; }
.cms-header h1 { font-size: 32px; font-weight: 900; line-height: 1.2; margin: 0 0 8px; }

.cms-date {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--sf-text-muted);
}

.cms-banner { margin-bottom: 24px; border-radius: var(--sf-radius-lg); overflow: hidden; }
.cms-banner img { width: 100%; aspect-ratio: 21/9; object-fit: cover; }

.cms-body { font-size: 16px; line-height: 1.8; color: var(--sf-text-secondary); }
.cms-body :deep(h2) { font-size: 22px; font-weight: 800; margin: 32px 0 12px; color: var(--sf-text-primary); }
.cms-body :deep(h3) { font-size: 18px; font-weight: 700; margin: 24px 0 8px; color: var(--sf-text-primary); }
.cms-body :deep(p) { margin: 0 0 16px; }
.cms-body :deep(img) { border-radius: var(--sf-radius-md); margin: 16px 0; }
.cms-body :deep(ul), .cms-body :deep(ol) { padding-left: 24px; margin: 0 0 16px; }
.cms-body :deep(a) { color: var(--sf-accent-light); }
.cms-body :deep(a:hover) { text-decoration: underline; }
.cms-body :deep(blockquote) {
  border-left: 3px solid var(--sf-accent); padding: 12px 20px;
  margin: 16px 0; background: var(--sf-accent-glow); border-radius: 0 var(--sf-radius-sm) var(--sf-radius-sm) 0;
  font-style: italic; color: var(--sf-text-secondary);
}

.cms-loading { max-width: 840px; margin: 0 auto; }
.cms-404 {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 100px; color: var(--sf-text-muted); text-align: center;
}
.cms-404 h2 { color: var(--sf-text-primary); }
.cms-404 a { text-decoration: none; }

/* Dynamic section styles (mirrored from HomePage) */
.home-hero { margin-top: 20px; margin-bottom: 40px; }
.home-section { margin-bottom: 60px; }
.home-section__header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 24px; }
.section-title { font-size: 24px; font-weight: 900; margin: 0; display: flex; align-items: center; gap: 10px; color: var(--sf-text-primary); }
.section-title__accent { color: var(--sf-accent); }
.home-section__viewall { display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--sf-text-secondary); text-decoration: none; transition: all var(--sf-transition); }
.home-section__viewall:hover { color: var(--sf-accent-light); transform: translateX(2px); }

.product-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.home-pages { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
.home-pages--list { grid-template-columns: 1fr; }
.home-page-card { display: flex; flex-direction: column; border-radius: var(--sf-radius-lg); background: var(--sf-bg-card); border: 1px solid var(--sf-border); overflow: hidden; text-decoration: none; color: inherit; transition: all var(--sf-transition); }
.home-page-card:hover { transform: translateY(-4px); box-shadow: var(--sf-shadow-md); border-color: var(--sf-accent-light); }
.home-pages--list .home-page-card { flex-direction: row; align-items: center; padding: 16px; gap: 16px; }
.home-page-card__img { width: 100%; aspect-ratio: 16/9; object-fit: cover; }
.home-pages--list .home-page-card__img { width: 120px; aspect-ratio: 4/3; border-radius: 8px; }
.home-page-card__img--empty { display: flex; align-items: center; justify-content: center; background: var(--sf-accent-glow); color: var(--sf-accent); }
.home-page-card__info { padding: 16px; flex: 1; }
.home-page-card__info h4 { margin: 0 0 8px; font-size: 16px; font-weight: 700; color: var(--sf-text-primary); }
.home-page-card__date { font-size: 12px; color: var(--sf-text-muted); }

@media (max-width: 1024px) {
  .product-grid { grid-template-columns: repeat(3, 1fr) !important; }
}
@media (max-width: 768px) {
  .cms-header h1 { font-size: 24px; }
  .cms-body { font-size: 15px; }
  .product-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 12px; }
  .section-title { font-size: 20px; }
}
</style>
