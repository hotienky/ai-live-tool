<template>
  <div class="notif-center">
    <!-- Toggle Button -->
    <button class="notif-center__trigger" @click="isOpen = !isOpen" :class="{ 'notif-center__trigger--has': unreadCount > 0 }">
      <Bell :size="18" />
      <span v-if="unreadCount > 0" class="notif-center__badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
    </button>

    <!-- Panel -->
    <div v-if="isOpen" class="notif-center__panel">
      <div class="notif-center__header">
        <h3>Thông báo</h3>
        <button v-if="notifications.length > 0" class="notif-center__clear" @click="clearAll">Xóa tất cả</button>
      </div>
      <div class="notif-center__list">
        <div v-for="n in notifications" :key="n.id" class="notif-center__item" :class="{ 'notif-center__item--unread': !n.read }" @click="markRead(n)">
          <span class="notif-center__icon">
            <Flame v-if="n.type === 'hot_lead'" :size="16" />
            <KeyRound v-else-if="n.type === 'keyword'" :size="16" />
            <Radio v-else-if="n.type === 'session'" :size="16" />
            <Dices v-else-if="n.type === 'draw'" :size="16" />
            <Info v-else :size="16" />
          </span>
          <div class="notif-center__body">
            <p class="notif-center__text">{{ n.message }}</p>
            <span class="notif-center__time">{{ timeAgo(n.timestamp) }}</span>
          </div>
        </div>
        <p v-if="notifications.length === 0" class="notif-center__empty">
          Không có thông báo
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Bell, Flame, KeyRound, Radio, Dices, Info } from 'lucide-vue-next'

const isOpen = ref(false)
const notifications = ref([])

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

function addNotification(type, message) {
  notifications.value.unshift({
    id: Date.now(),
    type,
    message,
    timestamp: new Date(),
    read: false,
  })
  // Keep max 50
  if (notifications.value.length > 50) notifications.value = notifications.value.slice(0, 50)
}

function markRead(n) { n.read = true }

function clearAll() {
  notifications.value = []
}



function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return 'Vừa xong'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`
  return `${Math.floor(seconds / 86400)} ngày trước`
}

// Close on click outside
function handleClickOutside(e) {
  if (isOpen.value && !e.target.closest('.notif-center')) {
    isOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))

// Expose for parent to push notifications
defineExpose({ addNotification })
</script>

<style scoped>
.notif-center { position: relative; }
.notif-center__trigger {
  position: relative; background: none; border: 1px solid var(--color-border);
  border-radius: 8px; padding: 7px 8px; cursor: pointer;
  color: var(--color-text-secondary); transition: all 0.2s;
}
.notif-center__trigger:hover { border-color: #ff3b5c; color: #ff3b5c; }
.notif-center__trigger--has { animation: pulse 2s infinite; }
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255, 59, 92, 0.2); }
  50% { box-shadow: 0 0 0 6px rgba(255, 59, 92, 0); }
}
.notif-center__badge {
  position: absolute; top: -6px; right: -6px;
  background: #ef4444; color: white; font-size: 10px; font-weight: 700;
  width: 18px; height: 18px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; line-height: 1;
}
.notif-center__panel {
  position: absolute; top: 100%; right: 0; margin-top: 8px;
  width: 340px; max-height: 400px;
  background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border);
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  z-index: 100; overflow: hidden;
  animation: slideDown 0.2s ease-out;
}
@keyframes slideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
.notif-center__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--color-border);
}
.notif-center__header h3 { font-size: 14px; font-weight: 700; }
.notif-center__clear {
  background: none; border: none; color: #ff3b5c; font-size: 12px;
  cursor: pointer; font-weight: 600;
}
.notif-center__list { max-height: 340px; overflow-y: auto; }
.notif-center__item {
  display: flex; gap: 10px; padding: 10px 16px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer; transition: background 0.15s;
}
.notif-center__item:hover { background: var(--color-bg-primary); }
.notif-center__item--unread { background: rgba(255, 59, 92, 0.04); }
.notif-center__icon { font-size: 18px; flex-shrink: 0; padding-top: 2px; display: flex; color: var(--color-text-muted); }
.notif-center__body { flex: 1; min-width: 0; }
.notif-center__text { font-size: 13px; margin: 0; line-height: 1.4; }
.notif-center__time { font-size: 11px; color: var(--color-text-muted); }
.notif-center__empty { text-align: center; padding: 30px; color: var(--color-text-muted); font-size: 13px; }
</style>
