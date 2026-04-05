<template>
  <div class="site-header-wrapper">
    <!-- Announcement Bar / Topbar -->
    <div v-if="headerCfg.showAnnouncement || headerCfg.topbarLinks?.length" class="announcement-bar">
      <div class="container announcement-bar__inner">
        <!-- Announcement text (left) -->
        <div class="announcement-bar__main" v-if="headerCfg.announcementText">
          <router-link v-if="headerCfg.announcementLink?.startsWith('/')" :to="headerCfg.announcementLink" class="announcement-bar__link">
            {{ headerCfg.announcementText }} <ArrowRight :size="12" style="margin-left: 4px; vertical-align: middle; display: inline-block;" />
          </router-link>
          <a v-else-if="headerCfg.announcementLink" :href="headerCfg.announcementLink" class="announcement-bar__link">
            {{ headerCfg.announcementText }} <ArrowRight :size="12" style="margin-left: 4px; vertical-align: middle; display: inline-block;" />
          </a>
          <span v-else-if="headerCfg.announcementText">{{ headerCfg.announcementText }}</span>
        </div>
        <!-- Left spacer if no announcement text -->
        <div class="announcement-bar__main" v-else></div>

        <!-- Topbar utility links (right side) -->
        <div v-if="headerCfg.topbarLinks?.length" class="announcement-bar__topbar">
          <template v-for="(lnk, i) in headerCfg.topbarLinks" :key="i">
            <router-link v-if="lnk.url?.startsWith('/')" :to="lnk.url" class="announcement-bar__topbar-link">
              <span v-html="lnk.label"></span>
            </router-link>
            <a v-else :href="lnk.url || '#'" class="announcement-bar__topbar-link">
              <span v-html="lnk.label"></span>
            </a>
          </template>
        </div>
      </div>
    </div>

    <!-- Main Header -->
    <header class="site-header" :class="{ 'site-header--sticky': headerCfg.sticky }" data-section-type="header">
      <div class="site-header__inner container">
        <!-- Logo -->
        <router-link :to="'/'" class="site-header__logo">
          <img v-if="logoUrl" :src="logoUrl" :alt="storeName" class="site-header__logo-img" />
          <Store v-else :size="28" style="color: #fff;" />
          <div v-if="!logoUrl" class="site-header__logo-text">
            <span>NHÀ THUỐC</span>
            <strong>Pharmacity</strong>
          </div>
        </router-link>

        <!-- Danh mục (Category Button) -->
        <div class="site-header__category-btn" @click="mobileMenu = !mobileMenu">
          <LayoutGrid :size="18" />
          <span>Danh mục</span>
          <ChevronDown :size="14" />
        </div>

        <!-- Search Bar (Center) -->
        <div class="site-header__search-desktop" v-if="headerCfg.showSearch !== false && isEcom && !isLanding">
          <input type="text" v-model="searchQuery" :placeholder="t('storefront.search_short', 'Tìm kiếm thuốc, thực phẩm chức năng, thiết bị y tế...')" @keyup.enter="onSearch(); mobileMenu = false" />
          <button class="search-btn" @click="onSearch(); mobileMenu = false">
            <Search :size="20" />
          </button>
        </div>

        <!-- Right Side Icons -->
        <div class="site-header__right">
          <!-- Notification -->
          <button class="site-header__icon-btn">
            <Bell :size="22" />
          </button>

          <!-- Cart -->
          <router-link v-if="pageEnabled.cart && isEcom && !isLanding" :to="'/cart'" class="site-header__icon-btn cart-btn">
            <ShoppingCart :size="22" />
            <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
          </router-link>

          <!-- Auth -->
          <template v-if="(pageEnabled.account || pageEnabled.auth) && (isEcom || isCrm)">
            <router-link :to="isLoggedIn ? '/account' : '/auth'" class="site-header__auth">
              <User :size="24" class="auth-icon" />
              <div class="auth-text">
                <span class="greeting">Xin Chào</span>
                <span class="action">{{ isLoggedIn ? (customer?.first_name || 'Tài khoản') : 'Đăng nhập' }}</span>
              </div>
            </router-link>
          </template>
        </div>

        <!-- Mobile menu toggle -->
        <button class="site-header__menu-btn" @click="mobileMenu = !mobileMenu">
          <Menu v-if="!mobileMenu" :size="22" />
          <X v-else :size="22" />
        </button>
      </div>
      
      <!-- Sub-header: Search Bar Dropdown (Visible on scroll or inner pages) -->
      <div v-if="headerCfg.showSearch && isEcom && !isLanding" class="site-header__search-row">
        <!-- We can conditionally render a search bar below if needed, but Pharmacity keeps it in the banner -->
      </div>
    </header>

    <!-- Mobile menu -->
    <transition name="slide">
      <div v-if="mobileMenu" class="site-header__mobile">
        <router-link
          v-for="link in menuLinks" :key="'m-' + link.id"
          :to="link.url"
          class="site-header__mobile-link"
          @click="mobileMenu = false"
        >
          <component v-if="link.icon && iconMap[link.icon]" :is="iconMap[link.icon]" :size="16" />
          {{ link.name }}
        </router-link>
        <router-link v-if="pageEnabled.cart && isEcom && !isLanding" :to="'/cart'" class="site-header__mobile-link" @click="mobileMenu = false">
          <ShoppingCart :size="16" /> {{ t('storefront.cart') || 'Giỏ hàng' }}
          <span v-if="cartCount > 0" class="cart-badge cart-badge--mobile">{{ cartCount }}</span>
        </router-link>
        <template v-if="(pageEnabled.account || pageEnabled.auth) && (isEcom || isCrm)">
          <router-link v-if="isLoggedIn" :to="'/account'" class="site-header__mobile-link" @click="mobileMenu = false">
            <User :size="16" /> {{ customer?.first_name || t('storefront.account', 'Tài khoản') }}
          </router-link>
          <router-link v-else :to="'/auth'" class="site-header__mobile-link" @click="mobileMenu = false">
            <User :size="16" /> {{ t('storefront.login', 'Đăng nhập') }}
          </router-link>
        </template>
        <div class="site-header__mobile-search">
          <Search :size="16" />
          <input v-model="searchQuery" :placeholder="t('storefront.search_short', 'Tìm kiếm...')" @keyup.enter="onSearch(); mobileMenu = false" />
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { apiFetch } from '../api.js'
import {
  Store, Home, ShoppingBag, ShoppingCart, Search, X, Menu, Globe, Sun, Moon, User,
  Tag, Star, Phone, Info, Heart, Settings, Bell, Mail, MapPin,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye,
  Sparkles, Flame, BadgePercent, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, MoreHorizontal, ChevronDown
} from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useI18n } from '../composables/useI18n.js'
import { useTheme } from '../composables/useTheme.js'
import { useAuth } from '../composables/useAuth.js'
import { useModules } from '../composables/useModules.js'
import { useTemplate } from '../composables/useTemplate.js'

