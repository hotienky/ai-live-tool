<template>
  <div
    class="bc-wrap"
    :class="{ 'bc-wrap--selected': isSelected }"
    :data-id="block.id"
    :data-path="path"
    draggable="true"
    @dragstart.stop="onDragStart"
    @click.stop="$emit('select', block.id)"
  >
    <!-- Visual Block Preview (Replaces Wireframe) -->
    <BlockPreview :block="block" :blockDef="blockDef">
      <slot></slot>
    </BlockPreview>

    <!-- Hover Floating Toolbar (Contextual Actions) -->
    <div class="bc-toolbar drag-handle" @click.stop v-if="isSelected">
      <div class="bc-toolbar__inner">
        <button class="bc-btn bc-btn--drag" title="Kéo thả để di chuyển">
          <GripHorizontal :size="14" />
        </button>
        <button class="bc-btn" title="Lên trên" @click="$emit('move', block.id, -1)" :disabled="isFirst">
          <ArrowUp :size="14" />
        </button>
        <button class="bc-btn" title="Xuống dưới" @click="$emit('move', block.id, 1)" :disabled="isLast">
          <ArrowDown :size="14" />
        </button>
        <div class="bc-divider"></div>
        <button class="bc-btn" title="Nhân bản (Ctrl+D)" @click="$emit('duplicate', block.id)">
          <Copy :size="14" />
        </button>
        <button class="bc-btn bc-btn--danger" title="Xóa (Delete)" @click="$emit('remove', block.id)">
          <Trash2 :size="14" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GripHorizontal, ArrowUp, ArrowDown, Copy, Trash2 } from 'lucide-vue-next'
import BlockPreview from './BlockPreview.vue'

const props = defineProps({
  block: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isFirst: { type: Boolean, default: false },
  isLast: { type: Boolean, default: false },
  path: { type: String, required: true },
  level: { type: Number, default: 0 },
})

defineEmits(['select', 'remove', 'move', 'duplicate'])

const bridge = window.__APP_BRIDGE__ || {}

const blockDef = computed(() => {
  return bridge.getBlockByType?.(props.block.type) || null
})

function onDragStart(e) {
  e.dataTransfer.setData('source', 'canvas')
  e.dataTransfer.setData('block-index', props.path)
  e.dataTransfer.effectAllowed = 'move'
  
  // Custom ghost for canvas reordering
  const ghost = document.createElement('div')
  ghost.style.position = 'absolute'
  ghost.style.top = '-1000px'
  ghost.style.padding = '8px 16px'
  ghost.style.background = '#7c3aed'
  ghost.style.color = '#fff'
  ghost.style.borderRadius = '6px'
  ghost.style.fontWeight = '600'
  ghost.style.fontSize = '12px'
  ghost.textContent = 'Trượt để di chuyển'
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 20, 20)
  setTimeout(() => ghost.remove(), 0)
}
</script>

<style scoped>
.bc-wrap {
  position: relative;
  background: var(--bg-1, #fff);
  border: 1.5px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05); /* Soft baseline shadow */
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 8px; /* Give room for dropzone */
  outline: none;
}

/* Hover state: slight elevation + purple tint */
.bc-wrap:hover {
  border-color: rgba(124, 58, 237, 0.4); /* Tailwind violet-600 with opacity */
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.08);
  z-index: 1; /* Pop above siblings */
}

/* Selected state: thick vibrant border */
.bc-wrap--selected {
  border-color: var(--accent, #7c3aed) !important;
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.15) !important;
  z-index: 2;
}

/* Floating Toolbar (Glassmorphic Bento style) */
.bc-toolbar {
  position: absolute;
  top: -14px; right: 12px;
  z-index: 10;
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  pointer-events: none; /* Let hover trigger purely from parent wrap initially */
}

.bc-wrap:hover .bc-toolbar,
.bc-wrap--selected .bc-toolbar {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.bc-toolbar__inner {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-1, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  padding: 4px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06);
  backdrop-filter: blur(8px);
}

.bc-divider {
  width: 1px;
  height: 14px;
  background: var(--border, #e5e7eb);
  margin: 0 2px;
}

.bc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-2, #4b5563);
  cursor: pointer;
  transition: all 0.15s;
}

.bc-btn:hover:not(:disabled) {
  background: var(--bg-2, #f3f4f6);
  color: var(--text-1, #111827);
}

.bc-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bc-btn--drag { cursor: grab; }
.bc-btn--drag:active { cursor: grabbing; }
.bc-btn--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}
</style>
