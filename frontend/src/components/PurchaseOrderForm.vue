<template>
  <div class="pof-page">
    <div class="pof-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="pof-header__center">
        <div class="pof-header__icon"><ShoppingCart :size="15" /></div>
        <h3>{{ props.editId ? t('admin.msg_f373c2cc', 'Sửa đơn mua hàng') : t('admin.msg_d379a7f1', 'Tạo đơn mua hàng') }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" /> {{ saving ? t('admin.msg_4d30b6f8', 'Đang lưu...') : (props.editId ? t('admin.msg_3b7db4b6', 'Cập nhật') : t('admin.msg_23275279', 'Tạo đơn')) }}
      </button>
    </div>

    <div class="pof-body">
      <div class="pof-col pof-col--main">
        <div class="pof-card">
          <h4><ShoppingCart :size="13" /> {{ t('admin.msg_9fb34cdb', 'Thông tin đơn hàng') }}</h4>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.msg_8f46887f', 'Nhà cung cấp') }} <span class="req">*</span></label>
              <select v-model="form.supplier_id" class="form-input">
                <option :value="null" disabled>{{ t('admin.msg_435bf321', '— Chọn NCC —') }}</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_6f83adc9', 'Ngày đặt') }}</label>
              <input type="date" v-model="form.order_date" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_610dee1b', 'Ngày nhận dự kiến') }}</label>
              <input type="date" v-model="form.expected_date" class="form-input" />
            </div>
          </div>
        </div>

        <!-- Product search -->
        <div class="pof-card">
          <h4>{{ t('admin.msg_98b9f1c4', 'Thêm sản phẩm') }}</h4>
          <div class="product-search-wrap">
            <input v-model="productSearch" class="form-input" :placeholder="t('admin.msg_c20e39', 'Tìm tên SP, SKU...')" @input="searchProducts" />
            <div class="product-dropdown" v-if="productResults.length > 0">
              <div v-for="p in productResults" :key="p.id" class="product-result" @click="addProduct(p)">
                <span class="pr-name">{{ p.name }}</span>
                <span class="pr-sku">{{ p.sku || '' }}</span>
                <span class="pr-price">{{ formatCurrency(p.price || 0) }}</span>
              </div>
            </div>
          </div>

          <div class="items-table" v-if="form.items.length > 0">
            <table>
              <thead><tr><th>{{ t('admin.msg_1d1aa192', 'Sản phẩm') }}</th><th>SKU</th><th style="width:90px">SL</th><th style="width:130px">{{ t('admin.msg_ba2fb8fb', 'Đơn giá') }}</th><th style="width:110px">{{ t('admin.msg_b860ba79', 'Thành tiền') }}</th><th style="width:40px"></th></tr></thead>
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
          <p v-else class="empty-hint">{{ t('admin.msg_95859a1d', 'Chưa có sản phẩm. Tìm và thêm ở trên.') }}</p>
        </div>

        <div class="pof-card">
          <div class="form-row">
            <div class="form-group"><label>{{ t('admin.msg_500aedd2', 'Thuế') }}</label><input type="number" v-model.number="form.tax_amount" min="0" class="form-input" @change="recalcTotal" /></div>
            <div class="form-group"><label>{{ t('admin.msg_6b272d01', 'Giảm giá') }}</label><input type="number" v-model.number="form.discount_amount" min="0" class="form-input" @change="recalcTotal" /></div>
            <div class="form-group"><label>{{ t('admin.msg_d0a16ea2', 'Tổng tiền') }}</label><input type="number" v-model.number="form.total_amount" readonly class="form-input total-input" /></div>
          </div>
          <div class="form-group"><label>{{ t('admin.msg_f481f91e', 'Ghi chú') }}</label><textarea v-model="form.notes" class="form-input" rows="3"></textarea></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, ShoppingCart, Loader2, Trash2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const props = defineProps({ editId: { type: [String, Number], default: null } })
const emit = defineEmits(['saved', 'back'])

const saving = ref(false)
const suppliers = ref([])
const productSearch = ref('')
const productResults = ref([])
let prodTimer = null

const defaultForm = () => ({ supplier_id: null, items: [], tax_amount: 0, discount_amount: 0, total_amount: 0, order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '' })
const form = ref(defaultForm())

onMounted(async () => {
  try {
    const res = await apiFetch('/suppliers?active_only=true')
    const data = await res.json()
    suppliers.value = data.data || data || []
  } catch {}

  if (props.editId) {
    try {
      const res = await apiFetch(`/purchase-orders/${props.editId}`)
      const data = await res.json()
      const po = data.data || data
      form.value = { supplier_id: po.supplier_id, items: po.items || [], tax_amount: po.tax_amount || 0, discount_amount: po.discount_amount || 0, total_amount: po.total_amount || 0, order_date: po.order_date?.slice(0,10) || '', expected_date: po.expected_date?.slice(0,10) || '', notes: po.notes || '' }
    } catch { showToast(t('admin.msg_6d78fa', 'Không tải được đơn hàng'), 'error') }
  }
})

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
  if (form.value.items.find(i => i.product_id === p.id)) { showToast(t('admin.msg_4016fc', 'Đã có trong danh sách'), 'warning'); return }
  form.value.items.push({ product_id: p.id, product_name: p.name, variant_id: null, sku: p.sku || '', qty: 1, unit_price: p.cost_price || p.price || 0 })
  productSearch.value = ''; productResults.value = []
  recalcTotal()
}

