<template>
  <div class="fsf-page">
    <!-- Header -->
    <div class="fsf-header">
      <button class="btn-back" @click="$emit('back')">
        <ChevronLeft :size="15" /> Quay lại
      </button>
      <div class="fsf-header__center">
        <div class="fsf-header__icon"><Zap :size="15" /></div>
        <h3>{{ editId ? 'Chỉnh sửa Flash Sale' : 'Tạo Flash Sale mới' }}</h3>
      </div>
      <button class="btn-save-top" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? t('admin.saving', 'Đang lưu...') : (editId ? t('admin.update', 'Cập nhật') : t('admin.msg_9d9407dd', 'Tạo Flash Sale')) }}
      </button>
    </div>

    <!-- Body -->
    <div class="fsf-body">
      <!-- Main column -->
      <div class="fsf-col fsf-col--main">

        <!-- Lang tabs (if multilingual available) -->
        <LanguageTabs
          v-model="currentLang"
          :translations="form.translations"
          :fields="['name']"
          :baseData="form"
        />

        <!-- Basic info -->
        <div class="fsf-card">
          <h4><Zap :size="13" />{{ t('admin.flash_sale.program_info', 'Thông tin chương trình') }}</h4>

          <div class="form-group">
            <label>{{ t('admin.flash_sale.name', 'Tên chương trình') }}<span class="req">*</span>
              <span v-if="currentLang !== 'vi'" class="lang-badge">{{ currentLang.toUpperCase() }}</span>
            </label>
            <input
              v-model="formName"
              class="form-input"
              placeholder="VD: Flash Sale cuối tuần, Siêu sale 8/3..."
            />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.start', 'Bắt đầu') }}<span class="req">*</span></label>
              <input v-model="form.start_date" type="datetime-local" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_144f8bdc', 'Kết thúc') }}<span class="req">*</span></label>
              <input v-model="form.end_date" type="datetime-local" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Products -->
        <div class="fsf-card">
          <h4><Package :size="13" />{{ t('admin.flash_sale.product_list', 'Danh sách sản phẩm') }}</h4>

          <div class="product-search" ref="searchWrap">
            <Search :size="13" class="product-search__icon" />
            <input
              v-model="productSearch"
              class="product-search__input"
              placeholder=t('admin.flash_sale.search_products', "Tìm sản phẩm để thêm vào Flash Sale...")
              @input="onSearch"
              @focus="onFocus"
            />
            <div
              v-if="showDropdown && searchResults.length > 0"
              class="product-search__dropdown"
            >
              <div
                v-for="p in searchResults"
                :key="p.id"
                class="product-search__item"
                @mousedown.prevent="addProduct(p)"
              >
                <img :src="p.image_url || 'https://placehold.co/34x34/eee/aaa?text=SP'" class="product-search__thumb" />
                <span class="product-search__name">{{ p.name }}</span>
                <span class="product-search__price">{{ formatPrice(p.price) }}</span>
                <Plus :size="13" />
              </div>
            </div>
          </div>

          <div v-if="form.items.length" class="items-wrap">
            <table class="items-table">
              <thead>
                <tr>
                  <th>{{ t('admin.promotion.product', 'Sản phẩm') }}</th>
                  <th>{{ t('admin.flash_sale.original_price', 'Giá gốc (đ)') }}</th>
                  <th>{{ t('admin.flash_sale.sale_price', 'Giá sale (đ)') }}</th>
                  <th>{{ t('admin.flash_sale.stock_limit', 'SL giới hạn') }}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in form.items" :key="item.product_id">
                  <td>
                    <div class="item-product">
                      <img :src="item.image || 'https://placehold.co/28x28/eee/aaa?text=SP'" class="item-thumb" />
                      <span>{{ item.name }}</span>
                    </div>
                  </td>
                  <td><input v-model.number="item.original_price" type="number" class="form-input form-input--sm" /></td>
                  <td><input v-model.number="item.sale_price" type="number" class="form-input form-input--sm sale-price" /></td>
                  <td><input v-model.number="item.stock_limit" type="number" min="0" class="form-input form-input--sm" placeholder="0=∞" /></td>
                  <td>
                    <button class="btn-remove" @click="form.items.splice(i, 1)"><X :size="12" /></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="items-empty">
            <Package :size="24" style="opacity:.3" />
            <span>{{ t('admin.flash_sale.add_products_hint', 'Tìm và thêm sản phẩm từ ô tìm kiếm phía trên') }}</span>
          </div>
        </div>
      </div>

      <!-- Side column -->
      <div class="fsf-col fsf-col--side">
        <div class="fsf-card">
          <h4>{{ t('admin.settings', 'Cài đặt') }}</h4>
          <div class="toggle-row">
            <span>{{ t('admin.flash_sale.activate_now', 'Kích hoạt ngay') }}</span>
            <label class="toggle">
              <input type="checkbox" v-model="form.is_active" />
              <span class="toggle__dot"></span>
            </label>
          </div>
        </div>

        <!-- Preview -->
        <div class="fsf-card fsf-card--preview" v-if="formName || form.start_date">
          <h4>{{ t('admin.preview', 'Xem trước') }}</h4>
          <div class="preview-name">{{ formName || '(Chưa đặt tên)' }}</div>
          <div class="preview-time" v-if="form.start_date">
            <Clock :size="11" /> {{ fmtDate(form.start_date) }} → {{ fmtDate(form.end_date) }}
          </div>
          <div class="preview-count">{{ form.items.length }} sản phẩm</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../helpers.js'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, Zap, Package, Search, Plus, X, Loader2, Clock } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import LanguageTabs from './LanguageTabs.vue'
