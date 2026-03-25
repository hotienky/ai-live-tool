<template>
  <div class="blk-image" :class="{ container: !params?.full_width }">
    <a v-if="params?.link" :href="params.link">
      <img :src="params.image" :alt="params?.alt || ''" class="blk-image__img" />
    </a>
    <img
      v-else-if="params?.image"
      :src="params.image"
      :alt="params?.alt || ''"
      class="blk-image__img"
    />
  </div>
</template>

<script setup>
defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
.blk-image { padding: 16px 0; }
.blk-image__img { width: 100%; border-radius: var(--sf-radius-lg, 12px); display: block; }
</style>
