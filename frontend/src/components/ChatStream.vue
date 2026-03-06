<template>
  <div class="chat-stream">
    <div class="chat-stream__header">
      <h3 class="chat-stream__title"><MessagesSquare :size="15" /> Live Chat</h3>
      <div class="chat-stream__header-right">
        <span class="chat-stream__count">{{ comments.length }} tin nhắn</span>
        <button
          class="chat-stream__scroll-btn"
          :class="{ 'chat-stream__scroll-btn--paused': !autoScroll }"
          @click="toggleAutoScroll"
          :title="autoScroll ? 'Tạm dừng auto-scroll' : 'Bật auto-scroll'"
        >
          {{ autoScroll ? '⬇️' : '⏸️' }}
        </button>
      </div>
    </div>

    <div class="chat-stream__list" ref="chatListRef" @scroll="onScroll">
      <div v-if="comments.length === 0" class="chat-stream__empty">
        <Clock :size="14" /> Chờ bình luận...
      </div>
      <div
        v-for="msg in comments"
        :key="msg.id"
        class="chat-msg"
        :class="{
          'chat-msg--hot': msg.label === '[HOT]',
          'chat-msg--warm': msg.label === '[WARM]',
          'chat-msg--keyword': msg.matchedKeywords?.length > 0,
          'chat-msg--selected': selectedComment?.id === msg.id,
        }"
        @click="onCommentClick(msg)"
      >
        <span class="chat-msg__label" v-if="msg.label !== '[COLD]'">
          <Flame v-if="msg.label === '[HOT]'" :size="12" />
          <CircleDot v-else :size="12" />
        </span>
        <img
          v-if="msg.profilePictureUrl"
          :src="msg.profilePictureUrl"
          class="chat-msg__avatar"
          :alt="msg.nickname"
        />
        <span class="chat-msg__name" :class="nameClass(msg.label)">
          {{ msg.nickname }}:
        </span>
        <span class="chat-msg__text" :class="textClass(msg.label)" v-html="highlightKeywords(msg.comment, msg.matchedKeywords)">
        </span>
        <!-- Keyword badges -->
        <span
          v-for="kw in (msg.matchedKeywords || [])"
          :key="kw.keyword"
          class="chat-msg__kw-badge"
          :style="{ backgroundColor: kw.color + '22', color: kw.color, borderColor: kw.color + '44' }"
        >
          {{ kw.keyword }}
        </span>
        <!-- Product match indicator -->
        <span v-if="msg.matchedProduct" class="chat-msg__product-badge">
          🛍️ {{ msg.matchedProduct.product?.name }}
        </span>
        <!-- Reply button -->
        <button
          class="chat-msg__reply-btn"
          @click.stop="$emit('reply', msg)"
          title="Trả lời nhanh"
        >
          💬
        </button>
      </div>
    </div>

    <!-- Jump to bottom when paused -->
    <button
      v-if="!autoScroll && comments.length > 10"
      class="chat-stream__jump-bottom"
      @click="scrollToBottom"
    >
      ⬇ {{ newMessageCount }} tin nhắn mới
    </button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'
import { MessagesSquare, Clock, Flame, CircleDot } from 'lucide-vue-next'

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['reply', 'userClick'])

const chatListRef = ref(null)
const autoScroll = ref(true)
const selectedComment = ref(null)
const newMessageCount = ref(0)
const lastScrollTop = ref(0)

// Auto-scroll to bottom when new comments arrive
watch(() => props.comments.length, () => {
  if (autoScroll.value) {
    nextTick(() => scrollToBottom())
  } else {
    newMessageCount.value++
  }
})

function scrollToBottom() {
  if (chatListRef.value) {
    chatListRef.value.scrollTop = chatListRef.value.scrollHeight
    autoScroll.value = true
    newMessageCount.value = 0
  }
}

