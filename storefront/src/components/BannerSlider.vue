<template>
  <section class="banner-slider" v-if="banners.length > 0">
    <div class="banner-slider__track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
      <div v-for="(b, i) in banners" :key="b.id || i" class="banner-slider__slide">
        <img v-if="b.image" :src="b.image" :alt="b.title" class="banner-slider__img" referrerpolicy="no-referrer" />
        <div class="banner-slider__gradient"></div>
        <div class="banner-slider__content">
          <h2 class="banner-slider__title">{{ b.title }}</h2>
          <p v-if="b.description" class="banner-slider__desc">{{ b.description }}</p>
          <router-link v-if="b.url" :to="b.url" class="btn btn--primary banner-slider__cta">
            {{ t('storefront.view_now') || 'Xem ngay' }} <ArrowRight :size="16" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Dots -->
    <div class="banner-slider__dots" v-if="banners.length > 1">
      <button
        v-for="(_, i) in banners"
        :key="i"
        class="banner-slider__dot"
        :class="{ active: activeIndex === i }"
        @click="goTo(i)"
      />
    </div>

    <!-- Arrows -->
    <button v-if="banners.length > 1" class="banner-slider__arrow banner-slider__arrow--prev" @click="prev">
      <ChevronLeft :size="20" />
    </button>
    <button v-if="banners.length > 1" class="banner-slider__arrow banner-slider__arrow--next" @click="next">
      <ChevronRight :size="20" />
    </button>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  banners: { type: Array, default: () => [] },
  autoplay: { type: Boolean, default: true },
  interval: { type: Number, default: 5000 },
})

const activeIndex = ref(0)
let timer = null

function next() {
  activeIndex.value = (activeIndex.value + 1) % props.banners.length
}

function prev() {
  activeIndex.value = (activeIndex.value - 1 + props.banners.length) % props.banners.length
}

function goTo(i) {
  activeIndex.value = i
}

function startAuto() {
  timer = setInterval(next, props.interval)
}

function stopAuto() {
  if (timer) clearInterval(timer)
}

onMounted(() => { if (props.banners.length > 1 && props.autoplay) startAuto() })
onBeforeUnmount(() => stopAuto())
</script>

<style scoped>
.banner-slider {
  position: relative;
  overflow: hidden;
  border-radius: var(--sf-radius-xl);
  aspect-ratio: 21/8;
  background: var(--sf-bg-card);
}

.banner-slider__track {
  display: flex;
  height: 100%;
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
}

.banner-slider__slide {
  min-width: 100%;
  position: relative;
}

.banner-slider__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner-slider__gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(10, 10, 15, 0.8) 0%, rgba(10, 10, 15, 0.2) 60%, transparent 100%);
}

.banner-slider__content {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 48px;
  max-width: 560px;
}

.banner-slider__title {
  font-size: 36px;
  font-weight: 900;
  line-height: 1.15;
  color: #fff;
  margin-bottom: 8px;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
}

.banner-slider__desc {
  font-size: 15px;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 20px;
  line-height: 1.5;
}

.banner-slider__cta {
  text-decoration: none;
}

.banner-slider__dots {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
}

.banner-slider__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  background: transparent;
  cursor: pointer;
  transition: all 0.3s;
}

.banner-slider__dot.active {
  background: #fff;
  border-color: #fff;
  transform: scale(1.3);
}

.banner-slider__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  opacity: 0;
  transition: all 0.3s;
}

.banner-slider:hover .banner-slider__arrow { opacity: 1; }
.banner-slider__arrow:hover { background: var(--sf-accent-glow); border-color: var(--sf-accent-light); }
.banner-slider__arrow--prev { left: 16px; }
.banner-slider__arrow--next { right: 16px; }

@media (max-width: 768px) {
  .banner-slider { aspect-ratio: 16/9; border-radius: var(--sf-radius-md); }
  .banner-slider__content { padding: 24px; }
  .banner-slider__title { font-size: 22px; }
  .banner-slider__desc { font-size: 13px; }
}
</style>
