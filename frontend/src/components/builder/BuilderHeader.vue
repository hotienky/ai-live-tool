<template>
  <header class="cpb-header" :class="{ 'cpb-header--zen': isZen }">
    <div class="cpb-header__left">
      <!-- Page Picker -->
      <div class="cpb-page-picker" tabindex="-1" @focusout="handlePickerFocusout">
        <button class="cpb-page-btn" @click="$emit('update:pageDropdownOpen', !pageDropdownOpen)" title="Chọn trang cần chỉnh sửa">
          <component :is="activePage.icon" :size="14" />
          <span>{{ activePageLabel }}</span>
          <ChevronDown :size="12" :style="{ transform: pageDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }" />
        </button>

        <div v-if="pageDropdownOpen" class="cpb-page-menu">
          <button class="cpb-page-item" :class="{ active: activePageId === null }" @click="$emit('select-page', null)">
            <Home :size="14" /> Trang Chủ (Global)
          </button>
          <div class="cpb-page-group">Trang hệ thống</div>
          <button v-for="pg in builtinPageOptions" :key="pg.id" class="cpb-page-item" :class="{ active: activePageId === pg.id }" @click="$emit('select-page', pg.id)">
            <component :is="pg.icon" :size="14" /> <span>{{ pg.label }}</span>
          </button>
          <template v-if="dynamicPages.length">
            <div class="cpb-page-group">Trang CMS động</div>
            <button v-for="p in dynamicPages" :key="p.id" class="cpb-page-item" :class="{ active: activePageId === p.id }" @click="$emit('select-page', p.id)">
              <FileText :size="14" /> {{ p.title }}
            </button>
          </template>
        </div>
      </div>

      <span v-if="layoutPageVersion" class="cpb-status-badge" :class="'cpb-status-badge--' + layoutPageStatus">
        v{{ layoutPageVersion }} · {{ layoutPageStatus === 'published' ? 'Published' : 'Draft' }}
      </span>
    </div>

    <div class="cpb-header__center">
      <div class="cpb-viewport">
        <button :class="{ active: previewWidth === '100%' }" @click="$emit('update:previewWidth', '100%')" title="Desktop"><Monitor :size="16" /></button>
        <button :class="{ active: previewWidth === '768px' }" @click="$emit('update:previewWidth', '768px')" title="Tablet"><Tablet :size="16" /></button>
        <button :class="{ active: previewWidth === '375px' }" @click="$emit('update:previewWidth', '375px')" title="Mobile"><Smartphone :size="16" /></button>
        <button @click="$emit('update:previewMode', previewMode === 'wireframe' ? 'live' : 'wireframe')" style="margin-left: 8px;" :title="previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe'">
          <Eye v-if="previewMode === 'wireframe'" :size="16" />
          <Aperture v-else :size="16" />
        </button>
        <button @click="$emit('toggle-xray')" :class="{ 'cpb-btn-icon--active': isXRayMode }" style="margin-left: 8px;" title="Chế độ quét khung xương (X)">
          <Scan :size="16" />
        </button>
      </div>
    </div>

    <div class="cpb-header__right">
      <div class="cpb-history cpb-history-container" @focusout="handleHistoryFocusout" tabindex="-1">
        <div class="cpb-history__btn-group">
          <button @click="$emit('undo')" :disabled="undoStack.length <= 1" title="Hoàn tác"><Undo2 :size="14" /></button>
          <button @click="$emit('update:historyDropdownOpen', !historyDropdownOpen)" :disabled="undoStack.length <= 1" class="history-dropdown-toggle" title="Xem lịch sử khôi phục"><ChevronDown :size="12" /></button>
        </div>
        <button @click="$emit('redo')" :disabled="redoStack.length === 0" title="Làm lại"><Redo2 :size="14" /></button>

        <div v-if="historyDropdownOpen" class="history-dropdown-menu">
          <div class="history-dropdown-header">Lịch sử khôi phục</div>
          <div class="history-dropdown-list">
            <button v-for="(item, idx) in undoStack.slice().reverse()" :key="idx" class="history-dropdown-item" @click="$emit('restore-history', undoStack.length - 1 - idx)">
              <div class="history-dropdown-info">
                <span class="history-time">{{ item.time }}</span>
                <span class="history-label" :class="{'current-state': idx === 0}">{{ idx === 0 ? 'Hiện tại' : item.label }}</span>
              </div>
              <Check v-if="idx === 0" :size="14" class="history-current-icon" />
            </button>
          </div>
        </div>
      </div>

      <span class="cpb-save-status" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <span v-if="saving" class="status-saving" title="Đang lưu dữ liệu..."><Loader2 :size="16" class="spin"/></span>
        <span v-else class="status-saved" title="Đã lưu mới nhất"><Check :size="16" style="color: #10b981;"/></span>
      </span>

      <button class="cpb-btn-secondary" @click="$emit('toggle-zen')" :title="leftCollapsed ? 'Hiển thị công cụ (F)' : 'Chế độ tập trung (F)'" :class="{ 'cpb-btn-secondary--active': leftCollapsed }">
        <Focus :size="14" />
      </button>
      <button class="cpb-btn-secondary" @click="$emit('update:isFullscreen', !isFullscreen)" :title="isFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình'">
        <Minimize v-if="isFullscreen" :size="14" />
        <Maximize v-else :size="14" />
      </button>
      <button class="cpb-btn-secondary" @click="$emit('start-tour')" title="Hướng dẫn sử dụng toàn tập Builder"><HelpCircle :size="14" /></button>
      <button class="cpb-btn-secondary" @click="$emit('show-custom-css')" title="Tùy chỉnh CSS nâng cao toàn cục"><Code :size="14" /></button>
      <button class="cpb-btn-secondary" @click="$emit('save-draft')" :disabled="saving" title="Lưu nháp hiện trạng mà chưa áp dụng ngay"><Save :size="14" /> Nháp</button>
      <button class="cpb-btn-save" @click="$emit('publish')" :disabled="saving" title="Xuất bản cập nhật lên website live"><Package v-if="!saving" :size="14" /><Loader2 v-else class="spin" :size="14" /> Xuất bản</button>
    </div>
  </header>
