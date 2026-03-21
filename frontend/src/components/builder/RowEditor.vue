<template>
  <div class="row-editor">
    <!-- Layout picker (when row is selected) -->
    <div v-if="isSelected" class="re-layout-picker">
      <span class="re-layout-label">Layout:</span>
      <button v-for="layout in layouts" :key="layout.key" class="re-layout-btn" :class="{ active: currentLayout === layout.key }" @click="changeLayout(layout.key)" :title="layout.label">
        <div class="re-layout-preview">
          <span v-for="(w, i) in layout.widths" :key="i" class="re-layout-col" :style="{ flex: w }"></span>
        </div>
      </button>
    </div>

    <!-- Columns -->
    <div class="re-columns" :style="gridStyle">
      <div v-for="(col, colIdx) in row.columns" :key="col.id" class="re-column" :class="{ 're-column--empty': !col.blocks?.length }" @click.stop="$emit('select', row.id)">
        <!-- Column blocks -->
        <div v-for="(block, blockIdx) in (col.blocks || [])" :key="block.id" class="re-column__block" :class="{ 're-column__block--selected': selectedId === block.id }" @click.stop="$emit('select', block.id)">
          <BlockRenderer :block="block" :editable="selectedId === block.id" @update="(upd) => updateColumnBlock(colIdx, blockIdx, upd)" />
          <div class="re-column__block-actions" v-if="selectedId === block.id">
            <button @click.stop="removeColumnBlock(colIdx, blockIdx)"><Trash2 :size="11" /></button>
          </div>
        </div>

        <!-- Empty column -->
        <div v-if="!col.blocks?.length" class="re-column__empty" @click.stop="$emit('add-block', colIdx)">
          <Plus :size="16" />
          <span>Add block</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Plus, Trash2 } from 'lucide-vue-next'
import BlockRenderer from './BlockRenderer.vue'

const props = defineProps({
  row: { type: Object, required: true },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select', 'update', 'add-block'])

const layouts = [
  { key: '1', label: '1 column', widths: [1] },
  { key: '2', label: '2 columns (50/50)', widths: [1, 1] },
  { key: '3', label: '3 columns', widths: [1, 1, 1] },
  { key: '4', label: '4 columns', widths: [1, 1, 1, 1] },
  { key: '2-1', label: '66/33', widths: [2, 1] },
  { key: '1-2', label: '33/66', widths: [1, 2] },
]

const isSelected = computed(() => props.selectedId === props.row.id)

const currentLayout = computed(() => {
  const cols = props.row.columns?.length || 1
  const widths = props.row.columns?.map(c => c.width) || ['100%']
  if (cols === 1) return '1'
  if (cols === 2 && widths[0] === '66.66%') return '2-1'
  if (cols === 2 && widths[0] === '33.33%' && widths[1] === '66.66%') return '1-2'
  if (cols === 2) return '2'
  if (cols === 3) return '3'
  if (cols === 4) return '4'
  return '1'
})

const gridStyle = computed(() => {
  const cols = props.row.columns || []
  return {
    gridTemplateColumns: cols.map(c => c.width || '1fr').join(' '),
  }
})

function changeLayout(key) {
  const presets = {
    '1': ['100%'],
    '2': ['50%', '50%'],
    '3': ['33.33%', '33.33%', '33.33%'],
    '4': ['25%', '25%', '25%', '25%'],
    '2-1': ['66.66%', '33.33%'],
    '1-2': ['33.33%', '66.66%'],
  }
  const widths = presets[key] || ['100%']
  const currentCols = props.row.columns || []

  const newCols = widths.map((w, i) => ({
    id: currentCols[i]?.id || `col_${Date.now()}_${i}`,
    width: w,
    blocks: currentCols[i]?.blocks || [],
  }))

  emit('update', { ...props.row, columns: newCols })
}

function updateColumnBlock(colIdx, blockIdx, updated) {
  const newRow = JSON.parse(JSON.stringify(props.row))
  newRow.columns[colIdx].blocks[blockIdx] = updated
  emit('update', newRow)
}

function removeColumnBlock(colIdx, blockIdx) {
  const newRow = JSON.parse(JSON.stringify(props.row))
  newRow.columns[colIdx].blocks.splice(blockIdx, 1)
  emit('update', newRow)
}
</script>

<style scoped>
.row-editor { position: relative; }

/* Layout picker */
.re-layout-picker {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; margin-bottom: 8px;
  background: var(--glass-bg); border-radius: 8px;
  border: 1px solid var(--glass-border);
}
.re-layout-label { font-size: 11px; font-weight: 700; color: var(--text-3); }
.re-layout-btn {
  padding: 4px 8px; border-radius: 6px; cursor: pointer;
  border: 1px solid var(--color-border); background: transparent;
  transition: all 0.15s;
}
.re-layout-btn.active { border-color: var(--accent); background: var(--color-accent-glow); }
.re-layout-preview { display: flex; gap: 2px; width: 36px; height: 16px; }
.re-layout-col {
  border-radius: 2px; background: var(--text-3); opacity: 0.3;
}
.re-layout-btn.active .re-layout-col { background: var(--accent); opacity: 0.8; }

/* Columns grid */
.re-columns { display: grid; gap: 12px; min-height: 60px; }

.re-column {
  border: 1px dashed var(--color-border); border-radius: 8px;
  padding: 8px; min-height: 60px; position: relative;
}
.re-column--empty { display: flex; align-items: center; justify-content: center; }

.re-column__empty {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  color: var(--text-3); cursor: pointer; font-size: 11px; padding: 16px;
  transition: color 0.2s;
}
.re-column__empty:hover { color: var(--accent); }

/* Column block */
.re-column__block { position: relative; margin-bottom: 4px; border-radius: 4px; }
.re-column__block--selected { outline: 2px solid var(--accent); outline-offset: 2px; }
.re-column__block-actions {
  position: absolute; top: -8px; right: -8px;
}
.re-column__block-actions button {
  padding: 3px 5px; border-radius: 4px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; display: flex;
}
</style>
