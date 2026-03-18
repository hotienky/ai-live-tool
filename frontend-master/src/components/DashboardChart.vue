<template>
  <div class="card mb-8 p-5 md:p-6">
    <div class="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <h2 class="text-base font-semibold mp-text-primary">Tenants theo thời gian</h2>
      <div class="flex gap-1 bg-[var(--mp-bg-secondary,#f1f5f9)] dark:bg-[var(--mp-nav-hover-bg)] rounded-lg p-1">
        <button
          v-for="opt in viewOptions"
          :key="opt.value"
          class="px-3 py-1 text-xs rounded-md transition-all font-medium"
          :class="view === opt.value
            ? 'bg-primary-500 text-white shadow-sm'
            : 'mp-text-muted hover:mp-text-secondary'"
          @click="view = opt.value"
        >{{ opt.label }}</button>
      </div>
    </div>

    <!-- Legend -->
    <div class="flex flex-wrap gap-4 mb-4 text-xs">
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-emerald-500"></div>
        <span class="mp-text-secondary">Active</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-red-400"></div>
        <span class="mp-text-secondary">Suspended</span>
      </div>
      <div class="flex items-center gap-1.5">
        <div class="w-3 h-3 rounded-sm bg-amber-400"></div>
        <span class="mp-text-secondary">Trial</span>
      </div>
    </div>

    <!-- Chart -->
    <div v-if="chartData.length === 0" class="h-48 flex items-center justify-center mp-text-muted text-sm">
      Chưa có dữ liệu
    </div>
    <div v-else class="chart-container">
      <!-- Y-axis labels + grid -->
      <div class="chart-area">
        <div class="y-axis">
          <span v-for="tick in yTicks" :key="tick" class="y-label">{{ tick }}</span>
        </div>
        <div class="chart-body">
          <!-- Grid lines -->
          <div class="grid-lines">
            <div v-for="tick in yTicks" :key="'g'+tick" class="grid-line"></div>
          </div>
          <!-- Bars -->
          <div class="bars-wrapper">
            <div
              v-for="item in chartData"
              :key="item.label"
              class="bar-group"
            >
              <div class="bar-stack" :style="{ height: barHeight(item.total) + '%' }">
                <div
                  v-if="item.trial > 0"
                  class="bar-segment bg-amber-400"
                  :style="{ height: segmentPercent(item.trial, item.total) + '%' }"
                >
                  <div class="bar-tooltip">Trial: {{ item.trial }}</div>
                </div>
                <div
                  v-if="item.suspended > 0"
                  class="bar-segment bg-red-400"
                  :style="{ height: segmentPercent(item.suspended, item.total) + '%' }"
                >
                  <div class="bar-tooltip">Suspended: {{ item.suspended }}</div>
                </div>
                <div
                  v-if="item.active > 0"
                  class="bar-segment bg-emerald-500"
                  :style="{ height: segmentPercent(item.active, item.total) + '%' }"
                >
                  <div class="bar-tooltip">Active: {{ item.active }}</div>
                </div>
              </div>
              <span class="bar-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="mt-4 pt-4 border-t border-[var(--mp-border)] flex flex-wrap gap-6 text-sm">
      <div>
        <span class="mp-text-muted">Tổng: </span>
        <span class="mp-text-primary font-semibold">{{ totalTenants }}</span>
      </div>
      <div>
        <span class="mp-text-muted">Active: </span>
        <span class="text-emerald-500 font-semibold">{{ totalActive }}</span>
      </div>
      <div>
        <span class="mp-text-muted">Suspended: </span>
        <span class="text-red-400 font-semibold">{{ totalSuspended }}</span>
      </div>
      <div class="ml-auto flex items-center gap-1.5">
        <div class="px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-500/15 text-amber-500 border border-amber-500/30">PRO</div>
        <span class="mp-text-primary font-medium">{{ totalPro }} tenant{{ totalPro > 1 ? 's' : '' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  tenants: { type: Array, default: () => [] }
})

const view = ref('month')
const viewOptions = [
  { label: '7 ngày', value: 'week' },
  { label: '30 ngày', value: 'month' },
  { label: '12 tháng', value: 'year' },
]

const totalTenants = computed(() => props.tenants.length)
const totalActive = computed(() => props.tenants.filter(t => t.status === 'active').length)
const totalSuspended = computed(() => props.tenants.filter(t => t.status === 'suspended').length)
const totalPro = computed(() => props.tenants.filter(t => t.plan === 'pro' || t.plan === 'enterprise').length)

