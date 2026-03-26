<template>
  <section class="home-section container" v-if="productsData.length > 0" :class="['layout-' + (params?.layoutStyle || 'grid')]">
    <div class="home-section__header">
      <h2 class="section-title">
        <Sparkles :size="22" class="section-title__accent" />
        {{ params?.title || t('storefront.featured_products', 'Sản phẩm nổi bật') }}
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
import { Sparkles, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const isPreviewMode = inject('isPreviewMode', false)

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
    // Fallback during architectural transition
    allProducts = window.__STOREFRONT_DATA__?.products || []
  }
  
  if (allProducts.length === 0 && isPreviewMode) {
    allProducts = dummyProducts
  }
  
  const count = props.params?.count || 8
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
/* Grid Layout defaults handled by inline style + core CSS */

/* Carousel Layout */
.product-carousel {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding-bottom: 16px; /* Space for scrollbar */
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin; /* Firefox */
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
  flex: 0 0 calc(100% / var(--cols) - (16px * (var(--cols) - 1) / var(--cols)));
  min-width: 200px;
}

@media (max-width: 768px) {
  .product-carousel {
    --cols: 2.5 !important;
  }
}
@media (max-width: 480px) {
  .product-carousel {
    --cols: 1.5 !important;
  }
}

/* Elegant Layout */
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

/* Minimal Layout */
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
