<template>
  <div class="fixed inset-0 z-[9999] bg-white flex flex-col overflow-hidden">
    <!-- Header -->
    <header class="border-b px-8 py-4 flex items-center justify-between shadow-sm">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
          <LucideRocket />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Khởi tạo Cửa hàng</h1>
      </div>
      <!-- Steps indicator -->
      <div class="hidden md:flex items-center space-x-2">
        <template v-for="(stepLabel, index) in steps" :key="index">
          <div 
            class="flex items-center"
            :class="step > index ? 'text-indigo-600 font-medium' : (step === index ? 'text-gray-900 font-semibold' : 'text-gray-400')"
          >
            <span 
              class="w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2"
              :class="step >= index ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'"
            >
              {{ index + 1 }}
            </span>
            {{ stepLabel }}
          </div>
          <div v-if="index < steps.length - 1" class="w-8 h-px bg-gray-300 mx-2"></div>
        </template>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 overflow-y-auto bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 p-8 sm:p-12 relative">
      <!-- Decorative background elements -->
      <div class="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-indigo-100/30 to-transparent pointer-events-none"></div>
      
      <div class="max-w-6xl mx-auto h-full flex flex-col relative z-10">
        
        <!-- STEP 1: Choose Template -->
        <div v-if="step === 0" class="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div class="text-center mb-12">
            <h2 class="text-4xl font-extrabold tracking-tight text-gray-900 mb-4">Khởi đầu hoàn hảo cho Website của bạn</h2>
            <p class="text-xl text-gray-500 max-w-2xl mx-auto">Chọn một bộ khung giao diện mẫu phù hợp với mục tiêu kinh doanh. Bạn luôn có thể tuỳ biến mọi chi tiết sau này.</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div 
              v-for="tpl in templates" :key="tpl.id"
              @click="selectTemplate(tpl)"
              class="bg-white rounded-2xl border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl group relative overflow-hidden flex flex-col"
              :class="selectedTemplate?.id === tpl.id ? 'border-indigo-500 shadow-lg ring-4 ring-indigo-500/20' : 'border-gray-200 hover:border-indigo-300'"
            >
              <!-- Image Cover -->
              <div class="w-full h-48 bg-gray-100 relative overflow-hidden border-b">
                <img v-if="tpl.image" :src="tpl.image" :alt="tpl.name" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div v-else class="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-300">
                  <component :is="getIcon(tpl.icon)" class="w-16 h-16 opacity-50" />
                </div>
                <!-- Selected Badge -->
                <div v-if="selectedTemplate?.id === tpl.id" class="absolute top-4 right-4 text-white bg-indigo-600 rounded-full p-1 shadow-lg animate-in zoom-in z-10">
                  <LucideCheckCircle class="w-6 h-6" />
                </div>
              </div>
              
              <div class="p-6 flex-1 flex flex-col">
                <div class="flex items-center space-x-3 mb-3">
                  <div v-if="!tpl.image" class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100">
                    <component :is="getIcon(tpl.icon)" class="w-5 h-5" />
                  </div>
                  <h3 class="text-2xl font-bold text-gray-900">{{ tpl.name }}</h3>
                </div>
                
                <p class="text-gray-500 mb-6 leading-relaxed flex-1">{{ tpl.description }}</p>
                
                <!-- Included features/modules preview -->
                <div class="mt-auto pt-5 border-t border-gray-100">
                  <div class="flex items-center space-x-3 mb-2 text-sm text-gray-600 font-medium">
                    <div class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><LucideCheck class="w-4 h-4" /></div>
                    <span>{{ tpl.modules.length > 0 ? tpl.modules.length + ' modules cài sẵn' : 'Tùy biến tự do' }}</span>
                  </div>
                  <div class="flex items-center space-x-3 text-sm text-gray-600 font-medium">
                    <div class="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center"><LucideCheck class="w-4 h-4" /></div>
                    <span>Giao diện: <strong class="text-gray-900">{{ tpl.theme }}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 2: Language -->
        <div v-else-if="step === 1" class="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-500">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Ngôn ngữ mặc định</h2>
            <p class="text-gray-600">Chọn ngôn ngữ chính cho website của bạn. Có thể thêm ngôn ngữ khác trong phần Cài đặt sau này.</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div 
              v-for="lang in languages" :key="lang.code"
              @click="siteInfo.language = lang.code"
              class="bg-white rounded-xl border p-6 cursor-pointer transition-all flex items-center space-x-4"
              :class="siteInfo.language === lang.code ? 'border-indigo-500 ring-2 ring-indigo-500 bg-indigo-50/50' : 'hover:border-indigo-300'"
            >
              <div class="text-4xl">{{ lang.flag }}</div>
              <div class="flex-1">
                <h3 class="text-xl font-bold text-gray-900">{{ lang.name }}</h3>
                <p class="text-sm text-gray-500">{{ lang.code.toUpperCase() }}</p>
              </div>
              <div v-if="siteInfo.language === lang.code" class="text-indigo-600">
                <LucideCheckCircle class="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <!-- STEP 3: Basic Info -->
        <div v-else-if="step === 2" class="max-w-2xl mx-auto w-full animate-in fade-in slide-in-from-right-8 duration-500">
          <div class="text-center mb-8">
            <h2 class="text-3xl font-bold text-gray-900 mb-4">Tên cửa hàng / website của bạn</h2>
            <p class="text-gray-600">Những thông tin này có thể được chỉnh sửa sau trong phần Cài đặt.</p>
          </div>
          
          <div class="bg-white rounded-xl shadow-sm border p-8 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Tên gọi</label>
              <input 
                v-model="siteInfo.name" 
                type="text" 
                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg"
                placeholder="VD: Cửa hàng Thời Trang VIP"
              >
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Mô tả ngắn</label>
              <textarea 
                v-model="siteInfo.description" 
                rows="3"
                class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-lg resize-none"
                placeholder="Tóm tắt về sản phẩm hoặc dịch vụ..."
              ></textarea>
            </div>
          </div>
        </div>

        <!-- STEP 4: Confirm & Process -->
        <div v-else-if="step === 3" class="max-w-lg mx-auto w-full py-10 animate-in fade-in slide-in-from-right-8 duration-500">
          <div v-if="!isApplying" class="text-center">
            <div class="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <component :is="getIcon(selectedTemplate.icon)" class="w-10 h-10" />
            </div>
            <h2 class="text-3xl font-bold mb-4">Mọi thứ đã sẵn sàng!</h2>
            <p class="text-gray-600 mb-8">
              Hệ thống sẽ cài đặt <strong>{{ selectedTemplate.name }}</strong> với tên site là <strong>"{{ siteInfo.name || 'Site của tôi' }}"</strong>.
            </p>
            
            <div class="bg-white rounded-lg border p-6 text-left mb-8 space-y-4">
              <h4 class="font-semibold text-gray-900">Chi tiết khởi tạo:</h4>
              <ul class="space-y-3 text-sm text-gray-600">
                <li class="flex items-center"><LucideCheckCircle class="w-5 h-5 text-green-500 mr-3"/> Ngôn ngữ chính: {{ languages.find(l => l.code === siteInfo.language)?.name }}</li>
                <li class="flex items-center"><LucideCheckCircle class="w-5 h-5 text-green-500 mr-3"/> Cài đặt Theme: {{ selectedTemplate.theme }}</li>
                <li class="flex items-center"><LucideCheckCircle class="w-5 h-5 text-green-500 mr-3"/> Cài đặt {{ selectedTemplate.modules.length }} modules chức năng</li>
                <li class="flex items-center"><LucideCheckCircle class="w-5 h-5 text-green-500 mr-3"/> Cấu hình Storefront Layout tự động</li>
                <li class="flex items-center"><LucideCheckCircle class="w-5 h-5 text-green-500 mr-3"/> Tạo {{ selectedTemplate.default_pages.length }} trang nội dung cơ bản</li>
              </ul>
            </div>
          </div>

          <div v-else class="text-center space-y-8 mt-10">
            <div class="relative w-32 h-32 mx-auto">
               <svg class="animate-spin text-indigo-600 w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                 <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               <component :is="getIcon(selectedTemplate.icon)" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-600" />
            </div>
            <h3 class="text-2xl font-bold text-gray-900">Đang khởi tạo hệ thống...</h3>
            <p class="text-gray-500">Quá trình này có thể mất vài chục giây.<br>Vui lòng không đóng trình duyệt.</p>
          </div>
        </div>

      </div>
    </main>

    <!-- Footer Controls -->
    <footer v-if="!isApplying" class="bg-white border-t p-6 flex items-center justify-between">
      <button 
        v-if="step > 0" 
        @click="step--"
        class="px-6 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
      >
        Trở lại
      </button>
      <div v-else></div> <!-- Spacer -->

      <button 
        v-if="step < 3"
        @click="nextStep"
        :disabled="step === 0 && !selectedTemplate"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
      >
        Tiếp tục <LucideArrowRight class="ml-2 w-5 h-5" />
      </button>

      <button 
        v-if="step === 3"
        @click="processOnboarding"
        class="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium shadow-md transition-all hover:-translate-y-0.5 flex items-center"
      >
        Bắt đầu tạo website <LucideCheck class="ml-2 w-5 h-5" />
      </button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi'
