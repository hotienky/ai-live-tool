<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="mp-heading">Dashboard</h1>
      <p class="mp-subheading">Tổng quan hệ thống multi-tenant</p>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="card p-5 group hover:border-primary-500/30 transition-all">
        <div class="flex items-start justify-between">
          <div>
            <p class="text-sm mp-text-muted mb-1">{{ stat.label }}</p>
            <p class="text-2xl font-bold mp-text-primary">{{ stat.value }}</p>
          </div>
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="stat.bgClass">
            <component :is="stat.icon" :size="20" :class="stat.iconClass" />
          </div>
        </div>
      </div>
    </div>

    <!-- Dashboard Chart -->
    <DashboardChart 
      :total="statsMap.total"
      :active="statsMap.active"
      :suspended="statsMap.suspended"
      :pro="statsMap.pro"
    />

    <!-- Recent Tenants Table -->
    <div class="card overflow-hidden">
      <div class="p-5 mp-table-border flex items-center justify-between">
        <h2 class="text-lg font-semibold mp-text-primary">Tenants gần đây</h2>
        <router-link to="/tenants" class="text-sm text-primary-400 hover:text-primary-300 transition-colors">
          Xem tất cả →
        </router-link>
      </div>
      <div v-if="loading" class="p-8 text-center mp-text-muted">Đang tải...</div>
      <div v-else-if="recentTenants.length === 0" class="p-8 text-center mp-text-muted">Chưa có tenant nào</div>
      <div v-else class="overflow-x-auto w-full">
        <table class="w-full min-w-[600px]">
        <thead>
          <tr class="mp-table-border">
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Tenant</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Trạng thái</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Gói</th>
            <th class="text-left text-xs font-medium mp-text-muted uppercase tracking-wider px-5 py-3">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="t in recentTenants" :key="t.id"
              class="mp-table-row"
              @click="$router.push(`/tenants/${t.id}`)">
            <td class="px-5 py-3">
              <div>
                <p class="text-sm font-medium mp-text-primary">{{ t.name }}</p>
                <p class="text-xs mp-text-muted">{{ t.slug }}.domain.com</p>
              </div>
            </td>
            <td class="px-5 py-3">
              <span :class="statusClass(t.status)">{{ t.status }}</span>
            </td>
            <td class="px-5 py-3 text-sm mp-text-secondary capitalize">{{ t.plan }}</td>
            <td class="px-5 py-3 text-sm mp-text-muted">{{ formatDate(t.created_at) }}</td>
          </tr>
        </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Building2, Users, Package, Activity } from 'lucide-vue-next'
import { tenants } from '../services/api.js'
import DashboardChart from '../components/DashboardChart.vue'

const loading = ref(true)
const allTenants = ref([])

const statsMap = computed(() => {
  const tenants = allTenants.value
  return {
    total: tenants.length,
    active: tenants.filter(t => t.status === 'active').length,
    suspended: tenants.filter(t => t.status === 'suspended').length,
    pro: tenants.filter(t => t.plan === 'pro' || t.plan === 'enterprise').length
  }
})

const recentTenants = computed(() => allTenants.value.slice(0, 5))

const stats = computed(() => [
  { label: 'Tổng Tenants', value: statsMap.value.total, icon: Building2, bgClass: 'bg-primary-600/15', iconClass: 'text-primary-400' },
  { label: 'Đang hoạt động', value: statsMap.value.active, icon: Activity, bgClass: 'bg-emerald-500/15', iconClass: 'text-emerald-400' },
  { label: 'Tạm dừng', value: statsMap.value.suspended, icon: Package, bgClass: 'bg-red-500/15', iconClass: 'text-red-400' },
  { label: 'Gói Pro', value: statsMap.value.pro, icon: Users, bgClass: 'bg-amber-500/15', iconClass: 'text-amber-400' },
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

<style scoped>
.mp-heading { font-size: 1.5rem; font-weight: 700; color: var(--mp-text-primary); margin-bottom: 4px; }
.mp-subheading { font-size: 0.875rem; color: var(--mp-text-muted); }
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-table-border { border-bottom: 1px solid var(--mp-border); }
.mp-table-row {
  border-bottom: 1px solid var(--mp-border);
  cursor: pointer;
  transition: background 0.15s;
}
.mp-table-row:hover { background: var(--mp-nav-hover-bg); }
</style>
