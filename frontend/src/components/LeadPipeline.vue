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
import { logger } from '../utils/logger.js'
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
  padding: 18px 24px; flex-shrink: 0;
}
.pipeline__title {
  font-size: 18px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
}
.pipeline__summary { display: flex; gap: 6px; flex: 1; }
.pipeline__badge {
  font-size: 11px; padding: 4px 12px; border-radius: 20px; font-weight: 700;
  letter-spacing: 0.3px;
}
.pipeline__badge--new { background: rgba(59,130,246,0.1); color: #60a5fa; }
.pipeline__badge--contact { background: rgba(245,158,11,0.1); color: #fbbf24; }
.pipeline__badge--closed { background: rgba(16,185,129,0.1); color: #34d399; }
.pipeline__badge--ignored { background: rgba(107,114,128,0.1); color: #9ca3af; }
.pipeline__refresh {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px;
  padding: 8px; cursor: pointer; color: #a1a1aa; transition: all 0.2s;
}
.pipeline__refresh:hover { border-color: var(--color-border-hover); color: #f4f4f5; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.pipeline__board {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
  padding: 0 24px 24px; flex: 1; overflow-y: auto;
}
.pipeline__column {
  display: flex; flex-direction: column;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 14px; overflow: hidden;
}
.pipeline__col-header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; font-size: 13px; font-weight: 700;
  border-bottom: 2px solid; background: rgba(255,255,255,0.01);
}
.pipeline__col-count {
  margin-left: auto; font-size: 11px; font-weight: 700;
  background: rgba(255,255,255,0.06); padding: 2px 10px; border-radius: 12px;
}
.pipeline__col-body {
  flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
}
.pipeline__card {
  background: rgba(255,255,255,0.02); border-radius: 10px;
  padding: 12px; cursor: pointer; border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.25s;
}
.pipeline__card:hover {
  border-color: rgba(255,255,255,0.1);
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.2);
}
.pipeline__card--hot {
  border-left: 3px solid #ef4444;
  background: rgba(239,68,68,0.03);
}
.pipeline__card-label {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.pipeline__card-name { font-size: 13px; font-weight: 700; color: #e4e4e7; }
.pipeline__card-id { font-size: 11px; color: #52525b; }
.pipeline__card-comment {
  font-size: 12px; color: #a1a1aa; margin: 6px 0;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.5;
}
.pipeline__card-meta {
  display: flex; align-items: center; gap: 8px; font-size: 11px; color: #52525b;
}
.pipeline__card-product {
  background: rgba(245,158,11,0.1); color: #fbbf24;
  padding: 2px 8px; border-radius: 6px; font-weight: 600;
}
.pipeline__card-actions {
  display: flex; gap: 4px; margin-top: 8px;
}
.pipeline__action-btn {
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
  border-radius: 6px; padding: 5px 8px; cursor: pointer;
  display: flex; align-items: center; font-size: 11px; transition: all 0.2s;
}
.pipeline__action-btn:hover { background: rgba(255,255,255,0.06); border-color: rgba(255,255,255,0.1); }
.pipeline__empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px;
  color: #3f3f46; font-size: 13px; font-style: italic;
}

/* Modal */
.pipeline__modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.pipeline__modal {
  background: #18181b; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px; width: 480px;
  max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.pipeline__modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.pipeline__modal-header h3 { font-size: 16px; font-weight: 800; }
.pipeline__modal-close {
  background: none; border: none; color: #52525b;
  cursor: pointer; padding: 4px; transition: color 0.2s;
}
.pipeline__modal-close:hover { color: #f4f4f5; }
.pipeline__modal-body { padding: 22px; }
.pipeline__modal-info {
  display: flex; align-items: center; gap: 14px; margin-bottom: 18px;
}
.pipeline__modal-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(124,58,237,0.1); display: flex; align-items: center; justify-content: center;
  color: #a78bfa;
}
.pipeline__modal-uid { font-size: 13px; color: #52525b; }
.pipeline__modal-link {
  font-size: 12px; color: #a78bfa;
  display: flex; align-items: center; gap: 4px; text-decoration: none; margin-top: 4px;
  transition: color 0.2s;
}
.pipeline__modal-link:hover { color: #c4b5fd; }
.pipeline__modal-comment {
  background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.04);
  padding: 14px; border-radius: 10px;
  margin-bottom: 18px;
}
.pipeline__modal-comment label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px; }
.pipeline__modal-comment p { font-size: 14px; color: #a1a1aa; font-style: italic; }
.pipeline__modal-field { margin-bottom: 14px; }
.pipeline__modal-field label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px; color: #a1a1aa; }
.pipeline__modal-select, .pipeline__modal-input, .pipeline__modal-textarea {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.03);
  color: #f4f4f5; font-size: 13px; outline: none;
  font-family: inherit; transition: border-color 0.2s;
}
.pipeline__modal-select:focus, .pipeline__modal-input:focus, .pipeline__modal-textarea:focus {
  border-color: #7c3aed;
}
.pipeline__modal-save {
  width: 100%; padding: 12px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: white; font-weight: 700; font-size: 14px;
  cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 18px; transition: all 0.25s;
  box-shadow: 0 4px 15px rgba(124,58,237,0.2);
}
.pipeline__modal-save:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.3); }

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

