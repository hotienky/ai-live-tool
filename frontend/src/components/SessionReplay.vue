<template>
  <div class="session-replay">
    <div class="session-replay__header">
      <h2 class="session-replay__title">
        <PlayCircle :size="20" />
        Session Replay
      </h2>
      <select v-model="selectedSessionId" class="session-replay__select" @change="loadSession">
        <option value="">{{ t('admin.msg_622fd924', 'Chọn phiên live...') }}</option>
        <option v-for="s in sessions" :key="s.id" :value="s.id">
          {{ s.title || `Session #${s.id}` }} — {{ formatDate(s.created_at || s.createdAt) }}
        </option>
      </select>
    </div>

    <div v-if="!selectedSession" class="session-replay__empty">
      <div class="session-replay__empty-icon-wrap">
        <Film :size="40" />
      </div>
      <p class="session-replay__empty-title">{{ t('admin.msg_0d730722', 'Chọn một phiên live để xem lại') }}</p>
      <p class="session-replay__empty-sub">{{ t('admin.msg_035f6211', 'Bạn có thể xem lại toàn bộ bình luận và phân tích AI của các phiên trước') }}</p>
    </div>

    <div v-else class="session-replay__content">
      <!-- Session Stats -->
      <div class="session-replay__stats">
        <div class="session-replay__stat session-replay__stat--comments">
          <div class="session-replay__stat-icon"><MessageSquare :size="20" /></div>
          <div class="session-replay__stat-data">
            <span class="session-replay__stat-val">{{ selectedSession.comment_count || selectedSession.commentCount || chatLogs.length }}</span>
            <span class="session-replay__stat-lbl">Comments</span>
          </div>
        </div>
        <div class="session-replay__stat session-replay__stat--hot">
          <div class="session-replay__stat-icon"><Flame :size="20" /></div>
          <div class="session-replay__stat-data">
            <span class="session-replay__stat-val">{{ hotCount }}</span>
            <span class="session-replay__stat-lbl">HOT</span>
          </div>
        </div>
        <div class="session-replay__stat session-replay__stat--warm">
          <div class="session-replay__stat-icon"><CircleDot :size="20" /></div>
          <div class="session-replay__stat-data">
            <span class="session-replay__stat-val">{{ warmCount }}</span>
            <span class="session-replay__stat-lbl">WARM</span>
          </div>
        </div>
        <div class="session-replay__stat session-replay__stat--duration">
          <div class="session-replay__stat-icon"><Clock :size="20" /></div>
          <div class="session-replay__stat-data">
            <span class="session-replay__stat-val">{{ duration }}</span>
            <span class="session-replay__stat-lbl">{{ t('admin.msg_77d9bdc6', 'Thời lượng') }}</span>
          </div>
        </div>
      </div>

      <!-- Timeline Progress -->
      <div class="session-replay__progress">
        <div class="session-replay__track">
          <div v-for="(dot, i) in timelineDots" :key="i"
            class="session-replay__dot"
            :class="`session-replay__dot--${dot.label.toLowerCase()}`"
            :style="{ left: dot.pct + '%' }"
            :title="`${dot.time} — ${dot.label}: ${dot.text}`"
          ></div>
        </div>
      </div>

      <!-- Chat Log -->
      <div class="session-replay__logs" ref="logsRef">
        <div v-for="log in chatLogs" :key="log.id" class="session-replay__log">
          <span class="session-replay__log-time">{{ formatTime(log.created_at || log.createdAt) }}</span>
          <span :class="['session-replay__log-label', `session-replay__log-label--${(log.ai_label || log.aiLabel || 'cold').toLowerCase()}`]">
            {{ (log.ai_label || log.aiLabel || 'COLD') }}
          </span>
          <span class="session-replay__log-user">{{ log.nickname }}:</span>
          <span class="session-replay__log-text">{{ log.comment_text || log.commentText }}</span>
        </div>
        <p v-if="chatLogs.length === 0" class="session-replay__no-logs">{{ t('admin.msg_209cdcb9', 'Không có bình luận') }}</p>
      </div>

      <!-- Export -->
      <div class="session-replay__footer">
        <button class="session-replay__export" @click="exportSession">
          <Download :size="14" /> Export CSV
        </button>
        <button class="session-replay__export" @click="printReport">
          <Printer :size="14" /> In báo cáo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { PlayCircle, Film, Download, Printer, MessageSquare, Flame, CircleDot, Clock } from 'lucide-vue-next'

