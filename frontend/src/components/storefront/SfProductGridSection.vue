<template>
  <section class="sf-section" v-if="products.length > 0">
    <h3 class="sf-section__title">
      <ShoppingBag :size="16" /> {{ title }}
      <span class="sf-count" v-if="products.length">({{ products.length }})</span>
    </h3>
    <div class="sf-products" :style="gridStyle">
      <div v-for="p in products" :key="p.id" class="sf-product-card" @click="$emit('viewProduct', p.id)">
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

const props = defineProps({
  products: { type: Array, default: () => [] },
  title: { type: String, default: 'Sản phẩm nổi bật' },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['viewProduct'])

const columns = computed(() => props.config.columns || 4)
const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
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
.sf-section { padding: 24px; }
.sf-section__title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.sf-count { font-size: 14px; font-weight: 500; color: var(--color-text-muted, #6b6b7b); }
.sf-products { display: grid; gap: 16px; }
.sf-product-card {
  border-radius: 14px; overflow: hidden; background: var(--color-bg-card, #1a1a2e);
  border: 1px solid var(--color-border, rgba(255,255,255,0.1)); cursor: pointer; transition: all 0.3s;
}
.sf-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); border-color: var(--color-accent-primary, #7c3aed); }
.sf-product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.sf-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.sf-product-card:hover .sf-product-img { transform: scale(1.05); }
.sf-product-placeholder { color: var(--color-text-muted, #6b6b7b); }
.sf-promo-badge {
  position: absolute; top: 8px; right: 8px; padding: 4px 10px; border-radius: 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 12px; font-weight: 700;
}
.sf-product-info { padding: 12px 14px; }
.sf-product-name { font-size: 14px; font-weight: 600; margin: 0 0 6px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sf-product-prices { display: flex; align-items: center; gap: 8px; }
.sf-price { font-size: 15px; font-weight: 700; color: var(--color-accent-primary, #7c3aed); }
.sf-price--old { text-decoration: line-through; color: var(--color-text-muted, #6b6b7b); font-size: 12px; font-weight: 500; }
.sf-price--promo { color: var(--color-accent-hot, #ef4444); }

/* Tablet */
@media (max-width: 1024px) {
  .sf-products { grid-template-columns: repeat(3, 1fr); gap: 12px; }
}
/* Mobile */
@media (max-width: 768px) {
  .sf-section { padding: 16px; }
  .sf-products { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .sf-product-info { padding: 8px 10px; }
  .sf-product-name { font-size: 13px; }
  .sf-price { font-size: 13px; }
}
</style>
