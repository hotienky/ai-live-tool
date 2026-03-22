<template>
  <slot v-if="!error" />
  <div v-else class="error-boundary">
    <div class="error-boundary__card">
      <AlertTriangle :size="48" class="error-boundary__icon" />
      <h3 class="error-boundary__title">{{ title }}</h3>
      <p class="error-boundary__message">{{ error.message || 'Đã xảy ra lỗi không mong muốn' }}</p>
      <button class="error-boundary__btn" @click="reset">
        <RefreshCw :size="14" />
        {{ retryText }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { AlertTriangle, RefreshCw } from 'lucide-vue-next'

defineProps({
  title: { type: String, default: 'Có lỗi xảy ra' },
  retryText: { type: String, default: 'Thử lại' },
})

const error = ref(null)

onErrorCaptured((err) => {
  error.value = err
  console.error('[ErrorBoundary]', err)
  return false // Prevent error from propagating
})

function reset() {
  error.value = null
}

defineExpose({ error, reset })
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px;
}
.error-boundary__card {
  text-align: center;
  padding: 32px;
  border-radius: var(--sf-radius-xl, 16px);
  background: var(--sf-bg-card, #fff);
  border: 1px solid var(--sf-border, #e5e7eb);
  max-width: 400px;
}
.error-boundary__icon {
  color: #ef4444;
  margin-bottom: 16px;
}
.error-boundary__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-text-primary, #111);
  margin: 0 0 8px;
}
.error-boundary__message {
  font-size: 14px;
  color: var(--sf-text-secondary, #666);
  margin: 0 0 20px;
  line-height: 1.5;
}
.error-boundary__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--sf-accent, #6366f1);
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}
.error-boundary__btn:hover { opacity: 0.9; }
</style>
