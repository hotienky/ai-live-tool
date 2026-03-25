<template>
  <div class="container blk-richtext">
    <!-- P3 – Không render v-html trực tiếp; dùng ShortcodeRenderer có DOMPurify sanitize -->
    <ShortcodeRenderer :html="params?.content || ''" />
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
.blk-richtext {
  padding-top: 32px;
  padding-bottom: 32px;
  font-size: 16px;
  line-height: 1.8;
  color: var(--sf-text-secondary);
}
.blk-richtext :deep(h2) { font-size: 22px; font-weight: 800; margin: 28px 0 12px; color: var(--sf-text-primary); }
.blk-richtext :deep(h3) { font-size: 18px; font-weight: 700; margin: 20px 0 8px; color: var(--sf-text-primary); }
.blk-richtext :deep(p) { margin: 0 0 16px; }
.blk-richtext :deep(a) { color: var(--sf-accent-light); }
</style>
