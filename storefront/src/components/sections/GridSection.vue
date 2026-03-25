<template>
  <div class="grid-section" :style="gridStyle">
    <!-- Render children via the same SectionRenderer recursively -->
    <slot></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  params: {
    type: Object,
    default: () => ({})
  },
  content: {
    type: [Array, String, Object],
    default: () => []
  },
  section: {
    type: Object,
    required: true
  }
})

// Calculate responsive CSS grid based on props
const gridStyle = computed(() => {
  const p = props.params
  const cols = p.columns || 2
  const maxCols = p.maxColumns || cols
  const gap = p.gap || 24
  
  return {
    display: 'grid',
    gap: `${gap}px`,
    gridTemplateColumns: `repeat(auto-fit, minmax(calc(100% / ${maxCols} - ${gap}px), 1fr))`,
    alignItems: p.alignItems || 'start'
  }
})
</script>

<style scoped>
.grid-section {
  width: 100%;
}
@media (max-width: 768px) {
  .grid-section {
    grid-template-columns: 1fr !important; /* Stack on mobile */
  }
}
</style>
