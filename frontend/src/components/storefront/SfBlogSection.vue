<template>
  <section class="sf-section sf-blog" v-if="posts.length > 0">
    <h3 class="sf-blog__title">
      <PenSquare :size="18" />
      {{ config.title || t('admin.latest_posts', 'Bài viết mới nhất') }}
    </h3>
    <p class="sf-blog__subtitle" v-if="config.subtitle">{{ config.subtitle }}</p>

    <div class="sf-blog__grid">
      <article v-for="post in displayPosts" :key="post.id" class="sf-blog__card" @click="$emit('viewPost', post.slug)">
        <div class="sf-blog__img-wrap">
          <img v-if="post.featured_image" :src="post.featured_image" :alt="post.title" class="sf-blog__img" loading="lazy" />
          <div v-else class="sf-blog__img-placeholder">
            <FileText :size="32" />
          </div>
          <div class="sf-blog__badges">
            <span v-if="post.meta?.is_featured" class="sf-blog__badge sf-blog__badge--featured">★ Nổi bật</span>
            <span v-for="cat in getCategories(post)" :key="cat" class="sf-blog__badge">{{ cat }}</span>
          </div>
        </div>
        <div class="sf-blog__body">
          <div class="sf-blog__meta">
            <time class="sf-blog__date">{{ formatDate(post.published_at) }}</time>
            <span v-if="post.meta?.reading_time" class="sf-blog__reading">
              <Clock :size="12" /> {{ post.meta.reading_time }} phút đọc
            </span>
          </div>
          <h4 class="sf-blog__card-title">{{ post.title }}</h4>
          <p class="sf-blog__excerpt" v-if="post.excerpt">{{ post.excerpt }}</p>
          <span class="sf-blog__read-more">
            {{ t('admin.read_more', 'Đọc thêm') }} →
          </span>
        </div>
      </article>
    </div>

    <div class="sf-blog__footer" v-if="config.showViewAll !== false">
      <button class="sf-blog__view-all" @click="$emit('viewAll')">
        {{ t('admin.view_all_posts', 'Xem tất cả bài viết') }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { PenSquare, FileText, Clock } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  config: { type: Object, default: () => ({}) },
  storeId: { type: String, default: '' },
})
defineEmits(['viewPost', 'viewAll'])

const posts = ref([])
const maxPosts = computed(() => props.config.maxPosts || 6)
const displayPosts = computed(() => posts.value.slice(0, maxPosts.value))

function getCategories(post) {
  if (!post.taxonomies) return []
  return post.taxonomies.filter(t => t.taxonomy === 'category').map(t => t.term).slice(0, 2)
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function fetchPosts() {
  try {
    const res = await fetch(`/api/storefront/blog/posts?per_page=${maxPosts.value}`)
    const data = await res.json()
    posts.value = data.data?.data || data.data || []
  } catch (e) {
    console.warn('[SfBlogSection] Failed to fetch posts:', e.message)
  }
}

onMounted(fetchPosts)
</script>

<style scoped>
.sf-blog { padding: 40px 24px; }

.sf-blog__title {
  display: flex; align-items: center; gap: 10px;
  font-size: 24px; font-weight: 800; margin: 0 0 8px;
  text-align: center; justify-content: center;
  color: var(--color-text-primary);
}
.sf-blog__title svg { color: var(--color-accent-primary, #7c3aed); }
.sf-blog__subtitle {
  font-size: 15px; color: var(--color-text-muted, #6b6b7b);
  text-align: center; margin: 0 0 32px; line-height: 1.5;
}

/* Grid */
.sf-blog__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

/* Card */
.sf-blog__card {
  border-radius: 16px; overflow: hidden;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.08));
  cursor: pointer; transition: all 0.3s ease;
  display: flex; flex-direction: column;
}
.sf-blog__card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.1);
  border-color: var(--color-accent-primary, #7c3aed);
}

/* Image */
.sf-blog__img-wrap { position: relative; overflow: hidden; }
.sf-blog__img {
  width: 100%; height: 200px; object-fit: cover;
  transition: transform 0.4s ease;
}
.sf-blog__card:hover .sf-blog__img { transform: scale(1.05); }
.sf-blog__img-placeholder {
  width: 100%; height: 200px; display: flex;
  align-items: center; justify-content: center;
  background: linear-gradient(135deg, var(--color-bg-secondary, #f0f0f5), var(--color-bg-tertiary, #e4e4ec));
  color: var(--color-text-muted, #9ca3af);
}
.sf-blog__badges {
  position: absolute; top: 12px; left: 12px;
  display: flex; gap: 6px; flex-wrap: wrap;
}
.sf-blog__badge {
  padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;
  background: rgba(0,0,0,0.55); color: #fff; backdrop-filter: blur(4px);
}
.sf-blog__badge--featured {
  background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff;
}

/* Body */
.sf-blog__body { padding: 18px 20px; flex: 1; display: flex; flex-direction: column; }
.sf-blog__meta {
  display: flex; align-items: center; gap: 12px;
  font-size: 12px; color: var(--color-text-muted, #6b6b7b);
  margin-bottom: 10px;
}
.sf-blog__reading { display: flex; align-items: center; gap: 4px; }
.sf-blog__card-title {
  font-size: 17px; font-weight: 700; line-height: 1.4;
  margin: 0 0 8px; color: var(--color-text-primary);
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}
.sf-blog__excerpt {
  font-size: 14px; color: var(--color-text-secondary, #4b5563);
  line-height: 1.6; margin: 0 0 12px; flex: 1;
  display: -webkit-box; -webkit-line-clamp: 3;
  -webkit-box-orient: vertical; overflow: hidden;
}
.sf-blog__read-more {
  font-size: 13px; font-weight: 600;
  color: var(--color-accent-primary, #7c3aed);
  transition: letter-spacing 0.2s;
}
.sf-blog__card:hover .sf-blog__read-more { letter-spacing: 0.5px; }

/* Footer */
.sf-blog__footer { text-align: center; margin-top: 32px; }
.sf-blog__view-all {
  padding: 12px 32px; border-radius: 12px; font-size: 14px; font-weight: 600;
  border: 2px solid var(--color-accent-primary, #7c3aed);
  background: transparent; color: var(--color-accent-primary, #7c3aed);
  cursor: pointer; transition: all 0.3s;
}
.sf-blog__view-all:hover {
  background: var(--color-accent-primary, #7c3aed); color: #fff;
}

@media (max-width: 768px) {
  .sf-blog { padding: 24px 16px; }
  .sf-blog__grid { grid-template-columns: 1fr; }
  .sf-blog__title { font-size: 20px; }
}
</style>
