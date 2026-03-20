<template>
  <div class="ship-form-page">
    <div class="ship-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="ship-header__center">
        <div class="ship-header__icon"><Truck :size="15" /></div>
        <h3>{{ t('admin.msg_0310b1a7', 'Tạo Vận Đơn Mới') }}</h3>
      </div>
      <div class="ship-actions">
        <!-- Actions here if needed -->
      </div>
    </div>

    <!-- Step indicator -->
    <div class="step-indicator">
      <div class="step" :class="{ active: createStep === 1, done: createStep > 1 }"><span>1</span> {{ t('admin.msg_93b23a08', 'Thông tin') }}</div>
      <div class="step-line"></div>
      <div class="step" :class="{ active: createStep === 2, done: createStep > 2 }"><span>2</span> {{ t('admin.msg_76776039', 'Vận chuyển') }}</div>
      <div class="step-line"></div>
      <div class="step" :class="{ active: createStep === 3 }"><span>3</span> {{ t('admin.msg_1e2eb2de', 'Xác nhận') }}</div>
    </div>

    <div class="sf-body">
      <!-- Step 1: Order/Receiver Info -->
      <div v-if="createStep === 1" class="sf-card">
        <div class="form-group" style="margin-bottom:14px">
          <label>{{ t('admin.msg_a017c06c', 'Tạo từ đơn hàng (tùy chọn)') }}</label>
          <div class="order-lookup">
            <input type="text" v-model="orderLookupId" class="form-input" :placeholder="t('admin.msg_592d36', 'Nhập ID đơn hàng...')" />
            <button @click="lookupOrder" class="btn-lookup" :disabled="!orderLookupId">{{ t('admin.msg_92849db7', 'Tìm') }}</button>
          </div>
          <div v-if="orderLookupResult" class="order-found">
            <CheckCircle :size="14" style="color:#34d399" /> Đơn #{{ orderLookupResult.id }} — {{ orderLookupResult.customerName }} — {{ formatCurrency(orderLookupResult.totalAmount) }}
            <button @click="fillFromOrder" class="btn-fill">{{ t('admin.msg_460b2fc1', 'Điền thông tin') }}</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label>{{ t('admin.msg_bbd13696', 'Người nhận *') }}</label>
            <input v-model="shipForm.receiverName" class="form-input" :placeholder="t('admin.msg_48bfbf', 'Nguyễn Văn A')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_5f338fc2', 'SĐT nhận *') }}</label>
            <input v-model="shipForm.receiverPhone" class="form-input" placeholder="0901234567" />
          </div>
          <div class="form-group span-2">
            <label>{{ t('admin.msg_b71fb900', 'Địa chỉ nhận *') }}</label>
            <input v-model="shipForm.receiverAddress" class="form-input" :placeholder="t('admin.msg_7007f7', '123 Đường ABC, Q1, HCM')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_6678a04e', 'Phường/Xã') }}</label>
            <input v-model="shipForm.receiverWard" class="form-input" :placeholder="t('admin.msg_467a72', 'Phường 1')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_f2fcfd89', 'Quận/Huyện') }}</label>
            <input v-model="shipForm.receiverDistrict" class="form-input" :placeholder="t('admin.msg_6e1f4d', 'Quận 1')" />
          </div>
          <div class="form-group span-2">
            <label>{{ t('admin.msg_62f8a80e', 'Tỉnh/TP') }}</label>
            <input v-model="shipForm.receiverProvince" class="form-input" :placeholder="t('admin.msg_55cb22', 'Hồ Chí Minh')" />
          </div>
        </div>
      </div>

      <!-- Step 2: Carrier & Fees -->
      <div v-if="createStep === 2" class="sf-card">
        <div class="carrier-selector">
          <div v-for="c in carriers" :key="c.key"
            class="carrier-card" :class="{ selected: shipForm.carrier === c.key }"
            @click="shipForm.carrier = c.key">
            <div class="carrier-card__icon"><Truck :size="20" /></div>
            <div class="carrier-card__name">{{ c.name }}</div>
            <div class="carrier-card__desc">{{ c.desc }}</div>
          </div>
        </div>
        <div class="form-grid" style="margin-top:16px">
          <div class="form-group">
            <label>{{ t('admin.msg_63453fb8', 'Phí ship (VNĐ)') }}</label>
            <input type="number" v-model.number="shipForm.shippingFee" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_ee536412', 'COD (VNĐ)') }}</label>
            <input type="number" v-model.number="shipForm.codAmount" class="form-input" placeholder="0" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_0bdd804e', 'Khối lượng (gram)') }}</label>
            <input type="number" v-model.number="shipForm.weight" class="form-input" placeholder="500" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_a279fa9a', 'Phí bảo hiểm') }}</label>
            <input type="number" v-model.number="shipForm.insuranceFee" class="form-input" placeholder="0" />
          </div>
          <div class="form-group span-2">
            <label>{{ t('admin.msg_f481f91e', 'Ghi chú') }}</label>
            <textarea v-model="shipForm.notes" class="form-input" rows="2" :placeholder="t('admin.msg_9cacdd', 'Ghi chú vận đơn...')"></textarea>
          </div>
        </div>
        <button v-if="shipForm.carrier !== 'manual'" class="btn-calc-fee" @click="calcFee" :disabled="calcingFee" :style="{ opacity: calcingFee ? 0.6 : 1 }">
          <Calculator :size="14" v-if="!calcingFee" /> {{ calcingFee ? t('admin.msg_60d12cae', 'Đang tính...') : t('admin.msg_8cf550e5', 'Tính phí tự động') }}
        </button>
      </div>

      <!-- Step 3: Confirm -->
      <div v-if="createStep === 3" class="sf-card">
        <div class="confirm-summary">
          <h4>{{ t('admin.msg_c4505fb9', 'Xác nhận thông tin vận đơn') }}</h4>
          <div class="confirm-grid">
            <div class="confirm-item"><span>{{ t('admin.msg_0e5be3fb', 'Người nhận:') }}</span><strong>{{ shipForm.receiverName }}</strong></div>
            <div class="confirm-item"><span>{{ t('admin.msg_c60e8c30', 'SĐT:') }}</span><strong>{{ shipForm.receiverPhone }}</strong></div>
            <div class="confirm-item span-2"><span>{{ t('admin.msg_ce467846', 'Địa chỉ:') }}</span><strong>{{ shipForm.receiverAddress }}, {{ shipForm.receiverWard }}, {{ shipForm.receiverDistrict }}, {{ shipForm.receiverProvince }}</strong></div>
            <div class="confirm-item"><span>{{ t('admin.msg_9c09e658', 'ĐVVC:') }}</span><strong>{{ carrierLabels[shipForm.carrier] }}</strong></div>
            <div class="confirm-item"><span>{{ t('admin.msg_40d8de95', 'Phí ship:') }}</span><strong class="price">{{ formatCurrency(shipForm.shippingFee) }}</strong></div>
            <div class="confirm-item"><span>COD:</span><strong class="price">{{ formatCurrency(shipForm.codAmount) }}</strong></div>
            <div class="confirm-item"><span>{{ t('admin.msg_40a72f9d', 'Khối lượng:') }}</span><strong>{{ shipForm.weight }}g</strong></div>
            <div class="confirm-item span-2" v-if="shipForm.notes"><span>{{ t('admin.msg_1f871388', 'Ghi chú:') }}</span><strong>{{ shipForm.notes }}</strong></div>
          </div>
        </div>
      </div>

      <div class="sf-actions">
        <button v-if="createStep > 1" class="btn-secondary" @click="createStep--">{{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
        <button v-if="createStep < 3" class="btn-primary" @click="nextStep">{{ t('admin.msg_5758341c', 'Tiếp theo') }}</button>
        <button v-if="createStep === 3" class="btn-primary" @click="createShipment" :disabled="saving">
          <Truck :size="14" v-if="!saving" /><Loader2 :size="14" class="spin" v-else /> 
          {{ saving ? t('admin.msg_f2315cbc', 'Đang tạo...') : t('admin.msg_cbfa8f47', 'Tạo vận đơn') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Truck, CheckCircle, Calculator, ChevronLeft, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const props = defineProps({ initialOrderId: { type: Number, default: null } })
const emit = defineEmits(['back', 'saved'])

const saving = ref(false)
const createStep = ref(1)

const orderLookupId = ref(props.initialOrderId)
const orderLookupResult = ref(null)

const carrierLabels = { manual: t('admin.msg_a794b260', 'Thủ công'), ghn: 'GHN', ghtk: 'GHTK', viettel_post: 'Viettel Post' }
const carriers = [
  { key: 'manual', name: t('admin.msg_a794b260', 'Thủ công'), desc: t('admin.msg_4d320cca', 'Tự giao hoặc nhập tay') },
  { key: 'ghn', name: 'GHN', desc: t('admin.msg_67d32558', 'Giao Hàng Nhanh') },
  { key: 'ghtk', name: 'GHTK', desc: t('admin.msg_b0bd78a0', 'Giao Hàng Tiết Kiệm') },
  { key: 'viettel_post', name: 'Viettel Post', desc: 'Viettel Post' },
]

const shipForm = ref({
  orderId: null, carrier: 'manual',
  receiverName: '', receiverPhone: '', receiverAddress: '',
  receiverWard: '', receiverDistrict: '', receiverProvince: '',
  shippingFee: 0, codAmount: 0, weight: 500, insuranceFee: 0, notes: '',
})

if (props.initialOrderId) lookupOrder()

// formatCurrency provided by useI18n
const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

async function lookupOrder() {
  if (!orderLookupId.value) return
  try {
    const res = await apiFetch(`/orders/${orderLookupId.value}`)
    orderLookupResult.value = mapKeys(await res.json())
  } catch {
    orderLookupResult.value = null
    showToast(t('admin.msg_8fad60', 'Không tìm thấy đơn hàng'), 'error')
  }
}

function fillFromOrder() {
  if (!orderLookupResult.value) return
  const o = orderLookupResult.value
  shipForm.value.orderId = o.id
  shipForm.value.receiverName = o.customerName || ''
  shipForm.value.receiverPhone = o.customerPhone || ''
  shipForm.value.receiverAddress = o.customerAddress || ''
  shipForm.value.codAmount = o.totalAmount || 0
  showToast(t('admin.msg_fb88c1', 'Đã điền thông tin từ đơn hàng'), 'success')
}

function nextStep() {
  if (createStep.value === 1) {
    if (!shipForm.value.receiverName || !shipForm.value.receiverPhone || !shipForm.value.receiverAddress) {
      return showToast(t('admin.msg_8b31c4', 'Vui lòng nhập tên, SĐT và địa chỉ người nhận'), 'error')
    }
  }
  createStep.value++
}

const calcingFee = ref(false)
async function calcFee() {
  calcingFee.value = true
  try {
    const res = await apiFetch('/shipping/calculate-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrier: shipForm.value.carrier,
        weight: shipForm.value.weight || 500,
        codAmount: shipForm.value.codAmount || 0
      }),
    })
    const data = await res.json()
    if (data.fee !== undefined) {
      shipForm.value.shippingFee = data.fee
      showToast(t('admin.msg_fee_calculated', 'Đã tính phí') + ': ' + formatCurrency(data.fee), 'success')
    } else {
      showToast(data.error || t('admin.msg_23dfb463', 'Không tính được phí'), 'error')
    }
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' tính phí: ' + e.message, 'error')
  } finally {
    calcingFee.value = false
  }
}

