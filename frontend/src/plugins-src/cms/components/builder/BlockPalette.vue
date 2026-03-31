<template>
  <div class="bp">
    <div class="bp-title">Thư viện Blocks</div>

    <div class="bp-search-wrap">
      <Search :size="13" class="bp-search-icon" />
      <input v-model="search" type="text" placeholder="Tìm block..." class="bp-search" />
    </div>

    <div class="bp-scroll">
      <template v-for="(blockList, plugin) in filteredGroups" :key="plugin">
        <div class="bp-group-title">{{ pluginLabel(plugin) }}</div>

        <div
          v-for="block in blockList"
          :key="block.type"
          class="bp-item"
          draggable="true"
          @dragstart="onDragStart($event, block)"
          @dragend="dragging = null"
          @click="$emit('add-block', block.type)"
          :class="{ 'bp-item--dragging': dragging === block.type }"
          :title="block.description"
        >
          <span class="bp-item__icon">
            <component :is="resolveIcon(block.icon)" :size="14" />
          </span>
          <span class="bp-item__name">{{ block.name }}</span>
          <Plus :size="11" class="bp-item__plus" />
        </div>
      </template>

      <p v-if="hasNoResults" class="bp-empty">Không tìm thấy block nào</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Search, Plus, Image, FileText, Minus, Code, BookOpen,
  TrendingUp, ShoppingBag, Star, FolderTree, Box, ImageIcon,
  Layout, Layers,
} from 'lucide-vue-next'

defineEmits(['add-block'])

const bridge = window.__APP_BRIDGE__ || {}
const search = ref('')
const dragging = ref(null)
const groups = ref({})

const ICON_MAP = {
  Image, FileText, Minus, Code, BookOpen, TrendingUp,
  ShoppingBag, Star, FolderTree, Box, ImageIcon, Layout, Layers,
}
const PLUGIN_LABELS = {
  cms: 'CMS cơ bản',
  blog: 'Blog',
  ecom: 'Sản phẩm',
  lms: 'Học tập',
  'lucky-draw': 'Lucky Draw',
}

function resolveIcon(name) {
  return ICON_MAP[name] || Box
}
function pluginLabel(id) {
  return PLUGIN_LABELS[id] || id
}

function loadGroups() {
  groups.value = bridge.getBlocksGrouped?.() || {}
}

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groups.value
  const result = {}
  for (const [plugin, list] of Object.entries(groups.value)) {
    const filtered = list.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.description || '').toLowerCase().includes(q)
    )
    if (filtered.length) result[plugin] = filtered
  }
  return result
})

const hasNoResults = computed(() =>
  search.value.trim() && Object.keys(filteredGroups.value).length === 0
)

function onDragStart(event, block) {
  dragging.value = block.type
  event.dataTransfer.setData('source', 'palette')
  event.dataTransfer.setData('block-type', block.type)
  event.dataTransfer.effectAllowed = 'copy'
}

let unsubscribe = null
onMounted(() => {
  loadGroups()
  unsubscribe = bridge.onBlockRegistered?.(loadGroups)
  window.addEventListener('block:registered', loadGroups)
})
onUnmounted(() => {
  unsubscribe?.()
  window.removeEventListener('block:registered', loadGroups)
})
</script>

<style scoped>
.bp {
  width: 240px;
  min-width: 240px;
  background: var(--bg-1, #ffffff);
  border-right: 1px solid var(--border, #e5e7eb);
  box-shadow: 2px 0 12px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 10;
}
.bp-title {
  padding: 16px 16px 12px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text-1, #111827);
}
.bp-search-wrap {
  position: relative;
  margin: 0 14px 12px;
}
.bp-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}
.bp-search {
  width: 100%;
  padding: 8px 12px 8px 32px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-2, #f9fafb);
  font-size: 13px;
  color: var(--text-1);
  box-sizing: border-box;
  transition: all 0.2s ease;
}
.bp-search:focus {
  outline: none;
  border-color: var(--accent, #7c3aed);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
}

.bp-scroll { flex: 1; overflow-y: auto; padding: 0 10px 16px; }
.bp-group-title {
  padding: 14px 6px 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-3, #9ca3af);
}
.bp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: grab;
  user-select: none;
  transition: all .2s cubic-bezier(0.16, 1, 0.3, 1);
  margin-bottom: 4px;
  border: 1px solid transparent;
  background: transparent;
}
.bp-item:hover {
  background: var(--bg-1, #ffffff);
  border-color: var(--border, #e5e7eb);
  box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  transform: translateY(-1px);
}
.bp-item:active {
  transform: scale(0.98);
  cursor: grabbing;
}
.bp-item:hover .bp-item__plus { opacity: 1; transform: translateX(0); }

.bp-item--dragging {
  background: rgba(124,58,237,.08);
  border-color: rgba(124,58,237,.2);
}

.bp-item__icon { color: var(--accent, #7c3aed); display: flex; align-items: center; flex-shrink: 0; }
.bp-item__name { font-size: 13px; font-weight: 500; color: var(--text-2, #374151); flex: 1; }

.bp-item__plus {
  color: var(--accent);
  opacity: 0;
  padding: 4px;
  border-radius: 4px;
  background: rgba(124,58,237,.1);
  display: flex;
  align-items: center;
  transition: all .2s ease;
  transform: translateX(-4px);
  flex-shrink: 0;
}
.bp-item__plus:hover { background: var(--accent); color: #fff; }

.bp-empty {
  padding: 30px 10px;
  text-align: center;
  color: var(--text-3);
  font-size: 13px;
}
</style>
