<template>
  <div class="lpe">

    <!-- ── Header ── -->
    <div class="lpe-header">
      <div class="lpe-header__left">
        <button class="btn-back" @click="$emit('back')">
          <ChevronLeft :size="15" /> Quay lại
        </button>
        <div class="lpe-title">
          <Layers :size="15" class="lpe-title__icon" />
          <span class="lpe-title__text">{{ pageTitle }}</span>
          <span class="lpe-badge">Layout Editor</span>
        </div>
      </div>

      <div class="lpe-header__right">
        <span class="lpe-count">{{ sections.length }} section{{ sections.length !== 1 ? 's' : '' }}</span>

        <button class="btn-draft" @click="onSaveDraft" :disabled="saving">
          <Loader2 v-if="saving === 'draft'" :size="13" class="spin" />
          <Save v-else :size="13" />
          Lưu nháp
        </button>

        <button class="btn-publish" @click="onPublish" :disabled="!!saving">
          <Loader2 v-if="saving === 'publish'" :size="13" class="spin" />
          <Upload v-else :size="13" />
          Xuất bản
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="lpe-loading">
      <Loader2 :size="24" class="spin" /> Đang tải layout...
    </div>

    <!-- ── 3-Column Body ── -->
    <div v-else class="lpe-body">

      <!-- Left: Section Palette -->
      <SectionPalette @add-section="addSectionAtEnd" />

      <!-- Center: Canvas -->
      <div
        class="lpe-canvas"
        ref="canvasEl"
        @dragover.prevent="onCanvasDragOver"
        @drop.prevent="onCanvasDrop"
        @dragleave.self="dropIndex = null"
      >
        <div v-if="!sections.length" class="lpe-canvas__empty">
          <Inbox :size="36" />
          <p>Kéo section từ bảng bên trái vào đây</p>
          <p class="lpe-canvas__hint">hoặc click vào section để thêm nhanh</p>
        </div>

        <template v-else>
          <!-- Top drop zone -->
          <div class="lpe-drop" :class="{ 'lpe-drop--active': dropIndex === 0 }" data-index="0" />

          <template v-for="(sec, i) in sections" :key="sec.id">
            <SectionCard
              :section="sec"
              :index="i"
              :total="sections.length"
              :selected="selectedId === sec.id"
              @select="selectedId = $event"
              @toggle="toggleEnabled"
              @move="moveSection"
              @remove="removeSection"
            />
            <div
              class="lpe-drop"
              :class="{ 'lpe-drop--active': dropIndex === i + 1 }"
              :data-index="i + 1"
            />
          </template>
        </template>
      </div>

      <!-- Right: Config Panel -->
      <BlockConfigPanel
        :block="selectedSectionAsBlock"
        :block-def="selectedSectionDef"
        @update="onConfigUpdate"
      />

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  ChevronLeft, Save, Upload, Loader2, Layers, Inbox,
} from 'lucide-vue-next'
import { apiFetch, useToast } from '../../helpers.js'
import { useLayoutPages } from '../../composables/useLayoutPages.js'
import SectionPalette from './SectionPalette.vue'
import SectionCard from './SectionCard.vue'
import BlockConfigPanel from '../builder/BlockConfigPanel.vue'

const props = defineProps({
  /** slug của layout page, ví dụ: 'home' */
  pageSlug: { type: String, default: 'home' },
  /** hoặc truyền thẳng id nếu đã biết */
  pageId:   { type: [Number, String], default: null },
})
defineEmits(['back'])

const { showToast } = useToast()
const { fetchLayoutPage, fetchLayoutPageBySlug, saveDraft, publishLayout } = useLayoutPages(apiFetch)

// ── State ──
const loading = ref(true)
const saving  = ref(null) // null | 'draft' | 'publish'
const pageTitle = ref('')
const pageDbId  = ref(null)
const sections  = ref([])
const selectedId = ref(null)
const dropIndex  = ref(null)
const canvasEl   = ref(null)

