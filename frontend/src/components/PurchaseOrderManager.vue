<template>
  <div class="po-mgr">
    <div class="po-header">
      <h2><ShoppingCart :size="20" style="vertical-align:middle" /> Đơn Mua Hàng</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" placeholder="Tìm mã PO, ghi chú..." @input="debouncedSearch" />
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả TT</option>
          <option value="draft">Nháp</option>
          <option value="ordered">Đã đặt</option>
          <option value="partial">Nhận 1 phần</option>
          <option value="received">Đã nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button class="btn-primary" @click="openCreate"><Plus :size="14" /> Tạo đơn</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="po-stats">
      <div class="stat-card"><div class="stat-icon"><ShoppingCart :size="20" /></div><div class="stat-value">{{ poStats.total_orders || 0 }}</div><div class="stat-label">Tổng đơn</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--green"><DollarSign :size="20" /></div><div class="stat-value">{{ formatCurrency(poStats.total_value || 0) }}</div><div class="stat-label">Tổng giá trị</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--warn"><Clock :size="20" /></div><div class="stat-value">{{ poStats.pending || 0 }}</div><div class="stat-label">Đang chờ</div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--red"><AlertCircle :size="20" /></div><div class="stat-value">{{ poStats.unpaid || 0 }}</div><div class="stat-label">Chưa thanh toán</div></div>
    </div>

    <!-- Table -->
    <div class="po-table">
      <table>
        <thead>
          <tr>
            <th>Mã PO</th><th>Nhà cung cấp</th><th>SP</th><th>Tổng tiền</th>
            <th>Trạng thái</th><th>Thanh toán</th><th>Ngày đặt</th><th>Ngày nhận dự kiến</th><th>Thao tác</th>
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
                <button v-if="po.status === 'draft'" class="act-btn act-send" @click="sendPO(po)"><Send :size="13" /> Đặt hàng</button>
                <button v-if="['ordered','partial'].includes(po.status)" class="act-btn act-confirm" @click="openReceive(po)"><PackageCheck :size="13" /> Nhận hàng</button>
                <button v-if="po.status !== 'received' && po.status !== 'cancelled'" class="act-btn act-cancel" @click="cancelPO(po)"><X :size="13" /> Hủy</button>
                <button v-if="po.status === 'draft'" class="act-btn act-cancel" @click="deletePO(po)"><Trash2 :size="13" /> Xóa</button>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="9" class="empty"><div class="empty-state"><ShoppingCart :size="40" class="empty-state__icon" /><p class="empty-state__title">Chưa có đơn mua hàng</p></div></td>
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

    <!-- Create PO Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal--wide">
        <h3><ShoppingCart :size="16" style="vertical-align:middle" /> {{ editingId ? 'Sửa đơn mua hàng' : 'Tạo đơn mua hàng' }}</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Nhà cung cấp *</label>
            <select v-model="form.supplier_id">
              <option :value="null" disabled>— Chọn NCC —</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ngày đặt</label>
            <input type="date" v-model="form.order_date" />
          </div>
          <div class="form-group">
            <label>Ngày nhận dự kiến</label>
            <input type="date" v-model="form.expected_date" />
          </div>
        </div>

        <div class="form-group">
          <label>Thêm sản phẩm</label>
          <div class="product-search-wrap">
            <input v-model="productSearch" class="product-search" placeholder="Tìm tên SP, SKU..." @input="searchProducts" />
            <div class="product-dropdown" v-if="productResults.length > 0">
              <div v-for="p in productResults" :key="p.id" class="product-result" @click="addProduct(p)">
                <span class="pr-name">{{ p.name }}</span>
                <span class="pr-sku">{{ p.sku || '' }}</span>
                <span class="pr-price">{{ formatCurrency(p.price || 0) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="items-table" v-if="form.items.length > 0">
          <table>
            <thead><tr><th>Sản phẩm</th><th>SKU</th><th style="width:90px">SL</th><th style="width:130px">Đơn giá</th><th style="width:110px">Thành tiền</th><th style="width:40px"></th></tr></thead>
            <tbody>
              <tr v-for="(item, idx) in form.items" :key="idx">
                <td>{{ item.product_name }}</td>
                <td class="sku">{{ item.sku || '—' }}</td>
                <td><input type="number" v-model.number="item.qty" min="1" class="item-input" @change="recalcTotal" /></td>
                <td><input type="number" v-model.number="item.unit_price" min="0" class="item-input" @change="recalcTotal" /></td>
                <td class="amount">{{ formatCurrency(item.qty * item.unit_price) }}</td>
                <td><button @click="form.items.splice(idx, 1); recalcTotal()" class="btn-rm"><Trash2 :size="12" /></button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="form-row" style="margin-top:12px">
          <div class="form-group"><label>Thuế</label><input type="number" v-model.number="form.tax_amount" min="0" @change="recalcTotal" /></div>
          <div class="form-group"><label>Giảm giá</label><input type="number" v-model.number="form.discount_amount" min="0" @change="recalcTotal" /></div>
          <div class="form-group"><label>Tổng tiền</label><input type="number" v-model.number="form.total_amount" readonly class="total-input" /></div>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea v-model="form.notes" rows="2"></textarea></div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-create" @click="savePO">{{ editingId ? 'Cập nhật' : 'Tạo đơn' }}</button>
        </div>
      </div>
    </div>

    <!-- View PO Detail Modal -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal modal--wide">
        <h3>
          {{ detailPO.po_number }}
          <span class="status-badge" :class="detailPO.status" style="margin-left:8px">{{ statusLabel(detailPO.status) }}</span>
          <span class="pay-badge" :class="detailPO.payment_status" style="margin-left:6px">{{ payLabel(detailPO.payment_status) }}</span>
        </h3>
        <div class="detail-info">
          <div><strong>NCC:</strong> {{ detailPO.supplier?.name }}</div>
          <div><strong>Ngày đặt:</strong> {{ formatDate(detailPO.order_date) }}</div>
          <div v-if="detailPO.expected_date"><strong>Dự kiến:</strong> {{ formatDate(detailPO.expected_date) }}</div>
          <div v-if="detailPO.received_date"><strong>Đã nhận:</strong> {{ formatDate(detailPO.received_date) }}</div>
          <div v-if="detailPO.notes"><strong>Ghi chú:</strong> {{ detailPO.notes }}</div>
        </div>
        <table class="detail-table">
          <thead><tr><th>#</th><th>Sản phẩm</th><th>SKU</th><th>SL đặt</th><th>Đã nhận</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in (detailPO.items || [])" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.product_name }}</td>
              <td class="sku">{{ item.sku || '—' }}</td>
              <td>{{ item.qty }}</td>
              <td>
                <span :class="item.received_qty >= item.qty ? 'received-full' : item.received_qty > 0 ? 'received-partial' : ''">
                  {{ item.received_qty || 0 }} / {{ item.qty }}
                </span>
              </td>
              <td>{{ formatCurrency(item.unit_price) }}</td>
              <td class="amount">{{ formatCurrency(item.total || item.qty * item.unit_price) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="6" style="text-align:right;font-weight:700">Tạm tính:</td><td class="amount">{{ formatCurrency(detailPO.subtotal) }}</td></tr>
            <tr v-if="detailPO.tax_amount"><td colspan="6" style="text-align:right">Thuế:</td><td>{{ formatCurrency(detailPO.tax_amount) }}</td></tr>
            <tr v-if="detailPO.discount_amount"><td colspan="6" style="text-align:right">Giảm giá:</td><td>-{{ formatCurrency(detailPO.discount_amount) }}</td></tr>
            <tr><td colspan="6" style="text-align:right;font-weight:800">Tổng cộng:</td><td class="amount" style="font-weight:800;font-size:15px">{{ formatCurrency(detailPO.total_amount) }}</td></tr>
          </tfoot>
        </table>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDetail = false">Đóng</button>
          <button v-if="detailPO.status === 'draft'" class="btn-send-lg" @click="showDetail = false; sendPO(detailPO)"><Send :size="14" /> Đặt hàng</button>
          <button v-if="['ordered','partial'].includes(detailPO.status)" class="btn-create" @click="showDetail = false; openReceive(detailPO)"><PackageCheck :size="14" /> Nhận hàng</button>
        </div>
      </div>
    </div>

    <!-- Receive Modal -->
    <div class="modal-overlay" v-if="showReceiveModal" @click.self="showReceiveModal = false">
      <div class="modal modal--wide">
        <h3><PackageCheck :size="16" style="vertical-align:middle" /> Nhận hàng — {{ receivePO?.po_number }}</h3>
        <p class="receive-hint">Nhập số lượng thực nhận cho từng sản phẩm:</p>
        <table class="receive-table">
          <thead><tr><th>Sản phẩm</th><th>SL đặt</th><th>Đã nhận</th><th>Còn lại</th><th style="width:100px">Nhận lần này</th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in receiveItems" :key="idx">
              <td>{{ item.product_name }}</td>
              <td>{{ item.qty }}</td>
              <td>{{ item.received_qty }}</td>
              <td>{{ item.remaining }}</td>
              <td><input type="number" v-model.number="item.receive_qty" :min="0" :max="item.remaining" class="item-input" /></td>
            </tr>
          </tbody>
        </table>
        <div class="form-group" style="margin-top:12px"><label>Ghi chú</label><input v-model="receiveNotes" placeholder="Ghi chú nhận hàng..." /></div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showReceiveModal = false">Hủy</button>
          <button class="btn-create" @click="submitReceive"><PackageCheck :size="14" /> Xác nhận nhận hàng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import {
  ShoppingCart, Plus, Eye, Send, PackageCheck, X, Trash2, DollarSign,
  Clock, AlertCircle, ChevronLeft, ChevronRight
} from 'lucide-vue-next'
const { showToast } = useToast()

const orders = ref([])
const pagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1 })
const poStats = ref({})
const suppliers = ref([])
const searchTerm = ref('')
const filterStatus = ref('')
const currentPage = ref(1)

// Modals
const showModal = ref(false)
const showDetail = ref(false)
const showReceiveModal = ref(false)
const editingId = ref(null)
const detailPO = ref({})
const receivePO = ref(null)
const receiveItems = ref([])
const receiveNotes = ref('')

// Product search
const productSearch = ref('')
const productResults = ref([])

const defaultForm = () => ({
  supplier_id: null, items: [],
  tax_amount: 0, discount_amount: 0, total_amount: 0,
  order_date: new Date().toISOString().split('T')[0],
  expected_date: '', notes: '',
})
const form = ref(defaultForm())

function statusLabel(s) {
  return { draft: 'Nháp', ordered: 'Đã đặt', partial: 'Nhận 1 phần', received: 'Đã nhận', cancelled: 'Đã hủy' }[s] || s
}
function payLabel(p) {
  return { unpaid: 'Chưa TT', partial: 'TT 1 phần', paid: 'Đã TT' }[p] || p
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

// Product search
let prodTimer = null
async function searchProducts() {
  clearTimeout(prodTimer)
  if (!productSearch.value || productSearch.value.length < 2) { productResults.value = []; return }
  prodTimer = setTimeout(async () => {
    try {
      const res = await apiFetch(`/products?search=${productSearch.value}`)
      const data = await res.json()
      productResults.value = (Array.isArray(data) ? data : data.data || []).slice(0, 8)
    } catch { productResults.value = [] }
  }, 300)
}

function addProduct(p) {
  if (form.value.items.find(i => i.product_id === p.id)) { showToast('Đã có trong danh sách', 'warning'); return }
  form.value.items.push({
    product_id: p.id, product_name: p.name,
    variant_id: null, sku: p.sku || '',
    qty: 1, unit_price: p.cost_price || p.price || 0,
  })
  productSearch.value = ''; productResults.value = []
  recalcTotal()
}

function recalcTotal() {
  const subtotal = form.value.items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  form.value.total_amount = subtotal + (form.value.tax_amount || 0) - (form.value.discount_amount || 0)
}

function openCreate() {
  editingId.value = null
  form.value = defaultForm()
  showModal.value = true
}

async function savePO() {
  if (!form.value.supplier_id) return showToast('Chọn nhà cung cấp', 'error')
  if (form.value.items.length === 0) return showToast('Thêm sản phẩm', 'error')
  try {
    if (editingId.value) {
      await apiFetch(`/purchase-orders/${editingId.value}`, { method: 'PUT', body: JSON.stringify(form.value) })
      showToast('Đã cập nhật', 'success')
    } else {
      await apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(form.value) })
      showToast('Đã tạo đơn mua hàng', 'success')
    }
    showModal.value = false
    fetchOrders(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function viewPO(po) {
  try {
    const res = await apiFetch(`/purchase-orders/${po.id}`)
    const data = await res.json()
    detailPO.value = data.data || data
    showDetail.value = true
  } catch { showToast('Lỗi tải đơn', 'error') }
}

async function sendPO(po) {
  if (!confirm(`Đặt hàng ${po.po_number} — chuyển sang trạng thái "Đã đặt"?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}/send`, { method: 'POST' })
    showToast('Đã chuyển sang Đã đặt', 'success')
    fetchOrders(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

function openReceive(po) {
  receivePO.value = po
  receiveItems.value = (po.items || []).map(i => ({
    ...i,
    received_qty: i.received_qty || 0,
    remaining: i.qty - (i.received_qty || 0),
    receive_qty: i.qty - (i.received_qty || 0), // default = nhận hết
  })).filter(i => i.remaining > 0)
  receiveNotes.value = ''
  showReceiveModal.value = true
}

async function submitReceive() {
  const items = receiveItems.value.filter(i => i.receive_qty > 0).map(i => ({
    product_id: i.product_id,
    receive_qty: Math.min(i.receive_qty, i.remaining),
  }))
  if (items.length === 0) return showToast('Nhập số lượng nhận', 'error')
  try {
    const res = await apiFetch(`/purchase-orders/${receivePO.value.id}/receive`, {
      method: 'POST',
      body: JSON.stringify({ items, notes: receiveNotes.value }),
    })
    const data = await res.json()
    showToast(data.message || 'Đã nhận hàng — Phiếu nhập kho đã tạo', 'success')
    showReceiveModal.value = false
    fetchOrders(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function cancelPO(po) {
  if (!confirm(`Hủy đơn ${po.po_number}?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}/cancel`, { method: 'POST' })
    showToast('Đã hủy', 'success')
    fetchOrders(); fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function deletePO(po) {
  if (!confirm(`Xóa đơn ${po.po_number}?`)) return
  try {
    await apiFetch(`/purchase-orders/${po.id}`, { method: 'DELETE' })
    showToast('Đã xóa', 'success')
    fetchOrders(); fetchStats()
  } catch { showToast('Lỗi xóa', 'error') }
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

.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 16px; padding: 28px; width: 500px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out; max-height: 85vh; overflow-y: auto; }
.modal--wide { width: 780px; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal h3 { margin: 0 0 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row:has(> :nth-child(3)) { grid-template-columns: 1fr 1fr 1fr; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea, .form-group select { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--glass-border); background: var(--color-input-bg, transparent); color: var(--color-text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-accent-primary); }
.product-search-wrap { position: relative; }
.product-dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10; background: var(--color-bg-secondary); border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.product-result { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background 0.15s; font-size: 13px; }
.product-result:hover { background: var(--color-accent-glow); }
.pr-name { flex: 1; font-weight: 600; }
.pr-sku, .pr-price { font-size: 11px; color: var(--color-text-muted); }
.items-table { margin: 8px 0; border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden; }
.items-table table { margin: 0; }
.item-input { width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--color-input-bg, transparent); color: var(--color-text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
.btn-rm { background: rgba(239,68,68,0.08); border: none; color: #ef4444; border-radius: 6px; padding: 4px; cursor: pointer; }
.total-input { font-weight: 800; color: #34d399 !important; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--glass-border); background: transparent; color: var(--color-text-secondary); font-weight: 600; cursor: pointer; }
.btn-create { padding: 10px 20px; border-radius: 10px; border: none; background: var(--accent-gradient); color: #fff; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.btn-send-lg { padding: 10px 20px; border-radius: 10px; border: none; background: linear-gradient(135deg, #3b82f6, #2563eb); color: #fff; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
.detail-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px; background: var(--glass-bg); border-radius: 10px; margin-bottom: 16px; font-size: 13px; }
.detail-table tfoot td { border-top: 2px solid var(--color-border); }
.received-full { color: #34d399; font-weight: 700; }
.received-partial { color: #fbbf24; font-weight: 700; }
.receive-hint { font-size: 13px; color: var(--color-text-muted); margin: 0 0 12px; }
.receive-table { margin: 0; }
</style>
