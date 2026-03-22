<template>
  <!-- ═══ Storefront: No login required ═══ -->
  <div v-if="isStorefront" class="storefront-wrapper">
    <StorefrontHome
      v-if="shopView === 'home'"
      :storeId="shopStoreId"
      @viewProduct="(id) => shopNavigate('product', id)"
      @viewPage="(id) => shopNavigate('page', id)"
    />
    <StorefrontProduct
      v-else-if="shopView === 'product'"
      :storeId="shopStoreId"
      :productId="shopItemId"
      @back="shopNavigate('home')"
      @addToCart="onAddToCart"
    />
    <StorefrontCategory
      v-else-if="shopView === 'category'"
      :storeId="shopStoreId"
      :categoryId="shopItemId"
      @back="shopNavigate('home')"
      @viewProduct="(id) => shopNavigate('product', id)"
    />
    <StorefrontPage
      v-else-if="shopView === 'page'"
      :storeId="shopStoreId"
      :pageId="shopItemId"
      @back="shopNavigate('home')"
    />
    <StorefrontHome v-else :storeId="shopStoreId" @viewProduct="(id) => shopNavigate('product', id)" @viewPage="(id) => shopNavigate('page', id)" />
    <ToastContainer />
  </div>

  <!-- Login Gate -->
  <LoginPage v-else-if="!isLoggedIn" @loginSuccess="onLoginSuccess" />

  <div class="app" v-else>
    <!-- Onboarding Overlay -->
    <OnboardingWizard
      v-if="needsOnboarding"
      @complete="onOnboardingComplete"
    />

    <!-- Connection Lost Banner -->
    <div class="connection-lost" v-if="connectionLost">
      <AlertTriangle :size="14" style="vertical-align:middle" /> {{ t('admin.connection_lost', 'Mất kết nối server — đang thử kết nối lại...') }}
    </div>
    <!-- Top Header Bar -->
    <header class="app-header">
      <!-- Single Row: Logo + Nav + User -->
      <div class="app-header__row1">
        <div class="app-header__logo">
          <Rocket :size="20" />
          <span>AI Live Tool</span>
        </div>
        <nav class="app-nav">
          <template v-for="item in filteredNavItems" :key="item.key">
            <!-- Standalone tab (no dropdown) -->
            <button
              v-if="!item.children"
              class="app-nav__tab"
              :class="{ 'app-nav__tab--active': activeView === item.key }"
              @click="navigateTo(item.key)"
              :title="item.label"
            >
              <component :is="item.icon" :size="18" />
              <span class="app-nav__label">{{ item.label }}</span>
            </button>
            <!-- Dropdown tab -->
            <div
              v-else
              class="app-nav__dropdown"
              @mouseenter="onDropdownEnter(item.key)"
              @mouseleave="onDropdownLeave()"
            >
              <button
                class="app-nav__tab"
                :class="{ 'app-nav__tab--active': item.children.some(c => activeView === c.view) || item.activeKeys?.includes(activeView) }"
                @click="navigateTo(item.children[0].view)"
              >
                <component :is="item.icon" :size="18" />
                <span class="app-nav__label">{{ item.label }}</span>
                <ChevronDown :size="12" class="app-nav__chevron" :class="{ 'app-nav__chevron--open': openDropdown === item.key }" />
              </button>
              <div class="app-nav__menu" v-show="openDropdown === item.key">
                <div class="app-nav__menu-inner">
                  <button
                    v-for="child in item.children"
                    :key="child.key"
                    class="app-nav__menu-item"
                    :class="{ 'app-nav__menu-item--active': activeView === child.view }"
                    @click="navigateTo(child.view); openDropdown = null"
                  >
                    <component :is="child.icon" :size="15" />
                    <span>{{ child.label }}</span>
                  </button>
                </div>
              </div>
            </div>
          </template>
        </nav>
        <div class="app-header__actions">
          <button class="app-header__icon-btn app-header__theme-btn" @click="toggleTheme" :title="'Theme: ' + theme">
            <Sun v-if="resolvedTheme === 'light'" :size="16" />
            <Moon v-else-if="resolvedTheme === 'dark' && theme !== 'system'" :size="16" />
            <Monitor v-else :size="16" />
          </button>
          <!-- Language Switcher -->
          <div class="app-header__lang-wrap" v-if="adminLanguages.length > 1">
            <button class="app-header__icon-btn" @click="showLangMenu = !showLangMenu" :title="t('admin.language', 'Ngôn ngữ')">
              <Globe :size="16" />
            </button>
            <div class="app-header__lang-menu" v-if="showLangMenu">
              <button
                v-for="lang in adminLanguages"
                :key="lang.code"
                class="app-header__lang-item"
                :class="{ 'app-header__lang-item--active': lang.code === adminCurrentLang }"
                @click="onChangeLang(lang.code)"
              >
                <span v-if="lang.flag" class="app-header__lang-flag">{{ lang.flag }}</span>
                <span>{{ lang.name || lang.code }}</span>
              </button>
            </div>
          </div>
          <NotificationBell @navigate="navigateTo" />
          <button class="app-header__btn app-header__btn--profile" @click="showProfile = true" :title="t('admin.profile', 'Hồ sơ')" v-if="currentUser">
            <UserIcon :size="16" />
            <span class="app-header__username">{{ currentUser.fullName || currentUser.name || currentUser.email }}</span>
          </button>
          <button class="app-header__btn app-header__btn--logout" @click="onLogout" :title="t('admin.logout', 'Đăng xuất')" v-if="currentUser">
            <LogOut :size="16" />
          </button>
        </div>
      </div>

    </header>

    <!-- ═══ View: Dashboard ═══ -->
    <DashboardOverview
      v-if="activeView === 'dashboard'"
      @navigate="navigateTo"
    />

    <!-- ═══ View: Live Monitor (plugin-based when livestream plugin is installed) ═══ -->
    <component
      v-if="activeView === 'live' && liveMonitorComponent"
      :is="liveMonitorComponent"
      @openCustomer="openCustomerDetail"
    />
    <!-- ═══ View: Live Replay (plugin-based) ═══ -->
    <component
      v-else-if="activeView === 'live/replay' && liveReplayComponent"
      :is="liveReplayComponent"
    />

    <!-- ═══ View: CRM Pipeline ═══ -->
    <LeadPipeline
      v-if="activeView === 'crm'"
      @openCustomer="openCustomerDetail"
    />

    <!-- ═══ View: Reports ═══ -->
    <ReportPage
      v-if="activeView === 'reports'"
    />


    <!-- ═══ View: Settings-based Pages (Shop/Live settings/Orders) ═══ -->
    <ShopSettings
      v-if="isSettingsView"
      :currentShop="currentShop"
      :initialTab="settingsActiveTab"
      :activeView="activeView"
      :cmsEditPageId="cmsEditPageId"
      :productEditId="productEditId"
      :categoryEditId="categoryEditId"
      :flashSaleFormMode="flashSaleFormMode"
      :flashSaleEditId="flashSaleEditId"
      @openShopSelector="shopSelectorRef?.open()"
      @navigate="navigateTo"
      @modulesChanged="onModulesChanged"
    />
    <!-- ═══ View: All Notifications ═══ -->
    <NotificationPage
      v-if="activeView === 'notifications'"
      :backView="prevView"
      @navigate="navigateTo"
    />

    <!-- Customer Detail Modal -->
    <CustomerDetail
      :visible="showCustomerDetail"
      :customer="selectedCustomer"
      @close="showCustomerDetail = false"
    />



    <!-- Keyboard Shortcuts Help -->
    <div class="shortcuts-overlay" v-if="showShortcuts" @click.self="showShortcuts = false">
      <div class="shortcuts-modal">
        <h3><Keyboard :size="16" style="vertical-align:middle" /> {{ t('admin.shortcuts', 'Phím tắt') }}</h3>
        <div class="shortcuts-list">
          <div v-for="s in shortcuts" :key="s.keys" class="shortcut-item">
            <kbd>{{ s.keys }}</kbd>
            <span>{{ s.desc }}</span>
          </div>
        </div>
        <button class="shortcuts-close" @click="showShortcuts = false">{{ t('admin.close', 'Đóng') }}</button>
      </div>
    </div>

    <!-- Profile Modal -->
    <ProfileModal
      v-if="showProfile"
      :currentUser="currentUser"
      @close="showProfile = false"
      @updated="onProfileUpdated"
    />

    <!-- Toast Notifications -->
    <ToastContainer />

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, onErrorCaptured } from 'vue'

