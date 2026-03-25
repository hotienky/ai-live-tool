<template>
  <div class="container blk-embed">
    <!-- P3 – Không render v-html trực tiếp; dùng ShortcodeRenderer có DOMPurify sanitize -->
    <ShortcodeRenderer :html="params?.html || ''" />
  </div>
</template>

<script setup>
import ShortcodeRenderer from '../../components/ShortcodeRenderer.vue'

defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})
</script>

<style scoped>
.blk-embed { padding: 24px 0; }
</style>
