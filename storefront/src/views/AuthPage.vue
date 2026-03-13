<template>
  <div class="auth-page">
    <div class="auth-card">
      <!-- Tab switch -->
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">Đăng nhập</button>
        <button :class="{ active: mode === 'register' }" @click="mode = 'register'">Đăng ký</button>
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="onLogin" class="auth-form">
        <div class="field">
          <label>Email</label>
          <input v-model="loginForm.email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="field">
          <label>Mật khẩu</label>
          <input v-model="loginForm.password" type="password" placeholder="Nhập mật khẩu" required />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? 'Đang xử lý...' : 'Đăng nhập' }}
        </button>
        <p class="auth-link" @click="mode = 'forgot'">Quên mật khẩu?</p>
      </form>

      <!-- Register Form -->
      <form v-else-if="mode === 'register'" @submit.prevent="onRegister" class="auth-form">
        <div class="field-row">
          <div class="field">
            <label>Họ</label>
            <input v-model="registerForm.lastName" placeholder="Nguyễn" />
          </div>
          <div class="field">
            <label>Tên</label>
            <input v-model="registerForm.firstName" placeholder="Văn A" required />
          </div>
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="registerForm.email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="field">
          <label>Số điện thoại</label>
          <input v-model="registerForm.phone" type="tel" placeholder="0901234567" />
        </div>
        <div class="field">
          <label>Mật khẩu</label>
          <input v-model="registerForm.password" type="password" placeholder="Tối thiểu 6 ký tự" required minlength="6" />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? 'Đang xử lý...' : 'Tạo tài khoản' }}
        </button>
      </form>

      <!-- Forgot Password -->
      <form v-else @submit.prevent="onForgot" class="auth-form">
        <p class="auth-desc">Nhập email để nhận link đặt lại mật khẩu</p>
        <div class="field">
          <label>Email</label>
          <input v-model="forgotEmail" type="email" placeholder="email@example.com" required />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <div class="auth-success" v-if="forgotSent">Đã gửi email đặt lại mật khẩu!</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? 'Đang gửi...' : 'Gửi link đặt lại' }}
        </button>
        <p class="auth-link" @click="mode = 'login'">← Quay lại đăng nhập</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'

const router = useRouter()
const { login, register, forgotPassword, loading, error } = useAuth()

const mode = ref('login')
const loginForm = reactive({ email: '', password: '' })
const registerForm = reactive({ firstName: '', lastName: '', email: '', phone: '', password: '' })
const forgotEmail = ref('')
const forgotSent = ref(false)

async function onLogin() {
  const ok = await login(loginForm.email, loginForm.password)
  if (ok) router.push('/')
}

async function onRegister() {
  const ok = await register(registerForm)
  if (ok) router.push('/')
}

async function onForgot() {
  forgotSent.value = false
  const ok = await forgotPassword(forgotEmail.value)
  if (ok) forgotSent.value = true
}
</script>

<style scoped>
.auth-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}
.auth-card {
  width: 100%;
  max-width: 440px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.auth-tabs {
  display: flex;
  gap: 4px;
  background: var(--color-bg-secondary, #f5f5f5);
  border-radius: 10px;
  padding: 4px;
  margin-bottom: 24px;
}
.auth-tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #666);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.auth-tabs button.active {
  background: var(--color-accent, #7c3aed);
  color: #fff;
  box-shadow: 0 2px 8px rgba(124,58,237,0.25);
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field-row {
  display: flex;
  gap: 12px;
}
.field-row .field { flex: 1; }
.field label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary, #555);
  margin-bottom: 6px;
}
.field input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
  background: var(--color-bg-input, #fafafa);
  color: var(--color-text-primary, #333);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}
.field input:focus {
  border-color: var(--color-accent, #7c3aed);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
}
.auth-error {
  background: #fef2f2;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid #fee2e2;
}
.auth-success {
  background: #f0fdf4;
  color: #16a34a;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  border: 1px solid #dcfce7;
}
.auth-submit {
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--color-accent, #7c3aed);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}
.auth-submit:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}
.auth-submit:disabled {
  opacity: 0.5;
  cursor: wait;
}
.auth-link {
  text-align: center;
  color: var(--color-accent, #7c3aed);
  font-size: 13px;
  cursor: pointer;
  margin: 0;
}
.auth-link:hover { text-decoration: underline; }
.auth-desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  text-align: center;
  margin: 0;
}
</style>
