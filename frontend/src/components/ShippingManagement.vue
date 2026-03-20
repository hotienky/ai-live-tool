<template>
  <div class="shipping-management">
    <!-- Views -->
    <ShipmentForm v-if="viewMode === 'form'" :initial-order-id="orderLookupId" @back="viewMode = 'list'" @saved="onShipmentSaved" />
    <ShipmentDetail v-else-if="viewMode === 'detail'" :shipment-id="selectedShipmentId" @back="viewMode = 'list'" @updated="onShipmentSaved" />

    <div v-else class="shipping-list">
      <div class="ship-header">
        <h2><Truck :size="20" style="vertical-align:middle" /> {{ t('admin.msg_38d15714', 'Quản Lý Vận Chuyển') }}</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" :placeholder="t('admin.msg_30e675', '🔍 Tìm mã VĐ, người nhận...')" />
        <select v-model="filterStatus" class="filter-select">
          <option value="">{{ t('admin.msg_6869b8d8', 'Tất cả TT') }}</option>
          <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="filterCarrier" class="filter-select">
          <option value="">{{ t('admin.msg_81041910', 'Tất cả ĐVVC') }}</option>
          <option value="manual">{{ t('admin.msg_a794b260', 'Thủ công') }}</option>
          <option value="ghn">GHN</option>
          <option value="ghtk">GHTK</option>
          <option value="viettel_post">Viettel Post</option>
        </select>
        <button class="btn-add" @click="openCreateModal(null)"><Plus :size="14" /> {{ t('admin.msg_cbfa8f47', 'Tạo vận đơn') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="ship-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon--total"><Package :size="22" /></div>
        <div class="stat-value">{{ shipStats.total }}</div>
        <div class="stat-label">{{ t('admin.msg_a1d98b7d', 'Tổng vận đơn') }}</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-icon stat-icon--fee"><DollarSign :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(shipStats.totalFees) }}</div>
        <div class="stat-label">{{ t('admin.msg_58f93102', 'Tổng phí ship') }}</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon stat-icon--transit"><Truck :size="22" /></div>
        <div class="stat-value">{{ shipStats.statusCounts?.in_transit || 0 }}</div>
        <div class="stat-label">{{ t('admin.msg_6603a16a', 'Đang vận chuyển') }}</div>
      </div>
      <div class="stat-card" style="--accent-color: #34d399;">
        <div class="stat-icon stat-icon--delivered"><CheckCircle :size="22" /></div>
        <div class="stat-value" style="color:#34d399">{{ shipStats.statusCounts?.delivered || 0 }}</div>
        <div class="stat-label">{{ t('admin.delivered', 'Đã giao') }}</div>
      </div>
      <div class="stat-card" style="--accent-color: #60a5fa;">
        <div class="stat-icon stat-icon--rate"><TrendingUp :size="22" /></div>
        <div class="stat-value" style="color:#60a5fa">{{ deliveryRate }}%</div>
        <div class="stat-label">{{ t('admin.msg_0d33669f', 'Tỷ lệ giao TC') }}</div>
      </div>
    </div>

    <!-- Shipments Table -->
    <div class="ship-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{{ t('admin.msg_adb21d16', 'Đơn hàng') }}</th>
            <th>{{ t('admin.msg_6d8b1e4a', 'Người nhận') }}</th>
            <th>{{ t('admin.phone_short', 'SĐT') }}</th>
            <th>{{ t('admin.msg_bd277c59', 'ĐVVC') }}</th>
            <th>{{ t('admin.tracking_code', 'Mã vận đơn') }}</th>
            <th>{{ t('admin.msg_a06b5f8d', 'Phí ship') }}</th>
            <th>COD</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th>
            <th>{{ t('admin.created_at', 'Ngày tạo') }}</th>
            <th>{{ t('admin.actions', 'Hành động') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in displayedShipments" :key="s.id">
            <td>{{ s.id }}</td>
            <td>#{{ s.orderId || '—' }}</td>
            <td class="name-cell">{{ s.receiverName || '—' }}</td>
            <td>{{ s.receiverPhone || '—' }}</td>
            <td><span class="carrier-badge" :class="s.carrier">{{ carrierLabels[s.carrier] || s.carrier }}</span></td>
            <td class="tracking-code">{{ s.trackingCode || '—' }}</td>
            <td class="price">{{ formatCurrency(s.shippingFee) }}</td>
            <td class="price">{{ formatCurrency(s.codAmount) }}</td>
            <td>
              <span class="status-badge" :class="s.status">{{ statusLabels[s.status] || s.status }}</span>
            </td>
            <td>{{ formatDate(s.createdAt) }}</td>
            <td>
              <div class="action-btns">
                <button class="act-btn act-edit" @click="openDetail(s)"><RefreshCw :size="13" /> {{ t('admin.msg_0475320c', 'Chi tiết') }}</button>
                <button class="act-btn act-print" @click="printShipmentLabel(s)"><Printer :size="13" /> In</button>
                <button v-if="!['delivered','cancelled'].includes(s.status)" class="act-btn act-cancel" @click="cancelShipment(s)"><XCircle :size="13" /> {{ t('admin.msg_1e405035', 'Hủy') }}</button>
                <button v-if="s.status === 'draft'" class="act-btn act-cancel" @click="deleteShipment(s)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="displayedShipments.length === 0">
            <td colspan="11" class="empty">
              <div class="empty-state">
                <Truck :size="40" class="empty-state__icon" />
                <p class="empty-state__title">{{ t('admin.msg_af6b8aff', 'Chưa có vận đơn') }}</p>
                <p class="empty-state__sub">{{ t('admin.msg_1930d603', 'Tạo vận đơn mới từ đơn hàng hoặc thủ công') }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useSocket } from '../composables/useSocket.js'
import {
  Truck, Plus, Package, DollarSign, CheckCircle, RefreshCw,
  MapPin, Trash2, XCircle, Printer, TrendingUp
} from 'lucide-vue-next'
import ShipmentForm from './ShipmentForm.vue'
import ShipmentDetail from './ShipmentDetail.vue'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const props = defineProps({ /* tenant-scoped */ })
const emit = defineEmits(['navigate'])

const shipments = ref([])
const shipStats = ref({ total: 0, totalFees: 0, statusCounts: {} })
const searchTerm = ref('')
const filterStatus = useUrlParam('ship_status', '')
const filterCarrier = useUrlParam('ship_carrier', '')

const viewMode = ref('list')
const selectedShipmentId = ref(null)
const orderLookupId = ref(null)

const statusLabels = {
  draft: t('admin.msg_867cf3b9', 'Nháp'),
  pending: t('admin.msg_48b30936', 'Chờ lấy'),
  picked_up: t('admin.msg_77c36744', 'Đã lấy'),
  in_transit: t('admin.msg_eea9a1cc', 'Đang chuyển'),
  out_for_delivery: t('admin.msg_e61e15e1', 'Đang giao'),
  delivered: t('admin.msg_fb72b8a4', 'Đã giao'),
  returned: t('admin.msg_b398bb99', 'Hoàn hàng'),
  cancelled: t('admin.msg_1a46e024', 'Đã hủy'),
}

const carrierLabels = { manual: t('admin.msg_a794b260', 'Thủ công'), ghn: 'GHN', ghtk: 'GHTK', viettel_post: 'Viettel Post' }

const deliveryRate = computed(() => {
  const total = shipStats.value.total || 0
  const delivered = shipStats.value.statusCounts?.delivered || 0
  if (total === 0) return 0
  return ((delivered / total) * 100).toFixed(1)
})

const displayedShipments = computed(() => {
  if (!searchTerm.value) return shipments.value
  const s = searchTerm.value.toLowerCase()
  return shipments.value.filter(sh =>
    (sh.receiverName || '').toLowerCase().includes(s) ||
    (sh.receiverPhone || '').includes(s) ||
    (sh.trackingCode || '').toLowerCase().includes(s) ||
    String(sh.id).includes(s)
  )
})

onMounted(() => { fetchShipments(); fetchStats(); setupSocketListeners() })
watch([filterStatus, filterCarrier], () => fetchShipments())

// Socket auto-refresh for shipment events
function setupSocketListeners() {
  try {
    const { socket } = useSocket()
    if (socket?.value) {
      socket.value.on('shipment_updated', () => { fetchShipments(); fetchStats() })
      socket.value.on('shipment_created', () => { fetchShipments(); fetchStats() })
    }
  } catch { /* socket not available */ }
}

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

async function fetchShipments() {
  try {
    let url = `/shipments?`
    if (filterStatus.value) url += `status=${filterStatus.value}&`
    if (filterCarrier.value) url += `carrier=${filterCarrier.value}&`
    const res = await apiFetch(url)
    const raw = await res.json()
    shipments.value = Array.isArray(raw) ? raw.map(mapKeys) : []
  } catch { shipments.value = [] }
}

async function fetchStats() {
  try {
    let url = `/shipments/stats`
    const res = await apiFetch(url)
    shipStats.value = await res.json()
  } catch { /* silent */ }
}

function openCreateModal(orderId) {
  orderLookupId.value = orderId || null
  viewMode.value = 'form'
}

function openDetail(shipment) {
  selectedShipmentId.value = shipment.id
  viewMode.value = 'detail'
}

function onShipmentSaved() {
  viewMode.value = 'list'
  fetchShipments()
  fetchStats()
}

async function cancelShipment(s) {
  if (!confirm(`${t('admin.msg_a9eae200', 'Hủy vận đơn')} #${s.id}?`)) return
  try {
    await apiFetch(`/shipments/${s.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', description: t('admin.msg_a9eae200', 'Hủy vận đơn') }),
    })
    showToast(t('admin.msg_f31f2c', 'Đã hủy vận đơn'), 'success')
    fetchShipments()
    fetchStats()
  } catch { showToast(t('admin.msg_0859ac', 'Lỗi hủy vận đơn'), 'error') }
}

async function deleteShipment(s) {
  if (!confirm(`${t('admin.delete', 'Xóa')} ${t('admin.msg_b7782058', 'vận đơn')} #${s.id}?`)) return
  try {
    await apiFetch(`/shipments/${s.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_776619', 'Đã xóa vận đơn'), 'success')
    fetchShipments()
    fetchStats()
  } catch { showToast(t('admin.msg_3f456e', 'Lỗi xóa vận đơn'), 'error') }
}

function printShipmentLabel(s) {
  if (!s) return
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`<!DOCTYPE html><html><head><title>${t('admin.msg_711f1b8c', 'Phiếu gửi hàng')} #${s.id}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',sans-serif; padding:20px; font-size:13px; }
      .header { text-align:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:12px; }
      .header h1 { font-size:18px; text-transform:uppercase; }
      .header p { font-size:11px; color:#666; }
      .section { margin-bottom:14px; }
      .section-title { font-weight:700; font-size:12px; text-transform:uppercase; margin-bottom:6px; border-bottom:1px dashed #ccc; padding-bottom:4px; }
      .row { display:flex; justify-content:space-between; margin-bottom:3px; }
      .row .label { color:#666; }
      .row .value { font-weight:600; text-align:right; max-width:60%; }
      .barcode { text-align:center; margin:16px 0; font-family:monospace; font-size:20px; letter-spacing:3px; }
      .footer { text-align:center; border-top:1px solid #ccc; padding-top:10px; font-size:10px; color:#999; margin-top:16px; }
      @media print { body { padding:10px; } }
    </style>
  </head><body>
    <div class="header">
      <h1>${t('admin.msg_70fe94d4', 'Phiếu Gửi Hàng')}</h1>
      <p>${carrierLabels[s.carrier] || s.carrier} — ${new Date().toLocaleDateString('vi-VN')}</p>
    </div>
    <div class="barcode">${s.trackingCode || `VD-${String(s.id).padStart(6,'0')}`}</div>
    <div class="section">
      <div class="section-title">${t('admin.msg_0c86fe9c', 'Người gửi')}</div>
      <div class="row"><span class="label">${t('admin.msg_6b8e0206', 'Tên:')}</span><span class="value">${s.senderName || 'Shop'}</span></div>
      <div class="row"><span class="label">{{ t('admin.msg_c60e8c30', 'SĐT:') }}</span><span class="value">${s.senderPhone || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">{{ t('admin.msg_6d8b1e4a', 'Người nhận') }}</div>
      <div class="row"><span class="label">${t('admin.msg_6b8e0206', 'Tên:')}</span><span class="value">${s.receiverName || '—'}</span></div>
      <div class="row"><span class="label">{{ t('admin.msg_c60e8c30', 'SĐT:') }}</span><span class="value">${s.receiverPhone || '—'}</span></div>
      <div class="row"><span class="label">{{ t('admin.msg_ce467846', 'Địa chỉ:') }}</span><span class="value">${s.receiverAddress || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">${t('admin.msg_870fc8a4', 'Thông tin gói hàng')}</div>
      <div class="row"><span class="label">{{ t('admin.msg_40a72f9d', 'Khối lượng:') }}</span><span class="value">${s.weight || 500}g</span></div>
      <div class="row"><span class="label">{{ t('admin.msg_40d8de95', 'Phí ship:') }}</span><span class="value">${formatCurrency(s.shippingFee || 0)}</span></div>
      <div class="row"><span class="label">COD:</span><span class="value">${formatCurrency(s.codAmount || 0)}</span></div>
    </div>
    ${s.notes ? `<div class="section"><div class="section-title">{{ t('admin.notes', 'Ghi chú') }}</div><p>${s.notes}</p></div>` : ''}
    <div class="footer">In lúc ${new Date().toLocaleString('vi-VN')} — AI Live Tool</div>
  </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

// Expose for parent to call (from OrderManagement)
defineExpose({ openCreateModal })

// formatCurrency provided by useI18n
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.shipping-management { padding: 24px; overflow-y: auto; height: 100%; }
.ship-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.ship-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; min-width: 180px; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-accent-primary); }
.search-input::placeholder { color: var(--color-text-muted); }
.filter-select {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
}
.filter-select:focus { border-color: var(--color-accent-primary); }
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-add {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-add:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }

/* Stats */
.ship-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 18px; text-align: center;
  position: relative; overflow: hidden; transition: all 0.3s;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; opacity: 0.6;
}
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); box-shadow: var(--shadow-card); }
.stat-value { font-size: 24px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; letter-spacing: 0.3px; }
.stat-card.revenue .stat-value { color: #34d399; }
.stat-card.revenue::before { background: linear-gradient(90deg, transparent, #34d399, transparent); }
.stat-card.warning .stat-value { color: #fbbf24; }
.stat-card.warning::before { background: linear-gradient(90deg, transparent, #fbbf24, transparent); }
.stat-icon {
  width: 40px; height: 40px; border-radius: 10px; display: flex;
  align-items: center; justify-content: center; margin: 0 auto 8px;
}
.stat-icon--total { background: var(--color-accent-glow); color: var(--accent-light); }
.stat-icon--fee { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--transit { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-icon--delivered { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--rate { background: rgba(96,165,250,0.12); color: #60a5fa; }

/* Table */
.ship-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th {
  padding: 12px 14px; text-align: left; color: var(--color-text-muted);
  font-weight: 700; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.name-cell { font-weight: 600; }
.tracking-code { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--accent-light); }
.price { font-weight: 700; color: #34d399; }

.carrier-badge {
  padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.carrier-badge.manual { background: rgba(148,163,184,0.1); color: #94a3b8; }
.carrier-badge.ghn { background: rgba(245,158,11,0.1); color: #f59e0b; }
.carrier-badge.ghtk { background: rgba(52,211,153,0.1); color: #34d399; }
.carrier-badge.viettel_post { background: rgba(239,68,68,0.1); color: #ef4444; }

.status-badge {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
}
.status-badge.draft { background: rgba(148,163,184,0.1); color: #94a3b8; }
.status-badge.pending { background: rgba(245,158,11,0.1); color: #fbbf24; }
.status-badge.picked_up { background: rgba(59,130,246,0.1); color: #60a5fa; }
.status-badge.in_transit { background: rgba(168,85,247,0.1); color: #c4b5fd; }
.status-badge.out_for_delivery { background: rgba(251,191,36,0.1); color: #fbbf24; }
.status-badge.delivered { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.returned { background: rgba(239,68,68,0.1); color: #fca5a5; }
.status-badge.cancelled { background: rgba(239,68,68,0.1); color: #f87171; }

.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }

.empty { text-align: center; color: var(--color-text-muted); padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* Modals */
/* Removed local modal styles as form is now a page view */
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
/* The following styles are kept as they might be used by other components or general form elements */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px;
  font-family: inherit; box-sizing: border-box; outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-accent-primary); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel {
  background: var(--color-bg-card-solid); color: var(--color-text-secondary); border: 1px solid var(--color-border);
  padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.btn-create {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-create:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-secondary-action {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 16px; border-radius: 10px;
  font-weight: 600; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-secondary-action:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

/* Step indicator */
.step-indicator {
  display: flex; align-items: center; justify-content: center; gap: 0;
  margin-bottom: 24px; padding: 16px 0;
}
.step {
  display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  color: var(--color-text-muted); transition: all 0.3s;
}
.step span {
  width: 24px; height: 24px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 11px; font-weight: 800;
  border: 2px solid var(--glass-border); background: var(--glass-bg); transition: all 0.3s;
}
.step.active { color: var(--accent-light); }
.step.active span { background: var(--accent-gradient); color: #fff; border-color: transparent; }
.step.done span { background: #34d399; color: #fff; border-color: transparent; }
.step.done { color: #34d399; }
.step-line { width: 40px; height: 2px; background: var(--glass-border); margin: 0 8px; }

/* Order lookup */
.order-lookup { display: flex; gap: 8px; }
.order-lookup input { flex: 1; }
.btn-lookup {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 16px; border-radius: 10px;
  font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-lookup:hover:not(:disabled) { border-color: var(--color-accent-primary); color: var(--color-text-primary); }
.btn-lookup:disabled { opacity: 0.4; cursor: not-allowed; }
.order-found {
  margin-top: 10px; padding: 10px 14px; border-radius: 10px;
  background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.15);
  display: flex; align-items: center; gap: 8px; font-size: 13px; flex-wrap: wrap;
}
.btn-fill {
  margin-left: auto; background: linear-gradient(135deg, #34d399, #059669); color: #fff;
  border: none; padding: 5px 12px; border-radius: 8px; font-size: 11px;
  font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-fill:hover { transform: scale(1.02); }

/* Carrier selector */
.carrier-selector { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.carrier-card {
  padding: 16px; border-radius: 12px; cursor: pointer; text-align: center;
  background: var(--glass-bg); border: 2px solid var(--glass-border); transition: all 0.2s;
}
.carrier-card:hover { border-color: var(--color-border-hover); }
.carrier-card.selected {
  border-color: var(--color-accent-primary); background: var(--color-accent-glow);
  box-shadow: var(--accent-shadow);
}
.carrier-card__icon { color: var(--color-text-muted); margin-bottom: 6px; }
.carrier-card.selected .carrier-card__icon { color: var(--accent-light); }
.carrier-card__name { font-weight: 800; font-size: 14px; }
.carrier-card__desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

/* Confirm summary */
.confirm-summary { padding: 16px; border-radius: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border); }
.confirm-summary h4 { margin: 0 0 14px 0; font-weight: 800; font-size: 14px; }
.confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.confirm-item { font-size: 13px; }
.confirm-item.span-2 { grid-column: span 2; }
.confirm-item span { color: var(--color-text-muted); display: block; font-size: 11px; margin-bottom: 2px; }
.confirm-item strong { color: var(--color-text-primary); }
.confirm-item strong.price { color: #34d399; }

/* Status flow buttons */
.status-flow { display: flex; flex-wrap: wrap; gap: 8px; }
.status-flow__btn {
  padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.2s;
}
.status-flow__btn.current { border-color: var(--accent-light); color: var(--accent-light); }
.status-flow__btn.active {
  background: var(--accent-gradient); color: #fff;
  border-color: transparent; box-shadow: var(--accent-shadow);
}

/* Tracking info + timeline */
.tracking-info {
  margin-bottom: 16px; padding: 14px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.tracking-info__row { font-size: 13px; margin-bottom: 4px; }
.tracking-timeline { max-height: 400px; overflow-y: auto; }
.tracking-item {
  display: flex; gap: 14px; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tracking-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.tracking-dot.draft { background: #94a3b8; }
.tracking-dot.pending { background: #fbbf24; }
.tracking-dot.picked_up { background: #60a5fa; }
.tracking-dot.in_transit { background: var(--accent-light); }
.tracking-dot.out_for_delivery { background: #fbbf24; }
.tracking-dot.delivered { background: #34d399; }
.tracking-dot.returned, .tracking-dot.cancelled { background: #f87171; }
.tracking-content { flex: 1; min-width: 0; }
.tracking-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tracking-badge {
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.tracking-badge.draft { background: rgba(148,163,184,0.1); color: #94a3b8; }
.tracking-badge.pending { background: rgba(245,158,11,0.1); color: #fbbf24; }
.tracking-badge.picked_up { background: rgba(59,130,246,0.1); color: #60a5fa; }
.tracking-badge.in_transit { background: rgba(168,85,247,0.1); color: #c4b5fd; }
.tracking-badge.out_for_delivery { background: rgba(251,191,36,0.1); color: #fbbf24; }
.tracking-badge.delivered { background: rgba(52,211,153,0.1); color: #34d399; }
.tracking-badge.returned, .tracking-badge.cancelled { background: rgba(239,68,68,0.1); color: #f87171; }
.tracking-source { font-size: 10px; color: var(--color-text-muted); font-style: italic; }
.tracking-desc { font-size: 12px; color: var(--color-text-secondary); }
.tracking-loc { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.tracking-time { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }
</style>
