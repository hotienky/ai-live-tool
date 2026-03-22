<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <!-- Header -->
    <div class="mb-6">
      <h1 class="mp-heading">Cấu hình AI Toàn Hệ Thống</h1>
      <p class="mp-subheading">Quản lý API Key, Provider mặc định và theo dõi chi phí AI của các Tenant</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-8 text-center mp-text-muted card">
      Đang tải dữ liệu...
    </div>

    <div v-else class="grid lg:grid-cols-2 gap-6 items-start">
      
      <!-- Cấu hình Provider & Model -->
      <div class="card p-6">
        <h2 class="text-lg font-semibold mp-text-primary mb-5">Cấu hình Provider Mặc Định</h2>
        
        <form @submit.prevent="saveConfig" class="space-y-5">
          <!-- AI Provider Selection -->
          <div>
            <label class="block text-sm font-medium mp-text-secondary mb-2">AI Provider</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label 
                v-for="(provData, provKey) in availableModels" 
                :key="provKey"
                class="relative flex flex-col p-4 border rounded-xl cursor-pointer transition-all duration-200"
                :class="config.provider === provKey ? 'border-custom-active bg-custom-active-bg' : 'mp-border-default hover:border-gray-400 bg-transparent'"
              >
                <input type="radio" :value="provKey" v-model="config.provider" class="sr-only">
                <span class="font-semibold mp-text-primary mb-1">{{ provData.name }}</span>
                <div>
                  <span :class="config.keys_configured[provKey] ? 'badge-active' : 'badge-suspended'">
                    {{ config.keys_configured[provKey] ? 'Đã có Key' : 'Chưa có Key' }}
                  </span>
                </div>
              </label>
            </div>
          </div>

          <!-- Model Selection -->
          <div>
            <label class="block text-sm font-medium mp-text-secondary mb-1">Model (Mô hình)</label>
            <select v-model="config.model" class="input w-full">
              <template v-if="currentProviderData">
                <option v-for="(modData, modKey) in currentProviderData.models" :key="modKey" :value="modKey">
                  {{ modData.label }} ({{ modData.cost }})
                </option>
              </template>
            </select>
          </div>

          <!-- API Key Input -->
          <div>
            <label class="block text-sm font-medium mp-text-secondary mb-1">
              {{ currentProviderData?.key_label || 'API Key' }}
            </label>
            <div class="flex gap-2">
              <input 
                v-model="apiKeyInput" 
                type="password" 
                class="input flex-1" 
                :placeholder="config.keys_configured[config.provider] ? 'Đã cấu hình (Nhập để thay đổi)' : 'Nhập API key...'" 
              />
              <a v-if="currentProviderData?.key_url" :href="currentProviderData.key_url" target="_blank" class="btn-ghost flex-shrink-0 flex items-center border border-gray-300 dark:border-gray-600 rounded-lg whitespace-nowrap">
                Lấy Key
              </a>
            </div>
            <p v-if="config.keys_configured[config.provider]" class="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              ✓ Hệ thống đang dùng Key hợp lệ
            </p>
          </div>

          <div class="pt-4 border-t" style="border-color: var(--mp-border)">
            <button type="submit" class="btn-primary w-full sm:w-auto" :disabled="saving">
              {{ saving ? 'Đang lưu...' : 'Lưu Cấu Hình' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Thống kê tổng quan -->
      <div class="card p-0 overflow-hidden flex flex-col">
        <div class="p-5 flex justify-between items-center pb-2">
          <h2 class="text-lg font-semibold mp-text-primary">Thống kê Sử dụng AI</h2>
          <button @click="loadUsage" class="text-xs btn-ghost border border-gray-300 dark:border-gray-600 py-1 px-3" :disabled="usageLoading">
            {{ usageLoading ? 'Đang tải...' : 'Làm mới' }}
          </button>
        </div>

        <!-- TABS -->
        <div class="px-5 border-b flex gap-6" style="border-color: var(--mp-border)">
          <button 
            @click="activeUsageTab = 'overview'" 
            class="py-2.5 px-1 border-b-2 text-sm font-medium transition-colors" 
            :class="activeUsageTab === 'overview' ? 'border-custom-active text-sky-500' : 'border-transparent mp-text-muted hover:text-white'"
          >
            Tổng quan (Tháng này)
          </button>
          <button 
            @click="activeUsageTab = 'tenants'" 
            class="py-2.5 px-1 border-b-2 text-sm font-medium transition-colors" 
            :class="activeUsageTab === 'tenants' ? 'border-custom-active text-sky-500' : 'border-transparent mp-text-muted hover:text-white'"
          >
            Chi tiết theo Tenant
          </button>
        </div>
        
        <div v-if="usageLoading" class="p-12 text-center mp-text-muted">Đang tải dữ liệu...</div>
        <div v-else-if="usage" class="p-5">
          
          <!-- TAB: TỔNG QUAN -->
          <div v-if="activeUsageTab === 'overview'">
            <!-- Totals Grid -->
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Requests</span>
                <span class="text-2xl font-bold mp-text-primary">{{ usage.totals?.total_requests || 0 }}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Tokens</span>
                <span class="text-2xl font-bold text-sky-500">{{ formatTokens(usage.totals?.total_tokens) }}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Chi phí ước tính</span>
                <span class="text-2xl font-bold text-red-500">{{ formatCost(usage.totals?.total_cost) }}</span>
              </div>
            </div>

            <!-- By Action Table -->
            <div>
              <h3 class="text-sm font-semibold mp-text-secondary mb-3 uppercase tracking-wider">Phân bổ theo Tác Vụ</h3>
              <div class="overflow-x-auto border rounded-xl" style="border-color: var(--mp-border)">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50/50 dark:bg-gray-800/50">
                    <tr>
                      <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tác vụ</th>
                      <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Requests</th>
                      <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tokens</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="a in usage.by_action || []" :key="a.action" class="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style="border-color: var(--mp-border)">
                      <td class="py-2 px-3"><span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded text-xs">{{ a.action }}</span></td>
                      <td class="py-2 px-3 text-right mp-text-primary">{{ a.requests }}</td>
                      <td class="py-2 px-3 text-right text-sky-500">{{ formatTokens(a.tokens) }}</td>
                    </tr>
                    <tr v-if="!usage.by_action?.length">
                      <td colspan="3" class="py-4 text-center mp-text-muted">Chưa có dữ liệu</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- TAB: CHI TIẾT THEO TENANT -->
          <div v-else-if="activeUsageTab === 'tenants'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold mp-text-secondary uppercase tracking-wider">Tất cả Tenants (Tháng này)</h3>
              <span class="text-xs mp-text-muted badge">{{ (usage.by_tenant || []).length }} tenants</span>
            </div>
            
            <div class="overflow-y-auto max-h-[400px] border rounded-xl relative" style="border-color: var(--mp-border)">
              <table class="w-full text-sm">
                <thead class="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Mã Tenant</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Requests</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tokens</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Chi phí ước tính</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b w-24" style="border-color: var(--mp-border)"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(t, index) in (usage.by_tenant || [])" :key="t.tenant_id" class="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style="border-color: var(--mp-border)">
                    <td class="py-3 px-3">
                      <div class="flex items-center gap-2">
                        <span class="text-xs mp-text-muted w-4">{{ index + 1 }}</span>
                        <span class="font-mono text-xs mp-text-secondary bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{{ t.tenant_id }}</span>
                      </div>
                    </td>
                    <td class="py-3 px-3 text-right mp-text-primary">{{ t.requests }}</td>
                    <td class="py-3 px-3 text-right text-sky-500 font-medium">{{ formatTokens(t.tokens) }}</td>
                    <td class="py-3 px-3 text-right font-semibold text-red-500">{{ formatCost(t.cost) }}</td>
                    <td class="py-3 px-3 text-right">
                      <button @click="viewTenantDetails(t.tenant_id)" class="text-xs bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-400 dark:hover:bg-sky-900/50 py-1.5 px-3 rounded-lg font-medium transition-colors">
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                  <tr v-if="!usage.by_tenant?.length">
                    <td colspan="5" class="py-8 text-center mp-text-muted">Chưa có phát sinh sử dụng trong tháng này.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>

    <!-- Tenant Details Modal -->
    <div v-if="selectedTenant" class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" @click.self="closeTenantDetails">
      <div class="card w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-gray-900 border shadow-2xl" style="border-color: var(--mp-border)">
        <!-- Modal Header -->
        <div class="p-5 border-b flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50" style="border-color: var(--mp-border)">
          <div>
            <h2 class="text-lg font-semibold mp-text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-sky-500"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
              Chi tiết Usage
            </h2>
            <p class="text-sm mp-text-muted font-mono mt-1">{{ selectedTenant }}</p>
          </div>
          <button @click="closeTenantDetails" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        
        <!-- Modal Body -->
        <div class="p-0 overflow-y-auto flex-1">
          <div v-if="tenantUsageLoading" class="p-16 text-center mp-text-muted">Đang tải chi tiết cho Tenant...</div>
          <div v-else-if="tenantUsageData" class="p-5">
            
            <!-- Dashboard/Totals for Tenant -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Requests</span>
                <span class="text-xl font-bold mp-text-primary">{{ tenantUsageData.stats?.total_requests || 0 }}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Tokens</span>
                <span class="text-xl font-bold text-sky-500">{{ formatTokens(tenantUsageData.stats?.total_tokens) }}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Chi phí</span>
                <span class="text-xl font-bold text-red-500">{{ formatCost(tenantUsageData.stats?.total_cost) }}</span>
              </div>
              <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <span class="text-xs uppercase font-semibold mp-text-muted block mb-1">Dùng Key Chung</span>
                <span class="text-xl font-bold text-emerald-500">{{ tenantUsageData.stats?.system_key_requests || 0 }} rq</span>
              </div>
            </div>

            <!-- Recent Log Table -->
            <h3 class="text-sm font-semibold mp-text-secondary mb-3 uppercase tracking-wider">30 Lượt Dùng Gần Nhất</h3>
            <div class="overflow-x-auto border rounded-xl" style="border-color: var(--mp-border)">
              <table class="w-full text-xs">
                <thead class="bg-gray-50/50 dark:bg-gray-800/50">
                  <tr>
                    <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Thời gian</th>
                    <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tác vụ</th>
                    <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Model</th>
                    <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Mode</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tokens</th>
                    <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="log in tenantUsageData.recent || []" :key="log.id" class="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style="border-color: var(--mp-border)">
                    <td class="py-2 px-3 mp-text-secondary whitespace-nowrap">{{ formatDate(log.created_at) }}</td>
                    <td class="py-2 px-3">
                      <span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded">{{ log.action }}</span>
                    </td>
                    <td class="py-2 px-3 mp-text-primary">{{ log.model }}</td>
                    <td class="py-2 px-3">
                      <span :class="log.key_mode === 'system' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'" class="px-1.5 py-0.5 rounded uppercase font-semibold text-[10px]">
                        {{ log.key_mode }}
                      </span>
                    </td>
                    <td class="py-2 px-3 text-right text-sky-500">{{ log.total_tokens }}</td>
                    <td class="py-2 px-3 text-right font-medium text-red-500">{{ formatCost(log.estimated_cost) }}</td>
                  </tr>
                  <tr v-if="!tenantUsageData.recent?.length">
                    <td colspan="6" class="py-6 text-center mp-text-muted text-sm">Chưa có lượt dùng nào gần đây.</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../services/api'

const loading = ref(true)
const saving = ref(false)
const usageLoading = ref(false)

const config = ref({
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  keys_configured: {}
})
const availableModels = ref({})
const apiKeyInput = ref('')
const usage = ref(null)
const activeUsageTab = ref('overview')

// Tenant Detailed usage modal state
const selectedTenant = ref(null)
const tenantUsageLoading = ref(false)
const tenantUsageData = ref(null)

async function viewTenantDetails(tenantId) {
  selectedTenant.value = tenantId
  tenantUsageLoading.value = true
  tenantUsageData.value = null
  try {
    const res = await api.get(`/ai-config/usage/${tenantId}`)
    // Backend returns { success: true, data: { tenant_id, stats, recent } }, api interceptor strips response.data usually
    tenantUsageData.value = res.data ? res.data : res
  } catch (e) {
    alert('Lỗi tải dữ liệu tenant: ' + e.message)
  }
  tenantUsageLoading.value = false
}

function closeTenantDetails() {
  selectedTenant.value = null
  tenantUsageData.value = null
}

const currentProviderData = computed(() => {
  return availableModels.value[config.value.provider] || null
})

// Tự động đổi model mặc định khi đổi provider
watch(() => config.value.provider, (newProv) => {
  if (availableModels.value[newProv]) {
    const models = Object.keys(availableModels.value[newProv].models)
    if (!models.includes(config.value.model)) {
      config.value.model = models[0]
    }
  }
})

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/ai-config')
    config.value = {
      provider: res.provider,
      model: res.model,
      keys_configured: res.keys_configured || {}
    }
    availableModels.value = res.available_models
    await loadUsage()
  } catch (e) {
    alert('Lỗi tải cấu hình AI: ' + e.message)
  }
  loading.value = false
}

