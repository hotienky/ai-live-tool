<template>
  <!-- Form view -->
  <PurchaseOrderForm v-if="viewMode === 'form'" :editId="editId" @saved="onFormSaved" @back="viewMode = 'list'" />
  <!-- Detail view -->
  <PurchaseOrderDetail v-else-if="viewMode === 'detail'" :editId="detailId" @back="viewMode = 'list'" @refresh="fetchOrders" />
  <!-- List view -->
  <div v-else class="po-mgr">
    <div class="po-header">
      <h2><ShoppingCart :size="20" style="vertical-align:middle" /> {{ t('admin.msg_b01962ee', 'Đơn Nhập Hàng') }}</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" :placeholder="t('admin.msg_8e2a27', 'Tìm mã PO, ghi chú...')" @input="debouncedSearch" />
        <select v-model="filterStatus" class="filter-select">
          <option value="">{{ t('admin.msg_6869b8d8', 'Tất cả TT') }}</option>
          <option value="draft">{{ t('admin.msg_867cf3b9', 'Nháp') }}</option>
          <option value="ordered">{{ t('admin.msg_e9b9aa84', 'Đã đặt') }}</option>
          <option value="partial">{{ t('admin.msg_da42ebfc', 'Nhận 1 phần') }}</option>
          <option value="received">{{ t('admin.msg_e2bd2937', 'Đã nhận') }}</option>
          <option value="cancelled">{{ t('admin.msg_1a46e024', 'Đã hủy') }}</option>
        </select>
        <button class="btn-primary" @click="openCreate"><Plus :size="14" /> {{ t('admin.msg_23275279', 'Tạo đơn') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="po-stats">
      <div class="stat-card"><div class="stat-icon"><ShoppingCart :size="20" /></div><div class="stat-value">{{ poStats.total_orders || 0 }}</div><div class="stat-label">{{ t('admin.msg_cf198bf6', 'Tổng đơn') }}</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--green"><DollarSign :size="20" /></div><div class="stat-value">{{ formatCurrency(poStats.total_value || 0) }}</div><div class="stat-label">{{ t('admin.msg_b71668e4', 'Tổng giá trị') }}</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--warn"><Clock :size="20" /></div><div class="stat-value">{{ poStats.pending || 0 }}</div><div class="stat-label">{{ t('admin.msg_2bfffc09', 'Đang chờ') }}</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--red"><AlertCircle :size="20" /></div><div class="stat-value">{{ poStats.unpaid || 0 }}</div><div class="stat-label">{{ t('admin.msg_956718c7', 'Chưa thanh toán') }}</div></div>
    </div>

    <!-- Table -->
    <div class="po-table">
      <table>
        <thead>
          <tr>
            <th>{{ t('admin.msg_177be34e', 'Mã PO') }}</th><th>{{ t('admin.supplier', 'Nhà cung cấp') }}</th><th>SP</th><th>{{ t('admin.msg_d0a16ea2', 'Tổng tiền') }}</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th><th>{{ t('admin.msg_d555e4bc', 'Thanh toán') }}</th><th>{{ t('admin.msg_6f83adc9', 'Ngày đặt') }}</th><th>{{ t('admin.msg_610dee1b', 'Ngày nhận dự kiến') }}</th><th>{{ t('admin.msg_71d52075', 'Thao tác') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="po in orders" :key="po.id">
            <td class="mono">{{ po.po_number }}</td>
            <td>{{ po.supplier?.name || '—' }}</td>
            <td>{{ (po.items || []).length }} SP</td>
            <td class="amount">{{ formatCurrency(po.total_amount) }}</td>
            <td><span class="status-badge" :class="po.status">{{ statusLabel(po.status) }}</span></td>
            <td><span class="pay-badge" :class="po.payment_status">{{ payLabel(po.payment_status) }}</span></td>
            <td class="date">{{ formatDate(po.order_date) }}</td>
            <td class="date">{{ formatDate(po.expected_date) }}</td>
            <td>
              <div class="action-btns">
                <button class="act-btn act-view" @click="viewPO(po)"><Eye :size="13" /> Xem</button>
                <button v-if="po.status === 'draft'" class="act-btn act-send" @click="sendPO(po)"><Send :size="13" /> {{ t('admin.msg_f15a8810', 'Đặt hàng') }}</button>
                <button v-if="['ordered','partial'].includes(po.status)" class="act-btn act-confirm" @click="openReceive(po)"><PackageCheck :size="13" /> {{ t('admin.msg_9a66ac4c', 'Nhận hàng') }}</button>
                <button v-if="po.status !== 'received' && po.status !== 'cancelled'" class="act-btn act-cancel" @click="cancelPO(po)"><X :size="13" /> {{ t('admin.msg_1e405035', 'Hủy') }}</button>
                <button v-if="po.status === 'draft'" class="act-btn act-cancel" @click="deletePO(po)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="9" class="empty"><div class="empty-state"><ShoppingCart :size="40" class="empty-state__icon" /><p class="empty-state__title">{{ t('admin.msg_258ce7bb', 'Chưa có Đơn Nhập Hàng') }}</p></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.last_page > 1">
      <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage <= 1" class="page-btn"><ChevronLeft :size="14" /></button>
      <span class="page-info">{{ currentPage }} / {{ pagination.last_page }}</span>
      <button @click="currentPage = Math.min(pagination.last_page, currentPage + 1)" :disabled="currentPage >= pagination.last_page" class="page-btn"><ChevronRight :size="14" /></button>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import {
  ShoppingCart, Plus, Eye, Send, PackageCheck, X, Trash2, DollarSign,
  Clock, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-vue-next'
import PurchaseOrderForm from './PurchaseOrderForm.vue'
import PurchaseOrderDetail from './PurchaseOrderDetail.vue'

const { t } = useI18n()
const { showToast } = useToast()

const orders = ref([])
const pagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1 })
const poStats = ref({})
const suppliers = ref([])
const searchTerm = ref('')
const filterStatus = ref('')
const currentPage = ref(1)

// View state: 'list' | 'form' | 'detail'
const viewMode = ref('list')
const editId = ref(null)
const detailId = ref(null)

function statusLabel(s) {
  return { draft: t('admin.msg_867cf3b9', 'Nháp'), ordered: t('admin.msg_e9b9aa84', 'Đã đặt'), partial: t('admin.msg_da42ebfc', 'Nhận 1 phần'), received: t('admin.msg_e2bd2937', 'Đã nhận'), cancelled: t('admin.msg_1a46e024', 'Đã hủy') }[s] || s
}
function payLabel(p) {
  return { unpaid: t('admin.msg_e8a83705', 'Chưa TT'), partial: t('admin.msg_ee9c77ad', 'TT 1 phần'), paid: t('admin.msg_04b5eaed', 'Đã TT') }[p] || p
}

onMounted(() => { fetchOrders(); fetchStats(); fetchSuppliers() })
watch([filterStatus, currentPage], fetchOrders)

let timer = null
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(() => { currentPage.value = 1; fetchOrders() }, 300)
}

async function fetchOrders() {
  try {
    let url = `/purchase-orders?page=${currentPage.value}&per_page=20`
    if (filterStatus.value) url += `&status=${filterStatus.value}`
    if (searchTerm.value) url += `&search=${searchTerm.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    orders.value = data.data?.items || data.items || []
    pagination.value = data.data?.pagination || data.pagination || pagination.value
  } catch { orders.value = [] }
}

async function fetchStats() {
  try {
    const res = await apiFetch('/purchase-orders/stats')
    const data = await res.json()
    poStats.value = data.data || data
  } catch { /* silent */ }
}

async function fetchSuppliers() {
  try {
    const res = await apiFetch('/suppliers?active_only=true')
    const data = await res.json()
    suppliers.value = data.data || data || []
  } catch { suppliers.value = [] }
}

function openCreate() {
  editId.value = null
  viewMode.value = 'form'
}

function onFormSaved() {
  viewMode.value = 'list'
  fetchOrders()
  fetchStats()
}

function viewPO(po) {
  detailId.value = po.id
  viewMode.value = 'detail'
}

async function sendPO(po) {
  if (!confirm(`Đặt hàng ${po.po_number} — chuyển sang trạng thái t('admin.msg_e9b9aa84', "Đã đặt")?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}/send`, { method: 'POST' })
    showToast(t('admin.msg_52aec4', 'Đã chuyển sang Đã đặt'), 'success')
    fetchOrders(); fetchStats()
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}


async function cancelPO(po) {
  if (!confirm(`Hủy đơn ${po.po_number}?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}/cancel`, { method: 'POST' })
    showToast(t('admin.msg_1a46e0', 'Đã hủy'), 'success')
    fetchOrders(); fetchStats()
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}

async function deletePO(po) {
  if (!confirm(`${t('admin.delete', 'Xóa')} đơn ${po.po_number}?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
    fetchOrders(); fetchStats()
  } catch { showToast(t('admin.msg_9e5d62', 'Lỗi xóa'), 'error') }
}

