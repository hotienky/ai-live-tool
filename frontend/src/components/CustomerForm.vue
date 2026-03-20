<template>
  <div class="cf-page">
    <!-- Header -->
    <div class="cf-header">
      <button class="btn-back" @click="emit('back')">
        <ChevronLeft :size="15" />{{ t('admin.msg_0033aa16', 'Quay lại') }}</button>
      <div class="cf-header__center">
        <div class="cf-header__icon"><Users :size="15" /></div>
        <h3>{{ props.editId ? t('admin.msg_982998a9', 'Sửa khách hàng') : t('admin.msg_e0014d2e', 'Thêm khách hàng') }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? t('admin.msg_4d30b6f8', 'Đang lưu...') : (props.editId ? t('admin.msg_3b7db4b6', 'Cập nhật') : t('admin.msg_808b9546', 'Tạo')) }}
      </button>
    </div>

    <!-- Body -->
    <div class="cf-body">
      <!-- Main form -->
      <div class="cf-col cf-col--main">
        <div class="cf-card">
          <h4><Users :size="13" /> {{ t('admin.msg_41100f72', 'Thông tin cơ bản') }}</h4>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.first_name', 'Họ') }} <span class="req">*</span></label>
              <input v-model="form.firstName" class="form-input" :placeholder="t('admin.msg_de6a75', 'Nguyễn')" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.last_name', 'Tên') }} <span class="req">*</span></label>
              <input v-model="form.lastName" class="form-input" :placeholder="t('admin.msg_947faa', 'Văn A')" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Email</label>
              <input v-model="form.email" type="email" class="form-input" placeholder="email@example.com" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.phone_short', 'SĐT') }}</label>
              <input v-model="form.phone" class="form-input" placeholder="0912345678" />
            </div>
          </div>
          <div class="form-group" v-if="!props.editId">
            <label>{{ t('admin.password', 'Mật khẩu') }}</label>
            <input v-model="form.password" type="password" class="form-input" :placeholder="t('admin.msg_11611c', 'Để trống nếu không đặt')" />
          </div>
        </div>

        <!-- Addresses (only on edit) -->
        <div class="cf-card" v-if="props.editId">
          <h4><MapPin :size="13" /> {{ t('admin.msg_3229e287', 'Sổ địa chỉ') }}</h4>
          <div class="address-list" v-if="addresses.length">
            <div class="address-card" v-for="a in addresses" :key="a.id">
              <div class="address-info">
                <strong>{{ a.firstName }} {{ a.lastName }}</strong> — {{ a.phone }}
                <div class="address-detail">{{ a.address1 }}, {{ a.district }}, {{ a.city }}, {{ a.province }}</div>
              </div>
              <button class="btn-icon btn-icon--danger" @click="handleDeleteAddress(a.id)"><X :size="12" /></button>
            </div>
          </div>
          <p v-else class="empty-hint">{{ t('admin.msg_e826b58f', 'Chưa có địa chỉ nào') }}</p>

          <div class="addr-form-title">{{ t('admin.msg_16e8d40f', '+ Thêm địa chỉ mới') }}</div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.first_name', 'Họ') }}</label>
              <input v-model="addrForm.firstName" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.last_name', 'Tên') }}</label>
              <input v-model="addrForm.lastName" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.msg_5457a69f', 'SĐT') }}</label>
              <input v-model="addrForm.phone" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_fe2a438f', 'Mã bưu điện') }}</label>
              <input v-model="addrForm.postcode" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.address', 'Địa chỉ') }}</label>
            <input v-model="addrForm.address1" class="form-input" :placeholder="t('admin.msg_e9c8fd', 'Số nhà, đường...')" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.msg_f2fcfd89', 'Quận/Huyện') }}</label>
              <input v-model="addrForm.district" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_936210fe', 'Thành phố') }}</label>
              <input v-model="addrForm.city" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.msg_a2b3b5e8', 'Tỉnh') }}</label>
              <input v-model="addrForm.province" class="form-input" />
            </div>
          </div>
          <button class="btn-add-addr" @click="handleAddAddress">{{ t('admin.msg_1a70d44d', '+ Thêm địa chỉ') }}</button>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="cf-col cf-col--side">
        <div class="cf-card">
          <h4>{{ t('admin.msg_1a691070', 'Cài đặt') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.status', 'Trạng thái') }}</label>
            <select v-model="form.status" class="form-input">
              <option :value="1">Active</option>
              <option :value="0">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Users, MapPin, X, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useShopCustomers } from '../composables/useShopCustomers.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()
const { createCustomer, updateCustomer, fetchAddresses: fetchAddressesApi, addAddress, deleteAddress: deleteAddressApi } = useShopCustomers(apiFetch)

const props = defineProps({ editId: { type: [String, Number], default: null } })
const emit = defineEmits(['saved', 'back'])

const saving = ref(false)
const form = ref({ firstName: '', lastName: '', email: '', phone: '', password: '', status: 1 })
const addresses = ref([])
const addrForm = ref({ firstName: '', lastName: '', phone: '', address1: '', district: '', city: '', province: '', postcode: '' })

onMounted(async () => {
  if (props.editId) {
    try {
      const res = await apiFetch(`/customers/${props.editId}`)
      const data = await res.json()
      const c = data?.data || data
      form.value = {
        firstName: c.firstName || '', lastName: c.lastName || '',
        email: c.email || '', phone: c.phone || '', status: c.status ?? 1,
      }
      addresses.value = await fetchAddressesApi(props.editId) || []
    } catch { showToast(t('admin.msg_c26913', 'Không tải được thông tin khách hàng'), 'error') }
  }
})

async function handleSave() {
  if (!form.value.firstName) return showToast(t('admin.msg_f4459e', 'Vui lòng nhập họ tên'), 'error')
  saving.value = true
  try {
    if (props.editId) {
      await updateCustomer(props.editId, form.value)
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await createCustomer(form.value)
      showToast(t('admin.msg_8f038f', 'Đã tạo khách hàng'), 'success')
    }
    emit('saved')
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
  saving.value = false
}

async function handleAddAddress() {
  if (!addrForm.value.address1) return showToast(t('admin.msg_47b988', 'Vui lòng nhập địa chỉ'), 'error')
  await addAddress(props.editId, addrForm.value)
  addresses.value = await fetchAddressesApi(props.editId) || []
  addrForm.value = { firstName: '', lastName: '', phone: '', address1: '', district: '', city: '', province: '', postcode: '' }
  showToast(t('admin.msg_9a5fe9', 'Đã thêm địa chỉ'), 'success')
}

async function handleDeleteAddress(addrId) {
  if (!confirm(t('admin.msg_4298dba8', 'Xóa địa chỉ này?'))) return
  await deleteAddressApi(props.editId, addrId)
  addresses.value = await fetchAddressesApi(props.editId) || []
  showToast(t('admin.msg_a2c448', 'Đã xóa địa chỉ'), 'success')
}
</script>

<style scoped>
.cf-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }

.cf-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);
}
.cf-header__center { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.cf-header__icon {
  width: 28px; height: 28px; border-radius: 8px;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center;
}
.cf-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s;
}
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save {
  display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px;
  border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.cf-body { display: flex; gap: 20px; align-items: flex-start; }
.cf-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.cf-col--side { flex: 3; min-width: 200px; position: sticky; top: 16px; }

.cf-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.cf-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }

.form-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.req { color: #ef4444; }
.form-input {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; box-sizing: border-box; transition: border-color .2s;
}
.form-input:focus { border-color: var(--accent); }

.address-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
.address-card { display: flex; align-items: center; justify-content: space-between; padding: .6rem .8rem; background: var(--color-bg-secondary); border-radius: 8px; border: 1px solid var(--color-border); }
.address-detail { font-size: .78rem; color: var(--color-text-muted); margin-top: 2px; }
.btn-icon { display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; cursor: pointer; transition: all .15s; }
.btn-icon--danger:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.4); }

.addr-form-title { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); margin: 12px 0 10px; padding-top: 10px; border-top: 1px solid var(--color-border); }
.btn-add-addr { padding: 7px 16px; border-radius: 8px; border: 1px dashed var(--color-border); background: transparent; cursor: pointer; font-size: 13px; color: var(--accent); }
.btn-add-addr:hover { background: rgba(var(--accent-rgb, 99,102,241), .06); }
.empty-hint { font-size: 13px; color: var(--color-text-muted); text-align: center; padding: 12px 0; }

@media (max-width: 768px) {
  .cf-body { flex-direction: column; }
  .cf-col--side { position: static; width: 100%; }
}
</style>
