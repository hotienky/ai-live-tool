<template>
  <section class="feature-links-section" :class="{ container: !params?.fullWidth }">
    <div
      class="feature-links-grid"
      :style="{ '--cols': params?.columns || 4 }"
    >
      <component
        :is="item.url ? 'a' : 'div'"
        v-for="(item, idx) in items"
        :key="idx"
        :href="item.url"
        class="feature-link-card"
        :class="[`style-${params?.style || 'card'}`]"
        :style="{ backgroundColor: item.bgColor || '#f8f9fa' }"
      >
        <div class="feature-link-card__icon" v-if="item.icon">
          <img :src="item.icon" :alt="item.title" referrerpolicy="no-referrer" />
        </div>
        <div class="feature-link-card__content">
          <h3 class="feature-link-card__title" v-if="item.title">{{ item.title }}</h3>
          <p class="feature-link-card__subtitle" v-if="item.subtitle">{{ item.subtitle }}</p>
        </div>
      </component>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, default: () => ({ columns: 4, style: 'card' }) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const items = computed(() => {
  return Array.isArray(props.content) ? props.content : []
})
</script>

<style scoped>
.feature-links-section {
  margin: 24px auto;
}
.feature-links-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 16px;
}
.feature-link-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: var(--sf-radius-md, 12px);
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.feature-link-card:not(div):hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.style-minimal {
  flex-direction: column;
  text-align: center;
  background: transparent !important;
  padding: 8px;
}
.style-minimal .feature-link-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #f0f4f8;
  padding: 10px;
}

.feature-link-card__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.feature-link-card__icon img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.feature-link-card__content {
  flex: 1;
  min-width: 0;
}
.feature-link-card__title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #1e293b !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.feature-link-card__subtitle {
  margin: 4px 0 0;
  font-size: 12px;
  color: #64748b !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .feature-links-grid {
    grid-template-columns: repeat(2, 1fr) !important;
  }
}
@media (max-width: 480px) {
  .feature-links-grid {
    grid-template-columns: repeat(1, 1fr) !important;
  }
  .style-minimal.feature-link-card {
    flex-direction: row;
    text-align: left;
  }
}
</style>
