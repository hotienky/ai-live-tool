<template>
  <div class="cms-page container">
    <!-- Breadcrumb -->
    <nav class="breadcrumb">
      <router-link :to="'/'">Trang chủ</router-link>
      <ChevronRight :size="12" />
      <span>{{ page?.title || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="cms-loading">
      <div class="skeleton" style="height:32px;width:60%;margin-bottom:16px"></div>
      <div class="skeleton" style="height:200px;width:100%"></div>
    </div>

    <!-- Page Content -->
    <article v-else-if="page" class="cms-article">
      <header class="cms-header">
        <h1>{{ page.title }}</h1>
        <time v-if="page.created_at" class="cms-date">
          <Calendar :size="14" />
          {{ formatDate(page.created_at) }}
        </time>
      </header>
      <div class="cms-banner" v-if="page.image">
        <img :src="page.image" :alt="page.title" />
      </div>
      <div class="cms-body" v-html="page.content"></div>
    </article>

    <!-- Not Found -->
    <div v-else class="cms-404">
      <FileQuestion :size="64" />
      <h2>Trang không tồn tại</h2>
      <router-link :to="'/'" class="btn btn--primary">
        <ArrowLeft :size="16" /> Về trang chủ
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../api.js'
import { ChevronRight, Calendar, FileQuestion, ArrowLeft } from 'lucide-vue-next'

const props = defineProps({
  
  pageId: { type: String, required: true },
})

const page = ref(null)
const loading = ref(true)

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

async function loadPage() {
  loading.value = true
  try {
    page.value = await apiFetch(`/pages/${props.pageId}`)
    if (page.value?.title) {
      document.title = `${page.value.title} — Cửa hàng`
    }
  } catch {
    page.value = null
  }
  loading.value = false
}

onMounted(() => loadPage())
watch(() => props.pageId, () => loadPage())
</script>

<style scoped>
.cms-page { padding-top: 24px; padding-bottom: 60px; }

.breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-muted); margin-bottom: 24px;
}
.breadcrumb a { color: var(--sf-text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--sf-accent-light); }
.breadcrumb span { color: var(--sf-text-primary); font-weight: 600; }

.cms-article {
  max-width: 840px;
  margin: 0 auto;
}

.cms-header { margin-bottom: 24px; }
.cms-header h1 { font-size: 32px; font-weight: 900; line-height: 1.2; margin: 0 0 8px; }

.cms-date {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--sf-text-muted);
}

.cms-banner { margin-bottom: 24px; border-radius: var(--sf-radius-lg); overflow: hidden; }
.cms-banner img { width: 100%; aspect-ratio: 21/9; object-fit: cover; }

.cms-body {
  font-size: 16px; line-height: 1.8; color: var(--sf-text-secondary);
}
.cms-body :deep(h2) { font-size: 22px; font-weight: 800; margin: 32px 0 12px; color: var(--sf-text-primary); }
.cms-body :deep(h3) { font-size: 18px; font-weight: 700; margin: 24px 0 8px; color: var(--sf-text-primary); }
.cms-body :deep(p) { margin: 0 0 16px; }
.cms-body :deep(img) { border-radius: var(--sf-radius-md); margin: 16px 0; }
.cms-body :deep(ul), .cms-body :deep(ol) { padding-left: 24px; margin: 0 0 16px; }
.cms-body :deep(a) { color: var(--sf-accent-light); }
.cms-body :deep(a:hover) { text-decoration: underline; }
.cms-body :deep(blockquote) {
  border-left: 3px solid var(--sf-accent); padding: 12px 20px;
  margin: 16px 0; background: var(--sf-accent-glow); border-radius: 0 var(--sf-radius-sm) var(--sf-radius-sm) 0;
  font-style: italic; color: var(--sf-text-secondary);
}

.cms-loading { max-width: 840px; margin: 0 auto; }

.cms-404 {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 100px; color: var(--sf-text-muted); text-align: center;
}
.cms-404 h2 { color: var(--sf-text-primary); }
.cms-404 a { text-decoration: none; }

@media (max-width: 768px) {
  .cms-header h1 { font-size: 24px; }
  .cms-body { font-size: 15px; }
}
</style>
