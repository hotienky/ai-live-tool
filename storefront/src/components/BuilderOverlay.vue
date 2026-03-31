<template>
  <div v-if="isBuilderMode" class="builder-overlay" :class="{ 'builder-overlay--active': isBuilderMode }">
    <!-- Section overlays — positioned absolutely over each section -->
    <div
      v-for="(info, idx) in sectionRects"
      :key="info.type + '-' + idx"
      class="bo-section-overlay"
      :class="{
        'bo-section-overlay--hover': hoveredIndex === idx,
        'bo-section-overlay--selected': selectedIndex === idx,
        'bo-section-overlay--dragging': dragState.dragging && dragState.fromIndex === idx,
        'bo-section-overlay--drop-target': dragState.dragging && dragState.overIndex === idx && dragState.fromIndex !== idx
      }"
      :style="{ top: info.top + 'px', left: info.left + 'px', width: info.width + 'px', height: info.height + 'px' }"
      @mouseenter="onHover(idx)"
      @mouseleave="onLeave(idx)"
      @click.stop="onSelect(idx)"
    >
      <!-- Section Label (top-left) -->
      <div class="bo-label" v-show="hoveredIndex === idx || selectedIndex === idx">
        <span class="bo-label__icon"><component :is="sectionIcons[info.type] || Box" :size="12" /></span>
        <span class="bo-label__text">{{ sectionNames[info.type] || info.type }}</span>
      </div>

      <!-- Section Toolbar (top-right) -->
      <div class="bo-toolbar" v-show="selectedIndex === idx">
        <template v-if="!info.isFixed">
          <button class="bo-toolbar__btn" @click.stop="moveSection(idx, -1)" :disabled="idx === 0" title="Di chuyển lên"><ArrowUp :size="14" /></button>
          <button class="bo-toolbar__btn" @click.stop="moveSection(idx, 1)" :disabled="idx === sectionRects.length - 1" title="Di chuyển xuống"><ArrowDown :size="14" /></button>
        </template>
        <button class="bo-toolbar__btn bo-toolbar__btn--config" @click.stop="openConfig(idx)" title="Cấu hình"><Settings :size="14" /></button>
        <template v-if="!info.isFixed">
          <button class="bo-toolbar__btn bo-toolbar__btn--toggle" @click.stop="toggleSection(idx)" title="Ẩn/Hiện"><Eye :size="14" /></button>
          <button class="bo-toolbar__btn bo-toolbar__btn--delete" @click.stop="deleteSection(idx)" title="Xóa"><Trash2 :size="14" /></button>
        </template>
      </div>

      <!-- Drag Handle (left edge) -->
      <div
        class="bo-drag-handle"
        v-show="(hoveredIndex === idx || selectedIndex === idx) && !info.isFixed"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
        title="Kéo để di chuyển"
      >
        <GripVertical :size="16" />
      </div>
    </div>

    <!-- Add Section buttons between sections -->
    <div
      v-for="(pos, idx) in addButtonPositions"
      :key="'add-' + idx"
      class="bo-add-btn-wrap"
      :style="{ top: pos.top + 'px' }"
    >
      <button class="bo-add-btn" @click.stop="addSectionAt(pos.insertIdx)" title="Thêm section">
        <Plus :size="18" stroke-width="2.5" />
      </button>
    </div>

    <!-- Inline Image Editing overlays -->
    <div v-if="selectedIndex > -1">
      <div
        v-for="(img, imgIdx) in editableImageRects"
        :key="'img-' + imgIdx"
        class="bo-image-overlay"
        :style="{ top: img.top + 'px', left: img.left + 'px', width: img.width + 'px', height: img.height + 'px' }"
        @click.stop="triggerImageEdit(img)"
      >
        <div class="bo-img-edit-btn">
          <ImageIcon :size="16" /> Thay ảnh
        </div>
      </div>
    </div>

    <!-- Inline Text Editing indicator -->
    <div v-if="editingField" class="bo-editing-indicator">
      <Pen :size="14" /> Đang sửa: {{ editingField.label }}
      <button @click="finishEditing"><Check :size="14" /> Xong</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch, inject } from 'vue'