function recalcTotal() {
  const subtotal = form.value.items.reduce((s, i) => s + i.qty * i.unit_price, 0)
  form.value.total_amount = subtotal + (form.value.tax_amount || 0) - (form.value.discount_amount || 0)
}

async function handleSave() {
  if (!form.value.supplier_id) return showToast(t('admin.msg_86a6a6', 'Chọn nhà cung cấp'), 'error')
  if (form.value.items.length === 0) return showToast(t('admin.msg_98b9f1', 'Thêm sản phẩm'), 'error')
  saving.value = true
  try {
    if (props.editId) {
      await apiFetch(`/purchase-orders/${props.editId}`, { method: 'PUT', body: JSON.stringify(form.value) })
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await apiFetch('/purchase-orders', { method: 'POST', body: JSON.stringify(form.value) })
      showToast(t('admin.msg_9ae9d5', 'Đã tạo đơn mua hàng'), 'success')
    }
    emit('saved')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
  saving.value = false
}

function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
</script>

<style scoped>
.pof-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.pof-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.pof-header__center { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.pof-header__icon { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.pof-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
.pof-body { display: flex; flex-direction: column; gap: 16px; }
.pof-col--main { display: flex; flex-direction: column; gap: 16px; }
.pof-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.pof-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }
.form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.req { color: #ef4444; }
.form-input { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; box-sizing: border-box; transition: border-color .2s; }
.form-input:focus { border-color: var(--accent); }
.total-input { font-weight: 700; color: #34d399 !important; }
.product-search-wrap { position: relative; margin-bottom: 12px; }
.product-dropdown { position: absolute; top: calc(100%+4px); left: 0; right: 0; z-index: 10; background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.3); }
.product-result { display: flex; align-items: center; gap: 10px; padding: 10px 14px; cursor: pointer; transition: background .15s; font-size: 13px; }
.product-result:hover { background: var(--color-accent-glow); }
.pr-name { flex: 1; font-weight: 600; }
.pr-sku, .pr-price { font-size: 11px; color: var(--color-text-muted); }
.items-table { margin: 8px 0; border: 1px solid var(--color-border); border-radius: 10px; overflow: hidden; }
.items-table table { width: 100%; border-collapse: collapse; font-size: 13px; }
.items-table th { padding: 10px 12px; text-align: left; color: var(--color-text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid var(--color-border); background: var(--color-bg-elevated); }
.items-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border); }
.sku { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.amount { font-weight: 700; color: #34d399; }
.item-input { width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
.btn-rm { background: rgba(239,68,68,.08); border: none; color: #ef4444; border-radius: 6px; padding: 4px; cursor: pointer; }
.empty-hint { font-size: 13px; color: var(--color-text-muted); text-align: center; padding: 16px 0; }
</style>
