<template>
  <div class="cf-mgr">
    <h3 class="section-title"><LayoutList :size="16" /> Custom Fields ({{ fields.length }})</h3>

    <!-- Entity type filter -->
    <div class="cf-filters">
      <button
        v-for="et in entityTypes"
        :key="et.key"
        class="cf-filter-btn"
        :class="{ active: activeEntity === et.key }"
        @click="activeEntity = et.key"
      >
        <component :is="et.icon" :size="13" /> {{ et.label }}
      </button>
    </div>

    <!-- Add field form -->
    <div class="cf-add-form">
      <div class="cf-add-row">
        <input v-model="newField.name" placeholder="Tên trường" class="cf-input cf-input--name" />
        <select v-model="newField.fieldType" class="cf-input cf-input--type">
          <option v-for="ft in fieldTypes" :key="ft.value" :value="ft.value">{{ ft.label }}</option>
        </select>
        <select v-model="newField.entityType" class="cf-input cf-input--entity">
          <option v-for="et in entityTypes" :key="et.key" :value="et.key">{{ et.label }}</option>
        </select>
        <button class="cf-add-btn" @click="addField" :disabled="!newField.name">
          <Plus :size="14" /> Thêm
        </button>
      </div>
      <div v-if="newField.fieldType === 'select'" class="cf-options-row">
        <input
          v-model="newField.optionsText"
          placeholder="Các tùy chọn (phân cách bằng dấu phẩy: Đỏ, Xanh, Vàng)"
          class="cf-input cf-input--full"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải...
    </div>

    <!-- Empty -->
    <div v-else-if="filteredFields.length === 0" class="empty-state">
      <LayoutList :size="36" />
      <p>Chưa có custom field nào</p>
      <small>Tạo trường tùy chỉnh để mở rộng dữ liệu sản phẩm, danh mục, khách hàng...</small>
    </div>

    <!-- Field list -->
    <div v-else class="cf-list">
      <div v-for="field in filteredFields" :key="field.id" class="cf-item">
        <div class="cf-item__info">
          <div class="cf-item__header">
            <span class="cf-item__name">{{ field.name }}</span>
            <span class="cf-item__type">{{ fieldTypeLabel(field.fieldType || field.field_type) }}</span>
            <span class="cf-item__entity">{{ entityLabel(field.entityType || field.entity_type) }}</span>
          </div>
          <div class="cf-item__meta" v-if="field.options">
            <span class="cf-item__options">
              Tùy chọn: {{ formatOptions(field.options) }}
            </span>
          </div>
        </div>
        <div class="cf-item__actions">
          <label class="toggle-switch">
            <input type="checkbox" :checked="field.isActive ?? field.is_active ?? true" @change="toggleField(field)" />
            <span class="toggle-slider"></span>
          </label>
          <button class="cf-del-btn" @click="deleteField(field.id)" title="Xóa">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { LayoutList, Plus, Trash2, Loader2, ShoppingBag, FolderTree, Users, FileText } from 'lucide-vue-next'

const { showToast } = useToast()

const entityTypes = [
  { key: 'all', label: 'Tất cả', icon: LayoutList },
  { key: 'product', label: 'Sản phẩm', icon: ShoppingBag },
  { key: 'category', label: 'Danh mục', icon: FolderTree },
  { key: 'customer', label: 'Khách hàng', icon: Users },
  { key: 'page', label: 'Trang CMS', icon: FileText },
]

const fieldTypes = [
  { value: 'text', label: 'Văn bản' },
  { value: 'number', label: 'Số' },
  { value: 'select', label: 'Danh sách chọn' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'date', label: 'Ngày tháng' },
  { value: 'textarea', label: 'Văn bản dài' },
]

const fields = ref([])
const loading = ref(false)
const activeEntity = ref('all')

const newField = ref({
  name: '',
  fieldType: 'text',
  entityType: 'product',
  optionsText: '',
})

const filteredFields = computed(() => {
  if (activeEntity.value === 'all') return fields.value
  return fields.value.filter(f => (f.entityType || f.entity_type) === activeEntity.value)
})

async function loadFields() {
  loading.value = true
  try {
    const res = await apiFetch('/custom-fields')
    fields.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Load custom fields error:', e)
  } finally {
    loading.value = false
  }
}

async function addField() {
  if (!newField.value.name) return
  try {
    const options = newField.value.fieldType === 'select' && newField.value.optionsText
      ? newField.value.optionsText.split(',').map(o => o.trim()).filter(Boolean)
      : null
    const field = await apiFetch('/custom-fields', {
      method: 'POST',
      body: JSON.stringify({
        name: newField.value.name,
        fieldType: newField.value.fieldType,
        entityType: newField.value.entityType,
        options: options ? JSON.stringify(options) : null,
      }),
    })
    if (field) {
      fields.value.unshift(field)
      newField.value = { name: '', fieldType: 'text', entityType: 'product', optionsText: '' }
      showToast('Đã thêm custom field', 'success')
    }
  } catch (e) {
    showToast('Lỗi thêm field', 'error')
  }
}

