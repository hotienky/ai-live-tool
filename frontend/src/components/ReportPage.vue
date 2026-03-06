<template>
  <div class="report">
    <!-- Header -->
    <div class="report__header">
      <h2 class="report__title">
        <BarChart3 :size="20" />
        Báo cáo & Phân tích
      </h2>
      <div class="report__controls">
        <select v-model="selectedDays" class="report__select" @change="loadAll">
          <option :value="7">7 ngày</option>
          <option :value="14">14 ngày</option>
          <option :value="30">30 ngày</option>
        </select>
        <button class="report__refresh" @click="loadAll" :disabled="loading">
          <RefreshCcw :size="14" :class="{ 'spin': loading }" />
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="report__summary" v-if="summary">
      <div class="report__card">
        <MessageSquare :size="20" class="report__card-icon" style="color: #3b82f6" />
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.totalComments?.toLocaleString() || 0 }}</span>
          <span class="report__card-label">Tổng comments</span>
        </div>
      </div>
      <div class="report__card">
        <Flame :size="20" class="report__card-icon" style="color: #ff3b5c" />
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.totalHot || 0 }}</span>
          <span class="report__card-label">HOT leads</span>
        </div>
      </div>
      <div class="report__card">
        <TrendingUp :size="20" class="report__card-icon" style="color: #10b981" />
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.hotRate || 0 }}%</span>
          <span class="report__card-label">HOT rate</span>
        </div>
      </div>
      <div class="report__card">
        <Calculator :size="20" class="report__card-icon" style="color: #a855f7" />
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.avgCommentsPerDay || 0 }}</span>
          <span class="report__card-label">TB/ngày</span>
        </div>
      </div>
    </div>

    <div class="report__grid">
      <!-- Daily Chart -->
      <div class="report__section">
        <h3 class="report__section-title">📊 Comments theo ngày</h3>
        <div class="report__chart">
          <div
            v-for="(day, i) in dailyData"
            :key="i"
            class="report__bar-group"
            :title="`${day.date}: HOT ${day.HOT}, WARM ${day.WARM}, COLD ${day.COLD}`"
          >
            <div class="report__bar-stack">
              <div
                class="report__bar report__bar--hot"
                :style="{ height: barHeight(day.HOT, maxDaily) }"
              ></div>
              <div
                class="report__bar report__bar--warm"
                :style="{ height: barHeight(day.WARM, maxDaily) }"
              ></div>
              <div
                class="report__bar report__bar--cold"
                :style="{ height: barHeight(day.COLD, maxDaily) }"
              ></div>
            </div>
            <span class="report__bar-label">{{ formatDate(day.date) }}</span>
            <span class="report__bar-val">{{ day.total }}</span>
          </div>
        </div>
        <div class="report__legend">
          <span><span class="report__dot" style="background:#ff3b5c"></span> HOT</span>
          <span><span class="report__dot" style="background:#ff8c42"></span> WARM</span>
          <span><span class="report__dot" style="background:#64748b"></span> COLD</span>
        </div>
      </div>

      <!-- Conversion Funnel -->
      <div class="report__section">
        <h3 class="report__section-title">🎯 Conversion Funnel</h3>
        <div class="report__funnel" v-if="conversion">
          <div
            v-for="(step, i) in conversion.funnel"
            :key="step.status"
            class="report__funnel-step"
          >
            <div
              class="report__funnel-bar"
              :style="{
                width: funnelWidth(step.count, conversion.totalLeads),
                background: funnelColors[i],
              }"
            >
              <span>{{ step.status }}</span>
              <span>{{ step.count }}</span>
            </div>
          </div>
          <div class="report__funnel-rate">
            <Target :size="16" />
            Conversion Rate: <strong>{{ conversion.conversionRate }}%</strong>
          </div>
        </div>
      </div>

      <!-- Peak Hours -->
      <div class="report__section">
        <h3 class="report__section-title">🕐 Peak Hours (hôm nay)</h3>
        <div class="report__heatmap">
          <div
            v-for="h in hourlyData"
            :key="h.hour"
            class="report__heat-cell"
            :style="{ background: heatColor(h.total, maxHourly), opacity: h.total > 0 ? 1 : 0.3 }"
            :title="`${h.hour}:00 - ${h.total} comments (HOT: ${h.HOT})`"
          >
            <span class="report__heat-hour">{{ h.hour }}</span>
            <span class="report__heat-val" v-if="h.total > 0">{{ h.total }}</span>
          </div>
        </div>
      </div>

      <!-- Top Keywords -->
      <div class="report__section">
        <h3 class="report__section-title">🔤 Top Keywords</h3>
        <div class="report__keywords">
          <span
            v-for="kw in topKeywords"
            :key="kw.word"
            class="report__keyword"
            :style="{ fontSize: keywordSize(kw.count) }"
          >
            {{ kw.word }}
            <sup>{{ kw.count }}</sup>
          </span>
          <p v-if="topKeywords.length === 0" class="report__empty">Chưa có dữ liệu</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  BarChart3, RefreshCcw, MessageSquare, Flame, TrendingUp,
  Calculator, Target
} from 'lucide-vue-next'

const props = defineProps({ shopId: { type: String, default: null } })

const API_BASE = 'http://localhost:3000/api'
const selectedDays = ref(7)
const loading = ref(false)
const summary = ref(null)
const dailyData = ref([])
const hourlyData = ref([])
const conversion = ref(null)
const topKeywords = ref([])

const maxDaily = computed(() => Math.max(...dailyData.value.map(d => d.total), 1))
const maxHourly = computed(() => Math.max(...hourlyData.value.map(h => h.total), 1))

const funnelColors = ['#3b82f6', '#f59e0b', '#10b981', '#6b7280']