import { apiFetch } from '../composables/useApi.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const selectedSessionId = useUrlParam('session', '')
const selectedSession = ref(null)
const sessions = ref([])
const chatLogs = ref([])

const hotCount = computed(() => chatLogs.value.filter(c => (c.ai_label || c.aiLabel) === 'HOT').length)
const warmCount = computed(() => chatLogs.value.filter(c => (c.ai_label || c.aiLabel) === 'WARM').length)

const duration = computed(() => {
  if (!selectedSession.value) return '—'
  const start = new Date(selectedSession.value.started_at || selectedSession.value.startedAt || selectedSession.value.created_at)
  const end = new Date(selectedSession.value.ended_at || selectedSession.value.endedAt || Date.now())
  const mins = Math.round((end - start) / 60000)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
})

const timelineDots = computed(() => {
  if (chatLogs.value.length === 0) return []
  const logs = chatLogs.value
  const first = new Date(logs[0].created_at || logs[0].createdAt).getTime()
  const last = new Date(logs[logs.length - 1].created_at || logs[logs.length - 1].createdAt).getTime()
  const range = last - first || 1

  return logs
    .filter(l => (l.ai_label || l.aiLabel) === 'HOT' || (l.ai_label || l.aiLabel) === 'WARM')
    .map(l => {
      const t = new Date(l.created_at || l.createdAt).getTime()
      return {
        pct: ((t - first) / range) * 100,
        label: l.ai_label || l.aiLabel || 'COLD',
        text: (l.comment_text || l.commentText || '').substring(0, 30),
        time: new Date(l.created_at || l.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      }
    })
})

// Load sessions list
async function loadSessions() {
  try {
    const res = await apiFetch(`/sessions?limit=50`)
    const data = await res.json()
    sessions.value = data.data || data || []
  } catch { sessions.value = [] }
}

async function loadSession() {
  if (!selectedSessionId.value) {
    selectedSession.value = null
    chatLogs.value = []
    return
  }
  try {
    const res = await apiFetch(`/sessions/${selectedSessionId.value}`)
    const data = await res.json()
    selectedSession.value = data
    chatLogs.value = data.ChatLogs || data.chatLogs || data.chat_logs || []
    chatLogs.value.sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt))
  } catch {
    selectedSession.value = null
    chatLogs.value = []
  }
}

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString('vi-VN') + ' ' + new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function formatTime(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function exportSession() {
  const headers = ['Time', 'User', 'Comment', 'Label', 'AI Summary']
  let csv = headers.join(',') + '\n'
  for (const l of chatLogs.value) {
    csv += [
      formatTime(l.created_at || l.createdAt),
      `"${(l.nickname || '').replace(/"/g, '""')}"`,
      `"${(l.comment_text || l.commentText || '').replace(/"/g, '""')}"`,
      l.ai_label || l.aiLabel || '',
      `"${(l.ai_summary || l.aiSummary || '').replace(/"/g, '""')}"`,
    ].join(',') + '\n'
  }
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `session_${selectedSessionId.value}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function printReport() {
  const token = localStorage.getItem('token')
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3333/api'
  window.open(`${base}/export/report?sessionId=${selectedSessionId.value}&token=${token}`, '_blank')
}

loadSessions()
</script>

<style scoped>
.session-replay { padding: 24px; height: 100%; overflow-y: auto; }

.session-replay__header {
  display: flex; align-items: center; gap: 16px;
  margin-bottom: 24px; flex-wrap: wrap;
}
.session-replay__title {
  font-size: 20px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
  color: var(--color-text-primary);
}
.session-replay__select {
  flex: 1; min-width: 220px; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--color-text-primary); font-size: 13px; cursor: pointer;
  transition: all 0.2s; outline: none;
}
.session-replay__select:focus { border-color: var(--color-accent-primary); box-shadow: 0 0 0 3px var(--color-accent-glow); }

/* Empty State */
.session-replay__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 400px; gap: 12px;
  background: var(--glass-bg);
  border: 1px dashed var(--glass-border); border-radius: var(--radius-lg);
  color: var(--color-text-muted);
}
.session-replay__empty-icon-wrap {
  width: 72px; height: 72px; border-radius: 50%;
  background: var(--color-accent-glow); display: flex;
  align-items: center; justify-content: center; color: var(--accent-light);
  animation: floatIcon 3s ease-in-out infinite;
  margin-bottom: 4px;
}
@keyframes floatIcon {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
.session-replay__empty-title {
  font-size: 16px; font-weight: 600; color: var(--color-text-secondary); margin: 0;
}
.session-replay__empty-sub {
  font-size: 13px; color: var(--color-text-muted); margin: 0; max-width: 400px; text-align: center;
}

/* Stats Grid */
.session-replay__stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
}
.session-replay__stat {
  display: flex; align-items: center; gap: 14px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px 22px;
  transition: all 0.3s ease;
  position: relative; overflow: hidden;
}
.session-replay__stat::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 16px 0 0 16px;
}
.session-replay__stat:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-3px);
  box-shadow: var(--shadow-card);
}
.session-replay__stat--comments::before { background: linear-gradient(180deg, #3b82f6, #2563eb); }
.session-replay__stat--comments .session-replay__stat-icon { background: rgba(59,130,246,0.12); color: #60a5fa; }
.session-replay__stat--hot::before { background: linear-gradient(180deg, #ef4444, #dc2626); }
.session-replay__stat--hot .session-replay__stat-icon { background: rgba(239,68,68,0.12); color: #f87171; }
.session-replay__stat--warm::before { background: linear-gradient(180deg, #f59e0b, #d97706); }
.session-replay__stat--warm .session-replay__stat-icon { background: rgba(245,158,11,0.12); color: #fbbf24; }
.session-replay__stat--duration::before { background: linear-gradient(180deg, #a855f7, #7c3aed); }
.session-replay__stat--duration .session-replay__stat-icon { background: rgba(168,85,247,0.12); color: #c084fc; }
.session-replay__stat-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.session-replay__stat-data { display: flex; flex-direction: column; }
.session-replay__stat-val {
  font-size: 28px; font-weight: 800;
  color: var(--color-text-primary); line-height: 1;
}
.session-replay__stat-lbl {
  font-size: 12px; color: var(--color-text-muted); margin-top: 4px;
  font-weight: 500;
}

/* Timeline */
.session-replay__progress { margin-bottom: 20px; }
.session-replay__track {
  position: relative; height: 24px;
  background: var(--glass-bg);
  border-radius: var(--radius-md); border: 1px solid var(--glass-border);
  overflow: hidden;
}
.session-replay__dot {
  position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%;
  transform: translate(-50%, -50%); cursor: pointer; z-index: 2;
  transition: all 0.2s;
}
.session-replay__dot:hover { transform: translate(-50%, -50%) scale(1.5); }
.session-replay__dot--hot { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
.session-replay__dot--warm { background: #f59e0b; box-shadow: 0 0 6px rgba(245,158,11,0.3); }
.session-replay__dot--cold { background: #6b7280; }

/* Chat Logs */
.session-replay__logs {
  max-height: 420px; overflow-y: auto;
  background: var(--glass-bg);
  border-radius: 14px; border: 1px solid var(--glass-border);
  padding: 8px;
}
.session-replay__logs::-webkit-scrollbar { width: 4px; }
.session-replay__logs::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }

.session-replay__log {
  display: flex; gap: 8px; padding: 8px 10px; border-radius: 8px;
  font-size: 13px; align-items: baseline;
  transition: all 0.15s;
}
.session-replay__log:hover { background: var(--color-accent-glow); }
.session-replay__log-time {
  flex-shrink: 0; font-size: 11px; color: var(--color-text-muted);
  font-family: 'SF Mono', 'Fira Code', monospace; min-width: 60px;
}
.session-replay__log-label {
  flex-shrink: 0; font-size: 10px; font-weight: 700;
  padding: 2px 8px; border-radius: 6px;
}
.session-replay__log-label--hot {
  background: rgba(239,68,68,0.15); color: #ef4444;
  box-shadow: 0 0 6px rgba(239,68,68,0.1);
}
.session-replay__log-label--warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
.session-replay__log-label--cold { background: rgba(107,114,128,0.1); color: #6b7280; }
.session-replay__log-user {
  font-weight: 700; flex-shrink: 0; color: var(--color-text-secondary);
}
.session-replay__log-text { color: var(--color-text-primary); }
.session-replay__no-logs {
  text-align: center; padding: 30px; color: var(--color-text-muted); font-size: 14px;
}

/* Footer */
.session-replay__footer {
  display: flex; gap: 10px; margin-top: 16px; justify-content: flex-end;
}
.session-replay__export {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: var(--radius-md);
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.session-replay__export:hover {
  border-color: var(--color-accent-primary); color: var(--accent-light);
  transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

@media (max-width: 768px) {
  .session-replay__stats { grid-template-columns: repeat(2, 1fr); }
  .session-replay__header { flex-direction: column; align-items: flex-start; }
}
</style>

