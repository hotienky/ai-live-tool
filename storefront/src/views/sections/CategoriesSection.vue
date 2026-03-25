<template>
  <section class="home-section container" v-if="categoriesData.length > 0">
    <h2 class="section-title">
      <GridIcon :size="22" class="section-title__accent" />
      {{ params?.title || t('storefront.categories', 'Danh mục sản phẩm') }}
    </h2>
    <CategoryGrid :categories="categoriesData" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import CategoryGrid from '../../components/CategoryGrid.vue'
import { Grid as GridIcon } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const categoriesData = computed(() => {
  let allCats = []
  if (props.params?.resolvedData) {
    allCats = props.params.resolvedData
  } else {
    allCats = window.__STOREFRONT_DATA__?.categories || []
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
