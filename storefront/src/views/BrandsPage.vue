<template>
  <div class="page-container container">
    <div class="page-header">
      <h1 class="page-title">
        <Award :size="28" class="page-title__icon" />
        Thương hiệu
      </h1>
      <p class="page-subtitle">Khám phá sản phẩm từ các thương hiệu nổi tiếng</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="brands-skeleton-grid">
      <div v-for="i in 10" :key="i" class="skeleton brand-skeleton-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="brands.length === 0" class="empty-state">
      <Award :size="64" />
      <h2>Chưa có thương hiệu nào</h2>
      <p>Cửa hàng hiện tại chưa cấu hình thương hiệu nào.</p>
    </div>

    <!-- Data State -->
    <div v-else class="brands-grid">
      <router-link
        v-for="brand in brands"
        :key="brand.id"
        :to="`/products?brand=${brand.id}`"
        class="brand-card"
      >
        <div class="brand-card__logo-wrapper">
          <img v-if="brand.logo" :src="brand.logo" :alt="brand.name" class="brand-card__logo" />
          <span v-else class="brand-card__placeholder">{{ brand.name }}</span>
        </div>
        <div class="brand-card__info">
          <span class="brand-card__name">{{ brand.name }}</span>
          <ArrowRight :size="14" class="brand-card__arrow" />
        </div>
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Award, ArrowRight } from 'lucide-vue-next'
import { apiFetch } from '../api.js'

const brands = ref([])
const loading = ref(true)

async function loadBrands() {
  try {
    const res = await apiFetch('/brands')
    brands.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err) {
    console.error('Failed to load brands', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadBrands()
})
</script>

<style scoped>
.page-container {
  padding-top: var(--sf-header-height, 70px);
  padding-bottom: 60px;
  min-height: 80vh;
}

.page-header {
  margin: 40px 0 30px;
  text-align: center;
}

.page-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: 28px;
  margin: 0 0 10px;
  color: var(--sf-text-primary);
}

.page-title__icon {
  color: var(--sf-accent);
}

.page-subtitle {
  color: var(--sf-text-secondary);
  font-size: 15px;
  margin: 0;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.brand-card {
  display: flex;
  flex-direction: column;
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
  text-decoration: none;
  overflow: hidden;
  color: inherit;
}

.brand-card:hover {
  border-color: var(--sf-accent);
  transform: translateY(-4px);
  box-shadow: var(--sf-shadow-md);
}

.brand-card__logo-wrapper {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--sf-bg-surface);
  border-bottom: 1px solid var(--sf-border);
}

.brand-card__logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: grayscale(0.5);
  transition: filter 0.3s;
}

.brand-card:hover .brand-card__logo {
  filter: none;
}

.brand-card__placeholder {
  font-size: 20px;
  font-weight: 700;
  color: var(--sf-text-muted);
}

.brand-card__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
}

.brand-card__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text-primary);
}

.brand-card__arrow {
  color: var(--sf-text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.2s;
}

.brand-card:hover .brand-card__arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--sf-accent-light);
}

.brands-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
}

.brand-skeleton-card {
  height: 175px;
  border-radius: var(--sf-radius-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  color: var(--sf-text-muted);
}

.empty-state h2 {
  font-size: 20px;
  margin: 16px 0 8px;
  color: var(--sf-text-primary);
}

.empty-state p {
  margin: 0;
}
</style>
