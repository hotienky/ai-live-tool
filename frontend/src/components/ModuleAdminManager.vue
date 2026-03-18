<template>
  <div class="mod-admin">
    <div class="mod-admin__header">
      <div>
        <h2><Puzzle :size="20" style="vertical-align:middle" /> Quản Lý Module</h2>
        <p class="mod-admin__subtitle">Thêm, sửa, bật/tắt module và config giá cho tenant</p>
      </div>
      <button class="mod-admin__add-btn" @click="showForm = true; resetForm()">
        <Plus :size="14" /> Thêm Module
      </button>
    </div>

    <!-- Module List -->
    <div v-if="loading" class="mod-admin__loading">Đang tải...</div>

    <div v-else class="mod-admin__table-wrap">
      <table class="mod-admin__table">
        <thead>
          <tr>
            <th>Module</th>
            <th>ID</th>
            <th>Category</th>
            <th>Version</th>
            <th>Giá (VNĐ)</th>
            <th>Trạng thái</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in modules" :key="m.id" :class="{ 'row--disabled': !m.is_active }">
            <td>
              <div class="mod-admin__name">
                <strong>{{ m.name }}</strong>
                <span class="mod-admin__desc">{{ m.description }}</span>
              </div>
            </td>
            <td><code>{{ m.module_id }}</code></td>
            <td>{{ catLabels[m.category] || m.category }}</td>
            <td>{{ m.version }}</td>
            <td>{{ m.price > 0 ? formatPrice(m.price) : 'Miễn phí' }}</td>
            <td>
              <span :class="['status-badge', m.is_active ? 'status-badge--active' : 'status-badge--off']">
                {{ m.is_active ? 'Bật' : 'Tắt' }}
              </span>
            </td>
            <td>
              <div class="mod-admin__actions">
                <button class="action-btn" title="Sửa" @click="editModule(m)"><Edit :size="14" /></button>
                <button class="action-btn" :title="m.is_active ? 'Tắt' : 'Bật'" @click="toggleModule(m)">
                  <ToggleLeft v-if="!m.is_active" :size="14" />
                  <ToggleRight v-else :size="14" />
                </button>
                <button class="action-btn action-btn--danger" title="Xoá" @click="deleteModule(m)"><Trash2 :size="14" /></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Form Modal -->
    <div v-if="showForm" class="mod-admin__overlay" @click.self="showForm = false">
      <div class="mod-admin__modal">
        <h3>{{ editId ? 'Sửa Module' : 'Thêm Module Mới' }}</h3>
        <div class="mod-admin__form">
          <div class="form-row" v-if="!editId">
            <label>Module ID</label>
            <input v-model="form.module_id" placeholder="vd: warehouse" />
          </div>
          <div class="form-row">
            <label>Tên</label>
            <input v-model="form.name" placeholder="Tên hiển thị" />
          </div>
          <div class="form-row">
            <label>Mô tả</label>
            <textarea v-model="form.description" rows="2" placeholder="Mô tả ngắn"></textarea>
          </div>
          <div class="form-row-2col">
            <div class="form-row">
              <label>Icon</label>
              <input v-model="form.icon" placeholder="Package" />
            </div>
            <div class="form-row">
              <label>Phân loại</label>
              <select v-model="form.category">
                <option value="operations">Vận hành</option>
                <option value="finance">Tài chính</option>
                <option value="marketing">Marketing</option>
                <option value="content">Nội dung</option>
                <option value="sales">Bán hàng</option>
                <option value="other">Khác</option>
              </select>
            </div>
          </div>
          <div class="form-row-2col">
            <div class="form-row">
              <label>Version</label>
              <input v-model="form.version" placeholder="1.0.0" />
            </div>
            <div class="form-row">
              <label>Giá (VNĐ)</label>
              <input v-model.number="form.price" type="number" min="0" step="10000" placeholder="0 = miễn phí" />
            </div>
          </div>
        </div>
        <div class="mod-admin__modal-footer">
          <button class="btn btn--cancel" @click="showForm = false">Huỷ</button>
          <button class="btn btn--save" :disabled="saving" @click="saveModule">
            {{ saving ? 'Đang lưu...' : (editId ? 'Cập nhật' : 'Tạo mới') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Puzzle, Plus, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-vue-next'

const { showToast } = useToast()
const modules = ref([])
const loading = ref(true)
const showForm = ref(false)
const saving = ref(false)
const editId = ref(null)

const form = ref({ module_id: '', name: '', description: '', icon: 'Package', category: 'other', version: '1.0.0', price: 0 })

const catLabels = { operations: 'Vận hành', finance: 'Tài chính', marketing: 'Marketing', content: 'Nội dung', sales: 'Bán hàng' }

function formatPrice(p) { return new Intl.NumberFormat('vi-VN').format(p) + 'đ' }

function resetForm() {
  editId.value = null
  form.value = { module_id: '', name: '', description: '', icon: 'Package', category: 'other', version: '1.0.0', price: 0 }
}

function editModule(m) {
  editId.value = m.id
  form.value = { module_id: m.module_id, name: m.name, description: m.description || '', icon: m.icon, category: m.category, version: m.version, price: m.price }
  showForm.value = true
}

async function fetchModules() {
  loading.value = true
  try {
    const res = await apiFetch('/master/modules')
    const data = await res.json()
    modules.value = data?.modules || data || []
  } catch (e) { showToast('Lỗi tải modules', 'error') }
  finally { loading.value = false }
}

async function saveModule() {
  saving.value = true
  try {
    const url = editId.value ? `/master/modules/${editId.value}` : '/master/modules'
    const method = editId.value ? 'PUT' : 'POST'
    const res = await apiFetch(url, { method, body: JSON.stringify(form.value) })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || 'Đã lưu', 'success')
      showForm.value = false
      fetchModules()
    } else { showToast(data.message || 'Lỗi', 'error') }
  } catch (e) { showToast('Lỗi lưu module', 'error') }
  finally { saving.value = false }
}

