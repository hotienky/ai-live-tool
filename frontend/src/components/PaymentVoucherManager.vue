<template>
  <!-- Form view -->
  <PaymentVoucherForm v-if="showForm" :initialType="formType" @saved="onSaved" @back="showForm = false" />
  <!-- List view -->
  <div v-else class="pv-mgr">
    <div class="pv-header">
      <h2><Wallet :size="20" style="vertical-align:middle" /> {{ t('admin.msg_9d24fa83', 'Phiếu Thu / Chi') }}</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" :placeholder="t('admin.msg_ba3e0e', 'Tìm mã phiếu, đối tác...')" @input="debouncedSearch" />
        <select v-model="filterType" class="filter-select">
          <option value="">{{ t('admin.all', 'Tất cả') }}</option>
          <option value="receipt">{{ t('admin.receipt_voucher', 'Phiếu thu') }}</option>
          <option value="payment">{{ t('admin.payment_voucher', 'Phiếu chi') }}</option>
        </select>
        <button class="btn-primary" @click="openCreate('receipt')"><Plus :size="14" /> {{ t('admin.msg_7d965eb8', 'Phiếu thu') }}</button>
        <button class="btn-secondary" @click="openCreate('payment')"><Minus :size="14" /> {{ t('admin.msg_9d0ac9ed', 'Phiếu chi') }}</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="pv-stats">
      <div class="stat-card income">
        <div class="stat-icon"><ArrowDownToLine :size="20" /></div>
        <div class="stat-value">{{ formatCurrency(pvStats.total_receipts || 0) }}</div>
        <div class="stat-label">Tổng thu ({{ pvStats.receipt_count || 0 }} phiếu)</div>
      </div>
      <div class="stat-card expense">
        <div class="stat-icon stat-icon--red"><ArrowUpFromLine :size="20" /></div>
        <div class="stat-value">{{ formatCurrency(pvStats.total_payments || 0) }}</div>
        <div class="stat-label">Tổng chi ({{ pvStats.payment_count || 0 }} phiếu)</div>
      </div>
      <div class="stat-card net">
        <div class="stat-icon stat-icon--blue"><Scale :size="20" /></div>
        <div class="stat-value" :class="netAmount >= 0 ? 'positive' : 'negative'">{{ formatCurrency(netAmount) }}</div>
        <div class="stat-label">{{ t('admin.msg_3629b20a', 'Chênh lệch') }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--warn"><FileText :size="20" /></div>
        <div class="stat-value">{{ pvStats.pending_drafts || 0 }}</div>
        <div class="stat-label">{{ t('admin.msg_d17e885a', 'Phiếu nháp') }}</div>
      </div>
    </div>

    <!-- Table -->
    <div class="pv-table">
      <table>
        <thead>
          <tr>
            <th>{{ t('admin.msg_86e59d7e', 'Mã phiếu') }}</th><th>{{ t('admin.type', 'Loại') }}</th><th>{{ t('admin.msg_03255a94', 'Đối tác') }}</th><th>{{ t('admin.msg_53d8de58', 'Danh mục') }}</th>
            <th>{{ t('admin.msg_8cde2607', 'Số tiền') }}</th><th>{{ t('admin.msg_38fa9e3f', 'PT thanh toán') }}</th><th>{{ t('admin.status', 'Trạng thái') }}</th><th>{{ t('admin.msg_b9474a12', 'Ngày') }}</th><th>{{ t('admin.msg_71d52075', 'Thao tác') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vouchers" :key="v.id">
            <td class="mono">{{ v.voucher_number }}</td>
            <td><span class="type-badge" :class="v.type">{{ v.type === 'receipt' ? 'Thu' : 'Chi' }}</span></td>
            <td>{{ v.counterparty || '—' }}</td>
            <td>{{ v.category }}</td>
            <td class="amount" :class="v.type === 'receipt' ? 'positive' : 'negative'">
              {{ v.type === 'receipt' ? '+' : '-' }}{{ formatCurrency(v.amount) }}
            </td>
            <td>{{ paymentMethodLabel(v.payment_method) }}</td>
            <td><span class="status-badge" :class="v.status">{{ statusLabel(v.status) }}</span></td>
            <td class="date">{{ formatDate(v.voucher_date) }}</td>
            <td>
              <div class="action-btns">
                <button v-if="v.status === 'draft'" class="act-btn act-confirm" @click="confirmVoucher(v)"><Check :size="13" /> {{ t('admin.msg_1e2eb2de', 'Xác nhận') }}</button>
                <button v-if="v.status !== 'cancelled'" class="act-btn act-cancel" @click="cancelVoucher(v)"><X :size="13" /> {{ t('admin.msg_1e405035', 'Hủy') }}</button>
                <button v-if="v.status === 'draft'" class="act-btn act-cancel" @click="deleteVoucher(v)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="vouchers.length === 0">
            <td colspan="9" class="empty"><div class="empty-state"><Wallet :size="40" class="empty-state__icon" /><p class="empty-state__title">{{ t('admin.msg_a9fa97a4', 'Chưa có phiếu thu/chi') }}</p></div></td>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Wallet, Plus, Minus, Check, X, Trash2,
  ArrowDownToLine, ArrowUpFromLine, Scale, FileText,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next'
import PaymentVoucherForm from './PaymentVoucherForm.vue'

const { t } = useI18n()
const { showToast } = useToast()

const vouchers = ref([])
const pagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1 })
const pvStats = ref({})
const searchTerm = ref('')
const filterType = ref('')
const currentPage = ref(1)
const showForm = ref(false)
const formType = ref('receipt')

const categories = [
  t('admin.msg_59471fe2', 'Tiền hàng'), t('admin.msg_76776039', 'Vận chuyển'), 'Marketing', t('admin.msg_0931b128', 'Lương'), t('admin.msg_9a2b203a', 'Thuê mặt bằng'),
  t('admin.msg_e8a642ef', 'Điện nước'), t('admin.msg_07123c29', 'Dụng cụ'), t('admin.msg_faf5c20b', 'Sửa chữa'), t('admin.msg_94280c8b', 'Hoàn trả'), t('admin.msg_06c1f85a', 'Khác'),
]

const form = ref({
  type: 'receipt', amount: 0, category: t('admin.msg_59471fe2', 'Tiền hàng'),
  description: '', payment_method: 'cash', counterparty: '',
  voucher_date: new Date().toISOString().split('T')[0],
})

const netAmount = computed(() => (pvStats.value.total_receipts || 0) - (pvStats.value.total_payments || 0))

function statusLabel(s) { return { draft: t('admin.msg_867cf3b9', 'Nháp'), confirmed: t('admin.msg_c6de124c', 'Đã xác nhận'), cancelled: t('admin.msg_1a46e024', 'Đã hủy') }[s] || s }
function paymentMethodLabel(m) { return { cash: t('admin.msg_047caf53', 'Tiền mặt'), bank: 'CK', wallet: t('admin.msg_2bc16e2a', 'Ví'), other: t('admin.msg_06c1f85a', 'Khác') }[m] || m }

onMounted(() => { fetchVouchers(); fetchStats() })
watch([filterType, currentPage], fetchVouchers)

let timer = null
function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(() => { currentPage.value = 1; fetchVouchers() }, 300)
}

