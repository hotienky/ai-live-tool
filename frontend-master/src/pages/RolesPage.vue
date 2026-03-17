<template>
  <div class="p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold mp-text-primary">Quản lý Roles</h1>
        <p class="text-sm mp-text-muted">Phân quyền truy cập cho từng vai trò</p>
      </div>
      <button @click="showModal = true; resetForm()" class="btn-primary flex items-center gap-2">
        <Plus :size="16" /> Thêm Role
      </button>
    </div>

    <!-- Roles Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-if="loading" class="col-span-full text-center py-12 mp-text-muted">Đang tải...</div>

      <div v-for="r in items" :key="r.id" class="card p-5">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-bold mp-text-primary">{{ r.display_name || r.name }}</h3>
            <p class="text-xs mp-text-muted font-mono mt-0.5">{{ r.name }}</p>
          </div>
          <div class="flex items-center gap-1">
            <button @click="editRole(r)" class="btn-icon" title="Sửa"><Pencil :size="14" /></button>
            <button v-if="r.name !== 'super_admin'" @click="deleteRole(r)" class="btn-icon btn-icon--danger" title="Xóa"><Trash2 :size="14" /></button>
          </div>
        </div>

        <div class="mt-3">
          <p class="text-xs font-semibold mp-text-muted uppercase mb-2">Permissions</p>
          <div class="flex flex-wrap gap-1">
            <span v-for="p in (r.permissions || [])" :key="p" class="mp-perm-tag">{{ p }}</span>
            <span v-if="!r.permissions?.length" class="text-xs mp-text-muted">Chưa có</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="mp-modal-overlay" @click.self="showModal = false">
      <div class="mp-modal">
        <h2 class="text-lg font-bold mp-text-primary mb-4">{{ editing ? 'Sửa Role' : 'Tạo Role mới' }}</h2>

        <div v-if="formError" class="mb-3 p-2 rounded text-sm bg-red-500/10 text-red-400 border border-red-500/20">{{ formError }}</div>

        <div class="space-y-4">
          <div>
            <label class="mp-label">Tên hệ thống (slug) *</label>
            <input v-model="form.name" type="text" class="input w-full" placeholder="manager" :disabled="!!editing" />
          </div>
          <div>
            <label class="mp-label">Tên hiển thị *</label>
            <input v-model="form.display_name" type="text" class="input w-full" placeholder="Manager" />
          </div>
          <div>
            <label class="mp-label">Permissions</label>
            <p class="text-xs mp-text-muted mb-2">Tick chọn quyền cho vai trò này</p>

            <div class="space-y-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" :checked="form.permissions.includes('*')" @change="togglePerm('*')" />
                <span class="text-sm font-semibold mp-text-primary">Full Access (*)</span>
              </label>

              <div v-for="group in permGroups" :key="group.key" class="mp-perm-group">
                <p class="text-xs font-semibold mp-text-muted uppercase mb-1.5">{{ group.label }}</p>
                <div class="flex flex-wrap gap-x-4 gap-y-1">
                  <label v-for="p in group.perms" :key="p" class="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" :checked="form.permissions.includes(p)" @change="togglePerm(p)" :disabled="form.permissions.includes('*')" />
                    <span class="text-sm mp-text-secondary">{{ p }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button @click="showModal = false" class="btn-ghost">Hủy</button>
          <button @click="handleSubmit" :disabled="saving" class="btn-primary flex items-center gap-2">
            <Loader2 v-if="saving" :size="16" class="animate-spin" />
            {{ saving ? 'Đang lưu...' : (editing ? 'Cập nhật' : 'Tạo') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { roles } from '../services/api.js'

const items = ref([])
const loading = ref(false)
const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref('')
const form = ref({ name: '', display_name: '', permissions: [] })

const permGroups = [
  {
    key: 'tenants', label: 'Tenants',
    perms: ['tenants.view', 'tenants.create', 'tenants.edit', 'tenants.delete', 'tenants.suspend'],
  },
  {
    key: 'users', label: 'Users',
    perms: ['users.view', 'users.create', 'users.edit', 'users.delete'],
  },
  {
    key: 'roles', label: 'Roles',
    perms: ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
  },
  {
    key: 'system', label: 'System',
    perms: ['system.settings', 'system.logs'],
  },
]

function resetForm() {
  editing.value = null
  form.value = { name: '', display_name: '', permissions: [] }
  formError.value = ''
}

function editRole(r) {
  editing.value = r.id
  form.value = { name: r.name, display_name: r.display_name || '', permissions: [...(r.permissions || [])] }
  formError.value = ''
  showModal.value = true
}

function togglePerm(p) {
  const idx = form.value.permissions.indexOf(p)
  if (idx >= 0) {
    form.value.permissions.splice(idx, 1)
  } else {
    form.value.permissions.push(p)
  }
}

async function handleSubmit() {
  formError.value = ''
  saving.value = true
  try {
    if (editing.value) {
      await roles.update(editing.value, { display_name: form.value.display_name, permissions: form.value.permissions })
    } else {
      await roles.create(form.value)
    }
    showModal.value = false
    load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function deleteRole(r) {
  if (!confirm(`Xóa role "${r.display_name || r.name}"?`)) return
  try {
    await roles.remove(r.id)
    load()
  } catch (err) {
    alert(err.message)
  }
}

async function load() {
  loading.value = true
  try { items.value = await roles.list() } catch { items.value = [] } finally { loading.value = false }
}

onMounted(load)
</script>

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-label { display: block; font-size: 0.75rem; color: var(--mp-text-muted); margin-bottom: 6px; }

.mp-perm-tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 11px; font-weight: 500; font-family: monospace;
  background: var(--mp-bg-input); color: var(--mp-text-secondary);
  border: 1px solid var(--mp-border);
}

.mp-perm-group {
  padding: 10px 12px; border-radius: 8px;
  background: var(--mp-bg-input); border: 1px solid var(--mp-border);
}

.btn-icon { background: none; border: 1px solid var(--mp-border); border-radius: 6px; padding: 6px; color: var(--mp-text-muted); cursor: pointer; transition: all 0.2s; }
.btn-icon:hover { background: var(--mp-nav-hover-bg); color: var(--mp-text-primary); }
.btn-icon--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.3); }

.mp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
.mp-modal { background: var(--mp-bg-card); border: 1px solid var(--mp-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 520px; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
</style>