// ── Error Boundary ──
const appError = ref(null)
onErrorCaptured((err, instance, info) => {
  console.error('[App Error Boundary]', err, info)
  appError.value = { message: err.message || t('admin.msg_aaf377aa', 'Đã xảy ra lỗi'), info }
  return false // prevent propagation
})
import { API_BASE } from './config.js'
import { apiFetch } from './composables/useApi.js'
import { logger } from './utils/logger.js'
import { useSocket } from './composables/useSocket.js'
import { useShops } from './composables/useShops.js'
import ShopSelector from './components/ShopSelector.vue' // keep import for potential future use
import DashboardOverview from './components/DashboardOverview.vue'
import LeadPipeline from './components/LeadPipeline.vue'
import ReportPage from './components/ReportPage.vue'
import LoginPage from './components/LoginPage.vue'
import ShopSettings from './components/ShopSettings.vue'
import CustomerDetail from './components/CustomerDetail.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import NotificationBell from './components/NotificationBell.vue'
// BillingPage removed — billing handled by master admin externally
import NotificationPage from './components/NotificationPage.vue'
import ToastContainer from './components/ToastContainer.vue'
import ProfileModal from './components/ProfileModal.vue'
import StorefrontHome from './components/StorefrontHome.vue'
import StorefrontProduct from './components/StorefrontProduct.vue'
import StorefrontCategory from './components/StorefrontCategory.vue'
import StorefrontPage from './components/StorefrontPage.vue'
import OnboardingWizard from './components/OnboardingWizard.vue'
import { useAuth } from './composables/useAuth.js'
import { useNotifications } from './composables/useNotifications.js'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'
import { useTheme } from './composables/useTheme.js'
import { usePermissions, fetchPermissionsIfEmpty } from './composables/usePermissions.js'
import { usePluginLoader } from './composables/usePluginLoader.js'
import { useI18n } from './composables/useI18n.js'
import { hooks } from './core/hooks.js'
import { SIDEBAR_ITEMS, ADMIN_ROUTES } from './core/hook-names.js'

