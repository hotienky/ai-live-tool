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
          <option :value="7">{{ t('admin.msg_d51ffbc9', '7 ngày') }}</option>
          <option :value="14">{{ t('admin.msg_b9805682', '14 ngày') }}</option>
          <option :value="30">{{ t('admin.msg_06199c63', '30 ngày') }}</option>
        </select>
        <button class="report__refresh" @click="loadAll" :disabled="loading">
          <RefreshCcw :size="14" :class="{ 'spin': loading }" />
        </button>
        <button class="report__export" @click="exportCSV" :disabled="!dailyData.length">
          <FileSpreadsheet :size="14" style="vertical-align:middle" /> Xuất CSV
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="report__summary" v-if="summary">
      <div class="report__card report__card--comments">
        <div class="report__card-icon"><MessageSquare :size="20" /></div>
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.totalComments?.toLocaleString() || 0 }}</span>
          <span class="report__card-label">{{ t('admin.msg_8b6be5af', 'Tổng comments') }}</span>
        </div>
      </div>
      <div class="report__card report__card--hot">
        <div class="report__card-icon"><Flame :size="20" /></div>
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.totalHot || 0 }}</span>
          <span class="report__card-label">HOT leads</span>
        </div>
      </div>
      <div class="report__card report__card--rate">
        <div class="report__card-icon"><TrendingUp :size="20" /></div>
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.hotRate || 0 }}%</span>
          <span class="report__card-label">HOT rate</span>
        </div>
      </div>
      <div class="report__card report__card--avg">
        <div class="report__card-icon"><Calculator :size="20" /></div>
        <div class="report__card-data">
          <span class="report__card-value">{{ summary.avgCommentsPerDay || 0 }}</span>
          <span class="report__card-label">{{ t('admin.msg_1056d8cc', 'TB/ngày') }}</span>
        </div>
      </div>
    </div>

    <div class="report__grid">
      <!-- Daily Chart -->
      <div class="report__section">
        <h3 class="report__section-title"><BarChart3 :size="16" style="vertical-align:middle" /> {{ t('admin.msg_09656bc0', 'Comments theo ngày') }}</h3>
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
        <h3 class="report__section-title"><Target :size="16" style="vertical-align:middle" /> Conversion Funnel</h3>
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
        <h3 class="report__section-title"><Clock :size="16" style="vertical-align:middle" /> {{ t('admin.msg_78e11b6e', 'Peak Hours (hôm nay)') }}</h3>
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
        <h3 class="report__section-title"><Hash :size="16" style="vertical-align:middle" /> Top Keywords</h3>
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
          <p v-if="topKeywords.length === 0" class="report__empty">{{ t('admin.no_data', 'Chưa có dữ liệu') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logger } from '../utils/logger.js'
import { ref, computed, onMounted } from 'vue'
import {
  BarChart3, RefreshCcw, MessageSquare, Flame, TrendingUp,
  Calculator, Target, FileSpreadsheet, Clock, Hash
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({ /* tenant-scoped */ })

const selectedDaysStr = useUrlParam('days', '7')
const selectedDays = computed({
  get: () => Number(selectedDaysStr.value) || 7,
  set: (v) => { selectedDaysStr.value = String(v) },
})
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
  const params = `days=${selectedDays.value}`
  try {
    const [sumRes, dailyRes, hourlyRes, convRes, kwRes] = await Promise.all([
      apiFetch(`/analytics/summary?${params}`),
      apiFetch(`/analytics/daily?${params}`),
      apiFetch(`/analytics/hourly?${params}`),
      apiFetch(`/analytics/conversion?${params}`),
      apiFetch(`/analytics/top-keywords?${params}&limit=30`),
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

function exportCSV() {
  let csv = t('admin.msg_40f4ae9b', 'Ngày,Tổng,HOT,WARM,COLD\n')
  dailyData.value.forEach(d => {
    csv += `${d.date},${d.total},${d.HOT || 0},${d.WARM || 0},${d.COLD || 0}\n`
  })
  csv += t('admin.msg_9f7e9acb', '\nGiờ,Tổng,HOT\n')
  hourlyData.value.forEach(h => {
    csv += `${h.hour}:00,${h.total},${h.HOT || 0}\n`
  })
  csv += t('admin.msg_1833ad40', '\nKeyword,Số lần\n')
  topKeywords.value.forEach(kw => {
    csv += `${kw.word},${kw.count}\n`
  })
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `report_${selectedDays.value}d_${new Date().toISOString().slice(0,10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(loadAll)
</script>

<style scoped>
.report { padding: 24px; overflow-y: auto; height: 100%; }
.report__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 24px;
}
.report__title {
  font-size: 20px; font-weight: 800;
  display: flex; align-items: center; gap: 8px;
}
.report__controls { display: flex; gap: 8px; align-items: center; }
.report__select {
  padding: 8px 14px; border-radius: 10px; border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-primary);
  font-size: 13px; outline: none; cursor: pointer;
  transition: border-color 0.2s;
}
.report__select:focus { border-color: var(--color-accent-primary); }
.report__refresh {
  background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 8px;
  padding: 8px; cursor: pointer; color: var(--color-text-secondary); transition: all 0.2s;
}
.report__refresh:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.report__export {
  padding: 8px 16px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: 0 4px 12px rgba(16,185,129,0.2);
}
.report__export:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(16,185,129,0.3); }
.report__export:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Summary Cards */
.report__summary {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px;
}
.report__card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 22px; border-radius: 16px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  transition: all 0.3s ease;
  position: relative; overflow: hidden;
}
.report__card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; border-radius: 16px 0 0 16px;
}
.report__card:hover {
  transform: translateY(-3px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.report__card--comments::before { background: linear-gradient(180deg, #3b82f6, #2563eb); }
.report__card--comments .report__card-icon { background: rgba(59,130,246,0.12); color: #60a5fa; }
.report__card--hot::before { background: linear-gradient(180deg, #ef4444, #dc2626); }
.report__card--hot .report__card-icon { background: rgba(239,68,68,0.12); color: #f87171; }
.report__card--rate::before { background: linear-gradient(180deg, #10b981, #059669); }
.report__card--rate .report__card-icon { background: rgba(16,185,129,0.12); color: #34d399; }
.report__card--avg::before { background: linear-gradient(180deg, #a855f7, #7c3aed); }
.report__card--avg .report__card-icon { background: rgba(168,85,247,0.12); color: #c084fc; }

@media (max-width: 768px) {
  .report__summary { grid-template-columns: repeat(2, 1fr); }
  .report__grid { grid-template-columns: 1fr !important; }
  .report__header { flex-direction: column; align-items: flex-start; gap: 8px; }
  .report__controls { width: 100%; }
}
.report__card-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.report__card-data { display: flex; flex-direction: column; }
.report__card-value { font-size: 28px; font-weight: 800; line-height: 1; color: var(--color-text-primary); }
.report__card-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }

/* Grid */
.report__grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.report__section {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px;
  transition: all 0.3s;
}
.report__section:hover { border-color: var(--color-border-hover); }
.report__section-title {
  font-size: 14px; font-weight: 800; margin-bottom: 16px; color: var(--color-text-primary);
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
  border-radius: 4px 4px 0 0; min-height: 2px;
  transition: height 0.5s ease;
}
.report__bar--hot { background: linear-gradient(180deg, #ef4444, #dc2626); }
.report__bar--warm { background: linear-gradient(180deg, #f59e0b, #d97706); }
.report__bar--cold { background: var(--color-text-muted); }
.report__bar-label {
  font-size: 10px; color: var(--color-text-muted); margin-top: 4px;
  position: absolute; bottom: -18px;
}
.report__bar-val {
  font-size: 10px; color: var(--color-text-secondary); font-weight: 700;
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
  padding: 10px 16px; border-radius: 10px; color: white; font-weight: 700;
  display: flex; justify-content: space-between; align-items: center; gap: 12px;
  font-size: 13px; transition: all 0.4s ease; min-width: 120px;
  white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15); cursor: default;
}
.report__funnel-bar:hover {
  transform: translateX(4px); box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}
.report__funnel-rate {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; color: var(--color-text-secondary); margin-top: 10px;
  padding: 12px; border-radius: 10px; background: var(--color-bg-card);
  border: 1px solid var(--color-border);
}

/* Heatmap */
.report__heatmap {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px;
}
.report__heat-cell {
  aspect-ratio: 1; border-radius: 8px; display: flex; flex-direction: column;
  align-items: center; justify-content: center; cursor: default;
  transition: all 0.2s;
}
.report__heat-cell:hover { transform: scale(1.1); }
.report__heat-hour { font-size: 10px; color: var(--color-text-muted); font-weight: 700; }
.report__heat-val { font-size: 11px; font-weight: 800; color: var(--color-text-primary); }

/* Keywords Word Cloud */
.report__keywords {
  display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline;
  padding: 10px 0;
}
.report__keyword {
  color: var(--color-text-secondary); cursor: default;
  transition: color 0.2s; padding: 2px 6px;
}
.report__keyword:hover { color: var(--accent-light); }
.report__keyword sup {
  font-size: 9px; color: var(--color-text-muted); margin-left: 1px;
}
.report__empty {
  text-align: center; color: var(--color-text-muted); font-style: italic;
  padding: 40px; font-size: 13px;
}
</style>

