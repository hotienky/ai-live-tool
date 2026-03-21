<template>
  <div class="lmv">
    <!-- Toolbar -->
    <div class="lmv__toolbar">
      <div class="lmv__status">
        <span class="lmv__dot" :class="statusDotClass"></span>
        <span class="lmv__status-text">{{ statusText }}</span>
      </div>
      <div class="lmv__viewers" v-if="viewerCount > 0">
        <Eye :size="13" /> {{ viewerCount.toLocaleString() }}
      </div>
      <div class="lmv__spacer"></div>
      <button class="lmv__btn" :class="{ active: showHistory }" @click="showHistory = !showHistory" title="Lịch sử phiên">
        <History :size="15" />
      </button>
      <button class="lmv__btn" @click="onExport" title="Export CSV">
        <Download :size="15" />
      </button>
      <div class="lmv__divider"></div>
      <button
        class="lmv__btn lmv__btn--start"
        @click="showLiveModal = true"
        :disabled="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'"
      >
        <Radio :size="13" /> {{ t('admin.live_session', 'Phiên Live') }}
      </button>
      <button
        class="lmv__btn lmv__btn--stop"
        @click="onDisconnect"
        v-if="crawlerStatus?.status === 'connected' || crawlerStatus?.status === 'mock'"
      >
        <Square :size="13" /> {{ t('admin.disconnect', 'Ngắt') }}
      </button>
      <button class="lmv__btn" @click="onResetStats" title="Reset stats">
        <RotateCcw :size="14" />
      </button>
    </div>

    <!-- Main Layout: Lead Panel (left 70%) + Chat (right 30%) -->
    <div class="lmv__body">
      <section class="lmv__left">
        <LeadPanel :leads="leads" @openCustomer="$emit('openCustomer', $event)" />
      </section>
      <section class="lmv__right">
        <ChatStream
          ref="chatStreamRef"
          :comments="allComments"
          @reply="onQuickReply"
        />
        <!-- Stats Bar -->
        <div class="lmv__stats-bar">
          <div class="lmv__stat lmv__stat--hot">
            <Flame :size="12" /> {{ stats.hot }} HOT
          </div>
          <div class="lmv__stat lmv__stat--warm">
            <CircleDot :size="12" /> {{ stats.warm }} WARM
          </div>
          <div class="lmv__stat lmv__stat--total">
            <MessageCircle :size="12" /> {{ stats.total }} total
          </div>
        </div>
      </section>
    </div>

    <!-- Quick Reply -->
    <Teleport to="body">
      <div class="lmv-quick-reply" v-if="showQuickReply && quickReplyTarget" @click.self="showQuickReply = false">
        <div class="lmv-quick-reply__box">
          <div class="lmv-quick-reply__header">
            <span>{{ t('admin.msg_reply_to', 'Trả lời') }} @{{ quickReplyTarget.nickname }}</span>
            <button @click="showQuickReply = false"><X :size="14" /></button>
          </div>
          <p class="lmv-quick-reply__original">"{{ quickReplyTarget.comment }}"</p>
          <textarea
            v-model="replyText"
            class="lmv-quick-reply__input"
            :placeholder="t('admin.type_reply', 'Nhập trả lời...')"
            rows="3"
            @keydown.ctrl.enter="sendReply"
          ></textarea>
          <div class="lmv-quick-reply__actions">
            <button class="lmv-quick-reply__send" @click="sendReply" :disabled="!replyText.trim()">
              <Send :size="13" /> {{ t('admin.send', 'Gửi') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modals -->
    <SessionHistory :visible="showHistory" @close="showHistory = false" />
    <PostLiveReport :visible="showPostReport" :report="postLiveReport" @close="showPostReport = false" />
    <LiveSessionModal v-if="showLiveModal" @close="showLiveModal = false" @started="onSessionStarted" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Eye, History, Download, Radio, Square, RotateCcw,
  Flame, CircleDot, MessageCircle, X, Send
} from 'lucide-vue-next'
import { apiFetch, useSocket, useI18n, API_BASE } from '../helpers.js'
import LeadPanel from './LeadPanel.vue'
import ChatStream from './ChatStream.vue'
import SessionHistory from './SessionHistory.vue'
import PostLiveReport from './PostLiveReport.vue'
import LiveSessionModal from './LiveSessionModal.vue'

const { t } = useI18n()

defineEmits(['openCustomer'])

// ── Socket ──
const {
  isConnected, connectionLost, leads, allComments,
  stats, crawlerStatus, viewerCount, postLiveReport,
  joinShop, startMock, resetStats,
} = useSocket()

// ── State ──
const showHistory = ref(false)
const showLiveModal = ref(false)
const showPostReport = ref(false)
const showQuickReply = ref(false)
const quickReplyTarget = ref(null)
const replyText = ref('')
const chatStreamRef = ref(null)

// Auto-show report when received
watch(postLiveReport, (report) => {
  if (report) showPostReport.value = true
})

// ── Status display ──
const statusDotClass = computed(() => {
  if (!isConnected.value) return 'lmv__dot--offline'
  const s = crawlerStatus.value?.status
  if (s === 'connected' || s === 'mock') return 'lmv__dot--live'
  if (s === 'error') return 'lmv__dot--error'
  return 'lmv__dot--waiting'
})

const statusText = computed(() => {
  if (!isConnected.value) return t('admin.msg_connection_lost', 'Mất kết nối server')
  const s = crawlerStatus.value?.status
  if (s === 'connected' || s === 'mock') return s === 'mock' ? 'Mock mode' : t('admin.msg_live_now', 'Đang Live')
  if (s === 'error') return t('admin.msg_aaf377aa', 'Lỗi') + ': ' + (crawlerStatus.value?.message || '')
  if (s === 'disconnected') return t('admin.msg_disconnected', 'Ngắt kết nối')
  return t('admin.msg_waiting', 'Chờ kết nối...')
})

// ── Actions ──
function onQuickReply(comment) {
  quickReplyTarget.value = comment
  replyText.value = ''
  showQuickReply.value = true
}

async function sendReply() {
  if (!replyText.value.trim() || !quickReplyTarget.value) return
  try {
    await apiFetch('/reply/send', {
      method: 'POST',
      body: JSON.stringify({ comment: quickReplyTarget.value.comment, reply: replyText.value, nickname: quickReplyTarget.value.nickname }),
    })
  } catch { /* silent */ }
  showQuickReply.value = false
}

async function onDisconnect() {
  try {
    await apiFetch(`/shops/${window.__LIVESTREAM_CURRENT_SHOP_ID__}/disconnect`, { method: 'POST', body: '{}' })
  } catch { /* silent */ }
}

function onResetStats() {
  const shopId = window.__LIVESTREAM_CURRENT_SHOP_ID__
  if (shopId) resetStats(shopId)
}

function onExport() {
  window.open(`${API_BASE}/export/leads?format=csv`, '_blank')
}

async function onSessionStarted(shop) {
  window.__LIVESTREAM_CURRENT_SHOP_ID__ = shop.id
  joinShop(shop.id)
}
</script>

<style scoped>
.lmv { display: flex; flex-direction: column; height: 100%; overflow: hidden; }

/* Toolbar */
.lmv__toolbar {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px;
  border-bottom: 1px solid var(--color-border); flex-shrink: 0;
  background: var(--color-bg-secondary);
}
.lmv__status { display: flex; align-items: center; gap: 8px; }
.lmv__dot { width: 8px; height: 8px; border-radius: 50%; }
.lmv__dot--live { background: #10b981; box-shadow: 0 0 6px rgba(16,185,129,0.5); animation: pulse 2s infinite; }
.lmv__dot--error { background: #ef4444; }
.lmv__dot--offline { background: #6b7280; }
.lmv__dot--waiting { background: #f59e0b; animation: pulse 2s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
.lmv__status-text { font-size: 13px; color: var(--color-text-secondary); }
.lmv__viewers { display: flex; align-items: center; gap: 4px; font-size: 13px; color: var(--color-text-muted); }
.lmv__spacer { flex: 1; }
.lmv__btn {
  display: flex; align-items: center; gap: 5px;
  background: none; border: 1px solid var(--color-border); border-radius: 6px;
  padding: 5px 10px; cursor: pointer; font-size: 12px; font-weight: 600;
  color: var(--color-text-secondary); transition: all 0.2s;
}
.lmv__btn:hover { background: var(--color-bg-card); color: var(--color-text-primary); }
.lmv__btn:disabled { opacity: 0.4; cursor: not-allowed; }
.lmv__btn.active { border-color: var(--color-accent-primary); color: var(--accent-light); background: var(--color-accent-glow); }
.lmv__btn--start { background: linear-gradient(135deg, #ff3b5c, #e63350); color: white; border-color: transparent; }
.lmv__btn--start:hover:not(:disabled) { background: linear-gradient(135deg, #e63350, #cc2a44); }
.lmv__btn--stop { background: rgba(239,68,68,0.1); color: #ef4444; border-color: rgba(239,68,68,0.3); }
.lmv__btn--stop:hover { background: rgba(239,68,68,0.2); }
.lmv__divider { width: 1px; height: 24px; background: var(--color-border); margin: 0 4px; }

/* Body */
.lmv__body { display: flex; flex: 1; overflow: hidden; }
.lmv__left { flex: 7; overflow: hidden; border-right: 1px solid var(--color-border); }
.lmv__right { flex: 3; display: flex; flex-direction: column; overflow: hidden; min-width: 280px; }

/* Stats Bar */
.lmv__stats-bar {
  display: flex; gap: 12px; padding: 8px 14px;
  border-top: 1px solid var(--color-border); flex-shrink: 0;
  background: var(--color-bg-secondary);
}
.lmv__stat { display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 600; }
.lmv__stat--hot { color: var(--color-accent-hot); }
.lmv__stat--warm { color: var(--color-accent-warm); }
.lmv__stat--total { color: var(--color-text-muted); }

/* Quick Reply */
.lmv-quick-reply {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 2000;
  display: flex; align-items: flex-end; justify-content: center; padding-bottom: 40px;
}
.lmv-quick-reply__box {
  width: 480px; background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
.lmv-quick-reply__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-size: 14px; font-weight: 600; color: var(--color-text-primary);
}
.lmv-quick-reply__header button { background: none; border: none; color: var(--color-text-muted); cursor: pointer; }
.lmv-quick-reply__original {
  font-size: 12px; color: var(--color-text-muted); padding: 8px 12px;
  background: var(--color-bg-card); border-radius: 6px; margin-bottom: 12px;
  border-left: 3px solid var(--color-border);
}
.lmv-quick-reply__input {
  width: 100%; background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 10px 12px; color: var(--color-text-primary);
  font-size: 13px; resize: vertical; outline: none; transition: border-color 0.2s;
  box-sizing: border-box;
}
.lmv-quick-reply__input:focus { border-color: var(--color-accent-primary); }
.lmv-quick-reply__actions { display: flex; justify-content: flex-end; margin-top: 10px; }
.lmv-quick-reply__send {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: white; font-size: 13px; font-weight: 600; cursor: pointer;
}
.lmv-quick-reply__send:disabled { opacity: 0.5; cursor: not-allowed; }
.lmv-quick-reply__send:hover:not(:disabled) { opacity: 0.9; }
</style>
