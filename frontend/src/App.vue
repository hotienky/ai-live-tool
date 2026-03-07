<template>
  <!-- Login Gate -->
  <LoginPage v-if="!isLoggedIn" @loginSuccess="onLoginSuccess" />

  <div class="app" v-else>
    <!-- Connection Lost Banner -->
    <div class="connection-lost" v-if="connectionLost">
      <AlertTriangle :size="14" style="vertical-align:middle" /> Mất kết nối server — đang thử kết nối lại...
    </div>
    <!-- Top Header Bar -->
    <header class="app-header">
      <!-- Row 1: Logo + Nav + User -->
      <div class="app-header__row1">
        <div class="app-header__logo">
          <Rocket :size="18" />
          <span>AI Live Tool</span>
        </div>
        <nav class="app-nav">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="app-nav__tab"
            :class="{ 'app-nav__tab--active': activeView === tab.key }"
            @click="navigateTo(tab.key)"
            :title="tab.label"
          >
            <component :is="tab.icon" :size="14" />
            <span class="app-nav__label">{{ tab.label }}</span>
          </button>
        </nav>
        <div class="app-header__actions">
          <button class="app-header__icon-btn app-header__theme-btn" @click="toggleTheme" :title="'Theme: ' + theme">
            <Sun v-if="resolvedTheme === 'light'" :size="14" />
            <Moon v-else-if="resolvedTheme === 'dark' && theme !== 'system'" :size="14" />
            <Monitor v-else :size="14" />
          </button>
          <NotificationBell @navigate="navigateTo" />
          <button class="app-header__btn app-header__btn--profile" @click="showProfile = true" title="Hồ sơ" v-if="currentUser">
            <UserIcon :size="14" />
            <span class="app-header__username">{{ currentUser.fullName || currentUser.name || currentUser.email }}</span>
          </button>
          <button class="app-header__btn app-header__btn--logout" @click="onLogout" title="Đăng xuất" v-if="currentUser">
            <LogOut :size="14" />
          </button>
        </div>
      </div>

      <!-- Row 2: Shop + Live Controls (contextual) -->
      <div class="app-header__row2">
        <ShopSelector
          ref="shopSelectorRef"
          :shops="shops"
          :currentShop="currentShop"
          @select="onSelectShop"
          @create="onCreateShop"
        />
        <div class="app-header__status" v-if="activeView === 'live'">
          <span class="app-header__dot" :class="statusDotClass"></span>
          <span class="app-header__status-text">{{ statusText }}</span>
        </div>
        <div class="app-header__viewers" v-if="viewerCount > 0 && activeView === 'live'">
          <Eye :size="13" />
          {{ viewerCount.toLocaleString() }}
        </div>
        <div class="app-header__spacer"></div>
        <div class="app-header__controls" v-if="activeView === 'live'">
          <button class="app-header__icon-btn" :class="{ active: ttsEnabled }" @click="toggleTTS" title="TTS">
            <Volume2 v-if="ttsEnabled" :size="15" />
            <VolumeX v-else :size="15" />
          </button>
          <button class="app-header__icon-btn" :class="{ active: showChart }" @click="showChart = !showChart" title="Biểu đồ">
            <BarChart3 :size="15" />
          </button>
          <button class="app-header__icon-btn" :class="{ active: showHistory }" @click="showHistory = !showHistory" title="Lịch sử">
            <History :size="15" />
          </button>
          <button class="app-header__icon-btn" @click="onExport" :disabled="!currentShop" title="Export CSV">
            <Download :size="15" />
          </button>
          <div class="app-header__divider"></div>
          <button class="app-header__action-btn app-header__action-btn--connect" @click="showLiveModal = true" :disabled="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'">
            <Radio :size="13" /> Phiên Live
          </button>
          <button
            class="app-header__action-btn app-header__action-btn--stop"
            @click="onDisconnect"
            v-if="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'"
          >
            <Square :size="13" /> Ngắt
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
      :shopId="currentShop?.id"
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
        <SentimentGauge :comments="allComments" />
        <PricingSuggestion :comments="allComments" />
      </section>
    </main>

    <!-- ═══ View: CRM Pipeline ═══ -->
    <LeadPipeline
      v-if="activeView === 'crm'"
      :shopId="currentShop?.id"
      @createOrder="onCreateOrderFromLead"
      @openCustomer="openCustomerDetail"
    />

    <!-- ═══ View: Reports ═══ -->
    <ReportPage
      v-if="activeView === 'reports'"
      :shopId="currentShop?.id"
    />

    <!-- ═══ View: Settings ═══ -->
    <ShopSettings
      v-if="activeView === 'settings'"
      :currentShop="currentShop"
      @openShopSelector="shopSelectorRef?.open()"
    />

    <!-- ═══ View: Session Replay ═══ -->
    <SessionReplay
      v-if="activeView === 'replay'"
    />

    <!-- ═══ View: Orders ═══ -->
    <OrderManagement
      v-if="activeView === 'orders'"
      :shopId="currentShop?.id"
    />

    <!-- ═══ View: Schedule ═══ -->
    <SchedulePlanner
      v-if="activeView === 'schedule'"
      :shopId="currentShop?.id"
      @startLive="onScheduleStartLive"
    />

    <!-- Customer Detail Modal -->
    <CustomerDetail
      :visible="showCustomerDetail"
      :customer="selectedCustomer"
      @close="showCustomerDetail = false"
    />

    <!-- Floating Panels (available in Live Monitor) -->
    <div class="app-floating" v-if="activeView === 'live'">
      <div class="app-floating__panel" v-if="showLuckyDraw">
        <LuckyDrawPanel :comments="allComments" @close="showLuckyDraw = false" />
      </div>
      <div class="app-floating__panel" v-if="showPrompter">
        <ScriptPrompter @close="showPrompter = false" />
      </div>
    </div>

    <!-- Floating Action Buttons (Live Monitor) -->
    <div class="app-fab" v-if="activeView === 'live'">
      <button class="app-fab__btn app-fab__btn--draw" @click="showLuckyDraw = !showLuckyDraw" title="Lucky Draw">
        <Gift :size="18" />
      </button>
      <button class="app-fab__btn app-fab__btn--script" @click="showPrompter = !showPrompter" title="Kịch bản Live">
        <FileText :size="18" />
      </button>
      <button class="app-fab__btn app-fab__btn--notif" @click="toggleBrowserNotif" :title="notifEnabled ? 'Tắt thông báo' : 'Bật thông báo'">
        <BellRing v-if="notifEnabled" :size="18" />
        <BellOff v-else :size="18" />
      </button>
    </div>

    <!-- Keyboard Shortcuts Help -->
    <div class="shortcuts-overlay" v-if="showShortcuts" @click.self="showShortcuts = false">
      <div class="shortcuts-modal">
        <h3><Keyboard :size="16" style="vertical-align:middle" /> Phím tắt</h3>
        <div class="shortcuts-list">
          <div v-for="s in shortcuts" :key="s.keys" class="shortcut-item">
            <kbd>{{ s.keys }}</kbd>
            <span>{{ s.desc }}</span>
          </div>
        </div>
        <button class="shortcuts-close" @click="showShortcuts = false">Đóng</button>
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
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { API_BASE } from './config.js'
import { logger } from './utils/logger.js'
import { useSocket } from './composables/useSocket.js'
import { useShops } from './composables/useShops.js'
import { useTTS } from './composables/useTTS.js'
import ShopSelector from './components/ShopSelector.vue'
import LeadPanel from './components/LeadPanel.vue'
import ChatStream from './components/ChatStream.vue'
import StatsBar from './components/StatsBar.vue'
import StatsChart from './components/StatsChart.vue'
import SentimentGauge from './components/SentimentGauge.vue'
import PricingSuggestion from './components/PricingSuggestion.vue'
import SessionHistory from './components/SessionHistory.vue'
import DashboardOverview from './components/DashboardOverview.vue'
import LeadPipeline from './components/LeadPipeline.vue'
import ReportPage from './components/ReportPage.vue'
import LoginPage from './components/LoginPage.vue'
import ShopSettings from './components/ShopSettings.vue'
import LuckyDrawPanel from './components/LuckyDrawPanel.vue'
import ScriptPrompter from './components/ScriptPrompter.vue'
import SessionReplay from './components/SessionReplay.vue'
import CustomerDetail from './components/CustomerDetail.vue'
import NotificationCenter from './components/NotificationCenter.vue'
import NotificationBell from './components/NotificationBell.vue'
import QuickReply from './components/QuickReply.vue'
import OrderManagement from './components/OrderManagement.vue'
import SchedulePlanner from './components/SchedulePlanner.vue'
import LiveSessionModal from './components/LiveSessionModal.vue'
import ToastContainer from './components/ToastContainer.vue'
import ProfileModal from './components/ProfileModal.vue'
import { useAuth } from './composables/useAuth.js'
import { useNotifications } from './composables/useNotifications.js'
import { useKeyboardShortcuts } from './composables/useKeyboardShortcuts.js'
import { useTheme } from './composables/useTheme.js'

