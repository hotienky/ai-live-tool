<template>
  <div class="p-6 lg:p-8 max-w-2xl">
    <!-- Header -->
    <div class="mb-6">
      <router-link to="/tenants" class="mp-link mb-2 inline-block">← Quay lại</router-link>
      <h1 class="text-2xl font-bold mp-text-primary mb-1">Tạo Tenant mới</h1>
      <p class="text-sm mp-text-muted">Tạo cửa hàng mới với database và schema riêng</p>
    </div>

    <!-- Error -->
    <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
      {{ error }}
    </div>

    <!-- Form -->
    <form @submit.prevent="handleCreate" class="card p-6 space-y-5">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="mp-label">Tên cửa hàng *</label>
          <input v-model="form.name" type="text" class="input" placeholder="Fashion Store VN" required />
        </div>
        <div>
          <label class="mp-label">Slug (subdomain) *</label>
          <div class="flex">
            <input v-model="form.slug" type="text" class="input rounded-r-none" placeholder="fashion-store" required pattern="^[a-z0-9][a-z0-9-]*[a-z0-9]$" />
            <span class="mp-slug-suffix">.domain.com</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label class="mp-label">Email chủ sở hữu *</label>
          <input v-model="form.ownerEmail" type="email" class="input" placeholder="owner@store.com" required />
        </div>
        <div>
          <label class="mp-label">Tên chủ sở hữu</label>
          <input v-model="form.ownerName" type="text" class="input" placeholder="Nguyễn Văn A" />
        </div>
      </div>

      <div>
        <label class="mp-label">Gói dịch vụ</label>
        <div class="flex gap-3">
          <div v-for="p in plans" :key="p.value"
               @click="form.plan = p.value"
               class="flex-1 card p-3 cursor-pointer transition-all select-none"
               :class="form.plan === p.value ? 'border-primary-500/50 bg-primary-600/10 ring-1 ring-primary-500/30' : ''">
            <p class="text-sm font-medium mp-text-primary">{{ p.label }}</p>
            <p class="text-xs mp-text-muted mt-0.5">{{ p.desc }}</p>
          </div>
        </div>
      </div>

      <div>
        <label class="mp-label">Tính năng sử dụng</label>
        <div class="flex gap-3">
          <label v-for="f in featureOptions" :key="f.value"
               class="flex-1 card p-3 cursor-pointer transition-all select-none flex items-center gap-3"
               :class="selectedFeatures.includes(f.value) ? 'border-primary-500/50 bg-primary-600/10 ring-1 ring-primary-500/30' : ''">
            <input type="checkbox" :value="f.value" v-model="selectedFeatures" class="mp-checkbox" />
            <div>
              <p class="text-sm font-medium mp-text-primary">{{ f.label }}</p>
              <p class="text-xs mp-text-muted mt-0.5">{{ f.desc }}</p>
            </div>
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
import { ref, computed } from 'vue'
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
  features: 'all',
})

const plans = [
  { value: 'free', label: 'Free', desc: 'Cơ bản, giới hạn' },
  { value: 'pro', label: 'Pro', desc: 'Đầy đủ tính năng' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Không giới hạn' },
]

const featureOptions = [
  { value: 'livestream', label: 'Live', desc: 'Dashboard, Live Monitor, CRM' },
  { value: 'store', label: 'Store', desc: 'Cửa hàng, Đơn hàng, Kế toán' },
]

const selectedFeatures = computed({
  get() {
    const f = form.value.features
    if (f === 'all') return ['livestream', 'store']
    if (f === 'livestream') return ['livestream']
    if (f === 'store') return ['store']
    return ['livestream', 'store']
  },
  set(arr) {
    if (arr.length === 2 || arr.length === 0) form.value.features = 'all'
    else form.value.features = arr[0]
  },
})

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

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-link { font-size: 0.875rem; color: var(--mp-text-muted); transition: color 0.2s; }
.mp-link:hover { color: #3b8bfa; }
.mp-label { display: block; font-size: 0.875rem; color: var(--mp-text-secondary); margin-bottom: 6px; }
.mp-slug-suffix {
  padding: 8px 12px;
  background: var(--mp-bg-input);
  border: 1px solid var(--mp-border);
  border-left: none;
  border-radius: 0 8px 8px 0;
  color: var(--mp-text-muted);
  font-size: 0.875rem;
  white-space: nowrap;
}
.mp-checkbox {
  width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer; flex-shrink: 0;
}
</style>
