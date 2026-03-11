<template>
  <div class="pipeline">
    <!-- Pipeline Header -->
    <div class="pipeline__header">
      <h2 class="pipeline__title">
        <Kanban :size="20" />
        Lead Pipeline
      </h2>
      <div class="pipeline__summary">
        <span class="pipeline__badge pipeline__badge--new">{{ pipeStats.New }} Mới</span>
        <span class="pipeline__badge pipeline__badge--contact">{{ pipeStats.Contacting }} Đã liên hệ</span>
        <span class="pipeline__badge pipeline__badge--closed">{{ (pipeStats.Closed || 0) + (pipeStats.Ignored || 0) + (pipeStats.Done || 0) }} Xong</span>
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
        :class="{ 'pipeline__column--drag-over': dragOverCol === col.key && dragSourceCol !== col.key }"
        @dragover.prevent="onDragOver($event, col.key)"
        @dragenter.prevent="onDragEnter(col.key)"
        @dragleave="onDragLeave($event, col.key)"
        @drop.prevent="onDrop(col.key)"
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
            :class="{
              'pipeline__card--hot': (lead.label || lead.aiLabel) === 'HOT',
              'pipeline__card--dragging': draggingLeadId === lead.id,
            }"
            draggable="true"
            @dragstart="onDragStart($event, lead, col.key)"
            @dragend="onDragEnd"
            @click="selectedLead = lead"
          >
            <div class="pipeline__card-label">
              <Flame v-if="(lead.label || lead.aiLabel) === 'HOT'" :size="12" style="color: #ff3b5c" />
              <CircleDot v-else :size="12" style="color: #ff8c42" />
              <span class="pipeline__card-name" @click.stop="emit('openCustomer', { nickname: lead.nickname, uniqueId: lead.uniqueId || lead.unique_id })" style="cursor:pointer" title="Xem khách hàng">{{ lead.nickname || 'Unknown' }}</span>
              <span class="pipeline__card-id">@{{ lead.uniqueId || lead.unique_id || '?' }}</span>
            </div>
            <p class="pipeline__card-comment">{{ lead.comment || lead.commentText || '' }}</p>
            <div class="pipeline__card-meta">
              <span class="pipeline__card-time">{{ formatTime(lead.createdAt || lead.created_at) }}</span>
              <span v-if="lead.productIntent || lead.product_intent" class="pipeline__card-product">
                <ShoppingBag :size="12" style="vertical-align:middle" /> {{ lead.productIntent || lead.product_intent }}
              </span>
              <a
                v-if="detectPhone(lead.comment || lead.commentText)"
                :href="'https://zalo.me/' + detectPhone(lead.comment || lead.commentText)"
                target="_blank"
                class="pipeline__card-zalo"
                @click.stop
                title="Mở Zalo"
              >
                <Phone :size="11" /> Zalo: {{ detectPhone(lead.comment || lead.commentText) }}
              </a>
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
          <!-- Drop placeholder when column is empty or being dragged over -->
          <div v-if="getColumnLeads(col.key).length === 0" class="pipeline__empty"
            :class="{ 'pipeline__empty--active': dragOverCol === col.key && dragSourceCol !== col.key }">
            <GripVertical v-if="dragOverCol === col.key && dragSourceCol !== col.key" :size="20" style="opacity:0.5" />
            <span v-if="dragOverCol === col.key && dragSourceCol !== col.key">Thả vào đây</span>
            <template v-else>
              <Users :size="24" class="pipeline__empty-icon" />
              <span>Chưa có lead</span>
            </template>
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
              <h4>{{ selectedLead?.nickname || 'Unknown' }}</h4>
              <p class="pipeline__modal-uid">@{{ selectedLead.uniqueId || selectedLead.unique_id }}</p>
              <a
                v-if="selectedLead.profileLink || selectedLead.profile_link"
                :href="selectedLead.profileLink || selectedLead.profile_link"
                target="_blank"
                class="pipeline__modal-link"
              >
                <ExternalLink :size="12" /> Xem Profile
              </a>
            </div>
          </div>
          <div class="pipeline__modal-comment">
            <label><MessageCircle :size="14" style="vertical-align:middle" /> Bình luận:</label>
            <p>"{{ selectedLead.comment || selectedLead.commentText || '' }}"</p>
          </div>
          <div class="pipeline__modal-field">
            <label><BarChart3 :size="14" style="vertical-align:middle" /> Trạng thái:</label>
            <select v-model="editStatus" class="pipeline__modal-select">
              <option value="New">Mới</option>
              <option value="Contacting">Đã liên hệ</option>
              <option value="Done">Xong</option>
            </select>
          </div>
          <div class="pipeline__modal-field">
            <label><ShoppingBag :size="14" style="vertical-align:middle" /> Sản phẩm quan tâm:</label>
            <input
              v-model="editProductIntent"
              type="text"
              placeholder="Nhập sản phẩm khách quan tâm..."
              class="pipeline__modal-input"
            />
          </div>
          <div class="pipeline__modal-field">
            <label><FileText :size="14" style="vertical-align:middle" /> Ghi chú nhân viên:</label>
            <textarea
              v-model="editNotes"
              rows="2"
              placeholder="Ghi chú về khách hàng này..."
              class="pipeline__modal-textarea"
            />
          </div>

          <div class="pipeline__modal-actions-row" style="display:flex;gap:8px;margin-top:8px">
            <button class="pipeline__modal-save" @click="saveLeadDetails" style="flex:1">
              <Save :size="14" />
              Lưu thay đổi
            </button>
            <button
              class="pipeline__modal-save"
              @click="copyLeadInfo"
              style="flex:1;background:linear-gradient(135deg, #3b82f6, #2563eb)"
            >
              <Clipboard :size="14" /> 📋 Copy thông tin
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useLeads } from '../composables/useLeads.js'
import { logger } from '../utils/logger.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const emit = defineEmits(['openCustomer'])
import {
  Kanban, RefreshCcw, Flame, CircleDot, X, User, ExternalLink,
  Save, PhoneCall, CheckCircle, ArrowRight, Clipboard, Phone,
  ShoppingBag, MessageCircle, BarChart3, FileText, GripVertical, Users, Plus
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'

const props = defineProps({
  /* tenant-scoped */,
})

const { leads, leadStats, loading, fetchLeads, fetchLeadStats, updateLead } = useLeads()
const selectedLead = ref(null)
const editStatus = ref('')
const editProductIntent = ref('')
const editNotes = ref('')
const products = ref([])
const orderItems = ref([{ productId: '', name: '', price: 0, qty: 1 }])
const orderTotal = computed(() => orderItems.value.reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0))
const pipeStats = computed(() => leadStats.value)

