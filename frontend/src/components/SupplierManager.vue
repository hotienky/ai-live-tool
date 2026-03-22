<template>
  <!-- Form view -->
  <SupplierForm v-if="showForm" :editId="editId" @saved="onSaved" @back="showForm = false" />

  <!-- List view -->
  <div v-else class="supplier-mgr">
    <div class="sm-header">
      <h2><Briefcase :size="20" style="vertical-align:middle" /> {{ t('admin.msg_4c48806b', 'Nhà Cung Cấp') }}</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" :placeholder="t('admin.msg_3a2d75', 'Tìm tên, SĐT, email...')" @input="debouncedSearch" />
        <button class="btn-primary" @click="openCreate"><Plus :size="14" /> {{ t('admin.msg_808252ac', 'Thêm NCC') }}</button>
      </div>
    </div>

    <div class="sm-table">
      <table>
        <thead>
          <tr>
            <th>#</th><th>{{ t('admin.msg_a98ff863', 'Tên NCC') }}</th><th>{{ t('admin.phone_short', 'SĐT') }}</th><th>Email</th><th>{{ t('admin.address', 'Địa chỉ') }}</th><th>MST</th><th>TT</th><th>{{ t('admin.msg_71d52075', 'Thao tác') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, idx) in suppliers" :key="s.id">
            <td>{{ idx + 1 }}</td>
            <td class="name"><strong>{{ s.name }}</strong><br v-if="s.contact_person"><small v-if="s.contact_person">{{ s.contact_person }}</small></td>
            <td>{{ s.phone || '—' }}</td>
            <td>{{ s.email || '—' }}</td>
            <td class="addr">{{ s.address || '—' }}</td>
            <td class="mono">{{ s.tax_id || '—' }}</td>
            <td><span class="status-dot" :class="s.is_active ? 'active' : 'inactive'"></span></td>
            <td>
              <div class="action-btns">
                <button class="act-btn act-edit" @click="openEdit(s)"><Edit :size="13" /> {{ t('admin.edit', 'Sửa') }}</button>
                <button class="act-btn act-cancel" @click="deleteSupplier(s)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="suppliers.length === 0">
            <td colspan="8" class="empty">
              <div class="empty-state">
                <Briefcase :size="40" class="empty-state__icon" />
                <p class="empty-state__title">{{ t('admin.msg_bcd379a7', 'Chưa có nhà cung cấp') }}</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Briefcase, Plus, Edit, Trash2 } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import SupplierForm from './SupplierForm.vue'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const suppliers = ref([])
const searchTerm = ref('')
const showForm = ref(false)
const editId = ref(null)
let timer = null

onMounted(fetchSuppliers)

async function fetchSuppliers() {
  try {
    let url = '/suppliers'
    if (searchTerm.value) url += `?search=${searchTerm.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    suppliers.value = data.data || data || []
  } catch { suppliers.value = [] }
}

function debouncedSearch() { clearTimeout(timer); timer = setTimeout(fetchSuppliers, 300) }
function openCreate() { editId.value = null; showForm.value = true }
function openEdit(s) { editId.value = s.id; showForm.value = true }
function onSaved() { showForm.value = false; fetchSuppliers() }

async function deleteSupplier(s) {
  if (!confirm(`${t('admin.delete', 'Xóa')} "${s.name}"?`)) return
  try {
    await apiFetch(`/suppliers/${s.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
    fetchSuppliers()
  } catch { showToast(t('admin.msg_9e5d62', 'Lỗi xóa'), 'error') }
}
</script>

<style scoped>
.supplier-mgr { padding: 24px; overflow-y: auto; height: 100%; }
.sm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.sm-header h2 { margin: 0; font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 10px; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.search-input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-width: 200px; outline: none; }
.search-input:focus { border-color: var(--color-accent-primary); }
.btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.sm-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th { padding: 12px 14px; text-align: left; color: var(--color-text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover td { background: var(--color-accent-glow); }
.name { min-width: 140px; } .name small { color: var(--color-text-muted); font-size: 11px; }
.addr { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; font-size: 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-dot.active { background: #34d399; } .status-dot.inactive { background: #f87171; }
.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.act-btn { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; cursor: pointer; font-size: 12px; color: var(--color-text-primary); }
.act-edit:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.act-cancel:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.4); }
.empty { text-align: center; padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
</style>
