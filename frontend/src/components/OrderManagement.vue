<template>
  <div class="order-management">
    <div class="om-header">
      <h2>📦 Quản Lý Đơn Hàng</h2>
      <div class="header-actions">
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả</option>
          <option value="pending">⏳ Chờ xác nhận</option>
          <option value="confirmed">✅ Đã xác nhận</option>
          <option value="shipping">🚚 Đang giao</option>
          <option value="delivered">📦 Đã giao</option>
          <option value="cancelled">❌ Đã hủy</option>
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
                <button v-if="order.status === 'pending'" @click.stop="updateStatus(order, 'confirmed')" title="Xác nhận">✅</button>
                <button v-if="order.status === 'confirmed'" @click.stop="updateStatus(order, 'shipping')" title="Giao hàng">🚚</button>
                <button v-if="order.status === 'shipping'" @click.stop="updateStatus(order, 'delivered')" title="Đã giao">📦</button>
                <button v-if="order.status !== 'cancelled' && order.status !== 'delivered'" @click.stop="updateStatus(order, 'cancelled')" title="Hủy">❌</button>
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
        <h3>📝 Tạo đơn hàng mới</h3>
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
const { showToast } = useToast()

const props = defineProps({
  shopId: [Number, String],
})

const orders = ref([])
const stats = ref({ totalOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0 })
const filterStatus = ref('')
const showCreateModal = ref(false)
const selectedOrder = ref(null)
const newOrder = ref({ customerName: '', customerPhone: '', customerAddress: '', totalAmount: 0, notes: '' })

const statusLabels = { pending: '⏳ Chờ xác nhận', confirmed: '✅ Đã xác nhận', shipping: '🚚 Đang giao', delivered: '📦 Đã giao', cancelled: '❌ Đã hủy' }
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
.order-management { padding: 0; }
.om-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px; flex-wrap: wrap; gap: 12px;
}
.om-header h2 { margin: 0; font-size: 20px; }
.header-actions { display: flex; gap: 8px; }
.filter-select {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px;
}
.btn-add {
  background: #059669; color: #fff; border: none; padding: 8px 16px;
  border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 13px;
}
.btn-add:hover { background: #047857; }

.revenue-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 12px; margin-bottom: 20px;
}
.stat-card {
  background: rgba(255,255,255,0.05); border-radius: 10px;
  padding: 16px; text-align: center;
}
.stat-value { font-size: 24px; font-weight: 800; color: #fff; }
.stat-label { font-size: 11px; color: #999; margin-top: 4px; }
.stat-card.revenue .stat-value { color: #34d399; }
.stat-card.paid .stat-value { color: #60a5fa; }

.orders-table { overflow-x: auto; }
table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
thead { background: rgba(255,255,255,0.05); }
th { padding: 10px 12px; text-align: left; color: #999; font-weight: 600; font-size: 11px; text-transform: uppercase; }
td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #ddd; }
tr:hover { background: rgba(255,255,255,0.03); cursor: pointer; }
.amount { font-weight: 700; color: #34d399; }
.empty { text-align: center; color: #666; padding: 40px; }

.status-badge, .payment-badge {
  padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
}
.status-badge.pending { background: #92400e33; color: #fbbf24; }
.status-badge.confirmed { background: #065f4633; color: #34d399; }
.status-badge.shipping { background: #1e3a5f33; color: #60a5fa; }
.status-badge.delivered { background: #14532d33; color: #86efac; }
.status-badge.cancelled { background: #7f1d1d33; color: #fca5a5; }
.payment-badge.unpaid { background: #78350f33; color: #fde047; }
.payment-badge.paid { background: #14532d33; color: #86efac; }
.payment-badge.refunded { background: #4c1d9533; color: #c4b5fd; }

.action-btns { display: flex; gap: 4px; }
.action-btns button {
  background: none; border: none; cursor: pointer; font-size: 16px;
  padding: 2px; opacity: 0.7; transition: 0.2s;
}
.action-btns button:hover { opacity: 1; transform: scale(1.2); }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; align-items: center;
  justify-content: center; z-index: 1000;
}
.modal {
  background: #1a1a2e; border-radius: 12px; padding: 24px;
  width: 420px; max-width: 90vw;
}
.modal h3 { margin: 0 0 16px 0; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; color: #999; margin-bottom: 4px; }
.form-group input, .form-group textarea {
  width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px;
  font-family: inherit; box-sizing: border-box;
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel {
  background: rgba(255,255,255,0.1); color: #ccc; border: none;
  padding: 8px 16px; border-radius: 6px; cursor: pointer;
}
.btn-create {
  background: #059669; color: #fff; border: none;
  padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-create:hover { background: #047857; }
</style>