</template>

<script setup>
import {
  ChevronDown, Home, FileText,
  Monitor, Tablet, Smartphone, Eye, Aperture, Scan,
  Undo2, Redo2, Check, Loader2,
  Focus, Minimize, Maximize, HelpCircle, Code, Save, Package
} from 'lucide-vue-next'

const props = defineProps({
  activePageId: { default: null },
  activePageLabel: { type: String, default: '' },
  activePage: { type: Object, default: () => ({}) },
  builtinPageOptions: { type: Array, default: () => [] },
  dynamicPages: { type: Array, default: () => [] },
  pageDropdownOpen: { type: Boolean, default: false },
  layoutPageVersion: { default: null },
  layoutPageStatus: { type: String, default: '' },
  previewWidth: { type: String, default: '100%' },
  previewMode: { type: String, default: 'live' },
  isXRayMode: { type: Boolean, default: false },
  undoStack: { type: Array, default: () => [] },
  redoStack: { type: Array, default: () => [] },
  historyDropdownOpen: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  leftCollapsed: { type: Boolean, default: false },
  isFullscreen: { type: Boolean, default: false },
  isZen: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:pageDropdownOpen',
  'update:historyDropdownOpen',
  'update:previewWidth',
  'update:previewMode',
  'update:isFullscreen',
  'select-page',
  'undo',
  'redo',
  'restore-history',
  'toggle-zen',
  'toggle-xray',
  'start-tour',
  'show-custom-css',
  'save-draft',
  'publish',
  'show-version-history',
])

function handlePickerFocusout(e) {
  const next = e.relatedTarget
  if (!e.currentTarget.contains(next)) emit('update:pageDropdownOpen', false)
}

function handleHistoryFocusout(e) {
  const next = e.relatedTarget
  if (!e.currentTarget.contains(next)) emit('update:historyDropdownOpen', false)
}
</script>

