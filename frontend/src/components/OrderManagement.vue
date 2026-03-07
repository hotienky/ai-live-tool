<template>
  <div class="order-management">
    <div class="om-header">
      <h2><Package :size="20" style="vertical-align:middle" /> Quản Lý Đơn Hàng</h2>
      <div class="header-actions">
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả</option>
          <option value="pending">Chờ xác nhận</option>
          <option value="confirmed">Đã xác nhận</option>
          <option value="shipping">Đang giao</option>
          <option value="delivered">Đã giao</option>
          <option value="cancelled">Đã hủy</option>
        </select>
        <button class="btn-add" @click="showCreateModal = true">+ Tạo đơn</button>
      </div>
    </div>

    <!-- Revenue Stats -->
    <div class="revenue-stats">
      <div class="stat-card">
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-label">Tổng đơn</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
        <div class="stat-label">Doanh thu</div>
      </div>
      <div class="stat-card paid">
        <div class="stat-value">{{ formatCurrency(stats.paidRevenue) }}</div>
        <div class="stat-label">Đã thanh toán</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.conversionRate }}%</div>
        <div class="stat-label">Tỷ lệ giao</div>
      </div>
    </div>

    <!-- Orders List -->
    <div class="orders-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Khách hàng</th>
            <th>SĐT</th>
            <th>Tổng tiền</th>
            <th>Thanh toán</th>
            <th>Trạng thái</th>
            <th>Ngày tạo</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id" @click="selectedOrder = order">
            <td>{{ order.id }}</td>
            <td>{{ order.customerName || '—' }}</td>
            <td>{{ order.customerPhone || '—' }}</td>
            <td class="amount">{{ formatCurrency(order.totalAmount) }}</td>
            <td>
              <span class="payment-badge" :class="order.paymentStatus">
                {{ paymentLabels[order.paymentStatus] || order.paymentStatus }}
              </span>
            </td>
            <td>
              <span class="status-badge" :class="order.status">
                {{ statusLabels[order.status] || order.status }}
              </span>
            </td>
            <td>{{ formatDate(order.createdAt) }}</td>
            <td>
              <div class="action-btns">
                <button v-if="order.status === 'pending'" @click.stop="updateStatus(order, 'confirmed')" title="Xác nhận"><CheckCircle :size="15" /></button>
                <button v-if="order.status === 'confirmed'" @click.stop="updateStatus(order, 'shipping')" title="Giao hàng"><Truck :size="15" /></button>
                <button v-if="order.status === 'shipping'" @click.stop="updateStatus(order, 'delivered')" title="Đã giao"><Package :size="15" /></button>
                <button v-if="order.status !== 'cancelled' && order.status !== 'delivered'" @click.stop="updateStatus(order, 'cancelled')" title="Hủy"><XCircle :size="15" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="8" class="empty">Chưa có đơn hàng</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Order Modal -->
    <div class="modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
      <div class="modal">
        <h3><FileEdit :size="16" style="vertical-align:middle" /> Tạo đơn hàng mới</h3>
        <div class="form-group">
          <label>Tên khách</label>
          <input v-model="newOrder.customerName" placeholder="Nguyễn Văn A" />
        </div>
        <div class="form-group">
          <label>SĐT</label>
          <input v-model="newOrder.customerPhone" placeholder="0901234567" />
        </div>
        <div class="form-group">
          <label>Địa chỉ</label>
          <input v-model="newOrder.customerAddress" placeholder="123 Đường ABC, Q1, HCM" />
        </div>
        <div class="form-group">
          <label>Tổng tiền (VNĐ)</label>
          <input type="number" v-model.number="newOrder.totalAmount" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Ghi chú</label>
          <textarea v-model="newOrder.notes" rows="2" placeholder="Ghi chú đơn hàng..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">Hủy</button>
          <button class="btn-create" @click="createOrder">Tạo đơn</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { Package, CheckCircle, Truck, XCircle, Hourglass, FileEdit } from 'lucide-vue-next'
const { showToast } = useToast()

const props = defineProps({
  shopId: [Number, String],
})

const orders = ref([])
const stats = ref({ totalOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0 })
const filterStatus = useUrlParam('status', '')
const showCreateModal = ref(false)
const selectedOrder = ref(null)
const newOrder = ref({ customerName: '', customerPhone: '', customerAddress: '', totalAmount: 0, notes: '' })

