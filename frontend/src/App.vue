<template>
  <div class="app">
    <!-- Top Header Bar -->
    <header class="app-header">
      <div class="app-header__left">
        <div class="app-header__logo">
          <Rocket :size="20" />
          <span>AI Live Tool</span>
        </div>
        <!-- Shop Selector -->
        <ShopSelector
          :shops="shops"
          :currentShop="currentShop"
          @select="onSelectShop"
          @create="onCreateShop"
        />
        <div class="app-header__status">
          <span class="app-header__dot" :class="statusDotClass"></span>
          <span class="app-header__status-text">{{ statusText }}</span>
        </div>
      </div>
      <div class="app-header__right">
        <div class="app-header__viewers" v-if="viewerCount > 0">
          <Eye :size="14" />
          {{ viewerCount.toLocaleString() }} viewers
        </div>
        <div class="app-header__controls">
          <!-- TTS Toggle -->
          <button
            class="app-header__btn app-header__btn--tts"
            :class="{ 'app-header__btn--tts-active': ttsEnabled }"
            @click="toggleTTS"
            title="Đọc to comment HOT"
          >
            <Volume2 v-if="ttsEnabled" :size="16" />
            <VolumeX v-else :size="16" />
          </button>
          <!-- Stats Chart Toggle -->
          <button
            class="app-header__btn app-header__btn--stats"
            :class="{ 'app-header__btn--stats-active': showChart }"
            @click="showChart = !showChart"
            title="Thống kê biểu đồ"
          >
            <BarChart3 :size="16" />
          </button>
          <!-- Export -->
          <button
            class="app-header__btn app-header__btn--export"
            @click="onExport"
            :disabled="!currentShop"
            title="Xuất CSV"
          >
            <Download :size="14" />
            Export
          </button>
          <button
            class="app-header__btn app-header__btn--connect"
            @click="onConnectTiktok"
            :disabled="!currentShop"
            :title="currentShop?.tiktok_username ? `Kết nối @${currentShop.tiktok_username}` : 'Chưa cấu hình TikTok'"
          >
            <Radio :size="14" />
            Kết nối Live
          </button>
          <button
            class="app-header__btn app-header__btn--mock"
            @click="onStartMock"
            :disabled="!currentShop"
          >
            <Drama :size="14" />
            Mock
          </button>
          <button
            class="app-header__btn app-header__btn--disconnect"
            @click="onDisconnect"
            :disabled="!currentShop"
            v-if="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'"
          >
            <Square :size="14" />
            Ngắt
          </button>
          <button
            class="app-header__btn app-header__btn--reset"
            @click="onResetStats"
          >
            <RotateCcw :size="14" />
          </button>
        </div>
      </div>
    </header>

    <!-- Stats Chart Overlay -->
    <StatsChart
      v-if="showChart"
      :stats="stats"
      :timelineData="timelineData"
      @close="showChart = false"
    />

    <!-- Main Content: 2-column layout -->
    <main class="app-main">
      <!-- Left: Lead Panel (70%) -->
      <section class="app-main__left">
        <LeadPanel :leads="leads" />
      </section>

      <!-- Right: Chat + Stats (30%) -->
      <section class="app-main__right">
        <ChatStream :comments="allComments" />
        <StatsBar :stats="stats" :viewerCount="viewerCount" />
        <SentimentGauge :comments="allComments" />
        <PricingSuggestion :comments="allComments" />
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
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

import {
  Rocket, Eye, Volume2, VolumeX, BarChart3, Download,
  Radio, Drama, Square, RotateCcw
} from 'lucide-vue-next'

// Socket composable
const {
  isConnected,
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

// Stats Chart
const showChart = ref(false)
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
  } catch (err) { console.error('Error creating shop:', err) }
}

async function onConnectTiktok() {
  if (!currentShop.value) return
  try { await connectShop(currentShop.value.id, false) }
  catch (err) { console.error('Connect error:', err) }
}

function onStartMock() {
  if (!currentShop.value) return
  startMock(currentShop.value.id, currentShop.value.shop_name)
}

async function onDisconnect() {
  if (!currentShop.value) return
  try { await disconnectShop(currentShop.value.id) }
  catch (err) { console.error('Disconnect error:', err) }
}

function onResetStats() {
  if (currentShop.value) {
    resetStats(currentShop.value.id)
    timelineData.value = []
  }
}

function onExport() {
  if (!currentShop.value) return
  window.open(`http://localhost:3000/api/export/leads?shopId=${currentShop.value.id}&format=csv`, '_blank')
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
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
  background: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  gap: 16px;
}

.app-header__left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 18px;
  font-weight: 800;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.app-header__logo svg {
  color: #ff3b5c;
}

.app-header__status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-secondary);
}

.app-header__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
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

.app-header__right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.app-header__viewers {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.app-header__controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.app-header__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 8px;
  border: none;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.app-header__btn:disabled { opacity: 0.4; cursor: not-allowed; }

.app-header__btn--connect { background: var(--color-accent-hot); color: white; }
.app-header__btn--connect:hover:not(:disabled) { background: #e63350; transform: scale(1.03); }

.app-header__btn--mock {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.app-header__btn--mock:hover:not(:disabled) {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.app-header__btn--disconnect { background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }
.app-header__btn--disconnect:hover:not(:disabled) { background: #991b1b; }

.app-header__btn--reset {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 6px 10px;
}
.app-header__btn--reset:hover { color: var(--color-text-primary); background: var(--color-bg-card); }

.app-header__btn--tts,
.app-header__btn--stats {
  background: transparent;
  color: var(--color-text-muted);
  border: 1px solid var(--color-border);
  padding: 6px 10px;
}
.app-header__btn--tts:hover,
.app-header__btn--stats:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card);
}
.app-header__btn--tts-active { color: #38bdf8; border-color: #38bdf8; background: rgba(56, 189, 248, 0.1); }
.app-header__btn--stats-active { color: #ff8c42; border-color: #ff8c42; background: rgba(255, 140, 66, 0.1); }

.app-header__btn--export {
  background: var(--color-bg-card);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
}
.app-header__btn--export:hover:not(:disabled) {
  background: var(--color-bg-card-hover);
  color: var(--color-text-primary);
}

.app-main { display: flex; flex: 1; overflow: hidden; }
.app-main__left { flex: 7; border-right: 1px solid var(--color-border); overflow: hidden; }
.app-main__right { flex: 3; display: flex; flex-direction: column; overflow: hidden; }
</style>
