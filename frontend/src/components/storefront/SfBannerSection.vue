<template>
  <section class="sf-banners" v-if="banners.length > 0">
    <div class="sf-banner-track" :style="{ transform: `translateX(-${currentIdx * 100}%)` }">
      <div v-for="b in banners" :key="b.id" class="sf-banner-slide">
        <a :href="b.url || b.link || '#'" class="sf-banner-link" @click.prevent="b.url || b.link ? null : undefined">
          <img v-if="b.image_url || b.image" :src="b.image_url || b.image" :alt="b.title || ''" class="sf-banner-img" />
          <div class="sf-banner-placeholder" v-else>
            <ImageIcon :size="48" />
            <span>Banner Slide</span>
          </div>
        </a>
        <!-- Text overlay: only if config.showOverlay is true AND b.title exists -->
        <div class="sf-banner-overlay" v-if="config.showOverlay && b.title">
          <h2 class="sf-banner-title">{{ b.title }}</h2>
          <p class="sf-banner-desc" v-if="b.description">{{ b.description }}</p>
          <a v-if="b.url || b.link" :href="b.url || b.link" class="sf-banner-cta">Xem ngay →</a>
        </div>
      </div>
    </div>
    <!-- Dots -->
    <div class="sf-banner-dots" v-if="banners.length > 1">
      <button v-for="(_, i) in banners" :key="i" class="sf-dot" :class="{ active: currentIdx === i }" @click="goTo(i)" />
    </div>
    <!-- Arrows -->
    <button class="sf-banner-arrow sf-banner-arrow--prev" v-if="banners.length > 1" @click="prevSlide"><ChevronLeft :size="20" /></button>
    <button class="sf-banner-arrow sf-banner-arrow--next" v-if="banners.length > 1" @click="nextSlide"><ChevronRight :size="20" /></button>
  </section>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-vue-next'

const props = defineProps({
  banners: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})

const currentIdx = ref(0)
let timer = null

const autoplay = computed(() => props.config.autoplay !== false)
const interval = computed(() => props.config.interval || 5000)

function nextSlide() {
  if (props.banners.length > 1) currentIdx.value = (currentIdx.value + 1) % props.banners.length
}
function prevSlide() {
  if (props.banners.length > 1) currentIdx.value = (currentIdx.value - 1 + props.banners.length) % props.banners.length
}
function goTo(i) {
  currentIdx.value = i
  restartTimer()
}
function restartTimer() {
  if (timer) clearInterval(timer)
  if (autoplay.value && props.banners.length > 1) {
    timer = setInterval(nextSlide, interval.value)
  }
}

onMounted(() => restartTimer())
onUnmounted(() => { if (timer) clearInterval(timer) })
watch(() => props.banners.length, () => { currentIdx.value = 0; restartTimer() })
</script>

<style scoped>
.sf-banners {
  position: relative; overflow: hidden; border-radius: 20px; margin: 24px;
  aspect-ratio: 21/9; background: var(--color-bg-primary, #f1f5f9);
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}
.sf-banner-track {
  display: flex; height: 100%;
  transition: transform 0.65s cubic-bezier(0.25, 1, 0.5, 1);
}
.sf-banner-slide { min-width: 100%; position: relative; }
.sf-banner-link { display: block; width: 100%; height: 100%; }
.sf-banner-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.sf-banner-placeholder {
  width: 100%; height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  background: linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%);
  color: #94a3b8; font-size: 14px; font-weight: 600;
}

/* Text overlay — clean glassmorphic panel, only shows if config.showOverlay */
.sf-banner-overlay {
  position: absolute; bottom: 32px; left: 32px; max-width: 420px; padding: 20px 24px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  animation: bannerOverlayIn 0.5s cubic-bezier(0.25,1,0.5,1) forwards;
}
@keyframes bannerOverlayIn {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
.sf-banner-title {
  font-size: 22px; font-weight: 800; color: #0f172a;
  margin: 0 0 6px; line-height: 1.25; letter-spacing: -0.3px;
}
.sf-banner-desc { font-size: 14px; color: #475569; line-height: 1.5; margin: 0 0 10px; }
.sf-banner-cta {
  display: inline-block; font-size: 13px; font-weight: 700; color: #6366f1;
  text-decoration: none; transition: color 0.2s;
}
.sf-banner-cta:hover { color: #4f46e5; }

/* Dots — slim pill style */
.sf-banner-dots {
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px; z-index: 2;
}
.sf-dot {
  width: 8px; height: 8px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.45); cursor: pointer;
  transition: all 0.35s cubic-bezier(0.25,1,0.5,1);
  box-shadow: 0 1px 4px rgba(0,0,0,0.1);
}
.sf-dot.active { background: #fff; width: 28px; }
.sf-dot:hover:not(.active) { background: rgba(255,255,255,0.7); }

/* Arrows — frosted glass circles */
.sf-banner-arrow {
  position: absolute; top: 50%; transform: translateY(-50%);
  width: 44px; height: 44px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.85); color: #334155;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: all 0.3s;
  backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}
.sf-banners:hover .sf-banner-arrow { opacity: 1; }
.sf-banner-arrow--prev { left: 16px; }
.sf-banner-arrow--next { right: 16px; }
.sf-banner-arrow:hover {
  background: #fff; transform: translateY(-50%) scale(1.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}

@media (max-width: 768px) {
  .sf-banners { margin: 12px; aspect-ratio: 16/9; border-radius: 16px; }
  .sf-banner-overlay { bottom: 12px; left: 12px; right: 12px; max-width: none; padding: 14px 16px; }
  .sf-banner-title { font-size: 18px; }
  .sf-banner-desc { font-size: 13px; }
  .sf-banner-arrow { display: none; }
  .sf-dot { width: 6px; height: 6px; }
  .sf-dot.active { width: 20px; }
}
</style>
