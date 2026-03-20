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
.sf-section { padding: 24px; }
.sf-section__title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.sf-categories { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 8px; flex-wrap: wrap; }
.sf-categories--carousel { flex-wrap: nowrap; }
.sf-cat-card {
  display: flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 12px;
  background: var(--color-bg-card, #1a1a2e); border: 1px solid var(--color-border, rgba(255,255,255,0.1));
  color: var(--color-text-secondary, #b4b4be); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.25s; white-space: nowrap; flex-shrink: 0;
}
.sf-cat-card:hover { border-color: var(--color-accent-primary, #7c3aed); color: var(--color-accent-primary, #7c3aed); }
.sf-cat-img { width: 24px; height: 24px; border-radius: 6px; object-fit: cover; }
.sf-cat-count { font-size: 11px; color: var(--color-text-muted, #6b6b7b); }

@media (max-width: 768px) { .sf-section { padding: 16px; } }
</style>