import {
  Rocket,
  LayoutDashboard, Users, BarChart2,
  User as UserIcon, LogOut, Settings, Store, ChevronDown,
  Sun, Moon, Monitor, AlertTriangle, Keyboard,
  ShoppingBag, FolderTree, Award, Receipt, Tag,
  Key, MessageCircle, Shield, Link, Image, BookOpen, Zap,
  ClipboardList, Palette, Cog, Globe, LayoutList, Truck, FormInput,
} from 'lucide-vue-next'

// ── Auth ──
const { isLoggedIn, currentUser, logout } = useAuth()
useNotifications()
const { theme, resolvedTheme, toggleTheme } = useTheme()
const { can, isSuperAdmin } = usePermissions()
const { t, currentLang: adminCurrentLang, languages: adminLanguages, setLang, init: initI18n } = useI18n()
const showLangMenu = ref(false)
async function onChangeLang(code) {
  await setLang(code)
  showLangMenu.value = false
}
// Close lang menu on outside click
function onDocClick(e) { if (!e.target.closest('.app-header__lang-wrap')) showLangMenu.value = false }
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

function onLoginSuccess() {}
function onLogout() { logout() }
function onProfileUpdated(user) {
  currentUser.value = user
  showProfile.value = false
}

// ── Tenant Feature Groups ──
const tenantFeatures = ref(localStorage.getItem('tenant_features') || 'all')
const needsOnboarding = ref(false)

async function fetchTenantFeatures() {
  try {
    const res = await fetch('/api/tenant-status')
    if (res.ok) {
      const data = await res.json()
      const features = data.features || 'all'
      tenantFeatures.value = features
      localStorage.setItem('tenant_features', features)
      
      // Check onboarding status
      if (data.onboarded === false) {
        needsOnboarding.value = true
      }
    }
  } catch (e) {
    console.warn('[Features] Failed to fetch:', e.message)
  }
}

function onOnboardingComplete() {
  needsOnboarding.value = false
  fetchTenantFeatures()
  fetchInstalledModules()
}

// ── Installed Modules ──
const installedModules = ref(JSON.parse(localStorage.getItem('installed_modules') || '[]'))

async function fetchInstalledModules() {
  try {
    const res = await apiFetch('/modules/sidebar')
    const data = await res.json()
    const ids = data?.installed || []
    installedModules.value = ids
    localStorage.setItem('installed_modules', JSON.stringify(ids))

    // Eagerly load all installed plugin bundles so they can register
    // their sidebar items and routes via hooks BEFORE the sidebar renders
    const { loadPlugin } = usePluginLoader()
    await Promise.allSettled(ids.map(id => loadPlugin(id)))

    // Re-resolve the URL path now that plugin routes are registered.
    // On initial page load, viewFromPath() runs before plugins load, so
    // plugin-registered views (e.g. shop/products) are not yet in validViews
    // and the router falls back to dashboard. Fix it here.
    const resolvedView = viewFromPath()
    if (resolvedView !== activeView.value) {
      activeView.value = resolvedView
    }
  } catch (e) {
    console.warn('[Modules] Failed to fetch:', e.message)
  }
}

function isModuleInstalled(moduleId) {
  if (!moduleId) return true // no moduleId = always visible
  return installedModules.value.includes(moduleId)
}

// Re-load plugin bundles when modules are installed/uninstalled
async function onModulesChanged() {
  await fetchInstalledModules()
}

// Fetch on mount
onMounted(() => {
  fetchTenantFeatures()
  fetchPermissionsIfEmpty()
  fetchInstalledModules()
  initI18n() // load languages + translations for language switcher

  // Initialize plugin bridge for dynamic module bundles
  const { initBridge } = usePluginLoader()
  initBridge()
})

const { pluginVersion, getPluginComponent } = usePluginLoader()

// ── Livestream plugin components (resolved dynamically when plugin is installed) ──
const liveMonitorComponent = computed(() => {
  void pluginVersion.value
  return getPluginComponent('livestream', 'live-monitor')
})
const liveReplayComponent = computed(() => {
  void pluginVersion.value
  return getPluginComponent('livestream', 'live-replay')
})

