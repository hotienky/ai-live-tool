<template>
  <div class="stats-chart">
    <div class="stats-chart__header">
      <h3 class="stats-chart__title"><TrendingUp :size="16" /> Thống kê theo thời gian</h3>
      <button class="stats-chart__close" @click="$emit('close')">
        <X :size="16" />
      </button>
    </div>

    <div class="stats-chart__body">
      <!-- Donut Chart -->
      <div class="stats-chart__donut-section">
        <canvas ref="donutCanvas" width="160" height="160"></canvas>
        <div class="stats-chart__donut-legend">
          <div class="stats-chart__legend-item">
            <span class="stats-chart__legend-dot stats-chart__legend-dot--hot"></span>
            HOT: {{ stats.hot }} ({{ hotPct }}%)
          </div>
          <div class="stats-chart__legend-item">
            <span class="stats-chart__legend-dot stats-chart__legend-dot--warm"></span>
            WARM: {{ stats.warm }} ({{ warmPct }}%)
          </div>
          <div class="stats-chart__legend-item">
            <span class="stats-chart__legend-dot stats-chart__legend-dot--cold"></span>
            COLD: {{ stats.cold }} ({{ coldPct }}%)
          </div>
        </div>
      </div>

      <!-- Timeline Chart -->
      <div class="stats-chart__timeline-section">
        <h4 class="stats-chart__subtitle">Leads / phút</h4>
        <canvas ref="timelineCanvas" width="500" height="160"></canvas>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { TrendingUp, X } from 'lucide-vue-next'

const props = defineProps({
  stats: { type: Object, default: () => ({ hot: 0, warm: 0, cold: 0, total: 0 }) },
  timelineData: { type: Array, default: () => [] },
})

defineEmits(['close'])

const donutCanvas = ref(null)
const timelineCanvas = ref(null)

const hotPct = computed(() => props.stats.total ? Math.round((props.stats.hot / props.stats.total) * 100) : 0)
const warmPct = computed(() => props.stats.total ? Math.round((props.stats.warm / props.stats.total) * 100) : 0)
const coldPct = computed(() => props.stats.total ? Math.round((props.stats.cold / props.stats.total) * 100) : 0)

// ── Draw Donut ──
function drawDonut() {
  const canvas = donutCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const { hot, warm, cold, total } = props.stats

  ctx.clearRect(0, 0, 160, 160)

  if (total === 0) {
    // Empty state
    ctx.beginPath()
    ctx.arc(80, 80, 55, 0, Math.PI * 2)
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 20
    ctx.stroke()
    ctx.fillStyle = '#6b7280'
    ctx.font = '14px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('No data', 80, 85)
    return
  }

  const segments = [
    { value: hot, color: '#ff3b5c' },
    { value: warm, color: '#ff8c42' },
    { value: cold, color: '#6b7280' },
  ]

  let startAngle = -Math.PI / 2
  for (const seg of segments) {
    if (seg.value === 0) continue
    const sliceAngle = (seg.value / total) * Math.PI * 2
    ctx.beginPath()
    ctx.arc(80, 80, 55, startAngle, startAngle + sliceAngle)
    ctx.strokeStyle = seg.color
    ctx.lineWidth = 20
    ctx.stroke()
    startAngle += sliceAngle
  }

  // Center text
  ctx.fillStyle = '#f9fafb'
  ctx.font = 'bold 22px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(total, 80, 78)
  ctx.fillStyle = '#9ca3af'
  ctx.font = '11px sans-serif'
  ctx.fillText('TOTAL', 80, 94)
}

// ── Draw Timeline ──
function drawTimeline() {
  const canvas = timelineCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  const data = props.timelineData

  ctx.clearRect(0, 0, 500, 160)

  if (data.length < 2) {
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('Đang thu thập dữ liệu...', 250, 80)
    return
  }

  const maxVal = Math.max(...data.map(d => d.count), 1)
  const stepX = 500 / (data.length - 1)
  const padding = 20

  // Grid lines
  ctx.strokeStyle = '#1f2937'
  ctx.lineWidth = 0.5
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * (160 - padding * 2)
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(500, y)
    ctx.stroke()
  }

  // Line chart
  ctx.beginPath()
  ctx.moveTo(0, 160 - padding - (data[0].count / maxVal) * (160 - padding * 2))
  for (let i = 1; i < data.length; i++) {
    const x = i * stepX
    const y = 160 - padding - (data[i].count / maxVal) * (160 - padding * 2)
    ctx.lineTo(x, y)
  }
  ctx.strokeStyle = '#ff8c42'
  ctx.lineWidth = 2
  ctx.stroke()

  // Gradient fill
  const gradient = ctx.createLinearGradient(0, 0, 0, 160)
  gradient.addColorStop(0, 'rgba(255, 140, 66, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 140, 66, 0)')
  ctx.lineTo((data.length - 1) * stepX, 160 - padding)
  ctx.lineTo(0, 160 - padding)
  ctx.fillStyle = gradient
  ctx.fill()

  // Time labels
  ctx.fillStyle = '#6b7280'
  ctx.font = '9px sans-serif'
  ctx.textAlign = 'center'
  const labelStep = Math.max(1, Math.floor(data.length / 6))
  for (let i = 0; i < data.length; i += labelStep) {
    ctx.fillText(data[i].time, i * stepX, 158)
  }
}

watch(() => props.stats, () => nextTick(drawDonut), { deep: true })
watch(() => props.timelineData, () => nextTick(drawTimeline), { deep: true })

onMounted(() => {
  nextTick(() => {
    drawDonut()
    drawTimeline()
  })
})
</script>

<style scoped>
.stats-chart {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  margin: 12px 16px;
}

.stats-chart__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stats-chart__title {
  font-size: 15px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.stats-chart__close {
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.stats-chart__close:hover {
  color: var(--color-text-primary);
}

.stats-chart__body {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.stats-chart__donut-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-chart__donut-legend {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stats-chart__legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stats-chart__legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stats-chart__legend-dot--hot { background: #ff3b5c; }
.stats-chart__legend-dot--warm { background: #ff8c42; }
.stats-chart__legend-dot--cold { background: #6b7280; }

.stats-chart__timeline-section {
  flex: 1;
  min-width: 300px;
}

.stats-chart__subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}
</style>
