<template>
  <div class="section-list">
    <!-- Section Count Badge -->
    <div class="section-list__header" v-if="list.length > 0">
      <span class="section-list__count">{{ list.length }} section{{ list.length !== 1 ? 's' : '' }}</span>
      <span class="section-list__active-count">{{ list.filter(s => s.enabled).length }} active</span>
    </div>
    <div class="element-palette">
      <!-- Mẫu Nguyên Thuỷ -->
      <div 
        v-for="e in primitiveElements" 
        :key="e.type"
        class="ep-item" 
        draggable="true" 
        @dragstart="onDragStartNew($event, e.type)"
        :title="'Kéo thả ' + e.label"
      >
        <component :is="e.icon" :size="20" class="ep-icon" />
        <span>{{ e.label }}</span>
      </div>
    </div>
    <div class="element-palette-saved" v-if="savedCustomBlocks.length > 0">
      <div class="eps-title"><FolderOpen :size="12" /> Mẫu Của Tôi</div>
      <div class="element-palette">
        <div 
          v-for="(b, bIndex) in savedCustomBlocks" 
          :key="b.bId"
          class="ep-item ep-item--saved" 
          draggable="true" 
          @dragstart="onDragStartSavedBlock($event, b.data)"
          :title="b.name"
        >
          <Box :size="20" class="ep-icon" />
          <span class="ep-item-name-saved">{{ b.name }}</span>
          <button class="btn-icon-soft" @click.stop="removeSavedBlock(bIndex)" title="Xoá mẫu"><Trash2 :size="12"/></button>
        </div>
      </div>
    </div>
    
    <!-- Quick Search -->
    <div class="section-search" v-if="list.length > 0">
      <Search class="section-search__icon" :size="14" />
      <input type="text" v-model="searchQuery" placeholder="Tìm kiếm section..." class="section-search__input" />
      <button v-if="searchQuery" class="section-search__clear" @click="searchQuery = ''"><X :size="12" /></button>
    </div>

    <div
      v-for="(section, idx) in list"
      :key="section.id || section.type + idx"
      class="section-item-wrap"
      :data-section-panel="section.type"
      v-show="isMatch(section)"
    >
      <div
        class="section-item"
        :class="{
          disabled: !section.enabled,
          dragging: dragIndex === idx,
          'drag-over': dragOverIndex === idx && dragIndex !== idx,
          expanded: expandedSection === section.type,
          'section-item--active': activeConfig === ('section-' + (section.id || section.type)),
        }"
        draggable="true"
        @click="openSectionConfig(section)"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, idx)"
        @dragenter.prevent="onDragEnter(idx)"
        @dragleave="onDragLeave(idx)"
        @drop.prevent="onDrop(idx)"
        @contextmenu.prevent="openContextMenu($event, idx)"
      >
        <div class="section-item__left">
          <div class="section-item__drag-handle">
            <GripVertical :size="14" />
          </div>
          <span class="section-item__icon">
            <component v-if="sectionMeta[section.type]?.icon" :is="sectionMeta[section.type].icon" :size="14" />
            <Box v-else :size="14" />
          </span>
          <span 
            v-if="renamingIndex !== idx" 
            class="section-item__name"
            @dblclick.stop="startRename(idx, section)"
            title="Nhấp đúp để đổi tên"
          >
            {{ section.customName || sectionMeta[section.type]?.label || section.type }}
          </span>
          <input 
            v-else
            v-model="renameValue"
            class="section-item__rename-input"
            @blur="finishRename(section, idx)"
            @keyup.enter="finishRename(section, idx)"
            @keyup.esc="cancelRename"
            @click.stop
          />
        </div>
        <div class="section-item__right">
          <div class="section-actions-hover">
            <button
              class="btn-action btn-action--style"
              @click.stop="openSectionConfig(section)"
              data-tooltip="Tùy chỉnh"
            ><Settings2 :size="13" /></button>
            <button
              class="btn-action btn-action--dup"
              @click.stop="duplicateSection(idx)"
              data-tooltip="Nhân đôi"
            ><Copy :size="12" /></button>
            <button
              class="btn-action btn-action--save"
              @click.stop="saveAsBlock(section)"
              data-tooltip="Lưu thành Mẫu"
            ><FolderPlus :size="12" /></button>
            <button
              class="btn-action btn-action--style"
              @click.stop="copyStyle(section)"
              data-tooltip="Copy Style"
            ><ClipboardCopy :size="12" /></button>
            <button
              class="btn-action btn-action--style"
              @click.stop="pasteStyle(section)"
              data-tooltip="Paste Style"
              :disabled="!hasCopiedStyle"
            ><ClipboardPaste :size="12" /></button>
            <button
              class="btn-action btn-action--del"
              @click.stop="deleteSection(idx)"
              data-tooltip="Xoá section"
            ><Trash2 :size="12" /></button>
          </div>
          <!-- Move Up/Down -->
          <div class="section-move-btns">
            <button class="btn-move" :disabled="idx === 0" @click.stop="moveSection(idx, -1)" title="Di chuyển lên">▲</button>
            <button class="btn-move" :disabled="idx === list.length - 1" @click.stop="moveSection(idx, 1)" title="Di chuyển xuống">▼</button>
          </div>
          <label class="toggle-switch" data-tooltip="Hiển thị" @click.stop>
            <input type="checkbox" v-model="section.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>


    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div v-if="contextMenuVisible" class="context-menu-wrapper" :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }" @click.stop>
        <ul class="context-menu">
          <li @click="cmAction('settings')"><Settings2 :size="14" /> Tuỳ chỉnh</li>
          <li @click="cmAction('duplicate')"><Copy :size="14" /> Nhân đôi</li>
          <li @click="cmAction('saveAsBlock')"><FolderPlus :size="14" /> Lưu thành Mẫu</li>
          <li class="cm-divider"></li>
          <li @click="cmAction('copyStyle')"><ClipboardCopy :size="14" /> Copy Style</li>
          <li @click="cmAction('pasteStyle')" :class="{ disabled: !hasCopiedStyle }"><ClipboardPaste :size="14" /> Paste Style</li>
          <li class="cm-divider"></li>
          <li @click="cmAction('delete')" class="cm-danger"><Trash2 :size="14" /> Xoá</li>
        </ul>
      </div>
    </Teleport>

    <!-- Empty State -->
    <div v-if="list.length === 0" class="section-empty-state">
      <Box :size="32" style="color: #94a3b8" />
      <p class="section-empty-state__title">Chưa có section nào</p>
      <p class="section-empty-state__desc">Nhấn <strong>+ Thêm Section</strong> hoặc kéo thả elements từ palette ở trên để bắt đầu.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { GripVertical, Settings2, Trash2, Box, ChevronLeft, Copy, ClipboardCopy, ClipboardPaste, FolderPlus, FolderOpen, Type, AlignLeft, Image as ImageIcon, MousePointerClick, Link2, Minus, Frame, Video, List, LayoutGrid, Square, Search, X } from 'lucide-vue-next'

