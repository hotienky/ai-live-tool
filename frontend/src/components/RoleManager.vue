<template>
  <div class="role-mgr">
    <div class="role-mgr__split">
      <!-- Left: Role list -->
      <div class="role-mgr__sidebar">
        <h3 class="role-mgr__title"><ShieldCheck :size="16" /> Phân quyền</h3>
        <div class="role-mgr__role-list">
          <button
            v-for="r in roles" :key="r.id"
            class="role-mgr__role-item"
            :class="{ active: selectedRole?.id === r.id }"
            @click="selectRole(r)"
          >
            <ShieldCheck :size="14" />
            <span>{{ r.display_name || r.name }}</span>
            <span class="role-mgr__badge" v-if="r.name === 'super_admin'">Super</span>
          </button>
        </div>
        <button class="role-mgr__add-btn" @click="startCreateRole">
          <Plus :size="14" /> Tạo role mới
        </button>

        <!-- Users section -->
        <h4 class="role-mgr__subtitle"><Users :size="14" /> Quản lý Users</h4>
        <div class="role-mgr__user-list">
          <div v-for="u in users" :key="u.id" class="role-mgr__user-row">
            <div class="role-mgr__user-info">
              <strong>{{ u.full_name || u.email }}</strong>
              <span>{{ u.email }}</span>
            </div>
            <select
              :value="u.role_id || ''"
              @change="assignRole(u.id, $event.target.value)"
              class="role-mgr__user-select"
            >
              <option value="">-- Chọn role --</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.display_name || r.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Right: Permission matrix -->
      <div class="role-mgr__detail" v-if="selectedRole || isCreating">
        <div class="role-mgr__detail-header">
          <input
            v-model="editForm.display_name"
            class="role-mgr__name-input"
            placeholder="Tên hiển thị (VD: Quản lý)"
          />
          <input
            v-model="editForm.name"
            class="role-mgr__slug-input"
            placeholder="slug (VD: manager)"
            :disabled="selectedRole?.name === 'super_admin'"
          />
          <div class="role-mgr__actions">
            <button class="role-mgr__save-btn" @click="saveRole" :disabled="saving">
              <Save :size="13" /> {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
            <button
              v-if="selectedRole && selectedRole.name !== 'super_admin'"
              class="role-mgr__delete-btn"
              @click="deleteRole"
            >
              <Trash2 :size="13" /> Xóa
            </button>
          </div>
        </div>

        <!-- Permission matrix -->
        <div class="role-mgr__matrix">
          <div v-for="(group, module) in permissionsByModule" :key="module" class="role-mgr__module">
            <div class="role-mgr__module-header">
              <label class="role-mgr__module-label">
                <input
                  type="checkbox"
                  :checked="isModuleFullyChecked(module)"
                  :indeterminate.prop="isModulePartiallyChecked(module)"
                  @change="toggleModule(module, $event.target.checked)"
                  :disabled="selectedRole?.name === 'super_admin'"
                />
                <span>{{ moduleLabels[module] || module }}</span>
              </label>
            </div>
            <div class="role-mgr__perms">
              <label
                v-for="perm in group" :key="perm.id"
                class="role-mgr__perm-item"
              >
                <input
                  type="checkbox"
                  :checked="editForm.permissionIds.includes(perm.id)"
                  @change="togglePerm(perm.id, $event.target.checked)"
                  :disabled="selectedRole?.name === 'super_admin'"
                />
                <span>{{ perm.display_name }}</span>
              </label>
            </div>
          </div>
        </div>
        <p v-if="selectedRole?.name === 'super_admin'" class="role-mgr__note">
          <AlertCircle :size="14" /> Super Admin có toàn quyền — không thể chỉnh sửa permissions.
        </p>
      </div>

      <div v-else class="role-mgr__empty">
        <ShieldCheck :size="28" />
        <p>Chọn một role để xem permissions</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, Plus, Save, Trash2, Users, AlertCircle } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const roles = ref([])
const users = ref([])
const allPermissions = ref([])
const selectedRole = ref(null)
const isCreating = ref(false)
const saving = ref(false)

