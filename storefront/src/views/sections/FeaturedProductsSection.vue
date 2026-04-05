<template>
  <section class="home-section container" v-if="productsData.length > 0" :class="['layout-' + (resolvedParams.layoutStyle || 'grid')]">
    <div class="home-section__header">
      <h2 class="section-title">
        <Sparkles :size="22" class="section-title__accent" />
        {{ resolvedParams.title || t('storefront.featured_products', 'Sản phẩm nổi bật') }}
      </h2>
      <router-link :to="resolvedParams.viewAllLink || '/products'" class="home-section__viewall">
        {{ t('storefront.view_all', 'Xem tất cả') }} <ArrowRight :size="14" />
      </router-link>
    </div>
    <!-- Carousel Layout -->
    <div v-if="resolvedParams.layoutStyle === 'carousel'" class="product-carousel">
      <ProductCard class="carousel-item" v-for="p in productsData" :key="p.id" :product="p" />
    </div>
    <!-- Grid Layout -->
    <div v-else class="product-grid" :style="gridVars">
      <ProductCard v-for="p in productsData" :key="p.id" :product="p" />
    </div>
  </section>
</template>

<script setup>
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import ProductCard from '../../components/ProductCard.vue'
import { Sparkles, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const isPreviewMode = inject('isPreviewMode', false)

// === Responsive logic ===
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const isMobile = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value > 768 && windowWidth.value <= 1024)

const resolvedParams = computed(() => {
  const p = { ...(props.params || {}) }
  const tablet = props.section.tabletParams || {}
  const mobile = props.section.mobileParams || {}
  
  if (isTablet.value || isMobile.value) {
    for (const k in tablet) if (tablet[k] !== undefined && tablet[k] !== '') p[k] = tablet[k]
  }
  if (isMobile.value) {
    for (const k in mobile) if (mobile[k] !== undefined && mobile[k] !== '') p[k] = mobile[k]
  }
  return p
})

// Dummy product generator for preview
const dummyProducts = Array.from({ length: 8 }).map((_, i) => ({
  id: `dummy-${i}`,
  name: `Sản phẩm mẫu ${i + 1}`,
  slug: `san-pham-mau-${i + 1}`,
  price: 199000 + i * 50000,
  base_price: 250000 + i * 50000,
  image: `https://loremflickr.com/400/400/product?random=${i}`,
  category: { name: 'Danh mục mẫu' },
  is_dummy: true
}))

const productsData = computed(() => {
  let allProducts = []
  if (props.params?.resolvedData) {
    allProducts = props.params.resolvedData
  } else {
    allProducts = window.__STOREFRONT_DATA__?.products || []
  }
  
  if (allProducts.length === 0 && isPreviewMode) {
    allProducts = dummyProducts
  }
  
  const count = resolvedParams.value.count || 8
  return allProducts.slice(0, count)
})

// Responsive grid columns
const responsiveCols = computed(() => {
  const desktopCols = resolvedParams.value.columns || 4
  if (isMobile.value) return Math.min(desktopCols, 2)
  if (isTablet.value) return Math.min(desktopCols, 3)
  return desktopCols
})

const gridVars = computed(() => ({
  '--grid-cols': responsiveCols.value,
}))
</script>

<style scoped>
/* ── Grid Layout ── */
.product-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 4), 1fr);
  gap: 16px;
}

/* ── Carousel Layout ── */
.product-carousel {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 16px;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
}
.product-carousel::-webkit-scrollbar {
  height: 6px;
}
.product-carousel::-webkit-scrollbar-track {
  background: var(--sf-bg-secondary, #f1f5f9);
  border-radius: 4px;
}
.product-carousel::-webkit-scrollbar-thumb {
  background: var(--sf-accent, #6366f1);
  border-radius: 4px;
}

.carousel-item {
  scroll-snap-align: start;
  flex: 0 0 220px;
  min-width: 180px;
}

@media (max-width: 768px) {
  .product-grid {
    gap: 10px;
  }
  .carousel-item {
    flex: 0 0 160px;
    min-width: 140px;
  }
}

/* ── Elegant Layout ── */
.layout-elegant :deep(.product-card) {
  border: none !important;
  background: transparent !important;
  box-shadow: none !important;
}
.layout-elegant :deep(.product-card__image-container) {
  border-radius: 0 !important;
}
.layout-elegant :deep(.product-card:hover) {
  transform: none !important;
}
.layout-elegant :deep(.product-card__title) {
  font-family: 'Playfair Display', serif;
  font-size: 16px;
  text-align: center;
  margin-top: 12px;
}
.layout-elegant :deep(.product-card__prices) {
  justify-content: center;
}

/* ── Minimal Layout ── */
.layout-minimal :deep(.product-card) {
  border: none !important;
  border-bottom: 1px solid var(--sf-border) !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  padding-bottom: 16px;
}
.layout-minimal :deep(.product-card:hover) {
  transform: translateY(-2px) !important;
  box-shadow: none !important;
}
</style>
