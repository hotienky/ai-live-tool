<template>
  <div class="session-history" v-if="visible">
    <div class="session-history__overlay" @click="$emit('close')"></div>
    <div class="session-history__panel">
      <div class="session-history__header">
        <h3 class="session-history__title">
          <History :size="18" /> Lịch sử phiên Live
        </h3>
        <button class="session-history__close" @click="$emit('close')">
          <X :size="18" />
        </button>
      </div>

      <div class="session-history__body">
        <!-- Loading -->
        <div v-if="loading" class="session-history__loading">
          <Loader2 :size="20" class="session-history__spin" />{{ t('admin.msg_d5fe42f6', 'Đang tải...') }}</div>

        <!-- Empty -->
        <div v-else-if="sessions.length === 0" class="session-history__empty">
          <Radio :size="36" />
          <p>{{ t('admin.msg_468ae07b', 'Chưa có phiên live nào') }}</p>
          <p class="session-history__empty-sub">{{ t('admin.msg_77647d3f', 'Phiên live sẽ tự động lưu khi bắt đầu kết nối') }}</p>
        </div>

        <!-- Session List -->
        <div v-else class="session-history__list">
          <div
            v-for="session in sessions"
            :key="session.id"
            class="session-card"
            :class="{ 'session-card--active': session.status === 'Active' }"
          >
            <div class="session-card__top">
              <div class="session-card__platform">
                <component :is="platformIcon(session.platform)" :size="14" />
                {{ session.shop_name || 'Unknown' }}
              </div>
              <span class="session-card__badge" :class="statusClass(session.status)">
                {{ session.status === 'Active' ? t('admin.msg_6c2a7081', 'Đang live') : t('admin.msg_144f8bdc', 'Kết thúc') }}
              </span>
            </div>

            <div class="session-card__stats">
              <div class="session-card__stat">
                <Flame :size="12" class="session-card__stat-icon session-card__stat-icon--hot" />
                <span>{{ session.hot_count || 0 }}</span>
              </div>
              <div class="session-card__stat">
                <CircleDot :size="12" class="session-card__stat-icon session-card__stat-icon--warm" />
                <span>{{ session.warm_count || 0 }}</span>
              </div>
              <div class="session-card__stat">
                <MessageCircle :size="12" />
                <span>{{ session.total_comments || 0 }}</span>
              </div>
              <div class="session-card__stat" v-if="session.peak_viewers">
                <Eye :size="12" />
                <span>{{ session.peak_viewers.toLocaleString() }}</span>
              </div>
            </div>

            <div class="session-card__meta">
              <span>
                <Calendar :size="11" />
                {{ formatDate(session.started_at) }}
              </span>
              <span v-if="session.duration_minutes">
                <Clock :size="11" />
                {{ formatDuration(session.duration_minutes) }}
              </span>
              <span v-else-if="session.status === 'Active'" class="session-card__live-dot">
                Đang live...
              </span>
            </div>

            <button
              v-if="session.status !== 'Active'"
              class="session-card__delete"
              @click.stop="onDelete(session.id)"
              title="Xóa phiên"
            >
              <Trash2 :size="13" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { logger } from '../utils/logger.js'
import { useI18n } from '../composables/useI18n.js'
import {
  History, X, Loader2, Radio, Flame, CircleDot,
  MessageCircle, Eye, Calendar, Clock, Trash2,
  Music, ShoppingCart, Facebook, Youtube
} from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const sessions = ref([])
const loading = ref(false)

function platformIcon(platform) {
  const map = { tiktok: Music, shopee: ShoppingCart, facebook: Facebook, youtube: Youtube }
  return map[platform] || Radio
}

function statusClass(status) {
  return status === 'Active' ? 'session-card__badge--active' : 'session-card__badge--ended'
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const mins = d.getMinutes().toString().padStart(2, '0')
  return `${day}/${month} ${hours}:${mins}`
}

function formatDuration(mins) {
  if (mins < 60) return `${mins} phút`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

async function fetchSessions() {
  loading.value = true
  try {
    const url = '/sessions?limit=50'
    const res = await apiFetch(url)
    sessions.value = await res.json()
  } catch (err) {
    console.error('Fetch sessions error:', err)
    sessions.value = []
  } finally {
    loading.value = false
  }
}

async function onDelete(id) {
  if (!confirm(t('admin.msg_e19bdcfe', 'Xóa phiên live này?'))) return
  try {
    await apiFetch(`/sessions/${id}`, { method: 'DELETE' })
    sessions.value = sessions.value.filter(s => s.id !== id)
  } catch (err) {
    console.error('Delete session error:', err)
  }
}

watch(() => props.visible, (val) => {
  if (val) fetchSessions()
})
</script>

<style scoped>
.session-history__overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

.session-history__panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  max-width: 90vw;
  height: 100vh;
  background: var(--color-bg-secondary);
  border-left: 1px solid var(--color-border);
  z-index: 999;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.session-history__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.session-history__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
}

.session-history__close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.2s;
}
.session-history__close:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}

.session-history__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.session-history__loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px;
  color: var(--color-text-muted);
  font-size: 14px;
}

.session-history__spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.session-history__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px 20px;
  color: var(--color-text-muted);
  text-align: center;
}
.session-history__empty-sub { font-size: 13px; }

.session-history__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Session Card */
.session-card {
  background: var(--color-bg-card);
  border-radius: 10px;
  padding: 14px;
  position: relative;
  transition: transform 0.2s, background 0.2s;
  border-left: 3px solid var(--color-border);
}
.session-card:hover { transform: translateX(3px); background: var(--color-bg-card-hover); }
.session-card--active { border-left-color: var(--color-success); }

.session-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.session-card__platform {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text-primary);
}

.session-card__badge {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.session-card__badge--active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}
.session-card__badge--ended {
  background: rgba(107, 114, 128, 0.15);
  color: #9ca3af;
}

.session-card__stats {
  display: flex;
  gap: 14px;
  margin-bottom: 8px;
}

.session-card__stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.session-card__stat-icon--hot { color: var(--color-accent-hot); }
.session-card__stat-icon--warm { color: var(--color-accent-warm); }

.session-card__meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
}
.session-card__meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.session-card__live-dot {
  color: #10b981;
  animation: dotPulse 1.5s infinite;
}

.session-card__delete {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0;
  transition: all 0.2s;
}
.session-card:hover .session-card__delete { opacity: 1; }
.session-card__delete:hover { color: var(--color-accent-hot); background: rgba(255, 59, 92, 0.1); }
</style>