import {
  ArrowUp, ArrowDown, Settings, Eye, Trash2, Plus, GripVertical, Pen, Check,
  PanelTop, PanelBottom, Image as ImageIcon, Tag, Zap, FolderOpen,
  ShoppingBag, Sparkles, FileText, FileEdit, Star, HelpCircle,
  Film, Type, Mail, Smartphone, ShieldCheck, LayoutGrid, Box
} from 'lucide-vue-next'

const isPreviewMode = inject('isPreviewMode', false)
const layoutConfig = inject('layoutConfig', ref(null))
const isBuilderMode = ref(false)
const selectedIndex = ref(-1)
const hoveredIndex = ref(-1)
const sectionRects = ref([])
const editingField = ref(null)

// Drag state
const dragState = ref({ dragging: false, fromIndex: -1, overIndex: -1 })

// Section display names
const sectionNames = {
  header: 'Header',
  footer: 'Footer',
  banner: 'Banner / Slider',
  image_banner: 'Promo Banner',
  feature_links: 'Tính năng nhanh',
  categories: 'Danh mục SP',
  flash_sale: 'Flash Sale',
  featured_products: 'SP nổi bật',
  new_arrivals: 'Hàng mới về',
  cms_pages: 'Trang CMS',
  blog_posts: 'Bài viết',
  testimonials: 'Đánh giá KH',
  faq: 'FAQ',
  image_gallery: 'Thư viện ảnh',
  video_embed: 'Video',
  text_block: 'Văn bản',
  newsletter: 'Đăng ký tin',
  social_feed: 'Mạng xã hội',
  brands_slider: 'Thương hiệu',
  trust_badges: 'Trust Badges',
  grid: 'Lưới bố cục',
  custom_block: 'Visual Block',
}

const sectionIcons = {
  header: PanelTop, footer: PanelBottom,
  banner: ImageIcon, image_banner: Tag, feature_links: Zap, categories: FolderOpen,
  flash_sale: Zap, featured_products: ShoppingBag, new_arrivals: Sparkles, cms_pages: FileText,
  blog_posts: FileEdit, testimonials: Star, faq: HelpCircle, image_gallery: ImageIcon,
  video_embed: Film, text_block: Type, newsletter: Mail, social_feed: Smartphone,
  brands_slider: Tag, trust_badges: ShieldCheck, grid: LayoutGrid, custom_block: Box,
}

// Editable text fields per section type
const editableFields = {
  featured_products: [{ key: 'title', selector: 'h2, .section-title' }],
  new_arrivals: [{ key: 'title', selector: 'h2, .section-title' }],
  testimonials: [{ key: 'title', selector: 'h2, .section-title' }],
  faq: [{ key: 'title', selector: 'h2, .section-title' }],
  image_gallery: [{ key: 'title', selector: 'h2, .section-title' }],
  newsletter: [
    { key: 'title', selector: 'h2, .section-title' },
    { key: 'subtitle', selector: 'p, .section-subtitle' },
  ],
  text_block: [{ key: 'title', selector: 'h2, .section-title' }],
}

// Editable image fields per section type
const editableImages = {
  header: [{ key: 'logo', selector: 'img.site-logo, .site-logo img' }],
  banner: [{ key: 'content.image', selector: '.banner-bg, img.banner-img' }],
  image_banner: [{ key: 'image', selector: 'img.promo-banner-img, .promo-banner-bg' }],
  categories: [{ key: 'content.image', selector: '.category-card img' }],
  featured_products: [{ key: 'banner', selector: '.fp-banner img, .fp-banner' }],
  image_gallery: [{ key: 'content.image', selector: '.gallery-item img' }],
  blog_posts: [{ key: 'content.image', selector: '.blog-card img' }],
  testimonials: [{ key: 'content.avatar', selector: '.testimonial-avatar' }],
  brands_slider: [{ key: 'content.image', selector: '.brand-item img' }],
  trust_badges: [{ key: 'content.icon', selector: '.trust-icon img' }],
}

const editableImageRects = ref([])


