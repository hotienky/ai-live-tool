<template>
  <section class="sf-section sf-content-section" v-if="hasContent">
    <h3 class="sf-section__title" v-if="config.title">{{ config.title }}</h3>
    <!-- Testimonials -->
    <div v-if="type === 'testimonials'" class="sf-testimonials" :style="gridStyle">
      <div v-for="(item, i) in content" :key="i" class="sf-testimonial-card">
        <div class="sf-testimonial-stars">
          <span v-for="s in (item.rating || 5)" :key="s" class="star">★</span>
        </div>
        <p class="sf-testimonial-text">{{ item.text }}</p>
        <div class="sf-testimonial-author">
          <img v-if="item.avatar" :src="item.avatar" class="sf-testimonial-avatar" />
          <span>{{ item.name }}</span>
        </div>
      </div>
    </div>

    <!-- FAQ -->
    <div v-else-if="type === 'faq'" class="sf-faq">
      <details v-for="(item, i) in content" :key="i" class="sf-faq-item">
        <summary>{{ item.question }}</summary>
        <p>{{ item.answer }}</p>
      </details>
    </div>

    <!-- Image Gallery -->
    <div v-else-if="type === 'image_gallery'" class="sf-gallery" :style="gridStyle">
      <div v-for="(item, i) in content" :key="i" class="sf-gallery-item" @click="openLightbox(i)">
        <img :src="item.url" :alt="item.caption || ''" loading="lazy" />
        <span class="sf-gallery-caption" v-if="item.caption">{{ item.caption }}</span>
      </div>
    </div>

    <!-- Video Embed -->
    <div v-else-if="type === 'video_embed'" class="sf-videos">
      <div v-for="(item, i) in content" :key="i" class="sf-video-item">
        <iframe v-if="embedUrl(item.url)" :src="embedUrl(item.url)" frameborder="0" allowfullscreen class="sf-video-frame"></iframe>
        <p v-if="item.caption" class="sf-video-caption">{{ item.caption }}</p>
      </div>
    </div>

    <!-- Text Block -->
    <div v-else-if="type === 'text_block'" class="sf-text-block" v-html="typeof content === 'string' ? content : ''"></div>

    <!-- Newsletter -->
    <div v-else-if="type === 'newsletter'" class="sf-newsletter">
      <p class="sf-newsletter-sub" v-if="config.subtitle">{{ config.subtitle }}</p>
      <form class="sf-newsletter-form" @submit.prevent="onSubscribe">
        <input type="email" v-model="email" :placeholder="t('admin.msg_1bd44d', 'Email của bạn...')" required />
        <button type="submit">{{ config.buttonText || t('admin.msg_0bb0951d', 'Đăng ký') }}</button>
      </form>
      <p v-if="subscribed" class="sf-newsletter-ok">{{ t('admin.msg_15d03db9', '✓ Đăng ký thành công!') }}</p>
    </div>

    <!-- Brands Slider -->
    <div v-else-if="type === 'brands_slider'" class="sf-brands">
      <div v-for="brand in brands" :key="brand.id" class="sf-brand-item">
        <img v-if="brand.image" :src="brand.image" :alt="brand.name" />
        <span v-else>{{ brand.name }}</span>
      </div>
    </div>

    <!-- Social Feed -->
    <div v-else-if="type === 'social_feed'" class="sf-social">
      <a v-for="(item, i) in content" :key="i" :href="item.url" target="_blank" class="sf-social-link">
        {{ item.label || item.platform || 'Link' }}
      </a>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  type: { type: String, required: true },
  content: { type: [Array, String, Object], default: () => [] },
  config: { type: Object, default: () => ({}) },
  brands: { type: Array, default: () => [] },
})

const email = ref('')
const subscribed = ref(false)

const columns = computed(() => props.config.columns || 3)
const gridStyle = computed(() => ({ gridTemplateColumns: `repeat(${columns.value}, 1fr)` }))

const hasContent = computed(() => {
  if (props.type === 'text_block') return typeof props.content === 'string' && props.content.length > 0
  if (props.type === 'newsletter') return true
  if (props.type === 'brands_slider') return props.brands?.length > 0
  return Array.isArray(props.content) && props.content.length > 0
})

function embedUrl(url) {
  if (!url) return null
  // YouTube
  let m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  // Already an embed URL
  if (url.includes('/embed/')) return url
  return url
}

function openLightbox(idx) {
  // Simple lightbox — open image in new tab for now
  if (Array.isArray(props.content) && props.content[idx]?.url) {
    window.open(props.content[idx].url, '_blank')
  }
}

async function onSubscribe() {
  try {
    const res = await fetch('/api/storefront/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email.value }),
    })
    if (res.ok) subscribed.value = true
  } catch { /* ignore */ }
}
</script>

<style scoped>
.sf-section { padding: 24px; }
.sf-section__title { font-size: 20px; font-weight: 700; margin: 0 0 16px; text-align: center; }

