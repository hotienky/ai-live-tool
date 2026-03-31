<template>
  <div class="forms-mgr">
    <div class="fm-header">
      <h3><Database :size="16" /> Quản lý Biểu mẫu (Forms)</h3>
      <button class="btn-add" @click="createNewForm">
        <Plus :size="14" /> Thêm Biểu mẫu
      </button>
    </div>

    <!-- Danh sách Form -->
    <div class="cm-list" v-if="forms.length">
      <div class="cm-card" v-for="form in forms" :key="form.id">
        <div class="cm-card__info">
          <div class="cm-card__title-row">
            <strong>{{ form.title }}</strong>
            <span class="badge badge--dynamic">{{ form.fields?.length || 0 }} trường</span>
          </div>
          <span class="cm-slug">ID: {{ form.id }}</span>
        </div>
        <div class="cm-card__actions">
          <button class="btn-sm btn-edit" @click="editForm(form)">
            <Settings2 :size="12" /> Sửa Fields
          </button>
          <button class="btn-sm btn-del" @click="handleDelete(form.id)" title="Xóa">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="fm-empty-state">
      <div class="fm-empty-icon">
        <ComponentIcon :size="56" stroke-width="1" />
      </div>
      <h2>Chưa có Biểu mẫu nào</h2>
      <p>Hệ thống Thiết kế Biểu mẫu Động (Kéo thả Input, Checkbox, Dropdown...) <br>giúp bạn tương tác với Khách hàng.</p>
      <button class="btn-primary" @click="createNewForm">
        Khởi tạo Biểu mẫu
      </button>
    </div>

    <!-- Form Editor Modal -->
    <div class="modal-overlay" v-if="isEditing" @click.self="isEditing = false">
      <div class="modal modal--wide">
        <div class="preview-header">
          <h3>{{ editingForm.id ? 'Sửa Biểu mẫu' : 'Tạo Biểu mẫu mới' }}</h3>
          <button class="btn-close" @click="isEditing = false">×</button>
        </div>
        
        <div class="form-editor-body">
          <div class="param-row" style="margin-bottom: 24px;">
            <label>Tên biểu mẫu</label>
            <input type="text" v-model="editingForm.title" class="param-input param-input--wide" placeholder="VD: Đăng ký tư vấn">
          </div>

          <h4 style="margin-bottom: 12px; font-size: 14px; border-bottom: 1px solid var(--border); padding-bottom: 8px;">Các trường thông tin (Fields)</h4>
          
          <div v-for="(field, idx) in editingForm.fields" :key="idx" class="field-item">
            <div class="field-item-header">
              <strong>Trường #{{ idx + 1 }}</strong>
              <button class="btn-remove-item" @click="editingForm.fields.splice(idx, 1)"><Trash2 :size="12" /></button>
            </div>
            <div class="field-item-body">
              <div class="param-row">
                <label>Loại (Type)</label>
                <select v-model="field.type" class="param-select">
                  <option value="text">Văn bản ngắn (Text)</option>
                  <option value="email">Email</option>
                  <option value="tel">Số điện thoại (Tel)</option>
                  <option value="textarea">Đoạn văn (Textarea)</option>
                  <option value="select">Dropdown Choice</option>
                </select>
              </div>
              <div class="param-row">
                <label>Tên tham số (Name)</label>
                <input type="text" v-model="field.name" class="param-input param-input--wide" placeholder="VD: first_name">
              </div>
              <div class="param-row">
                <label>Tiêu đề hiển thị (Label)</label>
                <input type="text" v-model="field.label" class="param-input param-input--wide" placeholder="VD: Họ và tên">
              </div>
              <div class="param-row">
                <label>Placeholder</label>
                <input type="text" v-model="field.placeholder" class="param-input param-input--wide" placeholder="Nhập vào ô...">
              </div>
              <div class="param-row" v-if="field.type === 'select'">
                <label>Tuỳ chọn (Options)</label>
                <input type="text" v-model="field.options" class="param-input param-input--wide" placeholder="Cách nhau bởi dấu phẩy, VD: Nam,Nữ,Khác">
              </div>
              <div class="param-row" style="justify-content: flex-start; gap: 8px;">
                <input type="checkbox" v-model="field.required" :id="'chk_'+idx">
                <label :for="'chk_'+idx" style="width: auto;">Bắt buộc nhập (Required)</label>
              </div>
            </div>
          </div>

          <button class="btn-add-item" @click="addField">
            <Plus :size="12" /> Thêm Trường Input
          </button>
        </div>

        <div class="preview-footer">
          <button class="btn-primary" @click="saveEditingForm">
            <Save :size="14" /> Lưu Biểu mẫu
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Database, Plus, Component as ComponentIcon, Settings2, Trash2, Save } from 'lucide-vue-next'
import { useForms } from '../../composables/useForms.js'

