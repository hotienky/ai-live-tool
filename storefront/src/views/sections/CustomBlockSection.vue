<template>
  <div class="container custom-block-section" v-if="hasContent">
    <h2 v-if="params?.title" class="section-title">{{ params.title }}</h2>
    <ShortcodeRenderer class="custom-block-content" :html="htmlContent" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ShortcodeRenderer from '../../components/ShortcodeRenderer.vue'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [String, Object, Array], default: '' },
  section: { type: Object, default: () => ({}) }
})

const htmlContent = computed(() => {
  if (typeof props.content === 'string') return props.content
  return props.section?.content || ''
})

const hasContent = computed(() => {
  return htmlContent.value?.trim() || props.params?.title
})
</script>
