<template>
  <transition name="slide-right">
    <div v-if="visible" class="version-history-overlay" @click.self="$emit('close')">
      <div class="version-history-panel">
        <div class="vh-header">
          <h3><History :size="16" /> {{ t('admin.msg_vh_title', 'Lịch sử phiên bản') }}</h3>
          <button class="vh-close" @click="$emit('close')"><X :size="18" /></button>
        </div>

        <!-- Current version -->
        <div class="vh-current" v-if="currentVersion">
          <div class="vh-current__label">{{ t('admin.msg_vh_current', 'Phiên bản hiện tại') }}</div>
          <div class="vh-current__version">
            <span class="vh-badge">v{{ currentVersion }}</span>
            <span class="vh-status" :class="'vh-status--' + currentStatus">{{ currentStatus === 'published' ? '✅ Published' : '📝 Draft' }}</span>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="vh-loading">
          <Loader2 :size="20" class="spin" /> {{ t('admin.loading', 'Đang tải...') }}
        </div>

        <!-- Version list -->
        <div v-else class="vh-list">
          <div v-if="!versions.length" class="vh-empty">
            {{ t('admin.msg_vh_empty', 'Chưa có phiên bản nào được publish.') }}
          </div>
          <div v-for="ver in versions" :key="ver.id" class="vh-item" :class="{ 'vh-item--active': ver.version === currentVersion }">
            <div class="vh-item__header">
              <span class="vh-badge vh-badge--sm">v{{ ver.version }}</span>
              <span class="vh-item__meta">{{ ver.sections_count }} sections</span>
              <span class="vh-item__time">{{ formatTime(ver.created_at) }}</span>
            </div>
            <div class="vh-item__info">
              <span v-if="ver.published_by" class="vh-item__by">{{ ver.published_by }}</span>
              <span v-if="ver.note" class="vh-item__note">{{ ver.note }}</span>
            </div>
            <button
              v-if="ver.version !== currentVersion"
              class="vh-btn-rollback"
              @click="rollback(ver.version)"
              :disabled="rollingBack"
            >
              <RotateCcw :size="12" />
              {{ t('admin.msg_vh_rollback', 'Khôi phục') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, watch } from 'vue'
import { History, X, Loader2, RotateCcw } from 'lucide-vue-next'
import { apiFetch } from '../../composables/useApi.js'
import { useToast } from '../../composables/useToast.js'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  visible: { type: Boolean, default: false },
  layoutPageId: { type: [Number, String], default: null },
  currentVersion: { type: Number, default: 0 },
  currentStatus: { type: String, default: 'draft' },
})

const emit = defineEmits(['close', 'rollback'])

const versions = ref([])
const loading = ref(false)
const rollingBack = ref(false)

// Load versions when panel opens
watch(() => props.visible, async (v) => {
  if (v && props.layoutPageId) {
    await loadVersions()
  }
})

async function loadVersions() {
  loading.value = true
  try {
    const res = await apiFetch(`/layout-pages/${props.layoutPageId}/versions`)
    const data = await res.json()
    versions.value = data.data || []
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
    versions.value = []
  }
  loading.value = false
}

async function rollback(version) {
  if (!confirm(t('admin.msg_vh_confirm', `Khôi phục về phiên bản v${version}? Layout hiện tại sẽ bị ghi đè.`))) return
  rollingBack.value = true
  try {
    await apiFetch(`/layout-pages/${props.layoutPageId}/rollback/${version}`, { method: 'POST' })
    showToast(`✅ ${t('admin.msg_vh_restored', 'Đã khôi phục')} v${version}`, 'success')
    emit('rollback', version)
    emit('close')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
  }
  rollingBack.value = false
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style>
.version-history-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; justify-content: flex-end;
}
.version-history-panel {
  width: 380px; max-width: 90vw; height: 100vh;
  background: var(--color-bg-primary, #1a1a2e);
  border-left: 1px solid var(--glass-border);
  box-shadow: -8px 0 32px rgba(0,0,0,0.25);
  display: flex; flex-direction: column;
  overflow: hidden;
}
.vh-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}
.vh-header h3 {
  margin: 0; font-size: 15px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
}
.vh-close {
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); padding: 4px; border-radius: 6px;
}
.vh-close:hover { background: var(--glass-bg); color: var(--color-text-primary); }

.vh-current {
  padding: 14px 20px; border-bottom: 1px solid var(--glass-border);
  background: var(--color-accent-glow);
}
.vh-current__label {
  font-size: 10px; font-weight: 700; color: var(--color-text-muted);
  text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;
}
.vh-current__version {
  display: flex; align-items: center; gap: 8px;
}

.vh-badge {
  display: inline-flex; align-items: center; justify-content: center;
  padding: 2px 10px; border-radius: 20px; font-size: 12px; font-weight: 800;
  background: var(--color-accent-primary); color: #fff;
}
.vh-badge--sm { padding: 1px 8px; font-size: 11px; }

.vh-status {
  font-size: 11px; font-weight: 600; color: var(--color-text-muted);
}
.vh-status--published { color: #22c55e; }
.vh-status--draft { color: #f59e0b; }

.vh-loading {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 40px; color: var(--color-text-muted); font-size: 13px;
}

.vh-list {
  flex: 1; overflow-y: auto; padding: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.vh-empty {
  text-align: center; padding: 30px 16px; font-size: 13px;
  color: var(--color-text-muted);
}

.vh-item {
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  transition: all 0.15s;
}
.vh-item:hover { border-color: var(--color-border-hover); }
.vh-item--active {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}

.vh-item__header {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
}
.vh-item__meta {
  font-size: 11px; color: var(--color-text-muted);
  background: var(--glass-bg); padding: 1px 6px; border-radius: 4px;
}
.vh-item__time {
  font-size: 11px; color: var(--color-text-muted); margin-left: auto;
}

.vh-item__info {
  display: flex; flex-direction: column; gap: 2px; margin-bottom: 8px;
}
.vh-item__by {
  font-size: 11px; color: var(--color-text-secondary); font-weight: 600;
}
.vh-item__note {
  font-size: 11px; color: var(--color-text-muted); font-style: italic;
}

.vh-btn-rollback {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 6px;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-secondary); font-size: 11px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.vh-btn-rollback:hover {
  border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.06);
}
.vh-btn-rollback:disabled { opacity: 0.4; cursor: not-allowed; }

/* Slide animation */
.slide-right-enter-active, .slide-right-leave-active { transition: all 0.3s ease; }
.slide-right-enter-from .version-history-panel,
.slide-right-leave-to .version-history-panel { transform: translateX(100%); }
.slide-right-enter-from, .slide-right-leave-to { opacity: 0; }

@keyframes spin { 100% { transform: rotate(360deg); } }
.spin { animation: spin 1s linear infinite; }
</style>