async function toggleModule(m) {
  try {
    const res = await apiFetch(`/master/modules/${m.id}/toggle`, { method: 'PATCH' })
    const data = await res.json()
    showToast(data.message || 'Đã cập nhật', 'success')
    fetchModules()
  } catch (e) { showToast('Lỗi', 'error') }
}

async function deleteModule(m) {
  if (!confirm(`Xoá module "${m.name}"? Hành động này không thể hoàn tác.`)) return
  try {
    const res = await apiFetch(`/master/modules/${m.id}`, { method: 'DELETE' })
    const data = await res.json()
    showToast(data.message || 'Đã xoá', 'success')
    fetchModules()
  } catch (e) { showToast('Lỗi xoá', 'error') }
}

onMounted(fetchModules)
</script>

<style scoped>
.mod-admin { padding: 24px; overflow-y: auto; height: 100%; }
.mod-admin__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.mod-admin__header h2 { margin: 0; font-size: 22px; font-weight: 800; }
.mod-admin__subtitle { font-size: 13px; color: var(--color-text-muted); margin: 4px 0 0; }
.mod-admin__add-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px;
  background: var(--accent-gradient); color: #fff; border: none; border-radius: 10px;
  font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: var(--accent-shadow);
}
.mod-admin__add-btn:hover { transform: translateY(-1px); }
.mod-admin__loading { text-align: center; padding: 60px; color: var(--color-text-muted); }

.mod-admin__table-wrap { overflow-x: auto; }
.mod-admin__table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.mod-admin__table th { text-align: left; padding: 12px 14px; font-weight: 700; color: var(--color-text-muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1px solid var(--glass-border); }
.mod-admin__table td { padding: 14px; border-bottom: 1px solid var(--glass-border); vertical-align: middle; }
.mod-admin__table tr:hover td { background: rgba(255,255,255,0.02); }
.row--disabled td { opacity: 0.5; }
.mod-admin__name { display: flex; flex-direction: column; gap: 2px; }
.mod-admin__name strong { font-size: 14px; }
.mod-admin__desc { font-size: 11px; color: var(--color-text-muted); max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.status-badge { font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 20px; }
.status-badge--active { background: rgba(52,211,153,0.12); color: #34d399; }
.status-badge--off { background: rgba(248,113,113,0.1); color: #f87171; }

.mod-admin__actions { display: flex; gap: 6px; }
.action-btn { padding: 6px 8px; background: var(--color-bg-elevated); border: 1px solid var(--glass-border); border-radius: 8px; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s; }
.action-btn:hover { color: var(--accent-light); border-color: var(--accent-light); }
.action-btn--danger:hover { color: #f87171; border-color: #f87171; }

.mod-admin__overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.mod-admin__modal { background: var(--color-bg-primary); border: 1px solid var(--glass-border); border-radius: 20px; padding: 28px; width: 520px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
.mod-admin__modal h3 { margin: 0 0 20px; font-size: 18px; font-weight: 800; }

.mod-admin__form { display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 4px; }
.form-row label { font-size: 12px; font-weight: 700; color: var(--color-text-muted); }
.form-row input, .form-row textarea, .form-row select { padding: 10px 14px; background: var(--color-bg-elevated); border: 1px solid var(--glass-border); border-radius: 10px; color: var(--color-text-primary); font-size: 13px; }
.form-row input:focus, .form-row textarea:focus, .form-row select:focus { border-color: var(--accent-light); outline: none; }
.form-row-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.mod-admin__modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
.btn { padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
.btn--cancel { background: var(--color-bg-elevated); color: var(--color-text-secondary); border: 1px solid var(--glass-border); }
.btn--save { background: var(--accent-gradient); color: #fff; box-shadow: var(--accent-shadow); }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