// Computed add button positions (between sections only, ignore around header/footer)
const addButtonPositions = computed(() => {
  if (!sectionRects.value.length) return []
  const positions = []
  const dynamicSections = sectionRects.value.filter(s => !s.isFixed)
  
  for (let i = 0; i <= dynamicSections.length; i++) {
    if (i === 0) {
      if (dynamicSections[0]) positions.push({ top: dynamicSections[0].top - 14, insertIdx: 0 })
    } else if (i === dynamicSections.length) {
      const last = dynamicSections[dynamicSections.length - 1]
      positions.push({ top: last.top + last.height - 2, insertIdx: i })
    } else {
      const prev = dynamicSections[i - 1]
      const next = dynamicSections[i]
      positions.push({ top: (prev.top + prev.height + next.top) / 2 - 14, insertIdx: i })
    }
  }
  return positions
})

// Scan DOM for section elements and compute their positions
function updateSectionRects() {
  const elements = document.querySelectorAll('[data-section-type]')
  const rects = []
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    const type = el.getAttribute('data-section-type')
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    rects.push({
      type,
      index: parseInt(el.getAttribute('data-section-index') || '0'),
      isFixed: type === 'header' || type === 'footer',
      top: rect.top + scrollTop,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      element: el,
    })
  })
  sectionRects.value = rects

  if (selectedIndex.value > -1) {
    updateImageRects(rects[selectedIndex.value])
  } else {
    editableImageRects.value = []
  }
}

// Event handlers
function onHover(idx) {
  hoveredIndex.value = idx
  sendToParent('builder:section-hover', { type: sectionRects.value[idx]?.type, index: idx })
}

function onLeave(idx) {
  if (hoveredIndex.value === idx) hoveredIndex.value = -1
}

function onSelect(idx) {
  selectedIndex.value = idx
  const info = sectionRects.value[idx]
  if (!info) return
  sendToParent('builder:section-selected', { type: info.type, index: idx })

  // Enable inline editing for this section
  enableInlineEditing(info)
  updateImageRects(info)
  
  // Smooth scroll to section
  info.element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

function updateImageRects(info) {
  if (!info || selectedIndex.value === -1) {
    editableImageRects.value = []
    return
  }
  const rules = editableImages[info.type]
  if (!rules) {
    editableImageRects.value = []
    return
  }

  const rects = []
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  rules.forEach(rule => {
    const els = info.element.querySelectorAll(rule.selector)
    els.forEach((el, elIdx) => {
      const rect = el.getBoundingClientRect()
      rects.push({
        type: info.type,
        index: selectedIndex.value, // this is the array index in the layout builder
        key: rule.key,
        itemIndex: rule.key.includes('content.') ? elIdx : null, // If it's a list like content.image
        top: rect.top + scrollTop,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        element: el
      })
    })
  })
  editableImageRects.value = rects
}

function triggerImageEdit(img) {
  sendToParent('builder:edit-image', {
    type: img.type,
    index: img.index,
    key: img.key,
    itemIndex: img.itemIndex
  })
}

function openConfig(idx) {
  const info = sectionRects.value[idx]
  sendToParent('builder:open-config', { type: info?.type, index: idx })
}

function moveSection(idx, direction) {
  const toIdx = idx + direction
  if (toIdx < 0 || toIdx >= sectionRects.value.length) return
  sendToParent('builder:section-reorder', { fromIndex: idx, toIndex: toIdx })
  selectedIndex.value = toIdx
}

function toggleSection(idx) {
  const info = sectionRects.value[idx]
  sendToParent('builder:section-toggle', { type: info?.type, index: idx })
}

function deleteSection(idx) {
  const info = sectionRects.value[idx]
  sendToParent('builder:section-delete', { type: info?.type, index: idx })
  selectedIndex.value = -1
}

function addSectionAt(idx) {
  sendToParent('builder:add-section-at', { index: idx })
}

// Inline text editing
function enableInlineEditing(info) {
  const fields = editableFields[info.type]
  if (!fields) return

  fields.forEach((field) => {
    const el = info.element?.querySelector(field.selector)
    if (!el) return
    
    el.setAttribute('contenteditable', 'true')
    el.classList.add('bo-editable')
    el.dataset.editKey = field.key
    el.dataset.sectionType = info.type
    
    // Remove any old listeners
    el.removeEventListener('blur', handleInlineBlur)
    el.removeEventListener('keydown', handleInlineKeydown)
    
    // Add listeners
    el.addEventListener('blur', handleInlineBlur)
    el.addEventListener('keydown', handleInlineKeydown)
  })
}

function disableAllInlineEditing() {
  document.querySelectorAll('.bo-editable').forEach((el) => {
    el.removeAttribute('contenteditable')
    el.classList.remove('bo-editable')
    el.removeEventListener('blur', handleInlineBlur)
    el.removeEventListener('keydown', handleInlineKeydown)
  })
  editingField.value = null
}

function handleInlineBlur(e) {
  const el = e.target
  const key = el.dataset.editKey
  const type = el.dataset.sectionType
  const value = el.textContent.trim()
  
  sendToParent('builder:inline-edit', { type, field: key, value })
  editingField.value = null
}

function handleInlineKeydown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    e.target.blur()
  }
  if (e.key === 'Escape') {
    e.target.blur()
  }
}