const chartData = computed(() => {
  const now = new Date()
  const list = props.tenants

  if (view.value === 'week') {
    // Last 7 days
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const label = `${d.getDate()}/${d.getMonth() + 1}`
      const filtered = list.filter(t => t.created_at && t.created_at.slice(0, 10) === key)
      days.push({
        label,
        active: filtered.filter(t => t.status === 'active').length,
        suspended: filtered.filter(t => t.status === 'suspended').length,
        trial: filtered.filter(t => t.status !== 'active' && t.status !== 'suspended').length,
        total: filtered.length,
      })
    }
    return days
  }

  if (view.value === 'month') {
    // Last 30 days, grouped by 5-day intervals
    const buckets = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now)
      start.setDate(start.getDate() - (i * 5 + 4))
      const end = new Date(now)
      end.setDate(end.getDate() - i * 5)
      const startKey = start.toISOString().slice(0, 10)
      const endKey = end.toISOString().slice(0, 10)
      const label = `${start.getDate()}/${start.getMonth() + 1}`
      const filtered = list.filter(t => {
        if (!t.created_at) return false
        const d = t.created_at.slice(0, 10)
        return d >= startKey && d <= endKey
      })
      buckets.push({
        label,
        active: filtered.filter(t => t.status === 'active').length,
        suspended: filtered.filter(t => t.status === 'suspended').length,
        trial: filtered.filter(t => t.status !== 'active' && t.status !== 'suspended').length,
        total: filtered.length,
      })
    }
    return buckets
  }

  // year: last 12 months
  const months = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `T${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`
    const filtered = list.filter(t => t.created_at && t.created_at.slice(0, 7) === key)
    months.push({
      label,
      active: filtered.filter(t => t.status === 'active').length,
      suspended: filtered.filter(t => t.status === 'suspended').length,
      trial: filtered.filter(t => t.status !== 'active' && t.status !== 'suspended').length,
      total: filtered.length,
    })
  }
  return months
})

const maxVal = computed(() => {
  const m = Math.max(...chartData.value.map(d => d.total), 1)
  return Math.ceil(m / Math.pow(10, Math.floor(Math.log10(m || 1)))) * Math.pow(10, Math.floor(Math.log10(m || 1)))
    || 5
})

const yTicks = computed(() => {
  const max = maxVal.value
  const step = Math.max(1, Math.ceil(max / 4))
  const ticks = []
  for (let i = 4; i >= 0; i--) {
    ticks.push(i * step)
  }
  return ticks
})

function barHeight(total) {
  if (!maxVal.value) return 0
  return (total / yTicks.value[0]) * 100
}

function segmentPercent(val, total) {
  if (!total) return 0
  return (val / total) * 100
}
</script>

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }

.chart-container {
  width: 100%;
}

.chart-area {
  display: flex;
  height: 220px;
  gap: 8px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-bottom: 24px;
  min-width: 30px;
  text-align: right;
}

.y-label {
  font-size: 11px;
  color: var(--mp-text-muted);
  line-height: 1;
}

.chart-body {
  flex: 1;
  position: relative;
  padding-bottom: 24px;
}

.grid-lines {
  position: absolute;
  inset: 0;
  bottom: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;
}

.grid-line {
  border-bottom: 1px dashed var(--mp-border);
  height: 0;
}

.bars-wrapper {
  position: absolute;
  inset: 0;
  bottom: 24px;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding: 0 4px;
}

.bar-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
  min-width: 0;
}

.bar-stack {
  width: 60%;
  max-width: 48px;
  min-height: 2px;
  border-radius: 4px 4px 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: height 0.5s ease;
}

.bar-segment {
  position: relative;
  min-height: 2px;
  transition: height 0.5s ease;
  cursor: pointer;
}

.bar-segment:hover {
  filter: brightness(1.15);
}

.bar-tooltip {
  display: none;
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  padding: 4px 8px;
  background: #1f2937;
  color: white;
  font-size: 11px;
  border-radius: 4px;
  white-space: nowrap;
  z-index: 10;
  pointer-events: none;
}

.bar-segment:hover .bar-tooltip {
  display: block;
}

.bar-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -4px;
  border-width: 4px;
  border-style: solid;
  border-color: #1f2937 transparent transparent transparent;
}

.bar-label {
  margin-top: 6px;
  font-size: 10px;
  color: var(--mp-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
  text-align: center;
}

@media (min-width: 640px) {
  .bar-label { font-size: 11px; }
  .chart-area { height: 260px; }
}
</style>