const { forms, fetchForms, saveForm, deleteForm } = useForms()

const isEditing = ref(false)
const editingForm = ref({ title: '', fields: [] })

onMounted(() => {
  fetchForms()
})

function createNewForm() {
  editingForm.value = {
    title: 'Biểu mẫu Mới',
    fields: [
      { name: 'fullname', label: 'Họ và tên', type: 'text', placeholder: 'Nhập họ tên', required: true },
      { name: 'phone', label: 'Số điện thoại', type: 'tel', placeholder: 'Nhập số đt', required: true }
    ]
  }
  isEditing.value = true
}

function editForm(form) {
  // Deep clone
  editingForm.value = JSON.parse(JSON.stringify(form))
  if (!editingForm.value.fields) editingForm.value.fields = []
  isEditing.value = true
}

function addField() {
  editingForm.value.fields.push({
    name: 'field_' + Date.now().toString().slice(-4),
    label: 'Trường mới',
    type: 'text',
    placeholder: '',
    required: false
  })
}

async function saveEditingForm() {
  if (!editingForm.value.title) {
    alert('Vui lòng nhập tên biểu mẫu.')
    return
  }
  for (const f of editingForm.value.fields) {
    if (!f.name || !f.label) {
      alert('Tên tham số (name) và Nhãn (label) không được để trống.')
      return
    }
  }
  await saveForm(editingForm.value)
  isEditing.value = false
}

async function handleDelete(id) {
  if (confirm('Bạn có chắc chắn muốn xoá Biểu mẫu này?')) {
    await deleteForm(id)
  }
}
</script>

<style scoped>
.forms-mgr {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.fm-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary, #fff);
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--accent-gradient, linear-gradient(135deg, #8b5cf6, #d946ef));
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25);
}
.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}

.fm-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card, rgba(0,0,0,0.15));
  border: 1px dashed var(--border-color, rgba(255,255,255,0.1));
  border-radius: 16px;
  flex: 1;
}

.fm-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.05);
  color: #8b5cf6;
  margin-bottom: 24px;
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 0 40px rgba(139, 92, 246, 0.05);
}

.fm-empty-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.02em;
}

.fm-empty-state p {
  font-size: 0.95rem;
  color: var(--color-text-secondary, #9ca3af);
  line-height: 1.6;
  margin: 0 0 32px 0;
  max-width: 450px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-2, rgba(255,255,255,0.05));
  color: var(--color-text-primary, #fff);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}

/* LIST CSS */
.cm-list { display: flex; flex-direction: column; gap: 8px; }
.cm-card { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; gap: 8px; }
.cm-card__info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1; }
.cm-card__title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cm-slug { font-size: 0.75rem; color: var(--text-3, #888); font-family: monospace; }
.cm-card__actions { display: flex; gap: 6px; align-items: center; }
.btn-sm { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); display: inline-flex; align-items: center; gap: 4px; }
.btn-sm:hover { border-color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }

.badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 8px; font-size: .65rem; font-weight: 700; text-transform: uppercase; }
.badge--dynamic { background: rgba(139,92,246,.15); color: #7c3aed; border: 1px solid rgba(139,92,246,.3); }

/* MODAL CSS */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal--wide { width: 90%; max-width: 600px; background: var(--bg-1, #1a1b1e); padding: 20px; border-radius: 12px; border: 1px solid var(--border); max-height: 90vh; display: flex; flex-direction: column; }
.preview-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.preview-header h3 { margin: 0; font-size: 1.1rem; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-2); padding: 0; line-height: 1; }
.form-editor-body { flex: 1; overflow-y: auto; padding-right: 8px; }
.preview-footer { margin-top: 20px; display: flex; justify-content: flex-end; padding-top: 16px; border-top: 1px solid var(--border); }

/* FIELD EDITOR CSS */
.field-item { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; margin-bottom: 12px; overflow: hidden; }
.field-item-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.02); border-bottom: 1px solid var(--border); font-size: 0.85rem; }
.field-item-body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
.btn-remove-item { background: transparent; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 4px; }
.btn-remove-item:hover { background: rgba(239,68,68,0.1); }
.btn-add-item { width: 100%; padding: 10px; border-radius: 8px; border: 1px dashed var(--border); background: transparent; color: var(--text-2); display: flex; justify-content: center; align-items: center; gap: 6px; cursor: pointer; font-size: 0.85rem; }
.btn-add-item:hover { border-color: var(--accent); color: var(--accent); }

/* Param Inputs */
.param-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.param-row label { font-size: 0.85rem; color: var(--text-2); width: 120px; flex-shrink: 0; }
.param-input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text-1); font-size: 0.85rem; }
.param-select { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text-1); font-size: 0.85rem; }
</style>
