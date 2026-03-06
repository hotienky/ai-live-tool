<template>
  <div class="session-replay">
    <div class="session-replay__header">
      <h2 class="session-replay__title">
        <PlayCircle :size="20" />
        Session Replay
      </h2>
      <select v-model="selectedSessionId" class="session-replay__select" @change="loadSession">
        <option value="">Chọn phiên live...</option>
        <option v-for="s in sessions" :key="s.id" :value="s.id">
          {{ s.title || `Session #${s.id}` }} — {{ formatDate(s.created_at || s.createdAt) }}
        </option>
      </select>
    </div>

    <div v-if="!selectedSession" class="session-replay__empty">
      <Film :size="40" />
      <p>Chọn một phiên live để xem lại</p>
    </div>

    <div v-else class="session-replay__content">
      <!-- Session Stats -->
      <div class="session-replay__stats">
        <div class="session-replay__stat">
          <span class="session-replay__stat-val">{{ selectedSession.comment_count || selectedSession.commentCount || chatLogs.length }}</span>
          <span class="session-replay__stat-lbl">Comments</span>
        </div>
        <div class="session-replay__stat">
          <span class="session-replay__stat-val session-replay__stat-val--hot">{{ hotCount }}</span>
          <span class="session-replay__stat-lbl">HOT</span>
        </div>
        <div class="session-replay__stat">
          <span class="session-replay__stat-val">{{ warmCount }}</span>
          <span class="session-replay__stat-lbl">WARM</span>
        </div>
        <div class="session-replay__stat">
          <span class="session-replay__stat-val">{{ duration }}</span>
          <span class="session-replay__stat-lbl">Thời lượng</span>
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
        <p v-if="chatLogs.length === 0" class="session-replay__no-logs">Không có bình luận</p>
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
import { PlayCircle, Film, Download, Printer } from 'lucide-vue-next'

import { apiFetch } from '../composables/useApi.js'

const selectedSessionId = ref('')
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
  window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:3333/api'}/export/report?sessionId=${selectedSessionId.value}`, '_blank')
}

loadSessions()
</script>

<style scoped>
.session-replay { padding: 20px; height: 100%; overflow-y: auto; }
.session-replay__header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; flex-wrap: wrap; }
.session-replay__title { font-size: 18px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.session-replay__select {
  flex: 1; min-width: 200px; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-secondary);
  color: var(--color-text-primary); font-size: 13px;
}
.session-replay__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 300px; color: var(--color-text-muted); gap: 12px;
}
.session-replay__stats {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px;
}
.session-replay__stat {
  background: var(--color-bg-secondary); border-radius: 8px; padding: 12px;
  text-align: center; border: 1px solid var(--color-border);
}
.session-replay__stat-val { display: block; font-size: 22px; font-weight: 800; }
.session-replay__stat-val--hot { color: #ef4444; }
.session-replay__stat-lbl { font-size: 11px; color: var(--color-text-muted); }

/* Timeline */
.session-replay__progress { margin-bottom: 16px; }
.session-replay__track {
  position: relative; height: 20px; background: var(--color-bg-secondary);
  border-radius: 4px; border: 1px solid var(--color-border);
}
.session-replay__dot {
  position: absolute; top: 50%; width: 8px; height: 8px; border-radius: 50%;
  transform: translate(-50%, -50%); cursor: pointer;
}
.session-replay__dot--hot { background: #ef4444; box-shadow: 0 0 6px rgba(239,68,68,0.5); }
.session-replay__dot--warm { background: #f59e0b; }
.session-replay__dot--cold { background: #9ca3af; }

/* Logs */
.session-replay__logs {
  max-height: 400px; overflow-y: auto;
  background: var(--color-bg-secondary); border-radius: 8px;
  border: 1px solid var(--color-border); padding: 8px;
}
.session-replay__log {
  display: flex; gap: 8px; padding: 6px 8px; border-radius: 4px;
  font-size: 13px; align-items: baseline;
}
.session-replay__log:hover { background: var(--color-bg-primary); }
.session-replay__log-time { flex-shrink: 0; font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.session-replay__log-label { flex-shrink: 0; font-size: 10px; font-weight: 700; padding: 1px 5px; border-radius: 3px; }
.session-replay__log-label--hot { background: rgba(239,68,68,0.15); color: #ef4444; }
.session-replay__log-label--warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
.session-replay__log-label--cold { background: rgba(107,114,128,0.15); color: #6b7280; }
.session-replay__log-user { font-weight: 600; flex-shrink: 0; color: var(--color-text-secondary); }
.session-replay__log-text { color: var(--color-text-primary); }
.session-replay__no-logs { text-align: center; padding: 20px; color: var(--color-text-muted); }

.session-replay__footer {
  display: flex; gap: 8px; margin-top: 14px; justify-content: flex-end;
}
.session-replay__export {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-secondary); color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.session-replay__export:hover { border-color: #ff3b5c; color: #ff3b5c; }
</style>
