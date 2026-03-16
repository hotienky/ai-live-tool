<template>
  <section class="section-gallery container">
    <h2 class="section-title">
      <Images :size="22" class="section-title__accent" />
      {{ params?.title || 'Thư viện ảnh' }}
    </h2>
    <div class="gallery-grid" :style="{ gridTemplateColumns: `repeat(${params?.columns || 3}, 1fr)` }">
      <div v-for="(img, i) in items" :key="i" class="gallery-item" @click="lightboxIdx = i">
        <img :src="img.url" :alt="img.caption || ''" loading="lazy" />
        <div class="gallery-item__overlay">
          <Maximize2 :size="18" />
        </div>
      </div>
    </div>
    <p v-if="!items.length" class="section-empty">Chưa có ảnh nào</p>
    <!-- Lightbox -->
    <div v-if="lightboxIdx !== null" class="lightbox" @click="lightboxIdx = null">
      <img :src="items[lightboxIdx]?.url" :alt="items[lightboxIdx]?.caption" />
      <button class="lightbox__close"><X :size="24" /></button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Images, Maximize2, X } from 'lucide-vue-next'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const lightboxIdx = ref(null)
const items = computed(() => props.content.length ? props.content : [])
</script>

<style scoped>
.section-gallery { padding-top: 40px; }
.gallery-grid { display: grid; gap: 10px; }
.gallery-item {
  position: relative; border-radius: var(--sf-radius-md); overflow: hidden;
  cursor: pointer; aspect-ratio: 1;
}
.gallery-item img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
.gallery-item:hover img { transform: scale(1.05); }
.gallery-item__overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.3); opacity: 0; transition: opacity 0.2s; color: #fff;
}
.gallery-item:hover .gallery-item__overlay { opacity: 1; }
.lightbox {
  position: fixed; inset: 0; z-index: 1000; background: rgba(0,0,0,0.9);
  display: flex; align-items: center; justify-content: center; cursor: pointer;
}
.lightbox img { max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px; }
.lightbox__close { position: absolute; top: 20px; right: 20px; background: none; border: none; color: #fff; cursor: pointer; }
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
@media (max-width: 768px) { .gallery-grid { grid-template-columns: repeat(2, 1fr) !important; } }
</style>
