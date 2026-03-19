<template>
  <div class="auth-page">
    <div class="auth-card" :style="{ maxWidth: authConfig.cardMaxWidth + 'px' }">
      <!-- Tab switch -->
      <div class="auth-tabs">
        <button :class="{ active: mode === 'login' }" @click="mode = 'login'">{{ t('storefront.login') || 'Đăng nhập' }}</button>
        <button v-if="authConfig.allowRegister" :class="{ active: mode === 'register' }" @click="mode = 'register'">{{ t('storefront.register') || 'Đăng ký' }}</button>
      </div>

      <!-- Login Form -->
      <form v-if="mode === 'login'" @submit.prevent="onLogin" class="auth-form">
        <div class="field">
          <label>Email</label>
          <input v-model="loginForm.email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="field">
          <label>{{ t('storefront.password', 'Mật khẩu') }}</label>
          <input v-model="loginForm.password" type="password" :placeholder="t('storefront.enter_password', 'Nhập mật khẩu')" required />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? (t('storefront.processing') || 'Đang xử lý...') : (t('storefront.login') || 'Đăng nhập') }}
        </button>
        <p v-if="authConfig.allowForgotPassword" class="auth-link" @click="mode = 'forgot'">{{ t('storefront.forgot_password') || 'Quên mật khẩu?' }}</p>
      </form>

      <!-- Register Form -->
      <form v-else-if="mode === 'register'" @submit.prevent="onRegister" class="auth-form">
        <div class="field-row">
          <div class="field">
            <label>{{ t('storefront.last_name', 'Họ') }}</label>
            <input v-model="registerForm.lastName" :placeholder="t('storefront.last_name_placeholder', 'Nguyễn')" />
          </div>
          <div class="field">
            <label>{{ t('storefront.first_name', 'Tên') }}</label>
            <input v-model="registerForm.firstName" :placeholder="t('storefront.first_name_placeholder', 'Văn A')" required />
          </div>
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="registerForm.email" type="email" placeholder="email@example.com" required />
        </div>
        <div class="field">
          <label>{{ t('storefront.phone', 'Số điện thoại') }}</label>
          <input v-model="registerForm.phone" type="tel" placeholder="0901234567" />
        </div>
        <div class="field">
          <label>{{ t('storefront.password', 'Mật khẩu') }}</label>
          <input v-model="registerForm.password" type="password" :placeholder="t('storefront.min_6_chars', 'Tối thiểu 6 ký tự')" required minlength="6" />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? (t('storefront.processing') || 'Đang xử lý...') : (t('storefront.create_account') || 'Tạo tài khoản') }}
        </button>
      </form>

      <!-- Forgot Password -->
      <form v-else @submit.prevent="onForgot" class="auth-form">
        <p class="auth-desc">{{ t('storefront.forgot_desc', 'Nhập email để nhận link đặt lại mật khẩu') }}</p>
        <div class="field">
          <label>Email</label>
          <input v-model="forgotEmail" type="email" placeholder="email@example.com" required />
        </div>
        <div class="auth-error" v-if="error">{{ error }}</div>
        <div class="auth-success" v-if="forgotSent">{{ t('storefront.forgot_sent', 'Đã gửi email đặt lại mật khẩu!') }}</div>
        <button type="submit" class="auth-submit" :disabled="loading">
          {{ loading ? t('storefront.sending', 'Đang gửi...') : t('storefront.send_reset_link', 'Gửi link đặt lại') }}
        </button>
        <p class="auth-link" @click="mode = 'login'">← {{ t('storefront.back_to_login', 'Quay lại đăng nhập') }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, inject, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const router = useRouter()
const { login, register, forgotPassword, loading, error } = useAuth()

const layoutConfig = inject('layoutConfig', ref(null))
const authConfig = computed(() => {
  const defaults = { allowRegister: true, allowForgotPassword: true, showSocialLogin: false, cardMaxWidth: 440 }
  const ac = layoutConfig.value?.pageConfigs?.auth
  return ac ? { ...defaults, ...ac } : defaults
})

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
  background: var(--sf-accent);
  color: #fff;
  box-shadow: var(--sf-shadow-accent);
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
  border-color: var(--sf-accent);
  box-shadow: 0 0 0 3px var(--sf-accent-glow);
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
  background: var(--sf-accent);
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
  color: var(--sf-accent);
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
