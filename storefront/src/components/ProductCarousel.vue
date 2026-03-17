<template>
  <div
    class="pc-wrapper"
    :style="{
      '--pc-cols-desktop': props.columns,
      '--pc-cols-mobile': props.slidesPerView,
    }"
    @mouseenter="stopAutoplay"
    @mouseleave="startAutoplay"
  >
    <!-- Prev / Next arrows -->
    <button class="pc-arrow pc-arrow--prev" @click="scrollBy(-1)" :disabled="!canScrollLeft" aria-label="Trước">
      <ChevronLeft :size="20" />
    </button>
    <button class="pc-arrow pc-arrow--next" @click="scrollBy(1)" :disabled="!canScrollRight" aria-label="Sau">
      <ChevronRight :size="20" />
    </button>

    <!-- Carousel track -->
    <div class="pc-track" ref="trackRef" @scroll.passive="onScroll">
      <div v-for="product in products" :key="product.id" class="pc-slide">
        <ProductCard :product="product" />
      </div>
    </div>

    <!-- Dots -->
    <div class="pc-dots" v-if="totalPages > 1">
      <button
        v-for="i in totalPages"
        :key="i"
        class="pc-dot"
        :class="{ active: currentPage === i - 1 }"
        @click="goToPage(i - 1)"
        :aria-label="`Trang ${i}`"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import ProductCard from './ProductCard.vue'

const props = defineProps({
  products:      { type: Array,   default: () => [] },
  columns:       { type: Number,  default: 4  },  // desktop columns
  slidesPerView: { type: Number,  default: 2  },  // mobile slides
  autoplay:      { type: Boolean, default: true },
  autoplaySpeed: { type: Number,  default: 4000 },
})

const trackRef     = ref(null)
const canScrollLeft  = ref(false)
const canScrollRight = ref(true)
const currentPage  = ref(0)

// Figure out currently visible slides count based on track width
function visibleSlides() {
  const track = trackRef.value
  if (!track) return props.columns
  const slide = track.querySelector('.pc-slide')
  if (!slide) return props.columns
  return Math.round(track.clientWidth / slide.offsetWidth)
}

const totalPages = computed(() =>
  Math.ceil(props.products.length / Math.max(1, props.slidesPerView))
)

function slideWidth() {
  const track = trackRef.value
  if (!track) return 0
  const slide = track.querySelector('.pc-slide')
  if (!slide) return 0
  return slide.offsetWidth + 12 // + gap
}

function scrollBy(dir) {
  const track = trackRef.value
  if (!track) return
  const step = slideWidth() * visibleSlides()
  track.scrollBy({ left: dir * step, behavior: 'smooth' })
}

function goToPage(page) {
  const track = trackRef.value
  if (!track) return
  const step = slideWidth() * visibleSlides()
  track.scrollTo({ left: page * step, behavior: 'smooth' })
}

function onScroll() {
  const track = trackRef.value
  if (!track) return
  canScrollLeft.value  = track.scrollLeft > 4
  canScrollRight.value = track.scrollLeft < track.scrollWidth - track.clientWidth - 4
  const step = slideWidth() * visibleSlides()
  currentPage.value = Math.round(track.scrollLeft / (step || 1))
}

let timer = null
function startAutoplay() {
  clearInterval(timer)
  if (!props.autoplay || props.products.length <= visibleSlides()) return
  timer = setInterval(() => {
    const track = trackRef.value
    if (!track) return
    const atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4
    track.scrollBy({ left: atEnd ? -track.scrollWidth : slideWidth() * visibleSlides(), behavior: 'smooth' })
  }, props.autoplaySpeed)
}
function stopAutoplay() { clearInterval(timer) }

onMounted(() => { onScroll(); startAutoplay() })
onUnmounted(() => stopAutoplay())
watch(() => [props.products, props.autoplay, props.autoplaySpeed], () => {
  stopAutoplay(); startAutoplay()
})
</script>

<style scoped>
.pc-wrapper {
  position: relative;
  /* CSS custom props injected via :style */
  --pc-cols-desktop: 4;
  --pc-cols-mobile: 2;
  --pc-gap: 12px;
}

/* Arrows */
.pc-arrow {
  position: absolute; top: 40%; transform: translateY(-50%);
  z-index: 10; width: 36px; height: 36px; border-radius: 50%;
  border: 1px solid var(--sf-border); background: var(--sf-bg-card);
  color: var(--sf-text-primary); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12); transition: all 0.2s;
}
.pc-arrow:hover {
  background: var(--sf-accent); color: #fff; border-color: var(--sf-accent);
  transform: translateY(-50%) scale(1.08);
}
.pc-arrow:disabled { opacity: 0.25; cursor: not-allowed; pointer-events: none; }
.pc-arrow--prev { left: -18px; }
.pc-arrow--next { right: -18px; }

/* Track */
.pc-track {
  display: flex;
  gap: var(--pc-gap);
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  padding: 4px 2px 10px;
}
.pc-track::-webkit-scrollbar { display: none; }

/* Slides — width set by CSS custom properties per breakpoint */
.pc-slide {
  scroll-snap-align: start;
  flex-shrink: 0;
  /* Desktop: use --pc-cols-desktop */
  width: calc(
    (100% - (var(--pc-cols-desktop) - 1) * var(--pc-gap)) / var(--pc-cols-desktop)
  );
}
.pc-slide:hover { transform: translateY(-2px); transition: transform 0.2s; }

/* Dots */
.pc-dots {
  display: flex; justify-content: center; gap: 6px; margin-top: 12px;
}
.pc-dot {
  width: 8px; height: 8px; border-radius: 50%;
  border: none; background: var(--sf-border); cursor: pointer; padding: 0;
  transition: all 0.25s;
}
.pc-dot.active { background: var(--sf-accent); width: 24px; border-radius: 4px; }

/* ── Tablet (≤900px): always 3 slides ── */
@media (max-width: 900px) {
  .pc-slide {
    width: calc((100% - 2 * var(--pc-gap)) / 3);
  }
}

/* ── Mobile (≤600px): use --pc-cols-mobile from config ── */
@media (max-width: 600px) {
  .pc-slide {
    width: calc(
      (100% - (var(--pc-cols-mobile) - 1) * var(--pc-gap)) / var(--pc-cols-mobile)
    );
  }
  .pc-arrow { width: 30px; height: 30px; }
  .pc-arrow--prev { left: -14px; }
  .pc-arrow--next { right: -14px; }
}
</style>
