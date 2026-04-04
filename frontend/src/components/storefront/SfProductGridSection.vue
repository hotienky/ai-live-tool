<template>
  <section class="sf-section" v-if="products.length > 0">
    <h3 class="sf-section__title">
      <ShoppingBag :size="16" /> {{ title }}
      <span class="sf-count" v-if="visibleProducts.length">({{ visibleProducts.length }})</span>
    </h3>
    <div class="sf-products" :style="gridStyle">
      <div v-for="p in visibleProducts" :key="p.id" class="sf-product-card" @click="$emit('viewProduct', p.id)">
        <div class="sf-product-img-wrap">
          <img v-if="p.image_url || p.image" :src="p.image_url || p.image" :alt="p.name" class="sf-product-img" />
          <Package v-else :size="40" class="sf-product-placeholder" />
          <span class="sf-promo-badge" v-if="isOnPromotion(p)">
            -{{ Math.round((1 - p.promotion_price / p.price) * 100) }}%
          </span>
        </div>
        <div class="sf-product-info">
          <h4 class="sf-product-name">{{ p.name }}</h4>
          <div class="sf-product-prices">
            <span class="sf-price" :class="{ 'sf-price--old': isOnPromotion(p) }">{{ formatPrice(p.price) }}</span>
            <span class="sf-price sf-price--promo" v-if="isOnPromotion(p)">{{ formatPrice(p.promotion_price) }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { ShoppingBag, Package } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { useResponsiveConfig } from '../../composables/useResponsiveConfig.js'

const { t } = useI18n()

const props = defineProps({
  products: { type: Array, default: () => [] },
  title: { type: String, default: 'Sản phẩm nổi bật' },
  config: { type: Object, default: () => ({}) },
  tabletConfig: { type: Object, default: () => ({}) },
  mobileConfig: { type: Object, default: () => ({}) },
})
defineEmits(['viewProduct'])

const { responsiveConfig } = useResponsiveConfig(props)

const visibleProducts = computed(() => {
  const limit = responsiveConfig.value.count || 8
  return props.products.slice(0, limit)
})

const gridStyle = computed(() => ({
  '--col-desktop': props.config?.columns || 4,
  '--col-tablet': props.tabletConfig?.columns || props.config?.columns || 3,
  '--col-mobile': props.mobileConfig?.columns || props.tabletConfig?.columns || props.config?.columns || 2,
}))

function isOnPromotion(p) {
  if (!p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
}
function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.sf-section { padding: 32px 24px; }
.sf-section__title { 
  display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; 
  margin: 0 0 24px; color: var(--color-text-primary, #1e293b);
  letter-spacing: -0.5px;
}
.sf-section__title svg {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-bg-card-hover, #e0e7ff);
  padding: 6px; border-radius: 8px; width: 32px; height: 32px;
}
.sf-count { 
  font-size: 14px; font-weight: 600; color: var(--color-text-muted, #94a3b8);
  background: var(--color-bg-primary, #f1f5f9); padding: 4px 10px; border-radius: 20px;
}

.sf-products { display: grid; gap: 20px; grid-template-columns: repeat(var(--col-desktop, 4), 1fr); }
.sf-product-card {
  border-radius: 16px; overflow: hidden; background: var(--color-bg-card, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0); cursor: pointer; 
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column;
}
.sf-product-card:hover { 
  transform: translateY(-6px); 
  box-shadow: 0 20px 40px rgba(0,0,0,0.06); 
  border-color: var(--color-accent-primary, #6366f1); 
}

.sf-product-img-wrap { 
  position: relative; aspect-ratio: 1; overflow: hidden; 
  display: flex; align-items: center; justify-content: center; 
  background: var(--color-bg-primary, #f8fafc);
}
.sf-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.sf-product-card:hover .sf-product-img { transform: scale(1.08); }
.sf-product-placeholder { color: var(--color-text-muted, #94a3b8); }

.sf-promo-badge {
  position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 10px;
  background: rgba(239, 68, 68, 0.9); color: #fff; font-size: 12px; font-weight: 800;
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.sf-product-info { padding: 16px; display: flex; flex-direction: column; flex-grow: 1; }
.sf-product-name { 
  font-size: 15px; font-weight: 600; margin: 0 0 10px; line-height: 1.4; 
  color: var(--color-text-primary, #334155);
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; 
}
.sf-product-prices { display: flex; align-items: baseline; gap: 8px; margin-top: auto; }
.sf-price { font-size: 18px; font-weight: 800; color: var(--color-accent-primary, #6366f1); }
.sf-price--old { text-decoration: line-through; color: var(--color-text-muted, #94a3b8); font-size: 13px; font-weight: 500; }
.sf-price--promo { color: var(--color-accent-hot, #ef4444); }

/* Tablet */
@container sf (max-width: 1024px) {
  .sf-products { grid-template-columns: repeat(var(--col-tablet, 3), 1fr); gap: 16px; }
}
/* Mobile */
@container sf (max-width: 768px) {
  .sf-section { padding: 24px 16px; }
  .sf-section__title { font-size: 18px; }
  .sf-products { grid-template-columns: repeat(var(--col-mobile, 2), 1fr); gap: 12px; }
  .sf-product-info { padding: 12px; }
  .sf-product-name { font-size: 13px; }
  .sf-price { font-size: 15px; }
}
</style>
