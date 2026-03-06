<template>
  <div class="stats-bar">
    <!-- Viewer Count -->
    <div class="stats-bar__item stats-bar__item--viewers" v-if="viewerCount > 0">
      <span class="stats-bar__icon"><Eye :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--viewers">{{ viewerCount.toLocaleString() }}</span>
        <span class="stats-bar__label">VIEWERS</span>
      </div>
      <span class="stats-bar__peak" v-if="peakViewers > 0" title="Peak viewers">
        ▲ {{ peakViewers }}
      </span>
    </div>
    <div class="stats-bar__divider" v-if="viewerCount > 0"></div>

    <!-- HOT -->
    <div class="stats-bar__item stats-bar__item--hot">
      <span class="stats-bar__icon"><Flame :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--hot">{{ stats.hot }}</span>
        <span class="stats-bar__label">HOT</span>
      </div>
      <svg class="stats-bar__spark" viewBox="0 0 40 16" v-if="hotHistory.length > 1">
        <polyline :points="sparkPoints(hotHistory)" fill="none" stroke="#ff3b5c" stroke-width="1.5" />
      </svg>
    </div>

    <!-- WARM -->
    <div class="stats-bar__item stats-bar__item--warm">
      <span class="stats-bar__icon"><CircleDot :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--warm">{{ stats.warm }}</span>
        <span class="stats-bar__label">WARM</span>
      </div>
      <svg class="stats-bar__spark" viewBox="0 0 40 16" v-if="warmHistory.length > 1">
        <polyline :points="sparkPoints(warmHistory)" fill="none" stroke="#ff8c42" stroke-width="1.5" />
      </svg>
    </div>

    <!-- COLD -->
    <div class="stats-bar__item stats-bar__item--cold">
      <span class="stats-bar__icon"><Circle :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value">{{ stats.cold }}</span>
        <span class="stats-bar__label">COLD</span>
      </div>
    </div>

    <div class="stats-bar__divider"></div>

    <!-- Total + Rate -->
    <div class="stats-bar__item stats-bar__item--total">
      <span class="stats-bar__icon"><BarChart2 :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value">{{ stats.total }}</span>
        <span class="stats-bar__label">Total</span>
      </div>
    </div>

    <!-- Comments per minute -->
    <div class="stats-bar__item stats-bar__rate" v-if="commentsPerMinute > 0">
      <span class="stats-bar__rate-value">{{ commentsPerMinute }}</span>
      <span class="stats-bar__rate-unit">msg/phút</span>
    </div>

    <!-- Conversion rate bar -->
    <div class="stats-bar__progress" v-if="stats.total > 0">
      <div class="stats-bar__progress-track">
        <div class="stats-bar__progress-hot" :style="{ width: hotPercent + '%' }"></div>
        <div class="stats-bar__progress-warm" :style="{ width: warmPercent + '%' }"></div>
      </div>
      <span class="stats-bar__progress-label">
        {{ hotPercent + warmPercent }}% tiềm năng
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { Eye, Flame, CircleDot, Circle, BarChart2 } from 'lucide-vue-next'

const props = defineProps({
  stats: { type: Object, default: () => ({ hot: 0, warm: 0, cold: 0, total: 0 }) },
  viewerCount: { type: Number, default: 0 },
})

const hotHistory = ref([0])
const warmHistory = ref([0])
const totalHistory = ref([0])
const peakViewers = ref(0)
const commentsPerMinute = ref(0)
let rateInterval = null

// Track sparkline history (last 10 data points, every 5s)
watch(() => props.stats, (s) => {
  hotHistory.value = [...hotHistory.value.slice(-9), s.hot]
  warmHistory.value = [...warmHistory.value.slice(-9), s.warm]
  totalHistory.value = [...totalHistory.value.slice(-9), s.total]
}, { deep: true })

// Track peak viewers
watch(() => props.viewerCount, (v) => {
  if (v > peakViewers.value) peakViewers.value = v
})

// Comments per minute rate
onMounted(() => {
  let lastTotal = props.stats.total
  rateInterval = setInterval(() => {
    const delta = props.stats.total - lastTotal
    commentsPerMinute.value = Math.round(delta * (60 / 10)) // 10s interval → extrapolate to /min
    lastTotal = props.stats.total
  }, 10000)
})

onUnmounted(() => {
  if (rateInterval) clearInterval(rateInterval)
})

const hotPercent = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.hot / props.stats.total) * 100)
})

const warmPercent = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.warm / props.stats.total) * 100)
})

function sparkPoints(data) {
  const max = Math.max(...data, 1)
  return data.map((v, i) => {
    const x = (i / (data.length - 1)) * 40
    const y = 15 - (v / max) * 14
    return `${x},${y}`
  }).join(' ')
}
</script>

<style scoped>
.stats-bar {
  padding: 12px 16px; border-top: 1px solid var(--color-border);
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap; flex-shrink: 0;
}
.stats-bar__item { display: flex; align-items: center; gap: 6px; }
.stats-bar__icon { font-size: 16px; }
.stats-bar__data { display: flex; flex-direction: column; }
.stats-bar__value { font-size: 18px; font-weight: 700; color: var(--color-text-primary); line-height: 1; }
.stats-bar__value--hot { color: var(--color-accent-hot); }
.stats-bar__value--warm { color: var(--color-accent-warm); }
.stats-bar__value--viewers { color: #38bdf8; }
.stats-bar__label { font-size: 10px; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
.stats-bar__divider { width: 1px; height: 28px; background: var(--color-border); }

/* Peak viewers badge */
.stats-bar__peak {
  font-size: 10px; color: #38bdf8; background: rgba(56,189,248,0.1);
  padding: 1px 6px; border-radius: 4px; font-weight: 600;
}

/* Sparkline */
.stats-bar__spark {
  width: 40px; height: 16px; flex-shrink: 0;
}

/* Comments/minute rate */
.stats-bar__rate {
  display: flex; align-items: baseline; gap: 3px;
  background: rgba(16,185,129,0.1); border-radius: 6px; padding: 4px 8px;
}
.stats-bar__rate-value {
  font-size: 14px; font-weight: 700; color: #10b981;
}
.stats-bar__rate-unit {
  font-size: 10px; color: #10b981; opacity: 0.7;
}

/* Progress bar */
.stats-bar__progress { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 100px; }
.stats-bar__progress-track { flex: 1; height: 6px; background: var(--color-border); border-radius: 3px; overflow: hidden; display: flex; }
.stats-bar__progress-hot { height: 100%; background: var(--color-accent-hot); transition: width 0.5s ease; }
.stats-bar__progress-warm { height: 100%; background: var(--color-accent-warm); transition: width 0.5s ease; }
.stats-bar__progress-label { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
</style>
