<template>
  <div class="cpb">
    <!-- ── Header ── -->
    <div class="cpb-header">
      <div class="cpb-header__left">
        <button class="btn-back" @click="$emit('back')">
          <ChevronLeft :size="15" /> Quay lại
        </button>
        <div class="cpb-title">
          <span class="cpb-title__page">{{ pageTitle }}</span>
          <span class="badge badge--dynamic"><Layers :size="10" /> Page Builder</span>
        </div>
      </div>
        <!-- Toggle Preview Mode -->
        <div class="cpb-preview-toggle">
          <button :class="{ active: previewMode === 'wireframe' }" @click="previewMode = 'wireframe'" title="Giao diện kéo thả (Wireframe)">
            <Layout :size="14" />
          </button>
          <button :class="{ active: previewMode === 'live' }" @click="previewMode = 'live'" title="Xem trước trực tiếp (Live)">
            <Monitor :size="14" />
          </button>
        </div>
        <span class="cpb-block-count">{{ blocks.length }} block{{ blocks.length !== 1 ? 's' : '' }}</span>
        <button class="btn-save" @click="saveLayout" :disabled="saving || loading">
          <Loader2 v-if="saving" :size="14" class="spin" />
          <Save v-else :size="14" />
          {{ saving ? 'Đang lưu...' : 'Lưu layout' }}
        </button>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="cpb-loading">
      <Loader2 :size="24" class="spin" /> Đang tải trang...
    </div>

    <!-- ── 3-column builder ── -->
    <div v-else class="cpb-body">
      <!-- Left: Block Palette -->
      <BlockPalette @add-block="addBlockAtEnd" />

      <!-- Center: Canvas / Preview -->
      <div v-if="previewMode === 'live'" class="cpb-preview-wrapper">
        <iframe
          ref="previewIframe"
          class="cpb-preview-frame"
          :src="livePreviewUrl"
          @load="syncPreviewData"
        ></iframe>
      </div>
      
      <BlockCanvas
        v-else
        :blocks="blocks"
        :selected-id="selectedId"
        @select="selectedId = $event"
        @remove="removeBlock"
        @move="moveBlock"
        @drop-palette="addBlockAt"
        @drop-reorder="reorderBlock"
      />

      <!-- Right: Config Panel -->
      <BlockConfigPanel
        :block="selectedBlock"
        :block-def="selectedBlockDef"
        @update="updateSetting"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { ChevronLeft, Save, Loader2, Layers, Layout, Monitor } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import BlockPalette from './builder/BlockPalette.vue'
import BlockCanvas from './builder/BlockCanvas.vue'
import BlockConfigPanel from './builder/BlockConfigPanel.vue'

const props = defineProps({
  pageId: { type: [Number, String], required: true },
})
defineEmits(['back'])

const { showToast } = useToast()
const { fetchPage, saveLayout: apiSaveLayout } = useCmsPages(apiFetch)
const bridge = window.__APP_BRIDGE__ || {}

// ── State ──────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const pageTitle = ref('')
const pageSlug = ref('')
const blocks = ref([])
const selectedId = ref(null)
const previewMode = ref('wireframe')
const previewIframe = ref(null)

// ── Derived ────────────────────────────────────────────
const livePreviewUrl = computed(() => {
  let base = import.meta.env.VITE_STOREFRONT_URL
  if (!base) {
    const host = window.location.hostname
    const port = window.location.port
    // Auto-resolve Multi-tenant domain (e.g. tenant.cms.localhost -> tenant.localhost)
    if (host.includes('.cms.')) {
      const newHost = host.replace('.cms.', '.')
      base = `${window.location.protocol}//${newHost}${port ? ':' + port : ''}`
    } else if (port === '5175') {
      // Docker mapping: frontend-cms is 5175, storefront is 5173
      base = `${window.location.protocol}//${host}:5173`
    } else if (port === '5173' || port === '8080') {
      // Local npm run dev mapping: frontend is 5173, storefront is 5174
      base = `${window.location.protocol}//${host}:5174`
    } else {
      base = window.location.origin
    }
  }
  return `${base}/page/${pageSlug.value}?preview=true&hide_layout=true`
})

// Sync block data to IFrame via postMessage
function syncPreviewData() {
  if (previewMode.value === 'live' && previewIframe.value) {
    previewIframe.value.contentWindow?.postMessage({
      type: 'cms-preview-update',
      payload: { blocks: blocks.value }
    }, '*')
  }
}

watch(blocks, syncPreviewData, { deep: true })
onMounted(() => {
  window.addEventListener('message', (e) => {
    if (e.data?.type === 'cms-preview-ready') {
      syncPreviewData()
    }
  })
})

// ── Helpers ────────────────────────────────────────────
function genId() {
  return 'b-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36)
}

function makeBlock(type) {
  const def = bridge.getBlockByType?.(type)
  const block = {
    id: genId(),
    type,
    plugin: def?.plugin || 'cms',
    settings: { ...(def?.defaultSettings || {}) },
  }
  if (type.startsWith('columns')) {
    const cols = block.settings.columns || 2
    block.children = Array(cols).fill(0).map(() => [])
  }
  return block
}

function resolvePath(pathStr) {
  if (!pathStr) return { arr: blocks.value, idx: blocks.value.length }
  const parts = String(pathStr).split('.')
  let arr = blocks.value
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (p === 'children') {
      const colIdx = parseInt(parts[++i])
      arr = arr[colIdx]
    } else {
      arr = arr[parseInt(p)].children
    }
  }
  return { arr, idx: parseInt(parts[parts.length - 1]) }
}