const primitiveElements = [
  { type: 'container', label: 'Container', icon: Box },
  { type: 'grid', label: 'Grid', icon: LayoutGrid },
  { type: 'card', label: 'Card', icon: Square },
  { type: 'heading', label: 'Heading', icon: Type },
  { type: 'text', label: 'Text', icon: AlignLeft },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'link', label: 'Link', icon: Link2 },
  { type: 'divider', label: 'Divider', icon: Minus },
  { type: 'iframe', label: 'Iframe', icon: Frame },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'form', label: 'Form', icon: List }
]
import { useI18n } from '../../composables/useI18n.js'

// Module-level global to share cloned styles across section managers
let copiedStylePayload = null
const currentCopiedTs = ref(Date.now())
// SectionConfigEditor moved to right panel in StorefrontLayoutBuilder
import LanguageTabs from '../LanguageTabs.vue'

const { t } = useI18n()
import { useLanguages } from '../../composables/useLanguages.js'
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
import { onMounted, onBeforeUnmount } from 'vue'

loadLangs()
const currentLang = ref(defaultLangCode.value)

// Context Menu State
const contextMenuVisible = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuActiveSectionIndex = ref(null)

function openContextMenu(e, idx) {
  contextMenuVisible.value = true
  
  // ensure menu doesn't overflow screen horizontally
  let x = e.clientX
  let y = e.clientY
  if (window.innerWidth - x < 180) x = window.innerWidth - 180
  if (window.innerHeight - y < 250) y = window.innerHeight - 250

  contextMenuPos.value = { x, y }
  contextMenuActiveSectionIndex.value = idx
}

function closeContextMenu() {
  contextMenuVisible.value = false
}

