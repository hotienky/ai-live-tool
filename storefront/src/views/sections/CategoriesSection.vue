<template>
  <section class="sf-categories-section" v-if="categoriesData.length > 0">
    <div class="sf-cat-container">
      <div class="sf-cat-header">
        <h2 class="sf-cat-title">
          <LayoutGrid :size="24" class="sf-cat-icon-bg" />
          {{ resolvedParams.title || t('storefront.categories', 'Danh mục sản phẩm') }}
        </h2>
        <router-link to="/categories" class="sf-cat-view-all">
          {{ t('storefront.view_all', 'Xem tất cả') }}
          <ArrowRight :size="16" />
        </router-link>
      </div>
      
      <div class="sf-cat-grid" :class="[layoutClass]">
        <router-link 
          v-for="cat in categoriesData" 
          :key="cat.id" 
          :to="`/category/${cat.slug || cat.id}`"
          class="sf-cat-card"
        >
          <div class="sf-cat-image-wrap">
            <img v-if="cat.image || cat.image_url" :src="cat.image || cat.image_url" :alt="cat.name" loading="lazy" />
            <div v-else class="sf-cat-placeholder">
              <FolderOpen :size="32" />
            </div>
          </div>
          <span class="sf-cat-name">{{ cat.name }}</span>
        </router-link>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, inject, ref, onMounted, onUnmounted } from 'vue'
import { LayoutGrid, ArrowRight, FolderOpen } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const isPreviewMode = inject('isPreviewMode', ref(false))

// === Embedded Responsive Logic ===
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const isMobile = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value > 768 && windowWidth.value <= 1024)

const resolvedParams = computed(() => {
  const p = { ...(props.params || {}) }
  const tablet = props.section.tabletParams || {}
  const mobile = props.section.mobileParams || {}
  
  if (isTablet.value || isMobile.value) {
    for (const k in tablet) if (tablet[k] !== undefined && tablet[k] !== '') p[k] = tablet[k]
  }
  if (isMobile.value) {
    for (const k in mobile) if (mobile[k] !== undefined && mobile[k] !== '') p[k] = mobile[k]
  }
  return p
})

// Normalize layoutStyle to CSS class — map all CMS values to valid CSS classes
const layoutClass = computed(() => {
  const style = resolvedParams.value.layoutStyle || 'circle'
  // Map all possible CMS values to supported CSS layout classes
  const map = {
    circle: 'layout-circle',
    circle_icon: 'layout-circle',
    grid: 'layout-grid',
    carousel: 'layout-carousel',
    masonry: 'layout-grid',
  }
  return map[style] || 'layout-circle'
})

const categoriesData = computed(() => {
  let list = []
  if (props.params?.resolvedData) {
    list = props.params.resolvedData
  } else {
    // Fallback if not resolved by BFF
    list = window.__STOREFRONT_DATA__?.categories || []
  }
  
  if (list.length === 0 && isPreviewMode.value) {
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i, name: `Danh mục ${i + 1}`, image: `https://loremflickr.com/200/200/medical?random=${i}`
    }))
  }

  const limit = resolvedParams.value.maxCategories || 10
  return list.slice(0, limit)
})
</script>

<style scoped>
.sf-categories-section {
  padding: 40px 0;
  background: #fff;
}

.sf-cat-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.sf-cat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.sf-cat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.sf-cat-icon-bg {
  color: #00305b;
  background: #f1f5f9;
  padding: 8px;
  border-radius: 12px;
  width: 40px;
  height: 40px;
}

.sf-cat-view-all {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  color: #0e62bc;
  text-decoration: none;
  transition: opacity 0.2s;
}

.sf-cat-view-all:hover {
  opacity: 0.7;
}

/* ── Grid base ── */
.sf-cat-grid {
  display: grid;
  gap: 20px;
}

/* ── Circle Layout (default, also used for circle_icon) ── */
.sf-cat-grid.layout-circle {
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
}

/* ── Grid Layout (standard card grid) ── */
.sf-cat-grid.layout-grid {
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
}

/* ── Carousel Layout ── */
.sf-cat-grid.layout-carousel {
  display: flex;
  overflow-x: auto;
  flex-wrap: nowrap;
  gap: 16px;
  padding-bottom: 16px;
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.sf-cat-grid.layout-carousel::-webkit-scrollbar { display: none; }
.sf-cat-grid.layout-carousel .sf-cat-card {
  flex-shrink: 0;
  min-width: 140px;
}

/* ── Card ── */
.sf-cat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-decoration: none;
  gap: 8px;
  background: #f8fafc;
  padding: 16px 12px;
  border-radius: 16px;
  transition: transform 0.2s, background 0.2s;
  height: 100%;
}

.sf-cat-card:hover {
  transform: translateY(-4px);
  background: #f1f5f9;
}

/* ── Image ── */
.sf-cat-image-wrap {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #e0f2fe;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-bottom: 4px;
}

.sf-cat-card:hover .sf-cat-image-wrap {
  background: #bae6fd;
}

.sf-cat-image-wrap img {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.sf-cat-placeholder {
  color: #0284c7;
}

.sf-cat-name {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  text-align: center;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.2s;
}

.sf-cat-card:hover .sf-cat-name {
  color: #00305b;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .sf-categories-section { padding: 30px 0; }
  .sf-cat-title { font-size: 20px; }
  .sf-cat-grid.layout-circle {
    grid-template-columns: repeat(4, 1fr);
    gap: 16px 8px;
  }
  .sf-cat-grid.layout-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
  }
  .sf-cat-image-wrap {
    width: 72px;
    height: 72px;
  }
  .sf-cat-name {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .sf-cat-grid.layout-circle {
    grid-template-columns: repeat(3, 1fr);
  }
  .sf-cat-grid.layout-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
