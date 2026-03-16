<template>
  <header class="site-header">
    <div class="site-header__inner container">
      <!-- Logo -->
      <router-link :to="'/'" class="site-header__logo">
        <img v-if="logoUrl" :src="logoUrl" :alt="storeName" class="site-header__logo-img" />
        <Store v-else :size="22" />
        <span class="site-header__name">{{ storeName || 'Shop' }}</span>
      </router-link>

      <!-- Navigation (dynamic from API) -->
      <nav class="site-header__nav">
        <router-link
          v-for="link in visibleLinks" :key="link.id"
          :to="link.url"
          class="site-header__link"
          :class="{ active: isActiveLink(link.url) }"
        >
          <component v-if="link.icon && iconMap[link.icon]" :is="iconMap[link.icon]" :size="15" />
          {{ link.name }}
        </router-link>
        <!-- Overflow "More" dropdown -->
        <div v-if="overflowLinks.length" class="nav-more" ref="moreDropdownRef">
          <button class="site-header__link nav-more__trigger" @click="moreOpen = !moreOpen" :class="{ active: overflowHasActive }">
            <MoreHorizontal :size="15" />
            Thêm
            <ChevronDown :size="12" class="nav-more__arrow" :class="{ rotated: moreOpen }" />
          </button>
          <transition name="dropdown">
            <div v-if="moreOpen" class="nav-more__dropdown">
              <router-link
                v-for="link in overflowLinks" :key="link.id"
                :to="link.url"
                class="nav-more__item"
                :class="{ active: isActiveLink(link.url) }"
                @click="moreOpen = false"
              >
                <component v-if="link.icon && iconMap[link.icon]" :is="iconMap[link.icon]" :size="15" />
                {{ link.name }}
              </router-link>
            </div>
          </transition>
        </div>
      </nav>

      <!-- Search -->
      <div class="site-header__search" :class="{ focused: searchFocused }">
        <Search :size="16" class="site-header__search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keyup.enter="onSearch"
        />
        <button v-if="searchQuery" class="site-header__search-clear" @click="searchQuery = ''">
          <X :size="14" />
        </button>
      </div>

      <!-- Right side: Language → Cart → Auth → Theme -->
      <div class="site-header__right">
        <!-- Language Switcher -->
        <div class="lang-switcher" v-if="i18nLanguages.length > 1">
          <button class="lang-switcher__btn" @click="langOpen = !langOpen">
            <Globe :size="14" />
            <span>{{ (currentLang || 'vi').toUpperCase() }}</span>
          </button>
          <div v-if="langOpen" class="lang-switcher__dropdown">
            <button
              v-for="lang in i18nLanguages" :key="lang.code"
              class="lang-switcher__item"
              :class="{ active: lang.code === currentLang }"
              @click="switchLang(lang.code)"
            >
              <span v-if="lang.icon" class="lang-icon">{{ lang.icon }}</span>
              {{ lang.name }}
            </button>
          </div>
        </div>

        <!-- Cart -->
        <router-link v-if="pageEnabled.cart" :to="'/cart'" class="site-header__cart-btn" active-class="active">
          <ShoppingCart :size="16" />
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
        </router-link>

        <!-- Auth -->
        <template v-if="pageEnabled.account || pageEnabled.auth">
          <router-link v-if="isLoggedIn" :to="'/account'" class="site-header__auth-btn">
            <User :size="16" />
            <span>{{ customer?.first_name || 'Tài khoản' }}</span>
          </router-link>
          <router-link v-else :to="'/auth'" class="site-header__auth-btn">
            <User :size="16" />
            <span>Đăng nhập</span>
          </router-link>
        </template>

        <!-- Theme Toggle -->
        <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Chế độ sáng' : 'Chế độ tối'">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
        </button>
      </div>

      <!-- Mobile menu toggle -->
      <button class="site-header__menu-btn" @click="mobileMenu = !mobileMenu">
        <Menu v-if="!mobileMenu" :size="22" />
        <X v-else :size="22" />
      </button>
    </div>

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
        <router-link v-if="pageEnabled.cart" :to="'/cart'" class="site-header__mobile-link" @click="mobileMenu = false">
          <ShoppingCart :size="16" /> Giỏ hàng
          <span v-if="cartCount > 0" class="cart-badge cart-badge--mobile">{{ cartCount }}</span>
        </router-link>
        <template v-if="pageEnabled.account || pageEnabled.auth">
          <router-link v-if="isLoggedIn" :to="'/account'" class="site-header__mobile-link" @click="mobileMenu = false">
            <User :size="16" /> {{ customer?.first_name || 'Tài khoản' }}
          </router-link>
          <router-link v-else :to="'/auth'" class="site-header__mobile-link" @click="mobileMenu = false">
            <User :size="16" /> Đăng nhập
          </router-link>
        </template>
        <div class="site-header__mobile-search">
          <Search :size="16" />
          <input v-model="searchQuery" placeholder="Tìm kiếm..." @keyup.enter="onSearch(); mobileMenu = false" />
        </div>
      </div>
    </transition>
  </header>
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

