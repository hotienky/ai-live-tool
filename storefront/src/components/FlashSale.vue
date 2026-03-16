<template>
  <section v-if="sales.length > 0" class="flash-sale">
    <div class="flash-sale__header">
      <div class="flash-sale__title">
        <span class="flash-sale__icon"><Zap :size="24" /></span>
        <h2>Flash Sale</h2>
        <div class="flash-sale__timer" v-if="countdown">
          <span class="timer-block">{{ countdown.hours }}</span>
          <span class="timer-sep">:</span>
          <span class="timer-block">{{ countdown.minutes }}</span>
          <span class="timer-sep">:</span>
          <span class="timer-block">{{ countdown.seconds }}</span>
        </div>
      </div>
      <router-link to="/products?flash=1" class="flash-sale__more">Xem tất cả →</router-link>
    </div>

    <div class="flash-sale__grid">
      <router-link
        v-for="item in displayItems"
        :key="item.id"
        :to="`/product/${item.product_id}`"
        class="flash-item"
      >
        <div class="flash-item__image">
          <img :src="item.image || 'https://placehold.co/300x300/1a1a2e/7c3aed?text=SP'" :alt="item.name" />
          <span class="flash-item__badge">-{{ discountPercent(item) }}%</span>
        </div>
        <div class="flash-item__info">
          <h3 class="flash-item__name">{{ item.name }}</h3>
          <div class="flash-item__prices">
            <span class="flash-item__sale">{{ formatPrice(item.sale_price) }}</span>
            <span class="flash-item__original">{{ formatPrice(item.price) }}</span>
          </div>
          <div class="flash-item__progress" v-if="item.stock_limit">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: soldPercent(item) + '%' }"></div>
            </div>
            <span class="progress-text">Đã bán {{ item.sold_count || 0 }}/{{ item.stock_limit }}</span>
          </div>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Zap } from 'lucide-vue-next'
import { apiFetch } from '../api.js'

const sales = ref([])
const countdown = ref(null)
let timer = null

const displayItems = computed(() => {
  if (sales.value.length === 0) return []
  return sales.value[0].items?.slice(0, 8) || []
})

function discountPercent(item) {
  if (!item.price || item.price <= 0) return 0
  return Math.round((1 - item.sale_price / item.price) * 100)
}

function soldPercent(item) {
  if (!item.stock_limit) return 0
  return Math.min(100, Math.round(((item.sold_count || 0) / item.stock_limit) * 100))
}

function formatPrice(p) {
  return Number(p || 0).toLocaleString('vi-VN') + 'đ'
}

function updateCountdown() {
  if (sales.value.length === 0) return
  const endDate = new Date(sales.value[0].end_date)
  const now = new Date()
  const diff = endDate - now

  if (diff <= 0) {
    countdown.value = null
    return
  }

  const hours = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const minutes = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  countdown.value = { hours, minutes, seconds }
}

onMounted(async () => {
  try {
    sales.value = await apiFetch('/flash-sales')
    updateCountdown()
    timer = setInterval(updateCountdown, 1000)
  } catch {
    sales.value = []
  }
})

onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.flash-sale {
  margin: 40px 0;
  padding: 24px;
  border-radius: var(--sf-radius-lg, 16px);
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.05));
  border: 1px solid rgba(239, 68, 68, 0.15);
}
.flash-sale__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.flash-sale__title {
  display: flex; align-items: center; gap: 10px;
}
.flash-sale__icon { font-size: 24px; color: #f97316; display: flex; }
.flash-sale__title h2 {
  margin: 0; font-size: 22px; font-weight: 800;
  background: linear-gradient(135deg, #ef4444, #f97316);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.flash-sale__timer {
  display: flex; align-items: center; gap: 4px; margin-left: 16px;
}
.timer-block {
  background: #ef4444; color: #fff; font-size: 14px; font-weight: 800;
  padding: 4px 8px; border-radius: 6px; min-width: 32px; text-align: center;
}
.timer-sep { color: #ef4444; font-weight: 800; font-size: 16px; }
.flash-sale__more {
  font-size: 13px; font-weight: 600; color: var(--sf-accent, #7c3aed);
  text-decoration: none;
}
.flash-sale__more:hover { text-decoration: underline; }
.flash-sale__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}
.flash-item {
  background: var(--sf-bg-card, #fff); border: 1px solid var(--sf-border, #e5e7eb);
  border-radius: var(--sf-radius-md, 12px); overflow: hidden;
  text-decoration: none; color: inherit; transition: all 0.2s;
}
.flash-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
}
.flash-item__image {
  position: relative; aspect-ratio: 1; overflow: hidden;
  background: var(--sf-bg-secondary, #f5f5f5);
}
.flash-item__image img { width: 100%; height: 100%; object-fit: cover; }
.flash-item__badge {
  position: absolute; top: 8px; left: 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 11px; font-weight: 800; padding: 3px 8px; border-radius: 20px;
}
.flash-item__info { padding: 12px; }
.flash-item__name {
  margin: 0 0 6px; font-size: 13px; font-weight: 600;
  color: var(--sf-text-primary, #333);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.flash-item__prices { display: flex; align-items: center; gap: 8px; }
.flash-item__sale {
  font-size: 16px; font-weight: 800; color: #ef4444;
}
.flash-item__original {
  font-size: 12px; color: var(--sf-text-muted, #999);
  text-decoration: line-through;
}
.flash-item__progress { margin-top: 8px; }
.progress-bar {
  height: 6px; border-radius: 3px;
  background: rgba(239, 68, 68, 0.15); overflow: hidden;
}
.progress-fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #ef4444, #f97316);
  transition: width 0.3s;
}
.progress-text {
  font-size: 11px; color: var(--sf-text-muted); margin-top: 3px; display: block;
}

@media (max-width: 640px) {
  .flash-sale__grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .flash-sale__timer { margin-left: 8px; }
}
</style>
