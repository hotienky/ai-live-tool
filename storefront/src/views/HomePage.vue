<template>
  <div class="home-page">
    <!-- Hero Banner -->
    <section class="home-hero container">
      <BannerSlider :banners="banners" />
    </section>

    <!-- Categories -->
    <section class="home-section container" v-if="categories.length > 0">
      <h2 class="section-title">
        <Grid :size="22" class="section-title__accent" />
        Danh mục sản phẩm
      </h2>
      <CategoryGrid :categories="categories" />
    </section>
    <!-- Flash Sale -->
    <div class="container">
      <FlashSale />
    </div>

    <!-- Featured Products -->
    <section class="home-section container">
      <div class="home-section__header">
        <h2 class="section-title">
          <Sparkles :size="22" class="section-title__accent" />
          Sản phẩm nổi bật
        </h2>
        <router-link :to="'/products'" class="home-section__viewall">
          Xem tất cả <ArrowRight :size="14" />
        </router-link>
      </div>
      <div v-if="loading" class="product-skeleton-grid">
        <div v-for="i in 8" :key="i" class="product-skeleton">
          <div class="skeleton" style="aspect-ratio:1"></div>
          <div class="skeleton" style="height:14px;width:70%;margin-top:12px"></div>
          <div class="skeleton" style="height:18px;width:40%;margin-top:8px"></div>
        </div>
      </div>
      <div v-else-if="products.length > 0" class="product-grid">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>
      <div v-else class="home-empty">
        <Package :size="48" />
        <p>Chưa có sản phẩm nào</p>
      </div>
    </section>

    <!-- New Arrivals -->
    <section class="home-section container" v-if="newProducts.length > 0">
      <div class="home-section__header">
        <h2 class="section-title">
          <Clock :size="22" class="section-title__accent" />
          Hàng mới về
        </h2>
      </div>
      <div class="product-grid">
        <ProductCard v-for="p in newProducts" :key="p.id" :product="p" />
      </div>
    </section>

    <!-- CMS Pages -->
    <section class="home-section container" v-if="pages.length > 0">
      <h2 class="section-title">
        <BookOpen :size="22" class="section-title__accent" />
        Thông tin
      </h2>
      <div class="home-pages">
        <router-link
          v-for="pg in pages"
          :key="pg.id"
          :to="`/page/${pg.alias || pg.id}`"
          class="home-page-card"
        >
          <img v-if="pg.image" :src="pg.image" :alt="pg.title" class="home-page-card__img" />
          <div v-else class="home-page-card__img home-page-card__img--empty">
            <FileText :size="28" />
          </div>
          <div class="home-page-card__info">
            <h4>{{ pg.title }}</h4>
            <span class="home-page-card__date">{{ formatDate(pg.created_at) }}</span>
          </div>
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../api.js'
import BannerSlider from '../components/BannerSlider.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import ProductCard from '../components/ProductCard.vue'
import FlashSale from '../components/FlashSale.vue'
import { Grid, Sparkles, ArrowRight, Package, Clock, BookOpen, FileText } from 'lucide-vue-next'

const props = defineProps({
  
})

const banners = ref([])
const categories = ref([])
const products = ref([])
const newProducts = ref([])
const pages = ref([])
const loading = ref(true)

async function loadAll() {
  loading.value = true
  try {
    const [bannersRes, catsRes, prodsRes, newRes, pagesRes] = await Promise.allSettled([
      apiFetch('/banners'),
      apiFetch('/categories'),
      apiFetch('/products', { limit: 8, sort: 'created_at', order: 'desc' }),
      apiFetch('/products', { limit: 4, sort: 'created_at', order: 'desc', page: 1 }),
      apiFetch('/pages'),
    ])
    banners.value = bannersRes.status === 'fulfilled' ? bannersRes.value : []
    categories.value = catsRes.status === 'fulfilled' ? catsRes.value : []
    const prodData = prodsRes.status === 'fulfilled' ? prodsRes.value : []
    products.value = prodData.data || prodData
    const newData = newRes.status === 'fulfilled' ? newRes.value : []
    newProducts.value = (newData.data || newData).slice(0, 4)
    pages.value = pagesRes.status === 'fulfilled' ? pagesRes.value : []
  } catch { /* ignore */ }
  loading.value = false
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

onMounted(() => loadAll())
</script>

<style scoped>
.home-page { padding-bottom: 60px; }

.home-hero { padding-top: 24px; padding-bottom: 8px; }

.home-section { padding-top: 40px; }

.home-section__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}

.home-section__header .section-title { margin-bottom: 0; }

.home-section__viewall {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; color: var(--sf-accent-light);
  transition: all 0.2s; text-decoration: none;
}

.home-section__viewall:hover { color: #fff; gap: 10px; }

/* Product grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}

.product-skeleton {
  padding: 16px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
}

/* CMS pages */
.home-pages {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;
}

.home-page-card {
  display: flex; gap: 14px; padding: 16px; border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  transition: all var(--sf-transition); text-decoration: none; color: inherit;
}
.home-page-card:hover { border-color: var(--sf-accent); transform: translateY(-2px); box-shadow: var(--sf-shadow-sm); }

.home-page-card__img { width: 80px; height: 60px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.home-page-card__img--empty {
  display: flex; align-items: center; justify-content: center;
  background: var(--sf-bg-card-hover); color: var(--sf-text-muted);
}

.home-page-card__info h4 { font-size: 14px; font-weight: 700; margin: 0 0 4px; line-height: 1.3; }
.home-page-card__date { font-size: 11px; color: var(--sf-text-muted); }

/* Empty */
.home-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px; color: var(--sf-text-muted); text-align: center;
}
.home-empty p { font-size: 15px; font-weight: 600; }

@media (max-width: 768px) {
  .product-grid, .product-skeleton-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .home-pages { grid-template-columns: 1fr; }
}
</style>
