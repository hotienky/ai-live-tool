<template>
  <div class="stock-receipt-mgr">
    <div class="sr-header">
      <h2><ClipboardList :size="20" style="vertical-align:middle" /> Phiếu Nhập/Xuất Kho</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" placeholder="Tìm mã phiếu, ghi chú..." @input="debouncedSearch" />
        <select v-model="filterType" class="filter-select">
          <option value="">Tất cả loại</option>
          <option value="import">Nhập kho</option>
          <option value="export">Xuất kho</option>
          <option value="return">Trả hàng</option>
          <option value="adjust">Kiểm kê</option>
        </select>
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả TT</option>
          <option value="draft">Nháp</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button class="btn-primary" @click="openCreateModal('import')"><Plus :size="14" /> Nhập kho</button>
        <button class="btn-secondary" @click="openCreateModal('export')"><Minus :size="14" /> Xuất kho</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="sr-stats">
      <div class="stat-card">
        <div class="stat-icon"><ArrowDownToLine :size="20" /></div>
        <div class="stat-value">{{ stats.total_imports || 0 }}</div>
        <div class="stat-label">Phiếu nhập</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--export"><ArrowUpFromLine :size="20" /></div>
        <div class="stat-value">{{ formatCurrency(stats.import_value || 0) }}</div>
        <div class="stat-label">Giá trị nhập</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--warn"><ArrowUpFromLine :size="20" /></div>
        <div class="stat-value">{{ stats.total_exports || 0 }}</div>
        <div class="stat-label">Phiếu xuất</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--info"><FileText :size="20" /></div>
        <div class="stat-value">{{ stats.pending_drafts || 0 }}</div>
        <div class="stat-label">Chờ xác nhận</div>
      </div>
    </div>

    <!-- Table -->
    <div class="sr-table">
      <table>
        <thead>
          <tr>
            <th>Mã phiếu</th>
            <th>Loại</th>
            <th>NCC</th>
            <th>SP</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in receipts" :key="r.id">
            <td class="receipt-num">{{ r.receipt_number }}</td>
            <td><span class="type-badge" :class="r.type">{{ typeLabel(r.type) }}</span></td>
            <td>{{ r.supplier?.name || '—' }}</td>
            <td>{{ (r.items || []).length }} SP</td>
            <td class="amount">{{ formatCurrency(r.total_amount) }}</td>
            <td><span class="status-badge" :class="r.status">{{ statusLabel(r.status) }}</span></td>
            <td class="date">{{ formatDate(r.created_at) }}</td>
            <td>
              <div class="action-btns">
                <button @click="viewReceipt(r)" title="Xem"><Eye :size="14" /></button>
                <button v-if="r.status === 'draft'" @click="confirmReceipt(r)" title="Xác nhận" class="btn-confirm"><Check :size="14" /></button>
                <button v-if="r.status !== 'cancelled'" @click="cancelReceipt(r)" title="Hủy" class="btn-danger"><X :size="14" /></button>
                <button v-if="r.status === 'draft'" @click="deleteReceipt(r)" title="Xóa" class="btn-danger"><Trash2 :size="14" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="receipts.length === 0">
            <td colspan="8" class="empty">
              <div class="empty-state">
                <ClipboardList :size="40" class="empty-state__icon" />
                <p class="empty-state__title">Chưa có phiếu kho</p>
                <p class="empty-state__sub">Tạo phiếu nhập/xuất kho đầu tiên</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="pagination" v-if="pagination.last_page > 1">
      <button @click="currentPage = Math.max(1, currentPage - 1)" :disabled="currentPage <= 1" class="page-btn">
        <ChevronLeft :size="14" />
      </button>
      <span class="page-info">{{ currentPage }} / {{ pagination.last_page }}</span>
      <button @click="currentPage = Math.min(pagination.last_page, currentPage + 1)" :disabled="currentPage >= pagination.last_page" class="page-btn">
        <ChevronRight :size="14" />
      </button>
    </div>

    <!-- Create/Edit Receipt Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal--wide">
        <h3><ClipboardList :size="16" style="vertical-align:middle" /> {{ editingId ? 'Sửa phiếu kho' : 'Tạo phiếu kho' }}</h3>

        <div class="form-row">
          <div class="form-group">
            <label>Loại phiếu</label>
            <select v-model="form.type" :disabled="!!editingId">
              <option value="import">Nhập kho</option>
              <option value="export">Xuất kho</option>
              <option value="return">Trả hàng NCC</option>
              <option value="adjust">Kiểm kê</option>
            </select>
          </div>
          <div class="form-group">
            <label>Nhà cung cấp</label>
            <select v-model="form.supplier_id">
              <option :value="null">— Không —</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
            </select>
          </div>
        </div>

        <!-- Product search + items -->
        <div class="form-group">
          <label>Sản phẩm</label>
          <div class="product-search-wrap">
            <input v-model="productSearch" class="product-search" placeholder="Tìm tên SP, SKU..." @input="searchProducts" />
            <div class="product-dropdown" v-if="productResults.length > 0">
              <div v-for="p in productResults" :key="p.id" class="product-result" @click="addProduct(p)">
                <span class="pr-name">{{ p.name }}</span>
                <span class="pr-sku">{{ p.sku || '' }}</span>
                <span class="pr-stock">Kho: {{ p.stock }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="items-table" v-if="form.items.length > 0">
          <table>
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>SKU</th>
                <th style="width:90px">SL</th>
                <th style="width:130px">Đơn giá</th>
                <th style="width:110px">Thành tiền</th>
                <th style="width:40px"></th>
              </tr>
            </thead>
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
          <div class="form-group">
            <label>Thuế</label>
            <input type="number" v-model.number="form.tax_amount" min="0" />
          </div>
          <div class="form-group">
            <label>Giảm giá</label>
            <input type="number" v-model.number="form.discount_amount" min="0" />
          </div>
          <div class="form-group">
            <label>Tổng tiền</label>
            <input type="number" v-model.number="form.total_amount" readonly class="total-input" />
          </div>
        </div>

        <div class="form-group">
          <label>Ghi chú</label>
          <textarea v-model="form.notes" rows="2" placeholder="Lý do nhập/xuất..."></textarea>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-create" @click="saveReceipt">{{ editingId ? 'Cập nhật' : 'Tạo phiếu' }}</button>
        </div>
      </div>
    </div>

    <!-- View Detail Modal -->
    <div class="modal-overlay" v-if="showDetail" @click.self="showDetail = false">
      <div class="modal modal--wide">
        <h3>
          <span class="type-badge" :class="detailReceipt.type">{{ typeLabel(detailReceipt.type) }}</span>
          {{ detailReceipt.receipt_number }}
          <span class="status-badge" :class="detailReceipt.status" style="margin-left:8px">{{ statusLabel(detailReceipt.status) }}</span>
        </h3>
        <div class="detail-info">
          <div v-if="detailReceipt.supplier"><strong>NCC:</strong> {{ detailReceipt.supplier?.name }}</div>
          <div><strong>Ngày tạo:</strong> {{ formatDate(detailReceipt.created_at) }}</div>
          <div v-if="detailReceipt.confirmed_at"><strong>Xác nhận:</strong> {{ formatDate(detailReceipt.confirmed_at) }}</div>
          <div v-if="detailReceipt.notes"><strong>Ghi chú:</strong> {{ detailReceipt.notes }}</div>
        </div>
        <table class="detail-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Sản phẩm</th>
              <th>SKU</th>
              <th>SL</th>
              <th>Đơn giá</th>
              <th>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, idx) in (detailReceipt.items || [])" :key="idx">
              <td>{{ idx + 1 }}</td>
              <td>{{ item.product_name }}</td>
              <td class="sku">{{ item.sku || '—' }}</td>
              <td>{{ item.qty }}</td>
              <td>{{ formatCurrency(item.unit_price) }}</td>
              <td class="amount">{{ formatCurrency(item.total || item.qty * item.unit_price) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="5" style="text-align:right;font-weight:700">Tổng cộng:</td>
              <td class="amount" style="font-weight:800">{{ formatCurrency(detailReceipt.total_amount) }}</td>
            </tr>
          </tfoot>
        </table>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showDetail = false">Đóng</button>
          <button v-if="detailReceipt.status === 'draft'" class="btn-create" @click="showDetail = false; confirmReceipt(detailReceipt)">Xác nhận</button>
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
  ClipboardList, Plus, Minus, Eye, Check, X, Trash2,
  ArrowDownToLine, ArrowUpFromLine, FileText,
  ChevronLeft, ChevronRight
} from 'lucide-vue-next'
const { showToast } = useToast()

const receipts = ref([])
const pagination = ref({ total: 0, per_page: 20, current_page: 1, last_page: 1 })
const stats = ref({})
const suppliers = ref([])
const searchTerm = ref('')
const filterType = ref('')
const filterStatus = ref('')
const currentPage = ref(1)

// Modals
const showModal = ref(false)
const showDetail = ref(false)
const editingId = ref(null)
const detailReceipt = ref({})

// Product search
const productSearch = ref('')
const productResults = ref([])
let searchTimer = null

const defaultForm = () => ({
  type: 'import', supplier_id: null, items: [],
  total_amount: 0, tax_amount: 0, discount_amount: 0, notes: '',
})
const form = ref(defaultForm())

// Labels
function typeLabel(t) {
  return { import: 'Nhập kho', export: 'Xuất kho', return: 'Trả hàng', adjust: 'Kiểm kê' }[t] || t
}
function statusLabel(s) {
  return { draft: 'Nháp', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' }[s] || s
}

// Fetch
onMounted(() => { fetchReceipts(); fetchStats(); fetchSuppliers() })
watch([filterType, filterStatus, currentPage], () => fetchReceipts())

async function fetchReceipts() {
  try {
    let url = `/stock-receipts?page=${currentPage.value}&per_page=20`
    if (filterType.value) url += `&type=${filterType.value}`
    if (filterStatus.value) url += `&status=${filterStatus.value}`
    if (searchTerm.value) url += `&search=${searchTerm.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    receipts.value = data.data?.items || data.items || []
    pagination.value = data.data?.pagination || data.pagination || pagination.value
  } catch { receipts.value = [] }
}

async function fetchStats() {
  try {
    const res = await apiFetch('/stock-receipts/stats')
    const data = await res.json()
    stats.value = data.data || data
  } catch { /* silent */ }
}

async function fetchSuppliers() {
  try {
    const res = await apiFetch('/suppliers?active_only=true')
    const data = await res.json()
    suppliers.value = data.data || data || []
  } catch { suppliers.value = [] }
}

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { currentPage.value = 1; fetchReceipts() }, 300)
}

// Product search for adding items
let prodTimer = null
async function searchProducts() {
  clearTimeout(prodTimer)
  if (!productSearch.value || productSearch.value.length < 2) {
    productResults.value = []
    return
  }
  prodTimer = setTimeout(async () => {
    try {
      const res = await apiFetch(`/products?search=${productSearch.value}`)
      const data = await res.json()
      productResults.value = (Array.isArray(data) ? data : data.data || []).slice(0, 8)
    } catch { productResults.value = [] }
  }, 300)
}

function addProduct(p) {
  // Check if already added
  if (form.value.items.find(i => i.product_id === p.id)) {
    showToast('Sản phẩm đã có trong danh sách', 'warning')
    return
  }
  form.value.items.push({
    product_id: p.id,
    product_name: p.name,
    variant_id: null,
    sku: p.sku || '',
    qty: 1,
    unit_price: p.costPrice || p.cost_price || p.price || 0,
  })
  productSearch.value = ''
  productResults.value = []
  recalcTotal()
}

function recalcTotal() {
  const itemsTotal = form.value.items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  form.value.total_amount = itemsTotal + (form.value.tax_amount || 0) - (form.value.discount_amount || 0)
}

// CRUD
function openCreateModal(type = 'import') {
  editingId.value = null
  form.value = { ...defaultForm(), type }
  showModal.value = true
}

async function saveReceipt() {
  if (form.value.items.length === 0) return showToast('Vui lòng thêm sản phẩm', 'error')
  try {
    if (editingId.value) {
      await apiFetch(`/stock-receipts/${editingId.value}`, {
        method: 'PUT', body: JSON.stringify(form.value),
      })
      showToast('Đã cập nhật phiếu', 'success')
    } else {
      await apiFetch('/stock-receipts', {
        method: 'POST', body: JSON.stringify(form.value),
      })
      showToast('Đã tạo phiếu kho', 'success')
    }
    showModal.value = false
    fetchReceipts()
    fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function viewReceipt(r) {
  try {
    const res = await apiFetch(`/stock-receipts/${r.id}`)
    const data = await res.json()
    detailReceipt.value = data.data || data
    showDetail.value = true
  } catch { showToast('Lỗi tải phiếu', 'error') }
}

async function confirmReceipt(r) {
  if (!confirm(`Xác nhận phiếu ${r.receipt_number}? Kho sẽ được cập nhật.`)) return
  try {
    await apiFetch(`/stock-receipts/${r.id}/confirm`, { method: 'POST' })
    showToast('Đã xác nhận — Kho và kế toán đã cập nhật', 'success')
    fetchReceipts()
    fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function cancelReceipt(r) {
  if (!confirm(`Hủy phiếu ${r.receipt_number}?`)) return
  try {
    await apiFetch(`/stock-receipts/${r.id}/cancel`, { method: 'POST' })
    showToast('Đã hủy phiếu', 'success')
    fetchReceipts()
    fetchStats()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function deleteReceipt(r) {
  if (!confirm(`Xóa phiếu ${r.receipt_number}?`)) return
  try {
    await apiFetch(`/stock-receipts/${r.id}`, { method: 'DELETE' })
    showToast('Đã xóa phiếu', 'success')
    fetchReceipts()
    fetchStats()
  } catch { showToast('Lỗi xóa', 'error') }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.stock-receipt-mgr { padding: 24px; overflow-y: auto; height: 100%; }
.sr-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.sr-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; min-width: 180px; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-accent-primary); }
.filter-select {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; outline: none;
}
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-primary {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-primary:hover { transform: translateY(-1px); }
.btn-secondary {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 14px; border-radius: 10px;
  font-weight: 600; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-secondary:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

/* Stats */
.sr-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 20px; text-align: center;
  transition: all 0.3s;
}
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); box-shadow: var(--shadow-card); }
.stat-icon {
  width: 44px; height: 44px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; margin: 0 auto 10px;
  background: var(--color-accent-glow); color: var(--accent-light);
}
.stat-icon--export { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--warn { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-icon--info { background: rgba(96,165,250,0.12); color: #60a5fa; }
.stat-value { font-size: 24px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; }

/* Table */
.sr-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th {
  padding: 12px 14px; text-align: left; color: var(--color-text-muted);
  font-weight: 700; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.receipt-num { font-family: 'SF Mono', monospace; font-weight: 700; font-size: 12px; }
.amount { font-weight: 700; color: #34d399; }
.date { font-size: 12px; color: var(--color-text-muted); }
.sku { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--color-text-muted); }

/* Badges */
.type-badge {
  padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
}
.type-badge.import { background: rgba(52,211,153,0.1); color: #34d399; }
.type-badge.export { background: rgba(248,113,113,0.1); color: #f87171; }
.type-badge.return { background: rgba(251,191,36,0.1); color: #fbbf24; }
.type-badge.adjust { background: rgba(96,165,250,0.1); color: #60a5fa; }

.status-badge {
  padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
}
.status-badge.draft { background: rgba(251,191,36,0.1); color: #fbbf24; }
.status-badge.confirmed { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.cancelled { background: rgba(248,113,113,0.1); color: #f87171; }

/* Actions */
.action-btns { display: flex; gap: 4px; }
.action-btns button {
  background: none; border: none; cursor: pointer; padding: 5px;
  color: var(--color-text-muted); opacity: 0.6; transition: all 0.2s; border-radius: 6px;
}
.action-btns button:hover { opacity: 1; transform: scale(1.1); color: var(--color-text-primary); background: var(--color-accent-glow); }
.action-btns .btn-confirm:hover { color: #34d399; background: rgba(52,211,153,0.08); }
.action-btns .btn-danger:hover { color: #f87171; background: rgba(248,113,113,0.06); }

/* Empty */
.empty { text-align: center; color: var(--color-text-muted); padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* Pagination */
.pagination {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 16px; margin-top: 8px;
}
.page-btn {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); border-radius: 8px; padding: 6px 10px;
  cursor: pointer; transition: all 0.2s; display: flex; align-items: center;
}
.page-btn:hover:not(:disabled) { border-color: var(--color-accent-primary); background: var(--color-accent-glow); }
.page-btn:disabled { opacity: 0.3; cursor: not-allowed; }
.page-info { font-size: 13px; color: var(--color-text-secondary); font-weight: 600; }

/* Modal */
.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 28px; width: 500px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out;
  max-height: 85vh; overflow-y: auto;
}
.modal--wide { width: 720px; }
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal h3 { margin: 0 0 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-row:has(> :nth-child(3)) { grid-template-columns: 1fr 1fr 1fr; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; padding: 10px 12px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--color-input-bg, transparent);
  color: var(--color-text-primary); font-size: 13px; outline: none;
  transition: border-color 0.2s; box-sizing: border-box;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-accent-primary); }

/* Product search */
.product-search-wrap { position: relative; }
.product-search { width: 100%; }
.product-dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 10;
  background: var(--color-bg-secondary); border: 1px solid var(--glass-border);
  border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
}
.product-result {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px;
  cursor: pointer; transition: background 0.15s; font-size: 13px;
}
.product-result:hover { background: var(--color-accent-glow); }
.pr-name { flex: 1; font-weight: 600; }
.pr-sku { font-family: monospace; font-size: 11px; color: var(--color-text-muted); }
.pr-stock { font-size: 11px; color: var(--color-text-muted); }

/* Items table */
.items-table { margin: 8px 0; border: 1px solid var(--glass-border); border-radius: 10px; overflow: hidden; }
.items-table table { margin: 0; }
.item-input {
  width: 100%; padding: 6px 8px; border-radius: 6px;
  border: 1px solid var(--glass-border); background: var(--color-input-bg, transparent);
  color: var(--color-text-primary); font-size: 13px; outline: none;
  box-sizing: border-box;
}
.btn-rm {
  background: rgba(239,68,68,0.08); border: none; color: #ef4444;
  border-radius: 6px; padding: 4px; cursor: pointer;
}
.total-input { font-weight: 800; color: #34d399 !important; }

/* Modal actions */
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel {
  padding: 10px 20px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-secondary); font-weight: 600; cursor: pointer;
}
.btn-create {
  padding: 10px 20px; border-radius: 10px; border: none;
  background: var(--accent-gradient); color: #fff; font-weight: 700;
  cursor: pointer; box-shadow: var(--accent-shadow);
}

/* Detail */
.detail-info {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  padding: 14px; background: var(--glass-bg); border-radius: 10px;
  margin-bottom: 16px; font-size: 13px;
}
.detail-table { margin: 0; }
.detail-table tfoot td { border-top: 2px solid var(--color-border); }
</style>
