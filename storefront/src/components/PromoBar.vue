<template>
  <transition name="promo-slide">
    <div v-if="visible" class="promo-bar">
      <div class="promo-bar__content container">
        <span class="promo-bar__text">
          <Sparkles :size="14" />
          {{ displayText }}
        </span>
        <router-link v-if="promoLink" :to="promoLink" class="promo-bar__cta">
          {{ displayCta }} →
        </router-link>
        <button class="promo-bar__close" @click="dismiss">
          <X :size="14" />
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Sparkles, X } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import { useModules } from '../composables/useModules.js'

const { t } = useI18n()
const { isEcom } = useModules()
const layoutConfig = inject('layoutConfig', ref(null))
const providedPromoConfig = inject('promoConfig', ref({}))

const props = defineProps({
  text: { type: String, default: '' },
  link: { type: String, default: '' },
  ctaText: { type: String, default: '' },
  storageKey: { type: String, default: 'sf_promo_dismissed' },
})

// Read promo config from App.vue injected Ref -> or Layout Config fallback
const promoConfig = computed(() => {
  return (providedPromoConfig.value && Object.keys(providedPromoConfig.value).length > 0)
    ? providedPromoConfig.value 
    : (layoutConfig?.value?.promoConfig || layoutConfig?.value?.promoBar || {})
})

const hasCustomText = computed(() => !!(promoConfig.value.text || props.text))
const isEnabled = computed(() => {
  if (promoConfig.value.enabled === false) return false
  if (promoConfig.value.enabled === true) return true
  // If no custom text, only show for ecom (default text is ecom-specific)
  if (!hasCustomText.value && !isEcom.value) return false
  return true
})
const displayText = computed(() => promoConfig.value.text || props.text || t('storefront.promo.default_text', '🎉 Miễn phí vận chuyển cho đơn từ 500K — Mua ngay!'))
const displayCta = computed(() => promoConfig.value.ctaText || props.ctaText || t('storefront.promo.shop_now', 'Mua sắm'))
const promoLink = computed(() => promoConfig.value.link || props.link || '/products')

// Make visible fully reactive to enabled state so it toggles ON/OFF physically inside the Builder without requiring F5
const visible = computed(() => {
  if (!isEnabled.value) return false
  const isPreviewMode = !!new URLSearchParams(window.location.search).get('preview')
  const dismissed = sessionStorage.getItem(props.storageKey)
  
  // Show if not dismissed, OR if we are in preview mode (ignore dismiss in preview)
  return (!dismissed || isPreviewMode) && !userDismissed.value
})

const userDismissed = ref(false)

onMounted(() => {})

function dismiss() {
  userDismissed.value = true
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
