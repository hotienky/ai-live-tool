<template>
  <div class="order-management">
    <div class="om-header">
      <h2><Package :size="20" style="vertical-align:middle" /> Quản Lý Đơn Hàng</h2>
      <div class="header-actions">
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả</option>
          <option value="draft">Nháp (Auto)</option>
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
        <div class="stat-icon stat-icon--orders"><ShoppingBag :size="22" /></div>
        <div class="stat-value">{{ stats.totalOrders }}</div>
        <div class="stat-label">Tổng đơn</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-icon stat-icon--revenue"><DollarSign :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(stats.totalRevenue) }}</div>
        <div class="stat-label">Doanh thu</div>
      </div>
      <div class="stat-card paid">
        <div class="stat-icon stat-icon--paid"><CreditCard :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(stats.paidRevenue) }}</div>
        <div class="stat-label">Đã thanh toán</div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon--rate"><TrendingUp :size="22" /></div>
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
                <button v-if="order.status === 'confirmed'" @click.stop="emit('create-shipment', order.id)" title="Tạo vận đơn" class="btn-ship"><Send :size="15" /></button>
                <button v-if="order.status === 'confirmed'" @click.stop="updateStatus(order, 'shipping')" title="Giao hàng"><Truck :size="15" /></button>
                <button v-if="order.status === 'shipping'" @click.stop="updateStatus(order, 'delivered')" title="Đã giao"><Package :size="15" /></button>
                <button v-if="order.paymentStatus === 'unpaid'" @click.stop="updatePayment(order, 'paid')" title="Đã thanh toán" class="btn-pay"><DollarSign :size="15" /></button>
                <button v-if="order.paymentStatus === 'paid'" @click.stop="updatePayment(order, 'refunded')" title="Hoàn tiền" class="btn-refund"><RotateCcw :size="15" /></button>
                <button @click.stop="printInvoice(order)" title="In hóa đơn"><Printer :size="15" /></button>
                <button v-if="order.status !== 'cancelled' && order.status !== 'delivered'" @click.stop="updateStatus(order, 'cancelled')" title="Hủy"><XCircle :size="15" /></button>
              </div>
            </td>
          </tr>
          <tr v-if="orders.length === 0">
            <td colspan="8" class="empty">
              <div class="empty-state">
                <Package :size="40" class="empty-state__icon" />
                <p class="empty-state__title">Chưa có đơn hàng</p>
                <p class="empty-state__sub">Đơn hàng sẽ hiển thị ở đây khi được tạo</p>
              </div>
            </td>
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
import { Package, CheckCircle, Truck, XCircle, Hourglass, FileEdit, ShoppingBag, DollarSign, CreditCard, TrendingUp, Send, Printer, RotateCcw } from 'lucide-vue-next'
const { showToast } = useToast()

const props = defineProps({
  shopId: [Number, String],
  prefillOrder: { type: Object, default: null },
})
const emit = defineEmits(['create-shipment'])

const orders = ref([])
const stats = ref({ totalOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0 })
const filterStatus = useUrlParam('status', '')
const showCreateModal = ref(false)
const selectedOrder = ref(null)
const newOrder = ref({ customerName: '', customerPhone: '', customerAddress: '', totalAmount: 0, notes: '' })

