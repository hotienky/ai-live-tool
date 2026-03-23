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
      <div class="cpb-header__right">
        <span class="cpb-block-count">{{ blocks.length }} block{{ blocks.length !== 1 ? 's' : '' }}</span>
        <button class="btn-save" @click="saveLayout" :disabled="saving || loading">
          <Loader2 v-if="saving" :size="14" class="spin" />
          <Save v-else :size="14" />
          {{ saving ? 'Đang lưu...' : 'Lưu layout' }}
        </button>
      </div>
    </div>

    <!-- ── Loading ── -->
    <div v-if="loading" class="cpb-loading">
      <Loader2 :size="24" class="spin" /> Đang tải trang...
    </div>

    <!-- ── 3-column builder ── -->
    <div v-else class="cpb-body">
      <!-- Left: Block Palette -->
      <BlockPalette @add-block="addBlockAtEnd" />

      <!-- Center: Canvas -->
      <BlockCanvas
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
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, Save, Loader2, Layers } from 'lucide-vue-next'
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
const blocks = ref([])
const selectedId = ref(null)

// ── Derived ────────────────────────────────────────────
const selectedBlock = computed(() =>
  blocks.value.find(b => b.id === selectedId.value) || null
)
const selectedBlockDef = computed(() =>
  selectedBlock.value ? bridge.getBlockByType?.(selectedBlock.value.type) || null : null
)

// ── Helpers ────────────────────────────────────────────
function genId() {
  return 'b-' + Math.random().toString(36).slice(2, 9) + '-' + Date.now().toString(36)
}

function makeBlock(type) {
  const def = bridge.getBlockByType?.(type)
  return {
    id: genId(),
    type,
    plugin: def?.plugin || 'cms',
    settings: { ...(def?.defaultSettings || {}) },
  }
}

// ── Block CRUD ─────────────────────────────────────────

/** Thêm block vào cuối */
function addBlockAtEnd(type) {
  const block = makeBlock(type)
  blocks.value.push(block)
  selectedId.value = block.id
}

/** Thêm block tại vị trí index (từ drag-drop palette) */
function addBlockAt(type, index) {
  const block = makeBlock(type)
  blocks.value.splice(index, 0, block)
  selectedId.value = block.id
}

/** Xóa block theo id */
function removeBlock(id) {
  const idx = blocks.value.findIndex(b => b.id === id)
  if (idx === -1) return
  blocks.value.splice(idx, 1)
  if (selectedId.value === id) {
    selectedId.value = blocks.value[idx - 1]?.id || blocks.value[0]?.id || null
  }
}

/** Di chuyển block: lên/xuống (từ nút ↑↓) */
function moveBlock(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= blocks.value.length) return
  const item = blocks.value.splice(fromIndex, 1)[0]
  blocks.value.splice(toIndex, 0, item)
}

/** Sắp xếp lại từ drag-drop canvas */
function reorderBlock(fromIndex, toIndex) {
  if (fromIndex === toIndex) return
  const item = blocks.value.splice(fromIndex, 1)[0]
  // Adjust toIndex after splice
  const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex
  blocks.value.splice(adjustedTo, 0, item)
}

/** Cập nhật một setting của block đang chọn */
function updateSetting(key, value) {
  if (!selectedId.value) return
  const block = blocks.value.find(b => b.id === selectedId.value)
  if (!block) return
  block.settings = { ...block.settings, [key]: value }
}

// ── Persist ────────────────────────────────────────────

async function loadPage() {
  loading.value = true
  try {
    const data = await fetchPage(props.pageId)
    const page = data.data || data
    pageTitle.value = page.title || 'Trang'
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
