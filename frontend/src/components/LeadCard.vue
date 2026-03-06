<template>
  <div
    class="lead-card"
    :class="{
      'lead-card--hot': label === '[HOT]',
      'lead-card--warm': label === '[WARM]',
    }"
    @click="$emit('openCustomer', { uniqueId, nickname, profilePictureUrl, label, comment })"
  >
    <!-- Label Badge -->
    <div class="lead-card__badge" :class="badgeClass">
      <Flame v-if="label === '[HOT]'" :size="12" />
      <CircleDot v-else :size="12" />
      {{ label === '[HOT]' ? 'HOT' : 'WARM' }}
    </div>

    <!-- Header -->
    <div class="lead-card__header">
      <img
        :src="profilePictureUrl || defaultAvatar"
        :alt="nickname"
        class="lead-card__avatar"
        @error="onAvatarError"
      />
      <div class="lead-card__info">
        <span class="lead-card__name">{{ nickname }}</span>
        <span class="lead-card__uid">@{{ uniqueId }}</span>
      </div>
      <span class="lead-card__time">{{ timeAgo }}</span>
    </div>

    <!-- Comment Body -->
    <div class="lead-card__body">
      <p class="lead-card__comment">{{ comment }}</p>
    </div>

    <!-- Matched Product -->
    <div class="lead-card__product" v-if="matchedProduct">
      <ShoppingBag :size="13" />
      <span class="lead-card__product-name">{{ matchedProduct.product?.name }}</span>
      <span class="lead-card__product-price" v-if="matchedProduct.product?.price">
        {{ Number(matchedProduct.product.price).toLocaleString() }}đ
      </span>
      <span class="lead-card__product-confidence">
        {{ Math.round(matchedProduct.confidence * 100) }}% match
      </span>
    </div>

    <!-- Actions -->
    <div class="lead-card__actions">
      <a
        :href="profileLink"
        target="_blank"
        rel="noopener noreferrer"
        class="lead-card__cta"
        :class="label === '[HOT]' ? 'lead-card__cta--hot' : 'lead-card__cta--warm'"
      >
        <ExternalLink :size="13" />
        Nhắn tin ngay
      </a>
      <button
        class="lead-card__reply-btn"
        @click="onSuggestReply"
        :disabled="loadingReply"
      >
        <Loader2 v-if="loadingReply" :size="13" class="lead-card__spinner" />
        <MessageCircle v-else :size="13" />
        Gợi ý trả lời
      </button>
    </div>

    <!-- AI Reply Suggestion -->
    <div class="lead-card__reply" v-if="suggestedReply">
      <div class="lead-card__reply-header">
        <span><Bot :size="13" /> AI gợi ý:</span>
        <button class="lead-card__copy-btn" @click="copyReply">
          <Check v-if="copied" :size="11" />
          <Copy v-else :size="11" />
          {{ copied ? 'Đã copy' : 'Copy' }}
        </button>
      </div>
      <p class="lead-card__reply-text">{{ suggestedReply }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  Flame, CircleDot, ExternalLink, MessageCircle,
  Loader2, Bot, Copy, Check, ShoppingBag
} from 'lucide-vue-next'

const props = defineProps({
  nickname: String,
  uniqueId: String,
  comment: String,
  label: String,
  profileLink: String,
  profilePictureUrl: String,
  timestamp: String,
  matchedProduct: { type: Object, default: null },
})

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
const avatarSrc = ref(props.profilePictureUrl || defaultAvatar)
const suggestedReply = ref('')
const loadingReply = ref(false)
const copied = ref(false)

function onAvatarError() { avatarSrc.value = defaultAvatar }

const badgeClass = computed(() => ({
  'lead-card__badge--hot': props.label === '[HOT]',
  'lead-card__badge--warm': props.label === '[WARM]',
}))

const timeAgo = computed(() => {
  if (!props.timestamp) return ''
  const diff = Date.now() - new Date(props.timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
})

async function onSuggestReply() {
  if (loadingReply.value) return
  loadingReply.value = true
  suggestedReply.value = ''
  try {
    const res = await fetch('http://localhost:3000/api/reply/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: props.comment, label: props.label, nickname: props.nickname }),
    })
    const data = await res.json()
    suggestedReply.value = data.reply
  } catch {
    suggestedReply.value = 'Lỗi kết nối AI. Thử lại sau.'
  } finally { loadingReply.value = false }
}