// ── Schema registry ──
const schemas = window.__SECTION_SCHEMAS__ || {}

// ── Adapter: section → block (cho BlockConfigPanel) ──
const selectedSection = computed(() =>
  sections.value.find(s => s.id === selectedId.value) || null
)

const selectedSectionAsBlock = computed(() => {
  const s = selectedSection.value
  if (!s) return null
  return { id: s.id, type: s.type, settings: { ...(s.params || {}) } }
})

const selectedSectionDef = computed(() => {
  const s = selectedSection.value
  if (!s) return null
  return schemas[s.type] || null
})

// ── Config update từ BlockConfigPanel ──
function onConfigUpdate(key, value) {
  const s = sections.value.find(x => x.id === selectedId.value)
  if (!s) return
  s.params = { ...(s.params || {}), [key]: value }
}

// ── Helpers ──
function genId() {
  return 'sec-' + Math.random().toString(36).slice(2, 8) + '-' + Date.now().toString(36)
}

function makeSection(type) {
  const schema = schemas[type]
  // Build defaultParams từ schema
  const defaultParams = {}
  if (schema?.groups) {
    for (const g of schema.groups) {
      for (const f of (g.fields || [])) {
        if (f.default !== undefined) defaultParams[f.key] = f.default
      }
    }
  }
  return {
    id: genId(),
    type,
    enabled: true,
    order: sections.value.length,
    params: defaultParams,
    settings: {},
    conditions: [],
  }
}

// ── Section CRUD ──
function addSectionAtEnd(type) {
  const s = makeSection(type)
  sections.value.push(s)
  selectedId.value = s.id
}

function addSectionAt(type, index) {
  const s = makeSection(type)
  sections.value.splice(index, 0, s)
  selectedId.value = s.id
}

function removeSection(id) {
  const idx = sections.value.findIndex(s => s.id === id)
  if (idx === -1) return
  sections.value.splice(idx, 1)
  if (selectedId.value === id) {
    selectedId.value = sections.value[idx - 1]?.id || sections.value[0]?.id || null
  }
}

function toggleEnabled(id) {
  const s = sections.value.find(x => x.id === id)
  if (s) s.enabled = !s.enabled
}

function moveSection(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= sections.value.length) return
  const item = sections.value.splice(fromIndex, 1)[0]
  sections.value.splice(toIndex, 0, item)
}

// ── Drag-drop canvas ──
function getDropIndex(event) {
  if (!canvasEl.value) return sections.value.length
  const zones = canvasEl.value.querySelectorAll('.lpe-drop')
  let closest = sections.value.length
  let minDist = Infinity
  zones.forEach(zone => {
    const rect = zone.getBoundingClientRect()
    const midY = rect.top + rect.height / 2
    const dist = Math.abs(event.clientY - midY)
    if (dist < minDist) {
      minDist = dist
      closest = parseInt(zone.dataset.index)
    }
  })
  return closest
}

function onCanvasDragOver(event) {
  dropIndex.value = getDropIndex(event)
  const source = event.dataTransfer.types.includes('section-type') ? 'palette' : 'canvas'
  event.dataTransfer.dropEffect = source === 'palette' ? 'copy' : 'move'
}

function onCanvasDrop(event) {
  const source = event.dataTransfer.getData('source')
  const idx = dropIndex.value ?? sections.value.length
  dropIndex.value = null

  if (source === 'section-palette') {
    const type = event.dataTransfer.getData('section-type')
    if (type) addSectionAt(type, idx)
  } else if (source === 'section-canvas') {
    const from = parseInt(event.dataTransfer.getData('section-index'))
    if (!isNaN(from) && from !== idx && from !== idx - 1) {
      const adjustedTo = idx > from ? idx - 1 : idx
      const item = sections.value.splice(from, 1)[0]
      sections.value.splice(adjustedTo, 0, item)
    }
  }
}

