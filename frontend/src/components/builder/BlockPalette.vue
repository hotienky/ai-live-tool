<template>
  <div class="block-palette">
    <div class="bp-header">
      <h4 class="bp-title"><Plus :size="16" /> {{ t('admin.add_block', 'Thêm Block') }}</h4>
      <div class="bp-search">
        <Search :size="13" />
        <input v-model="search" type="text" :placeholder="t('admin.search_blocks', 'Tìm block...')" class="bp-search__input" />
      </div>
    </div>

    <!-- Categories -->
    <div class="bp-categories">
      <button v-for="cat in categories" :key="cat" class="bp-cat-btn" :class="{ active: activeCategory === cat }" @click="activeCategory = cat">
        {{ categoryLabels[cat] || cat }}
      </button>
    </div>

    <!-- Block Grid -->
    <div class="bp-grid">
      <button
        v-for="block in filteredBlocks" :key="block.type"
        class="bp-block"
        @click="$emit('select', block.type)"
      >
        <component :is="resolveIcon(block.icon)" :size="20" class="bp-block__icon" />
        <span class="bp-block__label">{{ block.label }}</span>
      </button>
    </div>

    <div v-if="filteredBlocks.length === 0" class="bp-empty">
      {{ t('admin.no_blocks', 'Không tìm thấy block phù hợp') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Search, Type, AlignLeft, Image, MousePointer, Space, Minus, Play, Smile, Code, Columns, LayoutGrid } from 'lucide-vue-next'
import { blockRegistry } from '../../core/blocks.js'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()
defineEmits(['select'])

const search = ref('')
const activeCategory = ref('all')

const categoryLabels = {
  all: 'Tất cả',
  basic: 'Cơ bản',
  layout: 'Bố cục',
  media: 'Media',
  advanced: 'Nâng cao',
  content: 'Nội dung',
}

const iconMap = {
  Type, AlignLeft, Image, MousePointer, Space, Minus, Play, Smile, Code, Columns,
}

const allBlocks = computed(() => blockRegistry.all())

const categories = computed(() => {
  const cats = new Set(allBlocks.value.map(b => b.category))
  return ['all', ...cats]
})

const filteredBlocks = computed(() => {
  let items = allBlocks.value
  if (activeCategory.value !== 'all') {
    items = items.filter(b => b.category === activeCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    items = items.filter(b => b.label.toLowerCase().includes(q) || b.type.includes(q))
  }
  return items
})

function resolveIcon(name) {
  return iconMap[name] || LayoutGrid
}
</script>

<style scoped>
.block-palette { padding: 16px; }

.bp-header { margin-bottom: 16px; }
.bp-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; margin: 0 0 12px;
}
.bp-search {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--bg-2, #f3f4f6); border: 1px solid var(--color-border);
}
.bp-search svg { color: var(--text-3); flex-shrink: 0; }
.bp-search__input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 13px; color: var(--text-1);
}

/* Categories */
.bp-categories { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
.bp-cat-btn {
  padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
  text-transform: capitalize;
}
.bp-cat-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Grid */
.bp-grid {
  display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;
}
.bp-block {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 16px 10px; border-radius: 10px; cursor: pointer;
  border: 1px solid var(--color-border); background: var(--glass-bg);
  transition: all 0.2s; color: var(--text-2);
}
.bp-block:hover {
  border-color: var(--accent); color: var(--accent);
  transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}
.bp-block__icon { opacity: 0.7; }
.bp-block:hover .bp-block__icon { opacity: 1; }
.bp-block__label { font-size: 11px; font-weight: 700; }

.bp-empty {
  text-align: center; padding: 24px; color: var(--text-3); font-size: 13px;
}
</style>
