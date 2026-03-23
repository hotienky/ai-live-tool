<template>
  <div
    class="bcard"
    :class="{
      'bcard--selected': selected,
      'bcard--dragging': isDragging,
    }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="isDragging = false"
    @click="$emit('click')"
  >
    <!-- Drag handle -->
    <div class="bcard__handle" title="Kéo để sắp xếp lại">⠿</div>

    <!-- Icon -->
    <div class="bcard__icon">
      <component :is="resolveIcon(blockDef?.icon)" :size="16" />
    </div>

    <!-- Info -->
    <div class="bcard__info">
      <span class="bcard__name">{{ blockDef?.name || block.type }}</span>
      <span class="bcard__summary">{{ summary }}</span>
    </div>

    <!-- Actions (always visible on hover/select) -->
    <div class="bcard__actions" @click.stop>
      <button
        class="bcard__btn"
        @click="$emit('move-up')"
        :disabled="index === 0"
        title="Di lên"
      >↑</button>
      <button
        class="bcard__btn"
        @click="$emit('move-down')"
        :disabled="index === total - 1"
        title="Di xuống"
      >↓</button>
      <button class="bcard__btn bcard__btn--del" @click="$emit('remove')" title="Xóa block">
        <X :size="12" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, Box, Image, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, ImageIcon } from 'lucide-vue-next'

const props = defineProps({
  block: { type: Object, required: true },
  blockDef: { type: Object, default: null },
  selected: { type: Boolean, default: false },
  index: { type: Number, required: true },
  total: { type: Number, required: true },
})

defineEmits(['click', 'remove', 'move-up', 'move-down', 'dragstart'])

const isDragging = ref(false)

const ICON_MAP = {
  Image, FileText, Minus, Code, BookOpen, TrendingUp,
  ShoppingBag, Star, FolderTree, Box, ImageIcon,
}

function resolveIcon(name) {
  return ICON_MAP[name] || Box
}

// Build a short summary from settings
const summary = computed(() => {
  const s = props.block.settings || {}
  if (s.title) return s.title
  if (s.content) return s.content.replace(/<[^>]+>/g, '').slice(0, 50) + (s.content.length > 50 ? '...' : '')
  if (s.html) return s.html.slice(0, 40) + '...'
  if (s.height) return `Height: ${s.height}`
  return props.block.type
})

function onDragStart(event) {
  isDragging.value = true
  event.dataTransfer.setData('source', 'canvas')
  event.dataTransfer.setData('block-index', String(props.index))
  event.dataTransfer.effectAllowed = 'move'
  // Prevent the click event from firing after drag
  event.stopPropagation()
}
</script>

<style scoped>
.bcard {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--bg-1, #fff);
  border: 1.5px solid var(--border, #e5e7eb);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color .15s, box-shadow .15s, opacity .15s;
  user-select: none;
  position: relative;
}
.bcard:hover {
  border-color: var(--accent, #7c3aed);
  box-shadow: 0 2px 8px rgba(124,58,237,.1);
}
.bcard--selected {
  border-color: var(--accent, #7c3aed);
  background: rgba(124,58,237,.03);
  box-shadow: 0 0 0 3px rgba(124,58,237,.12);
}
.bcard--dragging { opacity: .4; }

.bcard__handle {
  color: var(--text-3, #9ca3af);
  cursor: grab;
  font-size: 14px;
  line-height: 1;
  padding: 2px;
  flex-shrink: 0;
}
.bcard__handle:active { cursor: grabbing; }

.bcard__icon {
  color: var(--accent, #7c3aed);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bcard__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bcard__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1, #1f2937);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bcard__summary {
  font-size: 11px;
  color: var(--text-3, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bcard__actions {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  opacity: 0;
  transition: opacity .15s;
}
.bcard:hover .bcard__actions,
.bcard--selected .bcard__actions { opacity: 1; }

.bcard__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--bg-2, #f9fafb);
  color: var(--text-2);
  cursor: pointer;
  font-size: 11px;
  transition: all .15s;
}
.bcard__btn:hover { border-color: var(--accent); color: var(--accent); }
.bcard__btn:disabled { opacity: .3; cursor: not-allowed; pointer-events: none; }
.bcard__btn--del:hover { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,.06); }
</style>
