<template>
  <div class="customer-manager">
    <div class="cm-header">
      <h3><Users :size="16" /> Khách hàng E-Commerce</h3>
      <div class="cm-actions">
        <input v-model="search" type="text" placeholder="Tìm theo tên, email, SĐT..." class="cm-search" @input="onSearch" />
        <button class="btn-add" @click="openCreate">+ Thêm KH</button>
      </div>
    </div>

    <!-- Customer Table -->
    <div class="cm-table-wrap">
      <table class="cm-table" v-if="customers.length">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>SĐT</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="c in customers" :key="c.id">
            <td class="name-cell">{{ c.firstName }} {{ c.lastName }}</td>
            <td>{{ c.email }}</td>
            <td>{{ c.phone || '—' }}</td>
            <td><span class="status-dot" :class="c.status === 1 ? 'active' : 'inactive'">{{ c.status === 1 ? 'Active' : 'Inactive' }}</span></td>
            <td>{{ formatDate(c.createdAt) }}</td>
            <td class="actions-cell">
              <button class="btn-sm btn-edit" @click="openEdit(c)">Sửa</button>
              <button class="btn-sm btn-addresses" @click="openAddresses(c)">📍</button>
              <button class="btn-sm btn-del" @click="handleDelete(c)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Chưa có khách hàng nào</p>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa khách hàng' : 'Thêm khách hàng' }}</h3>
        <div class="form-row">
          <div class="form-group"><label>Họ</label><input v-model="form.firstName" /></div>
          <div class="form-group"><label>Tên</label><input v-model="form.lastName" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Email</label><input v-model="form.email" type="email" /></div>
          <div class="form-group"><label>SĐT</label><input v-model="form.phone" /></div>
        </div>
        <div class="form-group" v-if="!isEditing">
          <label>Mật khẩu</label><input v-model="form.password" type="password" placeholder="Tùy chọn" />
        </div>
        <div class="form-group">
          <label>Trạng thái</label>
          <select v-model="form.status"><option :value="1">Active</option><option :value="0">Inactive</option></select>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave">{{ isEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>

    <!-- Addresses Modal -->
    <div class="modal-overlay" v-if="showAddressModal" @click.self="showAddressModal = false">
      <div class="modal modal--wide">
        <h3>📍 Sổ địa chỉ: {{ addressCustomer?.firstName }} {{ addressCustomer?.lastName }}</h3>

        <div class="address-list" v-if="addresses.length">
          <div class="address-card" v-for="a in addresses" :key="a.id">
            <div class="address-info">
              <strong>{{ a.firstName }} {{ a.lastName }}</strong> — {{ a.phone }}
              <div class="address-detail">{{ a.address1 }}, {{ a.district }}, {{ a.city }}, {{ a.province }}</div>
            </div>
            <div class="address-actions">
              <button class="btn-sm btn-del" @click="handleDeleteAddress(a.id)">×</button>
            </div>
          </div>
        </div>
        <p v-else class="empty">Chưa có địa chỉ</p>

        <h4>Thêm địa chỉ mới</h4>
        <div class="form-row">
          <div class="form-group"><label>Họ</label><input v-model="addrForm.firstName" /></div>
          <div class="form-group"><label>Tên</label><input v-model="addrForm.lastName" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>SĐT</label><input v-model="addrForm.phone" /></div>
          <div class="form-group"><label>Mã bưu điện</label><input v-model="addrForm.postcode" /></div>
        </div>
        <div class="form-group"><label>Địa chỉ</label><input v-model="addrForm.address1" placeholder="Số nhà, đường..." /></div>
        <div class="form-row">
          <div class="form-group"><label>Quận/Huyện</label><input v-model="addrForm.district" /></div>
          <div class="form-group"><label>Thành phố</label><input v-model="addrForm.city" /></div>
          <div class="form-group"><label>Tỉnh</label><input v-model="addrForm.province" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showAddressModal = false">Đóng</button>
          <button class="btn-save" @click="handleAddAddress">+ Thêm địa chỉ</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useShopCustomers } from '../composables/useShopCustomers.js'
import { useToast } from '../composables/useToast.js'
import { Users } from 'lucide-vue-next'
const { showToast } = useToast()
const { customers, loading, fetchCustomers, createCustomer, updateCustomer, deleteCustomer, fetchAddresses: fetchAddressesApi, addAddress, deleteAddress: deleteAddressApi } = useShopCustomers(apiFetch)

