<template>
  <div class="pvf-page">
    <div class="pvf-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> Quay lại</button>
      <div class="pvf-header__center">
        <div class="pvf-header__icon"><Wallet :size="15" /></div>
        <h3>{{ form.type === 'receipt' ? 'Phiếu Thu' : 'Phiếu Chi' }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? 'Đang lưu...' : 'Tạo phiếu' }}
      </button>
    </div>

    <div class="pvf-body">
      <div class="pvf-card">
        <h4>Thông tin phiếu</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Loại</label>
            <select v-model="form.type" class="form-input">
              <option value="receipt">Phiếu thu</option>
              <option value="payment">Phiếu chi</option>
            </select>
          </div>
          <div class="form-group">
            <label>Ngày</label>
            <input type="date" v-model="form.voucher_date" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Số tiền <span class="req">*</span></label>
            <input type="number" v-model.number="form.amount" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>Danh mục <span class="req">*</span></label>
            <select v-model="form.category" class="form-input">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>PT thanh toán</label>
            <select v-model="form.payment_method" class="form-input">
              <option value="cash">Tiền mặt</option>
              <option value="bank">Chuyển khoản</option>
              <option value="wallet">Ví điện tử</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div class="form-group">
            <label>Đối tác</label>
            <input v-model="form.counterparty" class="form-input" placeholder="Tên đối tác/KH..." />
          </div>
        </div>
        <div class="form-group">
          <label>Mô tả</label>
          <textarea v-model="form.description" rows="3" class="form-input" placeholder="Chi tiết..."></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronLeft, Wallet, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'
import { useI18n } from '../helpers.js'

const { t } = useI18n()
const { showToast } = useToast()
const emit = defineEmits(['saved', 'back'])
const props = defineProps({ initialType: { type: String, default: 'receipt' } })

const saving = ref(false)
const categories = ['Tiền hàng', 'Vận chuyển', 'Marketing', 'Lương', 'Thuê mặt bằng', 'Điện nước', 'Dụng cụ', 'Sửa chữa', 'Hoàn trả', 'Khác']
const form = ref({
  type: props.initialType || 'receipt', amount: 0, category: 'Tiền hàng',
  description: '', payment_method: 'cash', counterparty: '',
  voucher_date: new Date().toISOString().split('T')[0],
})

async function handleSave() {
  if (!form.value.amount) return showToast('Vui lòng nhập số tiền', 'error')
  saving.value = true
  try {
    await apiFetch('/payment-vouchers', { method: 'POST', body: JSON.stringify(form.value) })
    showToast('Đã tạo phiếu', 'success')
    emit('saved')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
  saving.value = false
}
</script>

<style scoped>
.pvf-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.pvf-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); }
.pvf-header__center { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.pvf-header__icon { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.pvf-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; cursor: pointer; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }
.pvf-body { max-width: 700px; }
.pvf-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.pvf-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 14px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.req { color: #ef4444; }
.form-input { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; box-sizing: border-box; }
.form-input:focus { border-color: var(--accent); }
</style>
