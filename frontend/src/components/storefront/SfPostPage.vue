<template>
  <article class="sf-post" v-if="post">
    <!-- Hero -->
    <header class="sf-post__hero">
      <img v-if="post.featured_image" :src="post.featured_image" :alt="post.title" class="sf-post__hero-img" />
      <div class="sf-post__hero-overlay">
        <div class="sf-post__hero-content">
          <div class="sf-post__categories">
            <span v-for="cat in categories" :key="cat" class="sf-post__category">{{ cat }}</span>
          </div>
          <h1 class="sf-post__title">{{ post.title }}</h1>
          <div class="sf-post__meta">
            <span class="sf-post__author" v-if="post.author_name">
              <User :size="14" /> {{ post.author_name }}
            </span>
            <time class="sf-post__date">
              <Calendar :size="14" /> {{ formatDate(post.published_at) }}
            </time>
            <span class="sf-post__reading" v-if="readingTime">
              <Clock :size="14" /> {{ readingTime }} {{ t('admin.minutes_read', 'phút đọc') }}
            </span>
          </div>
        </div>
      </div>
    </header>

    <!-- Content + Sidebar Layout -->
    <div class="sf-post__layout">
      <!-- Main Content -->
      <div class="sf-post__content">
        <div class="sf-post__body" v-html="post.body"></div>

        <!-- Tags -->
        <div class="sf-post__tags" v-if="tags.length">
          <Tag :size="14" />
          <span v-for="tag in tags" :key="tag" class="sf-post__tag" @click="$emit('filterTag', tag)">
            #{{ tag }}
          </span>
        </div>

        <!-- Social Sharing -->
        <div class="sf-post__share">
          <span class="sf-post__share-label">{{ t('admin.share', 'Chia sẻ') }}:</span>
          <a :href="shareUrl('facebook')" target="_blank" class="sf-post__share-btn sf-post__share-btn--fb" rel="noopener">
            Facebook
          </a>
          <a :href="shareUrl('twitter')" target="_blank" class="sf-post__share-btn sf-post__share-btn--tw" rel="noopener">
            Twitter
          </a>
          <button class="sf-post__share-btn sf-post__share-btn--copy" @click="copyLink">
            {{ copied ? '✓ Copied' : 'Copy Link' }}
          </button>
        </div>

        <!-- Comments Section -->
        <section class="sf-post__comments" v-if="post.meta?.has_comments !== false">
          <h3 class="sf-post__comments-title">
            <MessageCircle :size="18" />
            {{ t('admin.comments', 'Bình luận') }} ({{ comments.length }})
          </h3>

          <!-- Comment Form -->
          <form class="sf-post__comment-form" @submit.prevent="submitComment">
            <input v-model="commentForm.author_name" type="text" :placeholder="t('admin.your_name', 'Tên của bạn')" required class="sf-post__comment-input" />
            <textarea v-model="commentForm.body" :placeholder="t('admin.write_comment', 'Viết bình luận...')" required rows="3" class="sf-post__comment-textarea"></textarea>
            <button type="submit" class="sf-post__comment-submit" :disabled="submitting">
              {{ submitting ? '...' : t('admin.post_comment', 'Gửi bình luận') }}
            </button>
          </form>

          <!-- Comments List -->
          <div class="sf-post__comment-list">
            <div v-for="c in comments" :key="c.id" class="sf-post__comment">
              <div class="sf-post__comment-avatar">{{ (c.author_name || 'A')[0].toUpperCase() }}</div>
              <div class="sf-post__comment-body">
                <div class="sf-post__comment-header">
                  <strong>{{ c.author_name || 'Ẩn danh' }}</strong>
                  <time>{{ formatDate(c.created_at) }}</time>
                </div>
                <p>{{ c.body }}</p>
              </div>
            </div>
            <p v-if="comments.length === 0" class="sf-post__no-comments">
              {{ t('admin.no_comments', 'Chưa có bình luận nào. Hãy là người đầu tiên!') }}
            </p>
          </div>
        </section>
      </div>

      <!-- Sidebar -->
      <SfPostSidebar
        :categories="allCategories"
        :tags="allTags"
        :recentPosts="recentPosts"
        @viewPost="(slug) => $emit('viewPost', slug)"
        @filterCategory="(cat) => $emit('filterCategory', cat)"
        @filterTag="(tag) => $emit('filterTag', tag)"
      />
    </div>
  </article>

  <!-- Loading -->
  <div v-else-if="loading" class="sf-post__loading">
    <Loader2 :size="24" class="spin" />
    <span>{{ t('admin.loading', 'Đang tải...') }}</span>
  </div>

  <!-- Not Found -->
  <div v-else class="sf-post__not-found">
    <FileX :size="48" />
    <h2>{{ t('admin.post_not_found', 'Bài viết không tồn tại') }}</h2>
    <button @click="$emit('goBack')" class="sf-post__back-btn">
      ← {{ t('admin.back_to_blog', 'Quay lại Blog') }}
    </button>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { User, Calendar, Clock, Tag, MessageCircle, Loader2, FileX } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import SfPostSidebar from './SfPostSidebar.vue'