async function toggleField(field) {
  try {
    const isActive = !(field.isActive ?? field.is_active ?? true)
    await apiFetch(`/custom-fields/${field.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
    field.isActive = isActive
    field.is_active = isActive
  } catch (e) {
    showToast('Lỗi cập nhật', 'error')
  }
}

async function deleteField(id) {
  if (!confirm('Xóa custom field này? Dữ liệu liên quan sẽ bị mất.')) return
  try {
    await apiFetch(`/custom-fields/${id}`, { method: 'DELETE' })
    fields.value = fields.value.filter(f => f.id !== id)
    showToast('Đã xóa custom field', 'success')
  } catch (e) {
    showToast('Lỗi xóa', 'error')
  }
}

function fieldTypeLabel(type) {
  return fieldTypes.find(ft => ft.value === type)?.label || type
}

function entityLabel(type) {
  return entityTypes.find(et => et.key === type)?.label || type
}

function formatOptions(opts) {
  if (typeof opts === 'string') {
    try { opts = JSON.parse(opts) } catch { return opts }
  }
  if (Array.isArray(opts)) return opts.join(', ')
  return String(opts)
}

onMounted(() => loadFields())
</script>

<style scoped>
.cf-mgr { margin-top:0; }
.section-title { display:flex; align-items:center; gap:8px; font-size:15px; margin:0 0 16px; color:var(--color-text-primary); }

.cf-filters { display:flex; gap:6px; margin-bottom:12px; flex-wrap:wrap; }
.cf-filter-btn {
  display:flex; align-items:center; gap:5px;
  background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; padding:6px 14px; color:var(--color-text-muted);
  font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s;
}
.cf-filter-btn:hover { background:var(--color-bg-card-hover); }
.cf-filter-btn.active { border-color:var(--color-accent-primary); color:var(--color-accent-primary); background:rgba(124,58,237,0.1); }

.cf-add-form { margin-bottom:16px; }
.cf-add-row { display:flex; gap:8px; flex-wrap:wrap; }
.cf-options-row { margin-top:8px; }
.cf-input {
  background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; color:var(--color-text-primary); padding:9px 14px; font-size:13px;
  transition:border-color 0.2s;
}
.cf-input:focus { outline:none; border-color:var(--color-accent-primary); }
.cf-input::placeholder { color:var(--color-text-muted); }
.cf-input option { background:var(--color-bg-card-solid); color:var(--color-text-primary); }
.cf-input--name { flex:1; min-width:140px; }
.cf-input--type { width:140px; }
.cf-input--entity { width:130px; }
.cf-input--full { width:100%; }

.cf-add-btn {
  background:var(--accent-gradient); color:#fff; border:none;
  padding:9px 18px; border-radius:8px; font-weight:700; font-size:13px;
  cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  white-space:nowrap; box-shadow:var(--accent-shadow); transition:all 0.2s;
}
.cf-add-btn:hover { transform:translateY(-1px); }
.cf-add-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

/* Field list */
.cf-list { display:flex; flex-direction:column; gap:8px; }
.cf-item {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:14px 16px; border-radius:10px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  transition:all 0.2s;
}
.cf-item:hover { border-color:var(--color-border-hover); box-shadow:var(--shadow-card); }

.cf-item__info { flex:1; min-width:0; }
.cf-item__header { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.cf-item__name { font-size:13px; font-weight:700; color:var(--color-text-primary); }
.cf-item__type {
  font-size:10px; padding:2px 8px; border-radius:6px; font-weight:700;
  background:rgba(124,58,237,0.12); color:var(--accent-light,#a78bfa);
}
.cf-item__entity {
  font-size:10px; padding:2px 8px; border-radius:6px; font-weight:700;
  background:rgba(59,130,246,0.12); color:#3b82f6;
}
.cf-item__meta { margin-top:4px; font-size:11px; color:var(--color-text-muted); }

.cf-item__actions { display:flex; align-items:center; gap:10px; }
.cf-del-btn {
  background:none; border:1px solid var(--color-border); border-radius:6px;
  padding:4px 6px; cursor:pointer; color:var(--color-text-muted); transition:all 0.15s;
}
.cf-del-btn:hover { color:#ef4444; border-color:#ef4444; background:rgba(239,68,68,0.08); }

/* Toggle */
.toggle-switch { position:relative; width:36px; height:20px; cursor:pointer; }
.toggle-switch input { display:none; }
.toggle-slider { position:absolute; top:0; left:0; right:0; bottom:0; background:var(--color-border); border-radius:20px; transition:0.25s; }
.toggle-slider::before { content:''; position:absolute; width:16px; height:16px; left:2px; bottom:2px; background:var(--color-text-secondary); border-radius:50%; transition:0.25s; }
.toggle-switch input:checked + .toggle-slider { background:var(--color-accent-primary,#7c3aed); }
.toggle-switch input:checked + .toggle-slider::before { transform:translateX(16px); background:#fff; }

.loading-state,.empty-state {
  display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:40px 20px; color:var(--color-text-muted); text-align:center;
}
.empty-state p { font-size:14px; font-weight:600; color:var(--color-text-secondary); margin:0; }
.empty-state small { font-size:12px; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