function barHeight(val, max) {
  return `${Math.max((val / max) * 120, 2)}px`
}

function funnelWidth(count, total) {
  if (!total) return '20%'
  return `${Math.max((count / total) * 100, 15)}%`
}

function heatColor(val, max) {
  if (val === 0) return 'var(--color-bg-card)'
  const intensity = val / max
  if (intensity > 0.7) return 'rgba(255, 59, 92, 0.6)'
  if (intensity > 0.4) return 'rgba(255, 140, 66, 0.5)'
  if (intensity > 0.1) return 'rgba(59, 130, 246, 0.3)'
  return 'rgba(100, 116, 139, 0.2)'
}

function keywordSize(count) {
  const maxCount = Math.max(...topKeywords.value.map(k => k.count), 1)
  const ratio = count / maxCount
  return `${Math.max(11, Math.round(ratio * 22))}px`
}

function formatDate(d) {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}`
}

async function loadAll() {
  loading.value = true
  const params = `shopId=${props.shopId || ''}&days=${selectedDays.value}`
  try {
    const [sumRes, dailyRes, hourlyRes, convRes, kwRes] = await Promise.all([
      fetch(`${API_BASE}/analytics/summary?${params}`),
      fetch(`${API_BASE}/analytics/daily?${params}`),
      fetch(`${API_BASE}/analytics/hourly?${params}`),
      fetch(`${API_BASE}/analytics/conversion?${params}`),
      fetch(`${API_BASE}/analytics/top-keywords?${params}&limit=30`),
    ])
    summary.value = await sumRes.json()
    const dailyJson = await dailyRes.json()
    dailyData.value = dailyJson.daily || []
    const hourlyJson = await hourlyRes.json()
    hourlyData.value = hourlyJson.hourly || []
    conversion.value = await convRes.json()
    const kwJson = await kwRes.json()
    topKeywords.value = kwJson.keywords || []
  } catch (err) {
    console.error('Report load error:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.report { padding: 20px; overflow-y: auto; height: 100%; }
.report__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.report__title {
  font-size: 20px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
}
.report__controls { display: flex; gap: 8px; align-items: center; }
.report__select {
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-secondary); color: var(--color-text-primary);
  font-size: 13px; outline: none; cursor: pointer;
}
.report__refresh {
  background: none; border: 1px solid var(--color-border); border-radius: 6px;
  padding: 6px; cursor: pointer; color: var(--color-text-secondary);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Summary Cards */
.report__summary {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px;
}
.report__card {
  display: flex; align-items: center; gap: 12px;
  padding: 16px; border-radius: 12px;
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
}
.report__card-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-primary);
}
.report__card-data { display: flex; flex-direction: column; }
.report__card-value { font-size: 22px; font-weight: 800; line-height: 1; }
.report__card-label { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }

/* Grid */
.report__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.report__section {
  background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border); padding: 16px;
}
.report__section-title {
  font-size: 14px; font-weight: 700; margin-bottom: 14px;
}

/* Bar Chart */
.report__chart {
  display: flex; align-items: flex-end; gap: 6px;
  height: 160px; padding-bottom: 20px;
}
.report__bar-group {
  flex: 1; display: flex; flex-direction: column; align-items: center;
  position: relative;
}
.report__bar-stack {
  display: flex; flex-direction: column-reverse; gap: 1px;
  width: 100%; max-width: 36px;
}
.report__bar {
  border-radius: 3px 3px 0 0; min-height: 2px;
  transition: height 0.5s ease;
}
.report__bar--hot { background: #ff3b5c; }
.report__bar--warm { background: #ff8c42; }
.report__bar--cold { background: #64748b; }
.report__bar-label {
  font-size: 10px; color: var(--color-text-muted); margin-top: 4px;
  position: absolute; bottom: -18px;
}
.report__bar-val {
  font-size: 10px; color: var(--color-text-secondary); font-weight: 600;
  position: absolute; top: -14px;
}
.report__legend {
  display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: var(--color-text-muted);
}
.report__dot {
  display: inline-block; width: 8px; height: 8px; border-radius: 50%;
  margin-right: 4px; vertical-align: middle;
}

/* Funnel */
.report__funnel { display: flex; flex-direction: column; gap: 8px; }
.report__funnel-step { width: 100%; }
.report__funnel-bar {
  padding: 10px 14px; border-radius: 8px; color: white; font-weight: 600;
  display: flex; justify-content: space-between; align-items: center;
  font-size: 13px; transition: width 0.5s ease; min-width: 80px;
}
.report__funnel-rate {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; color: var(--color-text-secondary); margin-top: 8px;
  padding: 10px; border-radius: 8px; background: var(--color-bg-primary);
}

/* Heatmap */
.report__heatmap {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px;
}
.report__heat-cell {
  aspect-ratio: 1; border-radius: 6px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; cursor: default;
  transition: all 0.2s;
}
.report__heat-cell:hover { transform: scale(1.1); }
.report__heat-hour { font-size: 10px; color: var(--color-text-muted); font-weight: 600; }
.report__heat-val { font-size: 11px; font-weight: 700; color: var(--color-text-primary); }

/* Keywords Word Cloud */
.report__keywords {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline;
  padding: 10px 0;
}
.report__keyword {
  color: var(--color-text-secondary); cursor: default;
  transition: color 0.2s; padding: 2px 4px;
}
.report__keyword:hover { color: var(--color-accent-warm); }
.report__keyword sup {
  font-size: 9px; color: var(--color-text-muted); margin-left: 1px;
}
.report__empty {
  text-align: center; color: var(--color-text-muted); font-style: italic;
  padding: 20px; font-size: 13px;
}
</style>
