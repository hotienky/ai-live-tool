<template>
  <div class="fsf-page">
    <!-- Page Header -->
    <div class="fsf-header">
      <button class="btn-back" @click="goBack">
        <ChevronLeft :size="16" /> {{ t('admin.back', 'Quay lại') }}
      </button>
      <div class="fsf-header__title-wrap">
        <div class="fsf-header__icon"><Zap :size="16" /></div>
        <h3>{{ isEditing ? t('admin.flash_sale.edit', 'Chỉnh sửa Flash Sale') : t('admin.flash_sale.create', 'Tạo Flash Sale mới') }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        {{ saving ? t('admin.saving', 'Đang lưu...') : (isEditing ? t('admin.update', 'Cập nhật') : t('admin.flash_sale.create', 'Tạo Flash Sale')) }}
      </button>
    </div>

    <!-- Content -->
    <div class="fsf-body">
      <!-- Left Column -->
      <div class="fsf-col fsf-col--main">

        <!-- Language Tabs -->
        <LanguageTabs
          v-model="currentLang"
          :translations="form.translations"
          :fields="['name']"
          :baseData="form"
          style="margin-bottom: 16px;"
        />

        <!-- Basic Info -->
        <div class="fsf-card">
          <h4><Zap :size="14" /> {{ t('admin.flash_sale.program_info', 'Thông tin chương trình') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.flash_sale.name', 'Tên chương trình') }} <span class="required">*</span></label>
            <input v-model="fName" class="form-input" :placeholder="t('admin.flash_sale.name_placeholder', 'VD: Flash Sale cuối tuần, Giảm giá 8/3...')" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.start', 'Bắt đầu') }} <span class="required">*</span></label>
              <input v-model="form.start_date" type="datetime-local" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.end', 'Kết thúc') }} <span class="required">*</span></label>
              <input v-model="form.end_date" type="datetime-local" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Product List -->
        <div class="fsf-card">
          <h4><Package :size="14" /> {{ t('admin.flash_sale.product_list', 'Danh sách sản phẩm') }}</h4>

          <!-- Search -->
          <div class="product-search" v-click-outside="() => showDropdown = false">
            <Search :size="14" class="product-search__icon" />
            <input
              v-model="productSearch"
              class="product-search__input"
              :placeholder="t('admin.flash_sale.search_products', 'Tìm sản phẩm để thêm vào Flash Sale...')"
              @input="onSearch"
              @focus="onSearchFocus"
            />
            <div v-if="showDropdown && searchResults.length > 0" class="product-search__dropdown">
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

          <!-- Items Table -->
          <div v-if="form.items.length > 0" class="items-table-wrap">
            <table class="items-table">
              <thead>
                <tr>
                  <th>{{ t('admin.flash_sale.product', 'Sản phẩm') }}</th>
                  <th>{{ t('admin.flash_sale.original_price', 'Giá gốc (đ)') }}</th>
                  <th>{{ t('admin.flash_sale.sale_price', 'Giá sale (đ)') }}</th>
                  <th>{{ t('admin.flash_sale.stock_limit', 'SL giới hạn') }}</th>
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
                  <td>
                    <button class="btn-icon btn-icon--danger" @click="removeProduct(i)">
                      <X :size="13" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="items-empty">
            <Package :size="28" class="items-empty__icon" />
            <p>{{ t('admin.flash_sale.add_products_hint', 'Tìm và thêm sản phẩm từ ô tìm kiếm phía trên') }}</p>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="fsf-col fsf-col--side">
        <div class="fsf-card">
          <h4>{{ t('admin.settings', 'Cài đặt') }}</h4>
          <div class="form-group form-group--inline">
            <span>{{ t('admin.flash_sale.activate_now', 'Kích hoạt ngay') }}</span>
            <label class="toggle">
              <input type="checkbox" v-model="form.is_active" />
              <span class="toggle__slider"></span>
            </label>
          </div>
          <div class="status-info" v-if="isEditing && editSale">
            <div class="status-row">
              <span class="status-label">{{ t('admin.status', 'Trạng thái') }}</span>
              <span class="badge" :class="badgeClass(editSale)">{{ statusLabel(editSale) }}</span>
            </div>
            <div class="status-row">
              <span class="status-label">{{ t('admin.flash_sale.product', 'Sản phẩm') }}</span>
              <span class="status-val">{{ form.items.length }} SP</span>
            </div>
          </div>
        </div>

        <!-- Preview -->
        <div class="fsf-card fsf-card--preview" v-if="form.name || form.start_date">
          <h4>{{ t('admin.preview', 'Xem trước') }}</h4>
          <div class="preview-block">
            <div class="preview-block__name">{{ fName || t('admin.flash_sale.unnamed', '(Chưa đặt tên)') }}</div>
            <div class="preview-block__time" v-if="form.start_date">
              <Clock :size="12" />
              {{ formatDate(form.start_date) }} → {{ formatDate(form.end_date) }}
            </div>
            <div class="preview-block__products">
              <span>{{ form.items.length }} {{ t('admin.flash_sale.products_count', 'sản phẩm') }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, Zap, Package, Search, Plus, X, Loader2, Clock } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'
import LanguageTabs from './LanguageTabs.vue'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  editId: { type: [String, Number], default: null },
  languagesInstalled: { type: Boolean, default: false },
})
const emit = defineEmits(['back', 'saved'])

const isEditing = computed(() => !!props.editId)
const saving = ref(false)
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)
const editSale = ref(null)

