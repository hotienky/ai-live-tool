<template>
  <div class="activity-log">
    <div class="activity-header">
      <h3><Activity :size="18" /> {{ t('admin.msg_de1bcbd4', 'Lịch sử hoạt động') }}</h3>
      <select v-model="filterAction" class="action-filter" @change="loadLogs">
        <option value="">{{ t('admin.all', 'Tất cả') }}</option>
        <option value="user.login">{{ t('admin.login', 'Đăng nhập') }}</option>
        <option value="order.created">{{ t('admin.msg_23275279', 'Tạo đơn') }}</option>
        <option value="order.updated">{{ t('admin.msg_c7488e1d', 'Cập nhật đơn') }}</option>
        <option value="order.deleted">{{ t('admin.msg_c885393e', 'Xóa đơn') }}</option>
        <option value="product.created">{{ t('admin.msg_98b9f1c4', 'Thêm sản phẩm') }}</option>
        <option value="product.updated">{{ t('admin.msg_22dbba18', 'Cập nhật sản phẩm') }}</option>
        <option value="product.deleted">{{ t('admin.msg_333c41f7', 'Xóa sản phẩm') }}</option>
        <option value="user.created">{{ t('admin.msg_9ff8c321', 'Tạo người dùng') }}</option>
        <option value="user.updated">{{ t('admin.msg_d948cb9a', 'Cập nhật người dùng') }}</option>
        <option value="user.deleted">{{ t('admin.msg_44226bec', 'Xóa người dùng') }}</option>
        <option value="cms.created">{{ t('admin.msg_e9aa668a', 'Tạo trang CMS') }}</option>
        <option value="cms.published">{{ t('admin.msg_9068c2a8', 'Xuất bản trang') }}</option>
        <option value="category.created">{{ t('admin.msg_1189ffef', 'Tạo danh mục') }}</option>
        <option value="banner.created">{{ t('admin.msg_250d7787', 'Tạo banner') }}</option>
        <option value="settings.updated">{{ t('admin.msg_6ca806c4', 'Cập nhật cài đặt') }}</option>
        <option value="tax_config.updated">{{ t('admin.msg_c94aa630', 'Cập nhật thuế') }}</option>
        <option value="tax_rate.created">{{ t('admin.msg_d7dd5cff', 'Tạo thuế suất') }}</option>
        <option value="theme.updated">{{ t('admin.msg_b6063d1a', 'Cập nhật giao diện') }}</option>
        <option value="shipping.updated">{{ t('admin.msg_e22f8157', 'Cập nhật vận chuyển') }}</option>
        <option value="payment.updated">{{ t('admin.msg_67f8347a', 'Cập nhật thanh toán') }}</option>
        <option value="promotion.created">{{ t('admin.msg_415f576e', 'Tạo khuyến mãi') }}</option>
        <option value="role.created">{{ t('admin.msg_2e3dea54', 'Tạo vai trò') }}</option>
        <option value="webhook.created">{{ t('admin.msg_2eb246b9', 'Tạo webhook') }}</option>
      </select>
    </div>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="24" class="spin" /> Đang tải...
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <ClipboardList :size="40" />
      <p>{{ t('admin.msg_70af3bd1', 'Chưa có hoạt động nào') }}</p>
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
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import {
  Activity, Clock, Loader2, ClipboardList,
  Radio, Power, UserCheck, ShoppingCart, Package, Webhook, Settings,
  ChevronLeft, ChevronRight,
  LogIn, UserPlus, UserMinus, FileText, Image, FolderTree, Shield
} from 'lucide-vue-next'

