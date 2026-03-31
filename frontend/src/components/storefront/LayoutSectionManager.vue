<template>
  <div class="section-list">
    <LanguageTabs v-model="currentLang" style="margin-bottom: 16px" />
    <div
      v-for="(section, idx) in list"
      :key="section.type"
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
            :title="expandedSection === section.type ? 'Thu gọn' : 'Tùy chỉnh'"
          ><Settings2 :size="13" /></button>
          <button
            class="btn-action btn-action--dup"
            @click.stop="duplicateSection(idx)"
            title="Nhân đôi"
          ><Copy :size="12" /></button>
          <button
            class="btn-action btn-action--del"
            @click.stop="deleteSection(idx)"
            title="Xoá section"
          ><Trash2 :size="12" /></button>
          <label class="toggle-switch" @click.stop>
            <input type="checkbox" v-model="section.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Expanded Section Parameters (Sliding Panel) -->
      <transition name="slide-panel">
        <div v-if="expandedSection === section.type" class="section-params section-params--fullscreen">
          <div class="sp-header">
            <button class="sp-back-btn" @click="$emit('update:expandedSection', null); expandedSection = null" title="Trở lại">
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
import { ref, computed } from 'vue'
import { GripVertical, Settings2, Trash2, Box, ChevronLeft, Copy } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
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

// Drag Drop Logic
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, idx) { dragIndex.value = idx; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) }
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }
function onDragEnter(idx) { if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx }
function onDragLeave(idx) { if (dragOverIndex.value === idx) dragOverIndex.value = null }
function onDrop(targetIdx) {
  const fromIdx = dragIndex.value
  dragOverIndex.value = null
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
</style>
