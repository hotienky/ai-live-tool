<template>
  <div
    class="bc"
    ref="canvasEl"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @dragleave.self="dropPath = null"
  >
    <!-- Empty state -->
    <div v-if="!blocks.length" class="bc-empty">
      <div class="bc-empty__inner" :class="{ 'bc-empty__inner--active': dropPath === '0' }">
        <!-- The empty state acts as drop-zone '0' -->
        <component :is="'Inbox'" :size="48" class="bc-empty-icon" />
        <p>Kéo block từ bảng bên trái vào đây</p>
        <p class="bc-empty__hint">hoặc click vào block để thêm nhanh</p>
      </div>
    </div>

    <template v-else>
      <BlockNode
        :blocks="blocks"
        :selected-id="selectedId"
        :drop-path="dropPath"
        @select="$emit('select', $event)"
        @remove="$emit('remove', $event)"
        @move="onMoveBlock"
      />
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Inbox } from 'lucide-vue-next'
import BlockNode from './BlockNode.vue'

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
})

const emit = defineEmits(['select', 'remove', 'move', 'drop-palette', 'drop-reorder'])

const canvasEl = ref(null)
const dropPath = ref(null)

function getDropIndex(event) {
  if (!canvasEl.value) return props.blocks.length ? '' : '0'
  if (!props.blocks.length) return '0'

  const zones = canvasEl.value.querySelectorAll('.bc-drop-zone')
  let closest = '0'
  let minDist = Infinity

  zones.forEach(zone => {
    const rect = zone.getBoundingClientRect()
    // Calculate hypotenuse distance to the center of the drop zone
    const midX = rect.left + rect.width / 2
    const midY = rect.top + rect.height / 2
    const dist = Math.hypot(event.clientX - midX, event.clientY - midY)
    
    // Penalize narrow vertical distance slightly if needed, but hypot is usually fine
    // Alternatively, favor horizontal proximity heavily for nested columns
    if (dist < minDist) {
      minDist = dist
      closest = zone.dataset.path
    }
  })
  
  return closest
}

function onDragOver(event) {
  dropPath.value = getDropIndex(event)
  const source = event.dataTransfer.types.includes('block-type') ? 'palette' : 'canvas'
  event.dataTransfer.dropEffect = source === 'palette' ? 'copy' : 'move'
}

function onDrop(event) {
  const source = event.dataTransfer.getData('source')
  const targetPath = dropPath.value ?? (props.blocks.length ? String(props.blocks.length) : '0')
  dropPath.value = null

  if (source === 'palette') {
    const blockType = event.dataTransfer.getData('block-type')
    if (blockType) emit('drop-palette', blockType, targetPath)
  } else if (source === 'canvas') {
    const fromPath = event.dataTransfer.getData('block-index')
    if (fromPath && fromPath !== targetPath) {
      emit('drop-reorder', fromPath, targetPath)
    }
  }
}

function onMoveBlock(fromPath, toPath) {
  emit('drop-reorder', fromPath, toPath)
}
</script>

<style scoped>
.bc {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 16px 20px;
  background: var(--bg-1, #fcfcfc);
  display: flex;
  flex-direction: column;
  gap: 0;
}

.bc-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
.bc-empty__inner {
  text-align: center;
  color: var(--text-3, #9ca3af);
  padding: 40px;
  border: 2px dashed var(--border, #e5e7eb);
  border-radius: 14px;
  width: 100%;
  transition: all 0.3s ease;
  background: var(--bg-1, #fff);
}
.bc-empty__inner--active {
  border-color: var(--accent, #7c3aed);
  background: rgba(124,58,237,.02);
  transform: scale(1.02);
}
.bc-empty-icon { margin-bottom: 12px; opacity: .5; color: var(--accent); }
.bc-empty p { margin: 0; font-size: 14px; }
.bc-empty__hint { font-size: 12px; margin-top: 4px !important; }
</style>