async function createShipment() {
  saving.value = true
  try {
    await apiFetch('/shipments', {
      method: 'POST',
      body: JSON.stringify({ ...shipForm.value }),
    })
    showToast(t('admin.msg_51ddf0', 'Đã tạo vận đơn'), 'success')
    emit('saved')
  } catch (err) { 
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + err.message, 'error') 
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.ship-form-page { animation: fadeUp .2s ease; max-width: 800px; margin: 0 auto; padding-bottom: 40px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.ship-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.ship-header__center { display: flex; align-items: center; gap: 8px; }
.ship-header__icon { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.ship-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-1); }

.btn-back { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-1); font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }

.sf-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }

/* Form inputs & layout */
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; color: var(--text-2); margin-bottom: 6px; font-weight: 700; }
.form-input { width: 100%; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); padding: 10px 14px; border-radius: 8px; font-size: 14px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: var(--accent); }

/* Steps */
.step-indicator { display: flex; align-items: center; justify-content: space-between; gap: 0; margin-bottom: 24px; padding: 16px; background: var(--bg-1); border-radius: 12px; border: 1px solid var(--border); }
.step { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; color: var(--text-muted); transition: all 0.3s; }
.step span { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; border: 2px solid var(--border); background: var(--bg-2); transition: all 0.3s; }
.step.active { color: var(--accent); }
.step.active span { background: var(--accent); color: #fff; border-color: transparent; }
.step.done span { background: #10b981; color: #fff; border-color: transparent; }
.step.done { color: #10b981; }
.step-line { flex: 1; height: 2px; background: var(--border); margin: 0 16px; opacity: 0.5; }

/* Order lookup */
.order-lookup { display: flex; gap: 8px; }
.btn-lookup { background: var(--bg-2); border: 1px solid var(--border); color: var(--text-2); padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; flex-shrink: 0; }
.btn-lookup:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
.btn-lookup:disabled { opacity: 0.5; cursor: not-allowed; }
.order-found { margin-top: 10px; padding: 10px 14px; border-radius: 8px; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15); display: flex; align-items: center; gap: 8px; font-size: 13px; }
.btn-fill { margin-left: auto; background: var(--accent); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 700; cursor: pointer; }

/* Carriers */
.carrier-selector { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.carrier-card { padding: 14px 10px; border: 2px solid var(--border); border-radius: 10px; text-align: center; cursor: pointer; transition: all .2s; }
.carrier-card.selected { border-color: var(--accent); background: var(--accent-glow); }
.carrier-card__icon { color: var(--text-2); margin-bottom: 6px; }
.carrier-card.selected .carrier-card__icon { color: var(--accent); }
.carrier-card__name { font-size: 13px; font-weight: 700; color: var(--text-1); margin-bottom: 2px; }
.carrier-card__desc { font-size: 11px; color: var(--text-muted); }
.btn-calc-fee { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; width: 100%; padding: 12px; border: none; border-radius: 8px; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; transition: opacity .2s; }

/* Summary Confirm */
.confirm-summary h4 { margin: 0 0 16px; font-size: 15px; color: var(--text-1); font-weight: 700; }
.confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.confirm-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--bg-2); border-radius: 8px; }
.confirm-item.span-2 { grid-column: span 2; }
.confirm-item span { font-size: 12px; color: var(--text-2); font-weight: 600; }
.confirm-item strong { font-size: 14px; color: var(--text-1); word-break: break-word; }
.confirm-item strong.price { color: #10b981; }

.sf-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px; }
.btn-secondary { padding: 10px 20px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text-1); font-weight: 600; cursor: pointer; }
.btn-secondary:hover { background: var(--bg-2); }
.btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-sm); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
