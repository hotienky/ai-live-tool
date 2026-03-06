<template>
  <div class="sentiment-gauge">
    <div class="sentiment-gauge__header">
      <span class="sentiment-gauge__label"><Target :size="14" /> Cảm xúc Livestream</span>
      <button class="sentiment-gauge__refresh" @click="fetchSentiment" :disabled="loading">
        <Loader2 v-if="loading" :size="13" class="sentiment-gauge__spin" />
        <RefreshCw v-else :size="13" />
      </button>
    </div>

    <div class="sentiment-gauge__body">
      <!-- Gauge Arc -->
      <div class="sentiment-gauge__meter">
        <svg viewBox="0 0 120 70" class="sentiment-gauge__svg">
          <!-- Background arc -->
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#1f2937"
            stroke-width="10"
            stroke-linecap="round"
          />
          <!-- Value arc -->
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            :stroke="gaugeColor"
            stroke-width="10"
            stroke-linecap="round"
            :stroke-dasharray="`${gaugePercent * 1.57} 157`"
            class="sentiment-gauge__arc"
          />
        </svg>
        <div class="sentiment-gauge__value">
          {{ moodEmoji }}
        </div>
      </div>

      <!-- Info -->
      <div class="sentiment-gauge__info">
        <span class="sentiment-gauge__mood" :style="{ color: gaugeColor }">
          {{ moodLabel }}
        </span>
        <span class="sentiment-gauge__score">
          Score: {{ (sentiment.score * 100).toFixed(0) }}%
        </span>
      </div>

      <!-- Summary -->
      <p class="sentiment-gauge__summary" v-if="sentiment.summary">
        {{ sentiment.summary }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Target, RefreshCw, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  comments: { type: Array, default: () => [] },
})

const sentiment = ref({ score: 0, mood: 'neutral', summary: '' })
const loading = ref(false)

async function fetchSentiment() {
  if (props.comments.length === 0) return
  loading.value = true
  try {
    const res = await fetch('http://localhost:3000/api/reply/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comments: props.comments.slice(-20) }),
    })
    const data = await res.json()
    sentiment.value = data
  } catch (err) {
    sentiment.value = { score: 0, mood: 'neutral', summary: 'Lỗi kết nối' }
  } finally {
    loading.value = false
  }
}

const gaugePercent = computed(() => {
  return ((sentiment.value.score + 1) / 2) * 100
})

const gaugeColor = computed(() => {
  const s = sentiment.value.score
  if (s > 0.3) return '#10b981'
  if (s > -0.3) return '#f59e0b'
  return '#ff3b5c'
})

const moodEmoji = computed(() => {
  const m = sentiment.value.mood
  if (m === 'positive') return '😊'
  if (m === 'negative') return '😟'
  return '😐'
})

const moodLabel = computed(() => {
  const m = sentiment.value.mood
  if (m === 'positive') return 'Tích cực'
  if (m === 'negative') return 'Tiêu cực'
  return 'Trung lập'
})
</script>

<style scoped>
.sentiment-gauge {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  margin: 8px 16px;
}

.sentiment-gauge__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.sentiment-gauge__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.sentiment-gauge__refresh {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.sentiment-gauge__refresh:hover:not(:disabled) {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.sentiment-gauge__body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.sentiment-gauge__meter {
  position: relative;
  width: 120px;
  height: 70px;
}

.sentiment-gauge__svg {
  width: 100%;
  height: 100%;
}

.sentiment-gauge__arc {
  transition: stroke-dasharray 0.8s ease;
}

.sentiment-gauge__value {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
}

.sentiment-gauge__info {
  display: flex;
  gap: 12px;
  font-size: 12px;
}

.sentiment-gauge__mood {
  font-weight: 700;
}

.sentiment-gauge__score {
  color: var(--color-text-muted);
}

.sentiment-gauge__summary {
  font-size: 11px;
  color: var(--color-text-secondary);
  text-align: center;
  line-height: 1.4;
}
</style>
