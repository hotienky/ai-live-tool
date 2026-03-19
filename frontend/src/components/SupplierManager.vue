<template>
  <div class="supplier-mgr">
    <div class="sm-header">
      <h2><Briefcase :size="20" style="vertical-align:middle" /> Nhà Cung Cấp</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" placeholder="Tìm tên, SĐT, email..." @input="debouncedSearch" />
        <button class="btn-primary" @click="openCreate"><Plus :size="14" /> Thêm NCC</button>
      </div>
    </div>

    <div class="sm-table">
      <table>
        <thead>
          <tr>
            <th>#</th><th>Tên NCC</th><th>SĐT</th><th>Email</th><th>Địa chỉ</th><th>MST</th><th>TT</th><th>Thao tác</th>
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
                <button class="act-btn act-edit" @click="openEdit(s)"><Edit :size="13" /> Sửa</button>
                <button class="act-btn act-cancel" @click="deleteSupplier(s)"><Trash2 :size="13" /> Xóa</button>
              </div>
            </td>
          </tr>
          <tr v-if="suppliers.length === 0">
            <td colspan="8" class="empty">
              <div class="empty-state">
                <Briefcase :size="40" class="empty-state__icon" />
                <p class="empty-state__title">Chưa có nhà cung cấp</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3><Briefcase :size="16" style="vertical-align:middle" /> {{ editingId ? 'Sửa NCC' : 'Thêm NCC' }}</h3>
        <div class="form-group"><label>Tên NCC *</label><input v-model="form.name" placeholder="Công ty ABC" /></div>
        <div class="form-row">
          <div class="form-group"><label>SĐT</label><input v-model="form.phone" placeholder="0912..." /></div>
          <div class="form-group"><label>Email</label><input v-model="form.email" placeholder="abc@..." /></div>
        </div>
        <div class="form-group"><label>Địa chỉ</label><input v-model="form.address" /></div>
        <div class="form-row">
          <div class="form-group"><label>Mã số thuế</label><input v-model="form.tax_id" /></div>
          <div class="form-group"><label>Người liên hệ</label><input v-model="form.contact_person" /></div>
        </div>
        <div class="form-group"><label>Ghi chú</label><textarea v-model="form.notes" rows="2"></textarea></div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-create" @click="save">{{ editingId ? 'Cập nhật' : 'Thêm' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Briefcase, Plus, Edit, Trash2 } from 'lucide-vue-next'
const { showToast } = useToast()

const suppliers = ref([])
const searchTerm = ref('')
const showModal = ref(false)
const editingId = ref(null)
const form = ref({ name: '', phone: '', email: '', address: '', tax_id: '', contact_person: '', notes: '' })
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

function debouncedSearch() {
  clearTimeout(timer)
  timer = setTimeout(fetchSuppliers, 300)
}

function openCreate() {
  editingId.value = null
  form.value = { name: '', phone: '', email: '', address: '', tax_id: '', contact_person: '', notes: '' }
  showModal.value = true
}

function openEdit(s) {
  editingId.value = s.id
  form.value = { name: s.name, phone: s.phone || '', email: s.email || '', address: s.address || '', tax_id: s.tax_id || '', contact_person: s.contact_person || '', notes: s.notes || '' }
  showModal.value = true
}

async function save() {
  if (!form.value.name) return showToast('Tên NCC là bắt buộc', 'error')
  try {
    if (editingId.value) {
      await apiFetch(`/suppliers/${editingId.value}`, { method: 'PUT', body: JSON.stringify(form.value) })
      showToast('Đã cập nhật', 'success')
    } else {
      await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(form.value) })
      showToast('Đã thêm NCC', 'success')
    }
    showModal.value = false
    fetchSuppliers()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function deleteSupplier(s) {
  if (!confirm(`Xóa "${s.name}"?`)) return
  try {
    await apiFetch(`/suppliers/${s.id}`, { method: 'DELETE' })
    showToast('Đã xóa', 'success')
    fetchSuppliers()
  } catch { showToast('Lỗi xóa', 'error') }
}
</script>

<style scoped>
.supplier-mgr { padding: 24px; overflow-y: auto; height: 100%; }
.sm-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
.sm-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; align-items: center; }
.search-input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px; min-width: 200px; outline: none; }
.search-input:focus { border-color: var(--color-accent-primary); }
.btn-primary { background: var(--accent-gradient); color: #fff; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.sm-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th { padding: 12px 14px; text-align: left; color: var(--color-text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.name { min-width: 140px; }
.name small { color: var(--color-text-muted); font-size: 11px; }
.addr { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mono { font-family: monospace; font-size: 12px; }
.status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.status-dot.active { background: #34d399; }
.status-dot.inactive { background: #f87171; }
.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }
.empty { text-align: center; padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 16px; padding: 28px; width: 500px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.5); animation: slideUp 0.3s ease-out; max-height: 85vh; overflow-y: auto; }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.modal h3 { margin: 0 0 20px; font-weight: 800; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--glass-border); background: var(--color-input-bg, transparent); color: var(--color-text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel { padding: 10px 20px; border-radius: 10px; border: 1px solid var(--glass-border); background: transparent; color: var(--color-text-secondary); font-weight: 600; cursor: pointer; }
.btn-create { padding: 10px 20px; border-radius: 10px; border: none; background: var(--accent-gradient); color: #fff; font-weight: 700; cursor: pointer; }
</style>
