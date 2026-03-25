<template>
  <section class="container blk-categories home-section" v-if="categoriesData.length > 0">
    <h2 v-if="params?.title" class="section-title">{{ params.title }}</h2>
    <!-- P5 – Data đã được inject server-side qua LayoutResolver (params.resolvedData) -->
    <CategoryGrid :categories="categoriesData" />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import CategoryGrid from '../../components/CategoryGrid.vue'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})

// P5 – BFF đã inject data vào params.resolvedData; không fetch API trong component
const categoriesData = computed(() => {
  const limit = props.params?.limit ?? 6
  const data = props.params?.resolvedData ?? window.__STOREFRONT_DATA__?.categories ?? []
  return data.slice(0, limit)
})
</script>

<style scoped>
.blk-categories { padding-top: 40px; padding-bottom: 40px; }
.section-title { font-size: 24px; font-weight: 900; margin: 0 0 24px; color: var(--sf-text-primary); }
</style>
