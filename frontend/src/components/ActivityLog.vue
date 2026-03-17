<template>
  <div class="activity-log">
    <div class="activity-header">
      <h3><Activity :size="18" /> Lịch sử hoạt động</h3>
      <select v-model="filterAction" class="action-filter" @change="loadLogs">
        <option value="">Tất cả</option>
        <option value="user.login">Đăng nhập</option>
        <option value="order.created">Tạo đơn</option>
        <option value="order.updated">Cập nhật đơn</option>
        <option value="order.deleted">Xóa đơn</option>
        <option value="product.created">Thêm sản phẩm</option>
        <option value="product.updated">Cập nhật sản phẩm</option>
        <option value="product.deleted">Xóa sản phẩm</option>
        <option value="user.created">Tạo người dùng</option>
        <option value="user.updated">Cập nhật người dùng</option>
        <option value="user.deleted">Xóa người dùng</option>
        <option value="cms.created">Tạo trang CMS</option>
        <option value="cms.published">Xuất bản trang</option>
        <option value="category.created">Tạo danh mục</option>
        <option value="banner.created">Tạo banner</option>
        <option value="settings.updated">Cập nhật cài đặt</option>
        <option value="role.created">Tạo vai trò</option>
        <option value="webhook.created">Tạo webhook</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="24" class="spin" /> Đang tải...
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <ClipboardList :size="40" />
      <p>Chưa có hoạt động nào</p>
    </div>

    <div v-else class="activity-timeline">
      <div v-for="log in logs" :key="log.id" class="activity-item">
        <div class="activity-icon" :class="getIconClass(log.action)">
          <component :is="getIcon(log.action)" :size="14" />
        </div>
        <div class="activity-content">
          <div class="activity-text">{{ formatAction(log.action) }}</div>
          <div class="activity-detail" v-if="log.details || log.data">
            {{ formatDetails(log.action, log.details || log.data) }}
          </div>
          <div class="activity-meta">
            <span v-if="log.user_name" class="activity-user">{{ log.user_name }}</span>
            <Clock :size="12" />
            {{ formatTime(log.createdAt || log.created_at) }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="meta.lastPage > 1" class="pagination">
      <button :disabled="meta.page <= 1" @click="changePage(meta.page - 1)">
        <ChevronLeft :size="14" />
      </button>
      <span>{{ meta.page }} / {{ meta.lastPage }}</span>
      <button :disabled="meta.page >= meta.lastPage" @click="changePage(meta.page + 1)">
        <ChevronRight :size="14" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import {
  Activity, Clock, Loader2, ClipboardList,
  Radio, Power, UserCheck, ShoppingCart, Package, Webhook, Settings,
  ChevronLeft, ChevronRight,
  LogIn, UserPlus, UserMinus, FileText, Image, FolderTree, Shield
} from 'lucide-vue-next'

const props = defineProps({
  /* tenant-scoped */
})

const logs = ref([])
const loading = ref(false)
const filterAction = ref('')
const meta = ref({ page: 1, lastPage: 1, total: 0 })

async function loadLogs(page = 1) {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page), limit: '30' })
    if (filterAction.value) params.set('action', filterAction.value)
    const res = await apiFetch(`/activity-logs?${params}`)
    const json = await res.json()
    if (json) {
      // json is auto-unwrapped: { data: [...], meta: {...} }
      if (json.data && Array.isArray(json.data)) {
        logs.value = json.data
        meta.value = json.meta || { page: 1, lastPage: 1 }
      } else if (Array.isArray(json)) {
        logs.value = json
        meta.value = { page: 1, lastPage: 1 }
      }
    }
  } catch (e) {
    console.error('Activity log error:', e)
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  loadLogs(page)
}

const actionLabels = {
  'user.login': 'Đăng nhập hệ thống',
  'session.started': 'Bắt đầu phiên live',
  'session.ended': 'Kết thúc phiên live',
  'lead.status_changed': 'Thay đổi trạng thái lead',
  'lead.created': 'Lead mới được tạo',
  'order.created': 'Tạo đơn hàng',
  'order.updated': 'Cập nhật đơn hàng',
  'order.deleted': 'Xóa đơn hàng',
  'product.created': 'Thêm sản phẩm',
  'product.updated': 'Cập nhật sản phẩm',
  'product.deleted': 'Xóa sản phẩm',
  'product.stock_low': 'Cảnh báo tồn kho thấp',
  'product.stock_deducted': 'Trừ tồn kho',
  'user.created': 'Tạo người dùng mới',
  'user.updated': 'Cập nhật người dùng',
  'user.deleted': 'Xóa người dùng',
  'cms.created': 'Tạo trang CMS',
  'cms.updated': 'Cập nhật trang CMS',
  'cms.deleted': 'Xóa trang CMS',
  'cms.published': 'Xuất bản trang CMS',
  'banner.created': 'Tạo banner',
  'banner.updated': 'Cập nhật banner',
  'banner.deleted': 'Xóa banner',
  'category.created': 'Tạo danh mục',
  'category.updated': 'Cập nhật danh mục',
  'category.deleted': 'Xóa danh mục',
  'role.created': 'Tạo vai trò',
  'role.updated': 'Cập nhật vai trò',
  'role.deleted': 'Xóa vai trò',
  'webhook.created': 'Tạo webhook mới',
  'webhook.updated': 'Cập nhật webhook',
  'webhook.deleted': 'Xóa webhook',
  'settings.updated': 'Cập nhật cài đặt',
}