const statusLabels = { pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' }
const paymentLabels = { unpaid: 'Chưa TT', paid: 'Đã TT', refunded: 'Hoàn tiền' }

onMounted(() => { fetchOrders(); fetchStats() })
watch(filterStatus, () => fetchOrders())

async function fetchOrders() {
  try {
    let url = `/orders?limit=50`
    if (props.shopId) url += `&shopId=${props.shopId}`
    if (filterStatus.value) url += `&status=${filterStatus.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    orders.value = data.data || data || []
  } catch { orders.value = [] }
}

async function fetchStats() {
  try {
    let url = `/orders/stats`
    if (props.shopId) url += `?shopId=${props.shopId}`
    const res = await apiFetch(url)
    stats.value = await res.json()
  } catch { /* silent */ }
}

async function createOrder() {
  try {
    await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({ ...newOrder.value, shopId: props.shopId, status: 'pending', paymentStatus: 'unpaid' })
    })
    showCreateModal.value = false
    newOrder.value = { customerName: '', customerPhone: '', customerAddress: '', totalAmount: 0, notes: '' }
    fetchOrders(); fetchStats()
  } catch (err) { showToast('Lỗi tạo đơn: ' + err.message, 'error') }
}

async function updateStatus(order, newStatus) {
  if (newStatus === 'cancelled' && !confirm('Hủy đơn hàng này?')) return
  try {
    await apiFetch(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    })
    fetchOrders(); fetchStats()
  } catch { /* silent */ }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.order-management { padding: 24px; overflow-y: auto; height: 100%; }
.om-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.om-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; }
.filter-select {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px;
  transition: border-color 0.2s; outline: none;
}
.filter-select:focus { border-color: #7c3aed; }
.btn-add {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff; border: none; padding: 10px 20px;
  border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  transition: all 0.25s; box-shadow: 0 4px 15px rgba(124,58,237,0.2);
}
.btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.3); }

.revenue-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 20px; text-align: center;
  position: relative; overflow: hidden; transition: all 0.3s;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; opacity: 0.6;
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.stat-value { font-size: 26px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; letter-spacing: 0.3px; }
.stat-card.revenue .stat-value { color: #34d399; }
.stat-card.revenue::before { background: linear-gradient(90deg, transparent, #34d399, transparent); }
.stat-card.paid .stat-value { color: #60a5fa; }
.stat-card.paid::before { background: linear-gradient(90deg, transparent, #60a5fa, transparent); }

.orders-table { overflow-x: auto; }
table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-size: 13px;
}
thead {
  background: var(--color-bg-elevated);
}
th {
  padding: 12px 14px; text-align: left; color: var(--color-text-muted);
  font-weight: 700; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
td {
  padding: 12px 14px; border-bottom: 1px solid var(--color-border);
  color: var(--color-text-primary);
}
tr:hover { background: rgba(124,58,237,0.03); }
.amount { font-weight: 800; color: #34d399; }
.empty {
  text-align: center; color: var(--color-text-muted); padding: 60px;
  font-size: 14px;
}

.status-badge, .payment-badge {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700;
  letter-spacing: 0.3px;
}
.status-badge.pending { background: rgba(245,158,11,0.1); color: #fbbf24; }
.status-badge.confirmed { background: rgba(16,185,129,0.1); color: #34d399; }
.status-badge.shipping { background: rgba(59,130,246,0.1); color: #60a5fa; }
.status-badge.delivered { background: rgba(34,197,94,0.1); color: #86efac; }
.status-badge.cancelled { background: rgba(239,68,68,0.1); color: #fca5a5; }
.payment-badge.unpaid { background: rgba(245,158,11,0.1); color: #fbbf24; }
.payment-badge.paid { background: rgba(16,185,129,0.1); color: #86efac; }
.payment-badge.refunded { background: rgba(168,85,247,0.1); color: #c4b5fd; }

.action-btns { display: flex; gap: 4px; }
.action-btns button {
  background: none; border: none; cursor: pointer; font-size: 16px;
  padding: 4px; opacity: 0.5; transition: all 0.2s;
}
.action-btns button:hover { opacity: 1; transform: scale(1.15); }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
.modal {
  background: var(--color-bg-secondary); border: 1px solid var(--color-border);
  border-radius: 16px; padding: 28px;
  width: 440px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.modal h3 { margin: 0 0 20px 0; font-weight: 800; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea {
  width: 100%; background: var(--color-bg-card); border: 1px solid var(--color-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px;
  font-family: inherit; box-sizing: border-box; outline: none;
  transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus { border-color: #7c3aed; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel {
  background: var(--color-bg-card); color: var(--color-text-secondary); border: 1px solid var(--color-border);
  padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.btn-create {
  background: linear-gradient(135deg, #7c3aed, #6d28d9); color: #fff; border: none;
  padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: 0 4px 15px rgba(124,58,237,0.2);
}
.btn-create:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.3); }
</style>