function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
</script>

<style scoped>
.po-mgr { padding: 24px; overflow-y: auto; height: 100%; }
.po-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.po-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-width: 180px; outline: none; }
.search-input:focus { border-color: var(--color-accent-primary); }
.filter-select { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; outline: none; }
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: var(--accent-shadow); }

.po-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 24px; }
.stat-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px; padding: 20px; text-align: center; transition: all 0.3s; }
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; background: var(--color-accent-glow); color: var(--accent-light); }
.stat-icon--green { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--warn { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-icon--red { background: rgba(248,113,113,0.12); color: #f87171; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; }

.po-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th { padding: 12px 14px; text-align: left; color: var(--color-text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.mono { font-family: monospace; font-weight: 700; font-size: 12px; }
.amount { font-weight: 700; color: #34d399; }
.date { font-size: 12px; color: var(--color-text-muted); }
.sku { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }

.status-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.status-badge.draft { background: rgba(251,191,36,0.1); color: #fbbf24; }
.status-badge.ordered { background: rgba(96,165,250,0.1); color: #60a5fa; }
.status-badge.partial { background: rgba(245,158,11,0.1); color: #f59e0b; }
.status-badge.received { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.cancelled { background: rgba(248,113,113,0.1); color: #f87171; }

.pay-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.pay-badge.unpaid { background: rgba(248,113,113,0.08); color: #f87171; }
.pay-badge.partial { background: rgba(251,191,36,0.08); color: #fbbf24; }
.pay-badge.paid { background: rgba(52,211,153,0.08); color: #34d399; }

.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }

.empty { text-align: center; padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }

.pagination { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 16px; }
.page-btn { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); border-radius: 8px; padding: 6px 10px; cursor: pointer; display: flex; align-items: center; }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--color-text-secondary); font-weight: 600; }

</style>
