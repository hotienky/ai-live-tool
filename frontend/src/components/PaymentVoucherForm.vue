<template>
  <div class="pvf-page">
    <div class="pvf-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="pvf-header__center">
        <div class="pvf-header__icon"><Wallet :size="15" /></div>
        <h3>{{ form.type === 'receipt' ? t('admin.msg_c908ffde', 'Phiếu Thu') : t('admin.msg_3656c9c8', 'Phiếu Chi') }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? t('admin.msg_4d30b6f8', 'Đang lưu...') : t('admin.msg_f030cb22', 'Tạo phiếu') }}
      </button>
    </div>

    <div class="pvf-body">
      <div class="pvf-card">
        <h4>{{ t('admin.msg_dd5d2c8b', 'Thông tin phiếu') }}</h4>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_7fd68576', 'Loại') }}</label>
            <select v-model="form.type" class="form-input">
              <option value="receipt">{{ t('admin.msg_7d965eb8', 'Phiếu thu') }}</option>
              <option value="payment">{{ t('admin.msg_9d0ac9ed', 'Phiếu chi') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_b9474a12', 'Ngày') }}</label>
            <input type="date" v-model="form.voucher_date" class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_8cde2607', 'Số tiền') }} <span class="req">*</span></label>
            <input type="number" v-model.number="form.amount" min="0" class="form-input" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_53d8de58', 'Danh mục') }} <span class="req">*</span></label>
            <select v-model="form.category" class="form-input">
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>{{ t('admin.msg_38fa9e3f', 'PT thanh toán') }}</label>
            <select v-model="form.payment_method" class="form-input">
              <option value="cash">{{ t('admin.msg_047caf53', 'Tiền mặt') }}</option>
              <option value="bank">{{ t('admin.msg_8ea82051', 'Chuyển khoản') }}</option>
              <option value="wallet">{{ t('admin.msg_b0950a5e', 'Ví điện tử') }}</option>
              <option value="other">{{ t('admin.msg_06c1f85a', 'Khác') }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_03255a94', 'Đối tác') }}</label>
            <input v-model="form.counterparty" class="form-input" :placeholder="t('admin.msg_cfa7bd', 'Tên đối tác/KH...')" />
          </div>
        </div>
        <div class="form-group">
          <label>{{ t('admin.msg_e9c02d54', 'Mô tả') }}</label>
          <textarea v-model="form.description" rows="3" class="form-input" :placeholder="t('admin.msg_dfa3f5', 'Chi tiết...')"></textarea>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ChevronLeft, Wallet, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const emit = defineEmits(['saved', 'back'])
const props = defineProps({ initialType: { type: String, default: 'receipt' } })

const saving = ref(false)
const categories = [t('admin.msg_59471fe2', 'Tiền hàng'), t('admin.msg_76776039', 'Vận chuyển'), 'Marketing', t('admin.msg_0931b128', 'Lương'), t('admin.msg_9a2b203a', 'Thuê mặt bằng'), t('admin.msg_e8a642ef', 'Điện nước'), t('admin.msg_07123c29', 'Dụng cụ'), t('admin.msg_faf5c20b', 'Sửa chữa'), t('admin.msg_94280c8b', 'Hoàn trả'), t('admin.msg_06c1f85a', 'Khác')]
const form = ref({
  type: props.initialType || 'receipt', amount: 0, category: t('admin.msg_59471fe2', 'Tiền hàng'),
  description: '', payment_method: 'cash', counterparty: '',
  voucher_date: new Date().toISOString().split('T')[0],
})

async function handleSave() {
  if (!form.value.amount) return showToast(t('admin.msg_d24203', 'Vui lòng nhập số tiền'), 'error')
  saving.value = true
  try {
    await apiFetch('/payment-vouchers', { method: 'POST', body: JSON.stringify(form.value) })
    showToast(t('admin.msg_eae9d3', 'Đã tạo phiếu'), 'success')
    emit('saved')
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
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
