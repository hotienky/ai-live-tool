<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold mp-text-primary">Quản lý Users</h1>
        <p class="text-sm mp-text-muted">Tạo và quản lý tài khoản truy cập Master Panel</p>
      </div>
      <button @click="showModal = true; resetForm()" class="btn-primary flex items-center gap-2">
        <Plus :size="16" /> Thêm User
      </button>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input v-model="search" @input="debouncedLoad" type="text" class="input" placeholder="Tìm theo tên, email..." style="max-width: 320px" />
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="mp-table min-w-[700px]">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Email</th>
            <th>Vai trò</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th class="text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="text-center py-8 mp-text-muted">Đang tải...</td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="6" class="text-center py-8 mp-text-muted">Không có user nào</td>
          </tr>
          <tr v-for="u in items" :key="u.id">
            <td>
              <div class="flex items-center gap-3">
                <div class="mp-avatar">{{ u.name?.charAt(0) || '?' }}</div>
                <span class="font-medium mp-text-primary">{{ u.name }}</span>
              </div>
            </td>
            <td class="mp-text-secondary">{{ u.email }}</td>
            <td>
              <span class="mp-badge" :class="u.role?.name === 'super_admin' ? 'mp-badge--primary' : 'mp-badge--default'">
                {{ u.role?.display_name || u.role?.name || '—' }}
              </span>
            </td>
            <td>
              <span class="mp-badge" :class="u.is_active ? 'mp-badge--success' : 'mp-badge--danger'">
                {{ u.is_active ? 'Active' : 'Disabled' }}
              </span>
            </td>
            <td class="mp-text-muted text-sm">{{ formatDate(u.created_at) }}</td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-2">
                <button @click="editUser(u)" class="btn-icon" title="Sửa"><Pencil :size="14" /></button>
                <button @click="deleteUser(u)" class="btn-icon btn-icon--danger" title="Xóa" :disabled="u.id === currentUser?.id"><Trash2 :size="14" /></button>
              </div>
            </td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && pagination.last_page > 1" class="flex items-center justify-center gap-2 mt-4">
      <button v-for="p in pagination.last_page" :key="p" @click="page = p; load()"
        class="px-3 py-1 rounded text-sm" :class="p === page ? 'btn-primary' : 'btn-ghost'">{{ p }}</button>
    </div>

    <!-- Modal -->
    <div v-if="showModal" class="mp-modal-overlay" @click.self="showModal = false">
      <div class="mp-modal">
        <h2 class="text-lg font-bold mp-text-primary mb-4">{{ editing ? 'Sửa User' : 'Tạo User mới' }}</h2>

        <div v-if="formError" class="mb-3 p-2 rounded text-sm bg-red-500/10 text-red-400 border border-red-500/20">{{ formError }}</div>

        <div class="space-y-4">
          <div>
            <label class="mp-label">Tên *</label>
            <input v-model="form.name" type="text" class="input w-full" placeholder="Nguyễn Văn A" />
          </div>
          <div>
            <label class="mp-label">Email *</label>
            <input v-model="form.email" type="email" class="input w-full" placeholder="admin@example.com" />
          </div>
          <div>
            <label class="mp-label">{{ editing ? 'Mật khẩu (để trống = không đổi)' : 'Mật khẩu *' }}</label>
            <input v-model="form.password" type="password" class="input w-full" placeholder="••••••" />
          </div>
          <div>
            <label class="mp-label">Vai trò *</label>
            <select v-model="form.role_id" class="input w-full">
              <option value="">-- Chọn vai trò --</option>
              <option v-for="r in roleList" :key="r.id" :value="r.id">{{ r.display_name || r.name }}</option>
            </select>
          </div>
          <div v-if="editing" class="flex items-center gap-2">
            <input type="checkbox" v-model="form.is_active" id="is_active" />
            <label for="is_active" class="text-sm mp-text-secondary cursor-pointer">Kích hoạt tài khoản</label>
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
import { ref, onMounted, computed } from 'vue'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { users, roles, getStoredUser } from '../services/api.js'

const currentUser = computed(() => getStoredUser())
const items = ref([])
const pagination = ref(null)
const loading = ref(false)
const page = ref(1)
const search = ref('')
const roleList = ref([])

const showModal = ref(false)
const editing = ref(null)
const saving = ref(false)
const formError = ref('')
const form = ref({ name: '', email: '', password: '', role_id: '', is_active: true })

function resetForm() {
  editing.value = null
  form.value = { name: '', email: '', password: '', role_id: '', is_active: true }
  formError.value = ''
}

function editUser(u) {
  editing.value = u.id
  form.value = { name: u.name, email: u.email, password: '', role_id: u.role_id || u.role?.id || '', is_active: !!u.is_active }
  formError.value = ''
  showModal.value = true
}

async function handleSubmit() {
  formError.value = ''
  saving.value = true
  try {
    const data = { ...form.value }
    if (!data.password) delete data.password
    data.role_id = Number(data.role_id)

    if (editing.value) {
      await users.update(editing.value, data)
    } else {
      await users.create(data)
    }
    showModal.value = false
    load()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

async function deleteUser(u) {
  if (!confirm(`Xóa user "${u.name}"?`)) return
  try {
    await users.remove(u.id)
    load()
  } catch (err) {
    alert(err.message)
  }
}

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; load() }, 300)
}

async function load() {
  loading.value = true
  try {
    const res = await users.list(page.value, search.value)
    items.value = res.items || res
    pagination.value = res.pagination || null
  } catch { items.value = [] } finally { loading.value = false }
}

async function loadRoles() {
  try { roleList.value = await roles.list() } catch { roleList.value = [] }
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => { load(); loadRoles() })
</script>

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-label { display: block; font-size: 0.75rem; color: var(--mp-text-muted); margin-bottom: 6px; }

.mp-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--mp-avatar-bg); color: var(--mp-avatar-text);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; flex-shrink: 0;
}

.mp-table { width: 100%; border-collapse: collapse; }
.mp-table th { padding: 12px 16px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--mp-text-muted); text-align: left; border-bottom: 1px solid var(--mp-border); }
.mp-table td { padding: 12px 16px; border-bottom: 1px solid var(--mp-border); }
.mp-table tr:last-child td { border-bottom: none; }

.mp-badge { display: inline-block; padding: 2px 10px; border-radius: 9999px; font-size: 11px; font-weight: 600; }
.mp-badge--primary { background: #3b82f6/15; color: #60a5fa; border: 1px solid rgba(59,130,246,0.2); background: rgba(59,130,246,0.1); }
.mp-badge--default { background: var(--mp-bg-input); color: var(--mp-text-secondary); border: 1px solid var(--mp-border); }
.mp-badge--success { background: rgba(34,197,94,0.1); color: #4ade80; border: 1px solid rgba(34,197,94,0.2); }
.mp-badge--danger { background: rgba(239,68,68,0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }

.btn-icon { background: none; border: 1px solid var(--mp-border); border-radius: 6px; padding: 6px; color: var(--mp-text-muted); cursor: pointer; transition: all 0.2s; }
.btn-icon:hover { background: var(--mp-nav-hover-bg); color: var(--mp-text-primary); }
.btn-icon--danger:hover { background: rgba(239,68,68,0.1); color: #f87171; border-color: rgba(239,68,68,0.3); }
.btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }

.mp-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 50; }
.mp-modal { background: var(--mp-bg-card); border: 1px solid var(--mp-border); border-radius: 12px; padding: 24px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
</style>
