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

      <!-- Row 2: Live Controls (only visible on Live Monitor) -->
      <div class="app-header__row2" v-if="activeView === 'live'">
        <div class="app-header__shop-info" v-if="currentShop">
          <span class="app-header__shop-name">{{ currentShop.shop_name || currentShop.shopName }}</span>
        </div>
        <div class="app-header__status">
          <span class="app-header__dot" :class="statusDotClass"></span>
          <span class="app-header__status-text">{{ statusText }}</span>
        </div>
        <div class="app-header__viewers" v-if="viewerCount > 0">
          <Eye :size="13" />
          {{ viewerCount.toLocaleString() }}
        </div>
        <div class="app-header__spacer"></div>
        <div class="app-header__controls">
          <button class="app-header__icon-btn" :class="{ active: ttsEnabled }" @click="toggleTTS" title="TTS">
            <Volume2 v-if="ttsEnabled" :size="15" />
            <VolumeX v-else :size="15" />
          </button>
          <button class="app-header__icon-btn" :class="{ active: showChart }" @click="showChart = !showChart" :title="t('admin.chart', 'Biểu đồ')">
            <BarChart3 :size="15" />
          </button>
          <button class="app-header__icon-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory" :title="t('admin.history', 'Lịch sử')">
            <History :size="15" />
          </button>
          <button class="app-header__icon-btn" @click="onExport" title="Export CSV">
            <Download :size="15" />
          </button>
          <div class="app-header__divider"></div>
          <button class="app-header__action-btn app-header__action-btn--connect" @click="showLiveModal = true" :disabled="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'">
            <Radio :size="13" /> {{ t('admin.live_session', 'Phiên Live') }}
          </button>
          <button
            class="app-header__action-btn app-header__action-btn--stop"
            @click="onDisconnect"
            v-if="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'"
          >
            <Square :size="13" /> {{ t('admin.disconnect', 'Ngắt') }}
          </button>
          <button class="app-header__icon-btn" @click="onResetStats" title="Reset">
            <RotateCcw :size="14" />
          </button>
        </div>
      </div>
    </header>

    <!-- Session History Panel -->
    <SessionHistory
      :visible="showHistory"
      @close="showHistory = false"
    />

    <!-- Stats Chart Overlay -->
    <StatsChart
      v-if="showChart"
      :stats="stats"
      :timelineData="timelineData"
      @close="showChart = false"
    />

    <!-- ═══ View: Dashboard ═══ -->
    <DashboardOverview
      v-if="activeView === 'dashboard'"
      @goLive="navigateTo('live')"
      @goLead="navigateTo('crm')"
      @goCustomer="(c) => openCustomerDetail({ nickname: c.nickname, uniqueId: c.nickname })"
    />

    <!-- ═══ View: Live Monitor ═══ -->
    <main class="app-main" v-if="activeView === 'live'">
      <!-- Left: Lead Panel (70%) -->
      <section class="app-main__left">
        <LeadPanel :leads="leads" @openCustomer="openCustomerDetail" />
      </section>

      <!-- Right: Chat + Stats (30%) -->
      <section class="app-main__right">
        <ChatStream ref="chatStreamRef" :comments="allComments" @reply="onQuickReply" />
        <QuickReply
          :visible="showQuickReply"
          :targetComment="quickReplyTarget"
          @close="showQuickReply = false"
          @sent="onReplySent"
        />
        <StatsBar :stats="stats" :viewerCount="viewerCount" />
      </section>
    </main>

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



    <!-- Post-Live Report Modal -->
    <PostLiveReport
      :visible="showPostLiveReport"
      :report="postLiveReport"
      @close="showPostLiveReport = false"
    />

    <!-- Floating Action Buttons (Live Monitor) -->
    <div class="app-fab" v-if="activeView === 'live'">
      <button class="app-fab__btn app-fab__btn--notif" @click="toggleBrowserNotif" :title="notifEnabled ? t('admin.disable_notif', 'Tắt thông báo') : t('admin.enable_notif', 'Bật thông báo')">
        <BellRing v-if="notifEnabled" :size="18" />
        <BellOff v-else :size="18" />
      </button>
    </div>

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

    <!-- Live Session Modal -->
    <LiveSessionModal
      v-if="showLiveModal"
      @close="showLiveModal = false"
      @started="onLiveSessionStarted"
    />
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
import { logger } from './utils/logger.js'
import { useSocket } from './composables/useSocket.js'
import { useShops } from './composables/useShops.js'
import { useTTS } from './composables/useTTS.js'
import ShopSelector from './components/ShopSelector.vue' // keep import for potential future use
import LeadPanel from './components/LeadPanel.vue'
import ChatStream from './components/ChatStream.vue'
import StatsBar from './components/StatsBar.vue'
import StatsChart from './components/StatsChart.vue'
import SessionHistory from './components/SessionHistory.vue'
import DashboardOverview from './components/DashboardOverview.vue'
import LeadPipeline from './components/LeadPipeline.vue'
import ReportPage from './components/ReportPage.vue'
import LoginPage from './components/LoginPage.vue'
import ShopSettings from './components/ShopSettings.vue'
import CustomerDetail from './components/CustomerDetail.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import NotificationBell from './components/NotificationBell.vue'
import NotificationPage from './components/NotificationPage.vue'
import QuickReply from './components/QuickReply.vue'

