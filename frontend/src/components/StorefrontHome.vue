<template>
  <div class="sf" :style="customCssVars">
    <!-- Announcement / Top Utility Bar -->
    <div class="sf-announcement-border" v-if="activeHeaderConfig.showAnnouncement" :style="{ backgroundColor: activeHeaderConfig.announcementBg || 'var(--sf-accent)', color: activeHeaderConfig.announcementColor || '#fff' }">
      <div class="sf-announcement-inner" style="max-width: var(--sf-container-width, 1200px); margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 4px 16px; font-size: 11px; font-weight: 500;">
        <div class="sf-announcement__text" style="flex: 1;">
          <a v-if="activeHeaderConfig.announcementLink" :href="activeHeaderConfig.announcementLink" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
            {{ activeHeaderConfig.announcementText || t('customize_announcement') }}
          </a>
          <span v-else>{{ activeHeaderConfig.announcementText || t('customize_announcement') }}</span>
        </div>
        <div class="sf-announcement__topbar" v-if="activeHeaderConfig.topbarLinks && activeHeaderConfig.topbarLinks.length" style="display: flex; gap: 16px; align-items: center;">
          <a v-for="(lnk, idx) in activeHeaderConfig.topbarLinks" :key="idx" :href="lnk.url || '#'" class="sf-announcement__toplink" style="color: inherit; text-decoration: none; display: flex; align-items: center; gap: 4px; opacity: 0.9; cursor: pointer;">
            {{ lnk.label }}
          </a>
        </div>
      </div>
    </div>

    <!-- Header -->
    <header class="sf-header" :class="{ 'sf-header--sticky': activeHeaderConfig.sticky !== false, 'sf-header--branded': !!activeHeaderConfig.bgColor }" :style="activeHeaderConfig.bgColor ? { background: activeHeaderConfig.bgColor, color: activeHeaderConfig.textColor || '#fff', borderBottom: 'none' } : {}">
      <button class="sf-hamburger" @click="mobileMenuOpen = !mobileMenuOpen">
        <Menu :size="20" />
      </button>
      <div class="sf-header__left">
        <Store :size="20" class="sf-header__logo-icon" />
        <span class="sf-header__name">{{ storeInfo?.store_name || storeInfo?.shop_name || 'Shop' }}</span>
      </div>
      <!-- Desktop Nav -->
      <nav class="sf-nav sf-nav--desktop" v-if="navLinks.length > 0">
        <a v-for="link in visibleNavLinks" :key="link.id" :href="link.url" :target="link.target || '_self'" class="sf-nav__link">
          {{ link.name }}
        </a>
      </nav>
      <div class="sf-header__search" v-if="activeHeaderConfig.showSearch !== false">
        <Search :size="16" />
        <input v-model="search" type="text" :placeholder="t('search_placeholder')" class="sf-search-input" @keyup.enter="doSearch" />
      </div>
      <div class="sf-header__right">
        <!-- Language Selector (only if >1 language) -->
        <div class="sf-lang-selector" v-if="availableLanguages.length > 1">
          <select v-model="currentLocale" @change="onLocaleChange" class="sf-lang-select">
            <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
              {{ lang.code.toUpperCase() }} — {{ lang.name }}
            </option>
          </select>
        </div>
        <button class="sf-header__btn" @click="$emit('navigate', 'cart')">
          <ShoppingCart :size="18" />
          <span class="sf-cart-count" v-if="cartCount > 0">{{ cartCount }}</span>
        </button>
        <button class="sf-header__btn" @click="$emit('navigate', 'account')">
          <User :size="18" />
        </button>
      </div>
    </header>

    <!-- Mobile Nav Drawer -->
    <transition name="sf-drawer">
      <div class="sf-mobile-overlay" v-if="mobileMenuOpen" @click="mobileMenuOpen = false">
        <nav class="sf-mobile-nav" @click.stop>
          <div class="sf-mobile-nav__header">
            <Store :size="18" class="sf-header__logo-icon" />
            <span class="sf-header__name">{{ storeInfo?.store_name || storeInfo?.shop_name || 'Shop' }}</span>
            <button class="sf-mobile-nav__close" @click="mobileMenuOpen = false"><X :size="18" /></button>
          </div>
          <a v-for="link in visibleNavLinks" :key="link.id" :href="link.url" :target="link.target || '_self'" class="sf-mobile-nav__link" @click="mobileMenuOpen = false">
            {{ link.name }}
          </a>
          <div class="sf-mobile-nav__divider"></div>
          <a class="sf-mobile-nav__link" href="#" @click.prevent="$emit('navigate', 'cart'); mobileMenuOpen = false">
            <ShoppingCart :size="16" /> {{ t('cart') }}
          </a>
          <a class="sf-mobile-nav__link" href="#" @click.prevent="$emit('navigate', 'account'); mobileMenuOpen = false">
            <User :size="16" /> {{ t('account') }}
          </a>
        </nav>
      </div>
    </transition>

    <!-- Loading State -->
    <div class="sf-loading" v-if="loading">
      <Loader2 :size="32" class="spin" />
      <p>{{ t('loading') }}</p>
    </div>

    <!-- Dynamic Section Renderer -->
    <template v-else>
      <div v-for="(section, idx) in enabledSections" :key="section.id || section.type" :data-builder-id="section.id" :data-section-type="section.type" :data-section-index="idx" class="sf-section-wrapper">
        <!-- Banner -->
        <SfBannerSection
          v-if="section.type === 'banner'"
          :banners="sectionData.banners"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
        />

        <!-- Pharmacy Hero -->
        <SfPharmacyHeroSection
          v-if="section.type === 'pharmacy_hero'"
          :config="{ ...(section.params || {}), _content: section.content || [] }"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
        />

        <!-- Categories -->
        <SfCategoriesSection
          v-if="section.type === 'categories'"
          :categories="sectionData.categories"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          @select="onCategorySelect"
        />

        <!-- Flash Sale -->
        <SfFlashSaleSection
          v-if="section.type === 'flash_sale'"
          :products="sectionData.flashSaleProducts"
          :end-time="sectionData.flashSaleEndTime"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          @viewProduct="(id) => $emit('viewProduct', id)"
        />

        <!-- Featured Products -->
        <SfProductGridSection
          v-if="section.type === 'featured_products'"
          :products="sectionData.featuredProducts"
          :title="section.params?.title || t('featured_products')"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          @viewProduct="(id) => $emit('viewProduct', id)"
        />

        <!-- New Arrivals -->
        <SfProductGridSection
          v-if="section.type === 'new_arrivals'"
          :products="sectionData.newArrivals"
          :title="section.params?.title || t('new_arrivals')"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          @viewProduct="(id) => $emit('viewProduct', id)"
        />

        <!-- CMS Pages -->
        <SfCmsPagesSection
          v-if="section.type === 'cms_pages'"
          :pages="sectionData.pages"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          @viewPage="(id) => $emit('viewPage', id)"
        />

        <!-- Blog Posts -->
        <SfBlogSection
          v-if="section.type === 'blog'"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          :storeId="storeId"
          @viewPost="(slug) => $emit('navigate', 'blog-post', slug)"
          @viewAll="$emit('navigate', 'blog')"
        />

        <!-- Content-driven sections: testimonials, faq, gallery, video, text, newsletter, brands, social -->
        <SfContentSection
          v-else-if="contentSectionTypes.includes(section.type)"
          :type="section.type"
          :content="section.content || []"
          :config="section.params || {}"
          :tablet-config="section.tabletParams || {}"
          :mobile-config="section.mobileParams || {}"
          :brands="sectionData.brands"
        />

        <!-- Grid / Image Banner Layout -->
        <div
          v-else-if="section.type === 'grid'"
          class="sf-grid-section"
          :style="{ display: 'grid', gridTemplateColumns: `repeat(${section.params?.columns || 2}, 1fr)`, gap: `${section.params?.gap || 16}px` }"
        >
          <template v-for="(item, gi) in (section.content || [])" :key="gi">
            <a v-if="item.type === 'image_banner'" :href="item.params?.link || '#'" class="sf-grid-banner" style="display: block; border-radius: var(--sf-radius-md, 12px); overflow: hidden;">
              <img :src="item.params?.desktopImage || ''" :alt="item.params?.title || ''" style="width: 100%; height: auto; display: block;" loading="lazy" />
            </a>
          </template>
        </div>

        <!-- Trust Badges -->
        <div
          v-else-if="section.type === 'trust_badges'"
          class="sf-trust-section"
          :style="{ background: section.params?.background || '#f8f9fa', padding: '24px', borderRadius: 'var(--sf-radius-lg, 16px)' }"
        >
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div v-for="(badge, bi) in (section.content || [])" :key="bi" class="sf-trust-badge" style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border-radius: var(--sf-radius-md, 12px); box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
              <img v-if="badge.icon" :src="badge.icon" :alt="badge.title" style="width: 40px; height: 40px; object-fit: contain;" />
              <div>
                <div style="font-weight: 700; font-size: 14px;">{{ badge.title }}</div>
                <div style="font-size: 12px; color: #6b7280;">{{ badge.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Fallback mocked block for cart, checkout, auth, account, wishlist etc. -->
        <SfMockSection v-else :section="section" :index="idx" />
      </div>
    </template>

    <!-- Footer -->
    <footer class="sf-footer">
      <div class="sf-footer__columns" v-if="activeFooterConfig.columns?.length">
        <div v-for="(col, i) in activeFooterConfig.columns" :key="i" class="sf-footer__col">
          <h5>{{ col.title }}</h5>
          <template v-if="col.type === 'links'">
            <a v-for="(link, j) in (col.links || [])" :key="j" :href="link.url" class="sf-footer__link">{{ link.label }}</a>
          </template>
          <template v-if="col.type === 'contact'">
            <p v-for="(item, j) in (col.items || [])" :key="j" class="sf-footer__contact">{{ item.label ? (item.label + ': ' + item.value) : item.value }}</p>
          </template>
        </div>
      </div>
      <div class="sf-footer__bottom">
        <p>{{ activeFooterConfig.copyrightText || `© ${new Date().getFullYear()} ${storeInfo?.store_name || storeInfo?.shop_name || 'Shop'}. Powered by KAC company` }}</p>
      </div>
    </footer>

    <!-- Custom CSS injection -->
    <component :is="'style'" v-if="customCss">{{ customCss }}</component>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, defineAsyncComponent } from 'vue'
import { Store, Search, ShoppingCart, User, Loader2, Menu, X } from 'lucide-vue-next'
import { API_BASE } from '../config.js'

// Section components (Lazy Loaded)
const SfBannerSection = defineAsyncComponent(() => import('./storefront/SfBannerSection.vue'))
const SfCategoriesSection = defineAsyncComponent(() => import('./storefront/SfCategoriesSection.vue'))
const SfProductGridSection = defineAsyncComponent(() => import('./storefront/SfProductGridSection.vue'))
const SfFlashSaleSection = defineAsyncComponent(() => import('./storefront/SfFlashSaleSection.vue'))
const SfCmsPagesSection = defineAsyncComponent(() => import('./storefront/SfCmsPagesSection.vue'))
const SfContentSection = defineAsyncComponent(() => import('./storefront/SfContentSection.vue'))
const SfMockSection = defineAsyncComponent(() => import('./storefront/SfMockSection.vue'))
const SfBlogSection = defineAsyncComponent(() => import('./storefront/SfBlogSection.vue'))
const SfPharmacyHeroSection = defineAsyncComponent(() => import('./storefront/SfPharmacyHeroSection.vue'))


const contentSectionTypes = ['testimonials', 'faq', 'image_gallery', 'video_embed', 'text_block', 'newsletter', 'brands_slider', 'social_feed']

const props = defineProps({
  storeId: { type: [String, Number], required: true },
  cartCount: { type: Number, default: 0 },
})
const emit = defineEmits(['viewProduct', 'viewPage', 'navigate'])

// State
const loading = ref(true)
const storeInfo = ref(null)
const search = ref('')
const mobileMenuOpen = ref(false)

// Multi-language
const availableLanguages = ref([])
const currentLocale = ref(localStorage.getItem('sf_locale') || '')

function onLocaleChange() {
  localStorage.setItem('sf_locale', currentLocale.value)
  // Load UI translations for the new locale
  loadUiTranslations()
  // Re-fetch content with new locale
  bootstrap()
}

// ── UI Translations ──
const defaultUiStrings = {
  search_placeholder: 'Tìm sản phẩm...',
  cart: 'Giỏ hàng',
  account: 'Tài khoản',
  loading: 'Đang tải...',
  featured_products: 'Sản phẩm nổi bật',
  new_arrivals: 'Hàng mới về',
  customize_announcement: 'Tùy chỉnh thông báo...',
}
const uiStrings = ref({ ...defaultUiStrings })

function t(key) {
  return uiStrings.value[key] || defaultUiStrings[key] || key
}

async function loadUiTranslations() {
  const locale = currentLocale.value
  if (!locale || availableLanguages.value.length <= 1) {
    uiStrings.value = { ...defaultUiStrings }
    return
  }
  // Check if this is the default language
  const defaultLang = availableLanguages.value.find(l => l.is_default)
  if (defaultLang && defaultLang.code === locale) {
    uiStrings.value = { ...defaultUiStrings }
    return
  }
  try {
    const translations = await sfApiFetch(`/translations/${locale}`)
    if (translations && typeof translations === 'object') {
      // Merge: API translations override defaults
      uiStrings.value = { ...defaultUiStrings, ...translations }
    }
  } catch {
    uiStrings.value = { ...defaultUiStrings }
  }
}

// Layout config from API
const sections = ref([])
const headerConfig = ref({})
const footerConfig = ref({})
const themeConfig = ref({})
const customCss = ref('')
const navLinks = ref([])

// Section data fetched from API
const sectionData = ref({
  banners: [],
  categories: [],
  flashSaleProducts: [],
  flashSaleEndTime: null,
  featuredProducts: [],
  newArrivals: [],
  pages: [],
  brands: [],
})

// Resolve translated objects
function resolveConfig(configInfo) {
  if (!configInfo) return {}
  const lang = currentLocale.value
  const defaultLang = availableLanguages.value.find(l => l.is_default)?.code
  if (!lang || lang === defaultLang) return configInfo

  const trans = configInfo.translations?.[lang]
  if (!trans) return configInfo

  return { ...configInfo, ...trans }
}

const activeHeaderConfig = computed(() => resolveConfig(headerConfig.value))
const activeFooterConfig = computed(() => resolveConfig(footerConfig.value))

// Computed
const enabledSections = computed(() =>
  sections.value
    .filter(s => s.enabled !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map(s => {
       const lang = currentLocale.value
       const defaultLang = availableLanguages.value.find(l => l.is_default)?.code
       if (!lang || lang === defaultLang) return s
       
       const contentTrans = s.translations?.[lang]?.content
       const paramsTrans = s.translations?.[lang]?.params
       
       return {
         ...s,
         content: contentTrans || s.content,
         params: paramsTrans ? { ...s.params, ...paramsTrans } : s.params
       }
    })
)

const visibleNavLinks = computed(() => {
  // Prioritize Nav Links from Header Config (Dynamic synchronization)
  const configLinks = activeHeaderConfig.value.navLinks
  const source = (configLinks && configLinks.length > 0) ? configLinks : (navLinks.value || [])
  
  const max = activeHeaderConfig.value.maxNavLinks || 7
  return source
    .filter(l => l.is_active !== false)
    .slice(0, max)
    .map(l => ({
      ...l,
      name: l.name || l.title || '', // Handle both name (config) and title (table)
      ...resolveConfig(l)
    }))
})

// Color derivation logic
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l } else {
    const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, h + 1/3); g = f(p, q, h); b = f(p, q, h - 1/3)
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function deriveColors(hex) {
  if (!hex || !/^#[0-9a-fA-F]{6}$/.test(hex)) hex = '#7c3aed'
  const rr = parseInt(hex.slice(1, 3), 16)
  const gg = parseInt(hex.slice(3, 5), 16)
  const bb = parseInt(hex.slice(5, 7), 16)
  const hsl = hexToHSL(hex)
  return {
    accent: hex,
    accentLight: hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.min(hsl.l + 15, 85)),
    accentGlow: `rgba(${rr}, ${gg}, ${bb}, 0.15)`,
    accentGradient: `linear-gradient(135deg, ${hex}, ${hslToHex(hsl.h + 15, hsl.s, Math.min(hsl.l + 10, 80))})`,
    shadowAccent: `0 8px 24px rgba(${rr}, ${gg}, ${bb}, 0.25)`,
  }
}

const customCssVars = computed(() => {
  const theme = themeConfig.value
  const mode = theme.mode || 'light'
  const rawAccent = mode === 'dark' ? (theme.dark_accent || theme.accent) : (theme.light_accent || theme.accent)
  const accentHex = /^#[0-9A-Fa-f]{6}$/.test(rawAccent) ? rawAccent : '#7c3aed'
  const colors = deriveColors(accentHex)

  const fontMap = {
    'Inter': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'Roboto': "'Roboto', -apple-system, sans-serif",
    'Outfit': "'Outfit', -apple-system, sans-serif",
    'Plus Jakarta Sans': "'Plus Jakarta Sans', -apple-system, sans-serif",
  }
  const fontFam = fontMap[theme.font] || fontMap['Inter']
  
  const r = parseInt(theme.radius) || 12

  return {
    '--sf-accent': colors.accent,
    '--sf-accent-light': colors.accentLight,
    '--sf-accent-glow': colors.accentGlow,
    '--sf-accent-gradient': colors.accentGradient,
    '--sf-shadow-accent': colors.shadowAccent,
    '--sf-font-family': fontFam,
    '--sf-radius-sm': `${Math.max(r - 4, 4)}px`,
    '--sf-radius-md': `${r}px`,
    '--sf-radius-lg': `${r + 4}px`,
    '--sf-radius-xl': `${r + 8}px`,
    'font-family': fontFam,
  }
})

watch(() => themeConfig.value.font, (newFont) => {
  if (newFont && newFont !== 'Inter') {
    const id = 'sf-admin-google-font'
    let link = document.getElementById(id)
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?family=${newFont.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`
  }
}, { immediate: true })

// API helpers
async function sfApiFetch(path) {
  const headers = { 'Accept': 'application/json' }
  if (currentLocale.value) {
    headers['Accept-Language'] = currentLocale.value
  }
  const res = await fetch(`${API_BASE}/storefront${path}`, { headers })
  const json = await res.json()
  if (json && typeof json === 'object' && 'data' in json && json.type) return json.data
  return json
}

// Bootstrap: fetch site-config + section data in parallel
async function bootstrap() {
  loading.value = true
  try {
    // 1) Fetch mega config
    const config = await sfApiFetch('/site-config')
    storeInfo.value = config.store || {}
    sections.value = config.layout?.sections || []
    headerConfig.value = config.layout?.headerConfig || {}
    footerConfig.value = config.layout?.footerConfig || {}
    customCss.value = config.layout?.customCss || ''
    navLinks.value = config.navLinks || []
    themeConfig.value = config.theme || {}

    // Languages
    if (config.languages && config.languages.length > 0) {
      availableLanguages.value = config.languages
      if (!currentLocale.value) {
        const def = config.languages.find(l => l.is_default)
        currentLocale.value = def?.code || config.languages[0].code
      }
      // Load UI translations for current locale
      loadUiTranslations()
    }
    
    // SEO Meta Update (Phase 4)
    if (storeInfo.value?.shop_name) {
       document.title = storeInfo.value.shop_name;
    }
    if (config.theme?.seo_description) {
       let metaDesc = document.querySelector('meta[name="description"]');
       if (!metaDesc) {
           metaDesc = document.createElement('meta');
           metaDesc.name = "description";
           document.head.appendChild(metaDesc);
       }
       metaDesc.content = config.theme.seo_description;
    }

    // Store categories from config (saves an extra API call)
    sectionData.value.categories = config.categories || []

    // 2) Fetch section-specific data in parallel based on enabled sections
    const enabled = new Set(enabledSections.value.map(s => s.type))
    const fetches = []

    if (enabled.has('banner')) {
      fetches.push(sfApiFetch('/banners').then(d => { sectionData.value.banners = Array.isArray(d) ? d : [] }).catch(() => {}))
    }
    if (enabled.has('flash_sale')) {
      fetches.push(sfApiFetch('/flash-sales/active').then(d => {
        if (d && d.products) {
          sectionData.value.flashSaleProducts = d.products
          sectionData.value.flashSaleEndTime = d.end_time || null
        } else if (Array.isArray(d)) {
          sectionData.value.flashSaleProducts = d
        }
      }).catch(() => {}))
    }
    if (enabled.has('featured_products')) {
      fetches.push(sfApiFetch('/featured-products').then(d => { sectionData.value.featuredProducts = Array.isArray(d) ? d : [] }).catch(() => {}))
    }
    if (enabled.has('new_arrivals')) {
      const count = enabledSections.value.find(s => s.type === 'new_arrivals')?.params?.count || 8
      fetches.push(sfApiFetch(`/products?per_page=${count}&sort_by=newest`).then(d => {
        sectionData.value.newArrivals = Array.isArray(d) ? d : (d?.data || [])
      }).catch(() => {}))
    }
    if (enabled.has('cms_pages')) {
      fetches.push(sfApiFetch('/pages').then(d => { sectionData.value.pages = Array.isArray(d) ? d : [] }).catch(() => {}))
    }
    if (enabled.has('brands_slider')) {
      fetches.push(sfApiFetch('/brands').then(d => { sectionData.value.brands = Array.isArray(d) ? d : [] }).catch(() => {}))
    }

    await Promise.all(fetches)
  } catch (e) {
    console.error('[Storefront] Bootstrap failed:', e)
  }
  loading.value = false
}

function onCategorySelect(cat) {
  // Navigate to category view
  emit('navigate', 'category', cat.id)
}

function doSearch() {
  if (search.value.trim()) {
    emit('navigate', 'search', search.value.trim())
  }
}

import { onUnmounted } from 'vue'

onMounted(() => {
  bootstrap()
  window.addEventListener('message', handleBuilderMessage)
})

onUnmounted(() => {
  window.removeEventListener('message', handleBuilderMessage)
})

function handleBuilderMessage(evt) {
  const { type, payload } = evt.data || {}
  if (type === 'layout-preview-update' && payload?.sections) {
    sections.value = payload.sections
    if (payload.footerConfig) footerConfig.value = payload.footerConfig
    if (payload.headerConfig) headerConfig.value = payload.headerConfig
    if (payload.themeConfig) themeConfig.value = payload.themeConfig
  } else if (type === 'builder:navigate') {
    // Used in live preview to dynamically swap out what we're rendering
    if (payload?.path === '/product/preview-demo') {
      emit('viewProduct', 'preview')
    } else if (payload?.path === '/page/preview-demo') {
      emit('viewPage', 'preview')
    }
  }
}

watch(() => props.storeId, bootstrap)
</script>

<style scoped>
.sf { min-height: 100vh; background: var(--color-bg-primary, #f5f6fa); color: var(--color-text-primary, #18181b); container-type: inline-size; container-name: sf; overflow-x: hidden; }

/* ── Loading ── */
.sf-loading {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 60vh; gap: 12px; color: var(--color-text-muted, #6b6b7b);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Header ── */
.sf-header {
  display: flex; align-items: center; gap: 16px; padding: 12px 24px;
  background: var(--color-header-bg, rgba(255,255,255,0.97)); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.1)); z-index: 50;
}
.sf-header--sticky { position: sticky; top: 0; }
.sf-header__left { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.sf-header__logo-icon { color: var(--sf-accent, #7c3aed); }
.sf-header__name { font-size: 18px; font-weight: 800; background: linear-gradient(135deg, var(--sf-accent, #7c3aed), #ff8c42); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }

/* Hamburger — hidden on desktop */
.sf-hamburger {
  display: none; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  background: transparent; color: var(--color-text-secondary, #3f3f46); cursor: pointer;
}

.sf-nav--desktop { display: flex; gap: 4px; flex: 1; justify-content: center; }
.sf-nav__link {
  padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary, #3f3f46); text-decoration: none; transition: all 0.2s;
}
.sf-nav__link:hover { color: var(--sf-accent, #7c3aed); background: var(--color-accent-glow, rgba(124,58,237,0.08)); }

.sf-header__search {
  flex: 1; max-width: 360px; display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; border-radius: 12px; background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, rgba(0,0,0,0.1)); transition: border-color 0.2s;
}
.sf-header__search:focus-within { border-color: var(--sf-accent, #7c3aed); }
.sf-header__search svg { color: var(--color-text-muted, #6b6b7b); flex-shrink: 0; }
.sf-search-input { flex: 1; border: none; background: transparent; color: var(--color-text-primary, #18181b); font-size: 14px; outline: none; }
.sf-header__right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.sf-header__btn {
  position: relative; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  background: transparent; color: var(--color-text-secondary, #3f3f46); cursor: pointer; transition: all 0.2s;
}
.sf-header__btn:hover { color: var(--sf-accent, #7c3aed); border-color: var(--sf-accent, #7c3aed); }
.sf-cart-count {
  position: absolute; top: -4px; right: -4px; min-width: 18px; height: 18px;
  border-radius: 9px; background: var(--color-accent-hot, #ef4444); color: #fff;
  font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
}

/* Branded Header (custom bgColor set) */
.sf-header--branded .sf-header__name { background: none; -webkit-background-clip: initial; background-clip: initial; -webkit-text-fill-color: #fff; color: #fff; }
.sf-header--branded .sf-header__logo-icon { color: #fff; }
.sf-header--branded .sf-nav__link { color: rgba(255,255,255,0.9); }
.sf-header--branded .sf-nav__link:hover { color: #fff; background: rgba(255,255,255,0.1); }
.sf-header--branded .sf-header__btn { color: #fff; border-color: rgba(255,255,255,0.25); }
.sf-header--branded .sf-header__btn:hover { border-color: #fff; }
.sf-header--branded .sf-hamburger { color: #fff; }
.sf-header--branded .sf-header__search { background: rgba(255,255,255,0.95); }
.sf-header--branded .sf-lang-select { background: rgba(255,255,255,0.15); color: #fff; border-color: rgba(255,255,255,0.25); }

/* Language Selector */
.sf-lang-selector { flex-shrink: 0; }
.sf-lang-select {
  padding: 6px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--color-border, rgba(0,0,0,0.1));
  background: var(--color-bg-card, #fff); color: var(--color-text-primary, #18181b);
  cursor: pointer; outline: none; transition: border-color 0.2s;
}
.sf-lang-select:hover { border-color: var(--sf-accent, #7c3aed); }

/* ── Mobile Nav Drawer ── */
.sf-mobile-overlay {
  position: fixed; inset: 0; z-index: 100; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
}
.sf-mobile-nav {
  position: fixed; top: 0; left: 0; bottom: 0; width: 280px; max-width: 80vw;
  background: var(--color-header-bg, #fff); box-shadow: 4px 0 24px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow-y: auto;
}
.sf-mobile-nav__header {
  display: flex; align-items: center; gap: 8px; padding: 16px 18px; border-bottom: 1px solid var(--color-border, rgba(0,0,0,0.1));
}
.sf-mobile-nav__close {
  margin-left: auto; background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px;
}
.sf-mobile-nav__link {
  display: flex; align-items: center; gap: 10px; padding: 14px 18px; font-size: 14px; font-weight: 600;
  color: var(--color-text-secondary, #3f3f46); text-decoration: none; transition: all 0.2s;
}
.sf-mobile-nav__link:hover { background: var(--color-accent-glow, rgba(124,58,237,0.06)); color: var(--sf-accent, #7c3aed); }
.sf-mobile-nav__divider { height: 1px; background: var(--color-border, rgba(0,0,0,0.1)); margin: 4px 18px; }

/* Drawer transition */
.sf-drawer-enter-active, .sf-drawer-leave-active { transition: opacity 0.25s; }
.sf-drawer-enter-active .sf-mobile-nav, .sf-drawer-leave-active .sf-mobile-nav { transition: transform 0.3s cubic-bezier(.4,0,.2,1); }
.sf-drawer-enter-from, .sf-drawer-leave-to { opacity: 0; }
.sf-drawer-enter-from .sf-mobile-nav, .sf-drawer-leave-to .sf-mobile-nav { transform: translateX(-100%); }

/* ── Footer ── */
.sf-footer {
  border-top: 1px solid var(--color-border, rgba(0,0,0,0.1)); margin-top: 40px; padding: 40px 24px 24px;
  background: var(--color-bg-secondary, #fff);
}
.sf-footer__columns { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 32px; margin-bottom: 24px; }
.sf-footer__col h5 { font-size: 14px; font-weight: 700; margin: 0 0 12px; }
.sf-footer__link { display: block; font-size: 13px; color: var(--color-text-muted, #6b6b7b); text-decoration: none; padding: 3px 0; transition: color 0.2s; }
.sf-footer__link:hover { color: var(--sf-accent, #7c3aed); }
.sf-footer__contact { font-size: 13px; color: var(--color-text-muted, #6b6b7b); margin: 3px 0; }
.sf-footer__bottom { text-align: center; font-size: 12px; color: var(--color-text-muted, #6b6b7b); padding-top: 16px; border-top: 1px solid var(--color-border, rgba(0,0,0,0.1)); }

/* ── Tablet (769px - 1024px) ── */
@media (max-width: 1024px) {
  .sf-header { padding: 12px 18px; gap: 12px; }
  .sf-header__search { max-width: 280px; }
  .sf-nav--desktop { gap: 2px; }
  .sf-nav__link { padding: 6px 10px; font-size: 12px; }
  .sf-footer__columns { gap: 24px; }
}

/* ── Mobile (≤768px) ── */
@media (max-width: 768px) {
  .sf-hamburger { display: flex; }
  .sf-header { padding: 10px 16px; gap: 10px; }
  .sf-nav--desktop { display: none; }
  .sf-header__search { max-width: 100%; flex: 1; }
  .sf-header__name { font-size: 16px; }
  .sf-footer { padding: 24px 16px 16px; }
  .sf-footer__columns { grid-template-columns: 1fr 1fr; gap: 20px; }
}
</style>
