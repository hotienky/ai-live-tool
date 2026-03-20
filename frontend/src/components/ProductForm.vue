<template>
  <div class="product-form-page">
    <div class="form-page-header">
      <button class="btn-back" @click="goBackToList"><ChevronLeft :size="16" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <h3>{{ isEditing ? t('admin.msg_0e0e4b4a', 'Sửa sản phẩm') : t('admin.msg_cece2ab1', 'Thêm sản phẩm mới') }}</h3>
      <button class="btn-save" @click="handleSave" :disabled="!form.name || !form.price">
        {{ isEditing ? t('admin.msg_3b7db4b6', 'Cập nhật') : t('admin.msg_3eb7247a', 'Tạo sản phẩm') }}
      </button>
    </div>

    <div class="form-page-body">
      <!-- Left Column: Basic Info -->
      <div class="form-col form-col--main">
        <LanguageTabs v-model="currentLang" :translations="form.translations" :fields="['name', 'description', 'meta_title', 'meta_description']" :baseData="form" />

        <div class="form-card">
          <h4>{{ t('admin.msg_41100f72', 'Thông tin cơ bản') }}</h4>
          <div class="form-row">
            <div class="form-group form-group--flex">
              <label>{{ t('admin.msg_57ba303e', 'Tên sản phẩm *') }}</label>
              <input v-model="fName" :placeholder="t('admin.product_name', 'Tên sản phẩm')" />
            </div>
            <div class="form-group">
              <label>SKU</label>
              <input v-model="form.sku" :placeholder="t('admin.msg_e195ed', 'Mã SKU')" />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.msg_0a3e406f', 'Giá *') }}</label>
              <CurrencyInput v-model="form.price" placeholder="0" input-class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.promo_sale_price', 'Giá khuyến mãi') }}</label>
              <CurrencyInput v-model="form.promotion_price" placeholder="0" input-class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_5cb7bf4f', 'Số lượng tồn') }}</label>
              <input v-model.number="form.stock" type="number" placeholder="0" />
            </div>
          </div>

          <div class="form-row" v-if="form.promotion_price">
            <div class="form-group">
              <label>{{ t('admin.msg_d0292dd2', 'Bắt đầu KM') }}</label>
              <input v-model="form.promotion_start" type="datetime-local" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_e00580de', 'Kết thúc KM') }}</label>
              <input v-model="form.promotion_end" type="datetime-local" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }}</label>
            <textarea v-model="fDescription" rows="5" :placeholder="t('admin.msg_e64235', 'Mô tả sản phẩm...')"></textarea>
          </div>
        </div>

        <!-- SEO Section -->
        <div class="form-card">
          <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 700">🔍 SEO</h4>
          <div class="form-group">
            <label>Meta Title</label>
            <input v-model="fMetaTitle" :placeholder="t('admin.msg_073024', 'Tiêu đề SEO (tự động nếu để trống)')" />
          </div>
          <div class="form-group">
            <label>Meta Description</label>
            <textarea v-model="fMetaDesc" rows="2" :placeholder="t('admin.msg_9de927', 'Mô tả SEO (tự động nếu để trống)')"></textarea>
          </div>
          <div class="form-group">
            <label>Meta Keywords</label>
            <input v-model="form.meta_keywords" placeholder="keyword1, keyword2, ..." />
          </div>
        </div>

        <!-- Variants Section -->
        <div class="form-card">
          <div class="variants-header">
            <h4><Layers :size="14" /> Biến thể sản phẩm ({{ form.variants.length }})</h4>
            <button type="button" class="btn-add-variant" @click="addVariant">{{ t('admin.msg_0f39aa4f', '+ Thêm biến thể') }}</button>
          </div>

          <!-- Smart sale toggle -->
          <div class="variant-sale-toggle" v-if="form.variants.length > 0 && form.promotion_price">
            <label class="toggle-label">
              <input type="checkbox" v-model="applyPromoToAll" @change="onPromoToggle" />
              <span>{{ t('admin.msg_7bdf99f2', 'Áp dụng KM cho tất cả biến thể') }}</span>
            </label>
            <span class="toggle-hint" v-if="applyPromoToAll && form.price && form.promotion_price">
              Giảm {{ Math.round((1 - form.promotion_price / form.price) * 100) }}% — tự động tính cho mỗi biến thể
            </span>
          </div>

          <div class="variant-list" v-if="form.variants.length">
            <div class="variant-card" v-for="(v, vi) in form.variants" :key="vi">
              <div class="variant-row">
                <div class="form-group form-group--flex">
                  <label>{{ t('admin.msg_435bb80e', 'Tên biến thể') }}</label>
                  <input v-model="v.name" :placeholder="t('admin.msg_142d13', 'VD: Đỏ - Size M')" />
                </div>
                <div class="form-group">
                  <label>SKU</label>
                  <input v-model="v.sku" :placeholder="t('admin.msg_d88847', 'SKU biến thể')" />
                </div>
                <button class="btn-sm btn-del variant-del" @click="form.variants.splice(vi, 1)" type="button">
                  <Trash2 :size="13" />
                </button>
              </div>
              <div class="variant-row">
                <div class="form-group">
                  <label>{{ t('admin.msg_072c1a4b', 'Giá') }}</label>
                  <CurrencyInput v-model="v.price" placeholder="0" input-class="form-input" />
                </div>
                <div class="form-group">
                  <label>{{ t('admin.msg_8ad259c6', 'Giá KM') }}</label>
                  <CurrencyInput
                    v-model="v.promotion_price"
                    placeholder="0"
                    input-class="form-input"
                    :disabled="applyPromoToAll"
                  />
                  <span class="form-hint variant-promo-hint" v-if="applyPromoToAll && v.price && form.price && form.promotion_price">
                    = {{ formatPrice(Math.round(v.price * form.promotion_price / form.price)) }}
                  </span>
                </div>
                <div class="form-group">
                  <label>{{ t('admin.stock', 'Tồn kho') }}</label>
                  <input v-model.number="v.stock" type="number" placeholder="0" />
                </div>
                <div class="form-group form-group--flex">
                  <label>{{ t('admin.msg_3c6f3361', 'Ảnh') }}</label>
                  <MediaPicker v-model="v.image" :placeholder="t('admin.msg_07d297', 'Chọn ảnh biến thể...')" accept="image/*" />
                </div>
              </div>
            </div>
          </div>
          <p v-else class="form-hint">{{ t('admin.msg_131ff082', 'Không có biến thể. Sản phẩm đơn giản sẽ dùng giá/tồn kho ở trên.') }}</p>
        </div>
      </div>

      <!-- Right Column: Metadata -->
      <div class="form-col form-col--side">
        <div class="form-card">
          <h4>{{ t('admin.msg_099cc004', 'Phân loại') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.msg_53d8de58', 'Danh mục') }}</label>
            <select v-model="form.category">
              <option value="">{{ t('admin.msg_223a13d3', '-- Chọn danh mục --') }}</option>
              <option v-for="c in categories" :key="c.id" :value="c.name">{{ c.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_161416d9', 'Thương hiệu') }}</label>
            <select v-model="form.brand">
              <option value="">{{ t('admin.msg_9441744c', '-- Chọn thương hiệu --') }}</option>
              <option v-for="b in brands" :key="b.id" :value="b.name">{{ b.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>Keywords</label>
            <input v-model="form.keywords" placeholder="keyword1, keyword2, ..." />
          </div>
        </div>

        <div class="form-card">
          <h4>{{ t('admin.msg_a6e668c0', 'Hình ảnh sản phẩm') }}</h4>
          <div class="images-gallery">
            <div class="img-item" v-for="(img, idx) in form.images" :key="idx">
              <img :src="img" alt="" @error="$event.target.style.display='none'" />
              <button class="img-remove" @click="form.images.splice(idx, 1)" type="button">&times;</button>
              <span class="img-main-badge" v-if="idx === 0">{{ t('admin.msg_e12d5116', 'Chính') }}</span>
            </div>
            <div class="img-add">
              <MediaPicker v-model="newImageUrl" :placeholder="t('admin.msg_efcbcc', 'Chọn ảnh từ Media...')" accept="image/*" />
              <button type="button" @click="addImage" :disabled="!newImageUrl.trim()">+</button>
            </div>
          </div>
          <p class="form-hint" v-if="form.images.length">{{ t('admin.msg_6c005081', 'Ảnh đầu tiên = ảnh chính.') }}</p>
        </div>

        <div class="form-card">
          <h4>{{ t('admin.install', 'Cài đặt') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.msg_aab08b4e', 'Ngưỡng cảnh báo hết hàng') }}</label>
            <input v-model.number="form.low_stock_threshold" type="number" placeholder="5" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.status', 'Trạng thái') }}</label>
            <select v-model="form.is_active">
              <option :value="true">Active</option>
              <option :value="false">{{ t('admin.hidden', 'Ẩn') }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { ShoppingBag, Layers, Trash2, ChevronLeft, Edit3 } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'
import LanguageTabs from './LanguageTabs.vue'
import MediaPicker from './MediaPicker.vue'
import { useI18n } from '../composables/useI18n.js'
import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  languagesInstalled: { type: Boolean, default: false },
  editId: { type: [String, Number], default: null },
})
const emit = defineEmits(['back', 'saved'])

const categories = ref([])
const brands = ref([])
const isEditing = ref(!!props.editId)
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

const form = ref(defaultForm())
const newImageUrl = ref('')

const { tField } = useContentTranslations(form, currentLang)

const fName = tField('name')
const fDescription = tField('description')
const fMetaTitle = tField('meta_title')
const fMetaDesc = tField('meta_description')

const applyPromoToAll = ref(true)

function defaultForm() {
  return {
    name: '', sku: '', price: '', promotion_price: '', promotion_start: '', promotion_end: '', stock: 0, category: '', brand: '',
    keywords: '', description: '', low_stock_threshold: 5, is_active: true,
    meta_title: '', meta_description: '', meta_keywords: '',
    images: [],
    variants: [],
    translations: {},
  }
}

function addImage() {
  const url = newImageUrl.value.trim()
  if (url && !form.value.images.includes(url)) {
    form.value.images.push(url)
    newImageUrl.value = ''
  }
}

function addVariant() {
  form.value.variants.push({ name: '', sku: '', price: '', promotion_price: '', stock: 0, image: '' })
}

function onPromoToggle() {
  if (applyPromoToAll.value && form.value.price && form.value.promotion_price) {
    const ratio = form.value.promotion_price / form.value.price
    form.value.variants.forEach(v => {
      if (v.price) v.promotion_price = Math.round(v.price * ratio)
    })
  }
}

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }

function goBackToList() {
  emit('back')
}

async function fetchCategories() {
  try {
    const res = await apiFetch('/categories')
    const data = await res.json()
    categories.value = Array.isArray(data) ? data : (data.data || [])
  } catch { categories.value = [] }
}

async function fetchBrands() {
  try {
    const res = await apiFetch('/brands')
    const data = await res.json()
    brands.value = Array.isArray(data) ? data : (data.data || [])
  } catch { brands.value = [] }
}

async function loadProductForEdit(id) {
  try {
    const res = await apiFetch(`/products/${id}`)
    const p = await res.json()
    if (!p || (p.type === 'error')) {
      showToast(t('admin.msg_5e1cab', 'Không tìm thấy sản phẩm'), 'error')
      emit('back')
      return
    }

    const imgs = p.images ? (typeof p.images === 'string' ? JSON.parse(p.images) : p.images) : []
    const vars = p.variants ? (typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants) : []
    if (imgs.length === 0 && (p.image || p.image_url)) imgs.push(p.image || p.image_url)

    // Resolve category name - API may return category as object {id, name, ...} or string or null
    let categoryName = ''
    if (p.category && typeof p.category === 'object') {
      categoryName = p.category.name || ''
    } else if (typeof p.category === 'string') {
      categoryName = p.category
    } else if (p.category_id && categories.value.length) {
      const found = categories.value.find(c => c.id == p.category_id)
      categoryName = found?.name || ''
    }

    // Resolve brand name - same logic
    let brandName = ''
    if (p.brand && typeof p.brand === 'object') {
      brandName = p.brand.name || ''
    } else if (typeof p.brand === 'string') {
      brandName = p.brand
    } else if (p.brand_id && brands.value.length) {
      const found = brands.value.find(b => b.id == p.brand_id)
      brandName = found?.name || ''
    }

    // Keywords: API returns array (cast), join to comma string for input
    const keywordsStr = Array.isArray(p.keywords)
      ? p.keywords.join(', ')
      : (typeof p.keywords === 'string' ? p.keywords : '')

    form.value = {
      name: p.name || '', sku: p.sku || '', price: p.price || 0,
      promotion_price: p.promotion_price || '', promotion_start: p.promotion_start || '', promotion_end: p.promotion_end || '', stock: p.stock || 0,
      category: categoryName, brand: brandName,
      keywords: keywordsStr,
      description: p.description || '',
      low_stock_threshold: p.low_stock_threshold || p.lowStockThreshold || 5,
      is_active: p.is_active ?? (p.status === 1 ? true : (p.status === 0 ? false : true)),
      meta_title: p.meta_title || '', meta_description: p.meta_description || '', meta_keywords: p.meta_keywords || '',
      images: imgs,
      translations: {},
      variants: vars.map(v => ({
        ...v,
        promotion_price: v.promotion_price || '',
      })),
    }

    if (vars.length > 0 && p.promotion_price && p.price) {
      const productRatio = p.promotion_price / p.price
      const allSameRatio = vars.every(v => {
        if (!v.promotion_price || !v.price) return true
        const vRatio = v.promotion_price / v.price
        return Math.abs(vRatio - productRatio) < 0.02
      })
      applyPromoToAll.value = allSameRatio
    } else {
      applyPromoToAll.value = true
    }

    // Fetch translations
    try {
      const transRes = await apiFetch(`/languages/content/products/${p.id}`)
      const transData = await transRes.json()
      if (transData?.grouped) {
        form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
      }
    } catch (e) {
      console.warn('Could not load translations:', e)
    }

  } catch (e) {
    showToast(t('admin.msg_139d98', 'Lỗi tải sản phẩm'), 'error')
    emit('back')
  }
}

async function handleSave() {
  if (!form.value.name || !form.value.price) return
  try {
    if (applyPromoToAll.value && form.value.price && form.value.promotion_price) {
      const ratio = form.value.promotion_price / form.value.price
      form.value.variants.forEach(v => {
        if (v.price) v.promotion_price = Math.round(v.price * ratio)
      })
    }

    const body = {
      ...form.value,
      image: form.value.images.length > 0 ? form.value.images[0] : '',
    }
    if (isEditing.value) {
      const res = await apiFetch(`/products/${props.editId}`, { method: 'PUT', body: JSON.stringify(body) })
      await res.json() // throws if API returns type:error
      showToast(t('admin.msg_287b0f', 'Đã cập nhật sản phẩm'), 'success')
      emit('saved')
    } else {
      const res = await apiFetch('/products', { method: 'POST', body: JSON.stringify(body) })
      const addedProduct = await res.json() // throws if API returns type:error
      showToast(t('admin.msg_7a810a', 'Đã thêm sản phẩm'), 'success')
      emit('saved', addedProduct?.id)
    }
  } catch (e) {
    showToast('Lỗi: ' + (e.message || 'Unknown'), 'error')
  }
}

onMounted(async () => {
  // Load categories and brands first so category_id can be resolved to name
  await Promise.all([fetchCategories(), fetchBrands()])
  if (props.editId) {
    loadProductForEdit(props.editId)
  }
})
</script>

<style scoped>
/* Full Page Form */
.product-form-page {
  animation: slideIn 0.25s ease;
}
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);
}
.form-page-header h3 { margin: 0; font-size: 17px; font-weight: 700; flex: 1; text-align: center; }
.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.form-page-body {
  display: flex; gap: 20px; align-items: flex-start;
}
.form-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.form-col--side { flex: 3; min-width: 240px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

.form-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}
.form-card h4 {
  font-size: 14px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary);
}

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.form-group--flex { flex: 1; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }

.images-gallery { display: flex; flex-wrap: wrap; gap: 8px; }
.img-item {
  position: relative; width: 80px; height: 80px; border-radius: 8px; overflow: hidden;
  border: 1px solid var(--color-border);
}
.img-item img { width: 100%; height: 100%; object-fit: cover; }
.img-remove {
  position: absolute; top: 2px; right: 2px; width: 18px; height: 18px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.6); color: #fff;
  font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  line-height: 1;
}
.img-main-badge {
  position: absolute; bottom: 2px; left: 2px; font-size: 9px; font-weight: 700;
  background: var(--color-accent-primary); color: #fff; padding: 1px 6px; border-radius: 4px;
}
.img-add { display: flex; align-items: center; gap: 4px; width: 100%; }
.img-add input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px; outline: none; }
.img-add button { padding: 6px 12px; border-radius: 6px; border: none; background: var(--color-accent-primary); color: #fff; font-weight: 700; font-size: 14px; cursor: pointer; }
.img-add button:disabled { opacity: 0.4; cursor: not-allowed; }
.form-hint { font-size: 11px; color: var(--color-text-muted); margin: 4px 0 0; }

/* Variants Section */
.variants-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.btn-add-variant { padding: 4px 12px; border-radius: 6px; border: 1px dashed var(--color-accent-primary); background: transparent; color: var(--color-accent-primary); font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-add-variant:hover { background: var(--color-accent-glow); }
.variant-list { display: flex; flex-direction: column; gap: 10px; }
.variant-card { padding: 12px; border-radius: 10px; background: var(--color-bg-primary); border: 1px solid var(--color-border); }
.variant-row { display: flex; gap: 8px; align-items: flex-end; }
.variant-row .form-group { margin-bottom: 6px; }
.variant-del { flex-shrink: 0; margin-bottom: 6px; }

/* Variant sale toggle */
.variant-sale-toggle { padding: 10px 14px; border-radius: 8px; margin-bottom: 12px; background: var(--color-accent-glow); border: 1px solid var(--color-accent-primary); }
.toggle-label { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--color-text-primary); cursor: pointer; }
.toggle-label input[type="checkbox"] { accent-color: var(--color-accent-primary); width: 16px; height: 16px; cursor: pointer; }
.toggle-hint { display: block; font-size: 11px; color: var(--color-accent-primary); margin-top: 4px; font-weight: 500; }
.variant-promo-hint { color: var(--color-accent-primary); font-weight: 600; }

.btn-save { padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-sm { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
.btn-del:hover, .act-cancel:hover { color: #ef4444; border-color: #ef4444; }

@media (max-width: 768px) {
  .form-page-body { flex-direction: column; }
  .form-col--side { position: static; }
}
</style>
