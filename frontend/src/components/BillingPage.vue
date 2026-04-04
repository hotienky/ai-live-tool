<template>
  <div class="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ t('admin.msg_billing_title', 'Thanh Toán & Gói Cước') }}</h1>
    </div>

    <!-- Tabs -->
    <div class="border-b mb-6">
      <nav class="-mb-px flex space-x-8">
        <button 
          @click="activeTab = 'overview'"
          :class="[activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground', 'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm']"
        >
          {{ t('admin.msg_overview', 'Tổng Quan') }}
        </button>
        <button 
          @click="activeTab = 'plans'"
          :class="[activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground', 'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm']"
        >
          {{ t('admin.msg_change_plan', 'Đổi Gói Cước') }}
        </button>
        <button 
          @click="activeTab = 'invoices'"
          :class="[activeTab === 'invoices' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground', 'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm']"
        >
          {{ t('admin.msg_transaction_history', 'Lịch Sử Giao Dịch') }}
        </button>
      </nav>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-6">
      <div v-if="loading" class="flex justify-center py-12">
        <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
      
      <template v-else>
        <!-- Current Plan Card -->
        <div class="bg-card border rounded-lg shadow-sm p-6 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 class="text-lg font-medium text-muted-foreground">{{ t('admin.msg_current_plan_label', 'Gói Cước Hiện Tại') }}</h2>
            <div class="mt-1 flex items-baseline">
              <span class="text-4xl font-extrabold tracking-tight text-foreground">{{ currentPlan?.name || 'Loading...' }}</span>
            </div>
          </div>
          <div class="mt-4 md:mt-0">
            <button @click="activeTab = 'plans'" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none">
              {{ t('admin.msg_upgrade_plan', 'Nâng Cấp Gói') }}
            </button>
          </div>
        </div>

        <!-- Usage Stats -->
        <h3 class="text-xl font-semibold mt-8 mb-4">{{ t('admin.msg_current_usage', 'Mức Sử Dụng Hiện Tại') }}</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          <!-- Pages Used -->
          <div class="bg-card border rounded-lg p-5">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-muted-foreground">{{ t('admin.msg_cms_page_count', 'Số Trang CMS') }}</span>
              <FileIcon class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="text-2xl font-bold">{{ usage.pages }} / {{ currentLimits?.pages || '∞' }}</div>
            <div class="w-full bg-secondary rounded-full h-2 mt-3">
              <div class="bg-blue-500 h-2 rounded-full" :style="{ width: calculatePercentage(usage.pages, currentLimits?.pages) + '%' }"></div>
            </div>
          </div>

          <!-- Storage Used -->
          <div class="bg-card border rounded-lg p-5">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-muted-foreground">{{ t('admin.msg_storage_mb', 'Lưu Trữ (MB)') }}</span>
              <Database class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="text-2xl font-bold">{{ usage.storage_mb }} / {{ currentLimits?.storage_mb || '∞' }}</div>
            <div class="w-full bg-secondary rounded-full h-2 mt-3">
              <div class="bg-green-500 h-2 rounded-full" :style="{ width: calculatePercentage(usage.storage_mb, currentLimits?.storage_mb) + '%' }"></div>
            </div>
          </div>

          <!-- Modules Installed -->
          <div class="bg-card border rounded-lg p-5">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium text-muted-foreground">{{ t('admin.msg_modules_installed_label', 'Modules Đã Cài') }}</span>
              <Puzzle class="h-5 w-5 text-muted-foreground" />
            </div>
            <div class="text-2xl font-bold">{{ usage.modules_installed || 0 }} / {{ currentLimits?.modules_free || '∞' }}</div>
             <div class="w-full bg-secondary rounded-full h-2 mt-3">
              <div class="bg-orange-500 h-2 rounded-full" :style="{ width: calculatePercentage(usage.modules_installed || 0, currentLimits?.modules_free) + '%' }"></div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Plans Tab -->
    <div v-else-if="activeTab === 'plans'">
      <PlanSelector 
        :current-plan-id="currentPlan?.id" 
        @plan-changed="onPlanUpgraded" 
      />
    </div>

    <!-- Invoices Tab -->
    <div v-else-if="activeTab === 'invoices'">
      <div v-if="loadingInvoices" class="flex justify-center py-8">
        <Loader2 class="animate-spin h-6 w-6 text-primary" />
      </div>
      <div v-else-if="invoices.length === 0" class="text-center py-12 border rounded-lg bg-card">
        <Receipt class="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 class="text-lg font-medium">{{ t('admin.msg_no_transactions', 'Chưa có giao dịch') }}</h3>
        <p class="text-muted-foreground">{{ t('admin.msg_no_payments_yet', 'Bạn chưa thực hiện bất kỳ giao dịch thanh toán nào.') }}</p>
      </div>
      <div v-else class="border rounded-lg overflow-hidden">
        <table class="min-w-full divide-y divide-border">
          <thead class="bg-muted">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.msg_invoice_code', 'Mã HĐ') }}</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.msg_date', 'Ngày') }}</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.msg_amount', 'Số Tiền') }}</th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">{{ t('admin.msg_status', 'Trạng Thái') }}</th>
            </tr>
          </thead>
          <tbody class="bg-card divide-y divide-border">
            <tr v-for="invoice in invoices" :key="invoice.id">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium font-mono text-foreground">#INV-{{ invoice.id.toString().padStart(6, '0') }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{{ new Date(invoice.created_at).toLocaleDateString() }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-foreground font-semibold">{{ formatPrice(invoice.amount) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" :class="{
                  'bg-green-100 text-green-800': invoice.status === 'paid',
                  'bg-yellow-100 text-yellow-800': invoice.status === 'pending',
                  'bg-red-100 text-red-800': invoice.status === 'failed'
                }">
                  {{ invoice.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { FileIcon, Database, Puzzle, Receipt, Loader2 } from 'lucide-vue-next'
import PlanSelector from './PlanSelector.vue'
import { apiFetch } from '../composables/useApi.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const activeTab = ref('overview')

const loading = ref(true)
const currentPlan = ref(null)
const currentLimits = ref(null)
const usage = ref({ pages: 0, storage_mb: 0, api_calls: 0, modules_installed: 0 })

const loadingInvoices = ref(false)
const invoices = ref([])

const fetchBillingData = async () => {
  loading.value = true
  try {
    const [planResRaw, usageResRaw] = await Promise.all([
      apiFetch('/billing/current-plan'),
      apiFetch('/billing/usage')
    ])
    
    const planRes = await planResRaw.json()
    const usageRes = await usageResRaw.json()
    
    if (planRes.data) {
      currentPlan.value = planRes.data.plan
      currentLimits.value = planRes.data.limits
    }
    
    if (usageRes.data) {
      usage.value = usageRes.data
      // You'd also fetch actual installed module count from api/modules
      // Mocking modules_installed for now or pulling it properly if API provides it
      usage.value.modules_installed = 1
    }
  } catch (err) {
    console.error('Failed to load billing stats', err)
  } finally {
    loading.value = false
  }
}

const fetchInvoices = async () => {
  loadingInvoices.value = true
  try {
    const res = await apiFetch('/billing/invoices')
    const json = await res.json()
    invoices.value = json.data || []
  } catch (err) {
    console.error('Failed to load invoices', err)
  } finally {
    loadingInvoices.value = false
  }
}

watch(activeTab, (newTab) => {
  if (newTab === 'invoices' && invoices.value.length === 0) {
    fetchInvoices()
  }
})

const onPlanUpgraded = () => {
  activeTab.value = 'overview'
  fetchBillingData()
}

const calculatePercentage = (current, limit) => {
  if (!limit) return 0 // Unlimited
  const max = parseInt(limit)
  const val = parseInt(current)
  if (isNaN(max) || isNaN(val)) return 0
  const pct = (val / max) * 100
  return Math.min(Math.max(pct, 0), 100)
}

const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

onMounted(() => {
  fetchBillingData()
})
</script>
