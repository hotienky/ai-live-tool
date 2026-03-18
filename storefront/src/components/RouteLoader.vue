<template>
  <transition name="loader">
    <div v-if="loading" class="route-loader">
      <div class="route-loader__bar"></div>
    </div>
  </transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const loading = ref(false)
const router = useRouter()
let timer = null

const removeBeforeEach = router.beforeEach(() => {
  loading.value = true
  clearTimeout(timer)
})

const removeAfterEach = router.afterEach(() => {
  timer = setTimeout(() => { loading.value = false }, 300)
})

onUnmounted(() => {
  removeBeforeEach()
  removeAfterEach()
  clearTimeout(timer)
})
</script>

<style scoped>
.route-loader {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  height: 3px;
  pointer-events: none;
}
.route-loader__bar {
  height: 100%;
  background: var(--sf-accent, #6366f1);
  box-shadow: 0 0 10px var(--sf-accent-glow, rgba(99,102,241,0.4));
  animation: routeProgress 1.2s ease-in-out infinite;
  transform-origin: left;
}

@keyframes routeProgress {
  0% { transform: scaleX(0); }
  50% { transform: scaleX(0.7); }
  100% { transform: scaleX(1); opacity: 0; }
}

.loader-enter-active { animation: fadeIn 0.15s ease; }
.loader-leave-active { animation: fadeIn 0.3s ease reverse; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
