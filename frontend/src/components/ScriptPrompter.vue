<template>
  <div class="prompter" :class="{ 'prompter--mini': isMini, 'prompter--expanded': isExpanded }">
    <div class="prompter__header">
      <h3 class="prompter__title">
        <FileText :size="16" />
        Kịch bản Live
      </h3>
      <div class="prompter__controls">
        <button type="button" class="prompter__btn" @click="toggleExpand" :title="isExpanded ? 'Thu nhỏ' : 'Mở rộng'">
          <Shrink v-if="isExpanded" :size="14" />
          <Expand v-else :size="14" />
        </button>
        <button type="button" class="prompter__btn" @click="isMini = !isMini" :title="isMini ? 'Hiện nội dung' : 'Ẩn nội dung'">
          <ChevronDown v-if="isMini" :size="14" />
          <ChevronUp v-else :size="14" />
        </button>
        <button type="button" class="prompter__btn" @click="$emit('close')"><X :size="14" /></button>
      </div>
    </div>

    <div class="prompter__body" v-if="!isMini">
      <!-- Script Editor (when not playing) -->
      <div v-if="!isPlaying" class="prompter__editor">
        <textarea
          v-model="scriptText"
          ref="textareaRef"
          class="prompter__textarea"
          :rows="isExpanded ? 20 : 12"
          placeholder="Nhập kịch bản live ở đây...

📋 Mẫu:
▶ Chào mọi người! Hôm nay mình giới thiệu sản phẩm ABC
💰 Giá gốc 500k, hôm nay chỉ 299k
🔥 Comment &quot;MUANGAY&quot; để được tư vấn
⏰ Flash sale trong 15 phút nữa!"
        ></textarea>
        <div class="prompter__editor-actions">
          <select v-model="scrollSpeed" class="prompter__speed-select">
            <option :value="1">Chậm</option>
            <option :value="2">Vừa</option>
            <option :value="3">Nhanh</option>
          </select>
          <button type="button" class="prompter__play-btn" @click="startPrompter" :disabled="!scriptText.trim()">
            <Play :size="14" /> Bắt đầu
          </button>
        </div>
      </div>

      <!-- Teleprompter View (when playing) -->
      <div v-else class="prompter__teleprompter" ref="teleprompterRef">
        <div class="prompter__scroll-content" :style="{ transform: `translateY(-${scrollPos}px)` }">
          <p
            v-for="(line, i) in scriptLines"
            :key="i"
            class="prompter__line"
            :class="{
              'prompter__line--active': i === currentLine,
              'prompter__line--past': i < currentLine,
            }"
          >
            {{ line }}
          </p>
        </div>
        <div class="prompter__focus-bar"></div>
        <div class="prompter__play-controls">
          <button type="button" class="prompter__ctrl-btn" @click="prevLine"><ChevronUp :size="16" /></button>
          <button type="button" class="prompter__ctrl-btn" @click="togglePause">
            <Pause v-if="!isPaused" :size="16" />
            <Play v-else :size="16" />
          </button>
          <button type="button" class="prompter__ctrl-btn" @click="nextLine"><ChevronDown :size="16" /></button>
          <button type="button" class="prompter__ctrl-btn prompter__ctrl-btn--stop" @click="stopPrompter">
            <Square :size="14" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import {
  FileText, X, Expand, Shrink, Play, Pause,
  Square, ChevronUp, ChevronDown
} from 'lucide-vue-next'

const { t } = useI18n()

defineEmits(['close'])

const isMini = ref(false)
const isExpanded = ref(false)
const scriptText = ref('')
const scrollSpeed = ref(2) // 1=slow 2=med 3=fast
const isPlaying = ref(false)
const isPaused = ref(false)
const currentLine = ref(0)
const scrollPos = ref(0)
let scrollInterval = null

const scriptLines = computed(() => scriptText.value.split('\n').filter(l => l.trim()))
const lineHeight = 36

function startPrompter() {
  isPlaying.value = true
  isPaused.value = false
  currentLine.value = 0
  scrollPos.value = 0
  startAutoScroll()
}

