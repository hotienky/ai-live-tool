<template>
  <div class="dashboard">
    <!-- Stats Cards -->
    <div class="dashboard__cards">
      <div class="dashboard__card dashboard__card--live">
        <div class="dashboard__card-icon">
          <Radio :size="22" />
        </div>
        <div>
          <p class="dashboard__card-value">{{ overview?.totalActiveLives || 0 }}</p>
          <p class="dashboard__card-label">Đang Live</p>
        </div>
      </div>
      <div class="dashboard__card dashboard__card--leads">
        <div class="dashboard__card-icon">
          <Flame :size="22" />
        </div>
        <div>
          <p class="dashboard__card-value">{{ overview?.dbStats?.todayLeads || 0 }}</p>
          <p class="dashboard__card-label">Leads hôm nay</p>
        </div>
      </div>
      <div class="dashboard__card dashboard__card--comments">
        <div class="dashboard__card-icon">
          <MessageSquare :size="22" />
        </div>
        <div>
          <p class="dashboard__card-value">{{ overview?.dbStats?.todayComments || 0 }}</p>
          <p class="dashboard__card-label">Comments hôm nay</p>
        </div>
      </div>
      <div class="dashboard__card dashboard__card--rate">
        <div class="dashboard__card-icon">
          <TrendingUp :size="22" />
        </div>
        <div>
          <p class="dashboard__card-value">{{ conversionRate }}%</p>
          <p class="dashboard__card-label">Conversion Rate</p>
        </div>
      </div>
    </div>

    <div class="dashboard__grid">
      <!-- Active Lives -->
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">
          <Radio :size="16" /> Phiên Live đang hoạt động
        </h3>
        <div v-if="activeLives.length === 0" class="dashboard__empty">
          Không có phiên live nào đang hoạt động
        </div>
        <div v-for="live in activeLives" :key="live.shopId" class="dashboard__live-item" @click="$emit('goLive', live)" style="cursor:pointer">
          <div class="dashboard__live-dot"></div>
          <div class="dashboard__live-info">
            <span class="dashboard__live-name">{{ live.shopName }}</span>
            <span class="dashboard__live-platform">{{ live.platform }}</span>
          </div>
          <div class="dashboard__live-stats">
            <span><Flame :size="13" style="color:#ff3b5c;vertical-align:middle" /> {{ live.stats.hot }}</span>
            <span><CircleDot :size="13" style="color:#ff8c42;vertical-align:middle" /> {{ live.stats.warm }}</span>
            <span><Circle :size="13" style="color:#a1a1aa;vertical-align:middle" /> {{ live.stats.cold }}</span>
            <span class="dashboard__live-total">{{ live.stats.total }} total</span>
          </div>
          <span class="dashboard__live-viewers" v-if="live.peakViewers > 0">
            <Eye :size="12" /> {{ live.peakViewers }}
          </span>
        </div>
      </div>

      <!-- Recent Leads -->
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">
          <Flame :size="16" /> Leads mới nhất
        </h3>
        <div v-if="recentLeads.length === 0" class="dashboard__empty">
          Chưa có leads nào
        </div>
        <div v-for="lead in recentLeads.slice(0, 10)" :key="lead.id || lead.timestamp" class="dashboard__lead-item" @click="$emit('goLead', lead)" style="cursor:pointer">
          <Flame v-if="(lead.ChatLog?.ai_label || lead.label) === 'HOT' || (lead.ChatLog?.ai_label || lead.label) === '[HOT]'" :size="14" style="color: #ff3b5c" />
          <CircleDot v-else :size="14" style="color: #ff8c42" />
          <span class="dashboard__lead-name">{{ lead.ChatLog?.nickname || lead.nickname || 'Unknown' }}</span>
          <span class="dashboard__lead-text">{{ (lead.ChatLog?.comment_text || lead.comment || '').substring(0, 60) }}</span>
          <span class="dashboard__lead-time">{{ formatTime(lead.created_at || lead.timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Top Customers -->
    <div class="dashboard__section dashboard__section--full" v-if="topCustomers.length > 0">
      <h3 class="dashboard__section-title">
        <Crown :size="16" /> Top Khách Hàng
      </h3>
      <div class="dashboard__customers">
        <div v-for="(c, i) in topCustomers" :key="c.nickname" class="dashboard__customer" @click="$emit('goCustomer', c)" style="cursor:pointer">
          <span class="dashboard__customer-rank">{{ i + 1 }}</span>
          <div class="dashboard__customer-avatar" :style="{ background: avatarGradient(i) }">
            {{ (c.nickname || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="dashboard__customer-info">
            <span class="dashboard__customer-name">{{ c.nickname }}</span>
            <span class="dashboard__customer-stats">
              {{ c.totalComments }} comments · <Flame :size="12" style="color:#ff3b5c;vertical-align:middle" /> {{ c.hotCount }} HOT
            </span>
          </div>
          <div class="dashboard__customer-rate">
            <div class="dashboard__rate-bar">
              <div class="dashboard__rate-fill" :style="{ width: c.hotRate + '%' }"></div>
            </div>
            <span class="dashboard__rate-label">{{ c.hotRate }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Queue Stats -->
    <div class="dashboard__ai" v-if="overview?.aiStats">
      <h3 class="dashboard__section-title">
        <Cpu :size="16" /> AI Queue
      </h3>
      <div class="dashboard__ai-stats">
        <span><CheckCircle :size="13" style="color:#10b981;vertical-align:middle" /> Xử lý: {{ overview.aiStats.processed || 0 }}</span>
        <span><Hourglass :size="13" style="color:#f59e0b;vertical-align:middle" /> Queue: {{ overview.aiStats.queueLength || 0 }}</span>
        <span><RefreshCw :size="13" style="color:#3b82f6;vertical-align:middle" /> Retry: {{ overview.aiStats.retried || 0 }}</span>
        <span><XCircle :size="13" style="color:#ef4444;vertical-align:middle" /> Lỗi: {{ overview.aiStats.failed || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useDashboard } from '../composables/useDashboard.js'
import {
  Radio, Flame, MessageSquare, TrendingUp, Eye, CircleDot, Cpu, Crown,
  CheckCircle, Hourglass, RefreshCw, XCircle, Circle
} from 'lucide-vue-next'

const emit = defineEmits(['goLive', 'goLead', 'goCustomer'])

const { overview, recentLeads, analytics, topCustomers, loading, fetchOverview, fetchRecentLeads, fetchAnalytics, fetchTopCustomers } = useDashboard()

let refreshInterval = null

const activeLives = computed(() => overview.value?.activeConnections || [])
const conversionRate = computed(() => analytics.value?.conversion?.rate || 0)

const avatarGradients = ['#ff3b5c,#ff8c42', '#3b82f6,#818cf8', '#10b981,#34d399', '#f59e0b,#fbbf24', '#a855f7,#c084fc', '#ef4444,#f87171', '#06b6d4,#22d3ee', '#ec4899,#f472b6', '#8b5cf6,#a78bfa', '#14b8a6,#2dd4bf']
function avatarGradient(i) { return `linear-gradient(135deg, ${avatarGradients[i % avatarGradients.length].split(',').join(', ')})` }

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
}

async function loadAll() {
  await Promise.all([fetchOverview(), fetchRecentLeads(), fetchAnalytics(), fetchTopCustomers()])
}

onMounted(() => {
  loadAll()
  refreshInterval = setInterval(loadAll, 15000) // Refresh mỗi 15s
})

onUnmounted(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.dashboard { padding: 24px; overflow-y: auto; height: 100%; }

/* ── Stats Cards ── */
.dashboard__cards {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
}
.dashboard__card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 22px; border-radius: 16px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  position: relative; overflow: hidden;
}
.dashboard__card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 16px 0 0 16px;
}
.dashboard__card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.dashboard__card-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dashboard__card--live::before { background: linear-gradient(180deg, #10b981, #059669); }
.dashboard__card--live .dashboard__card-icon { background: rgba(16,185,129,0.12); color: #34d399; }
.dashboard__card--leads::before { background: linear-gradient(180deg, #ef4444, #dc2626); }
.dashboard__card--leads .dashboard__card-icon { background: rgba(239,68,68,0.12); color: #f87171; }
.dashboard__card--comments::before { background: linear-gradient(180deg, #3b82f6, #2563eb); }
.dashboard__card--comments .dashboard__card-icon { background: rgba(59,130,246,0.12); color: #60a5fa; }
.dashboard__card--rate::before { background: linear-gradient(180deg, #a855f7, #7c3aed); }
.dashboard__card--rate .dashboard__card-icon { background: rgba(168,85,247,0.12); color: #c084fc; }

.dashboard__card-value { font-size: 28px; font-weight: 800; line-height: 1; color: var(--color-text-primary); }
.dashboard__card-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }

/* ── Grid Layout ── */
.dashboard__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.dashboard__section {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px;
  transition: all 0.3s;
}
.dashboard__section:hover { border-color: var(--color-border-hover); }
.dashboard__section-title {
  font-size: 14px; font-weight: 800; margin-bottom: 14px;
  display: flex; align-items: center; gap: 8px;
  color: var(--color-text-primary);
}
.dashboard__empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 40px 20px;
  color: var(--color-text-muted); font-size: 13px; font-style: italic;
}

/* Live Items */
.dashboard__live-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 8px; border-radius: 10px;
  transition: background 0.2s;
}
.dashboard__live-item:hover { background: var(--color-bg-card); }
.dashboard__live-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #10b981; flex-shrink: 0;
  box-shadow: 0 0 8px rgba(16,185,129,0.6);
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.dashboard__live-info { display: flex; flex-direction: column; flex: 1; }
.dashboard__live-name { font-size: 13px; font-weight: 700; }
.dashboard__live-platform { font-size: 11px; color: var(--color-text-muted); text-transform: capitalize; }
.dashboard__live-stats { display: flex; gap: 8px; font-size: 12px; }
.dashboard__live-total { color: var(--color-text-muted); }
.dashboard__live-viewers {
  font-size: 12px; color: var(--color-text-muted);
  display: flex; align-items: center; gap: 3px;
}

/* Lead Items */
.dashboard__lead-item {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 8px; border-radius: 8px; font-size: 13px;
  transition: background 0.15s;
}
.dashboard__lead-item:hover { background: rgba(124,58,237,0.04); }
.dashboard__lead-name {
  font-weight: 700; white-space: nowrap; min-width: 90px; color: var(--color-text-primary);
}
.dashboard__lead-text {
  flex: 1; color: var(--color-text-secondary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dashboard__lead-time {
  font-size: 11px; color: var(--color-text-muted); white-space: nowrap;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

/* AI Stats */
.dashboard__ai {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px;
}
.dashboard__ai-stats {
  display: flex; gap: 20px; font-size: 13px; color: var(--color-text-secondary);
}

/* Top Customers */
.dashboard__section--full { grid-column: 1 / -1; }
.dashboard__customers { display: flex; flex-direction: column; gap: 2px; }
.dashboard__customer {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  transition: all 0.2s;
}
.dashboard__customer:hover { background: var(--color-bg-card); }
.dashboard__customer-rank {
  font-size: 13px; font-weight: 800; color: var(--color-text-muted);
  min-width: 20px; text-align: center;
}
.dashboard__customer:nth-child(1) .dashboard__customer-rank { color: #fbbf24; font-size: 15px; }
.dashboard__customer:nth-child(2) .dashboard__customer-rank { color: #d1d5db; }
.dashboard__customer:nth-child(3) .dashboard__customer-rank { color: #d97706; }
.dashboard__customer-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 14px; font-weight: 700; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}
.dashboard__customer-info { flex: 1; display: flex; flex-direction: column; }
.dashboard__customer-name { font-size: 13px; font-weight: 700; }
.dashboard__customer-stats { font-size: 11px; color: var(--color-text-muted); }
.dashboard__customer-rate {
  display: flex; align-items: center; gap: 8px; min-width: 90px;
}
.dashboard__rate-bar {
  flex: 1; height: 5px; background: var(--color-border);
  border-radius: 3px; overflow: hidden;
}
.dashboard__rate-fill {
  height: 100%; background: linear-gradient(90deg, #ef4444, #f59e0b);
  border-radius: 3px; transition: width 0.6s ease;
}
.dashboard__rate-label {
  font-size: 11px; font-weight: 800; color: #ef4444; min-width: 32px; text-align: right;
}
</style>
