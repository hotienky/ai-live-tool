<template>
  <div class="pay-settings">
    <h3 class="pay-settings__title"><CreditCard :size="16" /> Cấu hình thanh toán</h3>

    <div v-if="loading" class="pay-settings__loading">{{ t('admin.loading', 'Đang tải...') }}</div>
    <template v-else>
      <!-- COD -->
      <div class="pay-settings__card">
        <div class="pay-settings__card-header">
          <Truck :size="18" />
          <div class="pay-settings__card-title">
            <strong>{{ t('admin.cod', 'Thanh toán khi nhận hàng (COD)') }}</strong>
            <span>{{ t('admin.cod_desc', 'Khách hàng trả tiền mặt khi nhận hàng') }}</span>
          </div>
          <label class="pay-settings__switch">
            <input type="checkbox" v-model="form.codEnabled" />
            <span class="pay-settings__switch-slider"></span>
          </label>
        </div>
        <div class="pay-settings__card-body" v-if="form.codEnabled">
          <div class="form-group">
            <label>{{ t('admin.display_name', 'Tên hiển thị') }}</label>
            <input v-model="form.codName" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }}</label>
            <input v-model="form.codDescription" />
          </div>
        </div>
      </div>

      <!-- Bank Transfer -->
      <div class="pay-settings__card">
        <div class="pay-settings__card-header">
          <Building :size="18" />
          <div class="pay-settings__card-title">
            <strong>{{ t('admin.bank_transfer', 'Chuyển khoản ngân hàng') }}</strong>
            <span>{{ t('admin.bank_transfer_desc', 'Thanh toán qua chuyển khoản ngân hàng') }}</span>
          </div>
          <label class="pay-settings__switch">
            <input type="checkbox" v-model="form.bankEnabled" />
            <span class="pay-settings__switch-slider"></span>
          </label>
        </div>
        <div class="pay-settings__card-body" v-if="form.bankEnabled">
          <div class="form-group">
            <label>{{ t('admin.display_name', 'Tên hiển thị') }}</label>
            <input v-model="form.bankName" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }}</label>
            <input v-model="form.bankDescription" />
          </div>
          <div class="pay-settings__divider"></div>
          <h4 class="pay-settings__section-title">{{ t('admin.account_info', 'Thông tin tài khoản') }}</h4>
          <div class="pay-settings__row form-row">
            <div class="form-group">
              <label>{{ t('admin.bank_name', 'Tên ngân hàng') }}</label>
              <input v-model="form.bankNameDisplay" placeholder="VD: Vietcombank" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.branch', 'Chi nhánh') }}</label>
              <input v-model="form.bankBranch" placeholder="VD: TP.HCM" />
            </div>
          </div>
          <div class="pay-settings__row form-row">
            <div class="form-group">
              <label>{{ t('admin.account_holder', 'Chủ tài khoản') }}</label>
              <input v-model="form.bankAccountName" placeholder="NGUYEN VAN A" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.account_number', 'Số tài khoản') }}</label>
              <input v-model="form.bankAccountNumber" placeholder="1234567890" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.transfer_template', 'Mẫu nội dung chuyển khoản') }}</label>
            <input v-model="form.bankNoteTemplate" placeholder="DH{order_id}" />
            <span class="pay-settings__hint">Dùng <code>{order_id}</code> để tự động thay bằng mã đơn hàng</span>
          </div>
          <div class="pay-settings__divider"></div>
          <h4 class="pay-settings__section-title">QR Code (VietQR)</h4>
          <div class="form-group">
            <label>{{ t('admin.bank_bin', 'Mã BIN ngân hàng') }}</label>
            <input v-model="form.bankBin" placeholder="VD: 970436 (Vietcombank)" />
            <span class="pay-settings__hint">Tra cứu mã BIN tại <a href="https://www.vietqr.io/danh-sach-ngan-hang" target="_blank" style="color:var(--accent)">vietqr.io</a>. Ví dụ: Vietcombank = 970436, Techcombank = 970407, MBBank = 970422</span>
          </div>
        </div>
      </div>

      <!-- Save -->
      <button class="btn-primary" @click="save" :disabled="saving" style="margin-top:8px">
        <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save_config', 'Lưu cấu hình') }}
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { CreditCard, Truck, Building, Save } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const { showToast } = useToast()
const loading = ref(true)
const saving = ref(false)

