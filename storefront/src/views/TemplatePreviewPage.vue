<template>
  <div class="template-preview-canvas">
    <!-- Notice for user -->
    <div v-if="injectedSections.length === 0" class="canvas-empty">
      <div class="canvas-empty__icon">✨</div>
      <p>Kéo component từ bên trái (Panel) thả vào đây để thiết kế Giao diện Thẻ Sản phẩm/Bài viết</p>
    </div>
    
    <div class="canvas-wrapper">
      <SectionRenderer
        v-for="(section, index) in injectedSections"
        :key="section.id || index"
        :section="section"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import SectionRenderer from '../components/SectionRenderer.vue'

const layoutConfig = inject('layoutConfig', ref(null))

const injectedSections = computed(() => {
  return layoutConfig.value?.sections || []
})
</script>

<style scoped>
.template-preview-canvas {
  min-height: 100vh;
  background-color: var(--sf-bg-subtle, #f9fafb);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px;
}

.canvas-wrapper {
  width: 100%;
  max-width: 400px; /* Bounding box for Product Card */
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  min-height: 200px;
  transition: all 0.3s;
}

.canvas-empty {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #888;
  max-width: 300px;
  pointer-events: none;
}
.canvas-empty__icon {
  font-size: 32px;
  margin-bottom: 12px;
}
</style>
