<template>
  <div class="page-container container">
    <div class="page-header">
      <h1 class="page-title">
        <FolderTree :size="28" class="page-title__icon" />
        Danh mục sản phẩm
      </h1>
      <p class="page-subtitle">Khám phá các sản phẩm theo danh mục</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="category-skeleton-grid">
      <div v-for="i in 8" :key="i" class="skeleton category-skeleton-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="categories.length === 0" class="empty-state">
      <Package :size="64" />
      <h2>Chưa có danh mục nào</h2>
      <p>Cửa hàng hiện tại chưa có danh mục sản phẩm nào được hiển thị.</p>
      <router-link to="/products" class="btn btn-primary mt-4">Xem tất cả sản phẩm</router-link>
    </div>

    <!-- Data State -->
    <CategoryGrid v-else :categories="categories" />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { FolderTree, Package } from 'lucide-vue-next'
import CategoryGrid from '../components/CategoryGrid.vue'
import { apiFetch } from '../api.js'

const categories = ref([])
const loading = ref(true)

async function loadCategories() {
  try {
    const res = await apiFetch('/categories')
    categories.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err) {
    console.error('Failed to load categories', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadCategories()
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

.category-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.category-skeleton-card {
  height: 80px;
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
  max-width: 400px;
}

.mt-4 { margin-top: 24px; }
.btn-primary { display: inline-flex; }
</style>
