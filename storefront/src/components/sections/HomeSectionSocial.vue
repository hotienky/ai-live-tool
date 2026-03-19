<template>
  <section class="section-social container">
    <h2 class="section-title">
      <Share2 :size="22" class="section-title__accent" />
      {{ params?.title || t('storefront.section.social_title', 'Theo dõi chúng tôi') }}
    </h2>
    <div class="social-links">
      <a v-for="(link, i) in items" :key="i" :href="link.url" target="_blank" class="social-link">
        <component :is="socialIcons[link.platform] || Globe" :size="20" />
        <span>{{ link.label || link.platform }}</span>
      </a>
    </div>
    <p v-if="!items.length" class="section-empty">{{ t('storefront.section.social_empty', 'Chưa có liên kết mạng xã hội') }}</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Share2, Globe, Facebook, Instagram, Youtube, Twitter, MessageCircle } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const socialIcons = { facebook: Facebook, instagram: Instagram, youtube: Youtube, twitter: Twitter, tiktok: MessageCircle, zalo: MessageCircle }
const items = computed(() => props.content.length ? props.content : [])
</script>

<style scoped>
.section-social { padding-top: 40px; }
.social-links { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
.social-link {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 24px; border-radius: 100px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-primary); text-decoration: none; font-weight: 600; font-size: 14px;
  transition: all var(--sf-transition);
}
.social-link:hover {
  border-color: var(--sf-accent); transform: translateY(-2px);
  box-shadow: var(--sf-shadow-sm); color: var(--sf-accent-light);
}
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
</style>
