<template>
  <div class="notif-page">

    <!-- Header -->
    <div class="notif-page__header">
      <button class="notif-page__back" @click="emit('navigate', backView)">
        <ArrowLeft :size="16" />
        <span>{{ t('admin.back', 'Quay lại') }}</span>
      </button>
      <h2 class="notif-page__title">
        <Bell :size="18" style="vertical-align:middle;margin-right:8px" />
        {{ t('admin.all_notifications', 'Tất cả thông báo') }}
        <span v-if="unreadCount > 0" class="notif-page__unread-badge">{{ unreadCount }} chưa đọc</span>
      </h2>
      <div class="notif-page__header-actions">
        <button v-if="unreadCount > 0" class="notif-page__action-btn" @click="handleMarkAll">
          {{ t('admin.mark_all_read', 'Đọc tất cả') }}
        </button>
        <button
          v-if="items.some(n => n.is_read)"
          class="notif-page__action-btn notif-page__action-btn--muted"
          @click="handleClearRead"
        >
          {{ t('admin.clear_read', 'Xóa đã đọc') }}
        </button>
      </div>
    </div>

    <!-- Filter tabs -->
    <div class="notif-page__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.value ?? 'all'"
        class="notif-page__tab"
        :class="{ 'notif-page__tab--active': activeTab === tab.value }"
        @click="setTab(tab.value)"
      >
        {{ tab.label }}
        <span v-if="tab.value === null && unreadCount > 0" class="notif-page__tab-count">{{ unreadCount }}</span>
      </button>
    </div>

    <!-- Content -->
    <div class="notif-page__content">

      <!-- Initial loading -->
      <div v-if="isPageLoading && items.length === 0" class="notif-page__empty">
        <span class="notif-page__spinner" />
        <span>Đang tải...</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="items.length === 0" class="notif-page__empty">
        <BellOff :size="40" class="notif-page__empty-icon" />
        <p>{{ t('admin.no_notifications', 'Không có thông báo nào') }}</p>
      </div>

      <!-- Notification list -->
      <div v-else class="notif-page__list">
        <div
          v-for="n in items"
          :key="n.id"
          class="notif-item"
          :class="{ 'notif-item--unread': !n.is_read }"
          @click="handleClick(n)"
        >
          <div class="notif-item__icon">
            <component :is="typeIcon(n.type)" :size="20" :style="{ color: typeColor(n.type) }" />
          </div>
          <div class="notif-item__body">
            <div class="notif-item__title">{{ n.title }}</div>
            <div v-if="n.message" class="notif-item__message">{{ n.message }}</div>
            <div class="notif-item__meta">
              <span class="notif-item__time">{{ timeAgo(n.created_at) }}</span>
              <span v-if="!n.is_read" class="notif-item__dot" />
            </div>
          </div>
          <button
            class="notif-item__delete"
            @click.stop="handleDelete(n.id)"
            :title="t('admin.delete', 'Xóa')"
          >
            <X :size="13" />
          </button>
        </div>

        <!-- Load more -->
        <div v-if="hasMore" class="notif-page__loadmore">
          <button class="notif-page__loadmore-btn" @click="loadMore" :disabled="isPageLoading">
            <span v-if="isPageLoading" class="notif-page__spinner notif-page__spinner--sm" />
            <span v-else>{{ t('admin.load_more', 'Tải thêm') }} ({{ totalItems - items.length }} còn lại)</span>
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Bell, BellOff, ArrowLeft, X,
  ShoppingCart, XCircle, RefreshCw,
  Star, PackageX, Package,
  Settings, Key, Shield,
  Clock, Puzzle,
  Info,
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useAdminNotifications } from '../composables/useAdminNotifications.js'
import { useI18n } from '../composables/useI18n.js'

// ─── Props / Emits ────────────────────────────────────────────────

const props = defineProps({
  /** View to navigate back to */
  backView: { type: String, default: 'dashboard' },
})
const emit = defineEmits(['navigate'])

// ─── Shared state (unread count, mark-read, clear-read) ──────────

const { t } = useI18n()
const { unreadCount, markAllRead, clearReadNotifications, deleteNotification } = useAdminNotifications()

// ─── Local page state ─────────────────────────────────────────────

const items        = ref([])
const isPageLoading = ref(false)
const currentPage  = ref(1)
const totalItems   = ref(0)
const perPage      = 30
const activeTab    = ref(null)

const hasMore = computed(() => items.value.length < totalItems.value)

// ─── Filter tabs ──────────────────────────────────────────────────

const tabs = [
  { label: 'Tất cả',    value: null },
  { label: 'Đơn hàng',  value: 'order' },
  { label: 'Sản phẩm',  value: 'product' },
  { label: 'Hệ thống',  value: 'system' },
]

// ─── Type → Icon / Color ──────────────────────────────────────────

