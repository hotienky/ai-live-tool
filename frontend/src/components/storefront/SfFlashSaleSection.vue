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
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  products: { type: Array, default: () => [] },
  endTime: { type: String, default: null },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['viewProduct'])

const columns = computed(() => props.config.columns || 4)
const gridStyle = computed(() => ({ '--col-count': columns.value }))
const timeLeft = ref('')
let timer = null

function updateTimer() {
  if (!props.endTime) { timeLeft.value = ''; return }
  const diff = new Date(props.endTime).getTime() - Date.now()
  if (diff <= 0) { timeLeft.value = t('admin.msg_77dc6737', 'Đã kết thúc'); return }
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
.sf-flash-sale {
  padding: 32px 24px;
  background: linear-gradient(135deg, rgba(239,68,68,0.04), rgba(249,115,22,0.03));
  border-radius: 20px;
  margin: 0 24px;
  border: 1px solid rgba(239,68,68,0.08);
}
.sf-section__title {
  display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800;
  margin: 0; color: var(--color-text-primary, #1e293b); letter-spacing: -0.5px;
}
.flash-icon {
  color: #fff;
  background: linear-gradient(135deg, #ef4444, #f97316);
  padding: 6px; border-radius: 8px; width: 32px; height: 32px;
}
.sf-flash-header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}
.sf-flash-timer {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 12px;
  background: rgba(239,68,68,0.1); color: #ef4444; font-size: 16px; font-weight: 800;
  font-variant-numeric: tabular-nums; letter-spacing: 1px;
}

.sf-products { display: grid; gap: 20px; grid-template-columns: repeat(var(--col-count, 4), 1fr); }
.sf-product-card {
  border-radius: 16px; overflow: hidden; background: var(--color-bg-card, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0); cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column;
}
.sf-product-card--flash { border-color: rgba(239,68,68,0.12); }
.sf-product-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 20px 40px rgba(239,68,68,0.08);
  border-color: rgba(239,68,68,0.3);
}
.sf-product-img-wrap {
  position: relative; aspect-ratio: 1; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-primary, #f8fafc);
}
.sf-product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
.sf-product-card:hover .sf-product-img { transform: scale(1.08); }
.sf-product-placeholder { color: var(--color-text-muted, #94a3b8); }
.sf-promo-badge {
  position: absolute; top: 12px; right: 12px; padding: 6px 12px; border-radius: 10px;
  background: rgba(239, 68, 68, 0.9); color: #fff; font-size: 12px; font-weight: 800;
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}
.sf-product-info { padding: 16px; display: flex; flex-direction: column; flex-grow: 1; }
.sf-product-name {
  font-size: 15px; font-weight: 600; margin: 0 0 10px; line-height: 1.4;
  color: var(--color-text-primary, #334155);
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sf-product-prices { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; }
.sf-price { font-size: 18px; font-weight: 800; }
.sf-price--old { text-decoration: line-through; color: var(--color-text-muted, #94a3b8); font-size: 13px; font-weight: 500; }
.sf-price--promo { color: #ef4444; }

.sf-flash-progress { margin-top: 4px; }
.sf-flash-bar { height: 6px; background: rgba(239,68,68,0.1); border-radius: 3px; overflow: hidden; }
.sf-flash-bar__fill {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #ef4444, #f97316);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.sf-flash-sold { font-size: 12px; color: var(--color-text-muted, #94a3b8); margin-top: 4px; display: block; }

/* Tablet */
@media (max-width: 1024px) {
  .sf-products { grid-template-columns: repeat(3, 1fr); gap: 16px; }
}
/* Mobile */
@media (max-width: 768px) {
  .sf-flash-sale { margin: 0 16px; padding: 24px 16px; border-radius: 16px; }
  .sf-section__title { font-size: 18px; }
  .sf-products { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .sf-flash-header { flex-direction: column; align-items: flex-start; gap: 10px; }
  .sf-product-info { padding: 12px; }
}
</style>