const form = ref({
  name: '',
  start_date: '',
  end_date: '',
  is_active: true,
  items: [],
  translations: {},
})

// Multilingual field binding
const { tField } = useContentTranslations(form, currentLang)
const fName = tField('name')

// Product search
const productSearch = ref('')
const searchResults = ref([])
const showDropdown = ref(false)
let searchTimer = null

// Click outside directive
const vClickOutside = {
  mounted(el, binding) {
    el._clickOutside = (e) => { if (!el.contains(e.target)) binding.value(e) }
    document.addEventListener('click', el._clickOutside)
  },
  unmounted(el) { document.removeEventListener('click', el._clickOutside) },
}

// ── Helpers ──
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function formatPrice(p) {
  return formatCurrency(p || 0)
}
function toLocalDatetime(d) {
  if (!d) return ''
  const dt = new Date(d)
  dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
  return dt.toISOString().slice(0, 16)
}
function statusLabel(sale) {
  if (!sale?.is_active) return t('admin.flash_sale.status_off', 'Tắt')
  const now = new Date()
  const start = new Date(sale.start_date || sale.start_time)
  const end = new Date(sale.end_date || sale.end_time)
  if (start > now) return t('admin.flash_sale.status_upcoming', 'Sắp diễn ra')
  if (end < now) return t('admin.flash_sale.status_expired', 'Hết hạn')
  return t('admin.flash_sale.status_running', 'Đang chạy')
}
function badgeClass(sale) {
  const s = statusLabel(sale)
  if (s === t('admin.flash_sale.status_running', 'Đang chạy')) return 'badge--green'
  if (s === t('admin.flash_sale.status_upcoming', 'Sắp diễn ra')) return 'badge--blue'
  return 'badge--gray'
}

// ── Load product search ──
async function loadInitialProducts() {
  if (searchResults.value.length > 0) return
  try {
    const res = await apiFetch('/products?limit=8')
    const data = await res.json()
    searchResults.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { searchResults.value = [] }
}

function onSearchFocus() {
  showDropdown.value = true
  loadInitialProducts()
}

function onSearch() {
  showDropdown.value = true
  clearTimeout(searchTimer)
  if (!productSearch.value.trim()) { loadInitialProducts(); return }
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
    showToast(t('admin.flash_sale.product_already_added', 'Sản phẩm đã có trong Flash Sale'), 'warning'); return
  }
  form.value.items.push({
    product_id: p.id,
    name: p.name,
    image: p.image_url,
    original_price: p.price,
    sale_price: Math.round(p.price * 0.8),
    stock_limit: 0,
  })
  searchResults.value = searchResults.value.filter(sr => sr.id !== p.id)
  productSearch.value = ''
  showDropdown.value = false
}

function removeProduct(i) { form.value.items.splice(i, 1) }

// ── Load for edit ──
async function loadForEdit(id) {
  try {
    const res = await apiFetch(`/flash-sales/${id}`)
    const data = await res.json()
    const sale = data?.data || data

    if (!sale) { showToast(t('admin.flash_sale.not_found', 'Không tìm thấy Flash Sale'), 'error'); emit('back'); return }
    editSale.value = sale

    form.value = {
      name: sale.name || '',
      start_date: toLocalDatetime(sale.start_date || sale.start_time),
      end_date: toLocalDatetime(sale.end_date || sale.end_time),
      is_active: sale.is_active ?? true,
      items: (sale.items || []).map(item => ({
        product_id: item.product_id,
        name: item.name,
        image: item.image,
        original_price: item.original_price ?? item.price ?? 0,
        sale_price: item.sale_price,
        stock_limit: item.stock_limit || 0,
      })),
      translations: {},
    }

    // Load translations
    try {
      const transRes = await apiFetch(`/languages/content/flash_sales/${id}`)
      const transData = await transRes.json()
      if (transData?.grouped) {
        form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
      }
    } catch (e) {
      console.warn('Could not load flash sale translations:', e)
    }

  } catch (e) {
    showToast(t('admin.flash_sale.load_error', 'Lỗi tải Flash Sale') + ': ' + e.message, 'error')
    emit('back')
  }
}

// ── Save ──
async function handleSave() {
  if (!form.value.name || !form.value.start_date || !form.value.end_date) {
    showToast(t('admin.flash_sale.fill_required', 'Vui lòng điền đầy đủ thông tin bắt buộc'), 'error'); return
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
    const url = isEditing.value ? `/flash-sales/${props.editId}` : '/flash-sales'
    const res = await apiFetch(url, {
      method: isEditing.value ? 'PUT' : 'POST',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.message || t('admin.msg_ea728f61', 'Có lỗi xảy ra'))
    }
    showToast(isEditing.value ? t('admin.flash_sale.updated', 'Đã cập nhật Flash Sale') : t('admin.flash_sale.created', 'Đã tạo Flash Sale mới'), 'success')
    emit('saved')
  } catch (e) {
    showToast(e?.message || t('admin.msg_ea728f61', 'Có lỗi xảy ra'), 'error')
  }
  saving.value = false
}

