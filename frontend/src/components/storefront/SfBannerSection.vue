<template>
  <section class="sf-banners" v-if="banners.length > 0">
    <div class="sf-banner-track" :style="{ transform: `translateX(-${currentIdx * 100}%)` }">
      <div v-for="b in banners" :key="b.id" class="sf-banner-slide">
        <img v-if="b.image_url || b.image" :src="b.image_url || b.image" :alt="b.title" class="sf-banner-img" />
        <div class="sf-banner-overlay">
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
  position: relative; overflow: hidden; border-radius: 16px; margin: 20px 24px;
  aspect-ratio: 21/9; background: var(--color-bg-card, #1a1a2e);
}
.sf-banner-track { display: flex; transition: transform 0.6s cubic-bezier(.4,0,.2,1); height: 100%; }
.sf-banner-slide { min-width: 100%; position: relative; }
.sf-banner-img { width: 100%; height: 100%; object-fit: cover; }
.sf-banner-overlay {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 24px 32px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
}
.sf-banner-title { font-size: 24px; font-weight: 800; color: #fff; margin: 0 0 4px; }
.sf-banner-desc { font-size: 14px; color: rgba(255,255,255,0.85); margin: 0; }
.sf-banner-dots { position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%); display: flex; gap: 8px; }
.sf-dot {
  width: 10px; height: 10px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.6);
  background: transparent; cursor: pointer; transition: all 0.2s;
}
.sf-dot.active { background: #fff; border-color: #fff; transform: scale(1.2); }
.sf-banner-arrow {
  position: absolute; top: 50%; transform: translateY(-50%); width: 36px; height: 36px;
  border-radius: 50%; border: none; background: rgba(0,0,0,0.4); color: #fff;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.3s;
}
.sf-banners:hover .sf-banner-arrow { opacity: 1; }
.sf-banner-arrow--prev { left: 12px; }
.sf-banner-arrow--next { right: 12px; }
.sf-banner-arrow:hover { background: rgba(0,0,0,0.6); }

@media (max-width: 768px) {
  .sf-banners { margin: 12px 16px; aspect-ratio: 16/9; }
  .sf-banner-title { font-size: 18px; }
}
</style>
