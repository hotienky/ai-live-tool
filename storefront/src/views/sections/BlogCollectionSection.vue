<template>
  <section class="container blk-blog home-section" v-if="posts.length > 0">
    <div class="home-section__header" v-if="params?.title">
      <h2 class="section-title">{{ params.title }}</h2>
      <router-link v-if="params?.show_view_all" to="/blog" class="home-section__viewall">
        {{ t('storefront.view_all', 'Xem tất cả') }} <ArrowRight :size="14" />
      </router-link>
    </div>
    <!-- P5 – Data đã được inject server-side qua LayoutResolver (params.resolvedData) -->
    <BlogBlockRenderer :settings="{ ...params, posts }" />
  </section>
</template>

<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { ArrowRight } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const BlogBlockRenderer = defineAsyncComponent(() =>
  import('../../components/blocks/BlogBlockRenderer.vue').catch(() => ({ template: '<div></div>' }))
)

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})

// P5 – BFF đã inject data vào params.resolvedData; không fetch API trong component
const posts = computed(() => {
  const limit = props.params?.limit ?? props.params?.count ?? 6
  const data = props.params?.resolvedData ?? window.__STOREFRONT_DATA__?.blogPosts ?? []
  return data.slice(0, limit)
})
</script>

<style scoped>
.blk-blog { padding-top: 40px; padding-bottom: 40px; }
.home-section__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.section-title { font-size: 24px; font-weight: 900; margin: 0; color: var(--sf-text-primary); }
.home-section__viewall { display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 600; color: var(--sf-text-secondary); text-decoration: none; }
.home-section__viewall:hover { color: var(--sf-accent-light); }
</style>