const columns = [
  { key: 'New', label: 'Mới', color: '#3b82f6', icon: CircleDot },
  { key: 'Contacting', label: 'Đã liên hệ', color: '#f59e0b', icon: PhoneCall },
  { key: 'Done', label: 'Xong', color: '#10b981', icon: CheckCircle },
]

function getColumnLeads(status) {
  if (status === 'Done') {
    return leads.value.filter((l) => l.status === 'Closed' || l.status === 'Ignored' || l.status === 'Done')
  }
  return leads.value.filter((l) => l.status === status)
}

function detectPhone(text) {
  if (!text) return ''
  const match = text.match(/(0[3-9]\d{8})/)
  return match ? match[1] : ''
}

function getActions(currentStatus) {
  const actions = {
    New: [
      { target: 'Contacting', label: 'Liên hệ', color: '#f59e0b', icon: PhoneCall },
      { target: 'Done', label: 'Xong', color: '#10b981', icon: CheckCircle },
    ],
    Contacting: [
      { target: 'Done', label: 'Xong', color: '#10b981', icon: CheckCircle },
    ],
    Done: [
      { target: 'New', label: 'Mở lại', color: '#3b82f6', icon: ArrowRight },
    ],
  }
  return actions[currentStatus] || []
}

// ── Drag & Drop ──
const draggingLeadId = ref(null)
const dragSourceCol = ref(null)
const dragOverCol = ref(null)
let dragLeadData = null

