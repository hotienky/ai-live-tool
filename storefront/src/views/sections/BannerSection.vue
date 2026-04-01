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

const bannersData = computed(() => {
  if (Array.isArray(props.content)) return props.content
  return []
})
</script>
