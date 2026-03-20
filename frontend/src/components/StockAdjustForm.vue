<template>
  <div class="stock-adjust-page">
    <div class="sa-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="sa-header__center">
        <div class="sa-header__icon"><Package :size="15" /></div>
        <h3>Quản lý Tồn Kho — {{ product?.name || t('admin.msg_d5fe42f6', 'Đang tải...') }}</h3>
      </div>
      <div class="sa-actions">
      </div>
    </div>

    <div v-if="loading" class="sa-loading">
      <Loader2 :size="24" class="spin" /> <p>{{ t('admin.msg_54033c7f', 'Đang tải dữ liệu...') }}</p>
    </div>

    <div v-else-if="product" class="sa-content">
      <!-- Two columns layout -->
      <div class="sa-col sa-col--left">
        <!-- Info & Adjust Card -->
        <div class="sa-card">
          <h4><BarChart3 :size="16" /> {{ t('admin.msg_e96b5359', 'Điều chỉnh tồn kho') }}</h4>
          
          <div class="product-summary">
            <div class="ps-row"><span>SKU:</span> <strong>{{ product.sku || '—' }}</strong></div>
            <div class="ps-row"><span>{{ t('admin.msg_43c21243', 'Giá bán:') }}</span> <strong>{{ formatCurrency(product.price) }}</strong></div>
            <div class="ps-row"><span>{{ t('admin.msg_c062022e', 'Tồn kho hiện tại:') }}</span><strong class="stock-highlight">{{ product.stock }} {{ product.unit || 'cái' }}</strong></div>
          </div>

          <div class="form-divider">{{ t('admin.msg_9905427a', 'Thực hiện điều chỉnh') }}</div>

          <div class="adjust-mode">
            <button class="mode-btn" :class="{ active: adjustMode === 'add' }" @click="setMode('add')">
              <Plus :size="14" />{{ t('admin.msg_94e97353', 'Nhập kho') }}</button>
            <button class="mode-btn" :class="{ active: adjustMode === 'deduct' }" @click="setMode('deduct')">
              <Minus :size="14" />{{ t('admin.msg_25af27c7', 'Xuất kho') }}</button>
            <button class="mode-btn" :class="{ active: adjustMode === 'set' }" @click="setMode('set')">
              <Edit :size="14" /> Đặt số lượng
            </button>
          </div>

          <div class="adjust-preview">
            <div class="adjust-current">{{ t('admin.msg_e8b0a14d', 'Hiện tại:') }} <strong>{{ product.stock }}</strong></div>
            <div class="adjust-arrow">→</div>
            <div class="adjust-new" :class="{ positive: adjustFinalStock > product.stock, negative: adjustFinalStock < product.stock }">
              Sau điều chỉnh: <strong>{{ adjustFinalStock }}</strong>
            </div>
          </div>

          <div class="form-grid" style="margin-top:16px">
            <div class="form-group span-2">
              <label>{{ adjustMode === 'set' ? t('admin.msg_08ca32d1', 'Số lượng mới') : t('admin.msg_8585140c', 'Biến động') }} ({{ product.unit || t('admin.msg_50c7e101', 'cái') }})</label>
              <input type="number" v-model.number="adjustQty" min="0" class="form-input" />
            </div>
            <div class="form-group span-2">
              <label>{{ t('admin.msg_f14e1365', 'Lý do điều chỉnh *') }}</label>
              <input v-model="adjustReason" class="form-input" :placeholder="t('admin.msg_ca2bdd', 'VD: Nhập hàng mới, trả hàng, lỗi...')" @keyup.enter="submitAdjust" />
            </div>
          </div>

          <button class="btn-primary" style="margin-top: 20px; width: 100%; justify-content: center;" @click="submitAdjust" :disabled="saving || !adjustReason">
            <Loader2 v-if="saving" :size="14" class="spin" />
            <CheckCircle v-else :size="14" />
            {{ saving ? t('admin.msg_4d30b6f8', 'Đang lưu...') : t('admin.msg_749d5fbf', 'Xác nhận điều chỉnh') }}
          </button>
        </div>
      </div>

      <div class="sa-col sa-col--right">
        <!-- History Card -->
        <div class="sa-card history-card">
          <h4><History :size="16" /> {{ t('admin.msg_6fb3f53d', 'Lịch sử biến động') }}</h4>
          
          <div class="history-timeline" v-if="stockHistoryData.length > 0">
            <div v-for="entry in stockHistoryData" :key="entry.id" class="history-item">
              <div class="history-dot" :class="entry.action"></div>
              <div class="history-content">
                <div class="history-action">
                  <span class="history-badge" :class="entry.action">{{ actionLabels[entry.action] || entry.action }}</span>
                  <span class="history-change" :class="{ positive: entry.quantityChange > 0, negative: entry.quantityChange < 0 }">
                    {{ entry.quantityChange > 0 ? '+' : '' }}{{ entry.quantityChange }}
                  </span>
                </div>
                <div class="history-detail">{{ entry.stockBefore }} → {{ entry.stockAfter }} {{ product.unit || t('admin.msg_50c7e101', 'cái') }}</div>
                <div class="history-reason" v-if="entry.reason">{{ entry.reason }}</div>
                <div class="history-time">{{ formatDate(entry.createdAt) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <History :size="32" class="empty-state__icon" />
            <p class="empty-state__title">{{ t('admin.msg_912f855b', 'Chưa có biến động kho') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, Package, BarChart3, Plus, Minus, Edit, History, Loader2, CheckCircle } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const props = defineProps({ productId: { type: [Number, String], required: true } })
const emit = defineEmits(['back', 'updated'])

const loading = ref(true)
const saving = ref(false)
const product = ref(null)
const stockHistoryData = ref([])

const adjustMode = ref('add') // 'add' | 'deduct' | 'set'
const adjustQty = ref(0)
const adjustReason = ref('')

const actionLabels = {
  add: t('admin.msg_94e97353', 'Nhập kho'),
  deduct: t('admin.msg_25af27c7', 'Xuất kho'),
  adjust: t('admin.msg_6a48ef4e', 'Điều chỉnh'),
  order_confirmed: t('admin.msg_f5e439b9', 'Đơn xác nhận'),
  order_cancelled: t('admin.msg_e978b912', 'Đơn hủy'),
}

onMounted(() => {
  loadData()
})

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

async function loadData() {
  loading.value = true
  try {
    const [prodRes, histRes] = await Promise.all([
      apiFetch(`/products`), // Fallback to list if /products/:id doesn't exist
      apiFetch(`/products/${props.productId}/stock-history`)
    ])
    
    // Find the product
    const prodList = mapKeys(await prodRes.json())
    product.value = Array.isArray(prodList) ? prodList.find(p => p.id == props.productId) : null

    const histData = await histRes.json()
    stockHistoryData.value = mapKeys(histData.data || histData || [])
  } catch (error) {
    showToast(t('admin.msg_6b6071', 'Lỗi tải dữ liệu kho'), 'error')
  } finally {
    loading.value = false
  }
}

function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const adjustFinalStock = computed(() => {
  const current = product.value?.stock || 0
  if (adjustMode.value === 'add') return current + (adjustQty.value || 0)
  if (adjustMode.value === 'deduct') return Math.max(0, current - (adjustQty.value || 0))
  return adjustQty.value || 0
})

function setMode(mode) {
  adjustMode.value = mode
  adjustQty.value = mode === 'set' ? product.value?.stock : 0
}

async function submitAdjust() {
  if (!adjustReason.value.trim()) return showToast(t('admin.msg_7e0532', 'Vui lòng nhập lý do'), 'error')
  saving.value = true
  try {
    await apiFetch(`/products/${props.productId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ newStock: adjustFinalStock.value, reason: adjustReason.value }),
    })
    showToast(t('admin.msg_stock_adjusted', 'Đã điều chỉnh kho thành công!'), 'success')
    adjustReason.value = ''
    adjustQty.value = 0
    await loadData() // Refresh
    emit('updated')
  } catch (err) { 
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + err.message, 'error') 
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.stock-adjust-page { animation: fadeUp .2s ease; max-width: 1000px; margin: 0 auto; padding-bottom: 40px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.sa-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.sa-header__center { display: flex; align-items: center; gap: 8px; }
.sa-header__icon { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.sa-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-1); }

.sa-actions { display: flex; gap: 8px; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-1); font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }

.sa-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: var(--text-muted); gap: 12px; }

.sa-content { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }

.sa-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.sa-card h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 20px; font-size: 16px; font-weight: 700; color: var(--text-1); border-bottom: 1px solid var(--border); padding-bottom: 12px; }

/* Product Summary */
.product-summary { padding: 16px; background: var(--bg-2); border-radius: 10px; border: 1px solid var(--border); margin-bottom: 24px; }
.ps-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
.ps-row:last-child { margin-bottom: 0; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); }
.ps-row span { color: var(--text-2); font-weight: 600; }
.ps-row strong { color: var(--text-1); font-weight: 700; }
.stock-highlight { color: #10b981 !important; font-size: 15px; }

.form-divider { text-align: center; font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 16px; position: relative; }
.form-divider::before, .form-divider::after { content: ''; position: absolute; top: 50%; width: 30%; height: 1px; background: var(--border); }
.form-divider::before { left: 0; } .form-divider::after { right: 0; }

/* Adjust Modes */
.adjust-mode { display: flex; gap: 8px; margin-bottom: 16px; }
.mode-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
.mode-btn:hover { border-color: var(--accent); color: var(--text-1); }
.mode-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; box-shadow: var(--shadow-sm); }

/* Preview */
.adjust-preview { display: flex; align-items: center; justify-content: center; gap: 16px; padding: 16px; background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.2); border-radius: 10px; margin-bottom: 20px; }
.adjust-current, .adjust-new { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 12px; color: var(--text-2); }
.adjust-current strong { font-size: 20px; color: var(--text-1); }
.adjust-new strong { font-size: 24px; color: var(--text-1); }
.adjust-arrow { color: var(--text-muted); font-size: 20px; }
.adjust-new.positive strong { color: #10b981; }
.adjust-new.negative strong { color: #ef4444; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; color: var(--text-2); margin-bottom: 6px; font-weight: 700; }
.form-input { width: 100%; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); padding: 12px 14px; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: var(--accent); background: var(--bg-1); }
.btn-primary { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 14px; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-sm); transition: opacity .2s; }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

/* History Timeline */
.history-card { min-height: 400px; }
.history-timeline { position: relative; padding-left: 14px; }
.history-timeline::before { content: ''; position: absolute; left: 6px; top: 10px; bottom: 10px; width: 2px; background: var(--border); border-radius: 2px; }
.history-item { position: relative; padding-bottom: 24px; }
.history-item:last-child { padding-bottom: 0; }
.history-dot { position: absolute; left: -14px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--bg-2); border: 2px solid var(--border); z-index: 2; box-shadow: 0 0 0 4px var(--bg-1); }
.history-dot.add { background: #10b981; border-color: #10b981; }
.history-dot.deduct, .history-dot.order_confirmed { background: #f59e0b; border-color: #f59e0b; }
.history-dot.adjust { background: #3b82f6; border-color: #3b82f6; }
.history-content { padding-left: 12px; }
.history-action { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.history-badge { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--bg-2); color: var(--text-2); }
.history-badge.add { background: rgba(16,185,129,0.1); color: #10b981; }
.history-badge.deduct { background: rgba(245,158,11,0.1); color: #f59e0b; }
.history-badge.adjust { background: rgba(59,130,246,0.1); color: #3b82f6; }
.history-change { font-size: 14px; font-weight: 800; font-family: monospace; }
.history-change.positive { color: #10b981; }
.history-change.negative { color: #f59e0b; }
.history-detail { font-size: 13px; color: var(--text-1); margin-bottom: 4px; font-weight: 600; }
.history-reason { font-size: 13px; color: var(--text-2); margin-bottom: 4px; line-height: 1.4; background: var(--bg-2); padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); }
.history-time { font-size: 11px; color: var(--text-muted); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; color: var(--text-muted); gap: 12px; }
.empty-state__icon { opacity: 0.5; }
.empty-state__title { font-size: 14px; font-weight: 600; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
