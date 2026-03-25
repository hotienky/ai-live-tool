<template>
  <section class="home-section container" v-if="postsData.length > 0">
    <div class="home-section__header">
      <h2 class="section-title">
        <BookOpen :size="22" class="section-title__accent" />
        {{ params?.title || t('storefront.latest_posts', 'Bài viết mới nhất') }}
      </h2>
      <router-link to="/blog" class="home-section__viewall">
        {{ t('storefront.view_all', 'Xem tất cả') }} <ArrowRight :size="14" />
      </router-link>
    </div>
    <div class="home-pages">
      <router-link
        v-for="post in postsData"
        :key="post.id"
        :to="`/blog/${post.slug || post.id}`"
        class="home-page-card"
      >
        <img v-if="post.featured_image || post.image" :src="post.featured_image || post.image" :alt="post.title" class="home-page-card__img" />
        <div v-else class="home-page-card__img home-page-card__img--empty">
          <BookOpen :size="28" />
        </div>
        <div class="home-page-card__info">
          <h4>{{ post.title }}</h4>
          <span class="home-page-card__date">{{ formatDate(post.published_at || post.created_at) }}</span>
        </div>
      </router-link>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { BookOpen, ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

const postsData = computed(() => {
  let allPosts = []
  if (props.params?.resolvedData) {
    allPosts = props.params.resolvedData
  } else {
    allPosts = window.__STOREFRONT_DATA__?.blogPosts || []
  }
  
  const count = props.params?.count || 6
  return allPosts.slice(0, count)
})

function formatDate(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return new Intl.DateTimeFormat('vi-VN').format(d)
}
</script>