const layoutConfig = inject('layoutConfig', ref(null))
const storeInfo = inject('storeInfo', ref(null))
const providedNavLinks = inject('navLinks', ref([]))
const providedHeaderConfig = inject('headerConfig', ref({}))
const pageEnabled = computed(() => layoutConfig.value?.pages || { cart: true, account: true, auth: true, order_tracking: true, products: true })
const logoUrl = computed(() => storeInfo.value?.logo || '')

// Lucide icon map for dynamic rendering
const iconMap = {
  Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye,
  Sparkles, Flame, BadgePercent, Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon, Menu
}

const { cartCount } = useCart()
const { t, currentLang, languages: i18nLanguages, setLang, init: initI18n } = useI18n()
const { isDark, toggleTheme } = useTheme()
const { isLoggedIn, customer } = useAuth()
const { isEcom, isBlog, isCms, isCrm } = useModules()
const { isLanding } = useTemplate()

// Wishlist count
import { useWishlist } from '../composables/useWishlist.js'
const { wishlistItems } = useWishlist()
const wishlistCount = computed(() => wishlistItems.value?.length || 0)

// Search autocomplete
const suggestions = ref([])
const searchLoading = ref(false)
const showSuggestions = ref(false)
let searchTimer = null

function onSearchInput() {
  clearTimeout(searchTimer)
  const q = searchQuery.value.trim()
  if (q.length < 2) { suggestions.value = []; return }
  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}&per_page=5`)
      suggestions.value = res?.data || []
    } catch { suggestions.value = [] }
    searchLoading.value = false
  }, 300)
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false; showSuggestions.value = false }, 200)
}

const headerCfg = computed(() => {
  const defaults = { logoPosition: 'left', maxNavLinks: 5, showSearch: true, sticky: true, showThemeToggle: true }
  // Provide headerConfig from App.vue updates in real-time in preview
  const hc = providedHeaderConfig.value && Object.keys(providedHeaderConfig.value).length > 0
    ? providedHeaderConfig.value
    : layoutConfig.value?.headerConfig
  return hc ? { ...defaults, ...hc } : defaults
})

const langOpen = ref(false)
async function switchLang(code) {
  await setLang(code)
  langOpen.value = false
  // Reload the page to re-fetch all data with new Accept-Language header
  window.location.reload()
}
onMounted(() => initI18n())

const props = defineProps({
  storeName: { type: String, default: '' },
})

const router = useRouter()
const route = useRoute()
const searchQuery = ref('')
const searchFocused = ref(false)
const mobileMenu = ref(false)

// Dynamic nav links — use provided from site-config or fetch as fallback
const navLinks = ref([])

// Fallback links if API returns empty — dynamic based on installed modules + template
const fallbackLinks = computed(() => {
  const links = [
    { id: 'f1', name: t('storefront.home', 'Trang chủ'), url: '/', icon: 'Home', sort: 1 },
  ]
  // Landing template: no product links (even if ecom installed)
  if (isEcom.value && !isLanding.value) {
    links.push({ id: 'f2', name: t('storefront.products', 'Sản phẩm'), url: '/products', icon: 'ShoppingBag', sort: 2 })
  }
  // Catalog/minimal: no blog links
  if (isBlog.value && !isLanding.value) {
    links.push({ id: 'f3', name: 'Blog', url: '/blog', icon: 'BookOpen', sort: 3 })
  }
  return links
})

const MAX_VISIBLE = computed(() => headerCfg.value.maxNavLinks)
const moreOpen = ref(false)
const moreDropdownRef = ref(null)

const menuLinks = computed(() => {
  // Priority: headerConfig.navLinks (configured in CMS) > provided navLinks (nav_links table) > locally fetched > fallback
  const configNavLinks = providedHeaderConfig.value?.navLinks
  let links = (configNavLinks && configNavLinks.length > 0)
    ? configNavLinks.map((l, i) => ({ id: l.id || `cfg-${i}`, sort: l.sort ?? i, ...l }))
    : (providedNavLinks.value?.length > 0 ? providedNavLinks.value : (navLinks.value.length > 0 ? navLinks.value : fallbackLinks.value))
  // URLs that belong to specific modules
  const ecomUrls = ['/products', '/product/', '/category/', '/cart', '/checkout', '/order-tracking', '/search', '/categories', '/brands', '/wishlist', '/promotions']
  const blogUrls = ['/blog']
  const filtered = links
    .filter(l => l.is_active !== false && l.group !== 'footer')
    .filter(l => {
      const url = l.url || ''
      // Hide ecom links if ecom module not installed
      if (!isEcom.value && ecomUrls.some(u => url === u || url.startsWith(u))) return false
      // Hide blog links if blog module not installed
      if (!isBlog.value && blogUrls.some(u => url === u || url.startsWith(u))) return false
      return true
    })
  return filtered.sort((a, b) => (a.sort || 0) - (b.sort || 0))
})

const visibleLinks = computed(() => menuLinks.value.slice(0, MAX_VISIBLE.value))
const overflowLinks = computed(() => menuLinks.value.slice(MAX_VISIBLE.value))
const overflowHasActive = computed(() => overflowLinks.value.some(l => isActiveLink(l.url)))

function isActiveLink(url) {
  if (url === '/') return route.path === '/'
  return route.path.startsWith(url)
}

// Close "More" dropdown on outside click
function onClickOutside(e) {
  if (moreDropdownRef.value && !moreDropdownRef.value.contains(e.target)) {
    moreOpen.value = false
  }
}

async function loadNavLinks() {
  try {
    const data = await apiFetch('/nav-links')
    navLinks.value = Array.isArray(data) ? data : []
  } catch { /* use fallback */ }
}

function onSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'products', query: { q: searchQuery.value } })
    mobileMenu.value = false
  }
}

onMounted(() => {
  loadNavLinks()
  document.addEventListener('click', onClickOutside)
})
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
/* Topbar / Announcement Bar */
.announcement-bar {
  background: #ffffff !important;
  color: #3f4b53 !important;
  font-size: 13px;
  font-weight: 500;
  border-bottom: 1px solid #e5e7eb;
  z-index: 101;
  position: relative;
  height: 38px;
  display: flex;
  align-items: center;
}
.announcement-bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.announcement-bar__main {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #004694;
}
.announcement-bar__link {
  color: inherit;
  text-decoration: none;
  font-weight: 600;
}
.announcement-bar__link:hover { text-decoration: underline; }
.announcement-bar__topbar {
  display: flex;
  align-items: center;
  gap: 24px;
}
.announcement-bar__topbar-link {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #3f4b53;
  text-decoration: none;
  transition: color 0.2s;
  font-size: 13px;
  white-space: nowrap;
}
.announcement-bar__topbar-link:hover {
  color: #004694;
}

/* Base Wrapper for sticky */
.site-header-wrapper {
  position: relative;
  z-index: 100;
}

/* Main Header Container */
.site-header {
  background: #004694 !important;
  color: #ffffff;
  z-index: 100;
  position: relative;
  height: 72px;
  display: flex;
  align-items: center;
}
.site-header--sticky {
  position: sticky;
  top: 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 100%;
  height: 100%;
}

/* Logo */
.site-header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
  color: #ffffff;
}
.site-header__logo-img {
  height: 40px;
  width: auto;
  object-fit: contain;
}
.site-header__logo-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
  line-height: 1;
}
.site-header__logo-text span {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
  margin-bottom: 2px;
}
.site-header__logo-text strong {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.5px;
}

/* Danh mục Button */
.site-header__category-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 12px;
  height: 36px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  background: transparent;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  margin-left: 8px;
  margin-right: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}
.site-header__category-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Center Search Bar */
.site-header__search-desktop {
  display: flex;
  flex: 1;
  max-width: 500px;
  background: #ffffff;
  border-radius: 999px;
  padding: 4px;
  align-items: center;
  margin: 0 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.site-header__search-desktop input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 8px 16px;
  font-size: 14px;
  color: #111827;
  outline: none;
}
.site-header__search-desktop input::placeholder {
  color: #9ca3af;
}
.site-header__search-desktop .search-btn {
  background: #004694;
  color: #ffffff;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.site-header__search-desktop .search-btn:hover {
  background: #00357a;
}

/* Right Side Tools */
.site-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
  flex-shrink: 0;
}

/* Icon Buttons */
.site-header__icon-btn {
  background: transparent;
  border: none;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
  text-decoration: none;
}
.site-header__icon-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* Cart Badge */
.cart-badge {
  position: absolute;
  top: -4px;
  right: -8px;
  background: #ffab00 !important; /* Pharmacity Yellow */
  color: #ffffff !important;
  font-size: 11px;
  font-weight: 800;
  padding: 0 5px;
  height: 18px;
  line-height: normal;
  border-radius: 9px;
  border: 2px solid #004694;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
}

/* Auth Box */
.site-header__auth {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: #ffffff;
  padding: 6px 10px;
  border-radius: 8px;
  transition: background 0.2s;
  white-space: nowrap;
}
.site-header__auth:hover {
  background: rgba(255, 255, 255, 0.15);
}
.auth-icon {
  flex-shrink: 0;
}
.auth-text {
  display: flex;
  flex-direction: column;
  line-height: 1.25;
}
.auth-text .greeting {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.9;
}
.auth-text .action {
  font-size: 14px;
  font-weight: 600;
}

.site-header__menu-btn { display: none; background: transparent; border: none; color: #fff; cursor: pointer; padding: 6px;}

/* Mobile menu */
.site-header__mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 90;
}

.site-header__mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.site-header__mobile-link:hover {
  background: #f3f4f6;
  color: #004694;
}

.site-header__mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: 8px;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  color: #6b7280;
  margin-top: 8px;
}

.site-header__mobile-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: #111827;
  font-size: 14px;
}

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

/* Mobile Adjustments */
@media (max-width: 1024px) {
  .site-header__nav { display: none; }
  .site-header__category-btn { display: none; }
}

@media (max-width: 768px) {
  .announcement-bar { display: none; }
  .site-header { height: 60px; }
  .site-header__logo-img { height: 32px; }
  .site-header__auth { display: none; }
  .site-header__menu-btn { display: block; }
}
</style>
