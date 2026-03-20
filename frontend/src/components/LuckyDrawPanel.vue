<template>
  <div class="lucky-draw">
    <div class="lucky-draw__header">
      <h3 class="lucky-draw__title">
        <Gift :size="18" />
        Lucky Draw
      </h3>
      <button class="lucky-draw__close" @click="$emit('close')">
        <X :size="16" />
      </button>
    </div>

    <div class="lucky-draw__body">
      <!-- Setup -->
      <div class="lucky-draw__setup" v-if="!isRunning && !winner">
        <div class="lucky-draw__field">
          <label><Target :size="13" style="vertical-align:middle" /> Keyword tham gia</label>
          <input v-model="config.keyword" :placeholder="t('admin.msg_b1f487', 'Ví dụ: muatui, freeship...')" class="lucky-draw__input" />
        </div>
        <div class="lucky-draw__field">
          <label><Trophy :size="13" style="vertical-align:middle" /> {{ t('admin.msg_bf78655a', 'Số người trúng') }}</label>
          <input v-model.number="config.winnerCount" type="number" min="1" max="10" class="lucky-draw__input lucky-draw__input--sm" />
        </div>
        <div class="lucky-draw__field">
          <label><Timer :size="13" style="vertical-align:middle" /> {{ t('admin.msg_38972d56', 'Thời gian nhận (giây)') }}</label>
          <input v-model.number="config.duration" type="number" min="10" max="300" class="lucky-draw__input lucky-draw__input--sm" />
        </div>
        <button class="lucky-draw__start" @click="startDraw">
          <Sparkles :size="16" />
          Bắt đầu Lucky Draw!
        </button>
      </div>

      <!-- Running -->
      <div class="lucky-draw__running" v-if="isRunning">
        <div class="lucky-draw__countdown">
          <span class="lucky-draw__timer">{{ timeLeft }}s</span>
          <p>{{ t('admin.msg_8a8c1b65', 'Đang nhận comment chứa "') }}<strong>{{ config.keyword }}</strong>"</p>
        </div>
        <div class="lucky-draw__participants">
          <p class="lucky-draw__count">
            <Users :size="14" /> {{ participants.length }} người tham gia
          </p>
          <div class="lucky-draw__avatars">
            <span v-for="p in participants.slice(-20)" :key="p.uniqueId" class="lucky-draw__avatar">
              {{ p.nickname.charAt(0) }}
            </span>
          </div>
        </div>
        <button class="lucky-draw__stop" @click="stopAndDraw">
          <Zap :size="14" /> Quay ngay!
        </button>
      </div>

      <!-- Winners -->
      <div class="lucky-draw__result" v-if="winner">
        <div class="lucky-draw__confetti"><PartyPopper :size="48" style="color:#f59e0b" /></div>
        <h3 class="lucky-draw__winners-title">{{ t('admin.msg_ed0ab155', 'Chúc mừng!') }}</h3>
        <div class="lucky-draw__winner-list">
          <div v-for="w in winners" :key="w.uniqueId" class="lucky-draw__winner-card">
            <Trophy :size="18" style="color: #f59e0b" />
            <span class="lucky-draw__winner-name">{{ w.nickname }}</span>
            <span class="lucky-draw__winner-id">@{{ w.uniqueId }}</span>
          </div>
        </div>
        <div class="lucky-draw__actions">
          <button class="lucky-draw__reset" @click="reset">
            <RotateCcw :size="14" /> Quay lại
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { Gift, X, Sparkles, Users, Zap, Trophy, RotateCcw, Target, Timer, PartyPopper } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  comments: { type: Array, default: () => [] },
})

defineEmits(['close'])

const config = ref({ keyword: '', winnerCount: 1, duration: 60 })
const isRunning = ref(false)
const winner = ref(false)
const winners = ref([])
const participants = ref([])
const timeLeft = ref(0)
let intervalId = null
let watchStartIdx = 0

function startDraw() {
  if (!config.value.keyword) return
  isRunning.value = true
  winner.value = false
  winners.value = []
  participants.value = []
  timeLeft.value = config.value.duration
  watchStartIdx = props.comments.length

  intervalId = setInterval(() => {
    timeLeft.value--
    collectParticipants()
    if (timeLeft.value <= 0) stopAndDraw()
  }, 1000)
}

function collectParticipants() {
  const kw = config.value.keyword.toLowerCase()
  const newComments = props.comments.slice(watchStartIdx)
  for (const c of newComments) {
    const text = (c.comment || '').toLowerCase()
    if (text.includes(kw) && !participants.value.find((p) => p.uniqueId === c.uniqueId)) {
      participants.value.push({ nickname: c.nickname, uniqueId: c.uniqueId })
    }
  }
}

function stopAndDraw() {
  if (intervalId) clearInterval(intervalId)
  isRunning.value = false
  collectParticipants()

  // Random pick
  const pool = [...participants.value]
  const picked = []
  const count = Math.min(config.value.winnerCount, pool.length)
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(idx, 1)[0])
  }
  winners.value = picked
  winner.value = true
}

function reset() {
  winner.value = false
  winners.value = []
  participants.value = []
  isRunning.value = false
  timeLeft.value = 0
}

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.lucky-draw {
  background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border); overflow: hidden;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.lucky-draw__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid var(--color-border);
}
.lucky-draw__title { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; }
.lucky-draw__close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; }
.lucky-draw__body { padding: 18px; }
.lucky-draw__field { margin-bottom: 12px; }
.lucky-draw__field label { font-size: 12px; font-weight: 600; display: block; margin-bottom: 4px; }
.lucky-draw__input {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px;
  outline: none; box-sizing: border-box;
}
.lucky-draw__input--sm { width: 100px; }
.lucky-draw__start {
  width: 100%; padding: 12px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #f59e0b, #ef4444); color: white;
  font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  margin-top: 8px; transition: opacity 0.2s;
}
.lucky-draw__start:hover { opacity: 0.9; }
.lucky-draw__running { text-align: center; }
.lucky-draw__countdown { margin-bottom: 16px; }
.lucky-draw__timer {
  font-size: 48px; font-weight: 900;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.lucky-draw__count { font-size: 14px; color: var(--color-text-secondary); display: flex; align-items: center; justify-content: center; gap: 4px; margin-bottom: 8px; }
.lucky-draw__avatars { display: flex; flex-wrap: wrap; gap: 4px; justify-content: center; margin-bottom: 12px; }
.lucky-draw__avatar {
  width: 28px; height: 28px; border-radius: 50%; background: var(--color-bg-primary);
  display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
  color: var(--color-text-primary); border: 1px solid var(--color-border);
}
.lucky-draw__stop {
  padding: 10px 24px; border-radius: 8px; border: none;
  background: #ef4444; color: white; font-weight: 700; font-size: 14px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 6px;
}
.lucky-draw__result { text-align: center; }
.lucky-draw__confetti { font-size: 48px; animation: bounce 0.6s; }
@keyframes bounce { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.3); } }
.lucky-draw__winners-title { font-size: 20px; font-weight: 800; margin: 8px 0 16px; }
.lucky-draw__winner-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.lucky-draw__winner-card {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: rgba(245, 158, 11, 0.1); border-radius: 8px; border: 1px solid rgba(245, 158, 11, 0.3);
}
.lucky-draw__winner-name { font-weight: 700; font-size: 15px; }
.lucky-draw__winner-id { font-size: 12px; color: var(--color-text-muted); }
.lucky-draw__reset {
  padding: 8px 18px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 4px;
}
</style>