// ── Load ──
async function load() {
  loading.value = true
  try {
    let page
    if (props.pageId) {
      page = await fetchLayoutPage(props.pageId)
    } else {
      page = await fetchLayoutPageBySlug(props.pageSlug)
    }
    pageTitle.value = page.title || props.pageSlug
    pageDbId.value  = page.id

    const raw = page.layout_json
    sections.value  = Array.isArray(raw) ? raw.map((s, i) => ({ ...s, order: s.order ?? i })) : []
  } catch (e) {
    showToast('Lỗi tải layout: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

// ── Save ──
function buildPayload() {
  return sections.value.map((s, i) => ({ ...s, order: i }))
}

async function onSaveDraft() {
  if (!pageDbId.value) return showToast('Chưa có page ID', 'error')
  saving.value = 'draft'
  try {
    await saveDraft(pageDbId.value, buildPayload())
    showToast('Đã lưu nháp!', 'success')
  } catch (e) {
    showToast('Lỗi lưu: ' + e.message, 'error')
  } finally {
    saving.value = null
  }
}

async function onPublish() {
  if (!pageDbId.value) return showToast('Chưa có page ID', 'error')
  saving.value = 'publish'
  try {
    await publishLayout(pageDbId.value, buildPayload())
    showToast('Đã xuất bản!', 'success')
  } catch (e) {
    showToast('Lỗi xuất bản: ' + e.message, 'error')
  } finally {
    saving.value = null
  }
}

onMounted(load)
</script>

<style scoped>
.lpe {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--bg-1, #fff);
}

/* ── Header ── */
.lpe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: var(--bg-2, #f9fafb);
  gap: 12px;
  flex-shrink: 0;
}
.lpe-header__left,
.lpe-header__right { display: flex; align-items: center; gap: 10px; }

.btn-back {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  font-size: 12px;
}
.btn-back:hover { border-color: var(--accent); color: var(--accent); }

.lpe-title {
  display: flex;
  align-items: center;
  gap: 7px;
}
.lpe-title__icon { color: var(--accent, #7c3aed); }
.lpe-title__text { font-size: 14px; font-weight: 700; color: var(--text-1); }
.lpe-badge {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
  padding: 2px 8px;
  border-radius: 8px;
  background: rgba(139,92,246,.12);
  color: #7c3aed;
  border: 1px solid rgba(139,92,246,.25);
}
.lpe-count { font-size: 12px; color: var(--text-3); }

.btn-draft,
.btn-publish {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all .15s;
}
.btn-draft {
  border: 1px solid var(--border);
  background: var(--bg-1, #fff);
  color: var(--text-1);
}
.btn-draft:hover { border-color: var(--accent); color: var(--accent); }
.btn-publish {
  border: none;
  background: var(--accent, #7c3aed);
  color: #fff;
}
.btn-publish:hover { filter: brightness(1.1); }
.btn-draft:disabled,
.btn-publish:disabled { opacity: .6; cursor: not-allowed; }

/* ── Body ── */
.lpe-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ── Loading ── */
.lpe-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 14px;
}

/* ── Canvas ── */
.lpe-canvas {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--bg-1, #fff);
}

.lpe-canvas__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
  color: var(--text-3, #9ca3af);
  border: 2px dashed var(--border, #e5e7eb);
  border-radius: 14px;
  padding: 40px;
}
.lpe-canvas__empty svg { margin-bottom: 12px; opacity: .5; }
.lpe-canvas__empty p { margin: 0; font-size: 14px; }
.lpe-canvas__hint { font-size: 12px; margin-top: 4px !important; }

/* ── Drop zones ── */
.lpe-drop {
  height: 4px;
  border-radius: 2px;
  margin: 4px 0;
  transition: height .15s, background .15s;
}
.lpe-drop--active {
  height: 22px;
  background: rgba(124,58,237,.1);
  border: 2px dashed rgba(124,58,237,.4);
  border-radius: 8px;
}

/* ── Animation ── */
.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
