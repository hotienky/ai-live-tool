<template>
  <div class="notif-bell" @click.stop="toggleDropdown" :title="t('admin.notifications', 'Thông báo')">
    <Bell :size="18" />
    <span v-if="hasUnread" class="notif-bell__badge">{{ badgeText }}</span>

    <!-- Real-time indicator -->
    <span v-if="isConnected" class="notif-bell__live" title="Kết nối real-time" />

    <Teleport to="body">
      <div v-if="showDropdown" class="notif-overlay" @click="showDropdown = false" />
      <div v-if="showDropdown" class="notif-dropdown">

        <!-- Header -->
        <div class="notif-dropdown__header">
          <span class="notif-dropdown__title">
            <Bell :size="14" style="vertical-align:middle;margin-right:6px" />
            {{ t('admin.notifications', 'Thông báo') }}
            <span v-if="hasUnread" class="notif-dropdown__count">{{ unreadCount }}</span>
          </span>
          <div class="notif-dropdown__actions">
            <button v-if="hasUnread" class="notif-dropdown__btn" @click.stop="handleMarkAll">
              {{ t('admin.mark_all_read', 'Đọc tất cả') }}
            </button>
            <button v-if="notifications.some(n => n.is_read)" class="notif-dropdown__btn notif-dropdown__btn--muted" @click.stop="handleClearRead">
              {{ t('admin.clear_read', 'Xóa đã đọc') }}
            </button>
          </div>
        </div>

        <!-- Filter tabs -->
        <div class="notif-dropdown__tabs">
          <button
            v-for="tab in tabs" :key="tab.value"
            class="notif-dropdown__tab"
            :class="{ 'notif-dropdown__tab--active': activeTab === tab.value }"
            @click.stop="setTab(tab.value)"
          >{{ tab.label }}</button>
        </div>

        <!-- List -->
        <div class="notif-dropdown__list">
          <div v-if="isLoading" class="notif-dropdown__empty">
            <span class="notif-dropdown__spinner" />
          </div>
          <div v-else-if="filteredNotifications.length === 0" class="notif-dropdown__empty">
            {{ t('admin.no_notifications', 'Không có thông báo') }}
          </div>
          <div
            v-else
            v-for="n in filteredNotifications"
            :key="n.id"
            class="notif-item"
            :class="{ 'notif-item--unread': !n.is_read }"
            @click.stop="handleClick(n)"
          >
            <div class="notif-item__icon">
              <component :is="typeIcon(n.type)" :size="18" :style="{ color: typeColor(n.type) }" />
            </div>
            <div class="notif-item__content">
              <div class="notif-item__title">{{ n.title }}</div>
              <div v-if="n.message" class="notif-item__message">{{ n.message }}</div>
              <div class="notif-item__time">{{ timeAgo(n.created_at) }}</div>
            </div>
            <button class="notif-item__delete" @click.stop="handleDelete(n.id)" :title="t('admin.delete', 'Xóa')">
              <X :size="12" />
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="notif-dropdown__footer" @click.stop="viewAll">
          {{ t('admin.view_all_notifications', 'Xem tất cả thông báo') }}
        </div>

      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Bell, X,
  ShoppingCart, XCircle, RefreshCw,  // order
  Star, PackageX, Package,            // product/stock
  Settings, Key, Shield,              // tenant/security
  Clock, Puzzle,                      // subscription/module
  Info,                               // fallback
} from 'lucide-vue-next'
import { useAdminNotifications } from '../composables/useAdminNotifications.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const emit  = defineEmits(['navigate'])

const {
  notifications, unreadCount, hasUnread, badgeText,
  isConnected, isLoading,
  init, destroy,
  fetchNotifications, markAsRead, markAllRead,
  deleteNotification, clearReadNotifications,
} = useAdminNotifications()

// ─── Type → Icon / Color map ─────────────────────────────────────

const TYPE_ICON = {
  'order.placed':              ShoppingCart,
  'order.cancelled':           XCircle,
  'order.status_changed':      RefreshCw,
  'order.pending_too_long':    Clock,
  'review.submitted':          Star,
  'product.stock_low':         Package,
  'product.out_of_stock':      PackageX,
  'settings.changed':          Settings,
  'api_key.created':           Key,
  'role.permission_changed':   Shield,
  'subscription.expiring':     Clock,
  'subscription.expired':      Clock,
  'module.subscribed':         Puzzle,
  'module.unsubscribed':       Puzzle,
}

