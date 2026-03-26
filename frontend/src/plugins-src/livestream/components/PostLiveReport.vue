<template>
  <Teleport to="body">
    <div v-if="visible" class="report-overlay" @click.self="$emit('close')">
      <div class="report-modal">
        <div class="report-header">
          <div class="report-title">
            <BarChart3 :size="22" />
            <h2>{{ t('admin.msg_f626ac86', 'Báo cáo phiên Live') }}</h2>
          </div>
          <button class="close-btn" @click="$emit('close')">
            <X :size="18" />
          </button>
        </div>

        <div class="report-body" v-if="report">
          <div class="summary-grid">
            <div class="summary-card">
              <div class="card-icon icon-blue"><Clock :size="18" /></div>
              <div class="card-info">
                <div class="card-value">{{ report.duration }}</div>
                <div class="card-label">{{ t('admin.msg_77d9bdc6', 'Thời lượng') }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon icon-purple"><MessageSquare :size="18" /></div>
              <div class="card-info">
                <div class="card-value">{{ report.totalComments }}</div>
                <div class="card-label">{{ t('admin.comments', 'Bình luận') }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon icon-green"><Users :size="18" /></div>
              <div class="card-info">
                <div class="card-value">{{ report.uniqueViewers }}</div>
                <div class="card-label">{{ t('admin.viewers', 'Người xem') }}</div>
              </div>
            </div>
            <div class="summary-card">
              <div class="card-icon icon-orange"><Eye :size="18" /></div>
              <div class="card-info">
                <div class="card-value">{{ report.peakViewers }}</div>
                <div class="card-label">Peak Viewers</div>
              </div>
            </div>
          </div>

          <div class="lead-stats">
            <h4><Flame :size="16" /> {{ t('admin.msg_6b49570c', 'Phân loại Lead') }}</h4>
            <div class="lead-bars">
              <div class="lead-bar">
                <span class="lead-label hot">HOT</span>
                <div class="bar-track"><div class="bar-fill hot" :style="barStyle(report.hotLeads)"></div></div>
                <span class="lead-count">{{ report.hotLeads }}</span>
              </div>
              <div class="lead-bar">
                <span class="lead-label warm">WARM</span>
                <div class="bar-track"><div class="bar-fill warm" :style="barStyle(report.warmLeads)"></div></div>
                <span class="lead-count">{{ report.warmLeads }}</span>
              </div>
              <div class="lead-bar">
                <span class="lead-label cold">COLD</span>
                <div class="bar-track"><div class="bar-fill cold" :style="barStyle(report.coldComments)"></div></div>
                <span class="lead-count">{{ report.coldComments }}</span>
              </div>
            </div>
            <div class="conversion">
              <Target :size="14" /> Conversion Rate: <strong>{{ report.conversionRate }}%</strong>
            </div>
          </div>

          <div class="section" v-if="report.topKeywords?.length">
            <h4><Hash :size="16" /> Top Keywords</h4>
            <div class="keyword-tags">
              <span v-for="kw in report.topKeywords" :key="kw.word" class="keyword-tag">
                {{ kw.word }} <small>{{ kw.count }}</small>
              </span>
            </div>
          </div>

          <div class="section" v-if="report.topCommenters?.length">
            <h4><Trophy :size="16" /> Top Commenters</h4>
            <div class="commenter-list">
              <div v-for="(c, i) in report.topCommenters.slice(0, 5)" :key="c.nickname" class="commenter-item">
                <span class="rank" :class="'rank-' + (i+1)">{{ i + 1 }}</span>
                <span class="name">{{ c.nickname }}</span>
                <span class="badge" :class="c.label?.replace(/[\[\]]/g, '').toLowerCase()">{{ c.label }}</span>
                <span class="ccount">{{ c.count }} comments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useI18n } from '../helpers.js'
import { BarChart3, X, Clock, MessageSquare, Users, Eye, Flame, Target, Hash, Trophy } from 'lucide-vue-next'

const { t } = useI18n()

const props = defineProps({
  visible: { type: Boolean, default: false },
  report: { type: Object, default: null },
})

defineEmits(['close'])

function barStyle(value) {
  const max = Math.max(
    props.report?.hotLeads || 0,
    props.report?.warmLeads || 0,
    props.report?.coldComments || 0,
    1
  )
  return { width: `${(value / max) * 100}%` }
}
</script>

<style scoped>
.report-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.report-modal { background: var(--color-bg-secondary); border: 1px solid var(--glass-border); border-radius: var(--radius-xl, 20px); width: 560px; max-height: 85vh; overflow-y: auto; box-shadow: var(--shadow-elevated); }
.report-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px; border-bottom: 1px solid var(--color-border); }
.report-title { display: flex; align-items: center; gap: 10px; color: var(--color-text-primary); }
.report-title h2 { margin: 0; font-size: 18px; }
.close-btn { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 6px; border-radius: var(--radius-sm, 8px); transition: all 0.15s; }
.close-btn:hover { background: var(--color-bg-card-hover); color: var(--color-text-primary); }
.report-body { padding: 24px; }
.summary-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 24px; }
.summary-card { display: flex; align-items: center; gap: 12px; padding: 14px; border-radius: var(--radius-md, 12px); background: var(--glass-bg); border: 1px solid var(--glass-border); transition: all 0.2s; }
.summary-card:hover { border-color: var(--color-border-hover); }
.card-icon { width: 38px; height: 38px; border-radius: var(--radius-sm, 8px); display: flex; align-items: center; justify-content: center; }
.icon-blue { background: var(--color-accent-glow); color: var(--accent-light); }
.icon-purple { background: rgba(155, 89, 182, 0.12); color: #c084fc; }
.icon-green { background: var(--color-success-glow); color: var(--color-success); }
.icon-orange { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.card-value { font-size: var(--font-size-card, 20px); font-weight: 700; color: var(--color-text-primary); }
.card-label { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.lead-stats { margin-bottom: 24px; padding: 16px; border-radius: var(--radius-md, 12px); background: var(--glass-bg); border: 1px solid var(--glass-border); }
.lead-stats h4, .section h4 { display: flex; align-items: center; gap: 6px; font-size: 14px; margin: 0 0 12px; color: var(--color-text-primary); }
.lead-bars { display: flex; flex-direction: column; gap: 8px; }
.lead-bar { display: flex; align-items: center; gap: 10px; }
.lead-label { font-size: 11px; font-weight: 700; width: 50px; text-align: center; padding: 2px 8px; border-radius: 4px; }
.lead-label.hot { background: var(--color-accent-hot-glow); color: var(--color-accent-hot); }
.lead-label.warm { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.lead-label.cold { background: rgba(107,114,128,0.12); color: var(--color-accent-cold); }
.bar-track { flex: 1; height: 8px; background: var(--color-border); border-radius: 4px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.bar-fill.hot { background: linear-gradient(90deg, #ef4444, #dc2626); }
.bar-fill.warm { background: linear-gradient(90deg, #f59e0b, #d97706); }
.bar-fill.cold { background: linear-gradient(90deg, #6b7280, #4b5563); }
.lead-count { font-size: 13px; font-weight: 600; color: var(--color-text-primary); min-width: 30px; text-align: right; }
.conversion { display: flex; align-items: center; gap: 6px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--color-border); font-size: 13px; color: var(--color-text-muted); }
.conversion strong { color: var(--accent-light); }
.section { margin-bottom: 20px; }
.keyword-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.keyword-tag { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 20px; padding: 4px 12px; font-size: 13px; color: var(--color-text-primary); }
.keyword-tag small { color: var(--color-text-muted); margin-left: 4px; font-size: 11px; }
.commenter-list { display: flex; flex-direction: column; gap: 6px; }
.commenter-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm, 8px); background: var(--glass-bg); border: 1px solid var(--glass-border); font-size: 13px; }
.rank { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; background: var(--color-border); color: var(--color-text-muted); }
.rank-1 { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.rank-2 { background: rgba(107,114,128,0.15); color: #9ca3af; }
.rank-3 { background: rgba(205,127,50,0.15); color: #cd7f32; }
.name { flex: 1; color: var(--color-text-primary); font-weight: 600; }
.badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
.badge.hot { background: var(--color-accent-hot-glow); color: var(--color-accent-hot); }
.badge.warm { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.badge.cold { background: rgba(107,114,128,0.12); color: var(--color-accent-cold); }
.ccount { font-size: 12px; color: var(--color-text-muted); }
</style>
