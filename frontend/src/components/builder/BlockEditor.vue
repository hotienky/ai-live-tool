<template>
  <div class="block-editor">
    <!-- Toolbar -->
    <div class="be-toolbar">
      <div class="be-toolbar__left">
        <button class="be-tool-btn" @click="showPalette = !showPalette" :class="{ active: showPalette }">
          <Plus :size="14" /> {{ t('admin.add_block', 'Thêm Block') }}
        </button>
        <button class="be-tool-btn" @click="addRow">
          <Columns :size="14" /> {{ t('admin.add_row', 'Thêm Row') }}
        </button>
      </div>
      <div class="be-toolbar__right">
        <button class="be-tool-btn" @click="undo" :disabled="!canUndo"><Undo2 :size="14" /></button>
        <button class="be-tool-btn" @click="redo" :disabled="!canRedo"><Redo2 :size="14" /></button>
      </div>
    </div>

    <div class="be-layout">
      <!-- Canvas -->
      <div class="be-canvas">
        <!-- Empty state -->
        <div v-if="sections.length === 0" class="be-empty" @click="showPalette = true">
          <LayoutGrid :size="40" />
          <p>{{ t('admin.empty_builder', 'Chưa có nội dung. Nhấn để thêm block đầu tiên.') }}</p>
        </div>

        <!-- Blocks -->
        <div v-for="(block, idx) in sections" :key="block.id" class="be-block-wrap" :class="{ 'be-block-wrap--selected': selectedId === block.id }" @click.stop="selectBlock(block.id)">
          <!-- Block toolbar -->
          <div class="be-block-toolbar" v-if="selectedId === block.id">
            <span class="be-block-toolbar__type">{{ getBlockLabel(block.type) }}</span>
            <button @click.stop="moveBlock(idx, -1)" :disabled="idx === 0"><ChevronUp :size="13" /></button>
            <button @click.stop="moveBlock(idx, 1)" :disabled="idx === sections.length - 1"><ChevronDown :size="13" /></button>
            <button @click.stop="duplicateBlock(idx)"><Copy :size="13" /></button>
            <button @click.stop="removeBlock(idx)" class="be-block-toolbar__del"><Trash2 :size="13" /></button>
          </div>

          <!-- Row type -->
          <template v-if="block.type === '_row'">
            <RowEditor :row="block" :selected-id="selectedId" @select="selectBlock" @update="(updatedRow) => updateBlock(idx, updatedRow)" @add-block="(colIdx) => addBlockToColumn(idx, colIdx)" />
          </template>

          <!-- Regular block -->
          <template v-else>
            <BlockRenderer :block="block" :editable="selectedId === block.id" @update="(updated) => updateBlock(idx, updated)" />
          </template>

          <!-- Add between blocks -->
          <div class="be-add-between" @click.stop="insertAt(idx + 1)">
            <Plus :size="12" />
          </div>
        </div>
      </div>

      <!-- Right panel: Block Palette or Settings -->
      <div class="be-sidebar" v-if="showPalette || selectedBlock">
        <BlockPalette v-if="showPalette" @select="onBlockTypeSelected" />
        <BlockSettings v-else-if="selectedBlock" :block="selectedBlock" @update="onSettingsUpdate" @close="selectedId = null" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Plus, Columns, Undo2, Redo2, LayoutGrid, ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-vue-next'
import { createBlock, createRow, blockRegistry } from '../../core/blocks.js'
import { useI18n } from '../../composables/useI18n.js'
import BlockRenderer from './BlockRenderer.vue'
import BlockPalette from './BlockPalette.vue'
import BlockSettings from './BlockSettings.vue'
import RowEditor from './RowEditor.vue'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const sections = ref([...(props.modelValue || [])])
const selectedId = ref(null)
const showPalette = ref(false)
const insertIndex = ref(-1)

// Undo/Redo
const undoStack = ref([])
const redoStack = ref([])
const canUndo = computed(() => undoStack.value.length > 0)
const canRedo = computed(() => redoStack.value.length > 0)

function pushUndo() {
  undoStack.value.push(JSON.stringify(sections.value))
  if (undoStack.value.length > 30) undoStack.value.shift()
  redoStack.value = []
}

function undo() {
  if (!canUndo.value) return
  redoStack.value.push(JSON.stringify(sections.value))
  sections.value = JSON.parse(undoStack.value.pop())
  emitChange()
}

function redo() {
  if (!canRedo.value) return
  undoStack.value.push(JSON.stringify(sections.value))
  sections.value = JSON.parse(redoStack.value.pop())
  emitChange()
}

// Block operations
const selectedBlock = computed(() => {
  if (!selectedId.value) return null
  return findBlockById(sections.value, selectedId.value)
})

function findBlockById(blocks, id) {
  for (const b of blocks) {
    if (b.id === id) return b
    if (b.type === '_row' && b.columns) {
      for (const col of b.columns) {
        const found = findBlockById(col.blocks || [], id)
        if (found) return found
      }
    }
  }
  return null
}

function selectBlock(id) {
  selectedId.value = id
  showPalette.value = false
}

function getBlockLabel(type) {
  if (type === '_row') return 'Row'
  return blockRegistry.get(type)?.label || type
}

