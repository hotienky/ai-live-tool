<template>
  <div class="forms-mgr">
    
    <!-- VIEW 1: DANH SÁCH BIỂU MẪU -->
    <template v-if="!isEditing">
      <div class="fm-header">
        <h3><Database :size="16" /> Quản lý Biểu mẫu (Forms)</h3>
        <button class="btn-add" @click="createNewForm">
          <Plus :size="14" /> Thêm Biểu mẫu
        </button>
      </div>

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
    </template>

    <!-- VIEW 2: MÀN HÌNH FORM BUILDER -->
    <template v-else>
      <div class="builder-view">
        <div class="builder-header">
          <div class="builder-header__left">
            <button class="btn-back" @click="isEditing = false">
              <ChevronLeft :size="16" /> Trở về
            </button>
            <div class="builder-title">
              <h3>{{ editingForm.id ? 'Sửa Biểu mẫu' : 'Tạo Biểu mẫu mới' }}</h3>
              <span class="builder-subtitle" v-if="editingForm.id">ID: {{ editingForm.id }}</span>
            </div>
          </div>
          <button class="btn-primary" @click="saveEditingForm">
            <Save :size="14" /> Lưu Biểu mẫu
          </button>
        </div>

        <div class="builder-body">
          <div class="builder-sidebar">
            <div class="bs-panel">
              <h4 class="panel-title">Cài đặt chung</h4>
              <div class="param-row param-col">
                <label>Tên biểu mẫu</label>
                <input type="text" v-model="editingForm.title" class="param-input" placeholder="VD: Đăng ký tư vấn">
              </div>
            </div>
          </div>

          <div class="builder-content">
            <div class="bc-header">
              <h4 class="panel-title">Các trường thông tin (Fields)</h4>
              <button class="btn-add-item-sm" @click="addField">
                <Plus :size="14" /> Thêm Trường
              </button>
            </div>
            
            <div class="fields-grid" v-if="editingForm.fields.length">
              <div v-for="(field, idx) in editingForm.fields" :key="idx" class="field-item">
                <div class="field-item-header">
                  <strong>Trường #{{ idx + 1 }}</strong>
                  <button class="btn-remove-item" @click="editingForm.fields.splice(idx, 1)"><Trash2 :size="14" /></button>
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
                    <input type="text" v-model="field.name" class="param-input" placeholder="VD: first_name">
                  </div>
                  <div class="param-row">
                    <label>Tiêu đề (Label)</label>
                    <input type="text" v-model="field.label" class="param-input" placeholder="VD: Họ và tên">
                  </div>
                  <div class="param-row">
                    <label>Placeholder</label>
                    <input type="text" v-model="field.placeholder" class="param-input" placeholder="Nhập vào ô...">
                  </div>
                  <div class="param-row" v-if="field.type === 'select'">
                    <label>Tuỳ chọn (CSV)</label>
                    <input type="text" v-model="field.options" class="param-input" placeholder="Nam,Nữ,Khác">
                  </div>
                  <div class="param-row" style="justify-content: flex-start; gap: 8px; margin-top: 4px;">
                    <input type="checkbox" v-model="field.required" :id="'chk_'+idx">
                    <label :for="'chk_'+idx" style="width: auto; cursor: pointer;">Bắt buộc nhập</label>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="fields-empty" v-else>
              <p>Chưa có trường nhập liệu nào.</p>
              <button class="btn-add-item-sm" style="margin: 0 auto;" @click="addField">Thêm ngay</button>
            </div>
          </div>
        </div>
      </div>
    </template>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Database, Plus, Component as ComponentIcon, Settings2, Trash2, Save, ChevronLeft } from 'lucide-vue-next'
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

