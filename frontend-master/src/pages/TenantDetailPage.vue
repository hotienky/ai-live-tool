<template>
  <div class="p-6 lg:p-8">
    <!-- Back -->
    <router-link to="/tenants" class="text-sm text-surface-400 hover:text-primary-400 transition-colors mb-4 inline-block">← Quay lại danh sách</router-link>

    <div v-if="loading" class="text-center py-16 text-surface-400">Đang tải...</div>

    <template v-else-if="tenant">
      <!-- Tenant Header -->
      <div class="card p-6 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center border border-primary-500/20">
              <Building2 :size="28" class="text-primary-400" />
            </div>
            <div>
              <h1 class="text-xl font-bold text-white">{{ tenant.name }}</h1>
              <p class="text-sm text-surface-400">{{ tenant.slug }}.domain.com</p>
            </div>
          </div>
          <span :class="statusClass(tenant.status)" class="text-sm">{{ tenant.status }}</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Details -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Thông tin</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm text-surface-400">Database</dt>
              <dd class="text-sm text-white font-mono">{{ tenant.db_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-surface-400">Owner</dt>
              <dd class="text-sm text-white">{{ tenant.owner_email }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-surface-400">Gói</dt>
              <dd class="text-sm text-white capitalize">{{ tenant.plan }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm text-surface-400">Ngày tạo</dt>
              <dd class="text-sm text-white">{{ formatDate(tenant.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Stats -->
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Thống kê</h3>
          <div v-if="tenant.stats" class="grid grid-cols-3 gap-3">
            <div class="text-center p-3 rounded-lg bg-surface-900/40">
              <p class="text-xl font-bold text-white">{{ tenant.stats.users }}</p>
              <p class="text-xs text-surface-400 mt-1">Users</p>
            </div>
            <div class="text-center p-3 rounded-lg bg-surface-900/40">
              <p class="text-xl font-bold text-white">{{ tenant.stats.products }}</p>
              <p class="text-xs text-surface-400 mt-1">Products</p>
            </div>
            <div class="text-center p-3 rounded-lg bg-surface-900/40">
              <p class="text-xl font-bold text-white">{{ tenant.stats.orders }}</p>
              <p class="text-xs text-surface-400 mt-1">Orders</p>
            </div>
          </div>
          <p v-else class="text-sm text-surface-400">Không có dữ liệu thống kê</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="card p-5">
        <h3 class="text-sm font-semibold text-surface-300 uppercase tracking-wider mb-4">Thao tác</h3>
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

    <div v-else class="text-center py-16 text-surface-400">Không tìm thấy tenant</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, Pause, Play, Database, Sprout, Trash2 } from 'lucide-vue-next'
import { tenants } from '../services/api.js'

const route = useRoute()
const router = useRouter()
const tenant = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionError = ref(false)

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
