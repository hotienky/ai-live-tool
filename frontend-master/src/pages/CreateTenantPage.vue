<template>
  <div class="p-6 lg:p-8 max-w-2xl">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/tenants" class="text-sm text-surface-400 hover:text-primary-400 transition-colors mb-2 inline-block">← Quay lại</router-link>
      <h1 class="text-2xl font-bold text-white mb-1">Tạo Tenant mới</h1>
      <p class="text-surface-400 text-sm">Tạo cửa hàng mới với database và schema riêng</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Form -->
    <form @submit.prevent="handleCreate" class="card p-6 space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Tên cửa hàng *</label>
          <input v-model="form.name" type="text" class="input" placeholder="Fashion Store VN" required />
        </div>
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Slug (subdomain) *</label>
          <div class="flex">
            <input v-model="form.slug" type="text" class="input rounded-r-none" placeholder="fashion-store" required pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$" />
            <span class="px-3 py-2 bg-surface-700/60 border border-l-0 border-surface-600/40 rounded-r-lg text-surface-400 text-sm whitespace-nowrap">.domain.com</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Email chủ sở hữu *</label>
          <input v-model="form.ownerEmail" type="email" class="input" placeholder="owner@store.com" required />
        </div>
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Tên chủ sở hữu</label>
          <input v-model="form.ownerName" type="text" class="input" placeholder="Nguyễn Văn A" />
        </div>
      </div>

      <div>
        <label class="block text-sm text-surface-300 mb-1.5">Gói dịch vụ</label>
        <div class="flex gap-3">
          <label v-for="p in plans" :key="p.value"
                 class="flex-1 card p-3 cursor-pointer transition-all"
                 :class="form.plan === p.value ? 'border-primary-500/50 bg-primary-600/10' : 'hover:border-surface-600/60'">
            <input v-model="form.plan" type="radio" :value="p.value" class="hidden" />
            <p class="text-sm font-medium text-white">{{ p.label }}</p>
            <p class="text-xs text-surface-400 mt-0.5">{{ p.desc }}</p>
          </label>
        </div>
      </div>

      <div class="pt-2 flex justify-end gap-3">
        <router-link to="/tenants" class="btn-ghost">Hủy</router-link>
        <button type="submit" :disabled="creating" class="btn-primary flex items-center gap-2">
          <Loader2 v-if="creating" :size="16" class="animate-spin" />
          {{ creating ? 'Đang tạo...' : 'Tạo Tenant' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Loader2 } from 'lucide-vue-next'
import { tenants } from '../services/api.js'

const router = useRouter()
const creating = ref(false)
const error = ref('')

const form = ref({
  name: '',
  slug: '',
  ownerEmail: '',
  ownerName: '',
  plan: 'free',
})

const plans = [
  { value: 'free', label: 'Free', desc: 'Cơ bản, giới hạn' },
  { value: 'pro', label: 'Pro', desc: 'Đầy đủ tính năng' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Không giới hạn' },
]

async function handleCreate() {
  error.value = ''
  creating.value = true
  try {
    await tenants.create(form.value)
    router.push('/tenants')
  } catch (err) {
    error.value = err.message || 'Tạo tenant thất bại'
  } finally {
    creating.value = false
  }
}
</script>
