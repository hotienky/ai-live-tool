<template>
  <section class="sf-banners" v-if="banners.length > 0">
    <div class="sf-banner-track" :style="{ transform: `translateX(-${currentIdx * 100}%)` }">
      <div v-for="b in banners" :key="b.id" class="sf-banner-slide">
        <img v-if="b.image_url || b.image" :src="b.image_url || b.image" :alt="b.title" class="sf-banner-img" />
        <div class="sf-banner-overlay" v-if="b.title && b.title.trim() !== 'Cùng nàng trên mọi hành trình'">
          <h2 class="sf-banner-title">{{ b.title }}</h2>
          <p class="sf-banner-desc" v-if="b.description">{{ b.description }}</p>
        </div>
      </div>
    </div>
    <div class="sf-banner-dots" v-if="banners.length > 1">
      <button v-for="(_, i) in banners" :key="i" class="sf-dot" :class="{ active: currentIdx === i }" @click="currentIdx = i" />
    </div>
    <button class="sf-banner-arrow sf-banner-arrow--prev" v-if="banners.length > 1" @click="prevSlide"><ChevronLeft :size="20" /></button>
    <button class="sf-banner-arrow sf-banner-arrow--next" v-if="banners.length > 1" @click="nextSlide"><ChevronRight :size="20" /></button>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  banners: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})

const currentIdx = ref(0)
let timer = null

const autoplay = props.config.autoplay !== false
const interval = props.config.interval || 5000

function nextSlide() {
  if (props.banners.length > 1) currentIdx.value = (currentIdx.value + 1) % props.banners.length
}
function prevSlide() {
  if (props.banners.length > 1) currentIdx.value = (currentIdx.value - 1 + props.banners.length) % props.banners.length
}

onMounted(() => {
  if (autoplay && props.banners.length > 1) {
    timer = setInterval(nextSlide, interval)
  }
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.sf-banners {
  position: relative; overflow: hidden; border-radius: 20px; margin: 24px;
  aspect-ratio: 21/9; background: var(--color-bg-primary, #f8fafc);
  box-shadow: 0 8px 32px rgba(0,0,0,0.06);
}
.sf-banner-track { display: flex; transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1); height: 100%; }
.sf-banner-slide { min-width: 100%; position: relative; }
.sf-banner-img { width: 100%; height: 100%; object-fit: cover; }

/* Enhanced Glassmorphic Overlay */
.sf-banner-overlay {
  position: absolute; bottom: 32px; left: 32px; max-width: 45%; padding: 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.4);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
  animation: slideUp 0.6s cubic-bezier(0.25,1,0.5,1) forwards;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.sf-banner-title { 
  font-size: 26px; font-weight: 800; 
  color: var(--color-text-primary, #0f172a); 
  margin: 0 0 8px; line-height: 1.2;
  letter-spacing: -0.5px;
}
.sf-banner-desc { font-size: 15px; color: var(--color-text-secondary, #475569); line-height: 1.5; margin: 0; }

.sf-banner-dots { position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.sf-dot {
  width: 8px; height: 8px; border-radius: 12px; border: none;
  background: rgba(255,255,255,0.4); cursor: pointer; transition: all 0.3s cubic-bezier(0.25,1,0.5,1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}
.sf-dot.active { background: #fff; width: 24px; }

.sf-banner-arrow {
  position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 44px;
  border-radius: 50%; border: none; background: rgba(255,255,255,0.8); color: #334155;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all 0.3s; backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.sf-banners:hover .sf-banner-arrow { opacity: 1; }
.sf-banner-arrow--prev { left: 20px; }
.sf-banner-arrow--next { right: 20px; }
.sf-banner-arrow:hover { background: #fff; transform: translateY(-50%) scale(1.05); color: #0f172a; }

@media (max-width: 768px) {
  .sf-banners { margin: 16px; aspect-ratio: 16/9; border-radius: 16px; }
  .sf-banner-overlay { bottom: 16px; left: 16px; right: 16px; max-width: none; padding: 16px; }
  .sf-banner-title { font-size: 20px; }
  .sf-banner-desc { font-size: 13px; }
  .sf-banner-arrow { display: none; }
}
</style>