const editForm = ref({
  name: '',
  display_name: '',
  permissionIds: [],
})

const moduleLabels = {
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
  customers: 'Khách hàng',
  cms: 'Trang CMS',
  banners: 'Banner',
  promotions: 'Khuyến mãi',
  settings: 'Cài đặt',
  system: 'Hệ thống',
}

const permissionsByModule = computed(() => {
  const map = {}
  for (const p of allPermissions.value) {
    if (!map[p.module]) map[p.module] = []
    map[p.module].push(p)
  }
  return map
})

function isModuleFullyChecked(module) {
  const perms = permissionsByModule.value[module] || []
  return perms.length > 0 && perms.every(p => editForm.value.permissionIds.includes(p.id))
}
function isModulePartiallyChecked(module) {
  const perms = permissionsByModule.value[module] || []
  const checked = perms.filter(p => editForm.value.permissionIds.includes(p.id))
  return checked.length > 0 && checked.length < perms.length
}
function toggleModule(module, checked) {
  const perms = permissionsByModule.value[module] || []
  const ids = perms.map(p => p.id)
  if (checked) {
    editForm.value.permissionIds = [...new Set([...editForm.value.permissionIds, ...ids])]
  } else {
    editForm.value.permissionIds = editForm.value.permissionIds.filter(id => !ids.includes(id))
  }
}
function togglePerm(id, checked) {
  if (checked) {
    editForm.value.permissionIds.push(id)
  } else {
    editForm.value.permissionIds = editForm.value.permissionIds.filter(i => i !== id)
  }
}

async function loadData() {
  try {
    const [rolesRes, permsRes, usersRes] = await Promise.all([
      apiFetch('/roles'),
      apiFetch('/roles/permissions'),
      apiFetch('/users'),
    ])
    roles.value = Array.isArray(rolesRes) ? rolesRes : (rolesRes?.data || [])
    allPermissions.value = Array.isArray(permsRes) ? permsRes : (permsRes?.data || [])
    users.value = Array.isArray(usersRes) ? usersRes : (usersRes?.data || [])
  } catch { /* ignore */ }
}

async function selectRole(role) {
  selectedRole.value = role
  isCreating.value = false
  try {
    const detail = await apiFetch(`/roles/${role.id}`)
    const data = detail?.data || detail
    editForm.value = {
      name: data.name || '',
      display_name: data.display_name || '',
      permissionIds: (data.permissions || []).map(p => p.id),
    }
  } catch { /* ignore */ }
}

function startCreateRole() {
  selectedRole.value = null
  isCreating.value = true
  editForm.value = { name: '', display_name: '', permissionIds: [] }
}