onMounted(() => document.addEventListener('click', closeContextMenu))
onBeforeUnmount(() => document.removeEventListener('click', closeContextMenu))

function cmAction(actionType) {
  const idx = contextMenuActiveSectionIndex.value
  if (idx === null || !list.value[idx]) return
  
  const section = list.value[idx]
  if (actionType === 'settings') openSectionConfig(section)
  if (actionType === 'duplicate') duplicateSection(idx)
  if (actionType === 'delete') deleteSection(idx)
  if (actionType === 'copyStyle') copyStyle(section)
  if (actionType === 'pasteStyle') pasteStyle(section)
  if (actionType === 'saveAsBlock') saveAsBlock(section)
  
  contextMenuVisible.value = false
}

const props = defineProps({
  sections: { type: Array, required: true },
  sectionMeta: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] },
  activeConfig: { default: null },
})
const emit = defineEmits(['update:sections', 'open-block-editor', 'active-change'])

const list = computed({
  get: () => props.sections,
  set: v => emit('update:sections', v),
})

const expandedSection = ref(null)

const dragNewType = ref(null)

const renamingIndex = ref(null)
const renameValue = ref('')

function startRename(idx, section) {
  renamingIndex.value = idx
  renameValue.value = section.customName || props.sectionMeta[section.type]?.label || section.type
  nextTick(() => {
    const input = document.querySelector('.section-item__rename-input')
    if (input) {
      input.focus()
      input.select()
    }
  })
}

function finishRename(section, idx) {
  if (renamingIndex.value !== idx) return
  const val = renameValue.value.trim()
  if (val) {
    if (val !== (props.sectionMeta[section.type]?.label || section.type)) {
      section.customName = val
    } else {
      delete section.customName
    }
  }
  renamingIndex.value = null
}

function cancelRename() {
  renamingIndex.value = null
}

const searchQuery = ref('')
function isMatch(section) {
  if (!searchQuery.value) return true
  const query = searchQuery.value.toLowerCase()
  const label = props.sectionMeta[section.type]?.label || section.type
  return label.toLowerCase().includes(query) || section.type.toLowerCase().includes(query)
}

// Drag Drop Logic
const dragIndex = ref(null)

const hasCopiedStyle = computed(() => {
  // Use currentCopiedTs to make it reactive
  return currentCopiedTs.value && copiedStylePayload !== null
})

function copyStyle(section) {
  if (!section.settings) return
  copiedStylePayload = {
    style: JSON.parse(JSON.stringify(section.settings.style || {})),
    hoverStyle: JSON.parse(JSON.stringify(section.settings.hoverStyle || {})),
    tabletStyle: JSON.parse(JSON.stringify(section.settings.tabletStyle || {})),
    tabletHoverStyle: JSON.parse(JSON.stringify(section.settings.tabletHoverStyle || {})),
    mobileStyle: JSON.parse(JSON.stringify(section.settings.mobileStyle || {})),
    mobileHoverStyle: JSON.parse(JSON.stringify(section.settings.mobileHoverStyle || {})),
  }
  currentCopiedTs.value = Date.now()
  // alert('Đã copy style!') // optional UX
}

function pasteStyle(section) {
  if (!copiedStylePayload) return
  if (!section.settings) section.settings = {}
  Object.assign(section.settings, JSON.parse(JSON.stringify(copiedStylePayload)))
  // force update tracking or rely on deep watch
  emit('update:sections', [...props.sections])
}
const dragOverIndex = ref(null)

const dragNewSavedBlock = ref(null)
const savedCustomBlocks = ref(JSON.parse(localStorage.getItem('sf_saved_blocks') || '[]'))

function saveAsBlock(section) {
  const name = prompt('Đặt tên cho Mẫu (Block) này:', 'Custom ' + section.type)
  if (!name) return
  const clone = JSON.parse(JSON.stringify(section))
  const newBlock = { bId: Date.now(), name, data: clone }
  savedCustomBlocks.value.push(newBlock)
  localStorage.setItem('sf_saved_blocks', JSON.stringify(savedCustomBlocks.value))
}

function removeSavedBlock(idx) {
  savedCustomBlocks.value.splice(idx, 1)
  localStorage.setItem('sf_saved_blocks', JSON.stringify(savedCustomBlocks.value))
}

function onDragStartSavedBlock(e, blockData) {
  dragNewSavedBlock.value = blockData
  dragIndex.value = null
  e.dataTransfer.effectAllowed = 'copy'
}