function onDragStart(e, lead, fromCol) {
  draggingLeadId.value = lead.id
  dragSourceCol.value = fromCol
  dragLeadData = lead
  // Set drag data (required for Firefox)
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', lead.id)
  // Set a slight delay so the card visually fades
  requestAnimationFrame(() => {
    // This runs after the browser captures the drag ghost image
  })
}

function onDragEnd() {
  draggingLeadId.value = null
  dragSourceCol.value = null
  dragOverCol.value = null
  dragLeadData = null
}

function onDragOver(e, colKey) {
  e.dataTransfer.dropEffect = 'move'
}

function onDragEnter(colKey) {
  dragOverCol.value = colKey
}

function onDragLeave(e, colKey) {
  // Only clear if we're leaving the column entirely (not entering a child)
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX
  const y = e.clientY
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    if (dragOverCol.value === colKey) {
      dragOverCol.value = null
    }
  }
}

async function onDrop(colKey) {
  dragOverCol.value = null
  if (!dragLeadData || dragSourceCol.value === colKey) return

  const leadId = dragLeadData.id
  const fromLabel = columns.find(c => c.key === dragSourceCol.value)?.label || dragSourceCol.value
  const toLabel = columns.find(c => c.key === colKey)?.label || colKey

  try {
    await updateLead(leadId, { status: colKey })
    await fetchLeadStats()
    showToast(`Đã chuyển lead sang "${toLabel}"`, 'success')
  } catch (e) {
    console.error('drop moveLead error:', e)
    showToast('Lỗi khi chuyển lead', 'error')
  }
}

async function moveLead(leadId, newStatus) {
  const toLabel = columns.find(c => c.key === newStatus)?.label || newStatus
  try {
    await updateLead(leadId, { status: newStatus })
    await fetchLeadStats()
    showToast(`Đã chuyển lead sang "${toLabel}"`, 'success')
  } catch (e) {
    console.error('moveLead error:', e)
    showToast('Lỗi khi chuyển lead', 'error')
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
    await fetchLeadStats()
    selectedLead.value = null
  } catch (e) {
    console.error('saveLead error:', e)
  }
}

watch(selectedLead, (lead) => {
  if (lead) {
    editStatus.value = lead.status
    editNotes.value = lead.staffNotes || lead.staff_notes || ''
    editProductIntent.value = lead.productIntent || lead.product_intent || ''
    // Reset order items and try to match a product from intent
    const intent = (lead.productIntent || lead.product_intent || '').toLowerCase()
    const matched = intent ? products.value.find(p => p.name.toLowerCase().includes(intent) || (p.keywords || []).some(k => intent.includes(k.toLowerCase()))) : null
    orderItems.value = matched
      ? [{ productId: matched.id, name: matched.name, price: Number(matched.price), qty: 1 }]
      : [{ productId: '', name: '', price: 0, qty: 1 }]
  }
})

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

function fmtCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}

function onProdSelect(idx) {
  const item = orderItems.value[idx]
  const p = products.value.find(x => x.id === item.productId)
  if (p) { item.name = p.name; item.price = Number(p.price) || 0 }
}

function copyLeadInfo() {
  if (!selectedLead.value) return
  const lead = selectedLead.value
  const info = [
    `Khách: ${lead.nickname || 'Unknown'} (@${lead.uniqueId || lead.unique_id || '?'})`,
    `Bình luận: "${lead.comment || lead.commentText || ''}"`,
    editProductIntent.value ? `Sản phẩm: ${editProductIntent.value}` : '',
    editNotes.value ? `Ghi chú: ${editNotes.value}` : '',
  ].filter(Boolean).join('\n')
  navigator.clipboard.writeText(info)
  showToast('📋 Đã copy thông tin khách hàng!', 'success')
}

