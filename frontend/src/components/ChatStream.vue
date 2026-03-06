<template>
  <div class="chat-stream">
    <div class="chat-stream__header">
      <h3 class="chat-stream__title"><MessagesSquare :size="15" /> Live Chat</h3>
      <span class="chat-stream__count">{{ comments.length }} tin nhắn</span>
    </div>

    <div class="chat-stream__list" ref="chatListRef">
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
        }"
      >
        <span class="chat-msg__label" v-if="msg.label !== '[COLD]'">
          <Flame v-if="msg.label === '[HOT]'" :size="12" />
          <CircleDot v-else :size="12" />
        </span>
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { MessagesSquare, Clock, Flame, CircleDot } from 'lucide-vue-next'

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
})

const chatListRef = ref(null)

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

.chat-stream__count {
  font-size: 12px;
  color: var(--color-text-muted);
}

.chat-stream__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
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
}

.chat-msg--hot {
  background: rgba(255, 59, 92, 0.08);
}

.chat-msg--warm {
  background: rgba(255, 140, 66, 0.06);
}

.chat-msg--keyword {
  border-left: 2px solid var(--color-accent-warm);
}

.chat-msg__label {
  flex-shrink: 0;
  font-size: 12px;
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
</style>

