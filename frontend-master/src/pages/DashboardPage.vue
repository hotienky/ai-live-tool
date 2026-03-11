<template>
  <div class="p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-white mb-1">Dashboard</h1>
      <p class="text-surface-400 text-sm">Tổng quan hệ thống multi-tenant</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="card p-5 group hover:border-primary-500/30 transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm text-surface-400 mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="stat.bgClass">
            <component :is="stat.icon" :size="20" :class="stat.iconClass" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tenants Table -->
    <div class="card">
      <div class="p-5 border-b border-surface-700/30 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-white">Tenants gần đây</h2>
        <router-link to="/tenants" class="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          Xem tất cả →
        </router-link>
      </div>
      <div v-if="loading" class="p-8 text-center text-surface-400">Đang tải...</div>
      <div v-else-if="recentTenants.length === 0" class="p-8 text-center text-surface-400">Chưa có tenant nào</div>
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-surface-700/30">
            <th class="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-5 py-3">Tenant</th>
            <th class="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-5 py-3">Trạng thái</th>
            <th class="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-5 py-3">Gói</th>
            <th class="text-left text-xs font-medium text-surface-400 uppercase tracking-wider px-5 py-3">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in recentTenants" :key="t.id"
              class="border-b border-surface-800/50 hover:bg-surface-800/40 transition-colors cursor-pointer"
              @click="$router.push(`/tenants/${t.id}`)">
            <td class="px-5 py-3">
              <div>
                <p class="text-sm font-medium text-white">{{ t.name }}</p>
                <p class="text-xs text-surface-400">{{ t.slug }}.domain.com</p>
              </div>
            </td>
            <td class="px-5 py-3">
              <span :class="statusClass(t.status)">{{ t.status }}</span>
            </td>
            <td class="px-5 py-3 text-sm text-surface-300 capitalize">{{ t.plan }}</td>
            <td class="px-5 py-3 text-sm text-surface-400">{{ formatDate(t.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Building2, Users, Package, Activity } from 'lucide-vue-next'
import { tenants } from '../services/api.js'

const loading = ref(true)
const allTenants = ref([])

const recentTenants = computed(() => allTenants.value.slice(0, 5))

const stats = computed(() => [
  { label: 'Tổng Tenants', value: allTenants.value.length, icon: Building2, bgClass: 'bg-primary-600/15', iconClass: 'text-primary-400' },
  { label: 'Đang hoạt động', value: allTenants.value.filter(t => t.status === 'active').length, icon: Activity, bgClass: 'bg-emerald-500/15', iconClass: 'text-emerald-400' },
  { label: 'Tạm dừng', value: allTenants.value.filter(t => t.status === 'suspended').length, icon: Package, bgClass: 'bg-red-500/15', iconClass: 'text-red-400' },
  { label: 'Gói Pro', value: allTenants.value.filter(t => t.plan === 'pro' || t.plan === 'enterprise').length, icon: Users, bgClass: 'bg-amber-500/15', iconClass: 'text-amber-400' },
])

function statusClass(status) {
  if (status === 'active') return 'badge-active'
  if (status === 'suspended') return 'badge-suspended'
  return 'badge-trial'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(async () => {
  try {
    const res = await tenants.list(1)
    allTenants.value = res.data || res || []
  } catch {
    allTenants.value = []
  } finally {
    loading.value = false
  }
})
</script>
