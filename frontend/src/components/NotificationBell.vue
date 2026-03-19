<template>
  <div class="notif-bell" @click.stop="toggleDropdown">
    <Bell :size="18" />
    <span v-if="unreadCount > 0" class="notif-bell__badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>

    <Teleport to="body">
      <div v-if="showDropdown" class="notif-overlay" @click="showDropdown = false" />
      <div v-if="showDropdown" class="notif-dropdown">
        <div class="notif-dropdown__header">
          <span><Bell :size="14" style="vertical-align:middle" /> Thông báo</span>
          <button v-if="unreadCount > 0" class="notif-dropdown__mark-all" @click.stop="markAllRead">Đọc tất cả</button>
        </div>
        <div class="notif-dropdown__list">
          <div v-if="notifications.length === 0" class="notif-dropdown__empty">Không có thông báo</div>
          <div
            v-for="n in notifications" :key="n.id"
            class="notif-item" :class="{ 'notif-item--unread': !n.is_read }"
            @click="handleClick(n)"
          >
            <div class="notif-item__icon"><component :is="typeIconMap[n.type] || Bell" :size="18" :style="{ color: typeIconColor[n.type] || 'var(--color-text-muted)' }" /></div>
            <div class="notif-item__content">
              <div class="notif-item__title">{{ n.title }}</div>
              <div v-if="n.message" class="notif-item__message">{{ n.message }}</div>
              <div class="notif-item__time">{{ timeAgo(n.created_at) }}</div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Bell, Flame, AlertTriangle, CheckCircle, Zap, Info } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const emit = defineEmits(['navigate'])

const typeIconMap = { hot_lead: Flame, disconnect: AlertTriangle, connect: CheckCircle, warning: Zap, info: Info }
const typeIconColor = { hot_lead: '#ff3b5c', disconnect: '#f59e0b', connect: '#10b981', warning: '#6366f1', info: '#3b82f6' }

const showDropdown = ref(false)
const notifications = ref([])
const unreadCount = ref(0)
let pollInterval = null

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) fetchNotifications()
}

async function fetchUnreadCount() {
  try {
    const res = await apiFetch('/notifications/unread-count')
    const data = await res.json()
    unreadCount.value = data.count || 0
  } catch { /* silent */ }
}

async function fetchNotifications() {
  try {
    const res = await apiFetch('/notifications?limit=20')
    const data = await res.json()
    notifications.value = Array.isArray(data) ? data : (data.data || [])
  } catch { /* silent */ }
}

async function markAllRead() {
  try {
    await apiFetch('/notifications/read-all', { method: 'PUT' })
    notifications.value.forEach(n => n.is_read = true)
    unreadCount.value = 0
  } catch { /* silent */ }
}

async function handleClick(n) {
  if (!n.is_read) {
    try {
      await apiFetch(`/notifications/${n.id}/read`, { method: 'PUT' })
      n.is_read = true
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch { /* silent */ }
  }
  showDropdown.value = false
  // Navigate based on notification type — only to existing tabs
  const routes = { hot_lead: 'crm', connect: 'live', disconnect: 'live' }
  const route = routes[n.type]
  if (route) emit('navigate', route)
}

// typeIcon replaced with <component :is> + typeIconMap in template

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'Vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

onMounted(() => {
  fetchUnreadCount()
  pollInterval = setInterval(fetchUnreadCount, 15000)
})
onUnmounted(() => { if (pollInterval) clearInterval(pollInterval) })
</script>

<style scoped>
.notif-bell {
  position: relative; cursor: pointer; display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; transition: background 0.2s;
}
.notif-bell:hover { background: var(--color-bg-tertiary, rgba(255,255,255,0.1)); }
.notif-bell__badge {
  position: absolute; top: 2px; right: 2px; min-width: 16px; height: 16px;
  background: #ff3b5c; color: white; font-size: 10px; font-weight: 700;
  border-radius: 8px; display: flex; align-items: center; justify-content: center;
  padding: 0 4px; line-height: 1;
}
.notif-overlay { position: fixed; inset: 0; z-index: 998; }
.notif-dropdown {
  position: fixed; top: 52px; right: 16px; width: 360px; max-height: 480px;
  background: var(--color-bg-secondary, #1a1a2e); border: 1px solid var(--color-border, #2a2a4a);
  border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.5); z-index: 999;
  display: flex; flex-direction: column; overflow: hidden;
}
.notif-dropdown__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-bottom: 1px solid var(--color-border, #2a2a4a);
  font-weight: 700; font-size: 14px;
}
.notif-dropdown__mark-all {
  background: none; border: none; color: var(--color-accent-primary); cursor: pointer;
  font-size: 12px; font-weight: 600;
}
.notif-dropdown__mark-all:hover { text-decoration: underline; }
.notif-dropdown__list { overflow-y: auto; max-height: 400px; }
.notif-dropdown__empty { padding: 40px 16px; text-align: center; color: var(--color-text-muted, #888); font-size: 13px; }
.notif-item {
  display: flex; gap: 10px; padding: 12px 16px; cursor: pointer;
  border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.05));
  transition: background 0.2s;
}
.notif-item:hover { background: var(--color-bg-primary, rgba(255,255,255,0.03)); }
.notif-item--unread { background: var(--color-accent-glow); }
.notif-item__icon { font-size: 20px; flex-shrink: 0; padding-top: 2px; }
.notif-item__content { flex: 1; min-width: 0; }
.notif-item__title { font-size: 13px; font-weight: 600; line-height: 1.3; }
.notif-item__message { font-size: 12px; color: var(--color-text-muted, #999); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.notif-item__time { font-size: 11px; color: var(--color-text-muted, #777); margin-top: 4px; }
</style>
