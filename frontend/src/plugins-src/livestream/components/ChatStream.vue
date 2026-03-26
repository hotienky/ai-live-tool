<template>
  <div class="chat-stream">
    <div class="chat-stream__header">
      <h3 class="chat-stream__title"><span class="chat-stream__title-icon"><MessagesSquare :size="15" /></span> Live Chat</h3>
      <div class="chat-stream__header-right">
        <span class="chat-stream__count">{{ filteredComments.length }} / {{ comments.length }}</span>
        <button
          class="chat-stream__search-toggle"
          :class="{ active: showSearch }"
          @click="showSearch = !showSearch"
          :title="t('admin.msg_35851e19', 'Tìm kiếm (Ctrl+K)')"
        >
          <Search :size="13" />
        </button>
        <button
          class="chat-stream__scroll-btn"
          :class="{ 'chat-stream__scroll-btn--paused': !autoScroll }"
          @click="toggleAutoScroll"
          :title="autoScroll ? t('admin.msg_fa92f9e5', 'Tạm dừng auto-scroll') : t('admin.msg_3d08b473', 'Bật auto-scroll')"
        >
          <ArrowDown v-if="autoScroll" :size="14" />
          <Pause v-else :size="14" />
        </button>
      </div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="chat-stream__search" v-if="showSearch">
      <div class="search-input-wrap">
        <Search :size="13" class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          :placeholder="t('admin.msg_791ff9', 'Tìm kiếm bình luận...')"
          class="search-input"
          @keydown.escape="showSearch = false"
        />
        <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''"><X :size="12" /></button>
      </div>
      <div class="filter-buttons">
        <button
          v-for="f in filterOptions"
          :key="f.key"
          class="filter-btn"
          :class="{ active: activeFilter === f.key, [f.cls]: true }"
          @click="activeFilter = activeFilter === f.key ? 'all' : f.key"
        >
          {{ f.label }}
          <span class="filter-count">{{ labelCounts[f.key] || 0 }}</span>
        </button>
      </div>
    </div>

    <div class="chat-stream__list" ref="chatListRef" @scroll="onScroll">
      <div v-if="filteredComments.length === 0" class="chat-stream__empty">
        <template v-if="searchQuery || activeFilter !== 'all'">
          <Search :size="14" /> Không tìm thấy kết quả
        </template>
        <template v-else>
          <Clock :size="14" /> Chờ bình luận...
        </template>
      </div>
      <div
        v-for="msg in filteredComments"
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
        <span class="chat-msg__text" :class="textClass(msg.label)" v-html="highlightText(msg.comment, msg.matchedKeywords)">
        </span>
        <span
          v-for="kw in (msg.matchedKeywords || [])"
          :key="kw.keyword"
          class="chat-msg__kw-badge"
          :style="{ backgroundColor: kw.color + '22', color: kw.color, borderColor: kw.color + '44' }"
        >
          {{ kw.keyword }}
        </span>
        <span v-if="msg.matchedProduct" class="chat-msg__product-badge">
          <ShoppingBag :size="12" style="vertical-align:middle" /> {{ msg.matchedProduct.product?.name }}
        </span>
        <button
          class="chat-msg__reply-btn"
          @click.stop="$emit('reply', msg)"
          :title="t('admin.msg_fb352fcc', 'Trả lời nhanh')"
        >
          <MessageCircle :size="13" />
        </button>
      </div>
    </div>

    <button
      v-if="!autoScroll && comments.length > 10"
      class="chat-stream__jump-bottom"
      @click="scrollToBottom"
    >
      ⬇ {{ newMessageCount }} {{ t('admin.msg_be2ff4b0', 'tin nhắn mới') }}
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { MessagesSquare, Clock, Flame, CircleDot, Search, ArrowDown, Pause, X, ShoppingBag, MessageCircle } from 'lucide-vue-next'
import { useUrlParam, useI18n } from '../helpers.js'

const { t } = useI18n()

const props = defineProps({
  comments: { type: Array, default: () => [] },
})

const emit = defineEmits(['reply', 'userClick'])

