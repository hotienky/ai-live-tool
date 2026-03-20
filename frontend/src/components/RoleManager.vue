<template>
  <div class="rbac">
    <!-- Tab switcher -->
    <div class="rbac__tabs">
      <button class="rbac__tab" :class="{ active: activeTab === 'roles' }" @click="activeTab = 'roles'">
        <ShieldCheck :size="14" /> Phân quyền
      </button>
      <button class="rbac__tab" :class="{ active: activeTab === 'users' }" @click="activeTab = 'users'; loadUsers()">
        <Users :size="14" /> Quản lý Users
      </button>
    </div>

    <!-- ─────────── TAB: ROLES ─────────── -->
    <div v-if="activeTab === 'roles'" class="role-mgr">
      <RoleForm 
        v-if="showRoleForm"
        :role-id="selectedRole?.id"
        :all-permissions="allPermissions"
        @back="showRoleForm = false"
        @saved="onRoleFormSaved"
      />
      <div v-else class="role-mgr__list-view">
        <div class="role-mgr__header">
          <div class="role-mgr__search-wrap">
            <ShieldCheck :size="16" />
            <h3 style="margin: 0; font-size: 15px; font-weight: 700; color: var(--color-text-primary)">{{ t('admin.msg_b4781084', 'Danh sách Phân quyền') }}</h3>
          </div>
          <button class="role-mgr__add-btn" @click="startCreateRole">
            <Plus :size="14" /> Tạo role mới
          </button>
        </div>

        <div class="role-mgr__grid">
          <button v-for="r in roles" :key="r.id" class="role-card" @click="selectRole(r)">
            <div class="role-card__icon"><ShieldCheck :size="20" /></div>
            <div class="role-card__info">
              <div class="role-card__name">
                {{ r.display_name || r.name }}
                <span class="role-mgr__badge" v-if="r.name === 'super_admin'">Super</span>
              </div>
              <div class="role-card__slug">{{ r.name }}</div>
            </div>
            <div class="role-card__arrow"><ChevronRight :size="16" /></div>
          </button>
        </div>
      </div>
    </div>

    <!-- ─────────── TAB: USERS ─────────── -->
    <div v-if="activeTab === 'users'" class="user-mgr">
      <!-- Header -->
      <div class="user-mgr__header">
        <div class="user-mgr__search-wrap">
          <Search :size="14" class="user-mgr__search-icon" />
          <input v-model="userSearch" class="user-mgr__search" :placeholder="t('admin.msg_6453a4', 'Tìm theo tên, email...')" />
        </div>
        <button class="user-mgr__add-btn" @click="openUserModal()">
          <UserPlus :size="14" /> Thêm user
        </button>
      </div>

      <!-- Table -->
      <div class="user-mgr__table-wrap">
        <table class="user-mgr__table">
          <thead>
            <tr>
              <th>{{ t('admin.name', 'Tên') }}</th>
              <th>Email</th>
              <th>Role</th>
              <th>{{ t('admin.status', 'Trạng thái') }}</th>
              <th>{{ t('admin.created_at', 'Ngày tạo') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loadingUsers"><td colspan="6" class="user-mgr__loading">{{ t('admin.loading', 'Đang tải...') }}</td></tr>
            <tr v-else-if="filteredUsers.length === 0"><td colspan="6" class="user-mgr__empty-row">{{ t('admin.msg_54608204', 'Chưa có user nào') }}</td></tr>
            <tr v-for="u in filteredUsers" :key="u.id" class="user-mgr__row">
              <td class="user-mgr__name-cell">
                <div class="user-mgr__avatar">{{ (u.name || u.email)[0].toUpperCase() }}</div>
                <span>{{ u.name || '—' }}</span>
              </td>
              <td class="user-mgr__email">{{ u.email }}</td>
              <td>
                <span class="user-mgr__role-badge" v-if="u.role_display_name || u.role_name">
                  {{ u.role_display_name || u.role_name }}
                </span>
                <span v-else class="user-mgr__no-role">{{ t('admin.msg_cf792037', 'Chưa có') }}</span>
              </td>
              <td>
                <button
                  class="user-mgr__status-btn"
                  :class="u.is_active ? 'active' : 'inactive'"
                  @click="toggleActive(u)"
                  :title="u.is_active ? t('admin.msg_eaf765a7', 'Đang hoạt động — click để khoá') : t('admin.msg_0fca68b8', 'Đang khoá — click để mở')"
                >
                  <span class="user-mgr__status-dot"></span>
                  {{ u.is_active ? t('admin.msg_2c21bcd9', 'Hoạt động') : t('admin.msg_2c02db54', 'Đã khoá') }}
                </button>
              </td>
              <td class="user-mgr__date">{{ formatDate(u.created_at) }}</td>
              <td class="user-mgr__actions-cell">
                <button class="user-mgr__icon-btn" :title="t('admin.edit', 'Sửa')" @click="openUserModal(u)"><Pencil :size="13" /></button>
                <button class="user-mgr__icon-btn danger" :title="t('admin.delete', 'Xóa')" @click="deleteUser(u)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─────────── USER MODAL ─────────── -->
    <Teleport to="body">
      <div v-if="showUserModal" class="modal-overlay" @click.self="showUserModal = false">
        <div class="modal-box">
          <div class="modal-box__header">
            <h3>{{ userModalMode === 'create' ? t('admin.msg_85febf26', 'Thêm người dùng mới') : t('admin.msg_63fbe2ff', 'Chỉnh sửa người dùng') }}</h3>
            <button class="modal-box__close" @click="showUserModal = false"><X :size="16" /></button>
          </div>
          <div class="modal-box__body">
            <div class="form-row">
              <label>{{ t('admin.msg_39faf8ac', 'Họ tên') }} <span class="req">*</span></label>
              <input v-model="userForm.name" class="form-input" :placeholder="t('admin.msg_48bfbf', 'Nguyễn Văn A')" />
            </div>
            <div class="form-row">
              <label>Email <span class="req">*</span></label>
              <input v-model="userForm.email" type="email" class="form-input" placeholder="email@example.com" :disabled="userModalMode === 'edit'" />
            </div>
            <div class="form-row">
              <label>{{ userModalMode === 'create' ? t('admin.msg_6fa57410', 'Mật khẩu *') : t('admin.msg_a3bf3933', 'Mật khẩu mới (để trống = giữ nguyên)') }}</label>
              <div class="form-input-wrap">
                <input v-model="userForm.password" :type="showPw ? 'text' : 'password'" class="form-input" :placeholder="t('admin.msg_159f57', 'Tối thiểu 6 ký tự')" />
                <button type="button" class="form-pw-toggle" @click="showPw = !showPw">
                  <Eye v-if="!showPw" :size="14" /><EyeOff v-else :size="14" />
                </button>
              </div>
            </div>
            <div class="form-row">
              <label>{{ t('admin.msg_66ab1dca', 'Vai trò') }}</label>
              <select v-model="userForm.role_id" class="form-input form-input--select">
                <option :value="null">{{ t('admin.msg_b2d480c3', '-- Chọn role --') }}</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.display_name || r.name }}</option>
              </select>
            </div>
            <div class="form-row form-row--inline">
              <label>{{ t('admin.status', 'Trạng thái') }}</label>
              <label class="toggle-switch">
                <input type="checkbox" v-model="userForm.is_active" />
                <span class="toggle-track"><span class="toggle-thumb"></span></span>
                <span>{{ userForm.is_active ? t('admin.msg_cfaecd87', 'Đang hoạt động') : t('admin.msg_2c02db54', 'Đã khoá') }}</span>
              </label>
            </div>
            <p v-if="userFormError" class="form-error">{{ userFormError }}</p>
          </div>
          <div class="modal-box__footer">
            <button class="btn-cancel" @click="showUserModal = false">{{ t('admin.msg_9daba04f', 'Huỷ') }}</button>
            <button class="btn-save" @click="submitUserForm" :disabled="savingUser">
              <Loader2 v-if="savingUser" :size="14" class="spin" />
              {{ savingUser ? t('admin.saving', 'Đang lưu...') : (userModalMode === 'create' ? 'Tạo user' : 'Lưu thay đổi') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ShieldCheck, Plus, Save, Trash2, Users, AlertCircle, UserPlus, Search, Pencil, X, Eye, EyeOff, Loader2, ChevronRight } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import RoleForm from './RoleForm.vue'

const { t } = useI18n()

const { showToast } = useToast()

// ── Tab ──
const activeTab = ref('roles')

// ── Roles ──
const roles = ref([])
const allPermissions = ref([])
const selectedRole = ref(null)
const showRoleForm = ref(false)

async function loadRoles() {
  try {
    const [rolesRes, permsRes] = await Promise.all([apiFetch('/roles'), apiFetch('/roles/permissions')])
    const rolesData = await rolesRes.json()
    const permsData = await permsRes.json()
    roles.value = Array.isArray(rolesData) ? rolesData : (rolesData?.data || [])
    allPermissions.value = Array.isArray(permsData) ? permsData : (permsData?.data || [])
  } catch (e) { console.error('loadRoles error:', e) }
}

async function selectRole(role) {
  selectedRole.value = role
  showRoleForm.value = true
}

function startCreateRole() {
  selectedRole.value = null
  showRoleForm.value = true
}

async function onRoleFormSaved() {
  showRoleForm.value = false
  await loadRoles()
}

// ── Users ──
const users = ref([])
const userSearch = ref('')
const loadingUsers = ref(false)
const showUserModal = ref(false)
const userModalMode = ref('create') // 'create' | 'edit'
const savingUser = ref(false)
const showPw = ref(false)
const userFormError = ref('')
const editingUserId = ref(null)

const userForm = ref({ name: '', email: '', password: '', role_id: null, is_active: true })

const filteredUsers = computed(() => {
  const q = userSearch.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    (u.name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
})

async function loadUsers() {
  loadingUsers.value = true
  try {
    const res = await apiFetch('/users')
    const data = await res.json()
    users.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (e) { console.error('loadUsers error:', e) }
  finally { loadingUsers.value = false }
}

function openUserModal(user = null) {
  userFormError.value = ''
  showPw.value = false
  if (user) {
    userModalMode.value = 'edit'
    editingUserId.value = user.id
    userForm.value = { name: user.name || '', email: user.email, password: '', role_id: user.role_id || null, is_active: user.is_active }
  } else {
    userModalMode.value = 'create'
    editingUserId.value = null
    userForm.value = { name: '', email: '', password: '', role_id: null, is_active: true }
  }
  showUserModal.value = true
}

async function submitUserForm() {
  userFormError.value = ''
  if (!userForm.value.name.trim()) { userFormError.value = t('admin.msg_f4459eb2', 'Vui lòng nhập họ tên'); return }
  if (!userForm.value.email.trim()) { userFormError.value = t('admin.msg_a50b1323', 'Vui lòng nhập email'); return }
  if (userModalMode.value === 'create' && !userForm.value.password) { userFormError.value = t('admin.msg_cce22c24', 'Vui lòng nhập mật khẩu'); return }

  savingUser.value = true
  try {
    const payload = { ...userForm.value }
    if (!payload.password) delete payload.password

    let res
    if (userModalMode.value === 'create') {
      res = await apiFetch('/users', { method: 'POST', body: JSON.stringify(payload) })
    } else {
      res = await apiFetch(`/users/${editingUserId.value}`, { method: 'PUT', body: JSON.stringify(payload) })
    }

    if (!res.ok) {
      const err = await res.json()
      const firstError = err?.errors ? Object.values(err.errors)[0][0] : (err?.message || t('admin.msg_99fd705f', 'Lỗi không xác định'))
      userFormError.value = firstError
      return
    }

    showToast(userModalMode.value === 'create' ? t('admin.msg_1b18dd2f', 'Đã tạo user thành công!') : t('admin.msg_76ffed27', 'Đã cập nhật user!'), 'success')
    showUserModal.value = false
    await loadUsers()
  } catch (e) { userFormError.value = e.message }
  finally { savingUser.value = false }
}

async function toggleActive(user) {
  try {
    const res = await apiFetch(`/users/${user.id}/toggle-active`, { method: 'PATCH' })
    if (!res.ok) throw new Error('Failed')
    user.is_active = !user.is_active
    showToast(user.is_active ? t('admin.msg_d8b606d4', 'Đã mở khoá user') : t('admin.msg_60d1c6da', 'Đã khoá user'), 'success')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function deleteUser(user) {
  if (!confirm(`Xóa user "${user.name || user.email}"? Hành động này không thể hoàn tác.`)) return
  try {
    const res = await apiFetch(`/users/${user.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json(); throw new Error(d?.message || 'Error') }
    showToast(t('admin.msg_1f2807', 'Đã xóa user'), 'success')
    users.value = users.value.filter(u => u.id !== user.id)
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

function formatDate(dt) {
  if (!dt) return '—'
  return new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(async () => {
  await loadRoles()
})
</script>

<style scoped>
/* ── Tabs ── */
.rbac__tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border); padding-bottom: 0;
}
.rbac__tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border: none; background: none; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--color-text-muted);
  border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.2s;
}
.rbac__tab:hover { color: var(--color-text-primary); }
.rbac__tab.active { color: var(--color-accent-primary); border-bottom-color: var(--color-accent-primary); }

/* ── Role manager ── */
.role-mgr__list-view { animation: fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.role-mgr__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.role-mgr__search-wrap { display: flex; align-items: center; gap: 8px; }
.role-mgr__add-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: var(--accent-gradient); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
.role-mgr__add-btn:hover { opacity: .9; }
.role-mgr__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.role-card { display: flex; align-items: center; gap: 14px; padding: 16px; border-radius: 12px; border: 1px solid var(--color-border); background: var(--color-bg-card-solid); text-align: left; cursor: pointer; transition: all .2s; box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
.role-card:hover { border-color: var(--color-accent-primary); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.role-card__icon { width: 40px; height: 40px; border-radius: 10px; background: var(--color-bg-secondary); display: flex; align-items: center; justify-content: center; color: var(--color-text-secondary); transition: all .2s; }
.role-card:hover .role-card__icon { background: var(--color-accent-primary); color: #fff; }
.role-card__info { flex: 1; min-width: 0; }
.role-card__name { font-size: 15px; font-weight: 700; color: var(--color-text-primary); display: flex; align-items: center; gap: 8px; }
.role-card__slug { font-size: 13px; color: var(--color-text-secondary); margin-top: 4px; }
.role-mgr__badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: var(--color-accent-glow); color: var(--color-accent-primary); }
.role-card__arrow { color: var(--color-text-muted); display: flex; align-items: center; justify-content: center; opacity: 0; transform: translateX(-10px); transition: all .2s; }
.role-card:hover .role-card__arrow { opacity: 1; transform: translateX(0); }

/* ── User manager ── */
.user-mgr__header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
.user-mgr__search-wrap { position: relative; flex: 1; }
.user-mgr__search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--color-text-muted); }
.user-mgr__search {
  width: 100%; padding: 8px 12px 8px 32px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 13px;
}
.user-mgr__search:focus { outline: none; border-color: var(--color-accent-primary); }
.user-mgr__add-btn {
  display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; border: none;
  background: var(--accent-gradient); color: #fff;
  font-size: 13px; font-weight: 700; cursor: pointer; white-space: nowrap; box-shadow: var(--accent-shadow);
  transition: all 0.2s;
}
.user-mgr__add-btn:hover { transform: translateY(-1px); }
.user-mgr__table-wrap { overflow-x: auto; border-radius: 12px; border: 1px solid var(--color-border); }
.user-mgr__table { width: 100%; border-collapse: collapse; font-size: 13px; }
.user-mgr__table th {
  padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted);
  background: var(--color-bg-secondary); border-bottom: 1px solid var(--color-border);
}
.user-mgr__table td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); vertical-align: middle; }
.user-mgr__row:last-child td { border-bottom: none; }
.user-mgr__row:hover td { background: var(--color-bg-card-hover); }
.user-mgr__loading, .user-mgr__empty-row { text-align: center; color: var(--color-text-muted); padding: 40px !important; }
.user-mgr__name-cell { display: flex; align-items: center; gap: 10px; }
.user-mgr__avatar {
  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;
  background: var(--accent-gradient, var(--accent-gradient));
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700;
}
.user-mgr__email { color: var(--color-text-muted); font-size: 12px; }
.user-mgr__role-badge {
  display: inline-flex; align-items: center; padding: 2px 8px; border-radius: 20px;
  background: var(--color-accent-glow); color: var(--color-accent-primary);
  font-size: 11px; font-weight: 700;
}
.user-mgr__no-role { color: var(--color-text-muted); font-size: 12px; font-style: italic; }
.user-mgr__status-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px; border-radius: 20px;
  border: none; cursor: pointer; font-size: 11px; font-weight: 700; transition: all 0.2s;
}
.user-mgr__status-btn.active { background: rgba(16,185,129,0.1); color: #10b981; }
.user-mgr__status-btn.inactive { background: rgba(239,68,68,0.1); color: #ef4444; }
.user-mgr__status-dot {
  width: 6px; height: 6px; border-radius: 50%; background: currentColor;
}
.user-mgr__date { color: var(--color-text-muted); font-size: 12px; white-space: nowrap; }
.user-mgr__actions-cell { display: flex; gap: 4px; }
.user-mgr__icon-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border);
  background: none; cursor: pointer; color: var(--color-text-muted); transition: all 0.15s;
}
.user-mgr__icon-btn:hover { background: var(--color-bg-card-hover); color: var(--color-text-primary); }
.user-mgr__icon-btn.danger:hover { background: rgba(239,68,68,0.08); color: #ef4444; border-color: rgba(239,68,68,0.3); }

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
  z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px;
}
.modal-box {
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 16px; width: 100%; max-width: 480px; box-shadow: 0 24px 64px rgba(0,0,0,0.4);
  animation: slideUp 0.2s ease;
}
@keyframes slideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
.modal-box__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.modal-box__header h3 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.modal-box__close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 6px; }
.modal-box__close:hover { background: var(--color-bg-card-hover); color: var(--color-text-primary); }
.modal-box__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.modal-box__footer { display: flex; gap: 8px; justify-content: flex-end; padding: 0 24px 20px; }
.form-row { display: flex; flex-direction: column; gap: 5px; }
.form-row--inline { flex-direction: row; align-items: center; justify-content: space-between; }
.form-row label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.req { color: #ef4444; }
.form-input-wrap { position: relative; }
.form-input {
  width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-secondary); color: var(--color-text-primary); font-size: 13px;
  box-sizing: border-box; transition: border-color 0.2s;
}
.form-input:focus { outline: none; border-color: var(--color-accent-primary); }
.form-input:disabled { opacity: 0.6; cursor: not-allowed; }
.form-input--select { cursor: pointer; }
.form-pw-toggle {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 2px;
}
.form-error { font-size: 12px; color: #ef4444; padding: 8px 12px; border-radius: 8px; background: rgba(239,68,68,0.08); margin: 0; }
.toggle-switch { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.toggle-switch input { display: none; }
.toggle-track {
  width: 36px; height: 20px; border-radius: 20px; background: var(--color-border);
  position: relative; transition: background 0.2s; flex-shrink: 0;
}
.toggle-switch input:checked + .toggle-track { background: #10b981; }
.toggle-thumb {
  width: 14px; height: 14px; border-radius: 50%; background: #fff;
  position: absolute; top: 3px; left: 3px; transition: left 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}
.toggle-switch input:checked + .toggle-track .toggle-thumb { left: 19px; }
.toggle-switch span:last-child { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.btn-cancel {
  padding: 9px 20px; border-radius: 8px; border: 1px solid var(--color-border);
  background: none; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-save {
  display: flex; align-items: center; gap: 6px; padding: 9px 24px; border-radius: 8px; border: none;
  background: var(--accent-gradient); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer;
  transition: all 0.2s;
}
.btn-save:disabled { opacity: 0.6; cursor: wait; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .role-mgr__split { flex-direction: column; }
  .role-mgr__sidebar { width: 100%; }
  .role-mgr__perms { grid-template-columns: 1fr; }
}
</style>