async function fetchVouchers() {
  try {
    let url = `/payment-vouchers?page=${currentPage.value}&per_page=20`
    if (filterType.value) url += `&type=${filterType.value}`
    if (searchTerm.value) url += `&search=${searchTerm.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    vouchers.value = data.data?.items || data.items || []
    pagination.value = data.data?.pagination || data.pagination || pagination.value
  } catch { vouchers.value = [] }
}

async function fetchStats() {
  try {
    const res = await apiFetch('/payment-vouchers/stats')
    const data = await res.json()
    pvStats.value = data.data || data
  } catch { /* silent */ }
}

function openCreate(type) {
  formType.value = type
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  fetchVouchers()
  fetchStats()
}

async function confirmVoucher(v) {
  if (!confirm(`Xác nhận phiếu ${v.voucher_number}?`)) return
  try {
    await apiFetch(`/payment-vouchers/${v.id}/confirm`, { method: 'POST' })
    showToast(t('admin.msg_795e66', 'Đã xác nhận — Bút toán đã tạo'), 'success')
    fetchVouchers(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function cancelVoucher(v) {
  if (!confirm(`Hủy phiếu ${v.voucher_number}?`)) return
  try {
    await apiFetch(`/payment-vouchers/${v.id}/cancel`, { method: 'POST' })
    showToast(t('admin.msg_1a46e0', 'Đã hủy'), 'success')
    fetchVouchers(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function deleteVoucher(v) {
  if (!confirm(`Xóa phiếu ${v.voucher_number}?`)) return
  try {
    await apiFetch(`/payment-vouchers/${v.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
    fetchVouchers(); fetchStats()
  } catch { showToast(t('admin.msg_9e5d62', 'Lỗi xóa'), 'error') }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<style scoped>
.pv-mgr { padding: 24px; overflow-y: auto; height: 100%; }
.pv-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.pv-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-width: 180px; outline: none; }
.filter-select { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; outline: none; }
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; box-shadow: var(--accent-shadow); }
.btn-secondary { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-secondary); padding: 10px 14px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }

.pv-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 14px; margin-bottom: 24px; }
.stat-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px; padding: 20px; text-align: center; transition: all 0.3s; }
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); }
.stat-card.income .stat-value { color: #34d399; }
.stat-card.expense .stat-value { color: #f87171; }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--red { background: rgba(248,113,113,0.12); color: #f87171; }
.stat-icon--blue { background: rgba(96,165,250,0.12); color: #60a5fa; }
.stat-icon--warn { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-value { font-size: 22px; font-weight: 800; color: var(--color-text-primary); }
.stat-value.positive { color: #34d399; }
.stat-value.negative { color: #f87171; }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; }

.pv-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th { padding: 12px 14px; text-align: left; color: var(--color-text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.mono { font-family: monospace; font-weight: 700; font-size: 12px; }
.amount { font-weight: 700; }
.amount.positive { color: #34d399; }
.amount.negative { color: #f87171; }
.date { font-size: 12px; color: var(--color-text-muted); }

.type-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.type-badge.receipt { background: rgba(52,211,153,0.1); color: #34d399; }
.type-badge.payment { background: rgba(248,113,113,0.1); color: #f87171; }
.status-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.status-badge.draft { background: rgba(251,191,36,0.1); color: #fbbf24; }
.status-badge.confirmed { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.cancelled { background: rgba(248,113,113,0.1); color: #f87171; }

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
