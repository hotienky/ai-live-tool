<template>
  <div class="schema-builder">
    <div class="sc-header">
      <h2><Database class="icon" :size="20"/> Schema Builder: Tùy chỉnh loại Nội dung</h2>
      <button class="btn-create" @click="openCreateModal"><Plus :size="16"/> Tạo Schema Mới</button>
    </div>

    <!-- Danh sách các Content Types -->
    <div class="sc-list" v-if="types.length">
      <div v-for="t in types" :key="t.id" class="sc-item">
        <div class="sc-item-icon">
          <component :is="icons[t.icon] || icons.FileText" :size="24" />
        </div>
        <div class="sc-item-info">
          <h3>{{ t.name }}</h3>
          <p>Key: <code>{{ t.type_key }}</code> | Singular: {{ t.singular_name }}</p>
        </div>
        <div class="sc-item-actions">
          <button class="btn-edit" @click="editType(t)"><Pencil :size="14"/> Sửa</button>
          <button class="btn-del" @click="deleteType(t.id)"><Trash2 :size="14"/> Xoá</button>
        </div>
      </div>
    </div>
    <div class="sc-empty" v-else>
      <Inbox :size="48"/>
      <p>Chưa có Custom Content Type nào. Hãy tạo một loại nội dung để bắt đầu (VD: Portfolio, Testimonial).</p>
    </div>

    <!-- Modal Form -->
    <div class="modal-overlay" v-if="isModalOpen" @click.self="closeModal">
      <div class="sc-modal">
        <div class="modal-header">
          <h3>{{ isEditing ? 'Chỉnh sửa Schema' : 'Tạo mới Schema' }}</h3>
          <button class="btn-close" @click="closeModal"><X :size="16"/></button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Tên hiển thị (Số nhiều) *</label>
              <input v-model="form.name" class="param-input" placeholder="VD: Dự án nổi bật" />
            </div>
            <div class="form-group">
              <label>Tên đơn (Số ít) *</label>
              <input v-model="form.singular_name" class="param-input" placeholder="VD: Dự án" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Type Key (ID) *</label>
              <input v-model="form.type_key" class="param-input" :disabled="isEditing" placeholder="portfolio" />
              <small>Chỉ chứa chữ thường, số, dấu gạch dưới.</small>
            </div>
            <div class="form-group">
              <label>Biểu tượng (Icon)</label>
              <select v-model="form.icon" class="param-input">
                <option value="FileText">File Text</option>
                <option value="Briefcase">Briefcase (Công việc)</option>
                <option value="Star">Star (Đánh giá)</option>
                <option value="Users">Users (Team)</option>
                <option value="Image">Image (Gallery)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Các trường cơ bản</label>
            <div class="checkbox-group">
              <label><input type="checkbox" value="title" v-model="form.supports" /> Tiêu đề (Title)</label>
              <label><input type="checkbox" value="body" v-model="form.supports" /> Nội dung chính (Body)</label>
              <label><input type="checkbox" value="excerpt" v-model="form.supports" /> Đoạn trích (Excerpt)</label>
              <label><input type="checkbox" value="featured_image" v-model="form.supports" /> Ảnh đại diện (Image)</label>
              <label><input type="checkbox" value="slug" v-model="form.supports" /> Đường dẫn tĩnh (Slug)</label>
            </div>
          </div>

          <hr class="divider"/>

          <div class="form-group">
            <div class="meta-header">
              <label>Custom Meta Fields (Trường tùy chỉnh mở rộng)</label>
              <button class="btn-add-meta" @click="addMetaField"><Plus :size="12"/> Thêm field</button>
            </div>
            
            <div class="meta-list">
              <div v-for="(mf, index) in form.meta_fields" :key="index" class="meta-item">
                <input v-model="mf.key" class="param-input sm" placeholder="Key (VD: client_name)" />
                <input v-model="mf.label" class="param-input sm" placeholder="Nhãn (VD: Tên khách hàng)" />
                <select v-model="mf.type" class="param-input sm">
                  <option value="text">Text</option>
                  <option value="textarea">Textarea</option>
                  <option value="number">Number</option>
                  <option value="boolean">Boolean</option>
                </select>
                <button class="btn-del-meta" @click="form.meta_fields.splice(index, 1)"><Trash2 :size="12"/></button>
              </div>
            </div>
          </div>

        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">Hủy</button>
          <button class="btn-save" @click="saveSchema" :disabled="saving">
            {{ saving ? 'Đang lưu...' : 'Lưu Schema' }}
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
import { Database, Plus, FileText, Briefcase, Star, Users, Image, Pencil, Trash2, X, Inbox } from 'lucide-vue-next'

const { showToast } = useToast()
const icons = { Database, Plus, FileText, Briefcase, Star, Users, Image, Pencil, Trash2, X, Inbox }

const types = ref([])
const isModalOpen = ref(false)
const isEditing = ref(false)
const saving = ref(false)
const editId = ref(null)

const form = ref({
  type_key: '',
  name: '',
  singular_name: '',
  icon: 'FileText',
  supports: ['title', 'body', 'slug', 'featured_image'],
  meta_fields: []
})

async function fetchTypes() {
  try {
    const res = await apiFetch('/tenant-content-types')
    types.value = res.data || res || []
  } catch (e) {
    showToast('Lỗi tải danh sách Schema', 'error')
  }
}

