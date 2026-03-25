<template>
  <section class="home-hero container">
    <BannerSlider
      :banners="bannersData"
      :autoplay="params?.autoplay !== false"
      :interval="params?.interval || 5000"
    />
  </section>
</template>

<script setup>
import { computed } from 'vue'
import BannerSlider from '../../components/BannerSlider.vue'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

// Data can come from BFF (section.props.resolvedData) or from frontend global cache
const bannersData = computed(() => {
  if (Array.isArray(props.content) && props.content.length > 0) return props.content
  if (props.params?.resolvedData) return props.params.resolvedData
  // Fallback to window.__STOREFRONT_DATA__ if available (for transition period)
  return window.__STOREFRONT_DATA__?.banners || []
})
</script>
