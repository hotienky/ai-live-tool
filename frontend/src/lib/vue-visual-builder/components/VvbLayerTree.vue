<template>
  <div class="vvb-tree">
    <div 
      v-for="(node, index) in sections" 
      :key="node.id || index"
      class="vvb-tree-node"
      :class="{ 'vvb-tree-node--active': state.activeSectionId === (node.id || index) }"
      @click="onSelect(node, index)"
    >
      <div class="vvb-tree-label">
        <span class="vvb-tree-icon">
          <component :is="getIcon(node.type)" :size="12" />
        </span>
        <span class="vvb-tree-text">{{ getLabel(node.type) }}</span>
      </div>
      
      <!-- Nút thao tác nhanh trực tiếp trên Layer list: Kéo thả, Xóa, Ẩn/Hiện -->
      <div class="vvb-tree-actions" v-if="state.activeSectionId === (node.id || index)">
        <button class="vvb-icon-btn" @click.stop="deleteSection(index)" title="Xoá"><Trash2 :size="12" /></button>
      </div>

      <!-- Recursive call for nested layers -->
      <div v-if="node.children && node.children.length > 0" class="vvb-tree-children">
        <VvbLayerTree :sections="node.children" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Box, Trash2 } from 'lucide-vue-next'
import { useBuilderState } from '../core/state.js'
import { registry } from '../core/registry.js'

const props = defineProps({
  sections: { type: Array, required: true }
})

const { state, selectSection, pushHistorySnapshot } = useBuilderState()

function getIcon(type) {
  const spec = registry.getBlockSpec(type)
  return spec?.icon || Box
}

function getLabel(type) {
  const spec = registry.getBlockSpec(type)
  return spec?.label || type
}

function onSelect(node, index) {
  selectSection(node.id || index)
}

function deleteSection(index) {
  pushHistorySnapshot()
  // Trong thực tế cần biết mảng parent để xóa. 
  // Vì truyền props xuống nên phát sự kiện xoá là tốt nhất.
  // FIXME: Sẽ cập nhật mutation logic khi hoàn tất cấu trúc DND
}
</script>

<style scoped>
.vvb-tree { padding: 8px 12px; }
.vvb-tree-node {
  padding: 6px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #cad4e0;
  font-size: 12px;
  transition: all 0.15s;
}
.vvb-tree-node:hover {
  background: #272c36;
  color: #fff;
}
.vvb-tree-node--active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}
.vvb-tree-label { display: flex; align-items: center; gap: 8px; }
.vvb-tree-icon { opacity: 0.7; }

.vvb-icon-btn { background: transparent; border: none; color: inherit; padding: 2px; cursor: pointer; border-radius: 4px; opacity: 0.5; }
.vvb-icon-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }

.vvb-tree-children {
  margin-left: 14px;
  border-left: 1px dashed #334155;
  padding-left: 4px;
  margin-top: 4px;
}
</style>