const { t } = useI18n()

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
  'user.login': t('admin.msg_26d81d9f', 'Đăng nhập hệ thống'),
  'session.started': t('admin.msg_468bd2ff', 'Bắt đầu phiên live'),
  'session.ended': t('admin.msg_ca7a354a', 'Kết thúc phiên live'),
  'lead.status_changed': t('admin.msg_264916e4', 'Thay đổi trạng thái lead'),
  'lead.created': t('admin.msg_9fa644f5', 'Lead mới được tạo'),
  'order.created': t('admin.msg_095823c8', 'Tạo đơn hàng'),
  'order.updated': t('admin.msg_272e8fcc', 'Cập nhật đơn hàng'),
  'order.deleted': t('admin.msg_c5fa8426', 'Xóa đơn hàng'),
  'product.created': t('admin.msg_98b9f1c4', 'Thêm sản phẩm'),
  'product.updated': t('admin.msg_22dbba18', 'Cập nhật sản phẩm'),
  'product.deleted': t('admin.msg_333c41f7', 'Xóa sản phẩm'),
  'product.stock_low': t('admin.msg_d3a5d6d7', 'Cảnh báo tồn kho thấp'),
  'product.stock_deducted': t('admin.msg_c467ad17', 'Trừ tồn kho'),
  'user.created': t('admin.msg_d7845035', 'Tạo người dùng mới'),
  'user.updated': t('admin.msg_d948cb9a', 'Cập nhật người dùng'),
  'user.deleted': t('admin.msg_44226bec', 'Xóa người dùng'),
  'cms.created': t('admin.msg_e9aa668a', 'Tạo trang CMS'),
  'cms.updated': t('admin.msg_a1e80365', 'Cập nhật trang CMS'),
  'cms.deleted': t('admin.msg_6de04e5d', 'Xóa trang CMS'),
  'cms.published': t('admin.msg_32bbff5f', 'Xuất bản trang CMS'),
  'banner.created': t('admin.msg_250d7787', 'Tạo banner'),
  'banner.updated': t('admin.msg_acc86fd7', 'Cập nhật banner'),
  'banner.deleted': t('admin.msg_571815d6', 'Xóa banner'),
  'category.created': t('admin.msg_1189ffef', 'Tạo danh mục'),
  'category.updated': t('admin.msg_2c994a20', 'Cập nhật danh mục'),
  'category.deleted': t('admin.msg_5f94897a', 'Xóa danh mục'),
  'role.created': t('admin.msg_2e3dea54', 'Tạo vai trò'),
  'role.updated': t('admin.msg_2bba1eec', 'Cập nhật vai trò'),
  'role.deleted': t('admin.msg_eab5cdd9', 'Xóa vai trò'),
  'webhook.created': t('admin.msg_92be85fc', 'Tạo webhook mới'),
  'webhook.updated': t('admin.msg_f571ba8d', 'Cập nhật webhook'),
  'webhook.deleted': t('admin.msg_efe92fcd', 'Xóa webhook'),
  'settings.updated': t('admin.msg_6ca806c4', 'Cập nhật cài đặt'),
  'tax_config.updated': t('admin.msg_d66363d9', 'Cập nhật cấu hình thuế'),
  'tax_rate.created': t('admin.msg_defcd171', 'Tạo thuế suất mới'),
  'tax_rate.updated': t('admin.msg_09e3db37', 'Cập nhật thuế suất'),
  'tax_rate.deleted': t('admin.msg_8e3edfd7', 'Xóa thuế suất'),
  'theme.updated': t('admin.msg_b6063d1a', 'Cập nhật giao diện'),
  'layout.updated': t('admin.msg_333b3000', 'Cập nhật bố cục'),
  'layout.published': t('admin.msg_db1ee5e4', 'Xuất bản bố cục'),
  'nav_link.created': t('admin.msg_0f1731c6', 'Tạo liên kết menu'),
  'nav_link.updated': t('admin.msg_bc8d8259', 'Cập nhật liên kết menu'),
  'nav_link.deleted': t('admin.msg_6336cd05', 'Xóa liên kết menu'),
  'shipping.updated': t('admin.msg_e22f8157', 'Cập nhật vận chuyển'),
  'payment.updated': t('admin.msg_67f8347a', 'Cập nhật thanh toán'),
  'promotion.created': t('admin.msg_415f576e', 'Tạo khuyến mãi'),
  'promotion.updated': t('admin.msg_72174316', 'Cập nhật khuyến mãi'),
  'promotion.deleted': t('admin.msg_84c6487c', 'Xóa khuyến mãi'),
  'flash_sale.created': t('admin.msg_9d9407dd', 'Tạo Flash Sale'),
  'flash_sale.updated': t('admin.msg_802aa97c', 'Cập nhật Flash Sale'),
  'flash_sale.deleted': t('admin.msg_5c755c32', 'Xóa Flash Sale'),
  'coupon.created': t('admin.msg_835ac40c', 'Tạo mã giảm giá'),
  'coupon.used': t('admin.msg_86a8f384', 'Sử dụng mã giảm giá'),
  'store_info.updated': t('admin.msg_098c4d37', 'Cập nhật thông tin cửa hàng'),
  'system_config.updated': t('admin.msg_486d98f8', 'Cập nhật cấu hình hệ thống'),
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
  if (action === 'tax_config.updated') return details.tax_enabled !== undefined ? `Thuế: ${details.tax_enabled ? 'Bật' : 'Tắt'}` : 'Cập nhật cấu hình thuế'
  if (action === 'tax_rate.created' || action === 'tax_rate.updated') return details.rate ? `${details.name || t('admin.msg_500aedd2', 'Thuế')}: ${details.rate}%` : (details.name || '')
  if (action === 'theme.updated') return details.preset || details.accent || ''
  if (action === 'layout.updated' || action === 'layout.published') return details.page || ''
  if (details.name) return details.name
  if (details.title) return details.title
  if (details.email) return details.email
  if (details.order_number) return `#${details.order_number}`
  if (details.group) return `Nhóm: ${details.group}`
  if (details.rate) return `${details.rate}%`
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
  'tax_config.updated': Settings,
  'tax_rate.created': Settings,
  'tax_rate.updated': Settings,
  'tax_rate.deleted': Settings,
  'theme.updated': Settings,
  'layout.updated': Settings,
  'layout.published': Settings,
  'nav_link.created': Settings,
  'nav_link.updated': Settings,
  'nav_link.deleted': Settings,
  'shipping.updated': Package,
  'payment.updated': ShoppingCart,
  'promotion.created': ShoppingCart,
  'promotion.updated': ShoppingCart,
  'flash_sale.created': ShoppingCart,
  'store_info.updated': Settings,
  'system_config.updated': Settings,
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
  if (action.startsWith('settings.') || action.startsWith('tax') || action.startsWith('theme') || action.startsWith('layout') || action.startsWith('nav_link') || action.startsWith('shipping') || action.startsWith('payment') || action.startsWith('store_info') || action.startsWith('system_config')) return 'icon-settings'
  if (action.startsWith('promotion') || action.startsWith('flash_sale') || action.startsWith('coupon')) return 'icon-order'
  return 'icon-default'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return t('admin.msg_e92d1675', 'Vừa xong')
  if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => loadLogs())
</script>

<style scoped>
.activity-log {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
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
  flex: 1;
  min-height: 0;
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
