<template>
  <div class="customer-modal" v-if="visible" @click.self="$emit('close')">
    <div class="customer-modal__content">
      <div class="customer-modal__header">
        <div class="customer-modal__profile">
          <div class="customer-modal__avatar">{{ (customer?.nickname || '?').charAt(0).toUpperCase() }}</div>
          <div>
            <h3 class="customer-modal__name">{{ customer?.nickname }}</h3>
            <span class="customer-modal__uid">@{{ customer?.uniqueId || customer?.unique_id }}</span>
          </div>
        </div>
        <button class="customer-modal__close" @click="$emit('close')"><X :size="18" /></button>
      </div>

      <!-- Stats Row -->
      <div class="customer-modal__stats">
        <div class="customer-modal__stat">
          <span class="customer-modal__stat-value">{{ customer?.totalComments || customer?.total_comments || 0 }}</span>
          <span class="customer-modal__stat-label">Comments</span>
        </div>
        <div class="customer-modal__stat">
          <span class="customer-modal__stat-value customer-modal__stat-value--hot">{{ customer?.hotCount || customer?.hot_count || 0 }}</span>
          <span class="customer-modal__stat-label">HOT</span>
        </div>
        <div class="customer-modal__stat">
          <span class="customer-modal__stat-value">{{ getLabelBadge(customer?.lastLabel || customer?.last_label) }}</span>
          <span class="customer-modal__stat-label">Last Label</span>
        </div>
      </div>

      <!-- Timeline -->
      <div class="customer-modal__section">
        <h4 class="customer-modal__section-title">
          <Clock :size="14" /> Lịch sử bình luận
        </h4>
        <div v-if="loading" class="customer-modal__loading">Đang tải...</div>
        <div v-else class="customer-modal__timeline">
          <div v-for="log in chatLogs" :key="log.id" class="customer-modal__log">
            <div class="customer-modal__log-meta">
              <span :class="['customer-modal__label', `customer-modal__label--${(log.aiLabel || log.ai_label || 'cold').toLowerCase()}`]">
                {{ log.aiLabel || log.ai_label || 'COLD' }}
              </span>
              <span class="customer-modal__log-time">{{ formatTime(log.createdAt || log.created_at) }}</span>
            </div>
            <p class="customer-modal__log-text">{{ log.commentText || log.comment_text }}</p>
            <p v-if="log.aiSummary || log.ai_summary" class="customer-modal__log-summary">
              💡 {{ log.aiSummary || log.ai_summary }}
            </p>
          </div>
          <p v-if="chatLogs.length === 0" class="customer-modal__empty">Chưa có bình luận nào</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="customer-modal__actions">
        <button class="customer-modal__action-btn" @click="exportCSV">
          <Download :size="14" /> Export CSV
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { X, Clock, Download } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  customer: { type: Object, default: null },
})

defineEmits(['close'])

const API = 'http://localhost:3000/api'
const chatLogs = ref([])
const loading = ref(false)

watch(() => props.visible, async (v) => {
  if (v && props.customer) {
    loading.value = true
    try {
      const id = props.customer.id
      const res = await fetch(`${API}/customers/${id}`)
      const data = await res.json()
      chatLogs.value = data.ChatLogs || data.chatLogs || data.chat_logs || []
    } catch { chatLogs.value = [] }
    loading.value = false
  }
})

function getLabelBadge(label) {
  if (!label) return '—'
  return label.replace(/[\[\]]/g, '')
}

function formatTime(dt) {
  if (!dt) return ''
  const d = new Date(dt)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function exportCSV() {
  const headers = ['Time', 'Comment', 'Label', 'AI Summary']
  let csv = headers.join(',') + '\n'
  for (const log of chatLogs.value) {
    csv += [
      formatTime(log.createdAt || log.created_at),
      `"${(log.commentText || log.comment_text || '').replace(/"/g, '""')}"`,
      log.aiLabel || log.ai_label || '',
      `"${(log.aiSummary || log.ai_summary || '').replace(/"/g, '""')}"`,
    ].join(',') + '\n'
  }
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `customer_${props.customer?.uniqueId || 'export'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}
</script>

<style scoped>
.customer-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.customer-modal__content {
  background: var(--color-bg-secondary); border-radius: 16px;
  width: 480px; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

.customer-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 20px; border-bottom: 1px solid var(--color-border);
}
.customer-modal__profile { display: flex; align-items: center; gap: 12px; }
.customer-modal__avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  color: white; display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800;
}
.customer-modal__name { font-size: 16px; font-weight: 700; }
.customer-modal__uid { font-size: 12px; color: var(--color-text-muted); }
.customer-modal__close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; }

.customer-modal__stats {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  padding: 14px 20px; border-bottom: 1px solid var(--color-border);
}
.customer-modal__stat { text-align: center; }
.customer-modal__stat-value { display: block; font-size: 22px; font-weight: 800; }
.customer-modal__stat-value--hot { color: #ef4444; }
.customer-modal__stat-label { font-size: 11px; color: var(--color-text-muted); }

.customer-modal__section { padding: 14px 20px; }
.customer-modal__section-title {
  font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px; color: var(--color-text-secondary);
}
.customer-modal__loading { text-align: center; padding: 20px; color: var(--color-text-muted); }
.customer-modal__timeline { display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto; }

.customer-modal__log {
  padding: 10px 12px; border-radius: 8px;
  background: var(--color-bg-primary); border: 1px solid var(--color-border);
}
.customer-modal__log-meta { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.customer-modal__label {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
}
.customer-modal__label--hot { background: rgba(239,68,68,0.15); color: #ef4444; }
.customer-modal__label--warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
.customer-modal__label--cold { background: rgba(107,114,128,0.15); color: #6b7280; }
.customer-modal__log-time { font-size: 11px; color: var(--color-text-muted); }
.customer-modal__log-text { font-size: 13px; margin: 0; }
.customer-modal__log-summary { font-size: 11px; color: var(--color-text-muted); margin: 4px 0 0; }
.customer-modal__empty { text-align: center; color: var(--color-text-muted); font-size: 13px; padding: 16px; }

.customer-modal__actions {
  padding: 12px 20px; border-top: 1px solid var(--color-border);
  display: flex; justify-content: flex-end;
}
.customer-modal__action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.customer-modal__action-btn:hover { border-color: #ff3b5c; color: #ff3b5c; }
</style>