function onScroll() {
  if (!chatListRef.value) return
  const el = chatListRef.value
  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60
  if (!isNearBottom && el.scrollTop < lastScrollTop.value) {
    autoScroll.value = false
  } else if (isNearBottom) {
    autoScroll.value = true
    newMessageCount.value = 0
  }
  lastScrollTop.value = el.scrollTop
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value
  if (autoScroll.value) scrollToBottom()
}

function onCommentClick(msg) {
  selectedComment.value = msg
  emit('reply', msg)
}

function nameClass(label) {
  return {
    'chat-msg__name--hot': label === '[HOT]',
    'chat-msg__name--warm': label === '[WARM]',
    'chat-msg__name--cold': label === '[COLD]',
  }
}

function textClass(label) {
  return {
    'chat-msg__text--cold': label === '[COLD]',
  }
}

function highlightKeywords(text, matchedKeywords) {
  if (!text || !matchedKeywords || matchedKeywords.length === 0) return escapeHtml(text || '')
  let html = escapeHtml(text)
  for (const kw of matchedKeywords) {
    const regex = new RegExp(`(${escapeRegex(kw.keyword)})`, 'gi')
    html = html.replace(regex, `<mark style="background:${kw.color}33;color:${kw.color};border-radius:2px;padding:0 2px;">$1</mark>`)
  }
  return html
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
</script>

<style scoped>
.chat-stream {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}

.chat-stream__header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.chat-stream__title {
  font-size: 15px;
  font-weight: 600;
}

.chat-stream__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-stream__count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.chat-stream__scroll-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 3px 6px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  transition: all 0.2s;
}
.chat-stream__scroll-btn--paused {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.1);
}

.chat-stream__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  scroll-behavior: smooth;
}

.chat-stream__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100px;
  color: var(--color-text-muted);
  font-size: 14px;
}

/* Chat Message */
.chat-msg {
  padding: 5px 8px;
  margin-bottom: 3px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.4;
  animation: chatSlideIn 0.3s ease-out;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  flex-wrap: wrap;
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.chat-msg:hover {
  background: rgba(255,255,255,0.04);
}

.chat-msg--hot {
  background: rgba(255, 59, 92, 0.08);
}
.chat-msg--hot:hover {
  background: rgba(255, 59, 92, 0.14);
}

.chat-msg--warm {
  background: rgba(255, 140, 66, 0.06);
}

.chat-msg--keyword {
  border-left: 2px solid var(--color-accent-warm);
}

.chat-msg--selected {
  background: rgba(129, 140, 248, 0.12) !important;
  border-left: 2px solid #818cf8;
}

.chat-msg__label {
  flex-shrink: 0;
  font-size: 12px;
}

.chat-msg__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.chat-msg__name {
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-msg__name--hot {
  color: var(--color-accent-hot);
}

.chat-msg__name--warm {
  color: var(--color-accent-warm);
}

.chat-msg__name--cold {
  color: var(--color-text-muted);
}

.chat-msg__text {
  color: var(--color-text-secondary);
  word-break: break-word;
}

.chat-msg__text--cold {
  color: var(--color-text-muted);
  opacity: 0.7;
}

.chat-msg__kw-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-msg__product-badge {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(168, 85, 247, 0.1);
  color: #a855f7;
  white-space: nowrap;
  flex-shrink: 0;
}

.chat-msg__reply-btn {
  display: none;
  background: rgba(129, 140, 248, 0.15);
  border: none;
  border-radius: 4px;
  padding: 2px 6px;
  cursor: pointer;
  font-size: 12px;
  margin-left: auto;
  flex-shrink: 0;
  transition: all 0.15s;
}
.chat-msg:hover .chat-msg__reply-btn {
  display: inline-flex;
}
.chat-msg__reply-btn:hover {
  background: rgba(129, 140, 248, 0.3);
}

/* Jump to bottom */
.chat-stream__jump-bottom {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  background: #1e293b;
  color: #818cf8;
  border: 1px solid #818cf8;
  border-radius: 20px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: fadeIn 0.2s ease;
}
.chat-stream__jump-bottom:hover {
  background: #818cf8;
  color: #fff;
}

@keyframes chatSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
