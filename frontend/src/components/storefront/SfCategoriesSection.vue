<template>
  <section class="sf-section" v-if="categories.length > 0">
    <div class="sf-section__header">
      <h3 class="sf-section__title"><Grid :size="16" /> {{ responsiveConfig.title || t('admin.msg_53d8de58', 'Danh mục') }}</h3>
      <a v-if="responsiveConfig.showViewAll" href="#" class="sf-view-all">{{ t('admin.view_all', 'Xem tất cả →') }}</a>
    </div>
    <div class="sf-categories" :class="[`sf-categories--${layoutStyle}`]">
      <button v-for="cat in displayCategories" :key="cat.id" class="sf-cat-card" @click="onSelect(cat)">
        <div class="sf-cat-img-wrapper" :class="{'sf-cat-no-img': !(cat.image_url || cat.image)}">
          <img v-if="cat.image_url || cat.image" :src="cat.image_url || cat.image" :alt="cat.name" class="sf-cat-img" />
          <FolderOpen v-else :size="24" class="sf-cat-fallback-icon" />
        </div>
        <span class="sf-cat-name">{{ cat.name }}</span>
        <span class="sf-cat-count" v-if="responsiveConfig.showCount && cat.products_count != null">({{ cat.products_count }})</span>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Grid, FolderOpen } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { useResponsiveConfig } from '../../composables/useResponsiveConfig.js'

const { t } = useI18n()

const props = defineProps({
  categories: { type: Array, default: () => [] },
  config: { type: Object, default: () => ({}) },
  tabletConfig: { type: Object, default: () => ({}) },
  mobileConfig: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['select'])

const { responsiveConfig } = useResponsiveConfig(props)

const layoutStyle = computed(() => responsiveConfig.value.layoutStyle || 'grid')
const columns = computed(() => responsiveConfig.value.columns || 6)

const selectedCategoryIds = computed(() => {
  return props.config.selectedCategoryIds || []
})

const displayCategories = computed(() => {
  if (selectedCategoryIds.value.length > 0) {
    return props.categories.filter(c => selectedCategoryIds.value.includes(c.id))
  }
  const limit = responsiveConfig.value.limit
  return limit ? props.categories.slice(0, limit) : props.categories
})

function onSelect(cat) {
  emit('select', cat)
  if (window.location.pathname.startsWith('/shop/layout')) return
  window.location.href = `/categories/${cat.id}`
}
</script>

<style scoped>
/* ── Section Shell ── */
.sf-section { padding: 32px 24px; }
.sf-section__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}
.sf-section__title { 
  display: flex; align-items: center; gap: 10px; font-size: 22px; font-weight: 800; 
  margin: 0; color: var(--color-text-primary, #1e293b);
  letter-spacing: -0.5px;
}
.sf-section__title svg {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-bg-card-hover, #e0e7ff);
  padding: 6px; border-radius: 8px; width: 32px; height: 32px;
}
.sf-view-all {
  font-size: 14px; font-weight: 700; color: var(--color-accent-primary, #6366f1);
  text-decoration: none; display: flex; align-items: center; gap: 4px;
  white-space: nowrap;
}
.sf-view-all:hover { opacity: 0.8; }

/* ── Base Card ── */
.sf-cat-card {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px;
  background: var(--color-bg-card, #ffffff); 
  border: 1px solid var(--color-border, #e2e8f0);
  color: var(--color-text-primary, #334155); font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
}
.sf-cat-card:hover { 
  border-color: var(--color-accent-primary, #6366f1); 
  color: var(--color-accent-primary, #6366f1); 
}

/* ── Image Wrapper (shared) ── */
.sf-cat-img-wrapper {
  display: flex; align-items: center; justify-content: center;
  width: 44px; height: 44px; border-radius: 10px; overflow: hidden;
  background: var(--color-bg-primary, #f1f5f9); flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s;
}
.sf-cat-img-wrapper.sf-cat-no-img {
  background: var(--color-bg-card-hover, #e0e7ff);
}
.sf-cat-fallback-icon { color: var(--color-accent-primary, #6366f1); }
.sf-cat-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.sf-cat-name { flex: 1; text-align: left; }

.sf-cat-count { 
  font-size: 12px; color: var(--color-text-muted, #94a3b8);
  background: var(--color-bg-primary, #f1f5f9);
  padding: 2px 8px; border-radius: 20px;
  margin-left: auto; flex-shrink: 0;
}

/* ── Layout: Grid ── */
.sf-categories { 
  display: grid; gap: 16px; width: 100%;
}
.sf-categories--grid {
  grid-template-columns: repeat(v-bind('columns'), 1fr);
}

/* ── Layout: Carousel ── */
.sf-categories--carousel { 
  display: flex !important; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 16px;
  -ms-overflow-style: none; scrollbar-width: none;
}
.sf-categories--carousel::-webkit-scrollbar { display: none; }
.sf-categories--carousel .sf-cat-card {
  flex-shrink: 0; min-width: 180px;
}

/* ── Layout: Circle Icon ── */
.sf-categories--circle_icon {
  display: grid !important; 
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); 
  gap: 20px 12px; 
  justify-items: center;
}
.sf-categories--circle_icon .sf-cat-card {
  flex-direction: column; align-items: center; text-align: center;
  border: none; background: transparent; box-shadow: none;
  padding: 8px 4px; gap: 10px; width: 100%;
}
.sf-categories--circle_icon .sf-cat-card:hover {
  border: none; background: transparent; box-shadow: none;
}
.sf-categories--circle_icon .sf-cat-img-wrapper {
  width: 72px; height: 72px; border-radius: 50%;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
}
.sf-categories--circle_icon .sf-cat-card:hover .sf-cat-img-wrapper {
  transform: translateY(-4px); 
  box-shadow: 0 8px 24px var(--sf-shadow-accent, rgba(99, 102, 241, 0.2));
}
.sf-categories--circle_icon .sf-cat-name {
  font-size: 13px; line-height: 1.4; font-weight: 500; text-align: center;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; 
  -webkit-box-orient: vertical; overflow: hidden;
}
.sf-categories--circle_icon .sf-cat-count {
  margin-left: 0;
}

/* ── Layout: Masonry ── */
.sf-categories--masonry {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

/* ── Responsive ── */
@media (max-width: 768px) { 
  .sf-section { padding: 24px 16px; } 
  .sf-section__title { font-size: 18px; }
  .sf-categories--grid { grid-template-columns: repeat(2, 1fr); }
  .sf-cat-card { padding: 10px 12px; font-size: 13px; }
  .sf-cat-img-wrapper { width: 36px; height: 36px; }
  .sf-categories--circle_icon .sf-cat-img-wrapper { width: 56px; height: 56px; }
}
</style>
