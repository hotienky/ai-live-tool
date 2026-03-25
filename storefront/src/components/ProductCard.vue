<template>
  <router-link :to="`/product/${product.slug || product.id}`" class="product-card">
    <div class="product-card__image">
      <img v-if="product.image_url" :src="product.image_url" :alt="product.name" loading="lazy" referrerpolicy="no-referrer" />
      <div v-else class="product-card__placeholder">
        <Package :size="40" />
      </div>
      <span v-if="discountPercent" class="product-card__badge">-{{ discountPercent }}%</span>
      <div class="product-card__overlay">
        <Eye :size="20" />
      </div>
    </div>
    <div class="product-card__body">
      <span class="product-card__cat" v-if="product.category">{{ product.category }}</span>
      <h3 class="product-card__name">{{ product.name }}</h3>
      <div class="product-card__prices">
        <span v-if="isOnSale" class="price price--original">{{ formatPrice(product.price) }}</span>
        <span :class="['price', isOnSale ? 'price--sale' : 'price--current']">
          {{ formatPrice(isOnSale ? product.promotion_price : product.price) }}
        </span>
      </div>
      <div class="product-card__stock" v-if="product.stock !== undefined">
        <span :class="product.stock > 0 ? 'in-stock' : 'out-stock'">
          {{ product.stock > 0 ? (t('storefront.in_stock') || 'Còn hàng') : (t('storefront.out_of_stock') || 'Hết hàng') }}
        </span>
      </div>
      <div class="product-card__meta">
        <span v-if="product.avg_rating" class="product-card__rating">
          <Star :size="12" /> {{ Number(product.avg_rating).toFixed(1) }}
        </span>
        <span v-if="product.sold_count" class="product-card__sold">
          {{ t('storefront.sold') || 'Đã bán' }} {{ formatSoldCount(product.sold_count) }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { Package, Eye, Star } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  product: { type: Object, required: true },
  
})

const isOnSale = computed(() => {
  const p = props.product
  if (!p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

const discountPercent = computed(() => {
  if (!isOnSale.value) return 0
  return Math.round((1 - props.product.promotion_price / props.product.price) * 100)
})

function formatPrice(v) {
  return Number(v || 0).toLocaleString('vi-VN') + t('admin.msg_b5407dfd', 'đ')
}

function formatSoldCount(n) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n
}
</script>

<style scoped>
.product-card {
  display: block;
  border-radius: var(--sf-radius-lg);
  overflow: hidden;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  color: inherit;
}

.product-card:hover {
  transform: translateY(-6px);
  border-color: var(--sf-accent);
  box-shadow: var(--sf-shadow-lg), 0 0 40px var(--sf-accent-glow);
}

.product-card__image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--sf-bg-card-hover);
}

.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.product-card:hover .product-card__image img {
  transform: scale(1.08);
}

.product-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sf-text-muted);
}

.product-card__badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  z-index: 2;
}

.product-card__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sf-accent-glow);
  opacity: 0;
  transition: opacity 0.3s;
  color: #fff;
}

.product-card:hover .product-card__overlay {
  opacity: 1;
}

.product-card__body {
  padding: 14px 16px 16px;
}

.product-card__cat {
  font-size: 11px;
  font-weight: 600;
  color: var(--sf-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-card__name {
  font-size: 14px;
  font-weight: 700;
  margin: 4px 0 8px;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--sf-text-primary);
}

.product-card__prices {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.product-card__stock {
  margin-top: 6px;
  font-size: 11px;
  font-weight: 600;
}

.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }

.product-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  font-size: 11px;
  color: var(--sf-text-muted);
}
.product-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #f59e0b;
  font-weight: 700;
}
.product-card__sold {
  color: var(--sf-text-muted);
  font-weight: 500;
}

@media (max-width: 768px) {
  .product-card { border-radius: 10px; }
  .product-card:hover { transform: none; }
  .product-card__image { aspect-ratio: 1; }
  .product-card__body { padding: 10px 10px 12px; }
  .product-card__cat { font-size: 10px; }
  .product-card__name { font-size: 13px; margin: 3px 0 6px; -webkit-line-clamp: 2; }
  .product-card__prices { gap: 4px; flex-wrap: wrap; }
  .product-card__prices .price--original { font-size: 11px; }
  .product-card__prices .price--sale,
  .product-card__prices .price--current { font-size: 14px; }
  .product-card__stock { font-size: 10px; margin-top: 4px; }
  .product-card__badge { top: 8px; right: 8px; padding: 3px 8px; font-size: 10px; border-radius: 6px; }
}
</style>
