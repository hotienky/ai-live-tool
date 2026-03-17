<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-card__logo">
        <Rocket :size="32" />
        <h1>AI Live Tool</h1>
        <p class="login-card__subtitle">Công cụ hỗ trợ livestream thông minh</p>
      </div>

      <form @submit.prevent="onSubmit" class="login-card__form">
        <!-- Email -->
        <div class="login-card__field">
          <label><Mail :size="14" /> Email</label>
          <input
            v-model="email"
            type="email"
            placeholder="email@example.com"
            class="login-card__input"
            required
          />
        </div>

        <!-- Password -->
        <div class="login-card__field">
          <label><Lock :size="14" /> Mật khẩu</label>
          <div class="login-card__password-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Nhập mật khẩu"
              class="login-card__input"
              required
            />
            <button
              type="button"
              class="login-card__eye"
              @click="showPassword = !showPassword"
            >
              <EyeOff v-if="showPassword" :size="16" />
              <Eye v-else :size="16" />
            </button>
          </div>
        </div>

        <!-- Error Message -->
        <div class="login-card__error" v-if="error">
          <AlertCircle :size="14" />
          {{ error }}
        </div>

        <!-- Submit -->
        <button
          type="submit"
          class="login-card__submit"
          :disabled="loading"
        >
          <Loader2 v-if="loading" :size="16" class="spin" />
          <LogIn v-else :size="16" />
          Đăng nhập
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth.js'
import {
  Rocket, Mail, Lock, Eye, EyeOff,
  AlertCircle, Loader2, LogIn
} from 'lucide-vue-next'

const emit = defineEmits(['loginSuccess'])

const { login, loading, error } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

async function onSubmit() {
  const success = await login(email.value, password.value)
  if (success) emit('loginSuccess')
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--color-bg-primary);
  position: relative;
  overflow: hidden;
}
.login-page::before {
  content: '';
  position: absolute;
  width: 500px; height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255,59,92,0.12), transparent 70%);
  top: -100px; left: -100px;
  animation: float1 12s ease-in-out infinite;
}
.login-page::after {
  content: '';
  position: absolute;
  width: 400px; height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--color-accent-glow), transparent 70%);
  bottom: -80px; right: -80px;
  animation: float2 15s ease-in-out infinite;
}
@keyframes float1 {
  0%,100% { transform: translate(0,0); }
  50% { transform: translate(60px,40px); }
}
@keyframes float2 {
  0%,100% { transform: translate(0,0); }
  50% { transform: translate(-40px,-30px); }
}

.login-card {
  width: 420px;
  background: var(--glass-bg);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--glass-border);
  border-radius: 20px;
  padding: 40px;
  box-shadow: var(--shadow-elevated);
  position: relative;
  z-index: 1;
}

.login-card__logo {
  text-align: center;
  margin-bottom: 24px;
}

.login-card__logo svg {
  color: #ff3b5c;
  margin-bottom: 8px;
  filter: drop-shadow(0 0 12px rgba(255,59,92,0.4));
}

.login-card__logo h1 {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-card__subtitle {
  font-size: 13px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.login-card__tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg-primary);
  border-radius: 8px;
  padding: 2px;
  margin-bottom: 20px;
}

.login-card__tab {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.login-card__tab:hover {
  color: var(--color-text-primary);
}

.login-card__tab--active {
  background: var(--color-bg-secondary);
  color: var(--color-text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.login-card__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.login-card__field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.login-card__input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.login-card__input:focus {
  border-color: #ff3b5c;
  box-shadow: 0 0 0 3px rgba(255,59,92,0.1);
}

.login-card__password-wrap {
  position: relative;
}

.login-card__password-wrap .login-card__input {
  padding-right: 40px;
}

.login-card__eye {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
}

.login-card__error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 59, 92, 0.1);
  color: #ff3b5c;
  font-size: 13px;
  border: 1px solid rgba(255, 59, 92, 0.2);
}

.login-card__submit {
  padding: 12px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  color: white;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: opacity 0.2s, transform 0.2s;
}

.login-card__submit:hover:not(:disabled) {
  opacity: 0.95;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255,59,92,0.30);
}

.login-card__submit:disabled {
  opacity: 0.6;
  cursor: wait;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.login-card__footer {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.login-card__footer a {
  color: #ff3b5c;
  text-decoration: none;
  font-weight: 600;
}

.login-card__footer a:hover {
  text-decoration: underline;
}
</style>