function findBlockDeep(arr, id) {
  for (const b of arr) {
    if (b.id === id) return b
    if (b.children) {
      for (const col of b.children) {
        const f = findBlockDeep(col, id)
        if (f) return f
      }
    }
  }
  return null
}

const selectedBlock = computed(() => findBlockDeep(blocks.value, selectedId.value))
const selectedBlockDef = computed(() => selectedBlock.value ? bridge.getBlockByType?.(selectedBlock.value.type) || null : null)

// ── Block CRUD ─────────────────────────────────────────

function addBlockAtEnd(type) {
  const block = makeBlock(type)
  blocks.value.push(block)
  selectedId.value = block.id
}

function addBlockAt(type, path) {
  const block = makeBlock(type)
  const { arr, idx } = resolvePath(path)
  arr.splice(idx, 0, block)
  selectedId.value = block.id
}

function removeBlock(path) {
  const { arr, idx } = resolvePath(path)
  const removed = arr.splice(idx, 1)[0]
  if (removed && selectedId.value === removed.id) {
    selectedId.value = null
  }
}

function moveBlock(fromPath, toPath) {
  const from = resolvePath(fromPath)
  let to = resolvePath(toPath)
  if (to.idx < 0 || to.idx >= to.arr.length) return
  const item = from.arr.splice(from.idx, 1)[0]
  to = resolvePath(toPath) // Re-resolve in case splicing changed index
  to.arr.splice(to.idx, 0, item)
}

function reorderBlock(fromPath, toPath) {
  if (fromPath === toPath) return
  const from = resolvePath(fromPath)
  let to = resolvePath(toPath)
  const item = from.arr.splice(from.idx, 1)[0]
  // Adjust to.idx if it's the same array and we removed an item before it
  if (from.arr === to.arr && from.idx < to.idx) {
    to.idx--
  }
  to.arr.splice(to.idx, 0, item)
}

function updateSetting(key, value) {
  if (!selectedId.value) return
  const block = findBlockDeep(blocks.value, selectedId.value)
  if (!block) return
  
  block.settings = { ...block.settings, [key]: value }

  // Logic đặc biệt cho columns: tự động thêm list rỗng nếu tăng số cột
  if (block.type.startsWith('columns') && key === 'columns') {
    const desired = parseInt(value)
    if (!block.children) block.children = []
    while(block.children.length < desired) block.children.push([])
    if (block.children.length > desired) block.children.splice(desired)
  }
}

// ── Persist ────────────────────────────────────────────

async function loadPage() {
  loading.value = true
  try {
    const data = await fetchPage(props.pageId)
    const page = data.data || data
    pageTitle.value = page.title || 'Trang'
    pageSlug.value = page.alias || page.id
    const layout = page.layout_data
    if (layout && Array.isArray(layout.blocks)) {
      blocks.value = layout.blocks
    } else {
      blocks.value = []
    }
  } catch (e) {
    showToast('Lỗi tải trang: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

async function saveLayout() {
  saving.value = true
  try {
    const layoutData = {
      version: '1.0',
      blocks: blocks.value.map((b, i) => ({ ...b, order: i })),
    }
    await apiSaveLayout(props.pageId, layoutData, true)
    showToast('Đã lưu layout!', 'success')
  } catch (e) {
    showToast('Lỗi lưu: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadPage)
</script>

<style scoped>
.cpb {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 500px;
  background: var(--bg-1, #fff);
}

/* ── Header ── */
.cpb-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border, #e5e7eb);
  background: var(--bg-2, #f9fafb);
  gap: 12px;
  flex-shrink: 0;
}
.cpb-header__left,
.cpb-header__right { display: flex; align-items: center; gap: 10px; }

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

.cpb-title { display: flex; align-items: center; gap: 8px; }
.cpb-title__page { font-size: 14px; font-weight: 700; color: var(--text-1); }

.cpb-block-count { font-size: 12px; color: var(--text-3); }
.cpb-preview-toggle {
  display: flex;
  background: var(--bg-2, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 6px;
  overflow: hidden;
}
.cpb-preview-toggle button {
  background: transparent;
  border: none;
  padding: 6px 12px;
  color: var(--text-3);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.cpb-preview-toggle button:hover { color: var(--text-2); background: rgba(0,0,0,0.03); }
.cpb-preview-toggle button.active {
  background: var(--accent, #7c3aed);
  color: #fff;
}

.btn-save {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 8px;
  border: none;
  background: var(--accent, #7c3aed);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
.btn-save:hover { filter: brightness(1.1); }
.btn-save:disabled { opacity: .6; cursor: not-allowed; }

/* ── Body ── */
.cpb-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
.cpb-preview-wrapper {
  flex: 1;
  background: #e5e7eb;
  padding: 16px;
  display: flex;
  justify-content: center;
}
.cpb-preview-frame {
  width: 100%;
  max-width: 1200px;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* ── Loading ── */
.cpb-loading {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-3);
  font-size: 14px;
}

/* ── Badges ── */
.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 8px;
  font-size: .65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
}
.badge--dynamic {
  background: rgba(139,92,246,.15);
  color: #7c3aed;
  border: 1px solid rgba(139,92,246,.3);
}

.spin { animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