import {
  Rocket, Eye, Volume2, VolumeX, BarChart3, Download,
  Radio, Drama, Square, RotateCcw, History,
  LayoutDashboard, MonitorPlay, Users, BarChart2,
  User as UserIcon, LogOut, Settings, Gift, FileText,
  BellRing, BellOff, History as HistoryIcon,
  Sun, Moon, Monitor, AlertTriangle, Keyboard
} from 'lucide-vue-next'

// ── Auth ──
const { isLoggedIn, currentUser, logout } = useAuth()
const { notifEnabled, notifyHotLead, notifyKeywordMatch, toggleNotif: toggleBrowserNotif } = useNotifications()
const { theme, resolvedTheme, toggleTheme } = useTheme()

function onLoginSuccess() {}
function onLogout() { logout() }
function onProfileUpdated(user) {
  currentUser.value = user
  showProfile.value = false
}

// ── Navigation ──
const tabs = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'live', label: 'Live Monitor', icon: MonitorPlay },
  { key: 'crm', label: 'CRM', icon: Users },
  { key: 'orders', label: 'Orders', icon: BarChart3 },
  { key: 'reports', label: 'Reports', icon: BarChart2 },
  { key: 'replay', label: 'Replay', icon: HistoryIcon },
  { key: 'schedule', label: 'Schedule', icon: Radio },
  { key: 'settings', label: 'Settings', icon: Settings },
]
const validViews = tabs.map(t => t.key)
function viewFromPath() {
  const path = window.location.pathname.replace(/^\//, '').split('/')[0] || ''
  return validViews.includes(path) ? path : 'live'
}
const activeView = ref(viewFromPath())

function navigateTo(view) {
  if (!validViews.includes(view)) view = 'live'
  activeView.value = view
  history.pushState({ view }, '', '/' + view)
}

window.addEventListener('popstate', () => {
  activeView.value = viewFromPath()
})

// Set initial URL if on root
if (!window.location.pathname || window.location.pathname === '/') {
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
const showLuckyDraw = ref(false)
const showPrompter = ref(false)

// Quick Reply
const showQuickReply = ref(false)
const quickReplyTarget = ref(null)
const notifCenter = ref(null)
const chatStreamRef = ref(null)
const shopSelectorRef = ref(null)
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
    showLuckyDraw.value = false
    showPrompter.value = false
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
  joinShop,
  startMock,
  resetStats,
} = useSocket()

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
  await fetchShops()
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

function onScheduleStartLive(schedule) {
  navigateTo('live')
  showLiveModal.value = true
}

function onCreateOrderFromLead(lead) {
  navigateTo('orders')
}

function onExport() {
  if (!currentShop.value) return
  window.open(`${API_BASE}/export/leads?shopId=${currentShop.value.id}&format=csv`, '_blank')
}

const statusDotClass = computed(() => {
  if (!isConnected.value) return 'app-header__dot--offline'
  const status = crawlerStatus.value?.status
  if (status === 'connected' || status === 'mock') return 'app-header__dot--live'
  if (status === 'error') return 'app-header__dot--error'
  return 'app-header__dot--waiting'
})

const statusText = computed(() => {
  if (!currentShop.value) return 'Chọn shop để bắt đầu'
  if (!isConnected.value) return 'Mất kết nối server'
  const status = crawlerStatus.value?.status
  if (status === 'connected') return `Đang Live @${currentShop.value.tiktok_username}`
  if (status === 'mock') return `Mock - ${currentShop.value.shop_name}`
  if (status === 'error') return 'Lỗi: ' + (crawlerStatus.value?.message || '')
  if (status === 'disconnected') return 'Ngắt kết nối'
  return 'Sẵn sàng kết nối'
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
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 12px;
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
  background: rgba(124,58,237,0.12);
  font-weight: 700;
  box-shadow: 0 0 12px rgba(124,58,237,0.15);
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

