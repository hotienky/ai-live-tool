<template>
  <div class="storefront-app">
    <SiteHeader v-if="!isPreviewMode" :storeName="storeInfo?.shop_name" />
    <main class="storefront-main" :class="{ 'storefront-main--preview': isPreviewMode }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <SiteFooter v-if="!isPreviewMode" :storeName="storeInfo?.shop_name" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide, onErrorCaptured } from 'vue'
import { apiFetch } from './api.js'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useTheme } from './composables/useTheme.js'
import { useI18n } from './composables/useI18n.js'

import { useSeo } from './composables/useSeo.js'

// Global error handler (B19) — prevent entire app from crashing
onErrorCaptured((err, instance, info) => {
  console.error('[Storefront Error]', err, info)
  return false // prevent propagation
})

const { init: initTheme } = useTheme()
const { init: initI18n } = useI18n()
const { setOrganizationSeo } = useSeo()

const storeInfo = ref(null)
const layoutConfig = ref(null)

// Preview mode: read layout from URL query param
const urlParams = new URLSearchParams(window.location.search)
const previewParam = urlParams.get('preview_layout')
const isPreviewMode = !!previewParam

async function loadStoreInfo() {
  try {
    storeInfo.value = await apiFetch('/info')
    const info = storeInfo.value
    if (info?.shop_name) {
      document.title = info.meta_title || `${info.shop_name} — Cửa hàng trực tuyến`
      // Favicon
      if (info.favicon) {
        let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = info.favicon
        document.head.appendChild(link)
      }
      // Meta description
      if (info.meta_description || info.description) {
        let meta = document.querySelector('meta[name="description"]') || document.createElement('meta')
        meta.name = 'description'
        meta.content = info.meta_description || info.description
        document.head.appendChild(meta)
      }
      // C2: Organization JSON-LD
      setOrganizationSeo({
        name: info.shop_name,
        description: info.description || '',
        logo: info.logo || '',
      })
    }
  } catch { /* ignore */ }
}

async function loadLayoutConfig() {
  // In preview mode, read from URL param
  if (isPreviewMode && previewParam) {
    try {
      const json = decodeURIComponent(escape(atob(previewParam)))
      const parsed = JSON.parse(json)
      layoutConfig.value = {
        sections: parsed.sections || [],
        pages: parsed.pages || {},
        template: parsed.template || 'full_store',
        customCss: parsed.customCss || '',
      }
      injectCustomCss(layoutConfig.value.customCss)
      return
    } catch { /* fall through to API */ }
  }

  try {
    layoutConfig.value = await apiFetch('/storefront-layout')
    if (layoutConfig.value?.customCss) {
      injectCustomCss(layoutConfig.value.customCss)
    }
  } catch {
    layoutConfig.value = {
      sections: [
        { type: 'banner', enabled: true, order: 0 },
        { type: 'categories', enabled: true, order: 1 },
        { type: 'flash_sale', enabled: true, order: 2 },
        { type: 'featured_products', enabled: true, order: 3 },
        { type: 'new_arrivals', enabled: true, order: 4 },
        { type: 'cms_pages', enabled: true, order: 5 },
      ],
      pages: { cart: true, account: true, auth: true, order_tracking: true, products: true },
      template: 'full_store',
    }
  }
}

// Inject custom CSS
let customStyleEl = null
function injectCustomCss(css) {
  if (!css) return
  if (customStyleEl) customStyleEl.remove()
  customStyleEl = document.createElement('style')
  customStyleEl.setAttribute('data-custom-layout', '')
  customStyleEl.textContent = css
  document.head.appendChild(customStyleEl)
}

onMounted(async () => {
  await Promise.all([
    loadStoreInfo(),
    loadLayoutConfig(),
    initTheme(),
    initI18n(),
  ])
})

// Provide store info and layout config globally
provide('storeInfo', storeInfo)
provide('layoutConfig', layoutConfig)
</script>

<style scoped>
.storefront-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.storefront-main {
  flex: 1;
  padding-top: var(--sf-header-height);
}
.storefront-main--preview {
  padding-top: 0;
}
</style>