/* LIST CSS */
.fm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.fm-header h3 { margin: 0; font-size: 1.1rem; display: flex; align-items: center; gap: 8px; color: var(--color-text-primary, #fff); }

.btn-add { display: flex; align-items: center; gap: 6px; background: var(--accent-gradient, linear-gradient(135deg, #8b5cf6, #d946ef)); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; font-weight: 600; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); }
.btn-add:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4); }

.fm-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 80px 20px; background: var(--bg-card, rgba(0,0,0,0.15)); border: 1px dashed var(--border-color, rgba(255,255,255,0.1)); border-radius: 16px; flex: 1; }
.fm-empty-icon { display: flex; align-items: center; justify-content: center; width: 96px; height: 96px; border-radius: 50%; background: rgba(139, 92, 246, 0.05); color: #8b5cf6; margin-bottom: 24px; box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 0 40px rgba(139, 92, 246, 0.05); }
.fm-empty-state h2 { font-size: 1.25rem; font-weight: 600; margin: 0 0 12px 0; color: var(--color-text-primary, #fff); }
.fm-empty-state p { font-size: 0.95rem; color: var(--text-2, #9ca3af); line-height: 1.6; margin: 0 0 32px 0; max-width: 450px; }

.cm-list { display: flex; flex-direction: column; gap: 8px; }
.cm-card { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; gap: 8px; }
.cm-card__info { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex: 1; }
.cm-card__title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.cm-slug { font-size: 0.75rem; color: var(--text-3, #888); font-family: monospace; }
.cm-card__actions { display: flex; gap: 6px; align-items: center; }
.btn-sm { padding: 5px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); display: inline-flex; align-items: center; gap: 4px; }
.btn-sm:hover { border-color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }

.badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 8px; font-size: .65rem; font-weight: 700; text-transform: uppercase; }
.badge--dynamic { background: rgba(139,92,246,.15); color: #7c3aed; border: 1px solid rgba(139,92,246,.3); }

/* BUILDER VIEW (Màn hình riêng tách khỏi Modal) */
.builder-view { display: flex; flex-direction: column; height: 100%; animation: fadein 0.2s ease; }
@keyframes fadein { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }

.builder-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid var(--border); }
.builder-header__left { display: flex; align-items: center; gap: 16px; }
.btn-back { display: flex; align-items: center; gap: 4px; background: transparent; border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; color: var(--text-1); cursor: pointer; font-size: 0.85rem; font-weight: 500; }
.btn-back:hover { background: var(--bg-2); }
.builder-title h3 { margin: 0; font-size: 1.15rem; color: var(--text-1); }
.builder-subtitle { font-size: 0.75rem; color: var(--text-3); font-family: monospace; }

.builder-body { display: flex; gap: 24px; align-items: flex-start; flex: 1; overflow: hidden; }
.builder-sidebar { width: 280px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px; }
.builder-content { flex: 1; min-width: 0; background: var(--bg-2); border: 1px solid var(--border); border-radius: 12px; display: flex; flex-direction: column; height: 100%; overflow: hidden; }

.panel-title { font-size: 0.9rem; font-weight: 600; color: var(--text-2); margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.5px; }
.bs-panel { background: var(--bg-2); border: 1px solid var(--border); padding: 16px; border-radius: 12px; }

.bc-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid var(--border); background: var(--bg-1); }
.bc-header h4 { margin: 0; }
.btn-add-item-sm { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; background: var(--accent); color: #fff; border: none; cursor: pointer; font-size: 0.8rem; font-weight: 500; }
.btn-add-item-sm:hover { filter: brightness(1.1); }

.fields-grid { padding: 20px; overflow-y: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; height: 100%; top: 0; }
.fields-empty { padding: 60px 20px; text-align: center; color: var(--text-3); display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; }

/* FIELD ITEM CARD */
.field-item { background: var(--bg-1); border: 1px solid var(--border); border-radius: 8px; display: flex; flex-direction: column; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
.field-item-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.02); font-size: 0.85rem; }
.field-item-body { padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.btn-remove-item { background: transparent; border: none; color: #ef4444; cursor: pointer; display: flex; align-items: center; padding: 4px; border-radius: 4px; opacity: 0.7; }
.btn-remove-item:hover { background: rgba(239,68,68,0.1); opacity: 1; }

.btn-primary { display: flex; align-items: center; gap: 6px; background: var(--bg-2, rgba(255,255,255,0.05)); color: var(--color-text-primary, #fff); border: 1px solid var(--border-color, rgba(255,255,255,0.1)); padding: 8px 16px; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
.btn-primary:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); }

/* Param Inputs */
.param-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.param-col { flex-direction: column; align-items: stretch; gap: 6px; }
.param-row label { font-size: 0.8rem; color: var(--text-2); width: 100px; flex-shrink: 0; }
.param-col label { width: auto; font-weight: 500; }
.param-input, .param-select { flex: 1; width: 100%; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: rgba(0,0,0,0.1); color: var(--text-1); font-size: 0.85rem; transition: border-color 0.15s; }
.param-input:focus, .param-select:focus { outline: none; border-color: var(--accent); }
</style>
