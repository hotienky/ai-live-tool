<template>
  <div class="blk-pv" :class="'blk-pv--' + block.type">
    <!-- Hero Banner -->
    <div v-if="block.type === 'hero-banner'" class="pv-hero" :style="heroStyle">
      <div class="pv-hero__inner" :style="{ textAlign: s.text_align || 'center' }">
        <h3 v-if="s.title" class="pv-hero__title">{{ s.title }}</h3>
        <p v-if="s.subtitle" class="pv-hero__sub">{{ s.subtitle }}</p>
        <span v-if="s.button_text" class="pv-hero__btn">{{ s.button_text }}</span>
      </div>
    </div>

    <!-- Rich Text -->
    <div v-else-if="block.type === 'rich-text'" class="pv-richtext">
      <div v-if="s.content" v-html="truncateHtml(s.content, 200)" class="pv-richtext__body"></div>
      <p v-else class="pv-placeholder"><FileText :size="18" /> Nội dung văn bản trống</p>
    </div>

    <!-- Columns -->
    <div v-else-if="block.type.startsWith('columns')" class="pv-columns">
      <div class="pv-columns__indicator">
        <slot>
          <div
            v-for="(col, ci) in (block.children || [])"
            :key="ci"
            class="pv-columns__col"
            :style="{ width: getColumnWidth(s.layout, ci) }"
          >
            <template v-if="col && col.length > 0">
              <BlockPreview
                v-for="child in col"
                :key="child.id"
                :block="child"
                class="pv-columns__child"
              />
            </template>
            <div v-else class="pv-columns__empty">
              <Plus :size="12" />
            </div>
          </div>
        </slot>
      </div>
    </div>

    <!-- Image Banner -->
    <div v-else-if="block.type === 'image-banner'" class="pv-image">
      <img v-if="s.image" :src="s.image" :alt="s.alt || ''" class="pv-image__img" />
      <div v-else class="pv-image__placeholder">
        <ImageIcon :size="28" />
        <span>Chọn hình ảnh</span>
      </div>
    </div>

    <!-- Spacer -->
    <div v-else-if="block.type === 'spacer'" class="pv-spacer">
      <div class="pv-spacer__line"></div>
      <span class="pv-spacer__label">{{ s.height || '40px' }}</span>
    </div>

    <!-- HTML Embed -->
    <div v-else-if="block.type === 'html-embed'" class="pv-html">
      <Code :size="16" />
      <span class="pv-html__label">HTML / Shortcode</span>
      <code v-if="s.html" class="pv-html__code">{{ s.html.slice(0, 60) }}{{ s.html.length > 60 ? '...' : '' }}</code>
    </div>

    <!-- Blog Posts / Featured Products / Blog Collection / Generic -->
    <div v-else class="pv-generic">
      <component :is="resolveIcon(blockDef?.icon)" :size="22" class="pv-generic__icon" />
      <div class="pv-generic__info">
        <strong>{{ blockDef?.name || block.type }}</strong>
        <span v-if="summaryText" class="pv-generic__summary">{{ summaryText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { FileText, Code, Plus, Box, Image as ImageIcon, Minus, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Columns, Layers, Zap } from 'lucide-vue-next'

defineOptions({ name: 'BlockPreview' })

const props = defineProps({
  block: { type: Object, required: true },
  blockDef: { type: Object, default: null },
})

const s = computed(() => props.block.settings || {})

const ICON_MAP = { Image: ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Box, ImageIcon, Columns, Layers, Zap }
function resolveIcon(name) { return ICON_MAP[name] || Box }

const heroStyle = computed(() => ({
  minHeight: s.value.min_height || '120px',
  backgroundImage: s.value.image ? `url(${s.value.image})` : undefined,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
}))

const summaryText = computed(() => {
  const v = s.value
  if (v.title) return v.title
  if (v.category_id) return 'Danh mục: #' + v.category_id
  if (v.limit) return `Hiển thị ${v.limit} items`
  return ''
})

function truncateHtml(html, maxLen) {
  const text = html.replace(/<[^>]+>/g, '')
  if (text.length <= maxLen) return html
  // Return safe truncated version
  const safe = html.slice(0, html.indexOf('>', maxLen > 100 ? 100 : maxLen) + 1 || maxLen)
  return safe + '…'
}

function getColumnWidth(layout, colIdx) {
  if (layout === '60-40') return colIdx === 0 ? '60%' : '40%'
  if (layout === '40-60') return colIdx === 0 ? '40%' : '60%'
  if (layout === '33-33-33') return '33.33%'
  return '50%'
}
</script>

<style scoped>
.blk-pv { width: 100%; }

/* Hero */
.pv-hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pv-hero__inner { padding: 28px 20px; width: 100%; }
.pv-hero__title {
  font-size: 20px; font-weight: 800; color: #fff; margin: 0 0 6px;
  text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  line-height: 1.2;
}
.pv-hero__sub { font-size: 13px; color: rgba(255,255,255,0.85); margin: 0 0 12px; }
.pv-hero__btn {
  display: inline-block; padding: 8px 20px; border-radius: 6px;
  background: #fff; color: #764ba2; font-size: 12px; font-weight: 700;
}

/* Rich Text */
.pv-richtext { padding: 16px 20px; }
.pv-richtext__body {
  font-size: 13px; line-height: 1.6; color: var(--text-2, #4b5563);
  max-height: 100px; overflow: hidden;
}
.pv-richtext__body :deep(h1),
.pv-richtext__body :deep(h2),
.pv-richtext__body :deep(h3) { font-size: 16px; font-weight: 700; margin: 0 0 4px; color: var(--text-1); }
.pv-richtext__body :deep(p) { margin: 0 0 6px; }

/* Columns */
.pv-columns { padding: 8px; }
.pv-columns__indicator { display: flex; gap: 8px; min-height: 60px; }
.pv-columns__col {
  background: rgba(124,58,237,0.03);
  border: 1.5px dashed rgba(124,58,237,0.2);
  border-radius: 6px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 50px;
}
.pv-columns__empty {
  flex: 1; display: flex; align-items: center; justify-content: center;
  color: rgba(124,58,237,0.35); font-size: 11px;
}
.pv-columns__child { border-radius: 4px; border: 1px solid var(--border, #e5e7eb); background: #fff; }

/* Image */
.pv-image__img {
  width: 100%; max-height: 200px; object-fit: cover; border-radius: 6px;
  display: block;
}
.pv-image__placeholder {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; padding: 32px 20px;
  color: var(--text-3, #9ca3af); font-size: 12px;
  background: var(--bg-2, #f9fafb); border-radius: 6px;
  border: 2px dashed var(--border, #e5e7eb);
}

/* Spacer */
.pv-spacer {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 16px;
}
.pv-spacer__line { flex: 1; height: 0; border-top: 2px dashed var(--border, #d1d5db); }
.pv-spacer__label {
  font-size: 10px; font-weight: 600; color: var(--text-3, #9ca3af);
  padding: 2px 8px; background: var(--bg-2, #f5f5f5); border-radius: 4px;
}

/* HTML */
.pv-html {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 14px 16px;
  background: var(--bg-2, #f9fafb);
  border-radius: 6px;
}
.pv-html svg { color: #f59e0b; flex-shrink: 0; margin-top: 1px; }
.pv-html__label { font-size: 12px; font-weight: 600; color: var(--text-2); }
.pv-html__code {
  display: block; font-size: 10px; color: var(--text-3);
  font-family: monospace; margin-top: 4px;
  word-break: break-all;
}

/* Generic */
.pv-generic {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px;
}
.pv-generic__icon { color: var(--accent, #7c3aed); flex-shrink: 0; }
.pv-generic__info { display: flex; flex-direction: column; gap: 2px; }
.pv-generic__info strong { font-size: 13px; color: var(--text-1); }
.pv-generic__summary { font-size: 11px; color: var(--text-3); }

/* Placeholder */
.pv-placeholder {
  display: flex; align-items: center; gap: 6px;
  color: var(--text-3, #9ca3af); font-size: 12px; font-style: italic;
  padding: 8px 0; margin: 0;
}
</style>