async function copyReply() {
  try {
    await navigator.clipboard.writeText(suggestedReply.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    const el = document.createElement('textarea')
    el.value = suggestedReply.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}
</script>

<style scoped>
.lead-card {
  background: var(--color-bg-card); border-radius: 12px; padding: 16px;
  margin-bottom: 12px; border-left: 4px solid transparent; position: relative;
  animation: fadeSlideIn 0.4s ease-out; transition: transform 0.2s, background 0.2s;
}
.lead-card:hover { transform: translateX(4px); background: var(--color-bg-card-hover); }
.lead-card--hot { border-left-color: var(--color-accent-hot); animation: fadeSlideIn 0.4s ease-out, hotPulse 2s ease-in-out infinite; }
.lead-card--warm { border-left-color: var(--color-accent-warm); }

.lead-card__badge {
  position: absolute; top: 12px; right: 12px; padding: 3px 10px; border-radius: 20px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
  display: flex; align-items: center; gap: 4px;
}
.lead-card__badge--hot { background: rgba(255, 59, 92, 0.15); color: var(--color-accent-hot); border: 1px solid rgba(255, 59, 92, 0.3); }
.lead-card__badge--warm { background: rgba(255, 140, 66, 0.15); color: var(--color-accent-warm); border: 1px solid rgba(255, 140, 66, 0.3); }

.lead-card__header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.lead-card__avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-border); }
.lead-card__info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.lead-card__name { font-weight: 600; font-size: 14px; color: var(--color-text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lead-card__uid { font-size: 12px; color: var(--color-text-muted); }
.lead-card__time { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }

.lead-card__body { margin-bottom: 12px; }
.lead-card__comment { font-size: 14px; line-height: 1.5; color: var(--color-text-secondary); word-break: break-word; }

.lead-card__product {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; margin-bottom: 10px; border-radius: 6px;
  background: rgba(168, 85, 247, 0.08); border: 1px solid rgba(168, 85, 247, 0.2);
  font-size: 12px; color: #a855f7;
}
.lead-card__product-name { font-weight: 600; }
.lead-card__product-price { color: var(--color-text-primary); font-weight: 700; }
.lead-card__product-confidence { margin-left: auto; font-size: 11px; opacity: 0.7; }

.lead-card__actions { display: flex; gap: 8px; flex-wrap: wrap; }
.lead-card__cta {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px;
  font-size: 13px; font-weight: 600; text-decoration: none; transition: all 0.2s; cursor: pointer;
}
.lead-card__cta--hot { background: var(--color-accent-hot); color: white; }
.lead-card__cta--hot:hover { background: #e63350; transform: scale(1.03); box-shadow: 0 4px 15px var(--color-accent-hot-glow); }
.lead-card__cta--warm { background: var(--color-accent-warm); color: white; }
.lead-card__cta--warm:hover { background: #e67a35; transform: scale(1.03); box-shadow: 0 4px 15px var(--color-accent-warm-glow); }

.lead-card__reply-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 8px 14px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.lead-card__reply-btn:hover:not(:disabled) { background: var(--color-bg-card); color: var(--color-text-primary); border-color: #38bdf8; }
.lead-card__reply-btn:disabled { opacity: 0.6; cursor: wait; }

.lead-card__spinner { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.lead-card__reply {
  margin-top: 10px; padding: 10px 12px; background: rgba(56, 189, 248, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 8px; animation: fadeSlideIn 0.3s ease-out;
}
.lead-card__reply-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 6px; font-size: 11px; color: #38bdf8; font-weight: 600;
}
.lead-card__reply-header span { display: flex; align-items: center; gap: 4px; }
.lead-card__copy-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8;
  padding: 2px 10px; border-radius: 6px; font-size: 11px; cursor: pointer; transition: all 0.2s;
}
.lead-card__copy-btn:hover { background: rgba(56, 189, 248, 0.15); }
.lead-card__reply-text { font-size: 13px; line-height: 1.5; color: var(--color-text-secondary); }
</style>