async function loadUsage() {
  usageLoading.value = true
  try {
    usage.value = await api.get('/ai-config/usage')
  } catch (e) {
    console.error('Lỗi tải thống kê', e)
  }
  usageLoading.value = false
}

async function saveConfig() {
  saving.value = true
  try {
    const payload = {
      provider: config.value.provider,
      model: config.value.model,
    }
    if (apiKeyInput.value) {
      payload.api_key = apiKeyInput.value
    }
    
    await api.put('/ai-config', payload)
    apiKeyInput.value = ''
    alert('Lưu cấu hình thành công!')
    await loadData()
  } catch (e) {
    alert('Lỗi lưu cấu hình: ' + e.message)
  }
  saving.value = false
}

function formatTokens(t) {
  if (!t) return '0'
  if (t > 1000000) return (t/1000000).toFixed(2) + 'M'
  if (t > 1000) return (t/1000).toFixed(1) + 'K'
  return t
}

function formatCost(c) {
  if (!c) return '$0.00'
  return '$' + Number(c).toFixed(4)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.mp-heading { font-size: 1.5rem; font-weight: 700; color: var(--mp-text-primary); margin-bottom: 4px; }
.mp-subheading { font-size: 0.875rem; color: var(--mp-text-muted); }
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-border-default { border-color: var(--mp-border); }

.border-custom-active { border-color: rgba(13, 82, 217, 0.5); }
.bg-custom-active-bg { background-color: var(--mp-nav-active-bg); }
</style>