/* Testimonials */
.sf-testimonials { display: grid; gap: 16px; }
.sf-testimonial-card {
  padding: 20px; border-radius: 14px; background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.1)); text-align: center;
}
.sf-testimonial-stars { color: #f59e0b; font-size: 16px; margin-bottom: 8px; letter-spacing: 2px; }
.sf-testimonial-text { font-size: 14px; color: var(--color-text-secondary, #3f3f46); line-height: 1.6; margin: 0 0 12px; font-style: italic; }
.sf-testimonial-author { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 13px; font-weight: 600; }
.sf-testimonial-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }

/* FAQ */
.sf-faq { max-width: 720px; margin: 0 auto; }
.sf-faq-item {
  border: 1px solid var(--color-border, rgba(0,0,0,0.1)); border-radius: 12px;
  margin-bottom: 8px; overflow: hidden; background: var(--color-bg-card, #fff);
}
.sf-faq-item summary {
  padding: 14px 18px; font-size: 14px; font-weight: 600; cursor: pointer;
  list-style: none; display: flex; align-items: center; justify-content: space-between;
}
.sf-faq-item summary::after { content: '+'; font-size: 18px; color: var(--color-text-muted); }
.sf-faq-item[open] summary::after { content: '−'; }
.sf-faq-item p { padding: 0 18px 14px; font-size: 13px; color: var(--color-text-secondary, #3f3f46); line-height: 1.6; margin: 0; }

/* Image Gallery */
.sf-gallery { display: grid; gap: 12px; }
.sf-gallery-item { border-radius: 12px; overflow: hidden; cursor: pointer; position: relative; }
.sf-gallery-item img { width: 100%; aspect-ratio: 1; object-fit: cover; transition: transform 0.3s; }
.sf-gallery-item:hover img { transform: scale(1.05); }
.sf-gallery-caption {
  position: absolute; bottom: 0; left: 0; right: 0; padding: 8px 12px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6)); color: #fff; font-size: 12px;
}

/* Video */
.sf-videos { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
.sf-video-item { border-radius: 12px; overflow: hidden; background: var(--color-bg-card, #fff); border: 1px solid var(--color-border); }
.sf-video-frame { width: 100%; aspect-ratio: 16/9; }
.sf-video-caption { padding: 10px 14px; font-size: 13px; color: var(--color-text-secondary); margin: 0; }

/* Text Block */
.sf-text-block { max-width: 800px; margin: 0 auto; line-height: 1.7; font-size: 15px; color: var(--color-text-secondary, #3f3f46); }
.sf-text-block :deep(h1), .sf-text-block :deep(h2), .sf-text-block :deep(h3) { color: var(--color-text-primary); margin: 0 0 12px; }
.sf-text-block :deep(p) { margin: 0 0 12px; }

/* Newsletter */
.sf-newsletter { text-align: center; max-width: 520px; margin: 0 auto; padding: 32px 24px; border-radius: 16px; background: var(--color-bg-card, #fff); border: 1px solid var(--color-border); }
.sf-newsletter-sub { font-size: 14px; color: var(--color-text-muted); margin: 0 0 16px; }
.sf-newsletter-form { display: flex; gap: 8px; }
.sf-newsletter-form input {
  flex: 1; padding: 12px 16px; border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  border-radius: 10px; font-size: 14px; outline: none; background: var(--color-bg-primary, #f5f6fa);
}
.sf-newsletter-form input:focus { border-color: var(--color-accent-primary, #7c3aed); }
.sf-newsletter-form button {
  padding: 12px 24px; border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
  background: var(--color-accent-primary, #7c3aed); color: #fff; cursor: pointer; transition: opacity 0.2s;
}
.sf-newsletter-form button:hover { opacity: 0.9; }
.sf-newsletter-ok { color: #22c55e; font-size: 14px; font-weight: 600; margin: 12px 0 0; }

/* Brands */
.sf-brands { display: flex; gap: 24px; align-items: center; justify-content: center; flex-wrap: wrap; padding: 16px 0; }
.sf-brand-item { display: flex; align-items: center; justify-content: center; }
.sf-brand-item img { height: 40px; max-width: 120px; object-fit: contain; filter: grayscale(100%); opacity: 0.6; transition: all 0.3s; }
.sf-brand-item:hover img { filter: none; opacity: 1; }
.sf-brand-item span { font-size: 14px; font-weight: 600; color: var(--color-text-muted); }

/* Social */
.sf-social { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.sf-social-link {
  padding: 10px 20px; border-radius: 10px; border: 1px solid var(--color-border);
  background: var(--color-bg-card, #fff); color: var(--color-text-secondary); font-size: 13px;
  font-weight: 600; text-decoration: none; transition: all 0.2s;
}
.sf-social-link:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

@media (max-width: 768px) {
  .sf-section { padding: 16px; }
  .sf-testimonials, .sf-gallery { grid-template-columns: 1fr !important; }
  .sf-newsletter-form { flex-direction: column; }
  .sf-videos { grid-template-columns: 1fr; }
}
</style>