const props = defineProps({ /* tenant-scoped */ })

const search = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ firstName: '', lastName: '', email: '', phone: '', password: '', status: 1 })

// Addresses
const showAddressModal = ref(false)
const addressCustomer = ref(null)
const addresses = ref([])
const addrForm = ref({ firstName: '', lastName: '', phone: '', address1: '', district: '', city: '', province: '', postcode: '' })

onMounted(() => fetchCustomers({  }))

let searchTimer
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchCustomers({ search: search.value }), 300)
}

function openCreate() {
  isEditing.value = false; editId.value = null
  form.value = { firstName: '', lastName: '', email: '', phone: '', password: '', status: 1 }
  showModal.value = true
}

function openEdit(c) {
  isEditing.value = true; editId.value = c.id
  form.value = { firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone || '', status: c.status }
  showModal.value = true
}

async function handleSave() {
  try {
    if (isEditing.value) {
      await updateCustomer(editId.value, form.value)
      showToast('✅ Đã cập nhật', 'success')
    } else {
      await createCustomer({ ...form.value,  })
      showToast('✅ Đã tạo KH', 'success')
    }
    showModal.value = false
    fetchCustomers({  })
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function handleDelete(c) {
  if (!confirm(`Xóa khách hàng ${c.firstName} ${c.lastName}?`)) return
  await deleteCustomer(c.id)
  fetchCustomers({  })
  showToast('Đã xóa', 'success')
}

async function openAddresses(c) {
  addressCustomer.value = c
  addresses.value = await fetchAddressesApi(c.id)
  showAddressModal.value = true
}

async function handleAddAddress() {
  if (!addrForm.value.address1) return showToast('Vui lòng nhập địa chỉ', 'error')
  await addAddress(addressCustomer.value.id, addrForm.value)
  addresses.value = await fetchAddressesApi(addressCustomer.value.id)
  addrForm.value = { firstName: '', lastName: '', phone: '', address1: '', district: '', city: '', province: '', postcode: '' }
  showToast('✅ Đã thêm địa chỉ', 'success')
}

async function handleDeleteAddress(addrId) {
  await deleteAddressApi(addressCustomer.value.id, addrId)
  addresses.value = await fetchAddressesApi(addressCustomer.value.id)
  showToast('Đã xóa địa chỉ', 'success')
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}
</script>

<style scoped>
.customer-manager { padding: 0; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; flex-wrap: wrap; gap: .5rem; }
.cm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.cm-actions { display: flex; gap: .5rem; }
.cm-search { padding: .4rem .6rem; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); font-size: .85rem; width: 200px; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.cm-table-wrap { overflow-x: auto; }
.cm-table { width: 100%; border-collapse: collapse; font-size: .85rem; }
.cm-table th, .cm-table td { padding: .5rem .6rem; border-bottom: 1px solid var(--border); text-align: left; }
.cm-table th { font-weight: 600; color: var(--text-2); font-size: .75rem; text-transform: uppercase; }
.status-dot { padding: 2px 8px; border-radius: 10px; font-size: .75rem; font-weight: 600; }
.status-dot.active { background: rgba(34,197,94,.15); color: #22c55e; }
.status-dot.inactive { background: rgba(239,68,68,.15); color: #ef4444; }
.actions-cell { display: flex; gap: .3rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-addresses:hover { border-color: #8b5cf6; }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; font-size: .9rem; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-1); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal--wide { max-width: 650px; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.modal h4 { margin: 1rem 0 .5rem; font-size: .9rem; border-top: 1px solid var(--border); padding-top: .8rem; }
.form-row { display: flex; gap: .5rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: .6rem; }
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .4rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .85rem; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
.btn-cancel { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text-2); cursor: pointer; }
.btn-save { padding: .4rem .8rem; border: none; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }

.address-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: .5rem; }
.address-card { display: flex; align-items: center; justify-content: space-between; padding: .6rem .8rem; background: var(--bg-2); border-radius: 8px; border: 1px solid var(--border); }
.address-detail { font-size: .8rem; color: var(--text-3); margin-top: 2px; }
</style>
