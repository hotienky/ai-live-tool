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
  width: 220px;
  min-width: 200px;
  background: var(--bg-2, #f9fafb);
  border-right: 1px solid var(--border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bp-title {
  padding: 12px 14px 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-3, #9ca3af);
}
.bp-search-wrap {
  position: relative;
  margin: 0 10px 8px;
}
.bp-search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}
.bp-search {
  width: 100%;
  padding: 5px 8px 5px 26px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-1, #fff);
  font-size: 12px;
  color: var(--text-1);
  box-sizing: border-box;
}
.bp-search:focus { outline: none; border-color: var(--accent, #7c3aed); }

.bp-scroll { flex: 1; overflow-y: auto; padding: 0 6px 12px; }
.bp-group-title {
  padding: 10px 8px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-3, #9ca3af);
}
.bp-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 8px;
  border-radius: 7px;
  cursor: grab;
  user-select: none;
  transition: background .15s;
  margin-bottom: 2px;
  border: 1px solid transparent;
}
.bp-item:hover {
  background: var(--bg-3, rgba(0,0,0,.04));
  border-color: var(--border);
}
.bp-item:hover .bp-item__plus { opacity: 1; }
.bp-item--dragging {
  background: rgba(124,58,237,.08);
  border-color: rgba(124,58,237,.2);
}
.bp-item__icon {
  color: var(--accent, #7c3aed);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.bp-item__name { font-size: 12px; color: var(--text-1); flex: 1; }
.bp-item__plus { color: var(--text-3); opacity: 0; transition: opacity .15s; flex-shrink: 0; }
.bp-empty { text-align: center; font-size: 12px; color: var(--text-3); padding: 16px; }
</style>
