<template>
  <div class="pipeline">
    <!-- Pipeline Header -->
    <div class="pipeline__header">
      <h2 class="pipeline__title">
        <Kanban :size="20" />
        Lead Pipeline
      </h2>
      <div class="pipeline__summary">
        <span class="pipeline__badge pipeline__badge--new">{{ pipeStats.New }} New</span>
        <span class="pipeline__badge pipeline__badge--contact">{{ pipeStats.Contacting }} Contacting</span>
        <span class="pipeline__badge pipeline__badge--closed">{{ pipeStats.Closed }} Closed</span>
        <span class="pipeline__badge pipeline__badge--ignored">{{ pipeStats.Ignored }} Ignored</span>
      </div>
      <button class="pipeline__refresh" @click="loadData" :disabled="loading">
        <RefreshCcw :size="14" :class="{ 'spin': loading }" />
      </button>
    </div>

    <!-- Kanban Board -->
    <div class="pipeline__board">
      <div
        v-for="col in columns"
        :key="col.key"
        class="pipeline__column"
      >
        <div class="pipeline__col-header" :style="{ borderColor: col.color }">
          <component :is="col.icon" :size="14" :style="{ color: col.color }" />
          <span>{{ col.label }}</span>
          <span class="pipeline__col-count">{{ getColumnLeads(col.key).length }}</span>
        </div>
        <div class="pipeline__col-body">
          <div
            v-for="lead in getColumnLeads(col.key)"
            :key="lead.id"
            class="pipeline__card"
            :class="{ 'pipeline__card--hot': lead.ChatLog?.ai_label === 'HOT' }"
            @click="selectedLead = lead"
          >
            <div class="pipeline__card-label">
              <Flame v-if="lead.ChatLog?.ai_label === 'HOT'" :size="12" style="color: #ff3b5c" />
              <CircleDot v-else :size="12" style="color: #ff8c42" />
              <span class="pipeline__card-name">{{ lead.ChatLog?.nickname || 'Unknown' }}</span>
              <span class="pipeline__card-id">@{{ lead.ChatLog?.unique_id || '?' }}</span>
            </div>
            <p class="pipeline__card-comment">{{ lead.ChatLog?.comment_text || '' }}</p>
            <div class="pipeline__card-meta">
              <span class="pipeline__card-time">{{ formatTime(lead.created_at) }}</span>
              <span v-if="lead.product_intent" class="pipeline__card-product">
                🛍️ {{ lead.product_intent }}
              </span>
            </div>
            <!-- Quick Actions -->
            <div class="pipeline__card-actions">
              <button
                v-for="action in getActions(col.key)"
                :key="action.target"
                class="pipeline__action-btn"
                :style="{ color: action.color }"
                @click.stop="moveLead(lead.id, action.target)"
                :title="action.label"
              >
                <component :is="action.icon" :size="12" />
              </button>
            </div>
          </div>
          <div v-if="getColumnLeads(col.key).length === 0" class="pipeline__empty">
            Trống
          </div>
        </div>
      </div>
    </div>

    <!-- Lead Detail Modal -->
    <div v-if="selectedLead" class="pipeline__modal-overlay" @click.self="selectedLead = null">
      <div class="pipeline__modal">
        <div class="pipeline__modal-header">
          <h3>Chi tiết Lead</h3>
          <button @click="selectedLead = null" class="pipeline__modal-close">
            <X :size="18" />
          </button>
        </div>
        <div class="pipeline__modal-body">
          <div class="pipeline__modal-info">
            <div class="pipeline__modal-avatar">
              <User :size="32" />
            </div>
            <div>
              <h4>{{ selectedLead.ChatLog?.nickname || 'Unknown' }}</h4>
              <p class="pipeline__modal-uid">@{{ selectedLead.ChatLog?.unique_id }}</p>
              <a
                v-if="selectedLead.ChatLog?.profile_link"
                :href="selectedLead.ChatLog.profile_link"
                target="_blank"
                class="pipeline__modal-link"
              >
                <ExternalLink :size="12" /> Xem Profile
              </a>
            </div>
          </div>
          <div class="pipeline__modal-comment">
            <label>💬 Bình luận:</label>
            <p>"{{ selectedLead.ChatLog?.comment_text }}"</p>
          </div>
          <div class="pipeline__modal-field">
            <label>📊 Trạng thái:</label>
            <select v-model="editStatus" class="pipeline__modal-select">
              <option value="New">New</option>
              <option value="Contacting">Contacting</option>
              <option value="Closed">Closed</option>
              <option value="Ignored">Ignored</option>
            </select>
          </div>
          <div class="pipeline__modal-field">
            <label>🛍️ Sản phẩm quan tâm:</label>
            <input
              v-model="editProductIntent"
              type="text"
              placeholder="Nhập sản phẩm khách quan tâm..."
              class="pipeline__modal-input"
            />
          </div>
          <div class="pipeline__modal-field">
            <label>📝 Ghi chú nhân viên:</label>
            <textarea
              v-model="editNotes"
              rows="3"
              placeholder="Ghi chú về khách hàng này..."
              class="pipeline__modal-textarea"
            />
          </div>
          <button class="pipeline__modal-save" @click="saveLeadDetails">
            <Save :size="14" />
            Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLeads } from '../composables/useLeads.js'
