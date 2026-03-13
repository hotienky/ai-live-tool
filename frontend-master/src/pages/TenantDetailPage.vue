<template>
  <div class="p-6 lg:p-8">
    <!-- Back -->
    <router-link to="/tenants" class="mp-link mb-4 inline-block">← Quay lại danh sách</router-link>

    <div v-if="loading" class="text-center py-16 mp-text-muted">Đang tải...</div>

    <template v-else-if="tenant">
      <!-- Tenant Header -->
      <div class="card p-6 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center border border-primary-500/20">
              <Building2 :size="28" class="text-primary-400" />
            </div>
            <div>
              <h1 class="text-xl font-bold mp-text-primary">{{ tenant.name }}</h1>
              <p class="text-sm mp-text-muted">{{ tenant.slug }}.domain.com</p>
            </div>
          </div>
          <span :class="statusClass(tenant.status)" class="text-sm">{{ tenant.status }}</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Details (read-only) -->
        <div class="card p-5">
          <h3 class="mp-section-title">Thông tin</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Database</dt>
              <dd class="text-sm mp-text-primary font-mono">{{ tenant.db_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Owner</dt>
              <dd class="text-sm mp-text-primary">{{ tenant.owner_email }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Gói hiện tại</dt>
              <dd class="text-sm mp-text-primary capitalize">
                <span :class="planBadgeClass(tenant.plan)">{{ tenant.plan }}</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Ngày tạo</dt>
              <dd class="text-sm mp-text-primary">{{ formatDate(tenant.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Stats -->
        <div class="card p-5">
          <h3 class="mp-section-title">Thống kê</h3>
          <div v-if="tenant.stats" class="grid grid-cols-3 gap-3">
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.users }}</p>
              <p class="text-xs mp-text-muted mt-1">Users</p>
            </div>
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.products }}</p>
              <p class="text-xs mp-text-muted mt-1">Products</p>
            </div>
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.orders }}</p>
              <p class="text-xs mp-text-muted mt-1">Orders</p>
            </div>
          </div>
          <p v-else class="text-sm mp-text-muted">Không có dữ liệu thống kê</p>
        </div>
      </div>

      <!-- Edit Settings -->
      <div class="card p-5 mb-6">
        <h3 class="mp-section-title flex items-center gap-2">
          <Settings :size="16" class="text-primary-400" /> Cài đặt Tenant
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label class="mp-label">Tên Tenant</label>
            <input v-model="editForm.name" type="text" class="input w-full" />
          </div>
          <div>
            <label class="mp-label">Gói dùng</label>
            <select v-model="editForm.plan" class="input w-full">
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label class="mp-label">Custom Domain</label>
            <input v-model="editForm.custom_domain" type="text" class="input w-full" placeholder="ví dụ: shop.example.com" />
          </div>
        </div>
        <div class="flex items-center gap-3 mt-4">
          <button @click="handleSaveSettings" :disabled="actionLoading || !hasChanges" class="btn-primary text-sm flex items-center gap-2" :class="{ 'opacity-50 cursor-not-allowed': !hasChanges }">
            <Save :size="16" /> Lưu thay đổi
          </button>
          <span v-if="editMsg" class="text-sm" :class="editError ? 'text-red-400' : 'text-emerald-400'">{{ editMsg }}</span>
        </div>
      </div>

      <!-- Actions -->
      <div class="card p-5">
        <h3 class="mp-section-title">Thao tác</h3>
        <div class="flex flex-wrap gap-3">
          <button v-if="tenant.status === 'active'" @click="handleSuspend" :disabled="actionLoading" class="btn-ghost text-amber-400 border border-amber-500/20 flex items-center gap-2 text-sm">
            <Pause :size="16" /> Tạm dừng
          </button>
          <button v-else @click="handleActivate" :disabled="actionLoading" class="btn-ghost text-emerald-400 border border-emerald-500/20 flex items-center gap-2 text-sm">
            <Play :size="16" /> Kích hoạt
          </button>
          <button @click="handleMigrate" :disabled="actionLoading" class="btn-ghost text-primary-400 border border-primary-500/20 flex items-center gap-2 text-sm">
            <Database :size="16" /> Chạy Migration
          </button>
          <button @click="handleSeed" :disabled="actionLoading" class="btn-ghost text-cyan-400 border border-cyan-500/20 flex items-center gap-2 text-sm">
            <Sprout :size="16" /> Seed Data
          </button>
          <button @click="handleDelete" :disabled="actionLoading" class="btn-danger text-sm flex items-center gap-2">
            <Trash2 :size="16" /> Xóa vĩnh viễn
          </button>
        </div>
        <p v-if="actionMsg" class="mt-3 text-sm" :class="actionError ? 'text-red-400' : 'text-emerald-400'">{{ actionMsg }}</p>
      </div>
    </template>

    <div v-else class="text-center py-16 mp-text-muted">Không tìm thấy tenant</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, Pause, Play, Database, Sprout, Trash2, Settings, Save } from 'lucide-vue-next'
