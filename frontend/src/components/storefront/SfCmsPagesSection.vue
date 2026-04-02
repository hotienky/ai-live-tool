<template>
  <section class="sf-section" v-if="pages.length > 0">
    <h3 class="sf-section__title"><FileText :size="16" /> {{ t('admin.msg_8b773e3c', 'Trang thông tin') }}</h3>
    <div class="sf-pages" :class="config.layout === 'list' ? 'sf-pages--list' : 'sf-pages--grid'">
      <div v-for="pg in displayPages" :key="pg.id" class="sf-page-card" @click="$emit('viewPage', pg.id)">
        <div class="sf-page-img-wrap">
          <img v-if="pg.image" :src="pg.image" :alt="pg.title" class="sf-page-img" />
          <div v-else class="sf-page-img-placeholder">
            <FileText :size="32" />
          </div>
        </div>
        <div class="sf-page-body">
          <h4>{{ pg.title }}</h4>
          <p v-if="pg.description" class="sf-page-desc">{{ pg.description }}</p>
          <span class="sf-page-readmore">Xem thêm →</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { FileText } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  pages: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
})
defineEmits(['viewPage'])

const maxPages = computed(() => props.config.maxPages || 6)
const displayPages = computed(() => props.pages.slice(0, maxPages.value))
</script>

<style scoped>
.sf-section { padding: 32px 24px; }
.sf-section__title {
  display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800;
  margin: 0 0 24px; color: var(--color-text-primary, #1e293b); letter-spacing: -0.5px;
}
.sf-section__title svg {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-bg-card-hover, #e0e7ff);
  padding: 6px; border-radius: 8px; width: 32px; height: 32px;
}

.sf-pages--grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }
.sf-pages--list { display: flex; flex-direction: column; gap: 16px; }
.sf-pages--list .sf-page-card { flex-direction: row; }
.sf-pages--list .sf-page-img-wrap { width: 200px; min-height: 120px; flex-shrink: 0; }

.sf-page-card {
  border-radius: 16px; overflow: hidden; background: var(--color-bg-card, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0); cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex; flex-direction: column;
}
.sf-page-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.06);
  border-color: var(--color-accent-primary, #6366f1);
}

.sf-page-img-wrap {
  overflow: hidden; height: 160px;
  background: var(--color-bg-primary, #f8fafc);
}
.sf-page-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s; }
.sf-page-card:hover .sf-page-img { transform: scale(1.06); }

.sf-page-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #e0e7ff, #f1f5f9); color: #94a3b8;
}

.sf-page-body { padding: 16px 18px; flex: 1; display: flex; flex-direction: column; }
.sf-page-body h4 {
  font-size: 16px; font-weight: 700; margin: 0 0 6px;
  color: var(--color-text-primary, #1e293b); line-height: 1.35;
}
.sf-page-desc {
  font-size: 14px; color: var(--color-text-muted, #64748b); margin: 0 0 12px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.sf-page-readmore {
  font-size: 13px; font-weight: 700; color: var(--color-accent-primary, #6366f1);
  margin-top: auto; transition: color 0.2s;
}
.sf-page-card:hover .sf-page-readmore { color: #4f46e5; }

@media (max-width: 768px) {
  .sf-section { padding: 24px 16px; }
  .sf-section__title { font-size: 18px; }
  .sf-pages--grid { grid-template-columns: 1fr; }
  .sf-pages--list .sf-page-card { flex-direction: column; }
  .sf-pages--list .sf-page-img-wrap { width: 100%; }
}
</style>
