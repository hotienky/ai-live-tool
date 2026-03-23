<template>
  <div v-if="loading" class="bbr-loading">
    <div class="skeleton" style="height:200px" v-for="n in 3" :key="n"></div>
  </div>
  <div v-else-if="posts.length" class="bbr-grid" :class="`bbr-grid--${settings?.layout || 'grid'}`">
    <router-link
      v-for="post in posts"
      :key="post.id"
      :to="`/blog/${post.slug || post.id}`"
      class="bbr-card"
    >
      <div class="bbr-card__thumb">
        <img v-if="post.thumbnail || post.image" :src="post.thumbnail || post.image" :alt="post.title" />
        <div v-else class="bbr-card__thumb--empty"><BookOpen :size="28" /></div>
      </div>
      <div class="bbr-card__body">
        <span v-if="post.category_name" class="bbr-card__cat">{{ post.category_name }}</span>
        <h3 class="bbr-card__title">{{ post.title }}</h3>
        <p v-if="post.excerpt || post.summary" class="bbr-card__excerpt">
          {{ (post.excerpt || post.summary || '').slice(0, 100) }}{{ (post.excerpt || post.summary || '').length > 100 ? '...' : '' }}
        </p>
        <span class="bbr-card__date">{{ formatDate(post.published_at || post.created_at) }}</span>
      </div>
    </router-link>
  </div>
  <p v-else class="bbr-empty">Không có bài viết</p>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../../api.js'
import { BookOpen } from 'lucide-vue-next'

const props = defineProps({
  settings: { type: Object, default: () => ({}) },
})

const posts = ref([])
const loading = ref(true)

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const params = { limit: props.settings?.limit || 6 }
    if (props.settings?.category_id) params.category_id = props.settings.category_id
    if (props.settings?.sort) params.sort = props.settings.sort

    const res = await apiFetch('/blog/posts', params)
    posts.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.settings, load, { deep: true })
</script>

<style scoped>
.bbr-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}
.bbr-grid--list {
  grid-template-columns: 1fr;
}
.bbr-grid--list .bbr-card {
  flex-direction: row;
  gap: 16px;
}
.bbr-grid--list .bbr-card__thumb {
  width: 140px;
  aspect-ratio: 4/3;
  flex-shrink: 0;
}

.bbr-card {
  display: flex;
  flex-direction: column;
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg, 12px);
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: transform .2s, box-shadow .2s;
}
.bbr-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--sf-shadow-md);
}
.bbr-card__thumb {
  width: 100%;
  aspect-ratio: 16/9;
  overflow: hidden;
}
.bbr-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform .3s;
}
.bbr-card:hover .bbr-card__thumb img { transform: scale(1.04); }
.bbr-card__thumb--empty {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sf-accent-glow);
  color: var(--sf-accent);
}
.bbr-card__body { padding: 16px; flex: 1; display: flex; flex-direction: column; gap: 6px; }
.bbr-card__cat { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: var(--sf-accent); }
.bbr-card__title { font-size: 15px; font-weight: 700; color: var(--sf-text-primary); margin: 0; line-height: 1.4; }
.bbr-card__excerpt { font-size: 13px; color: var(--sf-text-muted); margin: 0; line-height: 1.5; flex: 1; }
.bbr-card__date { font-size: 12px; color: var(--sf-text-muted); margin-top: auto; }

.bbr-loading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.bbr-empty { color: var(--sf-text-muted); text-align: center; padding: 24px; }

@media (max-width: 768px) {
  .bbr-grid { grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .bbr-loading { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .bbr-grid { grid-template-columns: 1fr; }
}
</style>