import { useContentTranslations } from '../composables/useContentTranslations.js'

const { showToast } = useToast()
const { t } = useI18n()
const props = defineProps({
  editId: { type: [String, Number], default: null },
})
const emit = defineEmits(['back', 'saved'])

// ── Languages ──
const currentLang = ref('vi')

// ── Form ──
const saving = ref(false)
const form = ref({
  name: '',
  start_date: '',
  end_date: '',
  is_active: true,
  items: [],
  translations: {},
})

const { tField } = useContentTranslations(form, currentLang, 'vi')
const formName = tField('name')

// ── Product search ──
const productSearch = ref('')
const searchResults = ref([])
const showDropdown = ref(false)
let searchTimer = null

function onFocus() {
  showDropdown.value = true
  if (!searchResults.value.length) loadProducts()
}

function onSearch() {
  showDropdown.value = true
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) { loadProducts(); return }
  searchTimer = setTimeout(async () => {
    try {
      const q = encodeURIComponent(productSearch.value)
      const data = await apiFetch(`/products?search=${q}&limit=8`).then(r => r.json())
      searchResults.value = Array.isArray(data) ? data : (data?.data || [])
    } catch { searchResults.value = [] }
  }, 300)
}

async function loadProducts() {
  try {
    const data = await apiFetch('/products?limit=8').then(r => r.json())
    searchResults.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { searchResults.value = [] }
}

function addProduct(p) {
  if (form.value.items.find(i => i.product_id === p.id)) {
    showToast('Sản phẩm đã có trong Flash Sale', 'warning'); return
  }
  form.value.items.push({
    product_id: p.id, name: p.name, image: p.image_url,
    original_price: p.price,
    sale_price: Math.round(p.price * 0.8),
    stock_limit: 0,
  })
  searchResults.value = searchResults.value.filter(s => s.id !== p.id)
  productSearch.value = ''
  showDropdown.value = false
}

// Close dropdown on outside click
function onWindowClick(e) {
  const wrap = document.querySelector('.product-search')
  if (wrap && !wrap.contains(e.target)) showDropdown.value = false
}

// ── Helpers ──
function formatPrice(p) { return Number(p || 0).toLocaleString('vi-VN') + 'đ' }
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function toLocal(d) {
  if (!d) return ''
  const dt = new Date(d)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 16)
}

// ── Load for edit ──
async function loadForEdit() {
  try {
    const data = await apiFetch(`/flash-sales/${props.editId}`).then(r => r.json())
    const sale = data?.data || data
    if (!sale) { showToast('Không tìm thấy Flash Sale', 'error'); emit('back'); return }
    form.value = {
      name: sale.name || '',
      start_date: toLocal(sale.start_date || sale.start_time),
      end_date: toLocal(sale.end_date || sale.end_time),
      is_active: sale.is_active ?? true,
      items: (sale.items || []).map(item => ({
        product_id: item.product_id, name: item.name, image: item.image,
        original_price: item.original_price ?? item.price ?? 0,
        sale_price: item.sale_price, stock_limit: item.stock_limit || 0,
      })),
      translations: {},
    }
    // Load translations
    try {
      const td = await apiFetch(`/languages/content/flash_sales/${props.editId}`).then(r => r.json())
      if (td?.grouped && !Array.isArray(td.grouped)) form.value.translations = td.grouped
    } catch { /* ok */ }
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' tải Flash Sale', 'error'); emit('back')
  }
}

