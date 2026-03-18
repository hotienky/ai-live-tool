<template>
  <transition name="btt">
    <button v-if="show" class="back-to-top" @click="scrollTop" aria-label="Lên đầu trang">
      <ChevronUp :size="20" />
    </button>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { ChevronUp } from 'lucide-vue-next'

const show = ref(false)

function onScroll() {
  show.value = window.scrollY > 400
}

function scrollTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 900;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid var(--sf-border, #e5e7eb);
  background: var(--sf-bg-card, #fff);
  color: var(--sf-text-primary, #333);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: all 0.25s;
}
.back-to-top:hover {
  background: var(--sf-accent);
  color: #fff;
  border-color: var(--sf-accent);
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.18);
}

.btt-enter-active { animation: bttIn 0.3s ease; }
.btt-leave-active { animation: bttIn 0.2s ease reverse; }
@keyframes bttIn {
  from { opacity: 0; transform: translateY(16px) scale(0.8); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 768px) {
  .back-to-top { bottom: 16px; right: 16px; width: 40px; height: 40px; }
}
</style>