import {
  Kanban, RefreshCcw, Flame, CircleDot, X, User, ExternalLink,
  Save, PhoneCall, CheckCircle, XCircle, ArrowRight
} from 'lucide-vue-next'

const props = defineProps({
  shopId: { type: String, default: null },
})

const { leads, leadStats, loading, fetchLeads, fetchLeadStats, updateLead } = useLeads()
const selectedLead = ref(null)
const editStatus = ref('')
const editProductIntent = ref('')
const editNotes = ref('')

const pipeStats = computed(() => leadStats.value)

const columns = [
  { key: 'New', label: 'Mới', color: '#3b82f6', icon: CircleDot },
  { key: 'Contacting', label: 'Đang liên hệ', color: '#f59e0b', icon: PhoneCall },
  { key: 'Closed', label: 'Đã chốt', color: '#10b981', icon: CheckCircle },
  { key: 'Ignored', label: 'Bỏ qua', color: '#6b7280', icon: XCircle },
]

function getColumnLeads(status) {
  return leads.value.filter((l) => l.status === status)
}

function getActions(currentStatus) {
  const actions = {
    New: [
      { target: 'Contacting', label: 'Liên hệ', color: '#f59e0b', icon: PhoneCall },
      { target: 'Ignored', label: 'Bỏ qua', color: '#6b7280', icon: XCircle },
    ],
    Contacting: [
      { target: 'Closed', label: 'Đã chốt', color: '#10b981', icon: CheckCircle },
      { target: 'Ignored', label: 'Bỏ qua', color: '#6b7280', icon: XCircle },
    ],
    Closed: [],
    Ignored: [
      { target: 'New', label: 'Mở lại', color: '#3b82f6', icon: ArrowRight },
    ],
  }
  return actions[currentStatus] || []
}

async function moveLead(leadId, newStatus) {
  try {
    await updateLead(leadId, { status: newStatus })
    await fetchLeadStats(props.shopId)
  } catch (e) {
    console.error('moveLead error:', e)
  }
}

async function saveLeadDetails() {
  if (!selectedLead.value) return
  try {
    await updateLead(selectedLead.value.id, {
      status: editStatus.value,
      staff_notes: editNotes.value,
      product_intent: editProductIntent.value,
    })
    await fetchLeadStats(props.shopId)
    selectedLead.value = null
  } catch (e) {
    console.error('saveLead error:', e)
  }
}

watch(selectedLead, (lead) => {
  if (lead) {
    editStatus.value = lead.status
    editNotes.value = lead.staff_notes || ''
    editProductIntent.value = lead.product_intent || ''
  }
})

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

async function loadData() {
  await Promise.all([
    fetchLeads(props.shopId),
    fetchLeadStats(props.shopId),
  ])
}

watch(() => props.shopId, loadData)
onMounted(loadData)
</script>

