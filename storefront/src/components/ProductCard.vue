<template>
  <router-link :to="`/${storeId}/product/${product.id}`" class="product-card">
    <div class="product-card__image">
      <img v-if="product.image" :src="product.image" :alt="product.name" loading="lazy" />
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
          {{ product.stock > 0 ? 'Còn hàng' : 'Hết hàng' }}
        </span>
      </div>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { Package, Eye } from 'lucide-vue-next'

const props = defineProps({
  product: { type: Object, required: true },
  storeId: { type: [String, Number], required: true },
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
  return Number(v || 0).toLocaleString('vi-VN') + 'đ'
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
  box-shadow: var(--sf-shadow-lg), 0 0 40px rgba(124, 58, 237, 0.08);
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
  background: rgba(124, 58, 237, 0.25);
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
</style>