function openCreateModal() {
  isEditing.value = false
  editId.value = null
  form.value = {
    type_key: '', name: '', singular_name: '', icon: 'FileText',
    supports: ['title', 'body', 'slug', 'featured_image'], meta_fields: []
  }
  isModalOpen.value = true
}

function editType(t) {
  isEditing.value = true
  editId.value = t.id
  form.value = {
    type_key: t.type_key,
    name: t.name,
    singular_name: t.singular_name,
    icon: t.icon,
    supports: t.supports || [],
    meta_fields: t.meta_fields ? JSON.parse(JSON.stringify(t.meta_fields)) : []
  }
  isModalOpen.value = true
}

function addMetaField() {
  form.value.meta_fields.push({ key: '', label: '', type: 'text' })
}

function closeModal() {
  isModalOpen.value = false
}

async function saveSchema() {
  if (!form.value.name || !form.value.type_key) {
    return showToast('Vui lòng nhập Tên và Type Key', 'error')
  }
  saving.value = true
  try {
    if (isEditing.value) {
      await apiFetch(`/tenant-content-types/${editId.value}`, {
        method: 'PUT',
        body: JSON.stringify(form.value)
      })
      showToast('Đã cập nhật Schema', 'success')
    } else {
      await apiFetch('/tenant-content-types', {
        method: 'POST',
        body: JSON.stringify(form.value)
      })
      showToast('Đã tạo Schema', 'success')
    }
    closeModal()
    fetchTypes()
  } catch (e) {
    showToast(e.message || 'Lỗi lưu Schema', 'error')
  }
  saving.value = false
}

async function deleteType(id) {
  if (!confirm('Bạn có chắc xoá Schema này? Dữ liệu con có thể bị ảnh hưởng.')) return
  try {
    await apiFetch(`/tenant-content-types/${id}`, { method: 'DELETE' })
    showToast('Đã xoá Schema', 'success')
    fetchTypes()
  } catch (e) {
    showToast(e.message || 'Lỗi xoá Schema', 'error')
  }
}

onMounted(() => {
  fetchTypes()
})
</script>

<style scoped>
.schema-builder { padding: 20px; }
.sc-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
.sc-header h2 { font-size: 20px; display: flex; align-items: center; gap: 8px; margin: 0; }
.btn-create { display: flex; align-items: center; gap: 6px; padding: 8px 16px; background: var(--accent); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }

.sc-list { display: flex; flex-direction: column; gap: 12px; }
.sc-item { display: flex; align-items: center; background: #fff; border: 1px solid var(--border); padding: 16px; border-radius: 8px; gap: 16px; }
.sc-item-icon { width: 48px; height: 48px; border-radius: 8px; background: var(--bg-1); display: flex; align-items: center; justify-content: center; color: var(--accent); }
.sc-item-info { flex: 1; }
.sc-item-info h3 { margin: 0 0 4px 0; font-size: 16px; }
.sc-item-info p { margin: 0; font-size: 13px; color: var(--text-3); }
.sc-item-actions { display: flex; gap: 8px; }
.btn-edit, .btn-del { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 6px; font-size: 13px; cursor: pointer; border: 1px solid transparent; }
.btn-edit { background: var(--bg-1); color: var(--text-1); border-color: var(--border); }
.btn-del { background: #fee2e2; color: #ef4444; }

.sc-empty { text-align: center; padding: 48px 20px; color: var(--text-3); }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.sc-modal { background: #fff; width: 600px; max-width: 90vw; border-radius: 12px; display: flex; flex-direction: column; max-height: 90vh; }
.modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal-header h3 { margin: 0; font-size: 16px; }
.btn-close { background: transparent; border: none; cursor: pointer; }
.modal-body { padding: 20px; overflow-y: auto; flex: 1; }
.form-row { display: flex; gap: 16px; margin-bottom: 16px; }
.form-group { flex: 1; margin-bottom: 16px; }
.form-group label { display: block; font-weight: 500; font-size: 13px; margin-bottom: 6px; }
.form-group small { display: block; color: var(--text-3); font-size: 12px; margin-top: 4px; }
.param-input { width: 100%; padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; }
.checkbox-group { display: flex; flex-wrap: wrap; gap: 12px; }
.checkbox-group label { display: flex; align-items: center; gap: 6px; font-weight: normal; font-size: 13px; }

.divider { border-top: 1px solid var(--border); margin: 20px 0; border-bottom: none; border-left: none; border-right: none;}
.meta-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.btn-add-meta { background: var(--accent-light); color: var(--accent); border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 4px; font-size: 12px; }
.meta-list { display: flex; flex-direction: column; gap: 8px; }
.meta-item { display: flex; gap: 8px; align-items: center; }
.sm { padding: 6px 8px; font-size: 13px; }
.btn-del-meta { background: transparent; border: none; color: #ef4444; cursor: pointer; }

.modal-footer { padding: 16px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 12px; }
.btn-cancel { padding: 8px 16px; background: transparent; border: 1px solid var(--border); border-radius: 6px; cursor: pointer; }
.btn-save { padding: 8px 16px; background: var(--accent); color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; }
.btn-save:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