<style scoped>
.cpb-header { display: flex; align-items: center; justify-content: space-between; height: 54px; padding: 0 16px; background: #fff; border-bottom: 1px solid var(--border, #e5e7eb); z-index: 10; font-size: 13px; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s; }
.cpb-header--zen { transform: translateY(-100%); opacity: 0; pointer-events: none; position: absolute; width: 100%; }
.cpb-header__left, .cpb-header__center, .cpb-header__right { display: flex; align-items: center; gap: 12px; }
.cpb-header__left { flex: 1; min-width: 0; }
.cpb-header__center { flex: 1; justify-content: center; }
.cpb-header__right { flex: 1; justify-content: flex-end; align-items: center; }

/* Page Picker */
.cpb-page-picker { position: relative; }
.cpb-page-btn { display: flex; align-items: center; gap: 6px; background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; color: var(--text-1); transition: 0.2s; }
.cpb-page-btn:hover { background: #fff; border-color: var(--text-3); }
.cpb-page-menu { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 220px; max-height: 400px; overflow-y: auto; z-index: 100; padding: 6px; }
.cpb-page-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; color: var(--text-2); font-size: 13px; font-weight: 500;}
.cpb-page-item:hover { background: var(--bg-2, #f3f4f6); color: var(--text-1); }
.cpb-page-item.active { background: rgba(124, 58, 237, 0.1); color: var(--accent); font-weight: 600; }
.cpb-page-group { padding: 8px 10px 4px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; border-top: 1px solid var(--border); margin-top: 4px; }

/* Viewport Controls */
.cpb-viewport { display: flex; background: var(--bg-2); padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
.cpb-viewport button { background: transparent; border: none; padding: 4px 10px; min-width: 32px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-3); border-radius: 4px; cursor: pointer; transition: 0.2s; }
.cpb-viewport button.active, .cpb-btn-icon--active { background: #fff !important; color: var(--accent, #7c3aed) !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

/* History */
.cpb-history-container { position: relative; display: flex; align-items: center; justify-content: flex-end; outline: none; }
.cpb-history__btn-group { display: flex; align-items: center; border-radius: 4px; background: transparent; transition: 0.2s; }
.cpb-history__btn-group:hover { background: var(--bg-2, #f3f4f6); }
.cpb-history__btn-group button { border-radius: 4px; }
.cpb-history__btn-group button.history-dropdown-toggle { padding: 0 4px; width: 20px; border-left: 1px solid rgba(0,0,0,0.05); border-top-left-radius: 0; border-bottom-left-radius: 0; }
.cpb-history__btn-group button:first-child { border-top-right-radius: 0; border-bottom-right-radius: 0; }

.history-dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 8px; background: #fff; width: 260px; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid var(--border); z-index: 100; display: flex; flex-direction: column; overflow: hidden; }
.history-dropdown-header { padding: 12px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; border-bottom: 1px solid var(--border); background: var(--bg-2); }
.history-dropdown-list { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; }
.history-dropdown-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: none; border: none; border-bottom: 1px solid var(--border); cursor: pointer; text-align: left; transition: 0.2s; }
.history-dropdown-item:last-child { border-bottom: none; }
.history-dropdown-item:hover { background: var(--bg-2); }
.history-dropdown-info { display: flex; flex-direction: column; gap: 2px; }
.history-time { font-size: 11px; color: var(--text-3); font-family: monospace; }
.history-label { font-size: 13px; font-weight: 500; color: var(--text-1); }
.current-state { color: var(--accent); font-weight: 700; }
.history-current-icon { color: var(--accent); }

/* Buttons */
.cpb-btn-secondary { background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2); display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); border-color: var(--text-3); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.cpb-btn-secondary--active { background: rgba(124, 58, 237, 0.1) !important; color: var(--accent) !important; border-color: rgba(124, 58, 237, 0.3) !important; }
.cpb-btn-save { background: var(--accent, #7c3aed); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }

/* Status badge */
.cpb-status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
.cpb-status-badge--published { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
.cpb-status-badge--draft { background: rgba(245, 158, 11, 0.1); color: #d97706; border-color: rgba(245, 158, 11, 0.2); }
</style>
