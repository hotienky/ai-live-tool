<template>
  <div class="space-y-6">
    <div class="text-center mb-8">
      <h2 class="text-2xl font-bold">{{ t('admin.msg_choose_plan', 'Chọn Gói Cước Phù Hợp') }}</h2>
      <p class="text-muted-foreground mt-2">{{ t('admin.msg_upgrade_desc', 'Nâng cấp để mở khóa thêm tài nguyên và tính năng cho website của bạn.') }}</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
    </div>
    
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div 
        v-for="plan in plans" 
        :key="plan.id"
        class="relative border rounded-xl p-6 bg-card text-card-foreground flex flex-col"
        :class="{ 'border-primary ring-2 ring-primary/20': currentPlanId === plan.id || plan.slug === 'pro' }"
      >
        <div v-if="plan.slug === 'pro'" class="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {{ t('admin.msg_popular', 'Phổ Biến') }}
        </div>
        
        <div class="mb-4">
          <h3 class="font-bold text-xl">{{ plan.name }}</h3>
          <div class="mt-2 flex items-baseline text-3xl font-extrabold">
            {{ formatPrice(plan.price) }}
            <span class="text-sm font-medium text-muted-foreground ml-1">/{{ plan.billing_cycle === 'yearly' ? t('admin.msg_year', 'năm') : t('admin.msg_month', 'tháng') }}</span>
          </div>
        </div>

        <ul class="space-y-3 mb-6 flex-1 text-sm">
          <li class="flex items-center">
            <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>{{ t('admin.msg_max', 'Tối đa') }} <strong>{{ plan.limits?.pages || t('admin.msg_unlimited', 'Không giới hạn') }}</strong> {{ t('admin.msg_cms_pages', 'trang CMS') }}</span>
          </li>
          <li class="flex items-center">
            <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span><strong>{{ plan.limits?.storage_mb || 0 }} MB</strong> {{ t('admin.msg_storage', 'dung lượng lưu trữ') }}</span>
          </li>
          <li class="flex items-center">
            <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>{{ t('admin.msg_install', 'Cài đặt') }} <strong>{{ plan.limits?.modules_free || 0 }}</strong> {{ t('admin.msg_function_module', 'module chức năng') }}</span>
          </li>
          <li class="flex items-center">
            <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span><strong>{{ plan.limits?.custom_domains || 0 }}</strong> {{ t('admin.msg_custom_domains', 'tên miền riêng') }}</span>
          </li>
          <li v-if="plan.limits?.headless_mode" class="flex items-center">
            <Check class="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
            <span>{{ t('admin.msg_headless_support', 'Hỗ trợ API Headless mode') }}</span>
          </li>
        </ul>

        <button 
          @click="selectPlan(plan)"
          :disabled="isProcessing || currentPlanId === plan.id"
          class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
          :class="[
            currentPlanId === plan.id 
              ? 'bg-muted text-muted-foreground cursor-not-allowed' 
              : plan.slug === 'pro' 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          ]"
        >
          <Loader2 v-if="isProcessing && selectedPlanId === plan.id" class="animate-spin h-4 w-4 mr-2" />
          {{ currentPlanId === plan.id ? t('admin.msg_current_plan', 'Đang Sử Dụng') : t('admin.msg_select_plan', 'Chọn Gói Này') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Check, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  currentPlanId: {
    type: Number,
    default: null
  }
})

const emit = defineEmits(['plan-changed'])

const toast = useToast()

const plans = ref([])
const loading = ref(true)
const isProcessing = ref(false)
const selectedPlanId = ref(null)

const fetchPlans = async () => {
  try {
    const res = await apiFetch('/billing/plans')
    const json = await res.json()
    plans.value = json.data || []
  } catch (error) {
    toast.error(t('admin.msg_load_plans_error', 'Lỗi khi tải danh sách gói cước'))
    console.error(error)
  } finally {
    loading.value = false
  }
}

const formatPrice = (price) => {
  if (!price || price == 0) return t('admin.msg_free', 'Miễn phí')
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const selectPlan = async (plan) => {
  if (props.currentPlanId === plan.id) return
  
  isProcessing.value = true
  selectedPlanId.value = plan.id
  
  try {
    // In real app, this might open a payment modal or redirect to VNPay
    await apiFetch('/billing/change-plan', { 
      method: 'POST',
      body: JSON.stringify({ plan_id: plan.id })
    })
    toast.success(t('admin.msg_upgrade_success', 'Đã nâng cấp lên {plan} thành công.').replace('{plan}', plan.name))
    emit('plan-changed')
  } catch (error) {
    toast.error(t('admin.msg_change_plan_error', 'Lỗi khi thay đổi gói cước. Vui lòng thử lại.'))
    console.error(error)
  } finally {
    isProcessing.value = false
    selectedPlanId.value = null
  }
}

onMounted(() => {
  fetchPlans()
})
</script>
