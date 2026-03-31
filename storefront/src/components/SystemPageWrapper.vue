<template>
  <div class="system-page-wrapper">
    <!-- Top Sections (Above Core) -->
    <SectionRenderer
      v-for="section in topSections"
      :key="section.id || section.order"
      :section="section"
    />

    <!-- Core Content Block -->
    <div
      class="system-core-content"
      data-vvb-section-id="__core"
      data-section-type="system_page_content"
      :data-section-index="coreIndex"
    >
      <slot />
    </div>

    <!-- Bottom Sections (Below Core) -->
    <SectionRenderer
      v-for="section in bottomSections"
      :key="section.id || section.order"
      :section="section"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, inject, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../api.js'
import SectionRenderer from './SectionRenderer.vue'

const props = defineProps({
  slug: { type: String, default: '' }
})

const route = useRoute()
const layoutConfig = inject('layoutConfig', ref(null))
const isPreviewMode = inject('isPreviewMode', false)

// Compute the slug to fetch. e.g. "products", "blog", "cart"
const activeSlug = computed(() => {
  if (props.slug) return props.slug
  if (route.name) return route.name.toLowerCase().replace('page', '')
  return ''
})

const fetchedSections = ref([])
const loading = ref(false)

async function fetchLayout() {
  if (isPreviewMode) return // In preview mode, CMS pushes the active layout via standard iframe bridge
  if (!activeSlug.value) return

  loading.value = true
  try {
    const res = await apiFetch('/layout-pages')
    const data = await res.json()
    const list = data.data || []
    const target = list.find(p => p.slug === activeSlug.value)
    if (target) {
      // Fetch details to get full layout_json
      const detailRes = await apiFetch(`/layout-pages/${target.id}`)
      const detail = await detailRes.json()
      const page = detail.data || detail
      fetchedSections.value = page.layout_json || []
    } else {
      fetchedSections.value = []
    }
  } catch (e) {
    fetchedSections.value = []
  }
  loading.value = false
}

// Watch slug changes to refetch layout
watch(activeSlug, fetchLayout, { immediate: true })

const currentSections = computed(() => {
  if (isPreviewMode) return layoutConfig.value?.sections || []
  return fetchedSections.value
})

const coreIndex = computed(() => {
  return currentSections.value.findIndex(s => s.type === 'system_page_content')
})

const topSections = computed(() => {
  const sections = currentSections.value
  const idx = coreIndex.value
  if (idx === -1) return sections.filter(s => s.enabled)
  return sections.slice(0, idx).filter(s => s.enabled)
})

const bottomSections = computed(() => {
  const sections = currentSections.value
  const idx = coreIndex.value
  if (idx === -1) return []
  return sections.slice(idx + 1).filter(s => s.enabled)
})
</script>

<style scoped>
.system-page-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.system-core-content {
  position: relative;
  z-index: 10;
}
/* When hovering over the core block in builder mode, show a visual indicator */
.system-core-content[data-section-type="system_page_content"] {
  min-height: 200px;
}
</style>
