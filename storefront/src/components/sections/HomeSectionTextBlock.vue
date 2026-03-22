<template>
  <section class="section-text container">
    <h2 v-if="params?.title" class="section-title">
      <Type :size="22" class="section-title__accent" />
      {{ params.title }}
    </h2>
    <div class="text-content" v-if="htmlContent" v-html="sanitize(htmlContent)"></div>
    <p v-else class="section-empty">{{ t('storefront.section.text_empty', 'Chưa có nội dung') }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Type } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { useSanitize } from '../../composables/useSanitize.js'

const { t } = useI18n()
const { sanitize } = useSanitize()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String], default: '' },
})

const htmlContent = computed(() => {
  if (typeof props.content === 'string') return props.content
  if (Array.isArray(props.content) && props.content.length) return props.content[0]?.html || props.content[0]?.text || ''
  return ''
})
</script>

<style scoped>
.section-text { padding-top: 40px; }
.text-content {
  max-width: 800px; margin: 0 auto; font-size: 15px; line-height: 1.8;
  color: var(--sf-text-secondary);
}
.text-content :deep(h2) { font-size: 20px; font-weight: 800; margin: 24px 0 12px; color: var(--sf-text-primary); }
.text-content :deep(h3) { font-size: 16px; font-weight: 700; margin: 20px 0 8px; }
.text-content :deep(a) { color: var(--sf-accent-light); }
.text-content :deep(img) { max-width: 100%; border-radius: var(--sf-radius-md); margin: 16px 0; }
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
</style>