const TYPE_ICON = {
  'order.placed':             ShoppingCart,
  'order.cancelled':          XCircle,
  'order.status_changed':     RefreshCw,
  'order.pending_too_long':   Clock,
  'review.submitted':         Star,
  'product.stock_low':        Package,
  'product.out_of_stock':     PackageX,
  'settings.changed':         Settings,
  'api_key.created':          Key,
  'role.permission_changed':  Shield,
  'subscription.expiring':    Clock,
  'subscription.expired':     Clock,
  'module.subscribed':        Puzzle,
  'module.unsubscribed':      Puzzle,
}

const TYPE_COLOR = {
  'order.placed':             '#10b981',
  'order.cancelled':          '#ef4444',
  'order.status_changed':     '#3b82f6',
  'order.pending_too_long':   '#f59e0b',
  'review.submitted':         '#f59e0b',
  'product.stock_low':        '#f97316',
  'product.out_of_stock':     '#ef4444',
  'settings.changed':         '#8b5cf6',
  'api_key.created':          '#ef4444',
  'role.permission_changed':  '#ef4444',
  'subscription.expiring':    '#f97316',
  'subscription.expired':     '#ef4444',
  'module.subscribed':        '#10b981',
  'module.unsubscribed':      '#6b7280',
}

function typeIcon(type)  { return TYPE_ICON[type]  || Info }
function typeColor(type) { return TYPE_COLOR[type] || 'var(--color-text-muted)' }

// ─── Fetch (separate from dropdown state) ────────────────────────

async function fetchPage(page = 1, type = null, append = false) {
  isPageLoading.value = true
  try {
    let qs = `?page=${page}&per_page=${perPage}`
    if (type) qs += `&type=${type}`
    const res  = await apiFetch(`/notifications${qs}`)
    const data = await res.json()

    const list  = Array.isArray(data) ? data : (data?.data ?? [])
    const total = data?.meta?.total ?? data?.total ?? list.length

    if (append) {
      items.value.push(...list)
    } else {
      items.value = list
    }
    totalItems.value = total
    currentPage.value = page
  } catch { /* silent */ }
  finally { isPageLoading.value = false }
}

function setTab(value) {
  activeTab.value = value
  fetchPage(1, value, false)
}

async function loadMore() {
  await fetchPage(currentPage.value + 1, activeTab.value, true)
}

// ─── Actions ──────────────────────────────────────────────────────

async function handleClick(n) {
  if (!n.is_read) {
    try {
      await apiFetch(`/notifications/${n.id}/read`, { method: 'PUT' })
      n.is_read = true
      n.read_at = new Date().toISOString()
    } catch { /* silent */ }
  }
  if (n.link) emit('navigate', n.link)
}

async function handleMarkAll() {
  await markAllRead()
  items.value.forEach(n => { n.is_read = true; n.read_at = new Date().toISOString() })
}

async function handleClearRead() {
  await clearReadNotifications()
  items.value = items.value.filter(n => !n.is_read)
  totalItems.value = items.value.length
}

async function handleDelete(id) {
  await deleteNotification(id)
  items.value = items.value.filter(n => n.id !== id)
  totalItems.value = Math.max(0, totalItems.value - 1)
}