const { t } = useI18n()

const props = defineProps({
  slug: { type: String, required: true },
  storeId: { type: String, default: '' },
})
defineEmits(['viewPost', 'filterCategory', 'filterTag', 'goBack'])

const post = ref(null)
const loading = ref(true)
const comments = ref([])
const recentPosts = ref([])
const allCategories = ref([])
const allTags = ref([])
const copied = ref(false)
const submitting = ref(false)

const commentForm = reactive({ author_name: '', body: '' })

const categories = computed(() => {
  if (!post.value?.taxonomies) return []
  return post.value.taxonomies.filter(t => t.taxonomy === 'category').map(t => t.term)
})

const tags = computed(() => {
  if (!post.value?.taxonomies) return []
  return post.value.taxonomies.filter(t => t.taxonomy === 'tag').map(t => t.term)
})

const readingTime = computed(() => post.value?.meta?.reading_time || null)

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

function shareUrl(platform) {
  const url = encodeURIComponent(window.location.href)
  const title = encodeURIComponent(post.value?.title || '')
  if (platform === 'facebook') return `https://www.facebook.com/sharer/sharer.php?u=${url}`
  if (platform === 'twitter') return `https://twitter.com/intent/tweet?url=${url}&text=${title}`
  return '#'
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch { /* ignore */ }
}

async function fetchPost() {
  loading.value = true
  try {
    const res = await fetch(`/api/storefront/blog/posts/${props.slug}`)
    const data = await res.json()
    post.value = data.data || null

    // Set Open Graph meta
    if (post.value) {
      document.title = post.value.meta?.seo_title || post.value.title
      setMeta('description', post.value.meta?.seo_description || post.value.excerpt || '')
      setMeta('og:title', post.value.title)
      setMeta('og:description', post.value.excerpt || '')
      setMeta('og:type', 'article')
      setMeta('og:url', window.location.href)
      if (post.value.featured_image) setMeta('og:image', post.value.featured_image)
      setMeta('twitter:card', 'summary_large_image')
      setMeta('twitter:title', post.value.title)
      setMeta('twitter:description', post.value.excerpt || '')
    }
  } catch (e) {
    console.warn('[SfPostPage] Failed:', e.message)
    post.value = null
  }
  loading.value = false
}

