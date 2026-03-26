<template>
  <section class="home-section container" v-if="productsData.length > 0" :class="['layout-' + (params?.layoutStyle || 'grid')]">
    <div class="home-section__header">
      <h2 class="section-title">
        <Clock :size="22" class="section-title__accent" />
        {{ params?.title || t('storefront.new_arrivals', 'Hàng mới về') }}
      </h2>
      <router-link :to="params?.viewAllLink || '/products'" class="home-section__viewall">
        {{ t('storefront.view_all', 'Xem tất cả') }} <ArrowRight :size="14" />
      </router-link>
    </div>
    
    <!-- Grid Layout -->
    <div v-if="params?.layoutStyle !== 'carousel'" class="product-grid" :style="gridStyle">
      <ProductCard v-for="p in productsData" :key="p.id" :product="p" />
    </div>
    <!-- Carousel Layout -->
    <div v-else class="product-carousel" :style="{ '--cols': params?.slidesPerView || 4 }">
      <ProductCard class="carousel-item" v-for="p in productsData" :key="p.id" :product="p" />
    </div>
  </section>
</template>

<script setup>
import { computed, inject } from 'vue'
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
    // Fallback: assume the newest are at the beginning or explicitly provided
    allProducts = window.__STOREFRONT_DATA__?.newProducts || window.__STOREFRONT_DATA__?.products || []
  }
  
  if (allProducts.length === 0 && isPreviewMode) {
    allProducts = dummyProducts
  }
  
  const count = props.params?.count || 6
  return allProducts.slice(0, count)
})

const gridStyle = computed(() => {
  const cols = props.params?.columns || 4
  return {
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(calc(100% / ${cols} - 16px), 1fr))`,
    gap: '16px'
  }
})
</script>

<style scoped>
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
  flex: 0 0 calc(100% / max(2, var(--cols)) - 16px);
  min-width: 200px;
}

/* Lookbook Layout */
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
