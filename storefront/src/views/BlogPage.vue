<template>
  <SystemPageWrapper slug="blog">
    <div class="blog-page">
      <!-- Blog List -->
      <div v-if="!currentSlug" class="container">
        <header class="blog-header">
          <h1><BookOpen :size="28" class="blog-header__icon" /> Blog</h1>
          <p class="blog-header__desc">Tin tức, hướng dẫn và chia sẻ hữu ích</p>
        </header>

        <!-- Loading -->
        <div v-if="loading" class="blog-grid" :class="'blog-grid--cols-' + pageConfig.gridColumns">
          <div v-for="i in 6" :key="i" class="blog-card blog-card--skeleton">
            <div class="skeleton" style="width:100%;aspect-ratio:16/9"></div>
            <div style="padding:16px">
              <div class="skeleton" style="height:20px;width:70%;margin-bottom:8px"></div>
              <div class="skeleton" style="height:14px;width:100%"></div>
            </div>
          </div>
        </div>

        <!-- Posts -->
        <div v-else-if="posts.length > 0" class="blog-grid" :class="'blog-grid--cols-' + pageConfig.gridColumns">
          <article
            v-for="post in posts"
            :key="post.id"
            class="blog-card"
            @click="$router.push(`/blog/${post.slug || post.id}`)"
          >
            <div class="blog-card__img-wrap">
              <img v-if="post.image || post.featured_image" :src="post.image || post.featured_image" :alt="post.title" class="blog-card__img" loading="lazy" />
              <div v-else class="blog-card__img blog-card__img--empty">
                <FileText :size="32" />
              </div>
              <span v-if="post.category_name" class="blog-card__category">{{ post.category_name }}</span>
            </div>
            <div class="blog-card__body">
              <h3 class="blog-card__title">{{ post.title }}</h3>
              <p class="blog-card__excerpt">{{ stripHtml(post.excerpt || post.body).slice(0, 160) }}...</p>
              <div class="blog-card__meta">
                <time><Calendar :size="12" /> {{ formatDate(post.created_at) }}</time>
                <span v-if="post.author_name" class="blog-card__author">
                  <User :size="12" /> {{ post.author_name }}
                </span>
              </div>
            </div>
          </article>
        </div>

        <!-- Empty -->
        <div v-else class="blog-empty">
          <BookOpen :size="48" />
          <h3>Chưa có bài viết nào</h3>
          <p>Blog sẽ sớm được cập nhật</p>
        </div>
      </div>

      <!-- Blog Detail -->
      <div v-else class="container">
        <!-- ... existing detail ... -->
        <div v-if="loadingDetail" class="blog-detail-loading">
          <div class="skeleton" style="height:36px;width:60%;margin-bottom:12px"></div>
          <div class="skeleton" style="height:16px;width:30%;margin-bottom:24px"></div>
          <div class="skeleton" style="height:300px;width:100%"></div>
        </div>

        <article v-else-if="currentPost" class="blog-detail">
          <nav class="breadcrumb">
            <router-link to="/">Trang chủ</router-link>
            <ChevronRight :size="12" />
            <router-link to="/blog">Blog</router-link>
            <ChevronRight :size="12" />
            <span>{{ currentPost.title }}</span>
          </nav>

          <header class="blog-detail__header">
            <h1>{{ currentPost.title }}</h1>
            <div class="blog-detail__meta">
              <time><Calendar :size="14" /> {{ formatDate(currentPost.created_at) }}</time>
              <span v-if="currentPost.author_name"><User :size="14" /> {{ currentPost.author_name }}</span>
              <span v-if="currentPost.category_name" class="blog-detail__cat">
                <Tag :size="14" /> {{ currentPost.category_name }}
              </span>
            </div>
          </header>

          <div v-if="currentPost.image || currentPost.featured_image" class="blog-detail__banner">
            <img :src="currentPost.image || currentPost.featured_image" :alt="currentPost.title" />
          </div>

          <ShortcodeRenderer class="blog-detail__content" :html="currentPost.body" />

          <!-- Comments Section -->
          <section v-if="comments.length > 0 || true" class="blog-comments">
            <h3><MessageCircle :size="20" /> Bình luận ({{ comments.length }})</h3>

            <!-- Comment Form -->
            <form @submit.prevent="submitComment" class="comment-form">
              <input v-model="commentForm.author_name" placeholder="Tên của bạn" required class="comment-input" />
              <textarea v-model="commentForm.body" placeholder="Viết bình luận..." required rows="3" class="comment-textarea"></textarea>
              <button type="submit" class="btn btn--primary btn--sm" :disabled="submitting">
                <Send :size="14" /> {{ submitting ? 'Đang gửi...' : 'Gửi bình luận' }}
              </button>
            </form>

            <!-- Comment List -->
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <div class="comment-item__avatar">{{ (c.author_name || c.name || 'A')[0].toUpperCase() }}</div>
              <div class="comment-item__body">
                <div class="comment-item__top">
                  <strong>{{ c.author_name || c.name || 'Ẩn danh' }}</strong>
                  <time>{{ formatDate(c.created_at) }}</time>
                </div>
                <p>{{ c.body }}</p>
              </div>
            </div>
          </section>

          <!-- Back to Blog -->
          <div class="blog-detail__back">
            <router-link to="/blog" class="btn btn--outline">
              <ArrowLeft :size="16" /> Quay lại Blog
            </router-link>
          </div>
        </article>

        <!-- Not Found -->
        <div v-else class="blog-empty">
          <FileQuestion :size="48" />
          <h3>Bài viết không tồn tại</h3>
          <router-link to="/blog" class="btn btn--primary">
            <ArrowLeft :size="16" /> Quay lại Blog
          </router-link>
        </div>
      </div>
    </div>
  </SystemPageWrapper>