function setMeta(name, content) {
  const prop = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name'
  let el = document.querySelector(`meta[${prop}="${name}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(prop, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

async function fetchComments() {
  if (!post.value) return
  try {
    const res = await fetch(`/api/storefront/blog/comments/${post.value.id}`)
    const data = await res.json()
    comments.value = data.data || []
  } catch { /* ignore */ }
}

async function fetchSidebarData() {
  try {
    const res = await fetch('/api/storefront/blog/posts?per_page=5')
    const data = await res.json()
    const posts = data.data?.data || data.data || []
    recentPosts.value = posts

    const catSet = new Set()
    const tagSet = new Set()
    for (const p of posts) {
      if (p.taxonomies) {
        for (const tx of p.taxonomies) {
          if (tx.taxonomy === 'category') catSet.add(tx.term)
          if (tx.taxonomy === 'tag') tagSet.add(tx.term)
        }
      }
    }
    allCategories.value = [...catSet]
    allTags.value = [...tagSet]
  } catch { /* ignore */ }
}

async function submitComment() {
  if (!commentForm.body.trim() || !commentForm.author_name.trim()) return
  submitting.value = true
  try {
    const res = await fetch('/api/storefront/blog/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        content_id: post.value.id,
        author_name: commentForm.author_name,
        body: commentForm.body,
      }),
    })
    if (res.ok) {
      commentForm.author_name = ''
      commentForm.body = ''
      await fetchComments()
    }
  } catch { /* ignore */ }
  submitting.value = false
}

watch(() => props.slug, () => {
  fetchPost().then(() => {
    fetchComments()
    fetchSidebarData()
  })
})

onMounted(async () => {
  await fetchPost()
  fetchComments()
  fetchSidebarData()
})
</script>

<style scoped>
/* Hero */
.sf-post__hero { position: relative; min-height: 320px; overflow: hidden; }
.sf-post__hero-img { width: 100%; height: 400px; object-fit: cover; }
.sf-post__hero-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(transparent 30%, rgba(0,0,0,0.75));
  display: flex; align-items: flex-end; padding: 40px;
}
.sf-post__hero-content { max-width: 800px; }
.sf-post__categories { display: flex; gap: 8px; margin-bottom: 12px; }
.sf-post__category {
  padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: 600;
  background: var(--color-accent-primary, #7c3aed); color: #fff;
}
.sf-post__title { font-size: 36px; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.2; }
.sf-post__meta { display: flex; flex-wrap: wrap; gap: 16px; color: rgba(255,255,255,0.8); font-size: 14px; }
.sf-post__meta span, .sf-post__meta time { display: flex; align-items: center; gap: 6px; }

/* Layout */
.sf-post__layout {
  display: grid; grid-template-columns: 1fr 300px; gap: 40px;
  max-width: 1200px; margin: 0 auto; padding: 40px 24px;
}

/* Content */
.sf-post__content { min-width: 0; }
.sf-post__body {
  font-size: 16px; line-height: 1.8;
  color: var(--color-text-secondary, #374151);
}
.sf-post__body :deep(h1),.sf-post__body :deep(h2),.sf-post__body :deep(h3) {
  color: var(--color-text-primary); margin: 24px 0 12px; font-weight: 700;
}
.sf-post__body :deep(p) { margin: 0 0 16px; }
.sf-post__body :deep(img) { max-width: 100%; border-radius: 12px; margin: 16px 0; }
.sf-post__body :deep(blockquote) {
  border-left: 4px solid var(--color-accent-primary, #7c3aed);
  padding: 12px 20px; margin: 16px 0; font-style: italic;
  background: var(--color-bg-secondary, #f9fafb); border-radius: 0 12px 12px 0;
}
.sf-post__body :deep(code) {
  padding: 2px 6px; border-radius: 4px;
  background: var(--color-bg-tertiary, #f3f4f6); font-size: 0.9em;
}
.sf-post__body :deep(pre) {
  padding: 16px; border-radius: 12px;
  background: var(--color-bg-code, #1e1e2e); color: #e5e7eb;
  overflow-x: auto; line-height: 1.5; margin: 16px 0;
}

/* Tags */
.sf-post__tags {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  padding-top: 24px; margin-top: 32px;
  border-top: 1px solid var(--color-border, rgba(0,0,0,0.08));
  color: var(--color-text-muted);
}
.sf-post__tag {
  padding: 4px 12px; border-radius: 16px; font-size: 13px; font-weight: 500;
  background: var(--color-bg-secondary, #f3f4f6);
  color: var(--color-accent-primary, #7c3aed);
  cursor: pointer; transition: all 0.2s;
}
.sf-post__tag:hover { background: var(--color-accent-primary, #7c3aed); color: #fff; }

/* Share */
.sf-post__share {
  display: flex; align-items: center; gap: 10px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid var(--color-border, rgba(0,0,0,0.08));
}
.sf-post__share-label { font-size: 13px; font-weight: 600; color: var(--color-text-muted); }
.sf-post__share-btn {
  padding: 6px 16px; border-radius: 8px; font-size: 12px; font-weight: 600;
  text-decoration: none; cursor: pointer; border: 1px solid var(--color-border); transition: all 0.2s;
  background: transparent; color: var(--color-text-secondary);
}
.sf-post__share-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.sf-post__share-btn--fb:hover { border-color: #1877f2; color: #1877f2; }
.sf-post__share-btn--tw:hover { border-color: #1da1f2; color: #1da1f2; }
.sf-post__share-btn--copy { font-size: 12px; }

/* Comments */
.sf-post__comments { margin-top: 48px; }
.sf-post__comments-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 20px; font-weight: 700; margin: 0 0 24px;
}
.sf-post__comment-form { margin-bottom: 32px; display: flex; flex-direction: column; gap: 12px; }
.sf-post__comment-input,.sf-post__comment-textarea {
  width: 100%; padding: 12px 16px; border-radius: 12px;
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  background: var(--color-bg-secondary, #f9fafb);
  font-size: 14px; color: var(--color-text-primary); resize: vertical;
}
.sf-post__comment-input:focus,.sf-post__comment-textarea:focus {
  border-color: var(--color-accent-primary, #7c3aed); outline: none;
}
.sf-post__comment-submit {
  align-self: flex-start; padding: 10px 24px; border-radius: 10px;
  border: none; font-size: 14px; font-weight: 600;
  background: var(--color-accent-primary, #7c3aed); color: #fff;
  cursor: pointer; transition: opacity 0.2s;
}
.sf-post__comment-submit:hover { opacity: 0.9; }
.sf-post__comment-submit:disabled { opacity: 0.5; cursor: not-allowed; }

.sf-post__comment-list { display: flex; flex-direction: column; gap: 16px; }
.sf-post__comment {
  display: flex; gap: 12px; padding: 16px;
  border-radius: 12px; background: var(--color-bg-secondary, #f9fafb);
}
.sf-post__comment-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  background: linear-gradient(135deg, var(--color-accent-primary, #7c3aed), #a78bfa);
  color: #fff; display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700;
}
.sf-post__comment-body { flex: 1; min-width: 0; }
.sf-post__comment-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px;
}
.sf-post__comment-header strong { font-size: 14px; }
.sf-post__comment-header time { font-size: 12px; color: var(--color-text-muted); }
.sf-post__comment-body p { font-size: 14px; color: var(--color-text-secondary); line-height: 1.5; margin: 0; }
.sf-post__no-comments { font-size: 14px; color: var(--color-text-muted); text-align: center; padding: 32px 0; }

/* Loading / Not Found */
.sf-post__loading {
  display: flex; align-items: center; justify-content: center; gap: 12px;
  padding: 80px 24px; color: var(--color-text-muted); font-size: 16px;
}
.sf-post__not-found {
  text-align: center; padding: 80px 24px; color: var(--color-text-muted);
}
.sf-post__not-found h2 { font-size: 24px; margin: 16px 0; color: var(--color-text-primary); }
.sf-post__back-btn {
  padding: 10px 24px; border-radius: 10px; font-size: 14px; font-weight: 600;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
}
.sf-post__back-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .sf-post__hero-img { height: 250px; }
  .sf-post__hero-overlay { padding: 24px 16px; }
  .sf-post__title { font-size: 24px; }
  .sf-post__layout { grid-template-columns: 1fr; padding: 24px 16px; gap: 24px; }
  .sf-post__meta { gap: 8px; font-size: 12px; }
  .sf-post__share { flex-wrap: wrap; }
}
</style>
