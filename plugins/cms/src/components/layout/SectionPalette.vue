<template>
  <div class="sp">
    <div class="sp-title">Thư viện Sections</div>

    <div class="sp-search-wrap">
      <Search :size="13" class="sp-search-icon" />
      <input v-model="search" type="text" placeholder="Tìm section..." class="sp-search" />
    </div>

    <div class="sp-scroll">
      <template v-for="(list, group) in filteredGroups" :key="group">
        <div class="sp-group-title">{{ GROUP_LABELS[group] || group }}</div>

        <div
          v-for="s in list"
          :key="s.type"
          class="sp-item"
          draggable="true"
          @dragstart="onDragStart($event, s)"
          @dragend="dragging = null"
          @click="$emit('add-section', s.type)"
          :class="{ 'sp-item--dragging': dragging === s.type }"
          :title="s.label"
        >
          <span class="sp-item__icon">
            <component :is="resolveIcon(s.icon)" :size="14" />
          </span>
          <span class="sp-item__name">{{ s.label }}</span>
          <span v-if="s.hasSchema" class="sp-item__badge" title="Có schema config">✦</span>
          <Plus :size="11" class="sp-item__plus" />
        </div>
      </template>

      <p v-if="hasNoResults" class="sp-empty">Không tìm thấy section nào</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Search, Plus, Image, FileText, ShoppingBag, Star, FolderTree,
  Sparkles, Zap, BookOpen, Video, Mail, LayoutGrid, MessageCircle,
  ImageIcon, Building2, Box,
} from 'lucide-vue-next'

defineEmits(['add-section'])

const search = ref('')
const dragging = ref(null)

const ICON_MAP = {
  ShoppingBag, Sparkles, FolderTree, Zap, Image, ImageIcon,
  Star, MessageCircle, FileText, Video, Mail, LayoutGrid,
  BookOpen, Building2, Box,
}

const GROUP_LABELS = {
  ecom: 'E-Commerce',
  banner: 'Banner & Hero',
  content: 'Nội dung',
  blog: 'Blog',
}

// Danh sách tất cả section types — đọc hasSchema từ window.__SECTION_SCHEMAS__
const ALL_SECTIONS = [
  // E-commerce
  { type: 'featured_products', label: 'Sản phẩm nổi bật', icon: 'ShoppingBag', group: 'ecom' },
  { type: 'new_arrivals',      label: 'Hàng mới về',      icon: 'Sparkles',     group: 'ecom' },
  { type: 'categories',        label: 'Danh mục SP',       icon: 'FolderTree',   group: 'ecom' },
  { type: 'flash_sale',        label: 'Flash Sale',         icon: 'Zap',          group: 'ecom' },
  { type: 'product_listing',   label: 'Danh sách SP',       icon: 'LayoutGrid',   group: 'ecom' },
  // Banner
  { type: 'banner',            label: 'Banner chính',       icon: 'Image',        group: 'banner' },
  { type: 'image_banner',      label: 'Image Banner',       icon: 'ImageIcon',    group: 'banner' },
  { type: 'pharmacy_hero',     label: 'Pharmacy Hero',      icon: 'Building2',    group: 'banner' },
  // Content
  { type: 'testimonials',      label: 'Đánh giá KH',        icon: 'Star',         group: 'content' },
  { type: 'faq',               label: 'FAQ',                icon: 'MessageCircle',group: 'content' },
  { type: 'text_block',        label: 'Text Block',          icon: 'FileText',     group: 'content' },
  { type: 'video_embed',       label: 'Video',              icon: 'Video',        group: 'content' },
  { type: 'newsletter',        label: 'Newsletter',          icon: 'Mail',         group: 'content' },
  { type: 'image_gallery',     label: 'Gallery ảnh',         icon: 'LayoutGrid',   group: 'content' },
  // Blog
  { type: 'blog_posts',        label: 'Bài viết blog',       icon: 'BookOpen',     group: 'blog' },
  { type: 'blog_collection',   label: 'Bộ sưu tập blog',     icon: 'BookOpen',     group: 'blog' },
]

const schemas = window.__SECTION_SCHEMAS__ || {}

const sectionsWithSchema = computed(() =>
  ALL_SECTIONS.map(s => ({ ...s, hasSchema: !!schemas[s.type] }))
)

const groupedSections = computed(() => {
  const groups = {}
  for (const s of sectionsWithSchema.value) {
    if (!groups[s.group]) groups[s.group] = []
    groups[s.group].push(s)
  }
  return groups
})

const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return groupedSections.value
  const result = {}
  for (const [g, list] of Object.entries(groupedSections.value)) {
    const filtered = list.filter(s => s.label.toLowerCase().includes(q) || s.type.includes(q))
    if (filtered.length) result[g] = filtered
  }
  return result
})

const hasNoResults = computed(() =>
  search.value.trim() && !Object.keys(filteredGroups.value).length
)

function resolveIcon(name) {
  return ICON_MAP[name] || Box
}

function onDragStart(event, s) {
  dragging.value = s.type
  event.dataTransfer.setData('source', 'section-palette')
  event.dataTransfer.setData('section-type', s.type)
  event.dataTransfer.effectAllowed = 'copy'
}
</script>

<style scoped>
.sp {
  width: 210px;
  min-width: 190px;
  background: var(--bg-2, #f9fafb);
  border-right: 1px solid var(--border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sp-title {
  padding: 12px 14px 8px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-3, #9ca3af);
  flex-shrink: 0;
}
.sp-search-wrap {
  position: relative;
  margin: 0 10px 8px;
  flex-shrink: 0;
}
.sp-search-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-3);
  pointer-events: none;
}
.sp-search {
  width: 100%;
  padding: 5px 8px 5px 26px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-1, #fff);
  font-size: 12px;
  color: var(--text-1);
  box-sizing: border-box;
}
.sp-search:focus { outline: none; border-color: var(--accent, #7c3aed); }

.sp-scroll { flex: 1; overflow-y: auto; padding: 0 6px 12px; }
.sp-group-title {
  padding: 10px 8px 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--text-3, #9ca3af);
}
.sp-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 8px;
  border-radius: 7px;
  cursor: grab;
  user-select: none;
  transition: background .15s;
  margin-bottom: 2px;
  border: 1px solid transparent;
}
.sp-item:hover {
  background: var(--bg-3, rgba(0,0,0,.04));
  border-color: var(--border);
}
.sp-item:hover .sp-item__plus { opacity: 1; }
.sp-item--dragging {
  background: rgba(124,58,237,.08);
  border-color: rgba(124,58,237,.2);
}
.sp-item__icon {
  color: var(--accent, #7c3aed);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.sp-item__name { font-size: 12px; color: var(--text-1); flex: 1; }
.sp-item__badge {
  font-size: 9px;
  color: var(--accent);
  opacity: .6;
  flex-shrink: 0;
}
.sp-item__plus { color: var(--text-3); opacity: 0; transition: opacity .15s; flex-shrink: 0; }
.sp-empty { text-align: center; font-size: 12px; color: var(--text-3); padding: 16px; }
</style>