// ─── Time helper ──────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'Vừa xong'
  if (diff < 3600)  return `${Math.floor(diff / 60)} phút trước`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`
  return `${Math.floor(diff / 86400)} ngày trước`
}

// ─── Lifecycle ────────────────────────────────────────────────────

onMounted(() => fetchPage(1))
</script>

<style scoped>
/* ── Page layout ─────────────────────────── */
.notif-page {
  display: flex; flex-direction: column;
  min-height: 100vh;
  background: var(--color-bg-primary, #0f0f23);
  color: var(--color-text-primary, #e2e8f0);
}

/* ── Header ──────────────────────────────── */
.notif-page__header {
  display: flex; align-items: center; gap: 16px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--color-border, #2a2a4a);
  background: var(--color-bg-secondary, #1a1a2e);
  flex-wrap: wrap;
}

.notif-page__back {
  display: flex; align-items: center; gap: 6px;
  background: none; border: 1px solid var(--color-border, #2a2a4a);
  color: var(--color-text-muted, #888); cursor: pointer;
  padding: 6px 12px; border-radius: 8px; font-size: 13px;
  transition: all 0.15s; flex-shrink: 0;
}
.notif-page__back:hover {
  border-color: var(--color-accent-primary, #6366f1);
  color: var(--color-accent-primary, #6366f1);
}

.notif-page__title {
  flex: 1; margin: 0;
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
}

.notif-page__unread-badge {
  font-size: 12px; font-weight: 600;
  background: rgba(99,102,241,0.18); color: var(--color-accent-primary, #6366f1);
  padding: 2px 10px; border-radius: 20px; margin-left: 4px;
}

.notif-page__header-actions { display: flex; gap: 8px; flex-shrink: 0; }

.notif-page__action-btn {
  background: none; border: 1px solid var(--color-accent-primary, #6366f1);
  color: var(--color-accent-primary, #6366f1); cursor: pointer;
  padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
  transition: all 0.15s;
}
.notif-page__action-btn:hover { background: rgba(99,102,241,0.12); }
.notif-page__action-btn--muted {
  border-color: var(--color-border, #2a2a4a);
  color: var(--color-text-muted, #888);
}
.notif-page__action-btn--muted:hover { background: rgba(255,255,255,0.05); color: var(--color-text-primary, #e2e8f0); }

/* ── Filter tabs ─────────────────────────── */
.notif-page__tabs {
  display: flex; gap: 4px; padding: 12px 24px;
  background: var(--color-bg-secondary, #1a1a2e);
  border-bottom: 1px solid var(--color-border, #2a2a4a);
}

.notif-page__tab {
  display: flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; padding: 6px 16px; border-radius: 20px;
  color: var(--color-text-muted, #888); transition: all 0.15s;
}
.notif-page__tab:hover {
  background: var(--color-bg-tertiary, rgba(255,255,255,0.06));
  color: var(--color-text-primary, #e2e8f0);
}
.notif-page__tab--active {
  background: var(--color-accent-primary, #6366f1);
  color: #fff; font-weight: 600;
}
.notif-page__tab-count {
  background: #ef4444; color: #fff;
  font-size: 11px; font-weight: 700;
  border-radius: 10px; padding: 1px 6px; line-height: 1;
}

/* ── Content ─────────────────────────────── */
.notif-page__content {
  flex: 1; overflow-y: auto;
  padding: 16px 24px 40px;
}

/* ── Empty / Loading ─────────────────────── */
.notif-page__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; padding: 80px 16px;
  color: var(--color-text-muted, #888); font-size: 14px;
}
.notif-page__empty-icon { opacity: 0.25; }

/* ── Spinner ─────────────────────────────── */
.notif-page__spinner {
  display: inline-block; width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid var(--color-border, #2a2a4a);
  border-top-color: var(--color-accent-primary, #6366f1);
  animation: spin 0.7s linear infinite;
}
.notif-page__spinner--sm { width: 14px; height: 14px; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── List ────────────────────────────────── */
.notif-page__list {
  max-width: 720px; margin: 0 auto;
}

/* ── Item ────────────────────────────────── */
.notif-item {
  display: flex; gap: 14px; padding: 14px 16px;
  cursor: pointer; position: relative;
  border: 1px solid var(--color-border, rgba(255,255,255,0.06));
  border-radius: 10px; margin-bottom: 8px;
  background: var(--color-bg-secondary, #1a1a2e);
  transition: all 0.15s;
}
.notif-item:hover {
  background: var(--color-bg-tertiary, rgba(255,255,255,0.04));
  border-color: var(--color-accent-primary, rgba(99,102,241,0.3));
}
.notif-item--unread {
  background: rgba(99,102,241,0.07);
  border-color: rgba(99,102,241,0.2);
}
.notif-item--unread::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0;
  width: 3px; background: var(--color-accent-primary, #6366f1);
  border-radius: 10px 0 0 10px;
}

.notif-item__icon { flex-shrink: 0; padding-top: 2px; }
.notif-item__body { flex: 1; min-width: 0; }
.notif-item__title { font-size: 14px; font-weight: 600; line-height: 1.4; }
.notif-item__message {
  font-size: 13px; color: var(--color-text-muted, #999);
  margin-top: 3px; line-height: 1.4;
}
.notif-item__meta {
  display: flex; align-items: center; gap: 8px; margin-top: 6px;
}
.notif-item__time { font-size: 12px; color: var(--color-text-muted, #666); }
.notif-item__dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-accent-primary, #6366f1); flex-shrink: 0;
}

.notif-item__delete {
  flex-shrink: 0; opacity: 0; background: none; border: none;
  color: var(--color-text-muted, #888); cursor: pointer;
  padding: 6px; border-radius: 6px; transition: all 0.15s;
  align-self: flex-start;
}
.notif-item:hover .notif-item__delete { opacity: 1; }
.notif-item__delete:hover { background: rgba(239,68,68,0.15); color: #ef4444; }

/* ── Load more ───────────────────────────── */
.notif-page__loadmore {
  text-align: center; padding: 24px 0 8px;
}
.notif-page__loadmore-btn {
  display: inline-flex; align-items: center; gap: 8px;
  background: none; border: 1px solid var(--color-border, #2a2a4a);
  color: var(--color-text-muted, #888); cursor: pointer;
  padding: 8px 24px; border-radius: 8px; font-size: 13px;
  transition: all 0.15s;
}
.notif-page__loadmore-btn:hover:not(:disabled) {
  border-color: var(--color-accent-primary, #6366f1);
  color: var(--color-accent-primary, #6366f1);
}
.notif-page__loadmore-btn:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