const form = ref({
  codEnabled: true,
  codName: 'Thanh toán khi nhận hàng (COD)',
  codDescription: 'Trả tiền mặt khi nhận hàng',
  bankEnabled: true,
  bankName: 'Chuyển khoản ngân hàng',
  bankDescription: 'Thanh toán qua chuyển khoản ngân hàng',
  bankAccountName: '',
  bankAccountNumber: '',
  bankNameDisplay: '',
  bankBranch: '',
  bankNoteTemplate: 'DH{order_id}',
  bankBin: '',
})

const keyMap = {
  payment_cod_enabled: 'codEnabled',
  payment_cod_name: 'codName',
  payment_cod_description: 'codDescription',
  payment_bank_enabled: 'bankEnabled',
  payment_bank_name: 'bankName',
  payment_bank_description: 'bankDescription',
  payment_bank_account_name: 'bankAccountName',
  payment_bank_account_number: 'bankAccountNumber',
  payment_bank_name_display: 'bankNameDisplay',
  payment_bank_branch: 'bankBranch',
  payment_bank_note_template: 'bankNoteTemplate',
  payment_bank_bin: 'bankBin',
}

onMounted(async () => {
  try {
    const res = await apiFetch('/system-config/group/payment')
    const data = await res.json()
    const configs = Array.isArray(data) ? data : (data.data || [])
    for (const c of configs) {
      const field = keyMap[c.key]
      if (field) {
        form.value[field] = c.type === 'boolean' ? c.value === 'true' : c.value
      }
    }
  } catch { /* use defaults */ }
  loading.value = false
})

async function save() {
  saving.value = true
  try {
    const reverseMap = Object.fromEntries(Object.entries(keyMap).map(([k, v]) => [v, k]))
    const items = []
    for (const [field, dbKey] of Object.entries(reverseMap)) {
      const val = form.value[field]
      items.push({
        key: dbKey,
        value: typeof val === 'boolean' ? String(val) : val,
        type: typeof val === 'boolean' ? 'boolean' : 'string',
        group_name: 'payment',
      })
    }
    await apiFetch('/system-config', {
      method: 'POST',
      body: JSON.stringify({ items }),
    })
    showToast('Đã lưu cấu hình thanh toán', 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
  saving.value = false
}
</script>

<style scoped>
.pay-settings__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 800; margin: 0 0 20px;
}
.pay-settings__title svg { color: var(--accent); }
.pay-settings__loading { text-align: center; padding: 40px; opacity: .6; }

.pay-settings__card {
  background: var(--bg-2); border: 1px solid var(--border);
  border-radius: 10px; margin-bottom: 16px; overflow: hidden;
}
.pay-settings__card-header {
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
}
.pay-settings__card-header svg { color: var(--accent); flex-shrink: 0; }
.pay-settings__card-title { flex: 1; }
.pay-settings__card-title strong { display: block; font-size: 14px; }
.pay-settings__card-title span { display: block; font-size: 12px; color: var(--text-2); margin-top: 2px; }

.pay-settings__card-body {
  padding: 0 20px 20px; border-top: 1px solid var(--border);
  padding-top: 16px;
}

.pay-settings__divider {
  height: 1px; background: var(--border); margin: 16px 0;
}
.pay-settings__section-title {
  font-size: 13px; font-weight: 700; margin: 0 0 12px;
  color: var(--text-2); text-transform: uppercase; letter-spacing: .5px;
}
.pay-settings__row { display: flex; gap: 0.5rem; }
.pay-settings__row .form-group { flex: 1; }
</style>