async function fetchProducts() {
  try {
    let url = '/products'
    const res = await apiFetch(url)
    const data = await res.json()
    products.value = Array.isArray(data) ? data : (data.data || [])
  } catch { products.value = [] }
}

async function loadData() {
  await Promise.all([
    fetchLeads(),
    fetchLeadStats(),
    fetchProducts(),
  ])
}

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
  padding: 8px; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s;
}
.pipeline__refresh:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.pipeline__board {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
  padding: 0 24px 24px; flex: 1; overflow-y: auto;
}
.pipeline__column {
  display: flex; flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 14px; overflow: hidden;
  transition: border-color 0.25s, box-shadow 0.25s, background 0.25s;
}
.pipeline__column--drag-over {
  border-color: var(--color-primary, #7c3aed);
  box-shadow: 0 0 20px rgba(124, 58, 237, 0.2), inset 0 0 30px rgba(124, 58, 237, 0.04);
  background: rgba(124, 58, 237, 0.03);
}
.pipeline__col-header {
  display: flex; align-items: center; gap: 8px;
  padding: 14px 16px; font-size: 13px; font-weight: 700;
  border-bottom: 1px solid var(--color-border);
  border-left: 3px solid; background: var(--color-bg-elevated);
}
.pipeline__col-count {
  margin-left: auto; font-size: 11px; font-weight: 700;
  background: var(--color-bg-card-hover); padding: 3px 10px; border-radius: 12px;
}
.pipeline__col-body {
  flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;
}
.pipeline__card {
  background: var(--color-bg-secondary); border-radius: 10px;
  padding: 14px; cursor: grab; border: 1px solid var(--color-border);
  transition: all 0.25s;
}
.pipeline__card:active { cursor: grabbing; }
.pipeline__card:hover {
  border-color: var(--color-border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}
.pipeline__card--dragging {
  opacity: 0.35;
  transform: scale(0.96);
  box-shadow: none;
  border-style: dashed;
}
.pipeline__card--hot {
  border-left: 3px solid #ef4444;
  background: rgba(239,68,68,0.04);
}
.pipeline__card-label {
  display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
}
.pipeline__card-name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.pipeline__card-id { font-size: 11px; color: var(--color-text-muted); }
.pipeline__card-comment {
  font-size: 12px; color: var(--color-text-secondary); margin: 6px 0;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.5;
}
.pipeline__card-meta {
  display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--color-text-muted);
}
.pipeline__card-product {
  background: rgba(245,158,11,0.1); color: #fbbf24;
  padding: 2px 8px; border-radius: 6px; font-weight: 600;
}
.pipeline__card-zalo {
  display: inline-flex; align-items: center; gap: 3px;
  background: rgba(0,136,204,0.12); color: #0088cc;
  padding: 2px 8px; border-radius: 6px; font-weight: 600;
  text-decoration: none; font-size: 11px; transition: all 0.2s;
}
.pipeline__card-zalo:hover { background: rgba(0,136,204,0.25); }
.pipeline__card-actions {
  display: flex; gap: 4px; margin-top: 8px;
}
.pipeline__action-btn {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 6px; padding: 5px 8px; cursor: pointer;
  display: flex; align-items: center; font-size: 11px; transition: all 0.2s;
}
.pipeline__action-btn:hover { background: var(--color-bg-card-hover); border-color: var(--color-border-hover); }
.pipeline__empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px;
  color: var(--color-text-muted); font-size: 13px;
  border: 2px dashed var(--color-border); border-radius: 10px;
  transition: all 0.25s; gap: 8px; opacity: 0.6;
}
.pipeline__empty-icon { opacity: 0.5; }
.pipeline__empty--active {
  border-color: var(--color-primary, #7c3aed);
  background: rgba(124, 58, 237, 0.06);
  color: var(--color-primary, #7c3aed);
  font-style: normal; font-weight: 600;
}

/* Modal */
.pipeline__modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100;
  display: flex; align-items: center; justify-content: center;
  backdrop-filter: blur(4px);
}
.pipeline__modal {
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
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
  padding: 18px 22px; border-bottom: 1px solid var(--color-border);
}
.pipeline__modal-header h3 { font-size: 16px; font-weight: 800; }
.pipeline__modal-close {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 4px; transition: color 0.2s;
}
.pipeline__modal-close:hover { color: var(--color-text-primary); }
.pipeline__modal-body { padding: 22px; }
.pipeline__modal-info {
  display: flex; align-items: center; gap: 14px; margin-bottom: 18px;
}
.pipeline__modal-avatar {
  width: 48px; height: 48px; border-radius: 50%;
  background: rgba(124,58,237,0.1); display: flex; align-items: center; justify-content: center;
  color: #a78bfa;
}
.pipeline__modal-uid { font-size: 13px; color: var(--color-text-muted); }
.pipeline__modal-link {
  font-size: 12px; color: #a78bfa;
  display: flex; align-items: center; gap: 4px; text-decoration: none; margin-top: 4px;
  transition: color 0.2s;
}
.pipeline__modal-link:hover { color: #c4b5fd; }
.pipeline__modal-comment {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  padding: 14px; border-radius: 10px;
  margin-bottom: 18px;
}
.pipeline__modal-comment label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px; }
.pipeline__modal-comment p { font-size: 14px; color: var(--color-text-secondary); font-style: italic; }
.pipeline__modal-field { margin-bottom: 14px; }
.pipeline__modal-field label { font-size: 12px; font-weight: 700; display: block; margin-bottom: 6px; color: var(--color-text-secondary); }
.pipeline__modal-select, .pipeline__modal-input, .pipeline__modal-textarea {
  width: 100%; padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-primary); font-size: 13px; outline: none;
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
.pipeline__modal-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* CRM Product Picker */
.pipeline__modal-products { margin-top: 10px; }
.pipeline__modal-products > label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 8px; }
.pipeline__line-items { display: flex; flex-direction: column; gap: 6px; }
.pipeline__line-item {
  display: flex; align-items: center; gap: 6px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 6px 10px;
}
.pipeline__line-item:hover { border-color: var(--color-border-hover); }
.pipeline__prod-select {
  flex: 1; background: transparent; border: none;
  color: var(--color-text-primary); font-size: 12px;
  outline: none; font-family: inherit;
}
.pipeline__prod-select option { background: var(--color-bg-secondary); }
.pipeline__qty-group {
  display: flex; align-items: center; gap: 1px;
  background: var(--glass-bg); border-radius: 6px;
  border: 1px solid var(--color-border);
}
.pipeline__qty-btn {
  background: none; border: none; color: var(--color-text-secondary);
  width: 24px; height: 24px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
}
.pipeline__qty-btn:hover { color: var(--color-text-primary); }
.pipeline__qty-input {
  width: 30px; text-align: center; background: transparent;
  border: none; color: var(--color-text-primary);
  font-size: 12px; font-weight: 700; outline: none;
  -moz-appearance: textfield;
}
.pipeline__qty-input::-webkit-outer-spin-button,
.pipeline__qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pipeline__subtotal { font-size: 12px; font-weight: 800; color: #34d399; min-width: 80px; text-align: right; }
.pipeline__line-remove {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 2px;
}
.pipeline__line-remove:hover { color: #ef4444; }
.pipeline__add-prod {
  background: var(--glass-bg); border: 1px dashed var(--color-border);
  color: var(--color-text-secondary); padding: 6px 10px;
  border-radius: 8px; cursor: pointer; font-size: 11px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.pipeline__add-prod:hover { border-color: #7c3aed; color: #a78bfa; }
.pipeline__order-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 12px; border-radius: 8px; margin-top: 8px;
  background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02));
  border: 1px solid rgba(52,211,153,0.2);
}
.pipeline__order-total span:first-child { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); }
.pipeline__order-total-val { font-size: 18px; font-weight: 900; color: #34d399; }

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