import { tenants } from '../services/api.js'

const route = useRoute()
const router = useRouter()
const tenant = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionError = ref(false)

const editForm = ref({ name: '', plan: '', custom_domain: '' })
const editMsg = ref('')
const editError = ref(false)

const hasChanges = computed(() => {
  if (!tenant.value) return false
  return editForm.value.name !== tenant.value.name
    || editForm.value.plan !== tenant.value.plan
    || editForm.value.custom_domain !== (tenant.value.custom_domain || '')
})

function syncEditForm() {
  if (tenant.value) {
    editForm.value = {
      name: tenant.value.name || '',
      plan: tenant.value.plan || 'free',
      custom_domain: tenant.value.custom_domain || '',
    }
  }
}

watch(tenant, syncEditForm)

function planBadgeClass(plan) {
  const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium'
  if (plan === 'enterprise') return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/20`
  if (plan === 'pro') return `${base} bg-primary-500/15 text-primary-400 border border-primary-500/20`
  if (plan === 'starter') return `${base} bg-cyan-500/15 text-cyan-400 border border-cyan-500/20`
  return `${base} mp-stat-card mp-text-secondary`
}

async function handleSaveSettings() {
  editMsg.value = ''
  editError.value = false
  actionLoading.value = true
  try {
    await tenants.update(route.params.id, editForm.value)
    editMsg.value = '✅ Đã lưu thành công'
    await load()
  } catch (err) {
    editMsg.value = err.message
    editError.value = true
  } finally {
    actionLoading.value = false
  }
}

function statusClass(status) {
  if (status === 'active') return 'badge-active'
  if (status === 'suspended') return 'badge-suspended'
  return 'badge-trial'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  try {
    tenant.value = await tenants.get(route.params.id)
  } catch {
    tenant.value = null
  } finally {
    loading.value = false
  }
}

async function doAction(fn, msg) {
  actionLoading.value = true
  actionMsg.value = ''
  actionError.value = false
  try {
    const res = await fn()
    actionMsg.value = res.message || msg
    load()
  } catch (err) {
    actionMsg.value = err.message
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

const handleSuspend = () => doAction(() => tenants.suspend(route.params.id), 'Đã tạm dừng')
const handleActivate = () => doAction(() => tenants.activate(route.params.id), 'Đã kích hoạt')
const handleMigrate = () => doAction(() => tenants.migrate(route.params.id), 'Migration hoàn tất')
const handleSeed = () => doAction(() => tenants.seed(route.params.id), 'Seed hoàn tất')

async function handleDelete() {
  if (!confirm(`⚠️ Xóa vĩnh viễn "${tenant.value.name}" và DROP database "${tenant.value.db_name}"?`)) return
  actionLoading.value = true
  try {
    await tenants.remove(route.params.id)
    router.push('/tenants')
  } catch (err) {
    actionMsg.value = err.message
    actionError.value = true
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-link { font-size: 0.875rem; color: var(--mp-text-muted); transition: color 0.2s; }
.mp-link:hover { color: #3b8bfa; }
.mp-section-title { font-size: 0.75rem; font-weight: 600; color: var(--mp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
.mp-label { display: block; font-size: 0.75rem; color: var(--mp-text-muted); margin-bottom: 6px; }
.mp-stat-card { background: var(--mp-bg-input); }
</style>
