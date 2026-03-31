<template>
  <div class="cms-page">
    <!-- Breadcrumb (chỉ hiển thị cho trang static) -->
    <nav class="breadcrumb container" v-if="page && !page.is_dynamic" style="margin-top: 24px">
      <router-link :to="'/'">{{ t('storefront.home') || 'Trang chủ' }}</router-link>
      <ChevronRight :size="12" />
      <span>{{ page.title || '...' }}</span>
    </nav>

    <!-- Loading -->
    <div v-if="loading" class="cms-loading container" style="margin-top: 24px">
      <div class="skeleton" style="height:32px;width:60%;margin-bottom:16px"></div>
      <div class="skeleton" style="height:200px;width:100%"></div>
    </div>

    <!-- Page Content -->
    <div v-else-if="page">

      <!--
        ─── DYNAMIC PAGE — UI ENGINE RENDERER ───────────────────────────────
        P2 – UI render từ JSON layout (không hardcode).
        P3 – SectionRenderer chỉ render component có trong registry.
        P5 – Data đã được inject server-side qua LayoutResolver;
             component không fetch API riêng.
      -->
      <div v-if="page.is_dynamic && activeSections.length > 0" class="dynamic-page-wrap">
        <h1 class="sr-only">{{ page.title }}</h1>
        <SectionRenderer
          v-for="(section, index) in activeSections"
          :key="section.id || `${section.type}-${index}`"
          :section="section"
        />
      </div>

      <!-- ─── STATIC PAGE (WYSIWYG) ── -->
      <article v-else-if="!page.is_dynamic" class="cms-article container">
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
        <!-- P9 – ShortcodeRenderer dùng DOMPurify sanitize, không render v-html trực tiếp -->
        <ShortcodeRenderer class="cms-body" :html="page.content" />
      </article>

    </div>

    <!-- Not Found -->
    <div v-else class="cms-404 container" style="margin-top: 24px">
      <FileQuestion :size="64" />
      <h2>{{ t('storefront.page_not_found') || 'Trang không tồn tại' }}</h2>
      <router-link :to="'/'" class="btn btn--primary">
        <ArrowLeft :size="16" /> {{ t('storefront.back_home') || 'Về trang chủ' }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { apiFetch } from '../api.js'
import { useSeo } from '../composables/useSeo.js'
import { useI18n } from '../composables/useI18n.js'
import { ChevronRight, Calendar, FileQuestion, ArrowLeft } from 'lucide-vue-next'
import SectionRenderer from '../components/SectionRenderer.vue'
import ShortcodeRenderer from '../components/ShortcodeRenderer.vue'
import { inject } from 'vue'

const { t } = useI18n()
const { setPageSeo } = useSeo()

const layoutConfig = inject('layoutConfig', ref(null))
const isPreviewMode = inject('isPreviewMode', false)

const props = defineProps({
  slug: { type: String, required: true },
})

const page = ref(null)
const loading = ref(true)

/**
 * P2 – Render từ JSON layout:
 * Hỗ trợ cả hai format:
 *   - New block-builder: { version: '1.0', blocks: [...] }
 *   - Old Shopify-style: [ { type, enabled, order, params }, ... ]
 *
 * Blocks/sections đã có data được inject bởi LayoutResolver (BFF).
 * Không cần fetch thêm API trong component.
 */
const activeSections = computed(() => {
  if (isPreviewMode && layoutConfig.value?.sections) {
    return [...layoutConfig.value.sections].filter(s => s.enabled).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  if (!page.value?.layout_data) return []

  const ld = page.value.layout_data

  // New builder format: { version, blocks }
  if (ld && typeof ld === 'object' && !Array.isArray(ld) && ld.version && Array.isArray(ld.blocks)) {
    return [...ld.blocks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  // Old Shopify-style: [ {...}, {...} ]
  if (Array.isArray(ld)) {
    return ld.filter(s => s.enabled).sort((a, b) => a.order - b.order)
  }

  return []
})

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * P5 – BFF: backend đã resolve data cho layout_data trước khi trả về.
 * Component chỉ fetch dữ liệu của TRANG (page metadata), không fetch dependency.
 */
async function loadPage() {
  loading.value = true
  try {
    page.value = await apiFetch(`/pages/${props.slug}`)

    if (page.value?.title) {
      setPageSeo({
        title: page.value.title + ' — ' + (page.value.meta_title || 'Trang'),
        description: page.value.meta_description
          || page.value.content?.replace(/<[^>]*>/g, '').slice(0, 160)
          || '',
        keywords: page.value.meta_keywords || '',
      })
    }
  } catch (err) {
    console.error('[CmsPage] Load failed:', err)
    page.value = null
  }
  loading.value = false
}

onMounted(() => loadPage())
watch(() => props.slug, () => loadPage())
</script>

<style scoped>
.cms-page { padding-bottom: 60px; }
.dynamic-page-wrap { padding-top: 0; }

.breadcrumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-muted); margin-bottom: 24px;
}
.breadcrumb a { color: var(--sf-text-secondary); text-decoration: none; }
.breadcrumb a:hover { color: var(--sf-accent-light); }
.breadcrumb span { color: var(--sf-text-primary); font-weight: 600; }

.cms-article { max-width: 840px; margin: 0 auto; padding-top: 24px; }
.cms-header { margin-bottom: 24px; }
.cms-header h1 { font-size: 32px; font-weight: 900; line-height: 1.2; margin: 0 0 8px; }

.cms-date {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: var(--sf-text-muted);
}

.cms-banner { margin-bottom: 24px; border-radius: var(--sf-radius-lg); overflow: hidden; }
.cms-banner img { width: 100%; aspect-ratio: 21/9; object-fit: cover; }

.cms-body { font-size: 16px; line-height: 1.8; color: var(--sf-text-secondary); }
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

.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

@media (max-width: 768px) {
  .cms-header h1 { font-size: 24px; }
  .cms-body { font-size: 15px; }
}
</style>
