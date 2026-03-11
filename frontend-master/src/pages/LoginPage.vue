<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-950 relative overflow-hidden">
    <!-- Background decoration -->
    <div class="absolute inset-0 pointer-events-none">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/8 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl"></div>
    </div>

    <div class="card w-full max-w-md mx-4 p-8 relative z-10">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="w-14 h-14 mx-auto rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center mb-4">
          <component :is="Shield" :size="28" class="text-white" />
        </div>
        <h1 class="text-xl font-bold text-white">Master Panel</h1>
        <p class="text-sm text-surface-400 mt-1">Multi-Tenant Management System</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Email</label>
          <input v-model="email" type="email" class="input" placeholder="admin@master.com" required autofocus />
        </div>
        <div>
          <label class="block text-sm text-surface-300 mb-1.5">Password</label>
          <input v-model="password" type="password" class="input" placeholder="••••••••" required />
        </div>
        <button type="submit" :disabled="loading" class="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
          <component v-if="loading" :is="Loader2" :size="18" class="animate-spin" />
          {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Shield, Loader2 } from 'lucide-vue-next'
import { login } from '../services/api.js'

const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(email.value, password.value)
    router.push('/')
  } catch (err) {
    error.value = err.message || 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>