</template>

<script setup>
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch, apiPost } from '../api.js'
import { useSeo } from '../composables/useSeo.js'
import { useI18n } from '../composables/useI18n.js'
import {
  BookOpen, FileText, Calendar, User, ChevronRight, ArrowLeft,
  MessageCircle, Send, Tag, FileQuestion
} from 'lucide-vue-next'
import ShortcodeRenderer from '../components/ShortcodeRenderer.vue'
import SystemPageWrapper from '../components/SystemPageWrapper.vue'
import { useSanitize } from '../composables/useSanitize.js'

const { t } = useI18n()
const { sanitize } = useSanitize()
const { setPageSeo } = useSeo()
const route = useRoute()

const props = defineProps({
  slug: { type: String, default: '' },
})

const layoutConfig = inject('layoutConfig', ref(null))
const pageConfig = computed(() => {
  const defaults = { gridColumns: 3, postsPerPage: 9, layout: 'grid' }
  const bc = layoutConfig.value?.pageConfigs?.blog
  return bc ? { ...defaults, ...bc } : defaults
})

const posts = ref([])
const loading = ref(true)
const currentPost = ref(null)
const loadingDetail = ref(false)
const comments = ref([])
const submitting = ref(false)
const commentForm = ref({ author_name: '', body: '' })

const currentSlug = computed(() => props.slug || route.params.slug || '')

