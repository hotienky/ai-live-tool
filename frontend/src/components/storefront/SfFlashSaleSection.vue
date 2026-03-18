<template>
  <section class="sf-section sf-flash-sale" v-if="products.length > 0">
    <div class="sf-flash-header">
      <h3 class="sf-section__title"><Zap :size="16" class="flash-icon" /> Flash Sale</h3>
      <div class="sf-flash-timer" v-if="config.showTimer !== false && timeLeft">
        <Clock :size="14" />
        <span>{{ timeLeft }}</span>
      </div>
    </div>
    <div class="sf-products" :style="gridStyle">
      <div v-for="p in products" :key="p.id" class="sf-product-card sf-product-card--flash" @click="$emit('viewProduct', p.id)">
        <div class="sf-product-img-wrap">
          <img v-if="p.image_url || p.image" :src="p.image_url || p.image" :alt="p.name" class="sf-product-img" />
          <Package v-else :size="40" class="sf-product-placeholder" />
          <span class="sf-promo-badge" v-if="p.promotion_price && p.promotion_price < p.price">
            -{{ Math.round((1 - p.promotion_price / p.price) * 100) }}%
          </span>
        </div>
        <div class="sf-product-info">
          <h4 class="sf-product-name">{{ p.name }}</h4>
          <div class="sf-product-prices">
            <span class="sf-price sf-price--old" v-if="p.promotion_price">{{ formatPrice(p.price) }}</span>
            <span class="sf-price sf-price--promo">{{ formatPrice(p.promotion_price || p.price) }}</span>
          </div>
          <div class="sf-flash-progress" v-if="config.showProgress !== false && p.sold != null && p.stock != null">
            <div class="sf-flash-bar">
              <div class="sf-flash-bar__fill" :style="{ width: Math.min(100, (p.sold / (p.sold + p.stock)) * 100) + '%' }"></div>
            </div>
            <span class="sf-flash-sold">Đã bán {{ p.sold || 0 }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Zap, Clock, Package } from 'lucide-vue-next'

const props = defineProps({
  products: { type: Array, default: () => [] },
  endTime: { type: String, default: null },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['viewProduct'])

const columns = computed(() => props.config.columns || 4)
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${columns.value}, 1fr)` }))
const timeLeft = ref('')
let timer = null

function updateTimer() {
  if (!props.endTime) { timeLeft.value = ''; return }
  const diff = new Date(props.endTime).getTime() - Date.now()
  if (diff <= 0) { timeLeft.value = 'Đã kết thúc'; return }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  timeLeft.value = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
}

onMounted(() => { updateTimer(); timer = setInterval(updateTimer, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

function formatPrice(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.sf-section { padding: 24px; }
.sf-section__title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin: 0; }
.sf-flash-sale { background: linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02)); border-radius: 16px; margin: 0 24px; }
.sf-flash-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.flash-icon { color: #ef4444; }
.sf-flash-timer {
  display: flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 8px;
  background: rgba(239,68,68,0.12); color: #ef4444; font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums;
}
.sf-products { display: grid; gap: 16px; }
.sf-product-card {
  border-radius: 14px; overflow: hidden; background: var(--color-bg-card, #1a1a2e);
  border: 1px solid var(--color-border, rgba(255,255,255,0.1)); cursor: pointer; transition: all 0.3s;
}
.sf-product-card--flash { border-color: rgba(239,68,68,0.15); }
.sf-product-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.15); }
.sf-product-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.sf-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.sf-product-card:hover .sf-product-img { transform: scale(1.05); }
.sf-product-placeholder { color: var(--color-text-muted); }
.sf-promo-badge {
  position: absolute; top: 8px; right: 8px; padding: 4px 10px; border-radius: 8px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff; font-size: 12px; font-weight: 700;
}
.sf-product-info { padding: 12px 14px; }
.sf-product-name { font-size: 14px; font-weight: 600; margin: 0 0 6px; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.sf-product-prices { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.sf-price { font-size: 15px; font-weight: 700; }
.sf-price--old { text-decoration: line-through; color: var(--color-text-muted); font-size: 12px; font-weight: 500; }
.sf-price--promo { color: #ef4444; }
.sf-flash-progress { margin-top: 4px; }
.sf-flash-bar { height: 4px; background: rgba(239,68,68,0.15); border-radius: 2px; overflow: hidden; }
.sf-flash-bar__fill { height: 100%; background: linear-gradient(90deg, #ef4444, #f97316); border-radius: 2px; transition: width 0.3s; }
.sf-flash-sold { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; display: block; }

/* Tablet */
@media (max-width: 1024px) {
  .sf-products { grid-template-columns: repeat(3, 1fr); gap: 12px; }
}
/* Mobile */
@media (max-width: 768px) {
  .sf-flash-sale { margin: 0 16px; padding: 16px; }
  .sf-products { grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .sf-flash-header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .sf-product-info { padding: 8px 10px; }
}
</style>
