<template>
  <section class="sf-section" v-if="pages.length > 0">
    <h3 class="sf-section__title"><FileText :size="16" /> Trang thông tin</h3>
    <div class="sf-pages" :class="config.layout === 'list' ? 'sf-pages--list' : 'sf-pages--grid'">
      <div v-for="pg in displayPages" :key="pg.id" class="sf-page-card" @click="$emit('viewPage', pg.id)">
        <img v-if="pg.image" :src="pg.image" :alt="pg.title" class="sf-page-img" />
        <div class="sf-page-body">
          <h4>{{ pg.title }}</h4>
          <p v-if="pg.description" class="sf-page-desc">{{ pg.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { FileText } from 'lucide-vue-next'

const props = defineProps({
  pages: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['viewPage'])

const maxPages = computed(() => props.config.maxPages || 6)
const displayPages = computed(() => props.pages.slice(0, maxPages.value))
</script>

<style scoped>
.sf-section { padding: 24px; }
.sf-section__title { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.sf-pages--grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
.sf-pages--list { display: flex; flex-direction: column; gap: 12px; }
.sf-page-card {
  border-radius: 12px; overflow: hidden; background: var(--color-bg-card, #1a1a2e);
  border: 1px solid var(--color-border, rgba(255,255,255,0.1)); cursor: pointer; transition: all 0.3s;
}
.sf-page-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-color: var(--color-accent-primary, #7c3aed); }
.sf-page-img { width: 100%; height: 140px; object-fit: cover; }
.sf-page-body { padding: 14px 16px; }
.sf-page-body h4 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
.sf-page-desc { font-size: 13px; color: var(--color-text-muted, #6b6b7b); margin: 0; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

@media (max-width: 768px) { .sf-section { padding: 16px; } .sf-pages--grid { grid-template-columns: 1fr; } }
</style>
