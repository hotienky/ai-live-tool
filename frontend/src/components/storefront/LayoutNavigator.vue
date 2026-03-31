<template>
  <div class="layout-navigator">
    <div v-if="!sections || sections.length === 0" class="ln-empty">
      Chưa có thành phần nào trên trang.
    </div>
    <div class="ln-tree">
      <LayoutNavigatorNode 
        v-for="(section, idx) in sections" 
        :key="section.id || idx" 
        :node="section" 
        :level="0"
        :expanded-section="expandedSection"
        @select-node="handleSelectNode"
      />
    </div>
  </div>
</template>

<script setup>
import { provide } from 'vue'
import LayoutNavigatorNode from './LayoutNavigatorNode.vue'

const props = defineProps({
  sections: { type: Array, required: true },
  expandedSection: { type: [String, Number], default: null }
})
const emit = defineEmits(['select-node'])

function handleSelectNode(id) {
  emit('select-node', id)
  
  // Highlight in Iframe (postMessage trick)
  const iframe = document.querySelector('.preview-iframe')
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'HIGHLIGHT_NODE',
      nodeId: id
    }, '*')
  }
}
</script>

<style scoped>
.layout-navigator {
  padding: 8px 0;
  background: transparent;
  min-height: 200px;
}
.ln-empty {
  text-align: center;
  padding: 24px;
  font-size: 12px;
  color: #64748b;
}
.ln-tree {
  display: flex;
  flex-direction: column;
}
</style>
