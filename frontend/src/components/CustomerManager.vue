<template>
  <!-- Form view (full page) -->
  <CustomerForm v-if="showForm" :editId="editId" @saved="onSaved" @back="showForm = false" />

  <!-- List view -->
  <div v-else class="customer-manager">
    <div class="cm-header">
      <h3><Users :size="16" /> {{ t('admin.msg_91a24ef5', 'Khách hàng E-Commerce') }}</h3>
      <div class="cm-actions">
        <input v-model="search" type="text" :placeholder="t('admin.search_customers', 'Tìm theo tên, email, SĐT...')" class="cm-search" @input="onSearch" />
        <button class="btn-add" @click="openCreate">{{ t('admin.msg_17313f47', '+ Thêm KH') }}</button>
      </div>
    </div>

    <div class="cm-table-wrap">
      <table class="cm-table" v-if="customers.length">
        <thead>
          <tr>
            <th>{{ t('admin.name', 'Tên') }}</th>
            <th>Email</th>
            <th>{{ t('admin.phone_short', 'SĐT') }}</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th>
            <th>{{ t('admin.created_at', 'Ngày tạo') }}</th>
            <th>{{ t('admin.actions', 'Hành động') }}</th>
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
              <button class="act-btn act-edit" @click="openEdit(c)">{{ t('admin.edit', 'Sửa') }}</button>
              <button class="act-btn act-cancel" @click="handleDelete(c)">{{ t('admin.delete', 'Xóa') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">{{ t('admin.no_customers', 'Chưa có khách hàng nào') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useShopCustomers } from '../composables/useShopCustomers.js'
import { useToast } from '../composables/useToast.js'
import { Users } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import CustomerForm from './CustomerForm.vue'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()
const { customers, fetchCustomers, deleteCustomer } = useShopCustomers(apiFetch)

const search = ref('')
const showForm = ref(false)
const editId = ref(null)

onMounted(() => fetchCustomers({}))

let searchTimer
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchCustomers({ search: search.value }), 300)
}

function openCreate() { editId.value = null; showForm.value = true }
function openEdit(c) { editId.value = c.id; showForm.value = true }
function onSaved() { showForm.value = false; fetchCustomers({}) }

async function handleDelete(c) {
  if (!confirm(`${t('admin.delete', 'Xóa')} ${t('admin.msg_customer', 'khách hàng')} ${c.firstName} ${c.lastName}?`)) return
  await deleteCustomer(c.id)
  fetchCustomers({})
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
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
.act-btn { padding: 3px 10px; border-radius: 5px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.act-edit:hover { border-color: var(--accent); color: var(--accent); }
.act-cancel:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.4); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; font-size: .9rem; }
</style>