import LiveSessionModal from './components/LiveSessionModal.vue'
import ToastContainer from './components/ToastContainer.vue'
import ProfileModal from './components/ProfileModal.vue'
import PostLiveReport from './components/PostLiveReport.vue'
import StorefrontHome from './components/StorefrontHome.vue'
import StorefrontProduct from './components/StorefrontProduct.vue'
import StorefrontCategory from './components/StorefrontCategory.vue'
import StorefrontPage from './components/StorefrontPage.vue'
import { useAuth } from './composables/useAuth.js'
import { useNotifications } from './composables/useNotifications.js'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'
import { useTheme } from './composables/useTheme.js'
import { usePermissions, fetchPermissionsIfEmpty } from './composables/usePermissions.js'
import { usePluginLoader } from './composables/usePluginLoader.js'
import { useI18n } from './composables/useI18n.js'

import {
  Rocket, Eye, Volume2, VolumeX, BarChart3, Download,
  Radio, Drama, Square, RotateCcw, History,
  LayoutDashboard, MonitorPlay, Users, BarChart2,
  User as UserIcon, LogOut, Settings, Store, ChevronDown,
  BellRing, BellOff,
  Sun, Moon, Monitor, AlertTriangle, Keyboard,
  ShoppingBag, FolderTree, Award, Receipt, Tag,
  Key, MessageCircle, Shield, Link, Image, BookOpen, Zap,
  ClipboardList, Palette, Cog, Globe, LayoutList, Truck, FormInput,
} from 'lucide-vue-next'

// ── Auth ──
const { isLoggedIn, currentUser, logout } = useAuth()
const { notifEnabled, notifyHotLead, notifyKeywordMatch, toggleNotif: toggleBrowserNotif } = useNotifications()
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

async function fetchTenantFeatures() {
  try {
    const res = await fetch('/api/tenant-status')
    if (res.ok) {
      const data = await res.json()
      const features = data.features || 'all'
      tenantFeatures.value = features
      localStorage.setItem('tenant_features', features)
    }
  } catch (e) {
    console.warn('[Features] Failed to fetch:', e.message)
  }
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
  } catch (e) {
    console.warn('[Modules] Failed to fetch:', e.message)
  }
}

