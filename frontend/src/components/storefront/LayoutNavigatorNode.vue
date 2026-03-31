<template>
  <div class="ln-node-wrapper">
    <!-- Nút hiển thị của Node này -->
    <div 
      class="ln-node" 
      :style="{ paddingLeft: (level * 16 + 8) + 'px' }"
      @click="toggleExpand"
      @dblclick="$emit('select-node', node.id)"
    >
      <!-- Icon tương ứng với Loại Component -->
      <span class="ln-icon">
        <component :is="iconComponent" :size="12" />
      </span>
      
      <!-- Tên Component -->
      <span class="ln-name">{{ displayName }}</span>

      <!-- Nút mở rộng nếu có con -->
      <ChevronRight 
        v-if="hasChildren" 
        :size="12" 
        class="ln-expand-icon"
        :class="{ 'expanded': isExpanded }" 
      />
    </div>

    <!-- Danh sách các node con (Đệ quy) -->
    <div v-if="hasChildren && isExpanded" class="ln-children">
      <LayoutNavigatorNode 
        v-for="child in node.children" 
        :key="child.id" 
        :node="child" 
        :level="level + 1"
        @select-node="$emit('select-node', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { 
  Box, Type, Image as ImageIcon, Link2, List, LayoutGrid, 
  Columns, Columns2, Columns3, Columns4, SplitSquareHorizontal, 
  Frame, Square, Component, ChevronRight
} from 'lucide-vue-next'

const props = defineProps({
  node: Object,
  level: { type: Number, default: 0 }
})
const emit = defineEmits(['select-node'])

const isExpanded = ref(true)

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0
})

const displayName = computed(() => {
  return props.node.name || props.node.type?.charAt(0).toUpperCase() + props.node.type?.slice(1) || 'Unknown'
})

function toggleExpand(e) {
  if (hasChildren.value) {
    isExpanded.value = !isExpanded.value
  } else {
    emit('select-node', props.node.id)
  }
}

// Bắt icon tương ứng với loại Thẻ
const iconComponent = computed(() => {
  const t = props.node.type
  if(t === 'text' || t === 'heading') return Type
  if(t === 'image' || t === 'video') return ImageIcon
  if(t === 'link' || t === 'button') return Link2
  if(t === 'container' || t === 'row' || t === 'col') return Box
  if(t === 'grid') return LayoutGrid
  if(t === 'card') return Square
  if(t === 'divider') return SplitSquareHorizontal
  if(t === 'iframe') return Frame
  return Component
})
</script>

<style scoped>
.ln-node-wrapper {
  display: flex;
  flex-direction: column;
}
.ln-node {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-left: 2px solid transparent;
  color: var(--color-text-primary, #334155);
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  user-select: none;
}
.ln-node:hover {
  background: var(--color-bg-card-hover, #f1f5f9);
}
.ln-node:active, .ln-node.is-selected {
  background: rgba(168, 85, 247, 0.1);
  border-left-color: #a855f7;
  color: #a855f7;
}
.ln-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  color: #94a3b8;
}
.ln-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ln-expand-icon {
  color: #94a3b8;
  transition: transform 0.2s ease;
}
.ln-expand-icon.expanded {
  transform: rotate(90deg);
}

</style>
