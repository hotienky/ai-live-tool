<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="mp-heading">Quản lý Tenants</h1>
        <p class="mp-subheading">{{ total }} tenant trong hệ thống</p>
      </div>
      <router-link to="/tenants/new" class="btn-primary flex items-center gap-2">
        <Plus :size="18" /> Tạo Tenant
      </router-link>
    </div>

    <!-- Search -->
    <div class="mb-4">
      <input v-model="search" @input="debouncedSearch" type="text" class="input max-w-sm" placeholder="Tìm theo tên, slug, email..." />
    </div>

    <!-- Table -->
    <div class="card overflow-hidden">
      <div v-if="loading" class="p-8 text-center mp-text-muted">Đang tải...</div>
      <div v-else-if="list.length === 0" class="p-8 text-center mp-text-muted">Không tìm thấy tenant</div>
      <div v-else class="overflow-x-auto w-full">
        <table class="w-full min-w-[800px]">
        <thead>
          <tr class="mp-table-border">
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Tenant</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Database</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Owner</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Trạng thái</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Gói</th>
            <th class="text-right text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in list" :key="t.id" class="mp-table-row">
            <td class="px-5 py-3">
              <router-link :to="`/tenants/${t.id}`" class="block">
                <p class="text-sm font-medium mp-text-primary hover:text-primary-400 transition-colors">{{ t.name }}</p>
                <p class="text-xs mp-text-muted">{{ t.slug }}.{{ baseDomain }}</p>
              </router-link>
            </td>
            <td class="px-5 py-3 mp-text-secondary font-mono text-xs">{{ t.db_name }}</td>
            <td class="px-5 py-3 text-sm mp-text-secondary">{{ t.owner_email }}</td>
            <td class="px-5 py-3">
              <span :class="statusClass(t.status)">{{ t.status }}</span>
            </td>
            <td class="px-5 py-3 text-sm mp-text-secondary capitalize">{{ t.plan }}</td>
            <td class="px-5 py-3 text-right">
              <div class="flex items-center justify-end gap-1">
                <a :href="getTenantUrl(t.slug)" target="_blank" class="btn-ghost text-xs px-2 py-1 text-primary-400 hover:text-primary-300" title="Truy cập tenant">
                  <ExternalLink :size="14" />
                </a>
                <a :href="getTenantUrl(t.slug, '/login')" target="_blank" class="btn-ghost text-xs px-2 py-1 text-sky-400 hover:text-sky-300" title="Đăng nhập tenant">
                  <LogIn :size="14" />
                </a>
                <a :href="getCmsUrl(t.slug)" target="_blank" class="btn-ghost text-xs px-2 py-1 text-orange-400 hover:text-orange-300" title="Quản lý CMS">
                  <LayoutDashboard :size="14" />
                </a>
                <button v-if="t.status === 'active'" @click.stop="handleSuspend(t)" class="btn-ghost text-xs px-2 py-1 text-amber-400 hover:text-amber-300">
                  <Pause :size="14" />
                </button>
                <button v-else @click.stop="handleActivate(t)" class="btn-ghost text-xs px-2 py-1 text-emerald-400 hover:text-emerald-300">
                  <Play :size="14" />
                </button>
                <button @click.stop="handleDelete(t)" class="btn-ghost text-xs px-2 py-1 text-red-400 hover:text-red-300">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="px-5 py-3 mp-table-border-top flex items-center justify-between">
        <p class="text-sm mp-text-muted">Trang {{ page }} / {{ lastPage }}</p>
        <div class="flex gap-2">
          <button @click="page > 1 && (page--, loadTenants())" :disabled="page <= 1" class="btn-ghost text-xs px-3 py-1">← Trước</button>
          <button @click="page < lastPage && (page++, loadTenants())" :disabled="page >= lastPage" class="btn-ghost text-xs px-3 py-1">Sau →</button>
        </div>
      </div>
    </div>

    <!-- Confirm Modal -->
    <Teleport to="body">
      <div v-if="confirmModal" class="fixed inset-0 mp-overlay z-50 flex items-center justify-center p-4" @click.self="confirmModal = null">
        <div class="card p-6 max-w-sm w-full">
          <h3 class="text-lg font-semibold mp-text-primary mb-2">{{ confirmModal.title }}</h3>
          <p class="text-sm mp-text-secondary mb-5">{{ confirmModal.message }}</p>
          <div class="flex justify-end gap-2">
            <button @click="confirmModal = null" class="btn-ghost text-sm">Hủy</button>
            <button @click="confirmModal.action()" :class="confirmModal.danger ? 'btn-danger' : 'btn-primary'" class="text-sm">
              {{ confirmModal.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Pause, Play, Trash2, ExternalLink, LogIn, LayoutDashboard } from 'lucide-vue-next'
import { tenants } from '../services/api.js'

const list = ref([])
const loading = ref(true)
const search = ref('')
const page = ref(1)
const total = ref(0)
const lastPage = ref(1)
const confirmModal = ref(null)
let searchTimer = null

function statusClass(status) {
  if (status === 'active') return 'badge-active'
  if (status === 'suspended') return 'badge-suspended'
  return 'badge-trial'
}

async function loadTenants() {
  loading.value = true
  try {
    const res = await tenants.list(page.value, search.value)
    list.value = res.data || res || []
    total.value = res.meta?.total || list.value.length
    lastPage.value = res.meta?.last_page || 1
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; loadTenants() }, 300)
}

function handleSuspend(t) {
  confirmModal.value = {
    title: 'Tạm dừng Tenant',
    message: `Bạn có chắc muốn tạm dừng "${t.name}" (${t.slug})?`,
    confirmText: 'Tạm dừng',
    danger: true,
    action: async () => {
      await tenants.suspend(t.id)
      confirmModal.value = null
      loadTenants()
    },
  }
}

function handleActivate(t) {
  confirmModal.value = {
    title: 'Kích hoạt Tenant',
    message: `Kích hoạt lại "${t.name}" (${t.slug})?`,
    confirmText: 'Kích hoạt',
    danger: false,
    action: async () => {
      await tenants.activate(t.id)
      confirmModal.value = null
      loadTenants()
    },
  }
}

function handleDelete(t) {
  confirmModal.value = {
    title: 'Xóa Tenant vĩnh viễn',
    message: `Hành động này sẽ xóa "${t.name}" và DROP database "${t.db_name}". Không thể hoàn tác!`,
    confirmText: 'Xóa vĩnh viễn',
    danger: true,
    action: async () => {
      await tenants.remove(t.id)
      confirmModal.value = null
      loadTenants()
    },
  }
}

const baseDomain = import.meta.env.VITE_BASE_DOMAIN || location.hostname || 'localhost'

function getTenantUrl(slug, path = '') {
  return `${location.protocol}//${slug}.${baseDomain}${path}`
}

function getCmsUrl(slug) {
  return `${location.protocol}//${slug}.cms.${baseDomain}`
}

onMounted(loadTenants)
</script>

<style scoped>
.mp-heading { font-size: 1.5rem; font-weight: 700; color: var(--mp-text-primary); margin-bottom: 4px; }
.mp-subheading { font-size: 0.875rem; color: var(--mp-text-muted); }
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-table-border { border-bottom: 1px solid var(--mp-border); }
.mp-table-border-top { border-top: 1px solid var(--mp-border); }
.mp-table-row { border-bottom: 1px solid var(--mp-border); cursor: pointer; transition: background 0.15s; }
.mp-table-row:hover { background: var(--mp-nav-hover-bg); }
.mp-overlay { background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
</style>
