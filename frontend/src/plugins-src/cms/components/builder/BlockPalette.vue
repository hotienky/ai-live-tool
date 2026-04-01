<template>
  <div class="bp">
    <div class="bp-search">
      <Search :size="14" class="bp-search-icon" />
      <input
        type="text"
        v-model="searchQuery"
        placeholder="Tìm kiếm block..."
        class="bp-search-input"
        @focus="isFocused = true"
        @blur="isFocused = false"
      />
      <button v-if="searchQuery" class="bp-clear" @click="searchQuery = ''"><X :size="12" /></button>
    </div>

    <div class="bp-list">
      <div v-for="(group, groupIdx) in filteredGroups" :key="groupIdx" class="bp-group">
        <h4 v-if="filteredGroups.length > 1" class="bp-group-title">{{ group.label }}</h4>
        <div class="bp-grid">
          <div
            v-for="b in group.items"
            :key="b.type"
            class="bp-item"
            draggable="true"
            @dragstart="onDragStart($event, b)"
            @dragend="onDragEnd"
            @click="onBlockClick(b)"
            :title="b.description || b.name"
          >
            <component :is="resolveIcon(b.icon)" :size="24" class="bp-item-icon" />
            <span class="bp-item-name">{{ b.name }}</span>
          </div>
        </div>
      </div>
      
      <div v-if="filteredGroups.length === 0" class="bp-empty">
        <FileQuestion :size="24" />
        <p>Không tìm thấy block nào khớp với "{{ searchQuery }}"</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Search, X, Box, Image as ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Columns, Layers, FileQuestion, Zap } from 'lucide-vue-next'

const props = defineProps({
  blockDefinitions: { type: Array, required: true }
})

const emit = defineEmits(['add-block'])

const searchQuery = ref('')
const isFocused = ref(false)

const ICON_MAP = { Image: ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Box, ImageIcon, Columns, Layers, Zap }
function resolveIcon(name) { return ICON_MAP[name] || Box }

const groupedBlocks = computed(() => {
  const layouts = props.blockDefinitions.filter(b => b.type.startsWith('columns') || b.type === 'spacer')
  const content = props.blockDefinitions.filter(b => ['rich-text', 'hero-banner'].includes(b.type))
  const media = props.blockDefinitions.filter(b => ['image-banner'].includes(b.type))
  const used = new Set([...layouts, ...content, ...media].map(b => b.type))
  
  const groups = [
    { label: 'Bố cục', items: layouts },
    { label: 'Nội dung', items: content },
    { label: 'Truyền thông', items: media },
  ]
  
  const remaining = props.blockDefinitions.filter(b => !used.has(b.type))
  const pluginMap = {
    'ecom': 'Cửa hàng / E-com',
    'blog': 'Bài viết / Tin tức',
    'marketing': 'Khuyến mãi / Sale'
  }
  
  const others = {}
  remaining.forEach(b => {
    const p = b.plugin || 'other'
    const label = pluginMap[p] || (p === 'cms' ? 'Nâng cao' : p)
    if (!others[label]) others[label] = []
    others[label].push(b)
  })
  
  Object.keys(others).forEach(label => {
    groups.push({ label, items: others[label] })
  })

  return groups.filter(g => g.items.length > 0)
})

const filteredGroups = computed(() => {
  if (!searchQuery.value) return groupedBlocks.value
  
  const q = searchQuery.value.toLowerCase()
  return groupedBlocks.value.map(group => ({
    label: group.label,
    items: group.items.filter(b => b.name.toLowerCase().includes(q) || (b.description && b.description.toLowerCase().includes(q)))
  })).filter(group => group.items.length > 0)
})

function onDragStart(e, blockDef) {
  e.dataTransfer.setData('source', 'palette')
  e.dataTransfer.setData('block-type', blockDef.type)
  e.dataTransfer.setData('application/json', JSON.stringify({
    type: blockDef.type,
    settings: { ...blockDef.defaultSettings }
  }))
  e.dataTransfer.effectAllowed = 'copy'
  
  // Try to create a small ghost
  const ghost = document.createElement('div')
  ghost.style.position = 'absolute'
  ghost.style.top = '-1000px'
  ghost.style.width = '80px'
  ghost.style.height = '80px'
  ghost.style.background = '#fff'
  ghost.style.border = '2px solid #7c3aed'
  ghost.style.borderRadius = '8px'
  document.body.appendChild(ghost)
  e.dataTransfer.setDragImage(ghost, 40, 40)
  setTimeout(() => ghost.remove(), 0)
}

function onDragEnd() {
  // Cleanup
}

function onBlockClick(blockDef) {
  emit('add-block', {
    type: blockDef.type,
    settings: { ...blockDef.defaultSettings }
  })
}
</script>

<style scoped>
.bp { display: flex; flex-direction: column; height: 100%; background: var(--bg-1, #fff); }

.bp-search {
  position: relative; padding: 12px 14px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.bp-search-icon { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); color: var(--text-3); }
.bp-search-input {
  width: 100%; width: -moz-available; width: -webkit-fill-available;
  padding: 8px 30px 8px 32px;
  border: 1px solid var(--border); border-radius: 6px;
  font-size: 13px; background: var(--bg-2, #f9fafb);
  transition: all 0.2s; outline: none; box-sizing: border-box;
}
.bp-search-input:focus {
  background: #fff; border-color: var(--accent, #7c3aed);
  box-shadow: 0 0 0 2px rgba(124,58,237,0.1);
}
.bp-clear {
  position: absolute; right: 24px; top: 50%; transform: translateY(-50%);
  background: none; border: none; padding: 4px; color: var(--text-3); cursor: pointer;
  display: flex; align-items: center; justify-content: center; border-radius: 50%;
}
.bp-clear:hover { background: var(--border); color: var(--text-1); }

.bp-list { flex: 1; overflow-y: auto; padding: 12px 14px; display: flex; flex-direction: column; gap: 20px; }

.bp-group-title {
  font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase;
  letter-spacing: 0.5px; margin: 0 0 10px 4px;
}

.bp-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }

.bp-item {
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
  aspect-ratio: 1; padding: 12px;
  background: var(--bg-1); border: 1px solid var(--border); border-radius: 8px;
  cursor: grab; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  user-select: none;
}
.bp-item:hover {
  border-color: rgba(124,58,237,0.4);
  background: rgba(124,58,237,0.02);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.bp-item:active { cursor: grabbing; transform: scale(0.96); }

.bp-item-icon { color: var(--accent, #7c3aed); transition: transform 0.2s; }
.bp-item:hover .bp-item-icon { transform: scale(1.1); }

.bp-item-name {
  font-size: 11px; font-weight: 500; color: var(--text-2); text-align: center;
  line-height: 1.3;
}

.bp-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: var(--text-3); text-align: center; padding: 40px 20px;
}
.bp-empty p { font-size: 13px; margin: 0; }
</style>