function onBlockTypeSelected(type) {
  pushUndo()
  const block = createBlock(type)
  if (insertIndex.value >= 0) {
    sections.value.splice(insertIndex.value, 0, block)
    insertIndex.value = -1
  } else {
    sections.value.push(block)
  }
  selectedId.value = block.id
  showPalette.value = false
  emitChange()
}

function addRow() {
  pushUndo()
  const row = createRow(2)
  sections.value.push(row)
  selectedId.value = row.id
  emitChange()
}

function addBlockToColumn(rowIdx, colIdx) {
  insertIndex.value = -1
  showPalette.value = true
  // We'll handle adding to column in a simplified way
}

function insertAt(idx) {
  insertIndex.value = idx
  showPalette.value = true
}

function moveBlock(idx, dir) {
  const target = idx + dir
  if (target < 0 || target >= sections.value.length) return
  pushUndo()
  const temp = sections.value[idx]
  sections.value[idx] = sections.value[target]
  sections.value[target] = temp
  emitChange()
}

function duplicateBlock(idx) {
  pushUndo()
  const clone = JSON.parse(JSON.stringify(sections.value[idx]))
  clone.id = `blk_${Date.now().toString(36)}_dup`
  sections.value.splice(idx + 1, 0, clone)
  selectedId.value = clone.id
  emitChange()
}

function removeBlock(idx) {
  pushUndo()
  const id = sections.value[idx].id
  sections.value.splice(idx, 1)
  if (selectedId.value === id) selectedId.value = null
  emitChange()
}

function updateBlock(idx, updated) {
  sections.value[idx] = updated
  emitChange()
}

function onSettingsUpdate(updated) {
  const idx = sections.value.findIndex(b => b.id === updated.id)
  if (idx >= 0) {
    sections.value[idx] = updated
    emitChange()
  }
}

function emitChange() {
  emit('update:modelValue', [...sections.value])
}

watch(() => props.modelValue, (val) => {
  if (JSON.stringify(val) !== JSON.stringify(sections.value)) {
    sections.value = [...(val || [])]
  }
}, { deep: true })
</script>

<style scoped>
.block-editor { display: flex; flex-direction: column; min-height: 500px; }

/* Toolbar */
.be-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-bottom: 1px solid var(--glass-border);
  background: var(--glass-bg); border-radius: 12px 12px 0 0;
}
.be-toolbar__left, .be-toolbar__right { display: flex; gap: 6px; }
.be-tool-btn {
  display: flex; align-items: center; gap: 5px; padding: 7px 14px;
  border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--text-2); cursor: pointer; transition: all 0.2s;
}
.be-tool-btn:hover { border-color: var(--accent); color: var(--accent); }
.be-tool-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.be-tool-btn:disabled { opacity: 0.3; cursor: not-allowed; }

/* Layout */
.be-layout { display: flex; flex: 1; min-height: 0; }

/* Canvas */
.be-canvas {
  flex: 1; padding: 24px; overflow-y: auto;
  background: var(--bg-1, #0a0a0f);
}
.be-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 80px 24px; color: var(--text-3); cursor: pointer;
  border: 2px dashed var(--color-border); border-radius: 12px;
  transition: all 0.2s;
}
.be-empty:hover { border-color: var(--accent); color: var(--accent); }
.be-empty p { font-size: 14px; margin: 0; }

/* Block wrapper */
.be-block-wrap {
  position: relative; margin-bottom: 4px;
  border: 2px solid transparent; border-radius: 8px;
  transition: all 0.15s; cursor: pointer;
}
.be-block-wrap:hover { border-color: rgba(124,58,237,0.3); }
.be-block-wrap--selected { border-color: var(--accent) !important; }

/* Block toolbar */
.be-block-toolbar {
  position: absolute; top: -32px; left: 0; z-index: 10;
  display: flex; align-items: center; gap: 2px;
  padding: 4px 8px; border-radius: 6px;
  background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 600;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.be-block-toolbar__type { margin-right: 6px; }
.be-block-toolbar button {
  background: rgba(255,255,255,0.15); border: none; color: #fff;
  padding: 3px 5px; border-radius: 4px; cursor: pointer; display: flex;
}
.be-block-toolbar button:disabled { opacity: 0.3; }
.be-block-toolbar button:hover { background: rgba(255,255,255,0.3); }
.be-block-toolbar__del:hover { background: rgba(239,68,68,0.8) !important; }

/* Add between */
.be-add-between {
  display: flex; align-items: center; justify-content: center;
  height: 24px; opacity: 0; transition: opacity 0.2s; cursor: pointer;
  color: var(--accent);
}
.be-block-wrap:hover .be-add-between { opacity: 1; }
.be-add-between:hover { transform: scale(1.2); }

/* Sidebar */
.be-sidebar {
  width: 300px; border-left: 1px solid var(--glass-border);
  background: var(--glass-bg); overflow-y: auto;
  flex-shrink: 0;
}

@media (max-width: 900px) {
  .be-layout { flex-direction: column; }
  .be-sidebar { width: 100%; border-left: none; border-top: 1px solid var(--glass-border); max-height: 300px; }
}
</style>