const layoutConfig = inject('layoutConfig', ref(null))
const storeInfo = inject('storeInfo', ref(null))
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

const langOpen = ref(false)
async function switchLang(code) {
  await setLang(code)
  langOpen.value = false
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

// Dynamic nav links from API
const navLinks = ref([])

// Fallback links if API returns empty
const fallbackLinks = [
  { id: 'f1', name: 'Trang chủ', url: '/', icon: 'Home', sort: 1 },
  { id: 'f2', name: 'Sản phẩm', url: '/products', icon: 'ShoppingBag', sort: 2 },
]

const MAX_VISIBLE = 5
const moreOpen = ref(false)
const moreDropdownRef = ref(null)

const menuLinks = computed(() => {
  const links = navLinks.value.length > 0 ? navLinks.value : fallbackLinks
  return links
    .filter(l => l.is_active !== false)
    .sort((a, b) => (a.sort || 0) - (b.sort || 0))
})

const visibleLinks = computed(() => menuLinks.value.slice(0, MAX_VISIBLE))
const overflowLinks = computed(() => menuLinks.value.slice(MAX_VISIBLE))
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
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--sf-header-height);
  background: var(--sf-header-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--sf-border);
  transition: background-color 0.3s ease;
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
}

.site-header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__logo svg {
  color: var(--sf-accent-light);
}
.site-header__logo-img {
  width: 28px; height: 28px; border-radius: 6px; object-fit: contain;
}

.site-header__name {
  font-size: 18px;
  font-weight: 800;
  background: var(--sf-accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.site-header__nav {
  display: flex;
  gap: 2px;
  align-items: center;
}

.site-header__link {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: var(--sf-radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-secondary);
  transition: all var(--sf-transition);
  text-decoration: none;
  white-space: nowrap;
  border: none;
  background: none;
  cursor: pointer;
}

.site-header__link:hover {
  color: var(--sf-text-primary);
  background: var(--sf-bg-card-hover);
}

.site-header__link.active {
  color: var(--sf-accent-light);
  background: var(--sf-accent-glow);
}

/* "More" dropdown */
.nav-more {
  position: relative;
}
.nav-more__trigger {
  gap: 4px;
}
.nav-more__arrow {
  transition: transform 0.2s ease;
}
.nav-more__arrow.rotated {
  transform: rotate(180deg);
}
.nav-more__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 200;
  min-width: 200px;
  padding: 6px;
  background: var(--sf-bg-card, #fff);
  border: 1px solid var(--sf-border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}
.nav-more__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-secondary);
  text-decoration: none;
  transition: all 0.15s;
  white-space: nowrap;
}
.nav-more__item:hover {
  background: var(--sf-bg-card-hover);
  color: var(--sf-text-primary);
}
.nav-more__item.active {
  color: var(--sf-accent-light);
  background: var(--sf-accent-glow);
}

/* Dropdown animation */
.dropdown-enter-active { animation: dropIn 0.2s ease; }
.dropdown-leave-active { animation: dropIn 0.15s ease reverse; }
@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.site-header__search {
  flex: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 100px;
  background: var(--sf-input-bg);
  border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
}

.site-header__search.focused {
  border-color: var(--sf-accent);
  background: var(--sf-accent-glow);
  box-shadow: 0 0 0 3px var(--sf-accent-glow);
}

.site-header__search-icon {
  color: var(--sf-text-muted);
  flex-shrink: 0;
}

.site-header__search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--sf-text-primary);
  font-size: 13px;
}

