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
