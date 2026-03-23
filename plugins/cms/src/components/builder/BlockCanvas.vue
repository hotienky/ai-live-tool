<template>
  <div
    class="bc"
    ref="canvasEl"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
    @dragleave.self="dropIndex = null"
  >
    <!-- Empty state -->
    <div v-if="!blocks.length" class="bc-empty">
      <div class="bc-empty__inner">
        <Inbox :size="36" />
        <p>Kéo block từ bảng bên trái vào đây</p>
        <p class="bc-empty__hint">hoặc click vào block để thêm nhanh</p>
      </div>
    </div>

    <template v-else>
      <!-- Top drop zone -->
      <div
        class="bc-drop-zone"
        :class="{ 'bc-drop-zone--active': dropIndex === 0 }"
        data-index="0"
      ></div>

      <template v-for="(block, i) in blocks" :key="block.id">
        <BlockCard
          :block="block"
          :block-def="getBlockDef(block.type)"
          :selected="selectedId === block.id"
          :index="i"
          :total="blocks.length"
          @click="$emit('select', block.id)"
          @remove="$emit('remove', block.id)"
          @move-up="$emit('move', i, i - 1)"
          @move-down="$emit('move', i, i + 1)"
        />
        <!-- Drop zone after each card -->
        <div
          class="bc-drop-zone"
          :class="{ 'bc-drop-zone--active': dropIndex === i + 1 }"
          :data-index="i + 1"
        ></div>
      </template>
    </template>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Inbox } from 'lucide-vue-next'
import BlockCard from './BlockCard.vue'

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
})

const emit = defineEmits(['select', 'remove', 'move', 'drop-palette', 'drop-reorder'])

const canvasEl = ref(null)
const dropIndex = ref(null)

const bridge = window.__APP_BRIDGE__ || {}
function getBlockDef(type) {
  return bridge.getBlockByType?.(type) || null
}

function getDropIndex(event) {
  if (!canvasEl.value) return props.blocks.length
  // Find all drop zones and check which one is closest
  const zones = canvasEl.value.querySelectorAll('.bc-drop-zone')
  let closest = props.blocks.length
  let minDist = Infinity
  zones.forEach(zone => {
    const rect = zone.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const dist = Math.abs(event.clientY - midY)
    if (dist < minDist) {
      minDist = dist
      closest = parseInt(zone.dataset.index)
    }
  })
  return closest
}

function onDragOver(event) {
  dropIndex.value = getDropIndex(event)
  const source = event.dataTransfer.types.includes('block-type') ? 'palette' : 'canvas'
  event.dataTransfer.dropEffect = source === 'palette' ? 'copy' : 'move'
}

function onDrop(event) {
  const source = event.dataTransfer.getData('source')
  const idx = dropIndex.value ?? props.blocks.length
  dropIndex.value = null

  if (source === 'palette') {
    const blockType = event.dataTransfer.getData('block-type')
    if (blockType) emit('drop-palette', blockType, idx)
  } else if (source === 'canvas') {
    const fromIndex = parseInt(event.dataTransfer.getData('block-index'))
    if (!isNaN(fromIndex) && fromIndex !== idx && fromIndex !== idx - 1) {
      emit('drop-reorder', fromIndex, idx)
    }
  }
}
</script>

<style scoped>
.bc {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  padding: 16px 20px;
  background: var(--bg-1, #fff);
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
}
.bc-empty__inner svg { margin-bottom: 12px; opacity: .5; }
.bc-empty__inner p { margin: 0; font-size: 14px; }
.bc-empty__hint { font-size: 12px; margin-top: 4px !important; }

/* Drop zone indicator */
.bc-drop-zone {
  height: 4px;
  border-radius: 2px;
  margin: 3px 0;
  transition: height .15s, background .15s;
}
.bc-drop-zone--active {
  height: 20px;
  background: rgba(124,58,237,.15);
  border: 2px dashed rgba(124,58,237,.4);
  border-radius: 6px;
}
</style>
