<template>
  <section class="section-video container">
    <h2 class="section-title" v-if="params?.title">
      <Video :size="22" class="section-title__accent" />
      {{ params.title }}
    </h2>
    <div class="video-grid">
      <div v-for="(v, i) in items" :key="i" class="video-item">
        <div class="video-embed" v-html="getEmbed(v.url)"></div>
        <p v-if="v.caption" class="video-caption">{{ v.caption }}</p>
      </div>
    </div>
    <p v-if="!items.length" class="section-empty">{{ t('storefront.section.video_empty', 'Chưa có video nào') }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Video } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const items = computed(() => props.content.length ? props.content : [])

function getEmbed(url) {
  if (!url) return ''
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (ytMatch) return `<iframe src="https://www.youtube.com/embed/${ytMatch[1]}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:12px"></iframe>`
  // TikTok — just link
  if (url.includes('tiktok.com')) return `<a href="${url}" target="_blank" style="color:var(--sf-accent-light)">${t('storefront.section.video_tiktok', 'Xem trên TikTok')}</a>`
  return `<iframe src="${url}" frameborder="0" allowfullscreen style="width:100%;aspect-ratio:16/9;border-radius:12px"></iframe>`
}
</script>

<style scoped>
.section-video { padding-top: 40px; }
.video-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(400px, 1fr)); gap: 16px; }
.video-item { border-radius: var(--sf-radius-md); overflow: hidden; }
.video-caption { font-size: 13px; color: var(--sf-text-secondary); margin: 8px 0 0; }
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
@media (max-width: 768px) { .video-grid { grid-template-columns: 1fr; } }
</style>
