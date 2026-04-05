<template>
  <section class="home-section container" v-if="productsData.length > 0" :class="['layout-' + (resolvedParams.layoutStyle || 'grid')]">
    <div class="home-section__header">
      <h2 class="section-title" :style="resolvedParams.titleColor ? { color: resolvedParams.titleColor } : {}">
        <Clock :size="22" class="section-title__accent" />
        {{ resolvedParams.title || t('storefront.new_arrivals', 'Hàng mới về') }}
      </h2>
      <router-link
        v-if="resolvedParams.showViewAll !== false"
        :to="resolvedParams.viewAllLink || '/products'"
        class="home-section__viewall"
      >
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
import { Clock, ArrowRight } from 'lucide-vue-next'
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
  const tablet = props.section?.tabletParams || {}
  const mobile = props.section?.mobileParams || {}
  
  if (isTablet.value || isMobile.value) {
    for (const k in tablet) if (tablet[k] !== undefined && tablet[k] !== '') p[k] = tablet[k]
  }
  if (isMobile.value) {
    for (const k in mobile) if (mobile[k] !== undefined && mobile[k] !== '') p[k] = mobile[k]
  }
  return p
})

// Dummy product generator for preview
const dummyProducts = Array.from({ length: 6 }).map((_, i) => ({
  id: `dummy-new-${i}`,
  name: `Hàng mới ${i + 1}`,
  slug: `hang-moi-${i + 1}`,
  price: 299000 + i * 20000,
  base_price: 350000 + i * 20000,
  image: `https://loremflickr.com/400/400/fashion,new?random=${i}`,
  category: { name: 'New Arrival' },
  is_dummy: true
}))

const productsData = computed(() => {
  let allProducts = []
  if (props.params?.resolvedData) {
    allProducts = props.params.resolvedData
  } else {
    allProducts = window.__STOREFRONT_DATA__?.newProducts || window.__STOREFRONT_DATA__?.products || []
  }
  
  if (allProducts.length === 0 && isPreviewMode) {
    allProducts = dummyProducts
  }
  
  const count = resolvedParams.value.count || 6
  return allProducts.slice(0, count)
})

// Responsive grid columns 
const responsiveCols = computed(() => {
  if (isMobile.value) return resolvedParams.value.mobileColumns || 2
  if (isTablet.value) return resolvedParams.value.tabletColumns || 3
  return resolvedParams.value.columns || 4
})

const gridVars = computed(() => ({
  '--grid-cols': responsiveCols.value,
  '--grid-gap': (resolvedParams.value.gap || 16) + 'px',
}))
</script>

<style scoped>
/* ── Section Header ── */
.home-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}
.section-title__accent {
  color: #f59e0b;
}
.home-section__viewall {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: #0e62bc;
  text-decoration: none;
  transition: opacity 0.2s;
}
.home-section__viewall:hover {
  opacity: 0.7;
}

@media (max-width: 768px) {
  .section-title { font-size: 18px; }
  .home-section__viewall { font-size: 13px; }
  .home-section__header { margin-bottom: 16px; }
}

/* ── Grid Layout ── */
.product-grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-cols, 4), 1fr);
  gap: var(--grid-gap, 16px);
}

/* ── Carousel Layout ── */
.product-carousel {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 24px;
  scroll-snap-type: x mandatory;
  scrollbar-width: thin;
  scrollbar-color: var(--sf-accent) var(--sf-bg-secondary, #f1f5f9);
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

/* ── Lookbook Layout ── */
.layout-lookbook :deep(.product-card) {
  border: none !important;
  background: transparent !important;
}
.layout-lookbook :deep(.product-card__image-container) {
  border-radius: 0 !important;
}
.layout-lookbook :deep(.product-card__title) {
  text-transform: uppercase;
  font-weight: 800;
  letter-spacing: 0.05em;
  font-size: 14px;
}
</style>
