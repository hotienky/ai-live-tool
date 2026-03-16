<template>
  <section class="section-newsletter container">
    <div class="newsletter-card">
      <Mail :size="32" class="newsletter-icon" />
      <h2>{{ params?.title || 'Đăng ký nhận tin' }}</h2>
      <p>Nhận thông tin khuyến mãi và sản phẩm mới nhất</p>
      <form class="newsletter-form" @submit.prevent="onSubmit">
        <input v-model="email" type="email" placeholder="Email của bạn..." required />
        <button type="submit" :disabled="submitted">
          {{ submitted ? 'Đã đăng ký!' : 'Đăng ký' }}
        </button>
      </form>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { Mail } from 'lucide-vue-next'

defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const email = ref('')
const submitted = ref(false)

function onSubmit() {
  // Placeholder — actual API integration can be added
  submitted.value = true
  setTimeout(() => { submitted.value = false; email.value = '' }, 3000)
}
</script>

<style scoped>
.section-newsletter { padding-top: 40px; }
.newsletter-card {
  max-width: 600px; margin: 0 auto; text-align: center;
  padding: 48px 32px; border-radius: var(--sf-radius-lg);
  background: linear-gradient(135deg, var(--sf-bg-card) 0%, var(--sf-bg-secondary) 100%);
  border: 1px solid var(--sf-border);
}
.newsletter-icon { color: var(--sf-accent-light); margin-bottom: 16px; }
.newsletter-card h2 { font-size: 20px; font-weight: 800; margin: 0 0 8px; }
.newsletter-card p { font-size: 14px; color: var(--sf-text-secondary); margin: 0 0 24px; }
.newsletter-form { display: flex; gap: 8px; max-width: 400px; margin: 0 auto; }
.newsletter-form input {
  flex: 1; padding: 12px 16px; border-radius: 100px;
  border: 1px solid var(--sf-border); background: var(--sf-input-bg);
  color: var(--sf-text-primary); font-size: 14px;
}
.newsletter-form input:focus { outline: none; border-color: var(--sf-accent); }
.newsletter-form button {
  padding: 12px 24px; border-radius: 100px; border: none;
  background: var(--sf-accent-gradient); color: #fff;
  font-weight: 700; font-size: 14px; cursor: pointer; white-space: nowrap;
  transition: all 0.2s;
}
.newsletter-form button:hover { transform: scale(1.02); }
.newsletter-form button:disabled { opacity: 0.6; }
@media (max-width: 480px) { .newsletter-form { flex-direction: column; } }
</style>