const chatListRef = ref(null)
const searchInputRef = ref(null)
const autoScroll = ref(true)
const selectedComment = ref(null)
const newMessageCount = ref(0)
const lastScrollTop = ref(0)
const showSearch = ref(false)
const searchQuery = ref('')
const activeFilter = useUrlParam('filter', 'all')

const filterOptions = [
  { key: '[HOT]', label: 'HOT', cls: 'filter-hot' },
  { key: '[WARM]', label: 'WARM', cls: 'filter-warm' },
  { key: '[COLD]', label: 'COLD', cls: 'filter-cold' },
]

const labelCounts = computed(() => {
  const counts = { '[HOT]': 0, '[WARM]': 0, '[COLD]': 0 }
  for (const c of props.comments) {
    if (counts[c.label] !== undefined) counts[c.label]++
  }
  return counts
})

const filteredComments = computed(() => {
  let list = props.comments
  if (activeFilter.value !== 'all') {
    list = list.filter(c => c.label === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(c =>
      (c.comment || '').toLowerCase().includes(q) ||
      (c.nickname || '').toLowerCase().includes(q)
    )
  }
  return list
})

watch(showSearch, (v) => {
  if (v) nextTick(() => searchInputRef.value?.focus())
})

watch(() => props.comments.length, () => {
  if (autoScroll.value && activeFilter.value === 'all' && !searchQuery.value) {
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
  return { 'chat-msg__text--cold': label === '[COLD]' }
}

function highlightText(text, matchedKeywords) {
  if (!text) return ''
  let html = escapeHtml(text)
  if (searchQuery.value.trim()) {
    const q = escapeRegex(searchQuery.value.trim())
    html = html.replace(new RegExp(`(${q})`, 'gi'), '<mark class="search-highlight">$1</mark>')
  }
  if (matchedKeywords?.length) {
    for (const kw of matchedKeywords) {
      const regex = new RegExp(`(${escapeRegex(kw.keyword)})`, 'gi')
      html = html.replace(regex, `<mark style="background:${kw.color}33;color:${kw.color};border-radius:2px;padding:0 2px;">$1</mark>`)
    }
  }
  return html
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

defineExpose({ showSearch, searchInputRef })
</script>

<style scoped>
.chat-stream {
  display: flex; flex-direction: column; height: 100%;
  overflow: hidden; position: relative;
}
.chat-stream__header {
  padding: 12px 16px; border-bottom: 1px solid var(--color-border);
  display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;
}
.chat-stream__title {
  font-size: 15px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}
.chat-stream__title-icon {
  width: 28px; height: 28px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(129, 140, 248, 0.12); color: #818cf8;
}
.chat-stream__header-right { display: flex; align-items: center; gap: 8px; }
.chat-stream__count { font-size: 12px; color: var(--color-text-muted); }
.chat-stream__search-toggle {
  background: none; border: 1px solid var(--color-border);
  border-radius: 6px; padding: 4px 6px; cursor: pointer;
  color: var(--color-text-muted); display: flex; align-items: center;
  transition: all 0.2s;
}
.chat-stream__search-toggle.active {
  border-color: #818cf8; color: #818cf8; background: rgba(129, 140, 248, 0.1);
}
.chat-stream__search {
  padding: 8px 12px; border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-elevated); flex-shrink: 0;
  animation: slideDown 0.2s ease;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.search-input-wrap { position: relative; display: flex; align-items: center; }
.search-icon { position: absolute; left: 10px; color: var(--color-text-muted); pointer-events: none; }
.search-input {
  width: 100%; background: var(--color-bg-card-hover); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 7px 30px 7px 32px; color: var(--color-text-primary); font-size: 13px;
  outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: #818cf8; }
.search-input::placeholder { color: var(--color-text-muted); }
.search-clear {
  position: absolute; right: 8px; background: none; border: none;
  color: var(--color-text-muted); cursor: pointer; font-size: 13px;
}
.filter-buttons { display: flex; gap: 6px; margin-top: 8px; }
.filter-btn {
  display: flex; align-items: center; gap: 4px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 6px; padding: 4px 10px; color: var(--color-text-muted);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.filter-btn:hover { background: var(--color-bg-card-hover); }
.filter-btn.active.filter-hot { border-color: #ef4444; color: #ef4444; background: rgba(239,68,68,0.1); }
.filter-btn.active.filter-warm { border-color: #f59e0b; color: #f59e0b; background: rgba(245,158,11,0.1); }
.filter-btn.active.filter-cold { border-color: #6b7280; color: #6b7280; background: rgba(107,114,128,0.15); }
.filter-count {
  background: var(--color-bg-card-hover); border-radius: 4px; padding: 0 4px;
  font-size: 10px; min-width: 16px; text-align: center;
}
.chat-stream__scroll-btn {
  background: none; border: 1px solid var(--color-border);
  border-radius: 6px; padding: 3px 6px; cursor: pointer;
  font-size: 12px; line-height: 1; transition: all 0.2s;
}
.chat-stream__scroll-btn--paused { border-color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
.chat-stream__list { flex: 1; overflow-y: auto; padding: 8px 12px; scroll-behavior: smooth; }
.chat-stream__empty {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; height: 100px; color: var(--color-text-muted); font-size: 14px;
}
.chat-msg {
  padding: 5px 8px; margin-bottom: 3px; border-radius: 6px;
  font-size: 13px; line-height: 1.4; animation: chatSlideIn 0.3s ease-out;
  display: flex; align-items: flex-start; gap: 4px; flex-wrap: wrap;
  cursor: pointer; transition: background 0.15s; position: relative;
}
.chat-msg:hover { background: var(--color-bg-card-hover); }
.chat-msg--hot { background: rgba(255, 59, 92, 0.08); }
.chat-msg--hot:hover { background: rgba(255, 59, 92, 0.14); }
.chat-msg--warm { background: rgba(255, 140, 66, 0.06); }
.chat-msg--keyword { border-left: 2px solid var(--color-accent-warm); }
.chat-msg--selected { background: rgba(129, 140, 248, 0.12) !important; border-left: 2px solid #818cf8; }
.chat-msg__label { flex-shrink: 0; font-size: 12px; }
.chat-msg__avatar { width: 20px; height: 20px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.chat-msg__name { font-weight: 600; white-space: nowrap; flex-shrink: 0; }
.chat-msg__name--hot { color: var(--color-accent-hot); }
.chat-msg__name--warm { color: var(--color-accent-warm); }
.chat-msg__name--cold { color: var(--color-text-muted); }
.chat-msg__text { color: var(--color-text-secondary); word-break: break-word; }
.chat-msg__text--cold { color: var(--color-text-muted); opacity: 0.7; }
.chat-msg__kw-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  border: 1px solid; font-weight: 600; white-space: nowrap; flex-shrink: 0;
}
.chat-msg__product-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 4px;
  background: rgba(168, 85, 247, 0.1); color: #a855f7; white-space: nowrap; flex-shrink: 0;
}
.chat-msg__reply-btn {
  display: none; background: rgba(129, 140, 248, 0.15); border: none;
  border-radius: 4px; padding: 2px 6px; cursor: pointer; font-size: 12px;
  margin-left: auto; flex-shrink: 0; transition: all 0.15s;
}
.chat-msg:hover .chat-msg__reply-btn { display: inline-flex; }
.chat-msg__reply-btn:hover { background: rgba(129, 140, 248, 0.3); }
:deep(.search-highlight) {
  background: rgba(129, 140, 248, 0.3); color: #fff;
  border-radius: 2px; padding: 0 2px;
}
.chat-stream__jump-bottom {
  position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
  background: var(--color-bg-secondary); color: #818cf8; border: 1px solid #818cf8;
  border-radius: 20px; padding: 6px 16px; font-size: 12px; font-weight: 600;
  cursor: pointer; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  animation: fadeIn 0.2s ease;
}
.chat-stream__jump-bottom:hover { background: #818cf8; color: #fff; }
@keyframes chatSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