function stripHtml(html) {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function loadPosts() {
  loading.value = true
  try {
    const res = await apiFetch('/blog/posts')
    posts.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    posts.value = []
  }
  loading.value = false
}

async function loadPost(slug) {
  loadingDetail.value = true
  currentPost.value = null
  comments.value = []
  try {
    const post = await apiFetch(`/blog/posts/${slug}`)
    currentPost.value = post
    if (post?.title) {
      document.title = `${post.title} — Blog`
      setPageSeo({
        title: post.title + ' — Blog',
        description: stripHtml(post.excerpt || post.body).slice(0, 160),
      })
    }
    // Load comments
    try {
      const res = await apiFetch(`/blog/comments/${post.id}`)
      comments.value = Array.isArray(res) ? res : (res?.data || [])
    } catch { comments.value = [] }
  } catch {
    currentPost.value = null
  }
  loadingDetail.value = false
}

async function submitComment() {
  if (!commentForm.value.author_name || !commentForm.value.body || !currentPost.value) return
  submitting.value = true
  try {
    await apiPost('/blog/comments', {
      content_id: currentPost.value.id,
      author_name: commentForm.value.author_name,
      body: commentForm.value.body,
    })
    commentForm.value = { author_name: '', body: '' }
    // Reload comments
    const res = await apiFetch(`/blog/comments/${currentPost.value.id}`)
    comments.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('[Blog] Comment submit failed:', e)
  }
  submitting.value = false
}

onMounted(() => {
  if (currentSlug.value) {
    loadPost(currentSlug.value)
  } else {
    loadPosts()
    setPageSeo({ title: 'Blog', description: 'Tin tức, hướng dẫn và chia sẻ hữu ích' })
  }
})

watch(currentSlug, (slug) => {
  if (slug) {
    loadPost(slug)
  } else {
    loadPosts()
  }
})
</script>

<style scoped>
.blog-page { padding: 24px 0 60px; }

.blog-header { margin-bottom: 32px; }
.blog-header h1 {
  font-size: 32px; font-weight: 900; margin: 0 0 8px;
  display: flex; align-items: center; gap: 12px; color: var(--sf-text-primary);
}
.blog-header__icon { color: var(--sf-accent); }
.blog-header__desc { font-size: 15px; color: var(--sf-text-muted); margin: 0; }

/* Grid */
.blog-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
}
.blog-grid--cols-2 { grid-template-columns: repeat(2, 1fr); }
.blog-grid--cols-3 { grid-template-columns: repeat(3, 1fr); }
.blog-grid--cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Card */
.blog-card {
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg); overflow: hidden; cursor: pointer;
  transition: all var(--sf-transition);
}
.blog-card:hover {
  transform: translateY(-4px); box-shadow: var(--sf-shadow-md);
  border-color: var(--sf-accent-light);
}
.blog-card--skeleton { pointer-events: none; }
.blog-card__img-wrap { position: relative; }
.blog-card__img { width: 100%; aspect-ratio: 16/9; object-fit: cover; display: block; }
.blog-card__img--empty {
  display: flex; align-items: center; justify-content: center;
  background: var(--sf-accent-glow); color: var(--sf-accent);
}
.blog-card__category {
  position: absolute; top: 12px; left: 12px;
  background: var(--sf-accent); color: #fff; padding: 2px 10px;
  border-radius: 20px; font-size: 11px; font-weight: 600;
}
.blog-card__body { padding: 16px; }
.blog-card__title {
  font-size: 17px; font-weight: 700; margin: 0 0 8px;
  color: var(--sf-text-primary); line-height: 1.3;
  display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.blog-card__excerpt {
  font-size: 13px; color: var(--sf-text-muted); margin: 0 0 12px; line-height: 1.5;
  display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.blog-card__meta {
  display: flex; align-items: center; gap: 16px;
  font-size: 12px; color: var(--sf-text-muted);
}
.blog-card__meta time, .blog-card__author {
  display: flex; align-items: center; gap: 4px;
}

/* Detail */
.breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-muted); margin-bottom: 24px;
}
.breadcrumb a { color: var(--sf-text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--sf-accent-light); }
.breadcrumb span { color: var(--sf-text-primary); font-weight: 600; }

.blog-detail { max-width: 840px; margin: 0 auto; }
.blog-detail__header { margin-bottom: 24px; }
.blog-detail__header h1 { font-size: 32px; font-weight: 900; line-height: 1.2; margin: 0 0 12px; color: var(--sf-text-primary); }
.blog-detail__meta {
  display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  font-size: 13px; color: var(--sf-text-muted);
}
.blog-detail__meta time, .blog-detail__meta span {
  display: flex; align-items: center; gap: 4px;
}
.blog-detail__cat { background: var(--sf-accent-glow); color: var(--sf-accent); padding: 2px 10px; border-radius: 12px; }

