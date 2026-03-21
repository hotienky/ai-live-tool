/**
 * useAdminNotifications — Composable quản lý thông báo admin.
 *
 * - Fetch danh sách từ API (có phân trang + filter)
 * - Subscribe real-time qua Laravel Reverb (WebSocket)
 * - Quản lý unread count, mark read, delete
 *
 * State được chia sẻ toàn app (singleton module-level).
 */
import { ref, computed } from 'vue'
import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { apiFetch } from './useApi.js'

// ─── Singleton state ─────────────────────────────────────────────
const notifications  = ref([])   // Danh sách hiển thị trong dropdown (20 gần nhất)
const unreadCount    = ref(0)
const isConnected    = ref(false)
const isLoading      = ref(false)

let echo       = null
let pollTimer  = null
let initialized = false

// ─── Helpers ─────────────────────────────────────────────────────

function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
    return user?.role || user?.roles?.[0] || null
  } catch { return null }
}

// ─── API calls ───────────────────────────────────────────────────

async function fetchUnreadCount() {
  try {
    const res  = await apiFetch('/notifications/unread-count')
    const data = await res.json()
    unreadCount.value = data?.count ?? 0
  } catch { /* silent */ }
}

async function fetchNotifications(type = null) {
  isLoading.value = true
  try {
    const qs  = type ? `?type=${type}&per_page=20` : '?per_page=20'
    const res  = await apiFetch(`/notifications${qs}`)
    const data = await res.json()
    notifications.value = Array.isArray(data) ? data : (data?.data ?? [])
  } catch { /* silent */ }
  finally { isLoading.value = false }
}

async function markAsRead(id) {
  try {
    await apiFetch(`/notifications/${id}/read`, { method: 'PUT' })
    const n = notifications.value.find(x => x.id === id)
    if (n && !n.is_read) {
      n.is_read = true
      n.read_at = new Date().toISOString()
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
  } catch { /* silent */ }
}

async function markAllRead() {
  try {
    await apiFetch('/notifications/read-all', { method: 'PUT' })
    notifications.value.forEach(n => { n.is_read = true; n.read_at = new Date().toISOString() })
    unreadCount.value = 0
  } catch { /* silent */ }
}

async function deleteNotification(id) {
  try {
    await apiFetch(`/notifications/${id}`, { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => n.id !== id)
    // Cập nhật lại unread count từ server
    await fetchUnreadCount()
  } catch { /* silent */ }
}

async function clearReadNotifications() {
  try {
    await apiFetch('/notifications/clear-read', { method: 'DELETE' })
    notifications.value = notifications.value.filter(n => !n.is_read)
  } catch { /* silent */ }
}

// ─── Reverb WebSocket ─────────────────────────────────────────────

function initEcho() {
  if (echo) return

  const reverbKey = import.meta.env.VITE_REVERB_APP_KEY
  if (!reverbKey) {
    console.debug('[Notifications] VITE_REVERB_APP_KEY not set, skipping WebSocket')
    return
  }

  window.Pusher = Pusher

  echo = new Echo({
    broadcaster: 'reverb',
    key:      import.meta.env.VITE_REVERB_APP_KEY,
    wsHost:   import.meta.env.VITE_REVERB_HOST    || 'localhost',
    wsPort:   import.meta.env.VITE_REVERB_PORT    || 8080,
    wssPort:  import.meta.env.VITE_REVERB_PORT    || 8080,
    scheme:   import.meta.env.VITE_REVERB_SCHEME  || 'http',
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'http') === 'https',
    enabledTransports: ['ws', 'wss'],
    authEndpoint: `${import.meta.env.VITE_API_BASE || ''}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
      },
    },
  })

  // Subscribe kênh theo role của user
  const role = getUserRole()
  if (!role) return

  echo.private(`admin.role.${role}`)
    .listen('.admin.notification', (payload) => {
      // Thêm vào đầu danh sách
      notifications.value.unshift({
        id:         Date.now(), // temp id — fetch lại để lấy id thật
        type:       payload.type,
        title:      payload.title,
        message:    payload.message,
        data:       payload.data,
        link:       payload.link,
        channel:    'in_app',
        is_read:    false,
        read_at:    null,
        created_at: new Date().toISOString(),
      })
      // Giữ tối đa 30 thông báo trong dropdown
      if (notifications.value.length > 30) notifications.value.pop()
      unreadCount.value++
      isConnected.value = true

      // Fetch lại để lấy id thật từ server
      fetchNotifications()
    })

  echo.connector?.pusher?.connection?.bind('connected', () => { isConnected.value = true })
  echo.connector?.pusher?.connection?.bind('disconnected', () => { isConnected.value = false })
}

function disconnectEcho() {
  if (echo) { echo.disconnect(); echo = null; isConnected.value = false }
}

// ─── Init / Destroy ───────────────────────────────────────────────

function init() {
  if (initialized) return
  initialized = true

  fetchUnreadCount()
  fetchNotifications()
  initEcho()

  // Fallback polling mỗi 30s (khi WebSocket mất kết nối)
  pollTimer = setInterval(fetchUnreadCount, 30000)
}

function destroy() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  disconnectEcho()
  initialized = false
}

// ─── Computed ────────────────────────────────────────────────────

const hasUnread = computed(() => unreadCount.value > 0)
const badgeText = computed(() => unreadCount.value > 99 ? '99+' : String(unreadCount.value))

// ─── Export ──────────────────────────────────────────────────────

export function useAdminNotifications() {
  return {
    // state
    notifications,
    unreadCount,
    hasUnread,
    badgeText,
    isConnected,
    isLoading,
    // actions
    init,
    destroy,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllRead,
    deleteNotification,
    clearReadNotifications,
  }
}