import { useToast } from '../composables/useToast'
import * as LucideIcons from 'lucide-vue-next'
// Deconstruct used icons specifically for dynamic component to avoid missing dependencies
const { ShoppingCart, FileText, User, Target, LayoutGrid, Rocket, Check, ArrowRight, CheckCircle } = LucideIcons

const toast = useToast()
const emit = defineEmits(['complete'])

const steps = ['Bố cục', 'Ngôn ngữ', 'Thông tin', 'Xác nhận']
const step = ref(0)
const templates = ref([])
const selectedTemplate = ref(null)
const siteInfo = ref({ name: '', description: '', language: 'vi' })
const languages = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
]
const isApplying = ref(false)

const getIcon = (iconName) => {
  return LucideIcons[iconName] || LucideIcons.LayoutGrid
}

const fetchTemplates = async () => {
  try {
    const res = await apiFetch('/onboarding/templates')
    const json = await res.json()
    if (json && json.success) {
      templates.value = json.data
    }
  } catch (err) {
    console.error('Failed to load templates:', err)
  }
}

onMounted(() => {
  fetchTemplates()
})

const selectTemplate = (tpl) => {
  selectedTemplate.value = tpl
}

const nextStep = () => {
  if (step.value === 0 && !selectedTemplate.value) {
    toast.error('Vui lòng chọn một giao diện để bắt đầu.')
    return
  }
  step.value++
}

const processOnboarding = async () => {
  isApplying.value = true
  try {
    // 1. Send API request to apply template
    const res = await apiFetch('/onboarding/apply', {
      method: 'POST',
      body: JSON.stringify({
        template_id: selectedTemplate.value.id,
        site_info: siteInfo.value
      })
    })

    const json = await res.json()
    if (json && json.success) {
      toast.success(json.message)
      // Slight delay for UX
      setTimeout(() => {
        emit('complete') // Parent component should close this and refresh state
      }, 1500)
    } else {
      throw new Error(json?.message || 'Có lỗi khi hệ thống khởi tạo')
    }
  } catch (err) {
    toast.error(err.message || 'Lỗi không xác định')
    isApplying.value = false
  }
}
</script>
