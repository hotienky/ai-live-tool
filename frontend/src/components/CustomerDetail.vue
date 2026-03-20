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

      <!-- Tags Section -->
      <div class="customer-modal__section customer-modal__tags-section">
        <h4 class="customer-modal__section-title">
          <Tag :size="14" /> Tags
        </h4>
        <div class="customer-modal__tags">
          <span
            v-for="(tag, i) in tags"
            :key="i"
            class="customer-modal__tag"
            :class="tagClass(tag)"
          >
            {{ tag }}
            <button class="customer-modal__tag-remove" @click="removeTag(i)">{{ t('admin.msg_63922286', '×') }}</button>
          </span>
          <div class="customer-modal__tag-add" v-if="!addingTag">
            <button class="customer-modal__tag-btn" @click="addingTag = true">
              <Plus :size="12" /> Thêm tag
            </button>
          </div>
          <div class="customer-modal__tag-input-wrap" v-else>
            <input
              ref="tagInputRef"
              v-model="newTag"
              class="customer-modal__tag-input"
              placeholder="VIP, Loyal..."
              @keydown.enter="addTag"
              @keydown.escape="addingTag = false"
            />
            <div class="customer-modal__tag-presets">
              <button v-for="p in tagPresets" :key="p" class="preset-btn" @click="addPresetTag(p)">{{ p }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Section -->
      <div class="customer-modal__section">
        <h4 class="customer-modal__section-title">
          <FileText :size="14" /> Ghi chú
        </h4>
        <textarea
          v-model="notes"
          class="customer-modal__notes"
          :placeholder="t('admin.msg_c34750', 'Ghi chú về khách hàng này...')"
          rows="3"
        ></textarea>
        <button
          class="customer-modal__save-btn"
          @click="saveCustomerInfo"
          :disabled="saving"
        >
          <Save :size="13" />
          {{ saving ? t('admin.saving', 'Đang lưu...') : 'Lưu thông tin' }}
        </button>
        <span v-if="saveSuccess" class="customer-modal__save-ok"><Check :size="14" /> {{ t('admin.msg_e1c9fcf4', 'Đã lưu!') }}</span>
      </div>

      <!-- Timeline -->
      <div class="customer-modal__section">
        <h4 class="customer-modal__section-title">
          <Clock :size="14" /> Lịch sử bình luận
        </h4>
        <div v-if="loading" class="customer-modal__loading">{{ t('admin.loading', 'Đang tải...') }}</div>
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
              <Lightbulb :size="12" /> {{ log.aiSummary || log.ai_summary }}
            </p>
          </div>
          <p v-if="chatLogs.length === 0" class="customer-modal__empty">{{ t('admin.msg_aa89f6e8', 'Chưa có bình luận nào') }}</p>
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
import { ref, watch, nextTick } from 'vue'
import { X, Clock, Download, Tag, Plus, FileText, Save } from 'lucide-vue-next'

const props = defineProps({
  visible: { type: Boolean, default: false },
  customer: { type: Object, default: null },
})

defineEmits(['close'])

import { apiFetch } from '../composables/useApi.js'
import { logger } from '../utils/logger.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const chatLogs = ref([])
const loading = ref(false)
const tags = ref([])
const notes = ref('')
const newTag = ref('')
const addingTag = ref(false)
const tagInputRef = ref(null)
const saving = ref(false)
const saveSuccess = ref(false)

const tagPresets = ['VIP', t('admin.msg_7fee36f4', 'Mua nhiều'), t('admin.msg_a463b2cf', 'Hay hỏi'), t('admin.msg_307c78e2', 'Tiềm năng'), t('admin.msg_d44b7141', 'Đã chốt'), t('admin.msg_846f2600', 'Cần follow-up')]

watch(() => props.visible, async (v) => {
  if (v && props.customer) {
    loading.value = true
    saveSuccess.value = false
    try {
      const id = props.customer.id
      const res = await apiFetch(`/customers/${id}`)
      const data = await res.json()
      chatLogs.value = data.ChatLogs || data.chatLogs || data.chat_logs || []
      // Load tags and notes
      const rawTags = data.tags || props.customer.tags
      tags.value = rawTags ? (typeof rawTags === 'string' ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : rawTags) : []
      notes.value = data.notes || props.customer.notes || ''
    } catch {
      chatLogs.value = []
      tags.value = []
      notes.value = ''
    }
    loading.value = false
  }
})

watch(addingTag, (v) => {
  if (v) nextTick(() => tagInputRef.value?.focus())
})

function addTag() {
  const t = newTag.value.trim()
  if (t && !tags.value.includes(t)) {
    tags.value.push(t)
  }
  newTag.value = ''
  addingTag.value = false
}

function addPresetTag(preset) {
  if (!tags.value.includes(preset)) {
    tags.value.push(preset)
  }
  addingTag.value = false
}

function removeTag(index) {
  tags.value.splice(index, 1)
}

function tagClass(tag) {
  const map = {
    'VIP': 'tag--vip',
    [t('admin.msg_7fee36f4', 'Mua nhiều')]: 'tag--buyer',
    [t('admin.msg_a463b2cf', 'Hay hỏi')]: 'tag--asker',
    [t('admin.msg_307c78e2', 'Tiềm năng')]: 'tag--potential',
    [t('admin.msg_d44b7141', 'Đã chốt')]: 'tag--closed',
    [t('admin.msg_846f2600', 'Cần follow-up')]: 'tag--followup',
  }
  return map[tag] || 'tag--default'
}

async function saveCustomerInfo() {
  if (!props.customer?.id) return
  saving.value = true
  try {
    const { apiFetch } = await import('../composables/useApi.js')
    await apiFetch(`/customers/${props.customer.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        tags: tags.value.join(','),
        notes: notes.value,
      }),
    })
    saveSuccess.value = true
    setTimeout(() => saveSuccess.value = false, 3000)
  } catch (err) {
    console.error('Save failed:', err)
  }
  saving.value = false
}

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
  width: 520px; max-height: 85vh; overflow-y: auto;
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

/* Tags */
.customer-modal__tags-section { border-bottom: 1px solid var(--color-border); }
.customer-modal__tags { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.customer-modal__tag {
  display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 600;
  padding: 3px 10px; border-radius: 12px; border: 1px solid;
}
.tag--vip { background: rgba(234,179,8,0.15); color: #eab308; border-color: rgba(234,179,8,0.3); }
.tag--buyer { background: rgba(16,185,129,0.15); color: #10b981; border-color: rgba(16,185,129,0.3); }
.tag--asker { background: rgba(59,130,246,0.15); color: #3b82f6; border-color: rgba(59,130,246,0.3); }
.tag--potential { background: rgba(168,85,247,0.15); color: #a855f7; border-color: rgba(168,85,247,0.3); }
.tag--closed { background: rgba(239,68,68,0.15); color: #ef4444; border-color: rgba(239,68,68,0.3); }
.tag--followup { background: rgba(245,158,11,0.15); color: #f59e0b; border-color: rgba(245,158,11,0.3); }
.tag--default { background: rgba(107,114,128,0.15); color: #9ca3af; border-color: rgba(107,114,128,0.3); }
.customer-modal__tag-remove {
  background: none; border: none; color: inherit; cursor: pointer;
  font-size: 14px; line-height: 1; opacity: 0.6;
}
.customer-modal__tag-remove:hover { opacity: 1; }
.customer-modal__tag-btn {
  display: flex; align-items: center; gap: 4px;
  background: rgba(255,255,255,0.06); border: 1px dashed var(--color-border);
  border-radius: 12px; padding: 3px 10px; color: var(--color-text-muted);
  font-size: 11px; cursor: pointer; transition: all 0.2s;
}
.customer-modal__tag-btn:hover { border-color: #818cf8; color: #818cf8; }
.customer-modal__tag-input-wrap {
  display: flex; flex-direction: column; gap: 6px; width: 100%;
}
.customer-modal__tag-input {
  background: rgba(255,255,255,0.06); border: 1px solid var(--color-border);
  border-radius: 6px; padding: 5px 10px; color: #fff; font-size: 12px;
  outline: none; width: 150px;
}
.customer-modal__tag-input:focus { border-color: #818cf8; }
.customer-modal__tag-presets { display: flex; flex-wrap: wrap; gap: 4px; }
.preset-btn {
  background: rgba(255,255,255,0.04); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 2px 8px; color: var(--color-text-muted);
  font-size: 10px; cursor: pointer; transition: all 0.15s;
}
.preset-btn:hover { border-color: #818cf8; color: #818cf8; background: rgba(129,140,248,0.08); }

/* Notes */
.customer-modal__notes {
  width: 100%; background: rgba(255,255,255,0.06); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 10px; color: #fff; font-size: 13px;
  resize: vertical; font-family: inherit; box-sizing: border-box; outline: none;
}
.customer-modal__notes:focus { border-color: #818cf8; }
.customer-modal__notes::placeholder { color: var(--color-text-muted); }
.customer-modal__save-btn {
  display: inline-flex; align-items: center; gap: 5px;
  margin-top: 8px; padding: 7px 14px; border-radius: 8px;
  background: linear-gradient(135deg, #059669, #10b981); color: white;
  border: none; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.customer-modal__save-btn:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(5,150,105,0.3); }
.customer-modal__save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.customer-modal__save-ok {
  margin-left: 8px; font-size: 12px; color: #10b981;
  animation: fadeIn 0.3s;
}

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
.customer-modal__label { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
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