// ── Save ──
async function handleSave() {
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
      })),
      translations: form.value.translations,
    }
    const url = props.editId ? `/flash-sales/${props.editId}` : '/flash-sales'
    const res = await apiFetch(url, {
      method: props.editId ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message || t('admin.msg_ea728f61', 'Có lỗi xảy ra'))
    }
    showToast(props.editId ? t('admin.flash_sale.updated', 'Đã cập nhật Flash Sale') : t('admin.flash_sale.created', 'Đã tạo Flash Sale mới'), 'success')
    emit('saved')
  } catch (e) {
    showToast(e?.message || t('admin.msg_ea728f61', 'Có lỗi xảy ra'), 'error')
  }
  saving.value = false
}

onMounted(() => {
  if (props.editId) loadForEdit()
  window.addEventListener('click', onWindowClick)
})

onUnmounted(() => {
  window.removeEventListener('click', onWindowClick)
})
</script>

<style scoped>
/* ── Page ── */
.fsf-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ── Header ── */
.fsf-header {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding-bottom: 14px; margin-bottom: 18px; border-bottom: 1px solid var(--border);
}
.fsf-header__center { display: flex; align-items: center; gap: 7px; flex: 1; justify-content: center; }
.fsf-header__icon {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(135deg,#f59e0b,#ef4444); color:#fff;
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.fsf-header h3 { margin:0; font-size:15px; font-weight:700; color:var(--text-1); }

.btn-back {
  display:flex; align-items:center; gap:3px; padding:6px 12px;
  border-radius:7px; border:1px solid var(--border); background:var(--bg-1);
  color:var(--text-2); font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap; transition:all .15s;
}
.btn-back:hover { border-color:var(--accent); color:var(--accent); }
.btn-save-top {
  display:flex; align-items:center; gap:5px; padding:7px 16px;
  border-radius:7px; border:none;
  background:linear-gradient(135deg,#f59e0b,#ef4444); color:#fff;
  font-size:12px; font-weight:700; cursor:pointer; white-space:nowrap; transition:opacity .15s;
}
.btn-save-top:hover { opacity:.9; }
.btn-save-top:disabled { opacity:.5; cursor:not-allowed; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* ── Body layout ── */
.fsf-body { display:flex; gap:16px; align-items:flex-start; }
.fsf-col--main { flex:7; min-width:0; display:flex; flex-direction:column; gap:14px; }
.fsf-col--side { flex:3; min-width:200px; display:flex; flex-direction:column; gap:14px; position:sticky; top:12px; }

/* ── Cards ── */
.fsf-card {
  background:var(--bg-1); border:1px solid var(--border);
  border-radius:10px; padding:16px;
}
.fsf-card h4 {
  font-size:11.5px; font-weight:700; margin:0 0 12px; color:var(--text-1);
  display:flex; align-items:center; gap:5px; text-transform:uppercase; letter-spacing:.04em; color:var(--text-2);
}
.fsf-card--preview { background:linear-gradient(135deg,rgba(245,158,11,.05),rgba(239,68,68,.05)); border-color:rgba(245,158,11,.3); }

/* ── Form ── */
.form-group { margin-bottom:10px; }
.form-group label { display:block; font-size:11.5px; font-weight:600; color:var(--text-2); margin-bottom:3px; }
.req { color:#ef4444; }
.lang-badge { display:inline-block; background:rgba(99,102,241,.12); color:#6366f1; border-radius:4px; padding:0 5px; font-size:10px; margin-left:5px; }
.form-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.form-input {
  width:100%; padding:7px 10px; border-radius:7px; font-size:12.5px;
  border:1px solid var(--border); background:var(--bg-2); color:var(--text-1);
  outline:none; transition:border-color .15s; box-sizing:border-box;
}
.form-input:focus { border-color:var(--accent); }
.form-input--sm { padding:4px 6px; font-size:11.5px; }
.sale-price { border-color:rgba(239,68,68,.4); color:#ef4444; }
.sale-price:focus { border-color:#ef4444; }

/* ── Lang tabs ── */
.lang-tabs { display:flex; gap:6px; margin-bottom:2px; }
.lang-tab {
  padding:4px 12px; border-radius:6px; border:1px solid var(--border);
  background:var(--bg-2); color:var(--text-2); font-size:12px; font-weight:600; cursor:pointer; transition:all .15s;
}
.lang-tab--active { background:var(--accent); border-color:var(--accent); color:#fff; }

/* ── Product search ── */
.product-search { position:relative; margin-bottom:12px; }
.product-search__icon { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--text-3); pointer-events:none; }
.product-search__input {
  width:100%; padding:8px 10px 8px 28px; border-radius:7px; font-size:12.5px;
  border:1px solid var(--border); background:var(--bg-2); color:var(--text-1);
  outline:none; box-sizing:border-box; transition:border-color .15s;
}
.product-search__input:focus { border-color:var(--accent); }
.product-search__dropdown {
  position:absolute; top:calc(100% + 3px); left:0; right:0; z-index:50;
  background:var(--bg-1); border:1px solid var(--border); border-radius:9px;
  box-shadow:0 8px 24px rgba(0,0,0,.15); max-height:260px; overflow-y:auto;
}
.product-search__item {
  display:flex; align-items:center; gap:8px; padding:8px 12px;
  cursor:pointer; font-size:12.5px; color:var(--text-1); transition:background .1s;
}
.product-search__item:hover { background:var(--bg-2); }
.product-search__thumb { width:32px; height:32px; border-radius:5px; object-fit:cover; flex-shrink:0; }
.product-search__name { flex:1; font-weight:500; }
.product-search__price { color:var(--accent); font-weight:700; font-size:11px; }

/* ── Items table ── */
.items-wrap { border:1px solid var(--border); border-radius:8px; overflow:hidden; }
.items-table { width:100%; border-collapse:collapse; font-size:11.5px; }
.items-table th {
  padding:6px 8px; background:var(--bg-2); border-bottom:1px solid var(--border);
  text-align:left; font-size:10px; font-weight:700; text-transform:uppercase; color:var(--text-3);
}
.items-table td { padding:6px 8px; border-bottom:1px solid var(--border); vertical-align:middle; }
.items-table tr:last-child td { border-bottom:none; }
.item-product { display:flex; align-items:center; gap:6px; color:var(--text-1); font-weight:500; }
.item-thumb { width:26px; height:26px; border-radius:4px; object-fit:cover; flex-shrink:0; }
.btn-remove {
  display:inline-flex; align-items:center; justify-content:center;
  width:22px; height:22px; border-radius:5px; border:1px solid var(--border);
  background:transparent; cursor:pointer; color:var(--text-3); transition:all .12s;
}
.btn-remove:hover { background:rgba(239,68,68,.08); color:#ef4444; border-color:rgba(239,68,68,.4); }
.items-empty {
  display:flex; flex-direction:column; align-items:center; gap:6px;
  padding:24px 16px; color:var(--text-3); font-size:12px;
}

/* ── Toggle ── */
.toggle-row { display:flex; align-items:center; justify-content:space-between; font-size:12.5px; color:var(--text-1); }
.toggle { position:relative; display:inline-block; width:34px; height:20px; cursor:pointer; flex-shrink:0; }
.toggle input { opacity:0; width:0; height:0; }
.toggle__dot { position:absolute; inset:0; border-radius:20px; background:var(--bg-3); transition:background .2s; }
.toggle__dot::before {
  content:''; position:absolute; width:14px; height:14px; border-radius:50%;
  background:#fff; left:3px; top:3px; transition:transform .2s; box-shadow:0 1px 3px rgba(0,0,0,.2);
}
.toggle input:checked + .toggle__dot { background:var(--accent); }
.toggle input:checked + .toggle__dot::before { transform:translateX(14px); }

/* ── Preview ── */
.preview-name { font-size:13px; font-weight:700; color:var(--text-1); margin-bottom:6px; }
.preview-time { display:flex; align-items:center; gap:4px; font-size:11px; color:var(--text-2); margin-bottom:4px; }
.preview-count { font-size:11px; color:var(--accent); font-weight:700; }

@media (max-width: 700px) {
  .fsf-body { flex-direction:column; }
  .fsf-col--side { position:static; }
}
</style>
