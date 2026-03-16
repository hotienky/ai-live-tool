<template>
  <section class="section-brands container">
    <h2 class="section-title">
      <Award :size="22" class="section-title__accent" />
      {{ params?.title || 'Thương hiệu' }}
    </h2>
    <div class="brands-slider" v-if="items.length">
      <div class="brands-track">
        <a v-for="(b, i) in [...items, ...items]" :key="i" :href="b.url || '#'" class="brand-item" target="_blank">
          <img v-if="b.logo" :src="b.logo" :alt="b.name" />
          <span v-else>{{ b.name }}</span>
        </a>
      </div>
    </div>
    <p v-else class="section-empty">Chưa có thương hiệu nào</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Award } from 'lucide-vue-next'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const items = computed(() => props.content.length ? props.content : [])
</script>

<style scoped>
.section-brands { padding-top: 40px; }
.brands-slider { overflow: hidden; padding: 16px 0; }
.brands-track {
  display: flex; gap: 32px; animation: scrollBrands 20s linear infinite;
}
.brand-item {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; width: 120px; height: 60px;
  border-radius: var(--sf-radius-sm); background: var(--sf-bg-card);
  border: 1px solid var(--sf-border); text-decoration: none;
  color: var(--sf-text-secondary); font-weight: 700; font-size: 12px;
  transition: all var(--sf-transition); padding: 8px;
}
.brand-item img { max-width: 100%; max-height: 100%; object-fit: contain; filter: grayscale(0.5); transition: filter 0.3s; }
.brand-item:hover img { filter: none; }
.brand-item:hover { border-color: var(--sf-accent); transform: scale(1.05); }
@keyframes scrollBrands {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
</style>
