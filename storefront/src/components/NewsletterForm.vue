<template>
  <div class="newsletter-form" v-if="!submitted">
    <div class="newsletter-form__text">
      <h4><Mail :size="18" /> {{ title || 'Đăng ký nhận tin' }}</h4>
      <p>{{ description || 'Nhận thông báo khuyến mãi và sản phẩm mới' }}</p>
    </div>
    <form @submit.prevent="subscribe" class="newsletter-form__row">
      <input
        v-model="email"
        type="email"
        :placeholder="placeholder || 'Email của bạn'"
        required
        class="newsletter-form__input"
      />
      <button type="submit" class="newsletter-form__btn" :disabled="submitting">
        <Send :size="14" />
        {{ submitting ? '...' : (btnText || 'Đăng ký') }}
      </button>
    </form>
    <p v-if="error" class="newsletter-form__error">{{ error }}</p>
  </div>

  <!-- Success State -->
  <div v-else class="newsletter-form newsletter-form--success">
    <CheckCircle :size="24" />
    <p>Cảm ơn bạn đã đăng ký! Chúng tôi sẽ gửi thông tin mới nhất đến email của bạn.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { apiPost } from '../api.js'
import { Mail, Send, CheckCircle } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  btnText: { type: String, default: '' },
})

const email = ref('')
const submitting = ref(false)
const submitted = ref(false)
const error = ref('')

async function subscribe() {
  if (!email.value) return
  submitting.value = true
  error.value = ''
  try {
    await apiPost('/newsletter/subscribe', { email: email.value })
    submitted.value = true
  } catch (e) {
    error.value = e.message || 'Đăng ký thất bại, vui lòng thử lại'
  }
  submitting.value = false
}
</script>

<style scoped>
.newsletter-form {
  display: flex; flex-direction: column; gap: 12px;
}
.newsletter-form__text h4 {
  font-size: 16px; font-weight: 700; margin: 0 0 4px;
  display: flex; align-items: center; gap: 8px;
  color: var(--sf-text-primary);
}
.newsletter-form__text p {
  font-size: 13px; color: var(--sf-text-muted); margin: 0;
}
.newsletter-form__row {
  display: flex; gap: 8px;
}
.newsletter-form__input {
  flex: 1; padding: 10px 14px;
  border: 1px solid var(--sf-border); border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card); color: var(--sf-text-primary);
  font-size: 14px; transition: border-color var(--sf-transition);
}
.newsletter-form__input:focus {
  outline: none; border-color: var(--sf-accent);
}
.newsletter-form__btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border: none; border-radius: var(--sf-radius-md);
  background: var(--sf-accent); color: #fff; font-weight: 600;
  font-size: 13px; cursor: pointer; white-space: nowrap;
  transition: all var(--sf-transition);
}
.newsletter-form__btn:hover { opacity: 0.9; }
.newsletter-form__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.newsletter-form__error {
  font-size: 12px; color: #ef4444; margin: 0;
}
.newsletter-form--success {
  display: flex; align-items: center; gap: 12px; color: var(--sf-accent);
}
.newsletter-form--success p {
  font-size: 14px; margin: 0; color: var(--sf-text-secondary);
}

@media (max-width: 640px) {
  .newsletter-form__row { flex-direction: column; }
}
</style>
