<template>
  <section class="category-grid" :class="['style-' + layout]">
    <router-link
      v-for="cat in categories"
      :key="cat.id"
      :to="`/category/${cat.slug || cat.id}`"
      class="category-card"
    >
      <div class="category-card__icon">
        <img v-if="cat.image" :src="cat.image" :alt="cat.name" referrerpolicy="no-referrer" />
        <FolderOpen v-else :size="28" />
      </div>
      <span class="category-card__name">{{ cat.name }}</span>
      <ArrowRight v-if="layout !== 'circle_icon'" :size="14" class="category-card__arrow" />
    </router-link>
  </section>
</template>

<script setup>
import { FolderOpen, ArrowRight } from 'lucide-vue-next'

defineProps({
  categories: { type: Array, default: () => [] },
  layout: { type: String, default: 'grid' }
})
</script>

<style scoped>
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.category-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
  text-decoration: none;
  color: inherit;
}

.category-card:hover {
  border-color: var(--sf-accent);
  background: var(--sf-accent-glow);
  transform: translateY(-2px);
  box-shadow: var(--sf-shadow-sm);
}

.category-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-accent-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--sf-accent-light);
  flex-shrink: 0;
  overflow: hidden;
}

.category-card__icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.category-card__name {
  flex: 1;
  font-size: 14px;
  font-weight: 700;
  color: var(--sf-text-primary);
}

.category-card__arrow {
  color: var(--sf-text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s;
}

.category-card:hover .category-card__arrow {
  opacity: 1;
  transform: translateX(0);
  color: var(--sf-accent-light);
}

@media (max-width: 768px) {
  .category-grid { grid-template-columns: repeat(2, 1fr); }
  .category-grid.style-circle { grid-template-columns: repeat(4, 1fr); }
}

@media (max-width: 480px) {
  .category-grid { grid-template-columns: 1fr; }
  .category-grid.style-circle { grid-template-columns: repeat(3, 1fr); }
}

/* Circle Icon Style */
.category-grid.style-circle {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 20px 12px;
}
.category-grid.style-circle .category-card {
  flex-direction: column;
  padding: 12px 8px;
  background: transparent;
  border: none;
  box-shadow: none;
  text-align: center;
  gap: 8px;
}
.category-grid.style-circle .category-card:hover {
  transform: translateY(-4px);
  background: transparent;
  border: none;
  box-shadow: none;
}
.category-grid.style-circle .category-card__icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f0f4f8;
  padding: 14px;
  margin: 0 auto;
}
.category-grid.style-circle .category-card:hover .category-card__icon {
  background: #e0e7ff;
  color: var(--sf-accent);
}
.category-grid.style-circle .category-card__icon img {
  object-fit: contain;
}
.category-grid.style-circle .category-card__name {
  font-size: 13px;
  font-weight: 500;
}

/* Masonry Style */
.category-grid.style-masonry {
  display: block;
  columns: 3 200px;
  gap: 16px;
}
.category-grid.style-masonry .category-card {
  break-inside: avoid;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 20px;
  background: var(--sf-bg-surface, #fff);
  border: 1px solid var(--sf-border, #eaeaea);
  border-radius: var(--sf-radius-lg, 16px);
}
.category-grid.style-masonry .category-card__icon {
  width: 100%;
  height: auto;
  aspect-ratio: 16/9;
  border-radius: var(--sf-radius-md, 12px);
  margin-bottom: 12px;
}
.category-grid.style-masonry .category-card__name {
  font-size: 16px;
  font-weight: 700;
}
</style>