// ── Navigation ──
const openDropdown = ref(null)
let dropdownTimer = null
const settingsInitTab = ref('connection')

function onDropdownEnter(key) {
  if (dropdownTimer) { clearTimeout(dropdownTimer); dropdownTimer = null }
  openDropdown.value = key
}
function onDropdownLeave() {
  dropdownTimer = setTimeout(() => { openDropdown.value = null }, 150)
}

// ── Core nav items (hardcoded — always present) ──
// E-commerce, warehouse, marketing, etc. are now registered by plugins via hooks
// Note: 'live-group' (livestream nav) moved to plugins/livestream — registered via hooks when installed
const coreNavItems = [
  { key: 'dashboard', label: 'Tổng quan', icon: 'LayoutDashboard', featureGroup: null },
  { key: 'shop/info', label: 'Hệ thống', icon: 'Settings', featureGroup: null },
]

// ── Dynamic nav items via hooks — plugins can add items ──
const navItems = computed(() => {
  // pluginVersion is a reactive dependency — when plugins load and register 
  // new hook filters, this computed re-evaluates to include plugin-registered items
  void pluginVersion.value
  return hooks.applyFilters(SIDEBAR_ITEMS, [...coreNavItems])
})

// Check if item's featureGroup is enabled for this tenant
function isFeatureEnabled(featureGroup) {
  if (!featureGroup) return true // no featureGroup = always visible (e.g. Dashboard)
  
  let tf = tenantFeatures.value
  if (!tf || tf === 'all') return true
  
  // Parse string arrays or comma-separated lists
  if (typeof tf === 'string') {
    if (tf.startsWith('[')) {
      try { tf = JSON.parse(tf) } catch (e) {}
    } else if (tf.includes(',')) {
      tf = tf.split(',').map(s => s.trim())
    }
  }

  if (Array.isArray(tf)) {
    return tf.includes(featureGroup)
  }
  
  return tf === featureGroup
}

// ── Header nav items — only core items (no module duplicates) ──
// Module-specific items (e-com, CMS, blog, etc.) are shown ONLY in the sidebar (ShopSettings).
// The header shows: Dashboard, System dropdown, Billing — that's it.
const filteredNavItems = computed(() => {
  return coreNavItems
    .map(item => {
      // Filter by feature group first
      if (!isFeatureEnabled(item.featureGroup)) return null
      // Item with no permission = always visible
      if (!item.permission && !item.children) return item
      // Group with children: filter children, hide group if none visible
      if (item.children) {
        const visibleChildren = item.children.filter(c => {
          if (c.permission && !can(c.permission)) return false
          if (c.moduleId && !isModuleInstalled(c.moduleId)) return false
          return true
        })
        if (visibleChildren.length === 0 && item.permission && !can(item.permission)) return null
        return { ...item, children: visibleChildren }
      }
      // Top-level item with permission
      return (!item.permission || can(item.permission)) ? item : null
    })
    .filter(Boolean)
})

// ── Full nav items (used by sidebar / other components that need all items) ──
const allNavItems = computed(() => {
  return navItems.value
    .map(item => {
      if (!isFeatureEnabled(item.featureGroup)) return null
      if (!item.permission && !item.children) return item
      if (item.children) {
        const visibleChildren = item.children.filter(c => {
          if (c.permission && !can(c.permission)) return false
          if (c.moduleId && !isModuleInstalled(c.moduleId)) return false
          return true
        })
        if (visibleChildren.length === 0 && item.permission && !can(item.permission)) return null
        return { ...item, children: visibleChildren }
      }
      return (!item.permission || can(item.permission)) ? item : null
    })
    .filter(Boolean)
})

// ── Core route → tab mapping ──
// Only truly core routes remain here. E-com, marketing, warehouse, etc.
// are now registered by their respective plugins via hooks.
const coreRouteToTab = {
  // Live
  'live/keywords': 'keywords', 'live/replies': 'replies', 'live/moderation': 'moderation', 'live/connection': 'connection',
  // Core (always available)
  'shop/info': 'store-info', 'shop/config': 'system-config', 'shop/languages': 'languages',
  'shop/media': 'media',
  'shop/appearance': 'appearance', 'shop/layout': 'storefront-layout',
  'system/api-keys': 'api-keys', 'system/webhooks': 'webhooks',
  'system/logs': 'activity-logs', 'system/roles': 'roles',
  'system/modules': 'modules',
  // Forms (plugin)
  'forms': 'forms', 'forms/create': 'forms', 'forms/submissions': 'form-submissions',
  // Reviews (plugin)
  'shop/reviews': 'reviews',
  // SEO (plugin)
  'system/seo': 'seo',
  // AI Assistant (plugin)
  'ai-assistant': 'ai-assistant',
}

