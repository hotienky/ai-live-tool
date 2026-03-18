<template>
  <div class="fsm">

    <!-- Header -->
    <div class="fsm-header">
      <div class="fsm-header__left">
        <div class="fsm-header__icon"><Zap :size="18" /></div>
        <div>
          <h2 class="fsm-header__title">Flash Sales</h2>
          <p class="fsm-header__sub">Quản lý chương trình flash sale và sản phẩm giảm giá có thời hạn</p>
        </div>
      </div>
      <button class="btn-add" @click="openCreate">
        <Plus :size="15" /> Tạo Flash Sale
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="fsm-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-row"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="sales.length === 0" class="fsm-empty">
      <div class="fsm-empty__icon"><Zap :size="32" /></div>
      <p class="fsm-empty__text">Chưa có Flash Sale nào</p>
      <p class="fsm-empty__hint">Tạo chương trình flash sale để thu hút khách hàng mua hàng nhanh hơn</p>
      <button class="btn-add" @click="openCreate"><Plus :size="15" /> Tạo Flash Sale đầu tiên</button>
    </div>

    <!-- Sale list table -->
    <div v-else class="fsm-table-wrap">
      <table class="fsm-table">
        <thead>
          <tr>
            <th>Chương trình</th>
            <th>Thời gian</th>
            <th>Sản phẩm</th>
            <th>Trạng thái</th>
            <th>Bật/Tắt</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in sales" :key="sale.id" class="fsm-table__row">
            <td class="fsm-table__name">{{ sale.name }}</td>
            <td class="fsm-table__time">
              <span>{{ formatDate(sale.start_date) }}</span>
              <span class="fsm-table__arrow">→</span>
              <span>{{ formatDate(sale.end_date) }}</span>
            </td>
            <td class="fsm-table__count">
              <Package :size="13" />
              {{ sale.items?.length || 0 }} SP
            </td>
            <td>
              <span class="badge" :class="badgeClass(sale)">{{ statusLabel(sale) }}</span>
            </td>
            <td>
              <label class="toggle">
                <input type="checkbox" :checked="sale.is_active" @change="toggleActive(sale)" />
                <span class="toggle__slider"></span>
              </label>
            </td>
            <td class="fsm-table__actions">
              <button class="btn-icon" @click="openEdit(sale)" title="Chỉnh sửa"><Pencil :size="14" /></button>
              <button class="btn-icon btn-icon--danger" @click="confirmDelete(sale)" title="Xóa"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- ───── Modal Create / Edit ───── -->
    <teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="closeModal">
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title">
              <Zap :size="17" />
              {{ editing ? 'Chỉnh sửa Flash Sale' : 'Tạo Flash Sale mới' }}
            </h3>
            <button class="btn-icon" @click="closeModal"><X :size="16" /></button>
          </div>

          <div class="modal__body">
            <!-- Basic info -->
            <div class="form-section">
              <div class="form-group">
                <label>Tên chương trình <span class="required">*</span></label>
                <input v-model="form.name" class="form-input" placeholder="VD: Flash Sale cuối tuần" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Bắt đầu <span class="required">*</span></label>
                  <input v-model="form.start_date" type="datetime-local" class="form-input" />
                </div>
                <div class="form-group">
                  <label>Kết thúc <span class="required">*</span></label>
                  <input v-model="form.end_date" type="datetime-local" class="form-input" />
                </div>
              </div>
              <div class="form-group form-group--inline">
                <span>Kích hoạt ngay</span>
                <label class="toggle">
                  <input type="checkbox" v-model="form.is_active" />
                  <span class="toggle__slider"></span>
                </label>
              </div>
            </div>

            <!-- Product search -->
            <div class="form-section">
              <div class="form-section__label">
                <Package :size="14" /> Danh sách sản phẩm
              </div>
              <div class="product-search">
                <Search :size="14" class="product-search__icon" />
                <input
                  v-model="productSearch"
                  class="product-search__input"
                  placeholder="Tìm sản phẩm để thêm vào Flash Sale..."
                  @input="searchProducts"
                  @focus="loadInitialProducts"
                  @click="loadInitialProducts"
                />
                <div v-if="searchResults.length > 0" class="product-search__dropdown">
                  <div
                    v-for="p in searchResults"
                    :key="p.id"
                    class="product-search__item"
                    @click="addProduct(p)"
                  >
                    <img
                      :src="p.image_url || 'https://placehold.co/36x36/f5f5f5/aaa?text=SP'"
                      :alt="p.name"
                      class="product-search__thumb"
                    />
                    <span class="product-search__name">{{ p.name }}</span>
                    <span class="product-search__price">{{ formatPrice(p.price) }}</span>
                    <Plus :size="14" class="product-search__add" />
                  </div>
                </div>
              </div>

              <!-- Items list -->
              <div v-if="form.items.length > 0" class="items-table-wrap">
                <table class="items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Giá gốc (đ)</th>
                      <th>Giá sale (đ)</th>
                      <th>SL giới hạn</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, i) in form.items" :key="item.product_id">
                      <td class="items-table__product">
                        <img
                          :src="item.image || 'https://placehold.co/32x32/f5f5f5/aaa?text=SP'"
                          class="items-table__thumb"
                        />
                        <span>{{ item.name }}</span>
                      </td>
                      <td><input v-model.number="item.original_price" type="number" class="form-input form-input--sm" /></td>
                      <td><input v-model.number="item.sale_price" type="number" class="form-input form-input--sm sale-input" /></td>
                      <td><input v-model.number="item.stock_limit" type="number" class="form-input form-input--sm" min="0" placeholder="0=∞" /></td>
                      <td><button class="btn-icon btn-icon--danger btn-icon--xs" @click="removeProduct(i)"><X :size="13" /></button></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="items-empty">
                Tìm và thêm sản phẩm từ ô tìm kiếm phía trên
              </div>
            </div>
          </div>

          <div class="modal__footer">
            <button class="btn-ghost" @click="closeModal">Hủy</button>
            <button class="btn-save" :disabled="saving" @click="save">
              {{ saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo Flash Sale') }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- ───── Confirm delete ───── -->
    <teleport to="body">
      <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3 class="modal__title"><Trash2 :size="17" /> Xác nhận xóa</h3>
            <button class="btn-icon" @click="deleteTarget = null"><X :size="16" /></button>
          </div>
          <div class="modal__body">
            <p>Xóa <strong>{{ deleteTarget.name }}</strong>? Toàn bộ sản phẩm trong Flash Sale này cũng sẽ bị xóa.</p>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="deleteTarget = null">Hủy</button>
            <button class="btn-danger" @click="deleteSale">Xóa</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Zap, Plus, Pencil, Trash2, X, Package, Search } from 'lucide-vue-next'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'

const { showToast } = useToast()

const sales = ref([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const deleteTarget = ref(null)
const productSearch = ref('')
const searchResults = ref([])
let searchTimer = null

const emptyForm = () => ({
  name: '',
  start_date: '',
  end_date: '',
  is_active: true,
  items: [],
})
const form = ref(emptyForm())

// ── Load ──
async function load() {
  loading.value = true
  try {
    const res = await apiFetch('/flash-sales')
    const data = await res.json()
    sales.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { sales.value = [] }
  loading.value = false
}

// ── Status helpers ──
function statusLabel(sale) {
  if (!sale.is_active) return 'Tắt'
  const now = new Date()
  if (new Date(sale.start_date) > now) return 'Sắp diễn ra'
  if (new Date(sale.end_date) < now) return 'Hết hạn'
  return 'Đang chạy'
}
function badgeClass(sale) {
  const s = statusLabel(sale)
  if (s === 'Đang chạy') return 'badge--green'
  if (s === 'Sắp diễn ra') return 'badge--blue'
  return 'badge--gray'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function formatPrice(p) {
  return Number(p || 0).toLocaleString('vi-VN') + 'đ'
}

// ── CRUD ──
function openCreate() {
  editing.value = null
  form.value = emptyForm()
  showModal.value = true
}

function openEdit(sale) {
  editing.value = sale
  form.value = {
    name: sale.name,
    start_date: toLocalDatetime(sale.start_date),
    end_date: toLocalDatetime(sale.end_date),
    is_active: sale.is_active,
    items: (sale.items || []).map(item => ({
      product_id: item.product_id,
      name: item.name,
      image: item.image,
      original_price: item.original_price ?? item.price ?? 0,
      sale_price: item.sale_price,
      stock_limit: item.stock_limit || 0,
    }))
  }
  showModal.value = true
}

function toLocalDatetime(d) {
  if (!d) return ''
  const dt = new Date(d)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 16)
}

function closeModal() {
  showModal.value = false
  searchResults.value = []
  productSearch.value = ''
}

async function loadInitialProducts() {
  if (searchResults.value.length > 0) return
  try {
    const res = await apiFetch('/products?limit=8')
    const data = await res.json()
    searchResults.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { searchResults.value = [] }
}

async function searchProducts() {
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) {
    // Show initial products when search is cleared
    loadInitialProducts()
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const q = encodeURIComponent(productSearch.value)
      const res = await apiFetch(`/products?search=${q}&limit=8`)
      const data = await res.json()
      searchResults.value = Array.isArray(data) ? data : (data?.data || [])
    } catch { searchResults.value = [] }
  }, 300)
}

function addProduct(p) {
  if (form.value.items.find(i => i.product_id === p.id)) {
    showToast('Sản phẩm đã có trong Flash Sale', 'warning'); return
  }
  form.value.items.push({
    product_id: p.id,
    name: p.name,
    image: p.image_url,
    original_price: p.price,
    sale_price: Math.round(p.price * 0.8),
    stock_limit: 0,
  })
  // Remove added product from dropdown, keep dropdown open
  searchResults.value = searchResults.value.filter(sr => sr.id !== p.id)
  productSearch.value = ''
}

function removeProduct(i) { form.value.items.splice(i, 1) }

async function save() {
  if (!form.value.name || !form.value.start_date || !form.value.end_date) {
    showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error'); return
  }
  saving.value = true
  try {
    const payload = {
      name: form.value.name,
      start_date: form.value.start_date,
      end_date: form.value.end_date,
      is_active: form.value.is_active,
      products: form.value.items.map(i => ({
        product_id: i.product_id,
        original_price: i.original_price,
        sale_price: i.sale_price,
        stock_limit: i.stock_limit || 0,
      }))
    }
    const fetchOpts = {
      method: editing.value ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
    const url = editing.value ? `/flash-sales/${editing.value.id}` : '/flash-sales'
    const res = await apiFetch(url, fetchOpts)
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message || 'Có lỗi xảy ra')
    }
    showToast(editing.value ? 'Đã cập nhật Flash Sale' : 'Đã tạo Flash Sale mới', 'success')
    closeModal()
    await load()
  } catch (e) {
    showToast(e?.message || 'Có lỗi xảy ra', 'error')
  }
  saving.value = false
}

async function toggleActive(sale) {
  try {
    await apiFetch(`/flash-sales/${sale.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sale, is_active: !sale.is_active }),
    })
    sale.is_active = !sale.is_active
    showToast(sale.is_active ? 'Đã bật Flash Sale' : 'Đã tắt Flash Sale', 'success')
  } catch { showToast('Có lỗi xảy ra', 'error') }
}

function confirmDelete(sale) { deleteTarget.value = sale }

async function deleteSale() {
  try {
    await apiFetch(`/flash-sales/${deleteTarget.value.id}`, { method: 'DELETE' })
    showToast('Đã xóa Flash Sale', 'success')
    deleteTarget.value = null
    await load()
  } catch { showToast('Có lỗi xảy ra', 'error') }
}

onMounted(load)
</script>

<style scoped>
/* ── Layout ── */
.fsm { padding: 0; }

/* ── Header ── */
.fsm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 1rem;
}
.fsm-header__left { display: flex; align-items: flex-start; gap: .75rem; }
.fsm-header__icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.fsm-header__title { margin: 0 0 2px; font-size: 1rem; font-weight: 700; color: var(--text-1); }
.fsm-header__sub { margin: 0; font-size: .75rem; color: var(--text-3); }

/* ── Skeleton ── */
.fsm-skeleton { display: flex; flex-direction: column; gap: .5rem; }
.skeleton-row {
  height: 52px; border-radius: 8px;
  background: var(--bg-2);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

/* ── Empty state ── */
.fsm-empty {
  text-align: center; padding: 3rem 1rem;
  background: var(--bg-2); border: 1px dashed var(--border); border-radius: 10px;
}
.fsm-empty__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--bg-3); color: var(--text-3); margin-bottom: .75rem;
}
.fsm-empty__text { margin: 0 0 .25rem; font-size: .9rem; font-weight: 600; color: var(--text-1); }
.fsm-empty__hint { margin: 0 0 1rem; font-size: .8rem; color: var(--text-3); }

/* ── Buttons ── */
.btn-add {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .4rem .75rem; border: none; border-radius: 7px; cursor: pointer;
  background: var(--accent); color: #fff;
  font-size: .82rem; font-weight: 600; white-space: nowrap;
  transition: opacity .15s;
}
.btn-add:hover { opacity: .88; }
.btn-save {
  padding: .4rem .85rem; border: none; border-radius: 7px; cursor: pointer;
  background: var(--accent); color: #fff; font-size: .82rem; font-weight: 600;
  transition: opacity .15s;
}
.btn-save:hover { opacity: .88; }
.btn-save:disabled { opacity: .6; cursor: not-allowed; }
.btn-ghost {
  padding: .4rem .75rem; border: 1px solid var(--border); border-radius: 7px;
  background: transparent; cursor: pointer; font-size: .82rem; color: var(--text-2);
}
.btn-ghost:hover { background: var(--bg-2); }
.btn-danger {
  padding: .4rem .75rem; border: none; border-radius: 7px; cursor: pointer;
  background: #ef4444; color: #fff; font-size: .82rem; font-weight: 600;
}
.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent; cursor: pointer;
  color: var(--text-2); transition: all .15s;
}
.btn-icon:hover { background: var(--bg-2); color: var(--text-1); }
.btn-icon--danger:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.4); }
.btn-icon--xs { width: 22px; height: 22px; }

/* ── Table ── */
.fsm-table-wrap {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  background: var(--bg-1);
}
.fsm-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.fsm-table th {
  padding: .55rem .75rem; text-align: left;
  background: var(--bg-2); border-bottom: 1px solid var(--border);
  font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; color: var(--text-3);
}
.fsm-table td {
  padding: .65rem .75rem; border-bottom: 1px solid var(--border);
  color: var(--text-1); vertical-align: middle;
}
.fsm-table__row:last-child td { border-bottom: none; }
.fsm-table__name { font-weight: 600; }
.fsm-table__time {
  display: flex; align-items: center; gap: .3rem;
  font-size: .75rem; color: var(--text-2);
}
.fsm-table__arrow { color: var(--text-3); }
.fsm-table__count {
  display: flex; align-items: center; gap: .3rem;
  font-size: .78rem; color: var(--text-2);
}
.fsm-table__actions { display: flex; gap: .3rem; }

/* ── Badges ── */
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: .68rem; font-weight: 700; letter-spacing: .02em;
}
.badge--green { background: rgba(16,185,129,.12); color: #059669; }
.badge--blue  { background: rgba(99,102,241,.12);  color: #4f46e5; }
.badge--gray  { background: var(--bg-3); color: var(--text-3); }

/* ── Toggle ── */
.toggle { position: relative; display: inline-block; width: 34px; height: 20px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute; inset: 0; border-radius: 20px;
  background: var(--bg-3); transition: background .2s;
}
.toggle__slider::before {
  content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; left: 3px; top: 3px; transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle input:checked + .toggle__slider { background: var(--accent); }
.toggle input:checked + .toggle__slider::before { transform: translateX(14px); }

/* ── Modal ── */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--bg-1); border: 1px solid var(--border); border-radius: 14px;
  width: 680px; max-width: calc(100vw - 32px); min-height: 70vh; max-height: 90vh;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
}
.modal--sm { width: 400px; }
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .9rem 1.1rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.modal__title {
  display: flex; align-items: center; gap: .4rem;
  margin: 0; font-size: .9rem; font-weight: 700; color: var(--text-1);
}
.modal__body { padding: 1.1rem; overflow-y: auto; flex: 1; }
.modal__footer {
  padding: .75rem 1.1rem; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: .5rem; flex-shrink: 0;
  background: var(--bg-2);
}

/* ── Form ── */
.form-section { margin-bottom: 1.25rem; }
.form-section + .form-section {
  padding-top: 1.1rem; border-top: 1px solid var(--border);
}
.form-section__label {
  display: flex; align-items: center; gap: .35rem;
  font-size: .78rem; font-weight: 700; color: var(--text-2);
  text-transform: uppercase; letter-spacing: .04em; margin-bottom: .75rem;
}
.form-group { margin-bottom: .75rem; }
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: .25rem; font-weight: 500; }
.form-group--inline {
  display: flex; align-items: center; justify-content: space-between;
  font-size: .82rem; color: var(--text-1); padding: .5rem .75rem;
  background: var(--bg-2); border-radius: 7px; border: 1px solid var(--border);
}
.required { color: #ef4444; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: .75rem; }
.form-input {
  width: 100%; padding: .4rem .6rem; border-radius: 7px;
  border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1);
  font-size: .82rem; box-sizing: border-box;
  transition: border-color .15s;
}
.form-input:focus { outline: none; border-color: var(--accent); }
.form-input--sm { padding: .25rem .4rem; font-size: .78rem; }

/* ── Product search ── */
.product-search { position: relative; }
.product-search__icon {
  position: absolute; left: .6rem; top: 50%; transform: translateY(-50%);
  color: var(--text-3); pointer-events: none;
}
.product-search__input {
  width: 100%; padding: .4rem .6rem .4rem 2rem; border-radius: 7px;
  border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1);
  font-size: .82rem; box-sizing: border-box;
}
.product-search__input:focus { outline: none; border-color: var(--accent); }
.product-search__dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20;
  background: var(--bg-1); border: 1px solid var(--border);
  border-radius: 9px; box-shadow: 0 8px 24px rgba(0,0,0,.15);
  overflow: hidden;
}
.product-search__item {
  display: flex; align-items: center; gap: .6rem; padding: .5rem .75rem; cursor: pointer;
  transition: background .12s; font-size: .82rem; color: var(--text-1);
}
.product-search__item:hover { background: var(--bg-2); }
.product-search__thumb { width: 34px; height: 34px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.product-search__name { flex: 1; }
.product-search__price { color: var(--accent); font-weight: 600; font-size: .78rem; }
.product-search__add { color: var(--text-3); margin-left: .25rem; }

/* ── Items table ── */
.items-table-wrap {
  margin-top: .75rem; border: 1px solid var(--border); border-radius: 9px; overflow: hidden;
}
.items-table { width: 100%; border-collapse: collapse; font-size: .78rem; }
.items-table th {
  padding: .35rem .6rem; background: var(--bg-2); border-bottom: 1px solid var(--border);
  text-align: left; font-size: .68rem; text-transform: uppercase; color: var(--text-3); font-weight: 600;
}
.items-table td { padding: .5rem .6rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
.items-table tr:last-child td { border-bottom: none; }
.items-table__product { display: flex; align-items: center; gap: .5rem; color: var(--text-1); }
.items-table__thumb { width: 28px; height: 28px; border-radius: 5px; object-fit: cover; flex-shrink: 0; }
.sale-input { border-color: rgba(239,68,68,.35); color: #ef4444; }
.sale-input:focus { border-color: #ef4444; }
.items-empty {
  margin-top: .75rem; padding: 1rem; text-align: center;
  background: var(--bg-2); border-radius: 9px; font-size: .8rem; color: var(--text-3);
  border: 1px dashed var(--border);
}
</style>