.blog-detail__banner { margin-bottom: 24px; border-radius: var(--sf-radius-lg); overflow: hidden; }
.blog-detail__banner img { width: 100%; aspect-ratio: 21/9; object-fit: cover; }

.blog-detail__content { font-size: 16px; line-height: 1.8; color: var(--sf-text-secondary); margin-bottom: 40px; }
.blog-detail__content :deep(h2) { font-size: 22px; font-weight: 800; margin: 32px 0 12px; color: var(--sf-text-primary); }
.blog-detail__content :deep(h3) { font-size: 18px; font-weight: 700; margin: 24px 0 8px; color: var(--sf-text-primary); }
.blog-detail__content :deep(p) { margin: 0 0 16px; }
.blog-detail__content :deep(img) { border-radius: var(--sf-radius-md); margin: 16px 0; max-width: 100%; }
.blog-detail__content :deep(blockquote) {
  border-left: 3px solid var(--sf-accent); padding: 12px 20px;
  margin: 16px 0; background: var(--sf-accent-glow); border-radius: 0 var(--sf-radius-sm) var(--sf-radius-sm) 0;
  font-style: italic;
}

/* Comments */
.blog-comments { margin-top: 40px; padding-top: 32px; border-top: 1px solid var(--sf-border); }
.blog-comments h3 {
  font-size: 20px; font-weight: 700; margin: 0 0 20px;
  display: flex; align-items: center; gap: 8px; color: var(--sf-text-primary);
}

.comment-form { margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
.comment-input, .comment-textarea {
  width: 100%; padding: 10px 14px; border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-md); background: var(--sf-bg-card);
  color: var(--sf-text-primary); font-size: 14px; font-family: inherit;
  transition: border-color var(--sf-transition);
}
.comment-input:focus, .comment-textarea:focus {
  outline: none; border-color: var(--sf-accent);
}
.comment-textarea { resize: vertical; min-height: 80px; }

.comment-item {
  display: flex; gap: 12px; padding: 16px 0;
  border-bottom: 1px solid var(--sf-border);
}
.comment-item__avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: var(--sf-accent-glow); color: var(--sf-accent);
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px;
}
.comment-item__body { flex: 1; }
.comment-item__top { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
.comment-item__top strong { font-size: 14px; color: var(--sf-text-primary); }
.comment-item__top time { font-size: 12px; color: var(--sf-text-muted); }
.comment-item__body p { font-size: 14px; color: var(--sf-text-secondary); margin: 0; line-height: 1.5; }

.blog-detail__back { margin-top: 32px; }

/* Empty */
.blog-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 80px 20px; color: var(--sf-text-muted); text-align: center;
}
.blog-empty h3 { color: var(--sf-text-primary); margin: 0; }
.blog-empty p { margin: 0; }

/* Loading */
.blog-detail-loading { max-width: 840px; margin: 0 auto; padding-top: 24px; }

.btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: var(--sf-radius-md); font-weight: 600; font-size: 14px; cursor: pointer; transition: all var(--sf-transition); border: none; text-decoration: none; }
.btn--primary { background: var(--sf-accent); color: #fff; }
.btn--primary:hover { opacity: 0.9; }
.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
.btn--outline { background: transparent; border: 1px solid var(--sf-border); color: var(--sf-text-secondary); }
.btn--outline:hover { border-color: var(--sf-accent); color: var(--sf-accent); }
.btn--sm { padding: 8px 16px; font-size: 13px; }

.skeleton {
  background: linear-gradient(90deg, var(--sf-bg-card) 25%, var(--sf-border) 50%, var(--sf-bg-card) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: var(--sf-radius-sm);
}
@keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

@media (max-width: 1024px) {
  .blog-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 640px) {
  .blog-grid { grid-template-columns: 1fr; }
  .blog-header h1 { font-size: 24px; }
  .blog-detail__header h1 { font-size: 24px; }
}
</style>
