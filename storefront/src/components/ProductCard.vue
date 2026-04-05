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
      <button class="product-card__add-btn" @click.prevent.stop="onAddToCart(product)">
        {{ t('storefront.msg_buy') || 'Chọn mua' }}
      </button>
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

const onAddToCart = (p) => {
  window.dispatchEvent(new CustomEvent('cart:add', { detail: p }))
}
</script>

<style scoped>
.product-card {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  color: inherit;
  height: 100%;
}

.product-card:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.product-card__image {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.product-card__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  mix-blend-mode: multiply;
  transition: transform 0.3s ease;
}

.product-card:hover .product-card__image img {
  transform: scale(1.03);
}

.product-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.product-card__badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #ef4444;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  z-index: 2;
}

.product-card__overlay {
  display: none; /* Removed eye on hover */
}

.product-card__body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.product-card__cat {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.product-card__name {
  font-size: 14px;
  font-weight: 500;
  margin: 4px 0 8px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: rgb(43, 43, 43);
  flex-grow: 1;
}

.product-card__prices {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 8px;
}

.price--current, .price--sale {
  color: #1e293b;
  font-weight: 700;
  font-size: 16px;
}

.price--original {
  font-size: 12px;
  color: #94a3b8;
  text-decoration: line-through;
}

.product-card__stock {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
}

.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }

.product-card__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 12px;
}

.product-card__rating {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #f59e0b;
  font-weight: 700;
}
.product-card__sold {
  font-weight: 500;
}

.product-card__add-btn {
  width: 100%;
  margin-top: auto;
  background: transparent;
  color: #1B51A3;
  border: 1px solid #1B51A3;
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.product-card__add-btn::before {
  content: '+';
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
}

.product-card:hover .product-card__add-btn {
  background: rgba(27, 81, 163, 0.05); /* very light blue hover */
}

@media (max-width: 768px) {
  .product-card { border-radius: 8px; }
  .product-card__add-btn { font-size: 12px; padding: 6px 8px; }
  .product-card__image { aspect-ratio: 1; }
  .product-card__body { padding: 8px; }
  .product-card__cat { font-size: 10px; }
  .product-card__name { font-size: 13px; margin: 3px 0 6px; -webkit-line-clamp: 2; }
  .product-card__prices { gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
  .product-card__prices .price--original { font-size: 11px; }
  .product-card__prices .price--sale,
  .product-card__prices .price--current { font-size: 14px; }
  .product-card__badge { top: 6px; left: 6px; padding: 2px 6px; font-size: 10px; border-radius: 4px; }
}
</style>
