<template>
  <div class="mp-login">
    <!-- Background decoration -->
    <div class="mp-login__bg">
      <div class="mp-login__glow mp-login__glow--1"></div>
      <div class="mp-login__glow mp-login__glow--2"></div>
    </div>

    <div class="card mp-login__card">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="mp-login__icon">
          <component :is="Shield" :size="28" />
        </div>
        <h1 class="mp-login__title">Master Panel</h1>
        <p class="mp-login__subtitle">Multi-Tenant Management System</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
        {{ error }}
      </div>

      <!-- Form -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="mp-login__label">Email</label>
          <input v-model="email" type="email" class="input" placeholder="admin@master.com" required autofocus />
        </div>
        <div>
          <label class="mp-login__label">Password</label>
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

<style scoped>
.mp-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--mp-bg-primary);
  position: relative;
  overflow: hidden;
}
.mp-login__bg { position: absolute; inset: 0; pointer-events: none; }
.mp-login__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}
.mp-login__glow--1 {
  top: 25%; left: 25%; width: 384px; height: 384px;
  background: rgba(13, 82, 217, 0.06);
}
.mp-login__glow--2 {
  bottom: 25%; right: 25%; width: 320px; height: 320px;
  background: rgba(26, 109, 245, 0.04);
}
.mp-login__card {
  width: 100%; max-width: 420px; margin: 0 16px; padding: 32px;
  position: relative; z-index: 10;
}
.mp-login__icon {
  width: 56px; height: 56px; margin: 0 auto 16px; border-radius: 12px;
  background: linear-gradient(135deg, #1a6df5, #0d52d9);
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.mp-login__title {
  font-size: 1.25rem; font-weight: 700;
  color: var(--mp-text-primary); margin: 0;
}
.mp-login__subtitle {
  font-size: 0.875rem; color: var(--mp-text-muted); margin-top: 4px;
}
.mp-login__label {
  display: block; font-size: 0.875rem;
  color: var(--mp-text-secondary); margin-bottom: 6px;
}
</style>