function goBack() { emit('back') }

onMounted(() => {
  if (props.editId) loadForEdit(props.editId)
})
</script>

<style scoped>
/* ── Page layout ── */
.fsf-page { animation: slideIn 0.25s ease; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Header ── */
.fsf-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);
}
.fsf-header__title-wrap {
  display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center;
}
.fsf-header__icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fsf-header h3 { margin: 0; font-size: 16px; font-weight: 700; color: var(--color-text-primary); }

.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.btn-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.btn-save {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: opacity 0.2s;
}
.btn-save:hover { opacity: 0.9; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Body columns ── */
.fsf-body { display: flex; gap: 20px; align-items: flex-start; }
.fsf-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.fsf-col--side { flex: 3; min-width: 220px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

/* ── Cards ── */
.fsf-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}
.fsf-card h4 {
  font-size: 13px; font-weight: 700; margin: 0 0 14px; color: var(--color-text-primary);
  display: flex; align-items: center; gap: 6px;
}

/* ── Form ── */
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group--inline {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: var(--color-bg-secondary); border-radius: 8px;
  border: 1px solid var(--color-border); font-size: 13px; color: var(--color-text-primary);
}
.required { color: #ef4444; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-input {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
  box-sizing: border-box;
}
.form-input:focus { border-color: var(--color-accent-primary); }
.form-input--sm { padding: 5px 8px; font-size: 12px; }
.sale-input { border-color: rgba(239,68,68,.4); color: #ef4444; }
.sale-input:focus { border-color: #ef4444; }

/* ── Product search ── */
.product-search { position: relative; margin-bottom: 12px; }
.product-search__icon {
  position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted); pointer-events: none;
}
.product-search__input {
  width: 100%; padding: 9px 12px 9px 32px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s; box-sizing: border-box;
}
.product-search__input:focus { border-color: var(--color-accent-primary); }
.product-search__dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,.15); overflow: hidden; max-height: 280px; overflow-y: auto;
}
.product-search__item {
  display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer;
  transition: background .12s; font-size: 13px; color: var(--color-text-primary);
}
.product-search__item:hover { background: var(--color-bg-secondary); }
.product-search__thumb { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.product-search__name { flex: 1; font-weight: 500; }
.product-search__price { color: #f59e0b; font-weight: 700; font-size: 12px; }
.product-search__add { color: var(--color-accent-primary); margin-left: 4px; }

/* ── Items table ── */
.items-table-wrap { border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
.items-table th {
  padding: 8px 10px; background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border);
  text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted);
}
.items-table td { padding: 8px 10px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.items-table tr:last-child td { border-bottom: none; }
.items-table__product { display: flex; align-items: center; gap: 8px; color: var(--color-text-primary); font-weight: 500; }
.items-table__thumb { width: 30px; height: 30px; border-radius: 6px; object-fit: cover; flex-shrink: 0; }
.items-empty {
  text-align: center; padding: 32px 16px; color: var(--color-text-muted);
  display: flex; flex-direction: column; align-items: center; gap: 8px;
}
.items-empty__icon { opacity: 0.4; }
.items-empty p { margin: 0; font-size: 13px; }
.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--color-border); background: transparent; cursor: pointer;
  color: var(--color-text-muted); transition: all .15s;
}
.btn-icon--danger:hover { background: rgba(239,68,68,.08); color: #ef4444; border-color: rgba(239,68,68,.4); }

/* ── Toggle ── */
.toggle { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute; inset: 0; border-radius: 20px;
  background: var(--color-border); transition: background .2s;
}
.toggle__slider::before {
  content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; left: 3px; top: 3px; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle input:checked + .toggle__slider { background: #f59e0b; }
.toggle input:checked + .toggle__slider::before { transform: translateX(16px); }

/* ── Status ── */
.status-info { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 12px; color: var(--color-text-muted); }
.status-val { font-size: 13px; font-weight: 600; color: var(--color-text-primary); }
.badge { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; }
.badge--green { background: rgba(16,185,129,.12); color: #059669; }
.badge--blue  { background: rgba(99,102,241,.12);  color: #4f46e5; }
.badge--gray  { background: var(--color-bg-secondary); color: var(--color-text-muted); }

/* ── Preview ── */
.fsf-card--preview { background: linear-gradient(135deg, rgba(245,158,11,.06), rgba(239,68,68,.06)); border-color: rgba(245,158,11,.3); }
.preview-block { display: flex; flex-direction: column; gap: 8px; }
.preview-block__name { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }
.preview-block__time { display: flex; align-items: center; gap: 4px; font-size: 12px; color: var(--color-text-muted); }
.preview-block__products { font-size: 12px; color: #f59e0b; font-weight: 600; }

@media (max-width: 768px) {
  .fsf-body { flex-direction: column; }
  .fsf-col--side { position: static; }
}
</style>
