<template>
  <div class="storefront-app">
    <PromoBar v-if="!isPreviewMode" />
    <SiteHeader v-if="!isPreviewMode" :storeName="storeInfo?.shop_name" />
    <main class="storefront-main" :class="{ 'storefront-main--preview': isPreviewMode }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <ErrorBoundary>
            <component :is="Component" />
          </ErrorBoundary>
        </transition>
      </router-view>
    </main>
    <SiteFooter v-if="!isPreviewMode" :storeName="storeInfo?.shop_name" />
    <SfToastContainer />
    <BackToTop />
    <RouteLoader />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, provide, onErrorCaptured } from 'vue'
import { apiFetch } from './api.js'
import { setInstalledModules, setEnabledPages, setActiveTemplate } from './router.js'
import { loadStorefrontPlugins, useStorefrontPlugins } from './composables/useStorefrontPlugins.js'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import SfToastContainer from './components/SfToastContainer.vue'
import BackToTop from './components/BackToTop.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import RouteLoader from './components/RouteLoader.vue'
import PromoBar from './components/PromoBar.vue'
import { useTheme } from './composables/useTheme.js'
import { useI18n } from './composables/useI18n.js'
import { useRouter } from 'vue-router'

import { useSeo } from './composables/useSeo.js'

// Global error handler (B19) — prevent entire app from crashing
onErrorCaptured((err, instance, info) => {
  console.error('[Storefront Error]', err, info)
  return false // prevent propagation
})

const { init: initTheme } = useTheme()
const { init: initI18n } = useI18n()
const { setOrganizationSeo } = useSeo()
const { pluginSections, pluginRoutes } = useStorefrontPlugins()
const router = useRouter()

const storeInfo = ref(null)
const layoutConfig = ref(null)
const headerConfig = ref({})
const footerConfig = ref({})
const navLinks = ref([])
const installedModules = ref([])

// Preview mode: read layout from URL query param
const urlParams = new URLSearchParams(window.location.search)
const previewParam = urlParams.get('preview_layout')
const isPreviewMode = !!previewParam

async function loadSiteConfig() {
  // In preview mode, read from URL param
  if (isPreviewMode && previewParam) {
    try {
      const json = decodeURIComponent(escape(atob(previewParam)))
      const parsed = JSON.parse(json)
      layoutConfig.value = {
        sections: parsed.sections || [],
        pages: parsed.pages || {},
        pageConfigs: parsed.pageConfigs || {},
        template: parsed.template || 'full_store',
        customCss: parsed.customCss || '',
      }
      headerConfig.value = parsed.headerConfig || {}
      footerConfig.value = parsed.footerConfig || {}
      injectCustomCss(layoutConfig.value.customCss)
      return
    } catch { /* fall through to API */ }
  }

  try {
    // Use /site-config mega endpoint — single call for everything
    const config = await apiFetch('/site-config')
    storeInfo.value = config.store || {}
    installedModules.value = config.modules || []
    setInstalledModules(installedModules.value)
    layoutConfig.value = config.layout || {
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
    headerConfig.value = config.layout?.headerConfig || {}
    footerConfig.value = config.layout?.footerConfig || {}
    navLinks.value = config.navLinks || []

    // Enable page toggle route guards
    if (layoutConfig.value?.pages) {
      setEnabledPages(layoutConfig.value.pages)
    }

    // Set active template for route blocking
    setActiveTemplate(layoutConfig.value?.template)

    // Inject custom CSS from layout config
    if (layoutConfig.value?.customCss) {
      injectCustomCss(layoutConfig.value.customCss)
    }

    // Set SEO from store info
    const info = storeInfo.value
    if (info?.shop_name) {
      document.title = info.meta_title || `${info.shop_name} — Cửa hàng trực tuyến`
      if (info.favicon) {
        let link = document.querySelector("link[rel*='icon']") || document.createElement('link')
        link.type = 'image/x-icon'
        link.rel = 'shortcut icon'
        link.href = info.favicon
        document.head.appendChild(link)
      }
      if (info.meta_description || info.description) {
        let meta = document.querySelector('meta[name="description"]') || document.createElement('meta')
        meta.name = 'description'
        meta.content = info.meta_description || info.description
        document.head.appendChild(meta)
      }
      setOrganizationSeo({
        name: info.shop_name,
        description: info.description || '',
        logo: info.logo || '',
      })
    }
  } catch (err) {
    console.error('[Storefront] Failed to load site-config:', err)
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
  // Use allSettled so a failing init (e.g. languages 500) doesn't block others
  await Promise.allSettled([
    loadSiteConfig(),
    initTheme(),
    initI18n(),
  ])

  // After site-config loaded, load storefront plugin bundles
  if (installedModules.value.length > 0) {
    const pluginAssets = layoutConfig.value?.pluginAssets || {}
    await loadStorefrontPlugins(installedModules.value, pluginAssets)

    // Dynamically add plugin-provided routes to the router
    if (pluginRoutes.value.length > 0) {
      for (const route of pluginRoutes.value) {
        router.addRoute(route)
      }
    }
  }
})

// Provide store info, layout config, header/footer config, modules globally
provide('storeInfo', storeInfo)
provide('layoutConfig', layoutConfig)
provide('headerConfig', headerConfig)
provide('footerConfig', footerConfig)
provide('navLinks', navLinks)
provide('installedModules', installedModules)
provide('template', computed(() => layoutConfig.value?.template || 'full_store'))
provide('pluginSections', pluginSections)
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