const TYPE_COLOR = {
  'order.placed':              '#10b981',
  'order.cancelled':           '#ef4444',
  'order.status_changed':      '#3b82f6',
  'order.pending_too_long':    '#f59e0b',
  'review.submitted':          '#f59e0b',
  'product.stock_low':         '#f97316',
  'product.out_of_stock':      '#ef4444',
  'settings.changed':          '#8b5cf6',
  'api_key.created':           '#ef4444',
  'role.permission_changed':   '#ef4444',
  'subscription.expiring':     '#f97316',
  'subscription.expired':      '#ef4444',
  'module.subscribed':         '#10b981',
  'module.unsubscribed':       '#6b7280',
}

function typeIcon(type)  { return TYPE_ICON[type]  || Info }
function typeColor(type) { return TYPE_COLOR[type] || 'var(--color-text-muted)' }

// ─── Filter tabs ──────────────────────────────────────────────────

const tabs = [
  { label: t('admin.msg_d8586d08', 'Tất cả'),    value: null },
  { label: t('admin.msg_adb21d16', 'Đơn hàng'),  value: 'order' },
  { label: t('admin.msg_1d1aa192', 'Sản phẩm'),  value: 'product' },
  { label: t('admin.msg_09cbc7cd', 'Hệ thống'),  value: 'system' },
]

const activeTab = ref(null)

function setTab(value) {
  activeTab.value = value
}

const filteredNotifications = computed(() => {
  if (!activeTab.value) return notifications.value
  return notifications.value.filter(n => n.type?.startsWith(activeTab.value))
})

// ─── Dropdown ─────────────────────────────────────────────────────

const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
  if (showDropdown.value) fetchNotifications()
}

// ─── Actions ──────────────────────────────────────────────────────