// ── Dynamic route config via hooks — plugins extend this ──
const routeConfig = computed(() => {
  void pluginVersion.value // re-evaluate when plugins register new routes
  return hooks.applyFilters(ADMIN_ROUTES, { routeToTab: { ...coreRouteToTab }, validViews: [] })
})
const routeToTab = computed(() => routeConfig.value.routeToTab)
const validViews = computed(() => [
  'dashboard', 'live', 'crm', 'reports',
  'notifications', 'shop/info', 'shop/config', 'shop/languages',
  'shop/cms/create', 'shop/cms/edit',
  'shop/products/edit', 'shop/categories/edit',
  ...Object.keys(routeConfig.value.routeToTab),
  ...routeConfig.value.validViews,
])

// ── Feature-group → views map (derived from navItems) ──
// Used to block URL-typed navigation to disabled feature areas.
const viewFeatureGroupMap = computed(() => {
  const map = {}
  for (const item of navItems.value) {
    if (!item.featureGroup) continue
    if (item.children) {
      for (const child of item.children) {
        if (child.view) map[child.view] = item.featureGroup
      }
    } else {
      map[item.key] = item.featureGroup
    }
  }
  // All shop/* and order/warehouse paths belong to the 'store' feature
  for (const key of Object.keys(routeToTab.value)) {
    if (!map[key] && (key.startsWith('shop/') || key === 'orders' || key.startsWith('orders/') || key.startsWith('warehouse/'))) {
      map[key] = 'store'
    }
  }
  return map
})

function getViewFeatureGroup(view) {
  const map = viewFeatureGroupMap.value
  if (map[view]) return map[view]
  // Match prefix (e.g. 'shop/products/edit' → 'store')
  for (const [k, fg] of Object.entries(map)) {
    if (view.startsWith(k + '/')) return fg
  }
  return null
}

function defaultAccessibleView() {
  const first = filteredNavItems.value[0]
  if (!first) return 'dashboard'
  return first.children ? (first.children[0]?.view ?? 'dashboard') : first.key
}
// ── Storefront Detection ──
// CMS mode: running on *.cms.* domain — never show storefront
function isCmsMode() {
  return window.location.hostname.includes('.cms.')
}
function parseShopPath() {
  if (isCmsMode()) return null // CMS never shows storefront
  const m = window.location.pathname.match(/^\/shop\/([^\/]+)(\/([^\/]*))?(\/(.*))?/)
  if (!m) return null
  return { storeId: m[1], view: m[3] || 'home', itemId: m[5] || null }
}
const isStorefront = ref(!!parseShopPath())
const shopStoreId = ref(parseShopPath()?.storeId || '')
const shopView = ref(parseShopPath()?.view || 'home')
const shopItemId = ref(parseShopPath()?.itemId || null)

function shopNavigate(view, itemId = null) {
  shopView.value = view
  shopItemId.value = itemId
  let path = `/shop/${shopStoreId.value}`
  if (view && view !== 'home') path += `/${view}`
  if (itemId) path += `/${itemId}`
  history.pushState({ shopView: view, shopItemId: itemId }, '', path)
}

function onAddToCart(data) {
  // placeholder for cart logic
  console.log('Add to cart:', data)
}

