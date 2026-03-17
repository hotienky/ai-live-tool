<template>
  <div class="page-container container">
    <div class="page-header">
      <h1 class="page-title">
        <Tag :size="28" class="page-title__icon" />
        Khuyến mãi & Ưu đãi
      </h1>
      <p class="page-subtitle">Cập nhật những chương trình khuyến mãi mới nhất</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="promo-skeleton-grid">
      <div v-for="i in 4" :key="i" class="skeleton promo-skeleton-card"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="promotions.length === 0" class="empty-state">
      <Ticket :size="64" />
      <h2>Chưa có khuyến mãi nào</h2>
      <p>Hiện tại không có chương trình khuyến mãi nào đang diễn ra. Vui lòng quay lại sau!</p>
    </div>

    <!-- Data State -->
    <div v-else class="promo-grid">
      <div
        v-for="promo in promotions"
        :key="promo.id"
        class="promo-card"
      >
        <div class="promo-card__header">
          <div class="promo-card__badge" v-if="isActive(promo)">Đang diễn ra</div>
          <div class="promo-card__badge promo-card__badge--upcoming" v-else>Sắp diễn ra</div>
          <h3 class="promo-card__title">{{ promo.name }}</h3>
        </div>
        <div class="promo-card__body">
          <div class="promo-card__time">
            <Clock :size="14" />
            <span>{{ formatDate(promo.start_time) }} - {{ formatDate(promo.end_time) }}</span>
          </div>
          <router-link :to="`/?promo=${promo.id}`" class="btn btn-primary btn-sm mt-3">Mua ngay</router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Tag, Ticket, Clock } from 'lucide-vue-next'
import { apiFetch } from '../api.js'

const promotions = ref([])
const loading = ref(true)

async function loadPromotions() {
  try {
    const res = await apiFetch('/flash-sales/active')
    promotions.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (err) {
    console.error('Failed to load promotions', err)
  } finally {
    loading.value = false
  }
}

function isActive(promo) {
  const now = new Date()
  return new Date(promo.start_time) <= now && new Date(promo.end_time) > now
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

onMounted(() => {
  loadPromotions()
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

.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.promo-card {
  border-radius: var(--sf-radius-lg);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  overflow: hidden;
  transition: all var(--sf-transition);
}

.promo-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sf-shadow-lg);
  border-color: var(--sf-accent);
}

.promo-card__header {
  background: var(--sf-accent-glow);
  padding: 24px 20px;
  border-bottom: 1px solid var(--sf-border);
  position: relative;
}

.promo-card__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  background: var(--sf-error);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: uppercase;
}

.promo-card__badge--upcoming {
  background: var(--sf-warning);
  color: #000;
}

.promo-card__title {
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-text-primary);
  margin: 10px 0 0;
}

.promo-card__body {
  padding: 20px;
}

.promo-card__time {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--sf-text-muted);
}

.mt-3 {
  margin-top: 16px;
}

.btn-sm {
  padding: 8px 16px;
  font-size: 13px;
}

.promo-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 24px;
}

.promo-skeleton-card {
  height: 200px;
  border-radius: var(--sf-radius-lg);
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