async function handleClick(n) {
  if (!n.is_read) await markAsRead(n.id)
  showDropdown.value = false
  if (n.link) {
    // Map backend links to admin routes
    // e.g. /orders/123 → orders/detail/123
    const link = n.link.replace(/^\//, '') // remove leading slash
    const orderMatch = link.match(/^orders\/(\d+)$/)
    if (orderMatch) {
      emit('navigate', `orders/detail/${orderMatch[1]}`)
    } else {
      emit('navigate', link)
    }
  }
}

async function handleMarkAll() {
  await markAllRead()
}

async function handleClearRead() {
  await clearReadNotifications()
}

async function handleDelete(id) {
  await deleteNotification(id)
}

function viewAll() {
  showDropdown.value = false
  emit('navigate', 'notifications')
}

// ─── Time helper ──────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return t('admin.msg_e92d1675', 'Vừa xong')
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

// ─── Lifecycle ────────────────────────────────────────────────────

onMounted(init)
onUnmounted(destroy)
</script>

<style scoped>
/* ── Bell button ─────────────────────────── */
.notif-bell {
  position: relative; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px;
  transition: background 0.2s;
}
.notif-bell:hover { background: var(--color-bg-tertiary, rgba(255,255,255,0.1)); }

.notif-bell__badge {
  position: absolute; top: 2px; right: 2px;
  min-width: 16px; height: 16px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; line-height: 1; pointer-events: none;
}

/* Real-time dot */
.notif-bell__live {
  position: absolute; bottom: 4px; right: 4px;
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981;
  box-shadow: 0 0 0 2px var(--color-bg-secondary, #1a1a2e);
  animation: pulse-live 2s infinite;
}
@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

/* ── Overlay + Dropdown ──────────────────── */
.notif-overlay { position: fixed; inset: 0; z-index: 998; }
.notif-dropdown {
  position: fixed; top: 52px; right: 16px;
  width: 380px; max-height: 520px;
  background: var(--color-bg-secondary, #1a1a2e);
  border: 1px solid var(--color-border, #2a2a4a);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.6);
  z-index: 999;
  display: flex; flex-direction: column; overflow: hidden;
}

/* ── Header ──────────────────────────────── */
.notif-dropdown__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--color-border, #2a2a4a);
}
.notif-dropdown__title {
  font-weight: 700; font-size: 14px;
  display: flex; align-items: center;
}
.notif-dropdown__count {
  margin-left: 6px;
  background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700;
  border-radius: 10px; padding: 1px 6px;
}
.notif-dropdown__actions { display: flex; gap: 8px; }
.notif-dropdown__btn {
  background: none; border: none;
  color: var(--color-accent-primary, #6366f1);
  cursor: pointer; font-size: 12px; font-weight: 600;
  padding: 2px 6px; border-radius: 4px;
  transition: background 0.15s;
}
.notif-dropdown__btn:hover { background: rgba(99,102,241,0.12); }
.notif-dropdown__btn--muted { color: var(--color-text-muted, #888); }
.notif-dropdown__btn--muted:hover { background: rgba(255,255,255,0.06); }

/* ── Filter tabs ─────────────────────────── */
.notif-dropdown__tabs {
  display: flex; gap: 4px; padding: 8px 12px;
  border-bottom: 1px solid var(--color-border, #2a2a4a);
}
.notif-dropdown__tab {
  background: none; border: none; cursor: pointer;
  font-size: 12px; padding: 4px 10px; border-radius: 20px;
  color: var(--color-text-muted, #888); transition: all 0.15s;
}
.notif-dropdown__tab:hover { background: var(--color-bg-tertiary, rgba(255,255,255,0.06)); color: var(--color-text-primary, #e2e8f0); }
.notif-dropdown__tab--active {
  background: var(--color-accent-primary, #6366f1);
  color: #fff; font-weight: 600;
}

/* ── List ────────────────────────────────── */
.notif-dropdown__list { overflow-y: auto; flex: 1; }
.notif-dropdown__empty {
  padding: 40px 16px; text-align: center;
  color: var(--color-text-muted, #888); font-size: 13px;
  display: flex; align-items: center; justify-content: center;
}
.notif-dropdown__spinner {
  width: 20px; height: 20px; border-radius: 50%;
  border: 2px solid var(--color-border, #2a2a4a);
  border-top-color: var(--color-accent-primary, #6366f1);
  animation: spin 0.7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Item ────────────────────────────────── */
.notif-item {
  display: flex; gap: 10px; padding: 11px 16px;
  cursor: pointer; position: relative;
  border-bottom: 1px solid var(--color-border, rgba(255,255,255,0.04));
  transition: background 0.15s;
}
.notif-item:hover { background: var(--color-bg-tertiary, rgba(255,255,255,0.04)); }
.notif-item--unread { background: rgba(99,102,241,0.07); }
.notif-item--unread::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--color-accent-primary, #6366f1); border-radius: 0 2px 2px 0;
}
.notif-item__icon { flex-shrink: 0; padding-top: 2px; }
.notif-item__content { flex: 1; min-width: 0; }
.notif-item__title  { font-size: 13px; font-weight: 600; line-height: 1.3; }
.notif-item__message {
  font-size: 12px; color: var(--color-text-muted, #999);
  margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.notif-item__time { font-size: 11px; color: var(--color-text-muted, #666); margin-top: 4px; }

.notif-item__delete {
  flex-shrink: 0; opacity: 0; background: none; border: none;
  color: var(--color-text-muted, #888); cursor: pointer;
  padding: 4px; border-radius: 4px; transition: all 0.15s;
  align-self: flex-start; margin-top: 2px;
}
.notif-item:hover .notif-item__delete { opacity: 1; }
.notif-item__delete:hover { background: rgba(239,68,68,0.15); color: #ef4444; }

/* ── Footer ──────────────────────────────── */
.notif-dropdown__footer {
  padding: 12px 16px; text-align: center;
  font-size: 13px; color: var(--color-accent-primary, #6366f1);
  cursor: pointer; font-weight: 600;
  border-top: 1px solid var(--color-border, #2a2a4a);
  transition: background 0.15s;
}
.notif-dropdown__footer:hover { background: rgba(99,102,241,0.08); }
</style>