function viewFromPath() {
  const path = window.location.pathname.replace(/^\//, '')
  let resolved
  // Match CMS edit with ID: shop/cms/edit/123
  if (path.startsWith('shop/cms/edit/'))          resolved = 'shop/cms/edit'
  else if (path.startsWith('shop/products/edit/')) resolved = 'shop/products/edit'
  else if (path.startsWith('shop/categories/edit/')) resolved = 'shop/categories/edit'
  else if (path === 'shop/flash-sales/create')    resolved = 'shop/flash-sales/create'
  else if (path.startsWith('shop/flash-sales/edit/')) resolved = 'shop/flash-sales/edit'
  else if (path.startsWith('orders/detail/'))     resolved = 'orders/detail'
  else if (validViews.value.includes(path))             resolved = path
  else {
    const first = path.split('/')[0] || ''
    resolved = validViews.value.includes(first) ? first : null
  }
  if (!resolved) return defaultAccessibleView()
  // Redirect if the resolved view belongs to a disabled feature group
  const fg = getViewFeatureGroup(resolved)
  if (fg && !isFeatureEnabled(fg)) return defaultAccessibleView()
  return resolved
}
const activeView = ref(viewFromPath())
const prevView   = ref(defaultAccessibleView())

// Computed: which settings tab to show
const settingsActiveTab = computed(() => routeToTab.value[activeView.value] || 'products')
// Is the current view a settings-based page?
const isSettingsView = computed(() => activeView.value in routeToTab.value)

// CMS page edit ID (from URL: /shop/cms/edit/123)
const cmsEditPageId = ref(null)
// Product edit ID (from URL: /shop/products/edit/123)
const productEditId = ref(null)
// Category edit ID (from URL: /shop/categories/edit/123)
const categoryEditId = ref(null)
// Flash Sale form state (from URL: /shop/flash-sales/create or /shop/flash-sales/edit/123)
const flashSaleFormMode = ref(null) // null | 'create' | 'edit'
const flashSaleEditId = ref(null)

function extractCmsId(pathStr) {
  const match = pathStr.replace(/^\//, '').match(/^shop\/cms\/edit\/(\d+)/)
  return match ? match[1] : null
}
function extractProductEditId(pathStr) {
  const match = pathStr.replace(/^\//, '').match(/^shop\/products\/edit\/(\d+)/)
  return match ? match[1] : null
}
function extractCategoryEditId(pathStr) {
  const match = pathStr.replace(/^\//, '').match(/^shop\/categories\/edit\/(\d+)/)
  return match ? match[1] : null
}
function extractFlashSaleState(pathStr) {
  const p = pathStr.replace(/^\//, '')
  if (p === 'shop/flash-sales/create') return { mode: 'create', id: null }
  const m = p.match(/^shop\/flash-sales\/edit\/(\d+)/)
  if (m) return { mode: 'edit', id: m[1] }
  return { mode: null, id: null }
}
cmsEditPageId.value = extractCmsId(window.location.pathname)
productEditId.value = extractProductEditId(window.location.pathname)
categoryEditId.value = extractCategoryEditId(window.location.pathname)
;(function() { const fs = extractFlashSaleState(window.location.pathname); flashSaleFormMode.value = fs.mode; flashSaleEditId.value = fs.id })()
function navigateTo(view) {
  const urlPath = view

  // Track dynamic params
  cmsEditPageId.value = extractCmsId(urlPath)
  productEditId.value = extractProductEditId(urlPath)
  categoryEditId.value = extractCategoryEditId(urlPath)
  ;(function() { const fs = extractFlashSaleState(urlPath); flashSaleFormMode.value = fs.mode; flashSaleEditId.value = fs.id })()

  if (!validViews.value.includes(view)) {
    // Check if it matches view + ID pattern
    const base = view.replace(/\/\d+$/, '')
    view = validViews.value.includes(base) ? base : defaultAccessibleView()
  }
  // Redirect if target view belongs to a disabled feature group
  const fg = getViewFeatureGroup(view)
  if (fg && !isFeatureEnabled(fg)) view = defaultAccessibleView()

  if (view !== 'notifications') prevView.value = view
  activeView.value = view
  history.pushState({ view }, '', '/' + urlPath)
}

window.addEventListener('popstate', () => {
  const sp = parseShopPath()
  if (sp) {
    isStorefront.value = true
    shopStoreId.value = sp.storeId
    shopView.value = sp.view
    shopItemId.value = sp.itemId
  } else {
    isStorefront.value = false
    activeView.value = viewFromPath()
    cmsEditPageId.value = extractCmsId(window.location.pathname)
    productEditId.value = extractProductEditId(window.location.pathname)
    categoryEditId.value = extractCategoryEditId(window.location.pathname)
    ;(function() { const fs = extractFlashSaleState(window.location.pathname); flashSaleFormMode.value = fs.mode; flashSaleEditId.value = fs.id })()
  }
})

// Set initial URL if on root (only for admin, not storefront)
if (!isStorefront.value && (!window.location.pathname || window.location.pathname === '/')) {
  history.replaceState({ view: activeView.value }, '', '/' + activeView.value)
}

// Customer detail modal
const showCustomerDetail = ref(false)
const selectedCustomer = ref(null)
function openCustomerDetail(customer) {
  selectedCustomer.value = customer
  showCustomerDetail.value = true
}

const shopSelectorRef = ref(null) // kept for compatibility
const showShortcuts = ref(false)

// Keyboard shortcuts
const { shortcuts } = useKeyboardShortcuts({
  onSwitchTab: (tab) => { navigateTo(tab) },
  onToggleSearch: () => {
    if (activeView.value !== 'live') navigateTo('live')
  },
  onStartMock: () => {},
  onCloseModal: () => {
    showCustomerDetail.value = false
    showShortcuts.value = false
  },
  onToggleHelp: () => { showShortcuts.value = !showShortcuts.value },
})

// Socket composable — only connectionLost is used in App shell; live features handled by plugin
const { connectionLost } = useSocket()

// Redirect away from disabled-feature views when tenant features load/change
watch(tenantFeatures, () => {
  const fg = getViewFeatureGroup(activeView.value)
  if (fg && !isFeatureEnabled(fg)) navigateTo(defaultAccessibleView())
})

// Shops composable
const {
  currentShop,
  fetchShops,
  createShop,
  selectShop,
} = useShops()

const showProfile = ref(false)

onMounted(async () => {
  // Bootstrap saved storefront accent color into CMS CSS vars on startup
  try {
    const { apiFetch: _apiFetch } = await import('./composables/useApi.js')
    const res = await _apiFetch('/system-config/group/theme')
    const rows = await res.json()  // [{id, key, group_name, value}, ...]
    const accentRow = Array.isArray(rows) && rows.find(r => r.key === 'accent' || r.key === 'theme.accent')
    const hex = accentRow?.value
    if (hex && /^#[0-9a-fA-F]{3,6}$/.test(hex)) {
      let h = hex.replace('#', '')
      if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
      const r = parseInt(h.substring(0,2), 16), g = parseInt(h.substring(2,4), 16), b = parseInt(h.substring(4,6), 16)
      const dr = Math.max(0, Math.round(r*0.8)), dg = Math.max(0, Math.round(g*0.8)), db = Math.max(0, Math.round(b*0.8))
      const lr = Math.min(255, Math.round(r+(255-r)*0.3)), lg = Math.min(255, Math.round(g+(255-g)*0.3)), lb = Math.min(255, Math.round(b+(255-b)*0.3))
      const root = document.documentElement
      root.style.setProperty('--accent', hex)
      root.style.setProperty('--color-accent-primary', hex)
      root.style.setProperty('--color-accent-glow', `rgba(${r},${g},${b},0.2)`)
      root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${hex}, #${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')})`)
      root.style.setProperty('--accent-light', `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`)
      root.style.setProperty('--accent-shadow', `0 4px 15px rgba(${r},${g},${b},0.25)`)
      root.style.setProperty('--accent-rgb', `${r},${g},${b}`)
    }
  } catch { /* use defaults */ }

  // Auto-fetch permissions if logged in but localStorage is empty (e.g. older login that didn't return permissions)
  try {
    const { fetchPermissionsIfEmpty } = await import('./composables/usePermissions.js')
    await fetchPermissionsIfEmpty()
  } catch { /* non-critical */ }

  try { await fetchShops() } catch (err) { console.error('[Admin] Failed to load shops:', err) }
})

function onSelectShop(shop) { selectShop(shop) }

async function onCreateShop(shopData) {
  try {
    const newShop = await createShop(shopData)
    selectShop(newShop)
  } catch (err) { logger.error('Error creating shop:', err) }
}



</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-bg-primary);
}

.app-header {
  display: flex;
  flex-direction: column;
  background: var(--color-header-bg);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  transition: background 0.3s ease;
  position: relative;
  z-index: 100;
}

.connection-lost {
  background: linear-gradient(135deg, #dc2626, #b91c1c);
  color: #fff;
  text-align: center;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  animation: pulse-bg 2s ease-in-out infinite;
  z-index: 100;
}
@keyframes pulse-bg {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* ── Row 1: Logo + Nav + User ── */
.app-header__row1 {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--color-border);
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
  margin-right: 4px;
}
.app-header__logo svg { color: #ff3b5c; }

/* ── Tab Navigation ── */
.app-nav {
  display: flex;
  gap: 2px;
  background: var(--color-bg-card);
  border-radius: 10px;
  padding: 3px;
  flex: 1;
}
.app-nav__tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s;
  white-space: nowrap;
}
.app-nav__tab:hover {
  color: var(--color-text-secondary);
  background: var(--color-bg-card-hover);
}
.app-nav__tab--active {
  color: var(--color-accent-primary);
  background: var(--color-accent-glow);
  font-weight: 700;
  box-shadow: 0 0 12px var(--color-accent-glow);
}

/* Dropdown nav */
.app-nav__dropdown {
  position: relative;
}
.app-nav__chevron {
  transition: transform 0.2s;
  opacity: 0.5;
}
.app-nav__chevron--open {
  transform: rotate(180deg);
  opacity: 1;
}
.app-nav__menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 200px;
  padding-top: 6px; /* visual gap without breaking hover */
  z-index: 1000;
  animation: dropdownFadeIn 0.15s ease;
}
.app-nav__menu-inner {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 6px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}
@keyframes dropdownFadeIn {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
.app-nav__menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 14px;
  border-radius: 7px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
}
.app-nav__menu-item:hover {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}
.app-nav__menu-item--active {
  color: var(--color-accent-primary);
  background: var(--color-accent-glow);
  font-weight: 600;
}

/* User actions area */
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding-left: 12px;
  border-left: 1px solid var(--color-border);
}
/* Language Switcher */
.app-header__lang-wrap {
  position: relative;
}
.app-header__lang-code {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-left: 2px;
  opacity: 0.8;
}
.app-header__lang-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  background: var(--color-card-bg, #fff);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 160px;
  z-index: 1000;
  padding: 4px;
  animation: fadeIn 0.15s ease;
}
.app-header__lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: none;
  color: var(--color-text);
  font-size: 13px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.15s;
}
.app-header__lang-item:hover {
  background: var(--color-hover, rgba(0,0,0,0.05));
}
.app-header__lang-item--active {
  background: var(--color-accent, #3b82f6);
  color: #fff;
  font-weight: 600;
}
.app-header__lang-item--active:hover {
  background: var(--color-accent, #3b82f6);
}
.app-header__lang-flag {
  font-size: 16px;
}
.app-header__username {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}


/* Icon-only toggle buttons */
.app-header__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px; height: 30px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: all 0.2s;
}
.app-header__icon-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}
.app-header__icon-btn.active {
  color: #38bdf8;
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}
.app-header__icon-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Vertical divider */
.app-header__divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}