const statusLabels = { draft: 'Nháp (Auto)', pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', shipping: 'Đang giao', delivered: 'Đã giao', cancelled: 'Đã hủy' }
const paymentLabels = { unpaid: 'Chưa TT', paid: 'Đã TT', refunded: 'Hoàn tiền' }

onMounted(() => { fetchOrders(); fetchStats() })
watch(filterStatus, () => fetchOrders())

// Auto-open form when prefill data comes from Lead
watch(() => props.prefillOrder, (data) => {
  if (data) {
    newOrder.value = {
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      customerAddress: data.customerAddress || '',
      totalAmount: data.totalAmount || 0,
      notes: data.notes || '',
    }
    showCreateModal.value = true
  }
}, { immediate: true })

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

async function updatePayment(order, paymentStatus) {
  if (paymentStatus === 'refunded' && !confirm('Hoàn tiền đơn hàng này?')) return
  try {
    await apiFetch(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus })
    })
    showToast(paymentStatus === 'paid' ? '✅ Đã xác nhận thanh toán' : '🔄 Đã hoàn tiền', 'success')
    fetchOrders(); fetchStats()
  } catch { showToast('Lỗi cập nhật thanh toán', 'error') }
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function printInvoice(order) {
  const items = Array.isArray(order.items) ? order.items : []
  const itemsHtml = items.map((it, i) => `
    <tr><td>${i+1}</td><td>${it.name || '—'}</td><td style="text-align:center">${it.qty || 1}</td><td style="text-align:right">${Number(it.price || 0).toLocaleString('vi-VN')}đ</td></tr>
  `).join('')

  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`<!DOCTYPE html><html><head><title>Hóa đơn #${order.id}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',sans-serif; width:80mm; margin:0 auto; padding:10px; font-size:12px; }
      .header { text-align:center; border-bottom:2px dashed #000; padding-bottom:10px; margin-bottom:10px; }
      .header h1 { font-size:16px; text-transform:uppercase; }
      .header .date { font-size:10px; color:#666; margin-top:4px; }
      .info { margin-bottom:10px; }
      .info .row { display:flex; justify-content:space-between; margin-bottom:2px; }
      .info .label { color:#666; }
      table { width:100%; border-collapse:collapse; margin-bottom:10px; }
      th { border-bottom:1px solid #000; padding:4px 2px; text-align:left; font-size:11px; }
      td { padding:4px 2px; border-bottom:1px dotted #ccc; font-size:11px; }
      .total-section { border-top:2px dashed #000; padding-top:8px; margin-top:8px; }
      .total-row { display:flex; justify-content:space-between; margin-bottom:4px; }
      .total-row.grand { font-size:16px; font-weight:800; margin-top:6px; }
      .footer { text-align:center; border-top:1px dashed #ccc; padding-top:8px; margin-top:12px; font-size:10px; color:#999; }
      @media print { body { width:80mm; padding:5px; } }
    </style>
  </head><body>
    <div class="header">
      <h1>HÓA ĐƠN BÁN HÀNG</h1>
      <div class="date">${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
    </div>
    <div class="info">
      <div class="row"><span class="label">Mã đơn:</span><strong>#${order.id}</strong></div>
      <div class="row"><span class="label">Khách:</span><span>${order.customerName || 'Khách lẻ'}</span></div>
      ${order.customerPhone ? `<div class="row"><span class="label">SĐT:</span><span>${order.customerPhone}</span></div>` : ''}
      ${order.customerAddress ? `<div class="row"><span class="label">Địa chỉ:</span><span>${order.customerAddress}</span></div>` : ''}
      <div class="row"><span class="label">TT Toán:</span><span>${order.paymentStatus === 'paid' ? '✅ Đã TT' : '⏳ Chưa TT'}</span></div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Sản phẩm</th><th style="text-align:center">SL</th><th style="text-align:right">Giá</th></tr></thead>
      <tbody>${itemsHtml || '<tr><td colspan="4" style="text-align:center; color:#999">Không có sản phẩm</td></tr>'}</tbody>
    </table>
    <div class="total-section">
      <div class="total-row grand"><span>TỔNG CỘNG:</span><span>${Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</span></div>
    </div>
    ${order.notes ? `<div style="margin-top:8px;font-size:11px"><strong>Ghi chú:</strong> ${order.notes}</div>` : ''}
    <div class="footer">Cảm ơn quý khách!<br/>In lúc ${new Date().toLocaleString('vi-VN')}</div>
  </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 300)
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
  text-align: center; color: var(--color-text-muted); padding: 40px;
}
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

.stat-icon {
  width: 44px; height: 44px; border-radius: 12px; display: flex;
  align-items: center; justify-content: center; margin: 0 auto 10px;
}
.stat-icon--orders { background: rgba(124,58,237,0.12); color: #a78bfa; }
.stat-icon--revenue { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--paid { background: rgba(96,165,250,0.12); color: #60a5fa; }
.stat-icon--rate { background: rgba(251,191,36,0.12); color: #fbbf24; }

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
.action-btns .btn-ship { color: #60a5fa; opacity: 0.8; }
.action-btns .btn-ship:hover { color: #3b82f6; opacity: 1; }
.action-btns .btn-pay { color: #34d399; opacity: 0.8; }
.action-btns .btn-pay:hover { color: #10b981; opacity: 1; }
.action-btns .btn-refund { color: #c4b5fd; opacity: 0.8; }
.action-btns .btn-refund:hover { color: #a78bfa; opacity: 1; }

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

