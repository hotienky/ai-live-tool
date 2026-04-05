<template>
  <div
    class="sc"
    :class="{
      'sc--selected': selected,
      'sc--disabled': !section.enabled,
      'sc--dragging': isDragging,
    }"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="isDragging = false"
    @click="$emit('select', section.id)"
  >
    <!-- Drag handle -->
    <span class="sc__drag" title="Kéo để sắp xếp">
      <GripVertical :size="14" />
    </span>

    <!-- Icon + labels -->
    <span class="sc__icon">
      <component :is="resolveIcon(sectionDef?.icon)" :size="15" />
    </span>

    <div class="sc__info">
      <span class="sc__type">{{ sectionDef?.label || section.type }}</span>
      <span v-if="sectionTitle" class="sc__title">{{ sectionTitle }}</span>
    </div>

    <!-- Actions -->
    <div class="sc__actions" @click.stop>
      <!-- Enable toggle -->
      <button
        class="sc__btn"
        :class="section.enabled ? 'sc__btn--on' : 'sc__btn--off'"
        @click="$emit('toggle', section.id)"
        :title="section.enabled ? 'Ẩn section' : 'Hiện section'"
      >
        <Eye v-if="section.enabled" :size="13" />
        <EyeOff v-else :size="13" />
      </button>

      <!-- Move up -->
      <button
        class="sc__btn"
        :disabled="index === 0"
        @click="$emit('move', index, index - 1)"
        title="Lên"
      >
        <ChevronUp :size="13" />
      </button>

      <!-- Move down -->
      <button
        class="sc__btn"
        :disabled="index === total - 1"
        @click="$emit('move', index, index + 1)"
        title="Xuống"
      >
        <ChevronDown :size="13" />
      </button>

      <!-- Delete -->
      <button class="sc__btn sc__btn--del" @click="$emit('remove', section.id)" title="Xóa">
        <Trash2 :size="13" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  GripVertical, Eye, EyeOff, ChevronUp, ChevronDown, Trash2,
  ShoppingBag, Sparkles, FolderTree, Zap, Image, ImageIcon,
  Star, MessageCircle, FileText, Video, Mail, LayoutGrid,
  BookOpen, Building2, Box,
} from 'lucide-vue-next'

const props = defineProps({
  section:  { type: Object, required: true },
  index:    { type: Number, required: true },
  total:    { type: Number, required: true },
  selected: { type: Boolean, default: false },
})

defineEmits(['select', 'toggle', 'move', 'remove', 'drag-start'])

const ICON_MAP = {
  ShoppingBag, Sparkles, FolderTree, Zap, Image, ImageIcon,
  Star, MessageCircle, FileText, Video, Mail, LayoutGrid,
  BookOpen, Building2, Box,
}

function resolveIcon(name) {
  return ICON_MAP[name] || Box
}

// Đọc schema từ window registry
const schemas = window.__SECTION_SCHEMAS__ || {}
const sectionDef = computed(() => schemas[props.section.type] || null)

// Hiển thị params.title nếu có
const sectionTitle = computed(() => {
  const t = props.section.params?.title
  return t && t !== (sectionDef.value?.groups?.[0]?.fields?.find(f => f.key === 'title')?.default)
    ? t
    : null
})

// Drag-drop reorder
const isDragging = ref(false)

function onDragStart(event) {
  isDragging.value = true
  event.dataTransfer.setData('source', 'section-canvas')
  event.dataTransfer.setData('section-index', String(props.index))
  event.dataTransfer.effectAllowed = 'move'
}
</script>

<style scoped>
.sc {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--bg-1, #fff);
  cursor: pointer;
  transition: all .15s;
  user-select: none;
}
.sc:hover { border-color: rgba(124,58,237,.3); box-shadow: 0 1px 6px rgba(0,0,0,.06); }
.sc--selected {
  border-color: var(--accent, #7c3aed);
  background: rgba(124,58,237,.04);
  box-shadow: 0 0 0 3px rgba(124,58,237,.1);
}
.sc--disabled { opacity: .45; }
.sc--dragging { opacity: .4; }

.sc__drag {
  color: var(--text-3, #9ca3af);
  cursor: grab;
  flex-shrink: 0;
  display: flex;
}
.sc__icon {
  color: var(--accent, #7c3aed);
  flex-shrink: 0;
  display: flex;
}
.sc__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.sc__type {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.sc__title {
  font-size: 11px;
  color: var(--text-3, #9ca3af);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sc__actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}
.sc__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-2, #6b7280);
  cursor: pointer;
  transition: all .15s;
}
.sc__btn:hover:not(:disabled) {
  background: var(--bg-2, #f3f4f6);
  border-color: var(--border);
  color: var(--text-1);
}
.sc__btn:disabled { opacity: .3; cursor: default; }
.sc__btn--on { color: #22c55e; }
.sc__btn--off { color: var(--text-3); }
.sc__btn--del:hover:not(:disabled) { color: #ef4444; border-color: #fca5a5; background: #fef2f2; }
</style>