function regenerateIds(node) {
  if (!node) return
  node.id = 'sf_node_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6)
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach(regenerateIds)
  }
}

function onDragStartNew(e, type) {
  dragNewType.value = type
  dragIndex.value = null
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/plain', 'new:' + type)
}

function onDragStart(e, idx) { dragIndex.value = idx; dragNewType.value = null; dragNewSavedBlock.value = null; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) }
function onDragEnd() { dragIndex.value = null; dragNewType.value = null; dragNewSavedBlock.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = (dragNewType.value || dragNewSavedBlock.value) ? 'copy' : 'move' }
function onDragEnter(idx) { if ((dragIndex.value !== null && dragIndex.value !== idx) || dragNewType.value || dragNewSavedBlock.value) dragOverIndex.value = idx }
function onDragLeave(idx) { if (dragOverIndex.value === idx) dragOverIndex.value = null }

function onDrop(targetIdx) {
  dragOverIndex.value = null
  
  if (dragNewType.value) {
    const type = dragNewType.value
    const newEl = {
      id: type + '-' + Date.now(),
      type: type,
      enabled: true,
      settings: { style: {} },
      children: []
    }
    
    // Thêm nội dung mẫu
    if (['text', 'heading', 'button', 'link'].includes(type)) {
      newEl.content = 'New ' + type
    } else if (type === 'image') {
      newEl.settings.src = 'https://placehold.co/600x400?text=Image'
    } else if (type === 'container') {
      newEl.settings.style = { minHeight: '50px', padding: '16px', border: '1px dashed #ccc' }
    } else if (type === 'grid') {
      newEl.settings.style = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '50px', padding: '16px', border: '1px dashed #ccc' }
    } else if (type === 'card') {
      newEl.settings.style = { padding: '24px', borderRadius: '12px', backgroundColor: '#ffffff', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }
    } else if (type === 'divider') {
      newEl.settings.style = { borderTop: '1px solid #e2e8f0', margin: '24px 0', width: '100%' }
    } else if (type === 'iframe') {
      newEl.settings.src = 'https://www.youtube.com/embed/dQw4w9WgXcQ'
      newEl.settings.style = { width: '100%', minHeight: '350px' }
    } else if (type === 'video') {
      newEl.settings.src = 'https://www.w3schools.com/html/mov_bbb.mp4'
      newEl.settings.controls = true
      newEl.settings.style = { width: '100%', borderRadius: '8px' }
    }

    const currentList = [...list.value]
    currentList.splice(targetIdx, 0, newEl)
    currentList.forEach((s, i) => { s.order = i })
    list.value = currentList
    dragNewType.value = null
    return
  }
  
  if (dragNewSavedBlock.value) {
    const newEl = JSON.parse(JSON.stringify(dragNewSavedBlock.value))
    regenerateIds(newEl)
    const currentList = [...list.value]
    currentList.splice(targetIdx, 0, newEl)
    currentList.forEach((s, i) => { s.order = i })
    list.value = currentList
    dragNewSavedBlock.value = null
    return
  }

  const fromIdx = dragIndex.value
  dragIndex.value = null
  if (fromIdx === null || fromIdx === targetIdx) return
  const currentList = [...list.value]
  const [moved] = currentList.splice(fromIdx, 1)
  currentList.splice(targetIdx, 0, moved)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
}

function toggleExpand(type) {
  expandedSection.value = expandedSection.value === type ? null : type
}

function openSectionConfig(section) {
  // Emit section id to parent so the right panel opens with this section's config
  emit('active-change', section.id || section.type)
}

// ── Quick Actions ──
function duplicateSection(idx) {
  const original = list.value[idx]
  const clone = JSON.parse(JSON.stringify(original))
  clone.type = original.type
  clone.order = idx + 1
  regenerateIds(clone)
  const currentList = [...list.value]
  currentList.splice(idx + 1, 0, clone)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
}

function deleteSection(idx) {
  if (!confirm('Bạn có chắc muốn xoá section này?')) return
  const currentList = [...list.value]
  currentList.splice(idx, 1)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
  expandedSection.value = null
}

function moveSection(idx, direction) {
  const targetIdx = idx + direction
  if (targetIdx < 0 || targetIdx >= list.value.length) return
  const currentList = [...list.value]
  const [moved] = currentList.splice(idx, 1)
  currentList.splice(targetIdx, 0, moved)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
}

