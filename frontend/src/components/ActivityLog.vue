<template>
  <div class="activity-log">
    <div class="activity-header">
      <h3><Activity :size="18" /> Lịch sử hoạt động</h3>
      <select v-model="filterAction" class="action-filter" @change="loadLogs">
        <option value="">Tất cả</option>
        <option value="session.started">Bắt đầu live</option>
        <option value="session.ended">Kết thúc live</option>
        <option value="lead.status_changed">Thay đổi lead</option>
        <option value="order.created">Tạo đơn</option>
        <option value="product.stock_deducted">Trừ kho</option>
        <option value="product.stock_low">Cảnh báo tồn kho</option>
        <option value="webhook.created">Tạo webhook</option>
        <option value="settings.updated">Cập nhật cài đặt</option>
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
          <div class="activity-detail" v-if="log.details">
            {{ formatDetails(log.action, log.details) }}
          </div>
          <div class="activity-meta">
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
  ChevronLeft, ChevronRight
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
    const res = await apiFetch(`/api/activity-logs?${params}`)
    if (res && res.data) {
      logs.value = res.data
      meta.value = res.meta || { page: 1, lastPage: 1 }
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
  'session.started': 'Bắt đầu phiên live',
  'session.ended': 'Kết thúc phiên live',
  'lead.status_changed': 'Thay đổi trạng thái lead',
  'lead.created': 'Lead mới được tạo',
  'order.created': 'Tạo đơn hàng',
  'order.updated': 'Cập nhật đơn hàng',
  'order.deleted': 'Xóa đơn hàng',
  'product.created': 'Thêm sản phẩm',
  'product.updated': 'Cập nhật sản phẩm',
  'product.stock_low': 'Cảnh báo tồn kho thấp',
  'product.stock_deducted': 'Trừ tồn kho',
  'webhook.created': 'Tạo webhook mới',
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
  return ''
}

const iconMap = {
  'session.started': Radio,
  'session.ended': Power,
  'lead.status_changed': UserCheck,
  'lead.created': UserCheck,
  'order.created': ShoppingCart,
  'order.updated': ShoppingCart,
  'product.stock_deducted': Package,
  'product.stock_low': Package,
  'webhook.created': Webhook,
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

.icon-session { background: rgba(124, 58, 237, 0.12); color: #a78bfa; }
.icon-lead { background: var(--color-success-glow); color: var(--color-success); }
.icon-order { background: var(--color-accent-warm-glow); color: var(--color-accent-warm); }
.icon-product { background: rgba(155, 89, 182, 0.12); color: #c084fc; }
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
