<template>
  <div class="lt">
    <div class="lt-header">
      <Layers :size="13" />
      <span>Cấu trúc</span>
    </div>
    <div class="lt-scroll">
      <div v-if="!blocks.length" class="lt-empty">Chưa có block</div>
      <template v-for="(block, i) in blocks" :key="block.id">
        <div
          class="lt-node"
          :class="{
            'lt-node--selected': selectedId === block.id,
            'lt-node--hidden': hiddenIds.has(block.id),
          }"
          :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
          @click.stop="$emit('select', block.id)"
        >
          <component :is="resolveIcon(getBlockDef(block.type)?.icon)" :size="13" class="lt-node__icon" />
          <span class="lt-node__name">{{ getBlockDef(block.type)?.name || block.type }}</span>
          <span class="lt-node__summary" v-if="blockSummary(block)">{{ blockSummary(block) }}</span>
          <div class="lt-node__actions" @click.stop>
            <button
              class="lt-btn"
              @click="toggleVisibility(block.id)"
              :title="hiddenIds.has(block.id) ? 'Hiển thị' : 'Ẩn'"
            >
              <EyeOff v-if="hiddenIds.has(block.id)" :size="11" />
              <Eye v-else :size="11" />
            </button>
          </div>
        </div>
        <!-- Render column children recursively -->
        <template v-if="block.type.startsWith('columns') && block.children">
          <template v-for="(col, ci) in block.children" :key="ci">
            <div
              class="lt-col-label"
              :style="{ paddingLeft: (depth + 1) * 16 + 8 + 'px' }"
            >
              <Columns :size="11" />
              <span>Cột {{ ci + 1 }}</span>
            </div>
            <LayerTree
              v-if="col && col.length > 0"
              :blocks="col"
              :selected-id="selectedId"
              :depth="depth + 2"
              @select="$emit('select', $event)"
              @toggle-visibility="$emit('toggle-visibility', $event)"
            />
          </template>
        </template>
      </template>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { Layers, Eye, EyeOff, Columns, Box, Image as ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Zap } from 'lucide-vue-next'

defineOptions({ name: 'LayerTree' })

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  selectedId: { type: String, default: null },
  depth: { type: Number, default: 0 },
})

defineEmits(['select', 'toggle-visibility'])

const bridge = window.__APP_BRIDGE__ || {}
const hiddenIds = reactive(new Set())

function getBlockDef(type) {
  return bridge.getBlockByType?.(type) || null
}

const ICON_MAP = { Image: ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Box, ImageIcon, Columns, Zap }
function resolveIcon(name) { return ICON_MAP[name] || Box }

function blockSummary(block) {
  const s = block.settings || {}
  if (s.title) return s.title.slice(0, 25)
  if (s.columns) return `${s.columns} cột`
  if (s.height) return s.height
  return ''
}

function toggleVisibility(id) {
  if (hiddenIds.has(id)) hiddenIds.delete(id)
  else hiddenIds.add(id)
}
</script>

<style scoped>
.lt { display: flex; flex-direction: column; height: 100%; }
.lt-header {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 14px 8px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--text-3, #9ca3af);
}
.lt-scroll { flex: 1; overflow-y: auto; padding-bottom: 12px; }
.lt-empty { padding: 20px 14px; text-align: center; color: var(--text-3); font-size: 12px; }

.lt-node {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 8px; cursor: pointer;
  border-left: 2px solid transparent;
  transition: all 0.12s ease;
  font-size: 12px;
}
.lt-node:hover { background: rgba(124,58,237,0.04); }
.lt-node--selected {
  background: rgba(124,58,237,0.08);
  border-left-color: var(--accent, #7c3aed);
}
.lt-node--hidden { opacity: 0.4; }
.lt-node__icon { color: var(--accent, #7c3aed); flex-shrink: 0; }
.lt-node__name { font-weight: 600; color: var(--text-1, #1f2937); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lt-node__summary {
  font-size: 10px; color: var(--text-3); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; flex: 1; text-align: right;
  margin-left: auto;
}
.lt-node__actions { display: flex; margin-left: 4px; flex-shrink: 0; opacity: 0; transition: opacity 0.15s; }
.lt-node:hover .lt-node__actions { opacity: 1; }
.lt-btn {
  display: flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 4px; border: none;
  background: transparent; color: var(--text-3); cursor: pointer;
}
.lt-btn:hover { background: rgba(0,0,0,0.06); color: var(--text-1); }

.lt-col-label {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600; color: var(--text-3, #9ca3af);
  padding: 4px 8px;
  text-transform: uppercase; letter-spacing: 0.3px;
}
</style>