</script>

<style scoped>
/* Section List Header */
.section-list__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  margin-bottom: 8px;
  background: #f1f5f9;
  border-radius: 6px;
}
.section-list__count {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
}
.section-list__active-count {
  font-size: 10px;
  font-weight: 600;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

/* Section Search */
.section-search {
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.section-search__icon {
  position: absolute;
  left: 10px;
  color: #94a3b8;
}
.section-search__input {
  width: 100%;
  padding: 8px 30px 8px 32px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 13px;
  background: #f8fafc;
  transition: all 0.2s;
}
.section-search__input:focus {
  outline: none;
  background: #fff;
  border-color: #6366f1;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}
.section-search__clear {
  position: absolute;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 50%;
}
.section-search__clear:hover {
  background: #e2e8f0;
  color: #475569;
}

.section-list { padding-top: 8px; }
.section-item-wrap { margin-bottom: 4px; }
.section-item {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; border-radius: 6px; background: var(--bg-2, #f3f4f6);
  border: 1px solid transparent; cursor: pointer; transition: 0.2s;
  min-height: 44px;
}
.section-item__left { 
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text-1); 
  flex: 1; min-width: 0; padding-right: 8px;
}
.section-item__left > span:last-child, .section-item__name {
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block;
}
.section-item__name {
  user-select: none;
}
.section-item__rename-input {
  flex: 1;
  min-width: 0;
  padding: 2px 6px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  border: 1px solid #6366f1;
  border-radius: 4px;
  background: #fff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
  color: #1e293b;
}
.section-item:hover { border-color: var(--border); background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.section-item.expanded { border-color: var(--accent); background: rgba(124, 58, 237, 0.05); }
.section-item.dragging { opacity: 0.5; }
.section-item.drag-over { border-top: 2px solid var(--accent); }
.section-item__drag-handle { color: var(--text-3); cursor: grab; }
.section-item.disabled { opacity: 0.6; text-decoration: line-through; }
.section-item--active {
  border-color: #6366f1 !important;
  background: rgba(99, 102, 241, 0.08) !important;
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2), 0 2px 8px rgba(99, 102, 241, 0.1) !important;
}
.section-item__right { display: flex; gap: 4px; align-items: center; flex-shrink: 0; }

.section-actions-hover {
  display: flex; align-items: center; gap: 2px;
  position: absolute; right: 46px; /* Before toggle switch */
  top: 50%; transform: translateY(-50%);
  background: #fff; /* Match item hover background */
  padding: 4px 4px 4px 12px;
  border-radius: 6px 0 0 6px;
  box-shadow: -15px 0 15px #fff;
  opacity: 0; pointer-events: none; transition: 0.2s;
}
.section-item:hover .section-actions-hover, .section-actions-hover:focus-within {
  opacity: 1; pointer-events: auto;
}

/* ── Toggle Switch ── */
.toggle-switch { position: relative; display: inline-block; width: 28px; height: 16px; cursor: pointer; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .2s; border-radius: 16px; }
.toggle-slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 2px; bottom: 2px; background-color: white; transition: .2s; border-radius: 50%; }
input:checked + .toggle-slider { background-color: #10b981; }
input:checked + .toggle-slider:before { transform: translateX(12px); }


/* Quick Action Buttons */
.btn-action { width: 24px; height: 24px; border-radius: 4px; display: flex; align-items: center; justify-content: center; background: transparent; border: none; color: var(--text-2); cursor: pointer; transition: 0.2s; }
.btn-action:hover { background: var(--bg-1, #e5e7eb); color: var(--text-1); }
.btn-action--style:hover { color: var(--accent); background: rgba(124, 58, 237, 0.1); }
.btn-action--dup:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}
.btn-action--del:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

/* Element Palette */
.element-palette { 
  display: grid; 
  grid-template-columns: repeat(3, 1fr); 
  gap: 8px; 
  margin-bottom: 20px; 
  padding-bottom: 20px; 
  border-bottom: 1px dashed var(--border); 
}
.ep-item { 
  background: #fff; 
  border: 1px solid var(--border); 
  border-radius: 8px; 
  padding: 12px 6px; 
  font-size: 11px; 
  cursor: grab; 
  color: var(--text-2); 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  text-transform: capitalize; 
  font-weight: 600; 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  gap: 8px; 
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.ep-item:hover { 
  background: #fff; 
  color: var(--accent); 
  border-color: var(--accent); 
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.12);
}
.ep-icon {
  color: var(--text-3);
  transition: color 0.2s;
}
.ep-item:hover .ep-icon {
  color: var(--accent);
}

/* ── Section Icon ── */
.section-item__icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* Slider panel */
.section-params--fullscreen {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-1, #fcfcfc);
  z-index: 50; display: flex; flex-direction: column;
  overflow: hidden; border-radius: 8px;
  animation: slidePanelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.sp-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border); background: #fff; }
.sp-back-btn { display: flex; align-items: center; gap: 4px; background: none; border: none; color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 8px; border-radius: 6px; margin-left: -8px; transition: 0.2s; }
.sp-back-btn:hover { background: var(--bg-2); color: var(--text-1); }
.sp-title { font-size: 14px; font-weight: 700; color: var(--text-1); text-transform: capitalize; }
.sp-fill { flex: 1; }

.sp-body {
  flex: 1; overflow-y: auto; padding: 16px;
}
.sp-body::-webkit-scrollbar { width: 6px; }
.sp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

/* Slide transition */
.slide-panel-enter-active, .slide-panel-leave-active {
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-panel-enter-from, .slide-panel-leave-to {
  transform: translateX(20px); opacity: 0;
}

@keyframes slidePanelIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.btn-action--save {
  color: #fb923c;
  background: rgba(251, 146, 60, 0.1);
}
.btn-action--save:hover {
  background: #fb923c;
  color: #fff;
}
.element-palette-saved {
  margin-top: 12px;
  border-top: 1px dashed rgba(255,255,255,0.1);
  padding-top: 12px;
}
.eps-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--accent);
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ep-item--saved {
  background: rgba(251, 146, 60, 0.05) !important;
  color: #fb923c;
  border-color: rgba(251, 146, 60, 0.2);
  text-transform: none;
  position: relative;
}
.ep-item--saved .ep-icon {
  color: #fb923c;
  opacity: 0.8;
}
.ep-item--saved:hover {
  background: #fff !important;
  border-color: #fb923c;
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.15);
  color: #fb923c;
}
.ep-item--saved:hover .ep-icon { color: #fb923c; opacity: 1; }
.ep-item-name-saved { width: 100%; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 4px; }
.btn-icon-soft {
  position: absolute; right: 4px; top: 4px; width: 20px; height: 20px;
  background: rgba(239, 68, 68, 0.08); color: #ef4444; border: none; border-radius: 4px; opacity: 0; padding: 0; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;
}
.ep-item--saved:hover .btn-icon-soft { opacity: 1; }
.btn-icon-soft:hover { background: #ef4444; color: #fff; }

/* Context Menu */
.context-menu-wrapper {
  position: fixed; z-index: 100000;
}
.context-menu {
  list-style: none; margin: 0; padding: 4px; background: #fff;
  border: 1px solid var(--border, #e5e7eb); border-radius: 8px;
  box-shadow: 0 10px 30px -5px rgba(0,0,0,0.2); width: 180px;
}
.context-menu li {
  padding: 8px 12px; display: flex; align-items: center; gap: 8px;
  cursor: pointer; font-size: 13px; font-weight: 500; border-radius: 4px; color: var(--text-2, #4b5563);
  transition: 0.1s;
}
.context-menu li:hover { background: var(--bg-2, #f3f4f6); color: var(--text-1, #1f2937); }
.context-menu li.disabled { opacity: 0.5; cursor: not-allowed; }
.context-menu li.cm-danger { color: #ef4444; }
.context-menu li.cm-danger:hover { background: rgba(239, 68, 68, 0.1); }
.cm-divider { height: 1px; background: var(--border, #e5e7eb); margin: 4px 0; padding: 0 !important; cursor: default; }

/* Move Buttons */
.section-move-btns {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.btn-move {
  width: 18px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 8px;
  border-radius: 3px;
  transition: all 0.15s;
  padding: 0;
  line-height: 1;
}
.btn-move:hover:not(:disabled) {
  background: #e2e8f0;
  color: #334155;
}
.btn-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* Empty State */
.section-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
}
.section-empty-state__title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #475569;
}
.section-empty-state__desc {
  margin: 0;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.5;
}
.section-empty-state__desc strong {
  color: #6366f1;
}

</style>