function isModuleInstalled(moduleId) {
  if (!moduleId) return true // no moduleId = always visible
  return installedModules.value.includes(moduleId)
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

const navItems = [
  {
    key: 'live-group', label: 'Live', icon: MonitorPlay,
    featureGroup: 'livestream',
    permission: null,
    activeKeys: ['dashboard', 'live', 'crm', 'reports', 'live/keywords', 'live/replies', 'live/moderation', 'live/connection'],
    children: [
      { key: 'dashboard', view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'live', view: 'live', label: 'Live Monitor', icon: MonitorPlay },
      { key: 'crm', view: 'crm', label: 'CRM / Leads', icon: Users },
      { key: 'reports', view: 'reports', label: t('admin.reports', 'Báo cáo'), icon: BarChart2 },
      { key: 'live-keywords', view: 'live/keywords', label: 'Keywords', icon: Key },
      { key: 'live-replies', view: 'live/replies', label: 'Auto Reply', icon: MessageCircle },
      { key: 'live-moderation', view: 'live/moderation', label: 'Moderation', icon: Shield },
      { key: 'live-connection', view: 'live/connection', label: t('admin.connection', 'Kết nối'), icon: Link },
    ],
  },
  {
    key: 'shop/products', label: t('admin.store', 'Cửa hàng'), icon: Store,
    featureGroup: 'store',
    permission: 'products.view',
  },

]

// Check if item's featureGroup is enabled for this tenant
function isFeatureEnabled(featureGroup) {
  if (!featureGroup) return true // no featureGroup = always visible (e.g. Dashboard)
  const tf = tenantFeatures.value
  if (tf === 'all') return true
  return tf === featureGroup
}

// Filter nav items by user permissions AND tenant feature groups AND installed modules
const filteredNavItems = computed(() => {
  return navItems
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

// Route → settingsTab mapping
const routeToTab = {
  'live/keywords': 'keywords', 'live/replies': 'replies', 'live/moderation': 'moderation', 'live/connection': 'connection',
  'shop/products': 'products', 'shop/products/edit': 'products', 'shop/categories': 'categories', 'shop/categories/edit': 'categories', 'shop/brands': 'brands',
  'shop/promotions': 'promotions', 'shop/flash-sales': 'flash-sales', 'shop/banners': 'banners', 'shop/media': 'media', 'shop/cms': 'cms',
  'shop/cms/create': 'cms', 'shop/cms/edit': 'cms',
  'shop/flash-sales/create': 'flash-sales', 'shop/flash-sales/edit': 'flash-sales',
  'shop/appearance': 'appearance', 'shop/layout': 'storefront-layout',
  'shop/info': 'store-info', 'shop/config': 'system-config', 'shop/payment': 'payment', 'shop/shipping': 'shipping',
  'system/api-keys': 'api-keys', 'system/webhooks': 'webhooks', 'shop/languages': 'languages', 'shop/custom-fields': 'custom-fields',
  'system/logs': 'activity-logs', 'system/roles': 'roles',
  'orders': 'orders', 'orders/customers': 'shop-customers', 'orders/accounting': 'accounting',
  'shop/tax': 'tax', 'orders/detail': 'order-detail',
  'warehouse/stock-receipts': 'stock-receipts', 'warehouse/suppliers': 'suppliers', 'warehouse/payment-vouchers': 'payment-vouchers', 'warehouse/purchase-orders': 'purchase-orders', 'warehouse/inventory-reports': 'inventory-reports',
  'system/modules': 'modules',
}
const validViews = [
  'dashboard', 'live', 'crm', 'reports',
  'notifications',
  'shop/cms/create', 'shop/cms/edit',
  'shop/products/edit', 'shop/categories/edit',
  ...Object.keys(routeToTab),
]

// ── Feature-group → views map (derived from navItems) ──
// Used to block URL-typed navigation to disabled feature areas.
const viewFeatureGroupMap = (() => {
  const map = {}
  for (const item of navItems) {
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
  for (const key of Object.keys(routeToTab)) {
    if (!map[key] && (key.startsWith('shop/') || key === 'orders' || key.startsWith('orders/') || key.startsWith('warehouse/'))) {
      map[key] = 'store'
    }
  }
  return map
})()

function getViewFeatureGroup(view) {
  if (viewFeatureGroupMap[view]) return viewFeatureGroupMap[view]
  // Match prefix (e.g. 'shop/products/edit' → 'store')
  for (const [k, fg] of Object.entries(viewFeatureGroupMap)) {
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
  else if (validViews.includes(path))             resolved = path
  else {
    const first = path.split('/')[0] || ''
    resolved = validViews.includes(first) ? first : null
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
const settingsActiveTab = computed(() => routeToTab[activeView.value] || 'products')
// Is the current view a settings-based page?
const isSettingsView = computed(() => activeView.value in routeToTab)

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

  if (!validViews.includes(view)) {
    // Check if it matches view + ID pattern
    const base = view.replace(/\/\d+$/, '')
    view = validViews.includes(base) ? base : defaultAccessibleView()
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

// Floating panels
const showPostLiveReport = ref(false)

// Quick Reply
const showQuickReply = ref(false)
const quickReplyTarget = ref(null)
const notifCenter = ref(null)
const chatStreamRef = ref(null)
const shopSelectorRef = ref(null) // kept for compatibility
const showShortcuts = ref(false)
const showLiveModal = ref(false)

// Keyboard shortcuts
const { shortcuts } = useKeyboardShortcuts({
  onSwitchTab: (tab) => { navigateTo(tab) },
  onToggleSearch: () => {
    if (activeView.value !== 'live') navigateTo('live')
    if (chatStreamRef.value) {
      chatStreamRef.value.showSearch = !chatStreamRef.value.showSearch
    }
  },
  onStartMock: () => onStartMock(),
  onCloseModal: () => {
    showCustomerDetail.value = false
    showQuickReply.value = false
    showShortcuts.value = false
  },
  onToggleHelp: () => { showShortcuts.value = !showShortcuts.value },
})

function onQuickReply(comment) {
  quickReplyTarget.value = comment
  showQuickReply.value = true
}

function onReplySent({ comment, reply }) {
  showQuickReply.value = false
  if (notifCenter.value) {
    notifCenter.value.addNotification('system', `Đã gửi reply cho @${comment?.nickname || 'user'}`)
  }
}

// Socket composable
const {
  isConnected,
  connectionLost,
  leads,
  allComments,
  stats,
  crawlerStatus,
  viewerCount,
  postLiveReport,
  joinShop,
  startMock,
  resetStats,
} = useSocket()

// Auto-show post-live report when received
watch(postLiveReport, (report) => {
  if (report) showPostLiveReport.value = true
})

// Redirect away from disabled-feature views when tenant features load/change
watch(tenantFeatures, () => {
  const fg = getViewFeatureGroup(activeView.value)
  if (fg && !isFeatureEnabled(fg)) navigateTo(defaultAccessibleView())
})

// Shops composable
const {
  shops,
  currentShop,
  fetchShops,
  createShop,
  connectShop,
  disconnectShop,
  selectShop,
} = useShops()

// TTS composable
const { isEnabled: ttsEnabled, toggle: toggleTTS, announceHotLead } = useTTS()

// Stats Chart & Session History
const showChart = ref(false)
const showHistory = ref(false)
const showProfile = ref(false)
const timelineData = ref([])

let timelineInterval = null

function startTimelineCollection() {
  if (timelineInterval) clearInterval(timelineInterval)
  timelineInterval = setInterval(() => {
    const now = new Date()
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    timelineData.value.push({
      time,
      count: stats.value.total,
      hot: stats.value.hot,
      warm: stats.value.warm,
    })
    if (timelineData.value.length > 30) {
      timelineData.value = timelineData.value.slice(-30)
    }
  }, 30000)
}

watch(leads, (newLeads, oldLeads) => {
  if (newLeads.length > (oldLeads?.length || 0)) {
    const latest = newLeads[newLeads.length - 1]
    if (latest.label === '[HOT]') {
      announceHotLead(latest)
      notifyHotLead(latest)
    }
  }
}, { deep: true })

watch(currentShop, (shop) => {
  if (shop) {
    joinShop(shop.id)
    timelineData.value = []
  }
})

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
  startTimelineCollection()
})

onUnmounted(() => {
  if (timelineInterval) clearInterval(timelineInterval)
})

function onSelectShop(shop) { selectShop(shop) }

async function onCreateShop(shopData) {
  try {
    const newShop = await createShop(shopData)
    selectShop(newShop)
  } catch (err) { logger.error('Error creating shop:', err) }
}

async function onConnectTiktok() {
  if (!currentShop.value) return
  try { await connectShop(currentShop.value.id, false) }
  catch (err) { logger.error('Connect error:', err) }
}

function onStartMock() {
  if (!currentShop.value) return
  startMock(currentShop.value.id, currentShop.value.shop_name)
}

async function onLiveSessionStarted(shop, mock) {
  // Refresh shops, select the new shop, join socket
  await fetchShops()
  const found = shops.value.find(s => s.id === shop.id)
  if (found) selectShop(found)
  navigateTo('live')
}

async function onDisconnect() {
  if (!currentShop.value) return
  try { await disconnectShop(currentShop.value.id) }
  catch (err) { logger.error('Disconnect error:', err) }
}

function onResetStats() {
  if (currentShop.value) {
    resetStats(currentShop.value.id)
    timelineData.value = []
  }
}





function onExport() {
  if (!currentShop.value) return
  window.open(`${API_BASE}/export/leads?format=csv`, '_blank')
}

const statusDotClass = computed(() => {
  if (!isConnected.value) return 'app-header__dot--offline'
  const status = crawlerStatus.value?.status
  if (status === 'connected' || status === 'mock') return 'app-header__dot--live'
  if (status === 'error') return 'app-header__dot--error'
  return 'app-header__dot--waiting'
})

const statusText = computed(() => {
  if (!currentShop.value) return t('admin.msg_select_shop', 'Chọn shop để bắt đầu')
  if (!isConnected.value) return t('admin.msg_connection_lost', 'Mất kết nối server')
  const status = crawlerStatus.value?.status
  if (status === 'connected' || status === 'mock') {
    const shop = currentShop.value
    const identifier = shop.tiktok_username || shop.shopee_id || shop.facebook_page_id || shop.youtube_channel_id || shop.shop_name || ''
    const prefix = status === 'mock' ? 'Mock' : t('admin.msg_live_now', 'Đang Live')
    return `${prefix} - ${shop.shop_name}${identifier && identifier !== shop.shop_name ? ` @${identifier}` : ''}`
  }
  if (status === 'error') return t('admin.msg_aaf377aa', 'Lỗi') + ': ' + (crawlerStatus.value?.message || '')
  if (status === 'disconnected') return t('admin.msg_disconnected', 'Ngắt kết nối')
  return t('admin.msg_ready', 'Sẵn sàng kết nối')
})
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

/* ── Row 2: Shop + Controls ── */
.app-header__row2 {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 16px;
}

.app-header__spacer { flex: 1; }

.app-header__shop-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: var(--color-bg-card);
  border-radius: 8px;
  border: 1px solid var(--color-border);
}
.app-header__shop-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
}

.app-header__status {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
.app-header__dot {
  width: 7px; height: 7px; border-radius: 50%;
}
.app-header__dot--live {
  background: var(--color-success);
  box-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
  animation: dotPulse 1.5s infinite;
}
.app-header__dot--waiting { background: #f59e0b; animation: dotPulse 1.5s infinite; }
.app-header__dot--offline { background: #6b7280; }
.app-header__dot--error { background: var(--color-accent-hot); }
.app-header__status-text { white-space: nowrap; }

.app-header__viewers {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.app-header__controls {
  display: flex;
  align-items: center;
  gap: 4px;
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
.app-main__left { flex: 7; border-right: 1px solid var(--color-border); overflow: hidden; }
.app-main__right { flex: 3; display: flex; flex-direction: column; overflow: hidden; }

/* Responsive */
@media (max-width: 1024px) {
  .app-nav__label { display: none; }
  .app-nav__tab { padding: 5px 8px; }
  .app-header__username { display: none; }
}
@media (max-width: 768px) {
  .app-header__row1 { gap: 6px; padding: 6px 10px; }
  .app-header__row2 { flex-wrap: wrap; gap: 6px; padding: 6px 10px; }
  .app-header__controls { flex-wrap: wrap; }
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

/* FAB Buttons */
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

