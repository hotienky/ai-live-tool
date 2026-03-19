<template>
  <div class="wishlist-page container">
    <!-- Header -->
    <div class="wl-header">
      <h1 class="wl-title">
        <Heart :size="24" class="wl-title__icon" />
        {{ t('storefront.wishlist') || 'Sản phẩm yêu thích' }}
        <span class="wl-count" v-if="wishlistItems.length">({{ wishlistItems.length }})</span>
      </h1>
      <button v-if="wishlistItems.length" class="wl-clear-btn" @click="confirmClear">
        <Trash2 :size="14" /> {{ t('storefront.clear_all') || 'Xóa tất cả' }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!wishlistItems.length" class="wl-empty">
      <HeartOff :size="60" class="wl-empty__icon" />
      <h2>{{ t('storefront.empty_wishlist') || 'Chưa có sản phẩm yêu thích' }}</h2>
      <p>{{ t('storefront.empty_wishlist_desc') || 'Nhấn vào biểu tượng ❤️ trên trang sản phẩm để lưu sản phẩm bạn thích vào đây.' }}</p>
      <router-link to="/products" class="btn btn--primary">
        <ShoppingBag :size="16" /> {{ t('storefront.explore_products') || 'Khám phá sản phẩm' }}
      </router-link>
    </div>

    <!-- Product Grid -->
    <div v-else class="wl-grid">
      <div v-for="item in wishlistItems" :key="item.id" class="wl-card">
        <!-- Remove button -->
        <button class="wl-card__remove" @click="removeItem(item.id)" title="Xóa khỏi yêu thích">
          <X :size="14" />
        </button>

        <!-- Image -->
        <router-link :to="item.slug ? `/${item.slug}` : `/products/${item.id}`" class="wl-card__img-wrap">
          <img v-if="item.image" :src="item.image" :alt="item.name" class="wl-card__img" />
          <div v-else class="wl-card__img-placeholder">
            <Package :size="40" />
          </div>
          <!-- sold out badge -->
          <span v-if="item.stock <= 0" class="wl-badge wl-badge--out">{{ t('storefront.out_of_stock') || 'Hết hàng' }}</span>
        </router-link>

        <!-- Info -->
        <div class="wl-card__info">
          <router-link :to="item.slug ? `/${item.slug}` : `/products/${item.id}`" class="wl-card__name">
            {{ item.name }}
          </router-link>

          <div class="wl-card__prices">
            <span v-if="item.promotion_price && item.promotion_price < item.originalPrice"
              class="price price--sale">
              {{ formatPrice(item.promotion_price) }}
            </span>
            <span :class="['price', item.promotion_price && item.promotion_price < item.originalPrice ? 'price--original--sm' : 'price--current']">
              {{ formatPrice(item.price) }}
            </span>
          </div>

          <button
            class="btn btn--primary btn--sm wl-card__add"
            :disabled="item.stock <= 0"
            @click="addToCartFromWishlist(item)"
          >
            <ShoppingCart :size="14" />
            {{ item.stock > 0 ? (t('storefront.add_to_cart') || 'Thêm vào giỏ') : (t('storefront.out_of_stock') || 'Hết hàng') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Heart, HeartOff, Trash2, X, Package, ShoppingBag, ShoppingCart } from 'lucide-vue-next'
import { useWishlist } from '../composables/useWishlist.js'
import { useCart } from '../composables/useCart.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist()
const { addToCart } = useCart()
const { showToast } = useToast()

function formatPrice(val) {
  if (!val && val !== 0) return ''
  return Number(val).toLocaleString('vi-VN') + 'đ'
}

function removeItem(productId) {
  removeFromWishlist(productId)
}

function confirmClear() {
  if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm yêu thích?')) {
    clearWishlist()
  }
}

function addToCartFromWishlist(item) {
  addToCart({
    id: item.id,
    name: item.name,
    price: item.price,
    image_url: item.image,
    slug: item.slug,
  }, 1)
  showToast(` ✓ Đã thêm "${item.name}" vào giỏ hàng`, 'success')
}
</script>

<style scoped>
.wishlist-page { padding: 32px 0 80px; min-height: 60vh; }

.wl-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 32px; flex-wrap: wrap; gap: 12px;
}
.wl-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 800; margin: 0;
}
.wl-title__icon { color: var(--sf-accent); }
.wl-count { font-size: 16px; color: var(--color-text-muted); font-weight: 400; }

.wl-clear-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px;
  border: 1px solid rgba(239,68,68,0.3); background: transparent;
  color: #ef4444; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.wl-clear-btn:hover { background: rgba(239,68,68,0.08); border-color: #ef4444; }

/* Empty */
.wl-empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 16px; padding: 80px 20px; text-align: center;
}
.wl-empty__icon { color: var(--color-text-muted); opacity: 0.4; }
.wl-empty h2 { font-size: 20px; font-weight: 700; margin: 0; }
.wl-empty p { color: var(--color-text-muted); max-width: 360px; font-size: 14px; margin: 0; }

/* Grid */
.wl-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

/* Card */
.wl-card {
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.08));
  border-radius: 16px; overflow: hidden; position: relative;
  transition: all 0.25s; display: flex; flex-direction: column;
}
.wl-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(0,0,0,0.1); }

.wl-card__remove {
  position: absolute; top: 10px; right: 10px; z-index: 2;
  width: 28px; height: 28px; border-radius: 50%;
  background: rgba(0,0,0,0.4); border: none; color: #fff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s; opacity: 0;
}
.wl-card:hover .wl-card__remove { opacity: 1; }
.wl-card__remove:hover { background: #ef4444; }

.wl-card__img-wrap {
  display: block; aspect-ratio: 1; overflow: hidden; background: var(--color-bg-secondary, #f5f6fa);
  position: relative;
}
.wl-card__img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.4s; }
.wl-card:hover .wl-card__img { transform: scale(1.05); }
.wl-card__img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}
.wl-badge {
  position: absolute; top: 10px; left: 10px; padding: 4px 8px;
  border-radius: 6px; font-size: 11px; font-weight: 700;
}
.wl-badge--out { background: rgba(239,68,68,0.1); color: #ef4444; }

.wl-card__info { padding: 14px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.wl-card__name {
  font-weight: 600; font-size: 14px; color: inherit; text-decoration: none;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  line-height: 1.4;
}
.wl-card__name:hover { color: var(--sf-accent); }

.wl-card__prices { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.price--original--sm {
  font-size: 12px; color: var(--color-text-muted); text-decoration: line-through;
}
.price--current { font-size: 16px; font-weight: 700; color: var(--sf-accent); }
.price--sale { font-size: 16px; font-weight: 700; color: #ef4444; }

.wl-card__add {
  margin-top: auto; width: 100%;
  justify-content: center;
}

.btn--sm { padding: 8px 14px; font-size: 13px; }

@media (max-width: 640px) {
  .wl-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
}
</style>