.site-header__search input::placeholder {
  color: var(--sf-text-muted);
}

.site-header__search-clear {
  display: flex;
  background: none;
  border: none;
  color: var(--sf-text-muted);
  padding: 2px;
  cursor: pointer;
}

.site-header__menu-btn {
  display: none;
  background: none;
  border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-sm);
  padding: 6px;
  color: var(--sf-text-secondary);
}

.site-header__mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--sf-bg-secondary);
  border-bottom: 1px solid var(--sf-border);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-header__mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--sf-radius-sm);
  color: var(--sf-text-secondary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.site-header__mobile-link:hover {
  background: var(--sf-bg-card-hover);
  color: var(--sf-text-primary);
}

.site-header__mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-input-bg);
  border: 1px solid var(--sf-border);
  color: var(--sf-text-muted);
}

.site-header__mobile-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--sf-text-primary);
  font-size: 14px;
}

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .site-header__nav { display: none; }
  .site-header__search { display: none; }
  .site-header__right .site-header__auth-btn { display: none; }
  .site-header__right .lang-switcher { display: none; }
  .site-header__menu-btn { display: flex; }
}
</style>
<!-- Extra cart styles -->
<style scoped>
/* Right side group */
.site-header__right {
  display: flex; align-items: center; gap: 6px;
  margin-left: auto;
}

/* Cart button (right side) */
.site-header__cart-btn {
  position: relative;
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  background: none; border: none;
  color: var(--sf-text-secondary);
  text-decoration: none; cursor: pointer;
  transition: all 0.2s;
}
.site-header__cart-btn:hover {
  color: var(--sf-accent, #7c3aed);
  background: var(--sf-accent-glow);
}
.site-header__cart-btn.active {
  color: var(--sf-accent-light);
}

/* Cart badge */
.cart-badge {
  position: absolute; top: 2px; right: 0;
  min-width: 16px; height: 16px; line-height: 16px;
  border-radius: 8px; background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff; font-size: 9px; font-weight: 800; text-align: center;
  padding: 0 4px; pointer-events: none;
}
.cart-badge--mobile {
  position: static; margin-left: auto;
  min-width: 22px; height: 22px; line-height: 22px;
  font-size: 11px;
}

/* Language Switcher */
.lang-switcher { position: relative; }
.lang-switcher__btn {
  display: flex; align-items: center; gap: 5px;
  background: none; border: none;
  border-radius: 8px; padding: 6px 10px; cursor: pointer;
  color: var(--sf-text-secondary); font-size: 12px; font-weight: 700;
  transition: all 0.2s;
}
.lang-switcher__btn:hover { color: var(--sf-text-primary); background: var(--sf-bg-card-hover); }
.lang-switcher__dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
  min-width: 160px; padding: 6px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: 10px; box-shadow: var(--sf-shadow-md);
}
.lang-switcher__item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 12px; border: none; border-radius: 6px;
  background: none; color: var(--sf-text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.lang-switcher__item:hover { background: var(--sf-bg-card-hover); color: var(--sf-text-primary); }
.lang-switcher__item.active { color: var(--sf-accent, #a78bfa); font-weight: 700; }
.lang-icon { font-size: 16px; }

/* Auth Button */
.site-header__auth-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--sf-text-primary);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--sf-border);
  background: var(--sf-bg-card);
  transition: all 0.2s;
  white-space: nowrap;
}
.site-header__auth-btn:hover {
  border-color: var(--sf-accent, #7c3aed);
  color: var(--sf-accent, #7c3aed);
  background: rgba(124, 58, 237, 0.06);
}

/* Theme Toggle */
.theme-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  background: none; border: none;
  color: var(--sf-text-secondary); cursor: pointer; transition: all 0.25s;
}
.theme-toggle:hover {
  color: var(--sf-accent-light, #f59e0b);
  background: var(--sf-bg-card-hover);
  transform: rotate(15deg);
}
</style>
