<template>
  <div class="pricing-suggestion">
    <div class="pricing-suggestion__header">
      <span class="pricing-suggestion__label"><Lightbulb :size="14" /> Smart Pricing</span>
      <button
        class="pricing-suggestion__refresh"
        @click="analyzePricing"
        :disabled="loading || comments.length === 0"
      >
        <Loader2 v-if="loading" :size="12" class="pricing-suggestion__spin" />
        <Search v-else :size="12" />
        {{ loading ? t('admin.msg_f2866ccd', 'Đang phân tích...') : t('admin.msg_ca1cdece', 'Phân tích giá') }}
      </button>
    </div>

    <div class="pricing-suggestion__body" v-if="analysis">
      <!-- Đánh giá tổng quan -->
      <div class="pricing-suggestion__overview">
        <div class="pricing-suggestion__score" :class="scoreClass">
          {{ analysis.icon }} {{ analysis.verdict }}
        </div>
        <div class="pricing-suggestion__confidence">
          Độ tin cậy: {{ analysis.confidence }}%
        </div>
      </div>

      <!-- Chi tiết -->
      <div class="pricing-suggestion__details">
        <div class="pricing-suggestion__metric">
          <span class="pricing-suggestion__metric-label">{{ t('admin.msg_48225a2e', 'Phản hồi giá:') }}</span>
          <span>{{ analysis.priceComments }}/{{ analysis.totalComments }} comments</span>
        </div>
        <div class="pricing-suggestion__metric">
          <span class="pricing-suggestion__metric-label">{{ t('admin.msg_eca1e771', 'Xu hướng:') }}</span>
          <span :style="{ color: trendColor }">{{ analysis.trend }}</span>
        </div>
      </div>

      <!-- Gợi ý -->
      <div class="pricing-suggestion__advice" v-if="analysis.advice">
        <p>{{ analysis.advice }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div class="pricing-suggestion__empty" v-else-if="!loading">
      <p>{{ t('admin.msg_8bed0526', 'Nhấn "Phân tích giá" khi có comments để AI đánh giá phản hồi về giá cả') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { Lightbulb, Search, Loader2 } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const props = defineProps({
  comments: { type: Array, default: () => [] },
})

const analysis = ref(null)
const loading = ref(false)

async function analyzePricing() {
  if (props.comments.length === 0) return
  loading.value = true
  analysis.value = null

  try {
    const res = await apiFetch(`/reply/sentiment`, {
      method: 'POST',
      body: JSON.stringify({
        comments: props.comments.slice(-30),
        mode: 'pricing',
      }),
    })
    const sentiment = await res.json()

    // Analyze price-related comments locally
    const priceKeywords = /giá|bao nhiêu|bn|đắt|rẻ|mắc|hời|sale|giảm|khuyến mãi|discount|how much/i
    const priceComments = props.comments.filter(c =>
      c.comment && priceKeywords.test(c.comment)
    )

    const negativePriceWords = /đắt|mắc|expensive|chát/i
    const positivePriceWords = /rẻ|hời|ok|được|phải chăng|hợp lý|xứng/i
    const buySignals = /chốt|mua|lấy|order|đặt/i

    let positiveCount = 0
    let negativeCount = 0
    let buyCount = 0

    for (const c of priceComments) {
      if (negativePriceWords.test(c.comment)) negativeCount++
      if (positivePriceWords.test(c.comment)) positiveCount++
      if (buySignals.test(c.comment)) buyCount++
    }

    const totalComments = props.comments.length
    const pricePct = totalComments > 0 ? Math.round((priceComments.length / totalComments) * 100) : 0

    let verdict, icon, advice, trend, confidence
    const ratio = totalComments > 0 ? buyCount / totalComments : 0

    if (negativeCount > positiveCount && negativeCount > 2) {
      verdict = t('admin.msg_a699d93f', 'Giá cao — nên điều chỉnh')
      icon = '!'
      advice = `Có ${negativeCount} phản hồi tiêu cực về giá. Gợi ý: giảm 5-10% hoặc thêm quà tặng/voucher để tăng tỷ lệ chốt.`
      trend = t('admin.msg_6b272d01', 'Giảm giá')
      confidence = Math.min(90, 50 + negativeCount * 10)
    } else if (positiveCount > negativeCount && buyCount > 3) {
      verdict = t('admin.msg_b44ad6ec', 'Giá hợp lý — giữ nguyên')
      icon = '✓'
      advice = `${buyCount} người chốt đơn, ${positiveCount} phản hồi tích cực. Giá đang ở sweet spot!`
      trend = t('admin.msg_1d08e73d', 'Giữ nguyên')
      confidence = Math.min(90, 50 + buyCount * 5)
    } else if (pricePct < 5) {
      verdict = t('admin.msg_b17c1733', 'Chưa đủ dữ liệu')
      icon = '~'
      advice = t('admin.msg_82bed0a3', 'Ít người hỏi giá. Thử nhắc giá/khuyến mãi trong live để thu thập phản hồi.')
      trend = t('admin.msg_07e76545', 'Chờ thêm')
      confidence = 20
    } else {
      verdict = t('admin.msg_162c87d2', 'Có thể tăng nhẹ')
      icon = '↑'
      advice = `Tỷ lệ chốt ${(ratio * 100).toFixed(0)}% với ít phàn nàn giá. Có thể thử tăng 5% và theo dõi.`
      trend = t('admin.msg_7ac4acae', 'Tăng nhẹ')
      confidence = Math.min(70, 40 + positiveCount * 8)
    }

    analysis.value = {
      verdict,
      icon,
      advice,
      trend,
      confidence,
      priceComments: priceComments.length,
      totalComments,
      positiveCount,
      negativeCount,
      buyCount,
      sentimentScore: sentiment.score,
    }
  } catch (err) {
    analysis.value = {
      verdict: t('admin.msg_d3880593', 'Lỗi kết nối'),
      icon: '✗',
      advice: t('admin.msg_c83682bb', 'Không thể phân tích. Kiểm tra backend.'),
      trend: '-',
      confidence: 0,
      priceComments: 0,
      totalComments: 0,
    }
  } finally {
    loading.value = false
  }
}

const scoreClass = computed(() => {
  if (!analysis.value) return ''
  const v = analysis.value.verdict
  if (v.includes(t('admin.msg_1f30e1a3', 'hợp lý')) || v.includes(t('admin.msg_6b7be1dc', 'tăng'))) return 'pricing-suggestion__score--good'
  if (v.includes('cao') || v.includes(t('admin.msg_aaf377aa', 'Lỗi'))) return 'pricing-suggestion__score--bad'
  return 'pricing-suggestion__score--neutral'
})

const trendColor = computed(() => {
  if (!analysis.value) return '#9ca3af'
  const t = analysis.value.trend
  if (t.includes(t('admin.msg_1bb134c4', 'Giảm'))) return '#ff3b5c'
  if (t.includes(t('admin.msg_63a83f36', 'Tăng'))) return '#10b981'
  return '#f59e0b'
})
</script>

<style scoped>
.pricing-suggestion {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px;
  margin: 8px 16px;
}

.pricing-suggestion__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pricing-suggestion__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text-primary);
}

.pricing-suggestion__refresh {
  padding: 4px 12px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.pricing-suggestion__refresh:hover:not(:disabled) {
  background: var(--color-bg-card);
  color: var(--color-text-primary);
}

.pricing-suggestion__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pricing-suggestion__body {
  animation: fadeSlideIn 0.3s ease-out;
}

.pricing-suggestion__overview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.pricing-suggestion__score {
  font-weight: 700;
  font-size: 14px;
  padding: 4px 12px;
  border-radius: 8px;
}

.pricing-suggestion__score--good {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
}

.pricing-suggestion__score--bad {
  background: rgba(255, 59, 92, 0.1);
  color: #ff3b5c;
}

.pricing-suggestion__score--neutral {
  background: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
}

.pricing-suggestion__confidence {
  font-size: 11px;
  color: var(--color-text-muted);
}

.pricing-suggestion__details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.pricing-suggestion__metric {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.pricing-suggestion__metric-label {
  color: var(--color-text-muted);
}

.pricing-suggestion__advice {
  padding: 8px 10px;
  background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.15);
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--color-text-secondary);
}

.pricing-suggestion__empty {
  text-align: center;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 0;
}
</style>
