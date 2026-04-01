<template>
  <section class="home-section container" v-if="pagesData.length > 0">
    <h2 class="section-title">
      <BookOpen :size="22" class="section-title__accent" />
      {{ params?.title || t('storefront.info', 'Thông tin') }}
    </h2>
    <div class="home-pages" :class="{ 'home-pages--list': params?.layout === 'list' }">
      <router-link
        v-for="pg in pagesData"
        :key="pg.id"
        :to="`/page/${pg.alias || pg.id}`"
        class="home-page-card"
      >
        <img v-if="pg.image" :src="pg.image" :alt="pg.title" class="home-page-card__img" />
        <div v-else class="home-page-card__img home-page-card__img--empty">
          <FileText :size="28" />
        </div>
        <div class="home-page-card__info">
          <h4>{{ pg.title }}</h4>
          <span class="home-page-card__date">{{ formatDate(pg.created_at) }}</span>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { BookOpen, FileText } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const pagesData = computed(() => {
  let allPages = []
  if (props.params?.resolvedData) {
    allPages = props.params.resolvedData
  } else {
    allPages = window.__STOREFRONT_DATA__?.pages || []
  }
  
  const count = props.params?.maxPages || 6
  return allPages.slice(0, count)
})

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN').format(d)
}
</script>
<style scoped>
.home-pages {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.home-pages--list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.home-page-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--sf-bg-card, #fff);
  border: 1px solid var(--sf-border, #e2e8f0);
  border-radius: var(--sf-radius-lg, 12px);
  text-decoration: none;
  transition: all 0.2s ease;
  color: var(--sf-text-primary, #1e293b);
}
.home-page-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--sf-shadow-md, 0 10px 15px -3px rgba(0,0,0,0.1));
  border-color: var(--sf-accent, #6366f1);
}
.home-pages--list .home-page-card {
  align-items: flex-start;
}
.home-page-card__img {
  width: 64px;
  height: 64px;
  border-radius: var(--sf-radius-md, 8px);
  object-fit: cover;
  flex-shrink: 0;
}
.home-page-card__img--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sf-bg-card-hover, #f1f5f9);
  color: var(--sf-text-muted, #94a3b8);
}
.home-page-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.home-page-card__info h4 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text-primary, #1e293b);
  line-height: 1.4;
}
.home-page-card__date {
  font-size: 12px;
  color: var(--sf-text-muted, #64748b);
}
</style>