function finishEditing() {
  document.querySelector('.bo-editable:focus')?.blur()
}

// Drag and drop
function onDragStart(e, idx) {
  dragState.value = { dragging: true, fromIndex: idx, overIndex: -1 }
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
}

function onDragEnd() {
  if (dragState.value.overIndex >= 0 && dragState.value.fromIndex !== dragState.value.overIndex) {
    sendToParent('builder:section-reorder', {
      fromIndex: dragState.value.fromIndex,
      toIndex: dragState.value.overIndex
    })
  }
  dragState.value = { dragging: false, fromIndex: -1, overIndex: -1 }
}

// Communication with parent (admin builder)
function sendToParent(type, payload) {
  if (!window.parent || window.parent === window) return
  window.parent.postMessage({ type, payload }, '*')
}

// Listen for messages from parent
function handleParentMessage(event) {
  const { type, payload } = event.data || {}
  
  switch (type) {
    case 'builder:mode':
      isBuilderMode.value = payload?.mode === 'edit'
      if (isBuilderMode.value) {
        nextTick(updateSectionRects)
      } else {
        disableAllInlineEditing()
      }
      break
    
    case 'builder:highlight-section':
      if (payload?.index !== undefined) {
        hoveredIndex.value = payload.index
      }
      break
    
    case 'builder:select-section':
      if (payload?.index !== undefined) {
        selectedIndex.value = payload.index
        const info = sectionRects.value[payload.index]
        if (info) {
          enableInlineEditing(info)
          info.element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      break

    case 'layout-preview-update':
      // Layout updated — recalculate section positions after render
      nextTick(() => {
        setTimeout(updateSectionRects, 300)
      })
      break
  }
}

// Auto-refresh rects on scroll/resize
let rafId = null
function onScrollResize() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateSectionRects)
}

// MutationObserver to track DOM changes (sections appearing/disappearing)
let observer = null

onMounted(() => {
  if (!isPreviewMode) return
  
  // Enable builder mode automatically in preview
  isBuilderMode.value = true
  
  window.addEventListener('message', handleParentMessage)
  window.addEventListener('scroll', onScrollResize, { passive: true })
  window.addEventListener('resize', onScrollResize, { passive: true })

  // Tell parent we're ready
  sendToParent('builder:ready', { version: '1.0' })

  // Observe DOM mutations for section changes
  observer = new MutationObserver(() => {
    nextTick(updateSectionRects)
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-section-type'],
  })

  // Initial scan
  setTimeout(updateSectionRects, 500)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleParentMessage)
  window.removeEventListener('scroll', onScrollResize)
  window.removeEventListener('resize', onScrollResize)
  if (observer) observer.disconnect()
  if (rafId) cancelAnimationFrame(rafId)
  disableAllInlineEditing()
})

// Also rescan when layoutConfig changes
watch(layoutConfig, () => {
  nextTick(() => setTimeout(updateSectionRects, 300))
}, { deep: true })
</script>

<style>
/* ═══════ Builder Overlay — Global Styles ═══════ */
/* These styles are intentionally NOT scoped because they need to affect
   the overlay which is positioned over the entire page */

.builder-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  pointer-events: none;
  z-index: 9990;
}

/* Section Overlay */
.bo-section-overlay {
  position: absolute;
  pointer-events: all;
  cursor: pointer;
  border: 2px solid transparent;
  border-radius: 4px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}

.bo-section-overlay--hover {
  border-color: rgba(0, 102, 255, 0.5);
  background: rgba(0, 102, 255, 0.02);
}

