<template>
  <div class="spage">
    <button class="spage-back" @click="$emit('back')">
      <ArrowLeft :size="16" /> Quay lại
    </button>

    <article class="spage-article" v-if="page">
      <div class="spage-header">
        <img v-if="page.image" :src="page.image" :alt="page.title" class="spage-cover" />
        <h1 class="spage-title">{{ page.title }}</h1>
        <div class="spage-meta">
          <span v-if="page.created_at"><Calendar :size="12" /> {{ formatDate(page.created_at) }}</span>
        </div>
      </div>
      <div class="spage-content" v-html="page.content"></div>
    </article>

    <div class="spage-loading" v-else-if="loading">
      <Loader2 :size="24" class="spin" /> Đang tải...
    </div>
    <div class="spage-error" v-else>
      <FileX :size="40" />
      <p>Không tìm thấy trang</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ArrowLeft, Calendar, Loader2, FileX } from 'lucide-vue-next'
import { API_BASE } from '../config.js'

const props = defineProps({
  storeId: { type: [String, Number], required: true },
  pageId: { type: [String, Number], required: true },
})
defineEmits(['back'])

const page = ref(null)
const loading = ref(true)

function formatDate(d) {
  return new Date(d).toLocaleDateString('vi-VN', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function loadPage() {
  loading.value = true
  try {
    const res = await fetch(`${API_BASE}/storefront/pages/${props.pageId}`, { headers: { 'Accept': 'application/json' } })
    if (!res.ok) throw new Error('Not found')
    page.value = await res.json()
  } catch { page.value = null }
  loading.value = false
}

onMounted(() => loadPage())
watch(() => props.pageId, () => loadPage())
</script>

<style scoped>
.spage { min-height: 100vh; background: var(--color-bg-primary); color: var(--color-text-primary); padding: 24px; max-width: 800px; margin: 0 auto; }
.spage-back { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; margin-bottom: 24px; transition: all 0.2s; }
.spage-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.spage-header { margin-bottom: 32px; }
.spage-cover { width: 100%; max-height: 400px; object-fit: cover; border-radius: 16px; margin-bottom: 20px; }
.spage-title { font-size: 32px; font-weight: 800; line-height: 1.2; margin: 0 0 12px; }
.spage-meta { display: flex; gap: 16px; font-size: 13px; color: var(--color-text-muted); }
.spage-meta span { display: flex; align-items: center; gap: 4px; }

.spage-content { font-size: 16px; line-height: 1.8; color: var(--color-text-secondary); }
.spage-content :deep(h2) { font-size: 22px; font-weight: 700; margin: 32px 0 12px; color: var(--color-text-primary); }
.spage-content :deep(h3) { font-size: 18px; font-weight: 700; margin: 24px 0 8px; color: var(--color-text-primary); }
.spage-content :deep(p) { margin: 0 0 16px; }
.spage-content :deep(img) { max-width: 100%; border-radius: 12px; margin: 16px 0; }
.spage-content :deep(a) { color: var(--color-accent-primary); text-decoration: underline; }
.spage-content :deep(ul), .spage-content :deep(ol) { padding-left: 24px; margin: 0 0 16px; }
.spage-content :deep(blockquote) { border-left: 3px solid var(--color-accent-primary); padding: 12px 20px; margin: 16px 0; background: var(--color-bg-card); border-radius: 0 8px 8px 0; color: var(--color-text-secondary); }

.spage-loading, .spage-error { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 80px; color: var(--color-text-muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
