<template>
  <div class="stats-bar">
    <!-- Viewer Count -->
    <div class="stats-bar__item stats-bar__item--viewers" v-if="viewerCount > 0">
      <span class="stats-bar__icon"><Eye :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--viewers">{{ viewerCount.toLocaleString() }}</span>
        <span class="stats-bar__label">VIEWERS</span>
      </div>
    </div>
    <div class="stats-bar__divider" v-if="viewerCount > 0"></div>
    <div class="stats-bar__item stats-bar__item--hot">
      <span class="stats-bar__icon"><Flame :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--hot">{{ stats.hot }}</span>
        <span class="stats-bar__label">HOT</span>
      </div>
    </div>
    <div class="stats-bar__item stats-bar__item--warm">
      <span class="stats-bar__icon"><CircleDot :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value stats-bar__value--warm">{{ stats.warm }}</span>
        <span class="stats-bar__label">WARM</span>
      </div>
    </div>
    <div class="stats-bar__item stats-bar__item--cold">
      <span class="stats-bar__icon"><Circle :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value">{{ stats.cold }}</span>
        <span class="stats-bar__label">COLD</span>
      </div>
    </div>
    <div class="stats-bar__divider"></div>
    <div class="stats-bar__item stats-bar__item--total">
      <span class="stats-bar__icon"><BarChart2 :size="15" /></span>
      <div class="stats-bar__data">
        <span class="stats-bar__value">{{ stats.total }}</span>
        <span class="stats-bar__label">Total</span>
      </div>
    </div>

    <!-- Conversion rate bar -->
    <div class="stats-bar__progress" v-if="stats.total > 0">
      <div class="stats-bar__progress-track">
        <div
          class="stats-bar__progress-hot"
          :style="{ width: hotPercent + '%' }"
        ></div>
        <div
          class="stats-bar__progress-warm"
          :style="{ width: warmPercent + '%' }"
        ></div>
      </div>
      <span class="stats-bar__progress-label">
        {{ hotPercent + warmPercent }}% tiềm năng
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Eye, Flame, CircleDot, Circle, BarChart2 } from 'lucide-vue-next'

const props = defineProps({
  stats: {
    type: Object,
    default: () => ({ hot: 0, warm: 0, cold: 0, total: 0 }),
  },
  viewerCount: {
    type: Number,
    default: 0,
  },
})

const hotPercent = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.hot / props.stats.total) * 100)
})

const warmPercent = computed(() => {
  if (props.stats.total === 0) return 0
  return Math.round((props.stats.warm / props.stats.total) * 100)
})
</script>

<style scoped>
.stats-bar {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  flex-shrink: 0;
}

.stats-bar__item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.stats-bar__icon {
  font-size: 16px;
}

.stats-bar__data {
  display: flex;
  flex-direction: column;
}

.stats-bar__value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text-primary);
  line-height: 1;
}

.stats-bar__value--hot {
  color: var(--color-accent-hot);
}

.stats-bar__value--warm {
  color: var(--color-accent-warm);
}

.stats-bar__label {
  font-size: 10px;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stats-bar__value--viewers {
  color: #38bdf8;
}

.stats-bar__divider {
  width: 1px;
  height: 28px;
  background: var(--color-border);
}

.stats-bar__progress {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 100px;
}

.stats-bar__progress-track {
  flex: 1;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  display: flex;
}

.stats-bar__progress-hot {
  height: 100%;
  background: var(--color-accent-hot);
  transition: width 0.5s ease;
}

.stats-bar__progress-warm {
  height: 100%;
  background: var(--color-accent-warm);
  transition: width 0.5s ease;
}

.stats-bar__progress-label {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}
</style>