/* Action buttons (Connect, Mock, Stop) */
.app-header__action-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 12px;
  border-radius: 6px;
  border: none;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.app-header__action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.app-header__action-btn--connect { background: var(--color-accent-hot); color: white; }
.app-header__action-btn--connect:hover:not(:disabled) { background: #e63350; }
.app-header__action-btn--mock {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.app-header__action-btn--mock:hover:not(:disabled) {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}
.app-header__action-btn--stop { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
.app-header__action-btn--stop:hover { background: #991b1b; }

/* Shared .app-header__btn styles (profile, logout) */
.app-header__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  background: transparent;
  color: var(--color-text-secondary);
}
.app-header__btn:hover { color: var(--color-text-primary); background: var(--color-bg-card); }
.app-header__btn--profile:hover { color: #818cf8; border-color: #818cf8; background: rgba(129, 140, 248, 0.08); }
.app-header__btn--logout { padding: 5px 8px; }
.app-header__btn--logout:hover { color: #ff3b5c; border-color: #ff3b5c; background: rgba(255, 59, 92, 0.08); }

.app-main { display: flex; flex: 1; overflow: hidden; }

/* Responsive */
@media (max-width: 1024px) {
  .app-nav__label { display: none; }
  .app-nav__tab { padding: 5px 8px; }
  .app-header__username { display: none; }
}
@media (max-width: 768px) {
  .app-header__row1 { gap: 6px; padding: 6px 10px; }
}

/* Floating Panels */
.app-floating {
  position: fixed;
  bottom: 80px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 50;
}
.app-floating__panel {
  width: 380px;
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* FAB Buttons — kept for potential plugin use */
.app-fab {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 50;
}
.app-fab__btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.app-fab__btn:hover { transform: scale(1.1); }
.app-fab__btn--draw { background: linear-gradient(135deg, #f59e0b, #ef4444); color: white; }
.app-fab__btn--script { background: linear-gradient(135deg, #10b981, #059669); color: white; }
.app-fab__btn--notif { background: var(--color-bg-secondary); color: var(--color-text-primary); border: 1px solid var(--color-border); }

/* ═══ Mobile Responsive ═══ */
@media (max-width: 1024px) {
  .app-header { flex-wrap: wrap; padding: 8px 12px; }
  .app-header__left { flex-wrap: wrap; gap: 8px; }
  .app-header__controls { flex-wrap: wrap; }
  .app-main { flex-direction: column; }
  .app-main__left { flex: none; height: 60%; border-right: none; border-bottom: 1px solid var(--color-border); }
  .app-main__right { flex: none; height: 40%; }
}

@media (max-width: 768px) {
  .app-nav { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .app-nav__tab { padding: 6px 10px; font-size: 12px; }
  .app-header__btn { padding: 5px 10px; font-size: 12px; }
  .app-header__controls { gap: 4px; }
  .app-header__status-text { display: none; }
  .app-header__viewers { display: none; }
  .app-floating__panel { width: calc(100vw - 40px); }
}

@media (max-width: 480px) {
  .app-header { padding: 6px 8px; }
  .app-header__logo span { display: none; }
  .app-nav__tab span { display: none; }
  .app-header__btn span { display: none; }
  .app-header__user-name span { display: none; }
}

/* Keyboard Shortcuts Overlay */
.shortcuts-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200;
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s;
}
.shortcuts-modal {
  background: var(--color-bg-secondary); border-radius: 16px;
  padding: 24px; width: 360px; max-height: 80vh; overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp { from { transform: translateY(30px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
.shortcuts-modal h3 { margin: 0 0 16px 0; font-size: 16px; }
.shortcuts-list { display: flex; flex-direction: column; gap: 8px; }
.shortcut-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 0; border-bottom: 1px solid var(--color-border);
}
.shortcut-item:last-child { border-bottom: none; }
.shortcut-item kbd {
  background: rgba(255,255,255,0.08); border: 1px solid var(--color-border);
  border-radius: 6px; padding: 3px 10px; font-family: monospace;
  font-size: 12px; font-weight: 600; color: #818cf8;
}
.shortcut-item span { font-size: 13px; color: var(--color-text-secondary); }
.shortcuts-close {
  margin-top: 16px; width: 100%; padding: 8px; border-radius: 8px;
  background: rgba(255,255,255,0.06); border: 1px solid var(--color-border);
  color: var(--color-text-secondary); font-size: 13px; cursor: pointer;
}
.shortcuts-close:hover { border-color: #818cf8; color: #818cf8; }
</style>