function startAutoScroll() {
  if (scrollInterval) clearInterval(scrollInterval)
  const speed = [30, 50, 80][scrollSpeed.value - 1] || 50
  scrollInterval = setInterval(() => {
    if (!isPaused.value) {
      scrollPos.value += 1
      const newLine = Math.floor(scrollPos.value / lineHeight)
      if (newLine !== currentLine.value && newLine < scriptLines.value.length) {
        currentLine.value = newLine
      }
      if (currentLine.value >= scriptLines.value.length - 1) {
        clearInterval(scrollInterval)
      }
    }
  }, speed)
}

function togglePause() {
  isPaused.value = !isPaused.value
}

function nextLine() {
  if (currentLine.value < scriptLines.value.length - 1) {
    currentLine.value++
    scrollPos.value = currentLine.value * lineHeight
  }
}

function prevLine() {
  if (currentLine.value > 0) {
    currentLine.value--
    scrollPos.value = currentLine.value * lineHeight
  }
}

function stopPrompter() {
  isPlaying.value = false
  if (scrollInterval) clearInterval(scrollInterval)
}

function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) isMini.value = false
}

onUnmounted(() => { if (scrollInterval) clearInterval(scrollInterval) })
</script>

<style scoped>
.prompter {
  background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border); overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.prompter--mini { width: 200px; }
.prompter__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-bottom: 1px solid var(--color-border);
  cursor: move;
}
.prompter__title { font-size: 14px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.prompter__controls { display: flex; gap: 4px; }
.prompter__btn {
  background: none; border: 1px solid var(--color-border); border-radius: 4px;
  padding: 4px; cursor: pointer; color: var(--color-text-muted);
}
.prompter__body { padding: 14px; }
.prompter__textarea {
  width: 100%; padding: 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary);
  font-size: 14px; line-height: 1.6; font-family: inherit; resize: vertical; outline: none;
  box-sizing: border-box;
}
.prompter__textarea:focus { border-color: #ff3b5c; }
.prompter__editor-actions { display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end; }
.prompter__speed-select {
  padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px;
}
.prompter__play-btn {
  padding: 8px 16px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #10b981, #059669); color: white;
  font-weight: 600; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
}
.prompter__play-btn:disabled { opacity: 0.4; }

/* Teleprompter */
.prompter__teleprompter {
  position: relative; height: 250px; overflow: hidden; border-radius: 8px;
  background: #0a0a0a;
}
.prompter__scroll-content {
  padding: 100px 20px; transition: transform 0.1s linear;
}
.prompter__line {
  font-size: 16px; line-height: 36px; color: rgba(255,255,255,0.3);
  transition: all 0.3s; white-space: pre-wrap;
}
.prompter__line--active {
  color: #ffffff; font-size: 18px; font-weight: 700;
  text-shadow: 0 0 10px rgba(255,255,255,0.3);
}
.prompter__line--past { color: rgba(255,255,255,0.15); }
.prompter__focus-bar {
  position: absolute; top: 50%; left: 0; right: 0; height: 40px;
  transform: translateY(-50%);
  border-top: 2px solid rgba(255, 59, 92, 0.5);
  border-bottom: 2px solid rgba(255, 59, 92, 0.5);
  pointer-events: none;
}
.prompter__play-controls {
  position: absolute; bottom: 8px; right: 8px;
  display: flex; gap: 4px;
}
.prompter__ctrl-btn {
  width: 30px; height: 30px; border-radius: 6px; border: none;
  background: rgba(255,255,255,0.1); color: white;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.prompter__ctrl-btn:hover { background: rgba(255,255,255,0.2); }
.prompter__ctrl-btn--stop { background: rgba(239, 68, 68, 0.3); }
.prompter__ctrl-btn--stop:hover { background: rgba(239, 68, 68, 0.5); }

/* Expanded / Fullscreen mode */
.prompter--expanded {
  position: fixed !important;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 700px;
  max-width: 90vw;
  max-height: calc(100vh - 80px);
  z-index: 200;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}
.prompter--expanded .prompter__body { max-height: calc(100vh - 160px); overflow-y: auto; }
.prompter--expanded .prompter__teleprompter { height: 500px; }
.prompter--expanded .prompter__line { font-size: 20px; line-height: 44px; }
.prompter--expanded .prompter__line--active { font-size: 24px; }
</style>
