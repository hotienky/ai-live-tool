<template>
  <section class="home-section container" v-if="productsData.length > 0">
    <div class="home-section__header">
      <h2 class="section-title">
        <Clock :size="22" class="section-title__accent" />
        {{ params?.title || t('storefront.new_arrivals', 'Hàng mới về') }}
      </h2>
      <router-link :to="params?.viewAllLink || '/products'" class="home-section__viewall">
        {{ t('storefront.view_all', 'Xem tất cả') }} <ArrowRight :size="14" />
      </router-link>
    </div>
    <div class="product-grid" :style="gridStyle">
      <ProductCard v-for="p in productsData" :key="p.id" :product="p" />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import ProductCard from '../../components/ProductCard.vue'
import { Clock, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const productsData = computed(() => {
  let allProducts = []
  if (props.params?.resolvedData) {
    allProducts = props.params.resolvedData
  } else {
    // Fallback: assume the newest are at the beginning or explicitly provided
    allProducts = window.__STOREFRONT_DATA__?.newProducts || window.__STOREFRONT_DATA__?.products || []
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