.bo-section-overlay--selected {
  border-color: #0066ff;
  box-shadow: 0 0 0 3px rgba(0, 102, 255, 0.15);
  background: rgba(0, 102, 255, 0.03);
}

.bo-section-overlay--dragging {
  opacity: 0.4;
  border-style: dashed;
}

.bo-section-overlay--drop-target {
  border-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.15);
}

/* Section Label (top-left pill) */
.bo-label {
  position: absolute;
  top: -1px;
  left: 8px;
  transform: translateY(-100%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px 3px 6px;
  background: #0066ff;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px 6px 0 0;
  white-space: nowrap;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
  letter-spacing: 0.2px;
  box-shadow: 0 -2px 8px rgba(0, 102, 255, 0.2);
}

.bo-label__icon {
  font-size: 12px;
  line-height: 1;
}

/* Section Toolbar (top-right) */
.bo-toolbar {
  position: absolute;
  top: -1px;
  right: 8px;
  transform: translateY(-100%);
  display: flex;
  gap: 1px;
  background: #111827; /* Darker, sleeker toolbar */
  border-radius: 6px 6px 0 0;
  padding: 2px;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.15);
}

.bo-toolbar__btn {
  width: 26px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  border-radius: 4px;
  font-size: 12px;
  transition: all 0.1s;
  padding: 0;
}

.bo-toolbar__btn:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.bo-toolbar__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.bo-toolbar__btn--config:hover {
  background: rgba(0, 102, 255, 0.3);
}

.bo-toolbar__btn--delete:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

/* Drag Handle (left edge) */
.bo-drag-handle {
  position: absolute;
  top: 50%;
  left: -1px;
  transform: translate(-100%, -50%);
  width: 20px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #0066ff;
  color: #fff;
  font-size: 14px;
  border-radius: 4px 0 0 4px;
  cursor: grab;
  pointer-events: all;
  transition: background 0.15s;
  font-family: monospace;
  letter-spacing: -2px;
  box-shadow: -2px 0 8px rgba(0, 102, 255, 0.2);
}

.bo-drag-handle:hover {
  background: #005ce6;
}

.bo-drag-handle:active {
  cursor: grabbing;
  background: #0052cc;
}

/* Add Section Buttons */
.bo-add-btn-wrap {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9991;
  pointer-events: all;
}

.bo-add-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px dashed rgba(0, 102, 255, 0.3);
  background: rgba(255, 255, 255, 0.95);
  color: #0066ff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.bo-add-btn-wrap:hover .bo-add-btn,
.builder-overlay:hover .bo-add-btn {
  opacity: 1;
}

.bo-add-btn:hover {
  border-color: #0066ff;
  background: #0066ff;
  color: #fff;
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 102, 255, 0.35);
}

/* Inline Editing Styles */
/* Inline Image Edit Overlay */
.bo-image-overlay {
  position: absolute;
  z-index: 10000;
  border: 2px dashed var(--ob-accent);
  background: rgba(0, 102, 255, 0.1);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
  border-radius: 8px; /* Assuming most modern images have slight border radius */
}
.bo-image-overlay:hover {
  background: rgba(0, 102, 255, 0.25);
}
.bo-img-edit-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--ob-accent); color: white;
  padding: 8px 14px; border-radius: 20px;
  font-size: 13px; font-weight: 700;
  box-shadow: 0 4px 12px rgba(0, 102, 255, 0.3);
  opacity: 0; transform: translateY(10px); transition: all 0.2s;
}
.bo-image-overlay:hover .bo-img-edit-btn {
  opacity: 1; transform: translateY(0);
}

.bo-editable {
  outline: 2px dashed rgba(0, 102, 255, 0.4) !important;
  outline-offset: 2px;
  cursor: text !important;
  border-radius: 2px;
  transition: outline-color 0.15s;
  min-width: 20px;
}

.bo-editable:focus {
  outline-color: #0066ff !important;
  outline-style: solid !important;
  background: rgba(0, 102, 255, 0.03);
}

/* Editing indicator */
.bo-editing-indicator {
  position: fixed;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 20px;
  background: #111827;
  color: #fff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  pointer-events: all;
  z-index: 9999;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
}

.bo-editing-indicator button {
  background: #0066ff;
  border: none;
  color: #fff;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
}

.bo-editing-indicator button:hover {
  filter: brightness(1.15);
}
</style>
