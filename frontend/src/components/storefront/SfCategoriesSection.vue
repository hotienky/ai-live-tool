<template>
  <section class="sf-section" v-if="categories.length > 0">
    <h3 class="sf-section__title"><Grid :size="16" /> {{ t('admin.msg_53d8de58', 'Danh mục') }}</h3>
    <div class="sf-categories" :class="{ 'sf-categories--carousel': layoutStyle === 'carousel' }">
      <button v-for="cat in displayCategories" :key="cat.id" class="sf-cat-card" @click="$emit('select', cat)">
        <img v-if="cat.image" :src="cat.image" :alt="cat.name" class="sf-cat-img" />
        <FolderOpen v-else :size="20" />
        <span>{{ cat.name }}</span>
        <span class="sf-cat-count" v-if="config.showCount && cat.products_count != null">({{ cat.products_count }})</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Grid, FolderOpen } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  categories: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['select'])

const layoutStyle = computed(() => props.config.layoutStyle || 'grid')
const columns = computed(() => props.config.columns || 6)
const selectedIds = computed(() => props.config.selectedCategoryIds || [])
const displayCategories = computed(() => {
  if (selectedIds.value.length > 0) return props.categories.filter(c => selectedIds.value.includes(c.id))
  return props.categories
})
</script>

<style scoped>
.sf-section { padding: 32px 24px; }
.sf-section__title { 
  display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; 
  margin: 0 0 24px; color: var(--color-text-primary, #1e293b);
  letter-spacing: -0.5px;
}
.sf-section__title svg {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-bg-card-hover, #e0e7ff);
  padding: 6px; border-radius: 8px; width: 32px; height: 32px;
}

.sf-categories { 
  display: flex; gap: 16px; overflow-x: auto; padding-bottom: 24px; flex-wrap: wrap; 
  /* Hide scrollbar */
  -ms-overflow-style: none; scrollbar-width: none;
}
.sf-categories::-webkit-scrollbar { display: none; }
.sf-categories--carousel { flex-wrap: nowrap; }

.sf-cat-card {
  display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-radius: 16px;
  background: var(--color-bg-card, #ffffff); 
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-primary, #334155); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.sf-cat-card:hover { 
  border-color: var(--color-accent-primary, #6366f1); 
  color: var(--color-accent-primary, #6366f1); 
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(99, 102, 241, 0.1);
}
.sf-cat-img { 
  width: 40px; height: 40px; border-radius: 10px; object-fit: cover; 
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}
.sf-cat-card:hover .sf-cat-img {
  transform: scale(1.05); transition: transform 0.3s;
}
.sf-cat-count { 
  font-size: 12px; color: var(--color-text-muted, #94a3b8);
  background: var(--color-bg-primary, #f1f5f9);
  padding: 2px 8px; border-radius: 20px;
  margin-left: auto;
}

@media (max-width: 768px) { 
  .sf-section { padding: 24px 16px; } 
  .sf-section__title { font-size: 18px; }
  .sf-cat-card { padding: 10px 16px; }
  .sf-cat-img { width: 32px; height: 32px; }
}
</style>
