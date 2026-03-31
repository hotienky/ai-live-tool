<template>
  <div class="section-list">
    <div class="element-palette">
      <!-- Mẫu Nguyên Thuỷ -->
      <div 
        v-for="e in ['container', 'grid', 'card', 'heading', 'text', 'image', 'button', 'link', 'divider', 'iframe', 'video', 'form']" 
        :key="e"
        class="ep-item" 
        draggable="true" 
        @dragstart="onDragStartNew($event, e)"
        :data-tooltip="'Kéo thả ' + e"
      >
        <span>{{ e }}</span>
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
          :data-tooltip="b.name"
        >
          <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ b.name }}</span>
          <button class="btn-icon-soft" @click.stop="removeSavedBlock(bIndex)" data-tooltip="Xoá mẫu"><Trash2 :size="10"/></button>
        </div>
      </div>
    </div>
    
    <div
      v-for="(section, idx) in list"
      :key="section.id || section.type + idx"
      class="section-item-wrap"
      :data-section-panel="section.type"
    >
      <div
        class="section-item"
        :class="{
          disabled: !section.enabled,
          dragging: dragIndex === idx,
          'drag-over': dragOverIndex === idx && dragIndex !== idx,
          expanded: expandedSection === section.type,
        }"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, idx)"
        @dragenter.prevent="onDragEnter(idx)"
        @dragleave="onDragLeave(idx)"
        @drop.prevent="onDrop(idx)"
      >
        <div class="section-item__left">
          <div class="section-item__drag-handle">
            <GripVertical :size="14" />
          </div>
          <span class="section-item__icon">
            <component v-if="sectionMeta[section.type]?.icon" :is="sectionMeta[section.type].icon" :size="14" />
            <Box v-else :size="14" />
          </span>
          <span>{{ sectionMeta[section.type]?.label || section.type }}</span>
        </div>
        <div class="section-item__right">
          <button
            class="btn-action btn-action--style"
            @click.stop="toggleExpand(section.type)"
            :data-tooltip="expandedSection === section.type ? 'Thu gọn' : 'Tùy chỉnh'"
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
          <label class="toggle-switch" data-tooltip="Hiển thị" @click.stop>
            <input type="checkbox" v-model="section.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Expanded Section Parameters (Sliding Panel) -->
      <transition name="slide-panel">
        <div v-if="expandedSection === section.type" class="section-params section-params--fullscreen">
          <div class="sp-header">
            <button class="sp-back-btn" @click="$emit('update:expandedSection', null); expandedSection = null" data-tooltip="Trở lại">
              <ChevronLeft :size="16" /> Bố cục
            </button>
            <span class="sp-title">{{ sectionMeta[section.type]?.label || section.type }}</span>
            <span class="sp-fill"></span>
          </div>
          <div class="sp-body">
            <SectionConfigEditor
              :section="section"
              :all-categories="allCategories"
              :current-lang="currentLang"
              :default-lang-code="defaultLangCode"
              @open-block-editor="$emit('open-block-editor', $event)"
            >
              <template #children-editor="{ section: childSection }">
                <!-- Recursive Call to Self -->
                <LayoutSectionManager 
                  v-if="expandedSection === childSection.type"
                  :sections="childSection.children || (childSection.children = [])"
                  @update:sections="childSection.children = $event"
                  :sectionMeta="sectionMeta"
                  :allCategories="allCategories"
                />
                <div v-if="!childSection.children || childSection.children.length === 0" style="text-align: center; padding: 20px; font-size: 11px; color: #888;">
                  Chưa có component nào tron lưới. Kéo component từ danh sách thả vào đây.
                </div>
              </template>
            </SectionConfigEditor>
          </div><!-- /.sp-body -->
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { GripVertical, Settings2, Trash2, Box, ChevronLeft, Copy, ClipboardCopy, ClipboardPaste, FolderPlus, FolderOpen } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

// Module-level global to share cloned styles across section managers
let copiedStylePayload = null
const currentCopiedTs = ref(Date.now())
import SectionConfigEditor from './SectionConfigEditor.vue'
import LanguageTabs from '../LanguageTabs.vue'

const { t } = useI18n()
import { useLanguages } from '../../composables/useLanguages.js'
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

const props = defineProps({
  sections: { type: Array, required: true },
  sectionMeta: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:sections', 'open-block-editor'])

const list = computed({
  get: () => props.sections,
  set: v => emit('update:sections', v),
})

const expandedSection = ref(null)

const dragNewType = ref(null)

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

</script>

<style scoped>

/* ── Quick Action Buttons ── */
.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}
.btn-action:hover {
  background: var(--color-bg-card-hover, #f1f5f9);
  color: var(--color-text-primary, #334155);
  border-color: var(--color-border, #e2e8f0);
}
.btn-action--style:hover {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99, 102, 241, 0.08));
}
.btn-action--dup:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.08);
}
.btn-action--del:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.08);
}

/* ── Element Palette ── */
.element-palette {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.05));
}
.ep-item {
  background: var(--bg-card, rgba(0,0,0,0.2));
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 11px;
  cursor: grab;
  color: var(--color-text-primary, #e2e8f0);
  transition: all 0.2s;
  text-transform: capitalize;
}
.ep-item:hover {
  background: var(--color-accent-primary, #6366f1);
  color: #fff;
  border-color: var(--color-accent-primary, #6366f1);
}

/* ── Section Icon ── */
.section-item__icon {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

/* Slider panel for focused config */
.section-params--fullscreen {
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: var(--bg-1, #1a1a2e);
  z-index: 50;
  display: flex; flex-direction: column;
  overflow: hidden;
  border-radius: 8px;
  animation: slidePanelIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.sp-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.05));
  background: var(--bg-card, rgba(0,0,0,0.2));
}

.sp-back-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none;
  color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  padding: 4px 8px; border-radius: 6px;
  margin-left: -8px; transition: all 0.2s;
}
.sp-back-btn:hover { background: rgba(255,255,255,0.05); color: #fff; }

.sp-title { font-size: 14px; font-weight: 700; color: #fff; text-transform: capitalize; }
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
  background: rgba(251, 146, 60, 0.1) !important;
  color: #fb923c;
  border: 1px solid rgba(251, 146, 60, 0.2);
  display: flex;
  justify-content: space-between;
  text-transform: none;
}
.ep-item--saved:hover {
  background: rgba(251, 146, 60, 0.2) !important;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(251, 146, 60, 0.2);
}

</style>