async function saveRole() {
  saving.value = true
  try {
    const payload = {
      name: editForm.value.name,
      display_name: editForm.value.display_name,
      permissions: editForm.value.permissionIds,
    }
    if (isCreating.value) {
      await apiFetch('/roles', { method: 'POST', body: JSON.stringify(payload) })
      showToast('Tạo role thành công!', 'success')
    } else {
      await apiFetch(`/roles/${selectedRole.value.id}`, { method: 'PUT', body: JSON.stringify(payload) })
      showToast('Cập nhật role thành công!', 'success')
    }
    await loadData()
    isCreating.value = false
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function deleteRole() {
  if (!confirm('Xóa role này?')) return
  try {
    await apiFetch(`/roles/${selectedRole.value.id}`, { method: 'DELETE' })
    showToast('Đã xóa role', 'success')
    selectedRole.value = null
    await loadData()
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

async function assignRole(userId, roleId) {
  try {
    await apiFetch(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_id: parseInt(roleId) }),
    })
    showToast('Đã gán role', 'success')
    await loadData()
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

onMounted(loadData)
</script>

<style scoped>
.role-mgr__split {
  display: flex; gap: 20px; min-height: 500px;
}
.role-mgr__sidebar {
  width: 280px; flex-shrink: 0;
}
.role-mgr__title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; margin-bottom: 12px; color: var(--color-text-primary);
}
.role-mgr__subtitle {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; margin: 20px 0 8px; color: var(--color-text-secondary);
}
.role-mgr__role-list {
  display: flex; flex-direction: column; gap: 2px;
}
.role-mgr__role-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px; border: 1px solid transparent;
  background: none; cursor: pointer; font-size: 13px; font-weight: 500;
  color: var(--color-text-secondary); text-align: left; transition: all 0.15s;
}
.role-mgr__role-item:hover { background: var(--color-bg-card-solid); }
.role-mgr__role-item.active {
  background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary);
}
.role-mgr__badge {
  margin-left: auto; font-size: 10px; font-weight: 700; padding: 2px 6px;
  border-radius: 4px; background: rgba(124,58,237,0.15); color: var(--color-accent-primary);
}
.role-mgr__role-item.active .role-mgr__badge {
  background: rgba(255,255,255,0.2); color: #fff;
}
.role-mgr__add-btn {
  display: flex; align-items: center; gap: 6px; margin-top: 8px;
  padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--color-border);
  background: none; cursor: pointer; font-size: 12px; font-weight: 600;
  color: var(--color-text-muted); transition: all 0.2s; width: 100%;
}
.role-mgr__add-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.role-mgr__user-list { display: flex; flex-direction: column; gap: 6px; }
.role-mgr__user-row {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 0; border-bottom: 1px solid var(--color-border);
}
.role-mgr__user-info {
  flex: 1; min-width: 0;
}
.role-mgr__user-info strong { display: block; font-size: 13px; color: var(--color-text-primary); }
.role-mgr__user-info span { font-size: 11px; color: var(--color-text-muted); }
.role-mgr__user-select {
  padding: 4px 8px; border-radius: 6px; border: 1px solid var(--color-border);
  background: var(--color-bg-card-solid); color: var(--color-text-primary);
  font-size: 11px; min-width: 100px;
}

.role-mgr__detail {
  flex: 1; min-width: 0;
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}
.role-mgr__detail-header {
  display: flex; align-items: center; gap: 10px; margin-bottom: 16px; flex-wrap: wrap;
}
.role-mgr__name-input, .role-mgr__slug-input {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-secondary); color: var(--color-text-primary);
  font-size: 14px; font-weight: 600;
}
.role-mgr__name-input { flex: 1; min-width: 160px; }
.role-mgr__slug-input { width: 140px; font-size: 12px; font-family: monospace; }
.role-mgr__slug-input:disabled { opacity: 0.5; }
.role-mgr__actions { display: flex; gap: 6px; margin-left: auto; }
.role-mgr__save-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 18px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff;
  font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.role-mgr__save-btn:hover { transform: translateY(-1px); }
.role-mgr__save-btn:disabled { opacity: .5; cursor: wait; }
.role-mgr__delete-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--color-border);
  background: none; color: #ef4444; font-size: 12px; font-weight: 600; cursor: pointer;
}
.role-mgr__delete-btn:hover { background: rgba(239,68,68,0.08); }

.role-mgr__matrix { display: flex; flex-direction: column; gap: 12px; }
.role-mgr__module {
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 12px;
}
.role-mgr__module-header {
  margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid var(--color-border);
}
.role-mgr__module-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; font-weight: 700; color: var(--color-text-primary); cursor: pointer;
}
.role-mgr__module-label input { accent-color: var(--color-accent-primary); }
.role-mgr__perms {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 4px;
}
.role-mgr__perm-item {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--color-text-secondary); cursor: pointer; padding: 2px 0;
}
.role-mgr__perm-item input { accent-color: var(--color-accent-primary); }
.role-mgr__note {
  display: flex; align-items: center; gap: 6px;
  margin-top: 12px; padding: 10px 14px; border-radius: 8px;
  background: rgba(124,58,237,0.06); color: var(--color-text-muted); font-size: 12px;
}

.role-mgr__empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; color: var(--color-text-muted);
}
.role-mgr__empty p { font-size: 13px; }

@media (max-width: 768px) {
  .role-mgr__split { flex-direction: column; }
  .role-mgr__sidebar { width: 100%; }
  .role-mgr__perms { grid-template-columns: 1fr; }
}
</style>