function formatAction(action) {
  return actionLabels[action] || action
}

function formatDetails(action, details) {
  if (typeof details === 'string') {
    try { details = JSON.parse(details) } catch { return '' }
  }
  if (!details) return ''
  if (action === 'product.stock_deducted') return `Số lượng: ${details.quantity}, Còn lại: ${details.remaining}`
  if (action === 'session.ended') return `Comments: ${details.totalComments}, Hot: ${details.hotLeads}`
  if (action === 'lead.status_changed') return `${details.from} → ${details.to}`
  if (details.name) return details.name
  if (details.title) return details.title
  if (details.email) return details.email
  if (details.order_number) return `#${details.order_number}`
  if (details.group) return `Nhóm: ${details.group}`
  return ''
}

const iconMap = {
  'user.login': LogIn,
  'session.started': Radio,
  'session.ended': Power,
  'lead.status_changed': UserCheck,
  'lead.created': UserCheck,
  'order.created': ShoppingCart,
  'order.updated': ShoppingCart,
  'order.deleted': ShoppingCart,
  'product.created': Package,
  'product.updated': Package,
  'product.deleted': Package,
  'product.stock_deducted': Package,
  'product.stock_low': Package,
  'user.created': UserPlus,
  'user.updated': UserCheck,
  'user.deleted': UserMinus,
  'cms.created': FileText,
  'cms.updated': FileText,
  'cms.deleted': FileText,
  'cms.published': FileText,
  'banner.created': Image,
  'banner.updated': Image,
  'banner.deleted': Image,
  'category.created': FolderTree,
  'category.updated': FolderTree,
  'category.deleted': FolderTree,
  'role.created': Shield,
  'role.updated': Shield,
  'role.deleted': Shield,
  'webhook.created': Webhook,
  'webhook.updated': Webhook,
  'webhook.deleted': Webhook,
  'settings.updated': Settings,
}

function getIcon(action) {
  return iconMap[action] || Activity
}

function getIconClass(action) {
  if (action.startsWith('session.')) return 'icon-session'
  if (action.startsWith('lead.')) return 'icon-lead'
  if (action.startsWith('order.')) return 'icon-order'
  if (action.startsWith('product.')) return 'icon-product'
  if (action.startsWith('user.')) return 'icon-user'
  if (action.startsWith('cms.')) return 'icon-cms'
  if (action.startsWith('banner.')) return 'icon-banner'
  if (action.startsWith('category.')) return 'icon-category'
  if (action.startsWith('role.')) return 'icon-role'
  if (action.startsWith('webhook.')) return 'icon-webhook'
  if (action.startsWith('settings.')) return 'icon-settings'
  return 'icon-default'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return 'Vừa xong'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => loadLogs())
</script>

<style scoped>
.activity-log {
  padding: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.activity-header h3 {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  margin: 0;
  color: var(--color-text-primary);
}

.action-filter {
  background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 8px);
  color: var(--color-text-primary);
  padding: 7px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.action-filter:hover {
  border-color: var(--color-border-hover);
}

.action-filter option {
  background: var(--color-bg-card-solid);
  color: var(--color-text-primary);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 40px 20px;
  color: var(--color-text-muted);
}

.empty-state p { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 420px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: var(--radius-sm, 8px);
  transition: background 0.15s;
}

.activity-item:hover {
  background: var(--color-bg-card);
}

.activity-icon {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-sm, 8px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.icon-session { background: var(--color-accent-glow); color: var(--accent-light); }
.icon-lead { background: var(--color-success-glow); color: var(--color-success); }
.icon-order { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.icon-product { background: rgba(155, 89, 182, 0.12); color: #c084fc; }
.icon-user { background: rgba(59, 130, 246, 0.12); color: #60a5fa; }
.icon-cms { background: rgba(16, 185, 129, 0.12); color: #34d399; }
.icon-banner { background: rgba(245, 158, 11, 0.12); color: #fbbf24; }
.icon-category { background: rgba(99, 102, 241, 0.12); color: #818cf8; }
.icon-role { background: rgba(236, 72, 153, 0.12); color: #f472b6; }
.icon-webhook { background: rgba(20, 184, 166, 0.12); color: #2dd4bf; }
.icon-settings { background: rgba(107, 114, 128, 0.12); color: #9ca3af; }
.icon-default { background: rgba(107, 114, 128, 0.12); color: var(--color-accent-cold); }

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.activity-detail {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-top: 2px;
}

.activity-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
}

.activity-user {
  font-weight: 600;
  color: var(--color-text-secondary);
  margin-right: 6px;
  padding: 1px 6px;
  background: rgba(107, 114, 128, 0.08);
  border-radius: 4px;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.pagination button {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-sm, 8px);
  color: var(--color-text-primary);
  padding: 6px 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: all 0.15s;
}

.pagination button:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-card-hover);
}

.pagination button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}
</style>
