<template>
  <div class="cms-columns container" :style="gridStyle">
    <div
      v-for="(colChildren, index) in section.children || []"
      :key="index"
      class="cms-col"
    >
      <SectionRenderer
        v-if="colChildren && colChildren.length > 0"
        v-for="(child, childIndex) in colChildren"
        :key="child.id || childIndex"
        :section="child"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SectionRenderer from '../SectionRenderer.vue'

const props = defineProps({
  section: { type: Object, required: true },
})

const gridStyle = computed(() => {
  const p = props.section.settings || props.section.params || {}
  const count = parseInt(p.columns) || 2
  const layout = p.layout || '50-50'

  let template = '1fr 1fr'
  if (count === 2) {
    if (layout === '60-40') template = '6fr 4fr'
    else if (layout === '40-60') template = '4fr 6fr'
  } else if (count === 3) {
    template = '1fr 1fr 1fr'
  }

  return {
    display: 'grid',
    gridTemplateColumns: template,
    gap: '24px',
    alignItems: 'start',
    width: '100%',
  }
})
</script>

<style scoped>
.cms-columns {
  margin: 32px auto;
}
@media (max-width: 768px) {
  .cms-columns {
    grid-template-columns: 1fr !important;
  }
}
</style>
