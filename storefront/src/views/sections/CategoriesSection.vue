<template>
  <section class="home-section container" v-if="categoriesData.length > 0">
    <h2 class="section-title">
      <GridIcon :size="22" class="section-title__accent" />
      {{ params?.title || t('storefront.categories', 'Danh mục sản phẩm') }}
    </h2>
    <CategoryGrid :categories="categoriesData" :layout="params?.layoutStyle" />
  </section>
</template>

<script setup>
import { computed, inject } from 'vue'
import CategoryGrid from '../../components/CategoryGrid.vue'
import { Grid as GridIcon } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const isPreviewMode = inject('isPreviewMode', false)

// Dummy category generator for preview
const dummyCategories = Array.from({ length: 6 }).map((_, i) => ({
  id: `dummy-cat-${i}`,
  name: `Danh mục ${i + 1}`,
  slug: `danh-muc-${i + 1}`,
  image: `https://loremflickr.com/200/200/fashion,food?random=${i}`,
  products_count: Math.floor(Math.random() * 50) + 10,
  is_featured: true
}))

const categoriesData = computed(() => {
  let allCats = []
  if (props.params?.resolvedData) {
    allCats = props.params.resolvedData
  } else {
    allCats = window.__STOREFRONT_DATA__?.categories || []
  }
  
  if (allCats.length === 0 && isPreviewMode) {
    allCats = dummyCategories
  }
  
  // Filter if layout params specified max/featured
  if (props.params?.featuredOnly) {
    allCats = allCats.filter(c => c.is_featured)
  }
  if (props.params?.maxCategories) {
    allCats = allCats.slice(0, props.params.maxCategories)
  }
  return allCats
})
</script>