<style scoped>
.pipeline { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
.pipeline__header {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}
.pipeline__title {
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}
.pipeline__summary { display: flex; gap: 8px; flex: 1; }
.pipeline__badge {
  font-size: 11px; padding: 3px 10px; border-radius: 12px; font-weight: 600;
}
.pipeline__badge--new { background: rgba(59,130,246,0.15); color: #3b82f6; }
.pipeline__badge--contact { background: rgba(245,158,11,0.15); color: #f59e0b; }
.pipeline__badge--closed { background: rgba(16,185,129,0.15); color: #10b981; }
.pipeline__badge--ignored { background: rgba(107,114,128,0.15); color: #6b7280; }
.pipeline__refresh {
  background: none; border: 1px solid var(--color-border); border-radius: 6px;
  padding: 6px; cursor: pointer; color: var(--color-text-secondary);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.pipeline__board {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  padding: 16px; flex: 1; overflow-y: auto;
}
.pipeline__column {
  display: flex; flex-direction: column;
  background: var(--color-bg-primary); border-radius: 10px;
  border: 1px solid var(--color-border);
}
.pipeline__col-header {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px; font-size: 13px; font-weight: 600;
  border-bottom: 2px solid; border-top-left-radius: 10px; border-top-right-radius: 10px;
}
.pipeline__col-count {
  margin-left: auto; font-size: 11px;
  background: var(--color-bg-secondary); padding: 2px 8px; border-radius: 10px;
}
.pipeline__col-body {
  flex: 1; padding: 8px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;
}
.pipeline__card {
  background: var(--color-bg-secondary); border-radius: 8px;
  padding: 10px; cursor: pointer; border: 1px solid transparent;
  transition: all 0.2s;
}
.pipeline__card:hover { border-color: var(--color-accent-warm); transform: translateY(-1px); }
.pipeline__card--hot { border-left: 3px solid #ff3b5c; }
.pipeline__card-label {
  display: flex; align-items: center; gap: 4px; margin-bottom: 4px;
}
.pipeline__card-name { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.pipeline__card-id { font-size: 11px; color: var(--color-text-muted); }
.pipeline__card-comment {
  font-size: 12px; color: var(--color-text-secondary); margin: 4px 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.pipeline__card-meta {
  display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--color-text-muted);
}
.pipeline__card-product {
  background: rgba(255,140,66,0.12); padding: 1px 6px; border-radius: 4px;
}
.pipeline__card-actions {
  display: flex; gap: 4px; margin-top: 6px;
}
.pipeline__action-btn {
  background: var(--color-bg-primary); border: 1px solid var(--color-border);
  border-radius: 4px; padding: 4px 6px; cursor: pointer;
  display: flex; align-items: center; font-size: 11px; transition: all 0.2s;
}
.pipeline__action-btn:hover { background: var(--color-bg-card); }
.pipeline__empty {
  text-align: center; padding: 20px; color: var(--color-text-muted);
  font-size: 13px; font-style: italic;
}

/* Modal */
.pipeline__modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.pipeline__modal {
  background: var(--color-bg-secondary); border-radius: 12px; width: 480px;
  max-height: 80vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.pipeline__modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
}
.pipeline__modal-header h3 { font-size: 16px; font-weight: 700; }
.pipeline__modal-close {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 4px;
}
.pipeline__modal-body { padding: 20px; }
.pipeline__modal-info {
  display: flex; align-items: center; gap: 12px; margin-bottom: 16px;
}
.pipeline__modal-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: var(--color-bg-primary); display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}
.pipeline__modal-uid { font-size: 13px; color: var(--color-text-muted); }
.pipeline__modal-link {
  font-size: 12px; color: var(--color-accent-warm);
  display: flex; align-items: center; gap: 4px; text-decoration: none; margin-top: 4px;
}
.pipeline__modal-comment {
  background: var(--color-bg-primary); padding: 12px; border-radius: 8px;
  margin-bottom: 16px;
}
.pipeline__modal-comment label { font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px; }
.pipeline__modal-comment p { font-size: 14px; color: var(--color-text-secondary); font-style: italic; }
.pipeline__modal-field { margin-bottom: 12px; }
.pipeline__modal-field label { font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px; }
.pipeline__modal-select, .pipeline__modal-input, .pipeline__modal-textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); font-size: 13px; outline: none;
  font-family: inherit;
}
.pipeline__modal-select:focus, .pipeline__modal-input:focus, .pipeline__modal-textarea:focus {
  border-color: var(--color-accent-warm);
}
.pipeline__modal-save {
  width: 100%; padding: 10px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  color: white; font-weight: 600; font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 16px; transition: opacity 0.2s;
}
.pipeline__modal-save:hover { opacity: 0.9; }

/* Responsive */
@media (max-width: 1024px) {
  .pipeline__board { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .pipeline__board { grid-template-columns: 1fr; }
  .pipeline__header { flex-wrap: wrap; gap: 8px; }
  .pipeline__summary { flex-wrap: wrap; }
  .pipeline__modal { width: 95vw; }
}
</style>
