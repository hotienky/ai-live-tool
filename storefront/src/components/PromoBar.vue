<template>
  <transition name="promo-slide">
    <div v-if="visible" class="promo-bar">
      <div class="promo-bar__content container">
        <span class="promo-bar__text">
          <Sparkles :size="14" />
          {{ text }}
        </span>
        <router-link v-if="link" :to="link" class="promo-bar__cta">
          {{ ctaText }} →
        </router-link>
        <button class="promo-bar__close" @click="dismiss">
          <X :size="14" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Sparkles, X } from 'lucide-vue-next'

const props = defineProps({
  text: { type: String, default: '🎉 Miễn phí vận chuyển cho đơn từ 500K — Mua ngay!' },
  link: { type: String, default: '/products' },
  ctaText: { type: String, default: 'Mua sắm' },
  storageKey: { type: String, default: 'sf_promo_dismissed' },
})

const visible = ref(false)

onMounted(() => {
  const dismissed = sessionStorage.getItem(props.storageKey)
  if (!dismissed) visible.value = true
})

function dismiss() {
  visible.value = false
  sessionStorage.setItem(props.storageKey, '1')
}
</script>

<style scoped>
.promo-bar {
  background: linear-gradient(90deg, var(--sf-accent, #6366f1), #8b5cf6);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  z-index: 101;
  position: relative;
}
.promo-bar__content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
}
.promo-bar__text {
  display: flex;
  align-items: center;
  gap: 6px;
}
.promo-bar__cta {
  color: #fff;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-weight: 700;
  white-space: nowrap;
}
.promo-bar__cta:hover { opacity: 0.85; }
.promo-bar__close {
  display: flex;
  background: none;
  border: none;
  color: rgba(255,255,255,0.7);
  cursor: pointer;
  padding: 2px;
  margin-left: auto;
}
.promo-bar__close:hover { color: #fff; }

.promo-slide-enter-active { animation: slideDown 0.3s ease; }
.promo-slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown {
  from { max-height: 0; opacity: 0; overflow: hidden; }
  to { max-height: 50px; opacity: 1; overflow: hidden; }
}

@media (max-width: 480px) {
  .promo-bar__content { font-size: 12px; gap: 8px; padding: 6px 12px; }
}
</style>
