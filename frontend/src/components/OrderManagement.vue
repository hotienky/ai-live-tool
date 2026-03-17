<template>
  <div class="order-management">
    <div class="om-header">
      <h2><Package :size="20" style="vertical-align:middle" /> Quản Lý Đơn Hàng</h2>
      <div class="header-actions">
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả</option>
          <option v-for="s in orderStatuses" :key="s.id" :value="s.name">{{ s.name }}</option>
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
          <tr v-for="order in orders" :key="order.id" @click="openDetail(order)" class="clickable-row">
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
      <div class="modal modal--wide">
        <h3><FileEdit :size="16" style="vertical-align:middle" /> Tạo đơn hàng mới</h3>
        <div class="form-row">
          <div class="form-group">
            <label>Tên khách</label>
            <input v-model="newOrder.customerName" placeholder="Nguyễn Văn A" />
          </div>
          <div class="form-group">
            <label>SĐT</label>
            <input v-model="newOrder.customerPhone" placeholder="0901234567" />
          </div>
        </div>
        <div class="form-group">
          <label>Địa chỉ</label>
          <input v-model="newOrder.customerAddress" placeholder="123 Đường ABC, Q1, HCM" />
        </div>

        <!-- Product Line Items -->
        <div class="form-group">
          <label><ShoppingBag :size="14" style="vertical-align:middle" /> Sản phẩm</label>
          <div class="line-items">
            <div class="line-item" v-for="(item, idx) in newOrder.items" :key="idx">
              <select v-model="item.productId" @change="onProductSelect(idx)" class="line-item__select">
                <option value="">-- Chọn sản phẩm --</option>
                <option v-for="p in products" :key="p.id" :value="p.id">
                  {{ p.name }} — {{ formatCurrency(p.price) }}/{{ p.unit }}
                </option>
              </select>
              <div class="line-item__qty">
                <button @click="item.qty = Math.max(1, item.qty - 1)" class="qty-btn">−</button>
                <input type="number" v-model.number="item.qty" min="1" class="qty-input" />
                <button @click="item.qty++" class="qty-btn">+</button>
              </div>
              <span class="line-item__subtotal">{{ formatCurrency(item.price * item.qty) }}</span>
              <button @click="removeItem(idx)" class="line-item__remove" v-if="newOrder.items.length > 1">
                <XCircle :size="16" />
              </button>
            </div>
            <button @click="addItem" class="btn-add-item">
              <Plus :size="14" /> Thêm sản phẩm
            </button>
          </div>
        </div>

        <!-- Total -->
        <div class="order-total">
          <span>Tổng cộng:</span>
          <span class="order-total__amount">{{ formatCurrency(computedTotal) }}</span>
        </div>

        <div class="form-group">
          <label>Ghi chú</label>
          <textarea v-model="newOrder.notes" rows="2" placeholder="Ghi chú đơn hàng..."></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">Hủy</button>
          <button class="btn-create" @click="createOrder" :disabled="computedTotal === 0">
            <ShoppingCart :size="14" /> Tạo đơn — {{ formatCurrency(computedTotal) }}
          </button>
        </div>
      </div>
    </div>

    <!-- Order Detail Modal -->
    <div class="modal-overlay" v-if="showDetailModal" @click.self="showDetailModal = false">
      <div class="modal modal--detail">
        <div class="detail-header">
          <h3><Package :size="16" style="vertical-align:middle" /> Chi tiết đơn #{{ detailOrder?.id?.slice(0,8) }}</h3>
          <button class="btn-close" @click="showDetailModal = false">&times;</button>
        </div>

        <div class="detail-info">
          <div class="info-row"><span class="info-label">Khách hàng:</span> {{ detailOrder?.customerName || '—' }}</div>
          <div class="info-row"><span class="info-label">SĐT:</span> {{ detailOrder?.customerPhone || '—' }}</div>
          <div class="info-row"><span class="info-label">Địa chỉ:</span> {{ detailOrder?.customerAddress || '—' }}</div>
          <div class="info-row">
            <span class="info-label">Trạng thái:</span>
            <span class="status-badge" :class="detailOrder?.status">{{ detailOrder?.status }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Tổng tiền:</span>
            <span class="detail-amount">{{ formatCurrency(detailOrder?.totalAmount) }}</span>
          </div>
        </div>

        <!-- Status Actions -->
        <div class="detail-actions">
          <button v-for="s in orderStatuses" :key="s.id"
            v-show="detailOrder?.status !== s.name"
            @click="changeStatus(s.id, s.name)"
            class="status-btn"
            :class="s.name">
            {{ s.name }}
          </button>
        </div>

        <!-- Order Items -->
        <div class="detail-section">
          <h4><ClipboardList :size="14" /> Sản phẩm ({{ detailItems.length }})</h4>
          <div class="detail-items" v-if="detailItems.length">
            <div class="detail-item" v-for="item in detailItems" :key="item.id">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <span v-if="item.sku" class="item-sku">SKU: {{ item.sku }}</span>
                <span>{{ item.qty }} x {{ formatCurrency(item.price) }}</span>
                <span v-if="item.tax > 0" class="item-tax">Tax: {{ formatCurrency(item.tax) }}</span>
              </div>
              <div class="item-total">{{ formatCurrency(item.totalPrice) }}</div>
            </div>
          </div>
          <p v-else class="empty-text">Không có chi tiết sản phẩm</p>
        </div>

        <!-- Order Totals (S-Cart: ShopOrderTotal) -->
        <div class="detail-section" v-if="detailTotals.length">
          <h4><Coins :size="14" /> Chi tiết thanh toán</h4>
          <div class="totals-breakdown">
            <div class="totals-row" v-for="t in detailTotals" :key="t.id" :class="{ 'totals-row--total': t.code === 'total' }">
              <span>{{ t.title }}</span>
              <span>{{ formatCurrency(t.value) }}</span>
            </div>
          </div>
        </div>

        <!-- Order History Timeline (S-Cart: ShopOrderHistory) -->
        <div class="detail-section">
          <h4>📜 Lịch sử trạng thái</h4>
          <div class="timeline" v-if="detailHistory.length">
            <div class="timeline-item" v-for="h in detailHistory" :key="h.id">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-status">
                  <span class="status-badge">{{ getStatusNameById(h.orderStatusId) }}</span>
                </div>
                <div class="timeline-note" v-if="h.content">{{ h.content }}</div>
                <div class="timeline-time">{{ formatDate(h.addDate || h.createdAt) }}</div>
              </div>
            </div>
          </div>
          <p v-else class="empty-text">Chưa có lịch sử</p>
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
import { Package, CheckCircle, Truck, XCircle, Hourglass, FileEdit, ShoppingBag, DollarSign, CreditCard, TrendingUp, Send, Printer, RotateCcw, Plus, ShoppingCart } from 'lucide-vue-next'
const { showToast } = useToast()

const props = defineProps({
  // tenant-scoped
  prefillOrder: { type: Object, default: null },
})
const emit = defineEmits(['create-shipment'])

const orders = ref([])
const products = ref([])
const stats = ref({ totalOrders: 0, totalRevenue: 0, paidRevenue: 0, conversionRate: 0 })
const filterStatus = useUrlParam('status', '')
const showCreateModal = ref(false)
const selectedOrder = ref(null)
const emptyItem = () => ({ productId: '', name: '', price: 0, qty: 1 })
const newOrder = ref({ customerName: '', customerPhone: '', customerAddress: '', items: [emptyItem()], notes: '' })

import { computed } from 'vue'
const computedTotal = computed(() => {
  return newOrder.value.items.reduce((sum, i) => sum + (Number(i.price) || 0) * (i.qty || 1), 0)
})

// Dynamic statuses from DB (S-Cart pattern)
const orderStatuses = ref([])
const paymentStatuses = ref([])
function getStatusNameById(id) {
  const s = orderStatuses.value.find(s => s.id === id)
  return s ? s.name : `#${id}`
}
const paymentLabels = { unpaid: 'Chưa TT', paid: 'Đã TT', refunded: 'Hoàn tiền' }
const statusLabels = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
  returned: 'Hoàn hàng',
}

// Detail modal
const showDetailModal = ref(false)
const detailOrder = ref(null)
const detailItems = ref([])
const detailTotals = ref([])
const detailHistory = ref([])

onMounted(() => { fetchOrders(); fetchStats(); fetchProducts(); fetchStatuses() })
watch(filterStatus, () => fetchOrders())

// Auto-open form when prefill data comes from Lead
watch(() => props.prefillOrder, (data) => {
  if (data) {
    // Try to find matching product from productIntent
    const matchedItems = []
    if (data.productIntent && products.value.length) {
      const intent = data.productIntent.toLowerCase()
      const found = products.value.find(p => p.name.toLowerCase().includes(intent) || (p.keywords || []).some(k => intent.includes(k.toLowerCase())))
      if (found) {
        matchedItems.push({ productId: found.id, name: found.name, price: Number(found.price), qty: 1 })
      }
    }
    newOrder.value = {
      customerName: data.customerName || '',
      customerPhone: data.customerPhone || '',
      customerAddress: data.customerAddress || '',
      items: matchedItems.length ? matchedItems : [emptyItem()],
      notes: data.notes || '',
    }
    showCreateModal.value = true
  }
}, { immediate: true })

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

async function fetchOrders() {
  try {
    let url = `/orders?limit=50`
    if (filterStatus.value) url += `&status=${filterStatus.value}`
    const res = await apiFetch(url)
    const data = await res.json()
    const raw = data.data || data || []
    orders.value = raw.map(mapKeys)
  } catch { orders.value = [] }
}

async function fetchProducts() {
  try {
    let url = `/products`
    const res = await apiFetch(url)
    const data = await res.json()
    products.value = Array.isArray(data) ? data : (data.data || [])
  } catch { products.value = [] }
}

function onProductSelect(idx) {
  const item = newOrder.value.items[idx]
  const product = products.value.find(p => p.id === item.productId)
  if (product) {
    item.name = product.name
    item.price = Number(product.price) || 0
  }
}

function addItem() {
  newOrder.value.items.push(emptyItem())
}

function removeItem(idx) {
  newOrder.value.items.splice(idx, 1)
}

async function fetchStats() {
  try {
    let url = `/orders/stats`
    const res = await apiFetch(url)
    stats.value = await res.json()
  } catch { /* silent */ }
}

async function createOrder() {
  const items = newOrder.value.items.filter(i => i.productId && i.price > 0)
  if (items.length === 0) {
    showToast('Vui lòng chọn ít nhất 1 sản phẩm', 'error')
    return
  }
  try {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...newOrder.value,
        items: items.map(i => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
        totalAmount: computedTotal.value,
        status: 'pending',
        paymentStatus: 'unpaid',
      })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || err.message || `HTTP ${res.status}`)
    }
    showCreateModal.value = false
    newOrder.value = { customerName: '', customerPhone: '', customerAddress: '', items: [emptyItem()], notes: '' }
    fetchOrders(); fetchStats()
    showToast('Tạo đơn thành công!', 'success')
  } catch (err) { showToast('Lỗi tạo đơn: ' + err.message, 'error') }
}

async function fetchStatuses() {
  try {
    const [osRes, psRes] = await Promise.all([apiFetch('/order-statuses'), apiFetch('/payment-statuses')])
    orderStatuses.value = await osRes.json()
    paymentStatuses.value = await psRes.json()
  } catch { /* silent */ }
}

async function updateStatus(order, statusId) {
  try {
    await apiFetch(`/orders/${order.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statusId })
    })
    fetchOrders(); fetchStats()
  } catch { /* silent */ }
}

async function openDetail(order) {
  detailOrder.value = order
  showDetailModal.value = true
  try {
    const [detailsRes, totalsRes, historyRes] = await Promise.all([
      apiFetch(`/orders/${order.id}/details`),
      apiFetch(`/orders/${order.id}/totals`),
      apiFetch(`/orders/${order.id}/history`),
    ])
    detailItems.value = await detailsRes.json()
    detailTotals.value = await totalsRes.json()
    detailHistory.value = await historyRes.json()
  } catch {
    detailItems.value = Array.isArray(order.items) ? order.items : []
    detailTotals.value = []
    detailHistory.value = []
  }
}

async function changeStatus(statusId, statusName) {
  if (statusName === 'Đã hủy' && !confirm('Hủy đơn hàng này?')) return
  try {
    const res = await apiFetch(`/orders/${detailOrder.value.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statusId })
    })
    const updated = await res.json()
    detailOrder.value = mapKeys(updated)
    const historyRes = await apiFetch(`/orders/${detailOrder.value.id}/history`)
    detailHistory.value = await historyRes.json()
    fetchOrders(); fetchStats()
    showToast(`Đã cập nhật: ${statusName}`, 'success')
  } catch { showToast('Lỗi cập nhật trạng thái', 'error') }
}

async function updatePayment(order, paymentStatus) {
  if (paymentStatus === 'refunded' && !confirm('Hoàn tiền đơn hàng này?')) return
  try {
    await apiFetch(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify({ paymentStatus })
    })
    showToast(paymentStatus === 'paid' ? 'Đã xác nhận thanh toán' : 'Đã hoàn tiền', 'success')
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
      <div class="row"><span class="label">TT Toán:</span><span>${order.paymentStatus === 'paid' ? 'Đã TT' : 'Chưa TT'}</span></div>
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
.filter-select:focus { border-color: var(--color-accent-primary); }
.btn-add {
  background: var(--accent-gradient);
  color: #fff; border: none; padding: 10px 20px;
  border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-add:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }

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
tr:hover { background: var(--color-accent-glow); }
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
.stat-icon--orders { background: var(--color-accent-glow); color: var(--accent-light); }
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
.action-btns .btn-refund:hover { color: var(--accent-light); opacity: 1; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.7); display: flex; align-items: center;
  justify-content: center; z-index: 1000; backdrop-filter: blur(4px);
}
/* Removed local modal */
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
.form-group input:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel {
  background: var(--color-bg-card); color: var(--color-text-secondary); border: 1px solid var(--color-border);
  padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600;
  transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.btn-create {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-create:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-create:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* Product Picker */
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.line-items { display: flex; flex-direction: column; gap: 8px; }
.line-item {
  display: flex; align-items: center; gap: 8px;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 8px 12px;
  transition: border-color 0.2s;
}
.line-item:hover { border-color: var(--color-border-hover); }
.line-item__select {
  flex: 1; background: transparent; border: none;
  color: var(--color-text-primary); font-size: 13px;
  outline: none; font-family: inherit;
}
.line-item__select option { background: var(--color-bg-secondary); }
.line-item__qty {
  display: flex; align-items: center; gap: 2px;
  background: var(--glass-bg); border-radius: 8px;
  border: 1px solid var(--color-border);
}
.qty-btn {
  background: none; border: none; color: var(--color-text-secondary);
  width: 28px; height: 28px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; font-weight: 700; transition: color 0.2s;
}
.qty-btn:hover { color: var(--color-text-primary); }
.qty-input {
  width: 36px; text-align: center; background: transparent;
  border: none; color: var(--color-text-primary);
  font-size: 13px; font-weight: 700; outline: none;
  -moz-appearance: textfield;
}
.qty-input::-webkit-outer-spin-button,
.qty-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.line-item__subtotal {
  font-size: 13px; font-weight: 800; color: #34d399;
  min-width: 90px; text-align: right;
}
.line-item__remove {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 2px; transition: color 0.2s;
}
.line-item__remove:hover { color: #ef4444; }
.btn-add-item {
  background: var(--glass-bg); border: 1px dashed var(--color-border);
  color: var(--color-text-secondary); padding: 8px 14px;
  border-radius: 10px; cursor: pointer; font-size: 12px; font-weight: 600;
  display: flex; align-items: center; justify-content: center; gap: 6px;
  transition: all 0.2s;
}
.btn-add-item:hover {
  border-color: var(--color-accent-primary); color: var(--accent-light);
  background: var(--color-accent-glow);
}
.order-total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; border-radius: 10px; margin-bottom: 14px;
  background: linear-gradient(135deg, rgba(52,211,153,0.08), rgba(52,211,153,0.02));
  border: 1px solid rgba(52,211,153,0.2);
}
.order-total span:first-child { font-size: 14px; font-weight: 700; color: var(--color-text-secondary); }
.order-total__amount { font-size: 22px; font-weight: 900; color: #34d399; }

/* Clickable row */
.clickable-row { cursor: pointer; }
.clickable-row:hover { background: var(--color-accent-glow) !important; }

/* Order Detail Modal */
/* Removed local modal detail */
.detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.detail-header h3 { margin: 0; font-weight: 800; }
.btn-close {
  background: none; border: none; font-size: 24px; cursor: pointer;
  color: var(--color-text-muted); transition: color 0.2s;
}
.btn-close:hover { color: var(--color-text-primary); }

.detail-info {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 16px; margin-bottom: 16px;
}
.info-row { padding: 6px 0; font-size: 13px; display: flex; align-items: center; gap: 8px; }
.info-label { color: var(--color-text-muted); min-width: 100px; font-weight: 600; }
.detail-amount { font-weight: 800; color: #34d399; font-size: 18px; }

/* Status Action Buttons */
.detail-actions { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
.status-btn {
  padding: 8px 16px; border: none; border-radius: 10px; font-size: 12px;
  font-weight: 700; cursor: pointer; transition: all 0.25s;
}
.status-btn.confirmed { background: rgba(59,130,246,0.12); color: #60a5fa; }
.status-btn.confirmed:hover { background: rgba(59,130,246,0.25); }
.status-btn.processing { background: rgba(139,92,246,0.12); color: var(--accent-light); }
.status-btn.processing:hover { background: rgba(139,92,246,0.25); }
.status-btn.shipping { background: rgba(6,182,212,0.12); color: #22d3ee; }
.status-btn.shipping:hover { background: rgba(6,182,212,0.25); }
.status-btn.delivered { background: rgba(16,185,129,0.12); color: #34d399; }
.status-btn.delivered:hover { background: rgba(16,185,129,0.25); }
.status-btn.completed { background: rgba(34,197,94,0.12); color: #86efac; }
.status-btn.completed:hover { background: rgba(34,197,94,0.25); }
.status-btn.cancelled { background: rgba(239,68,68,0.12); color: #fca5a5; }
.status-btn.cancelled:hover { background: rgba(239,68,68,0.25); }

/* Detail Section (Items + History) */
.detail-section { margin-bottom: 16px; }
.detail-section h4 { font-size: 14px; font-weight: 700; margin: 0 0 10px 0; }
.detail-items { display: flex; flex-direction: column; gap: 8px; }
.detail-item {
  display: flex; justify-content: space-between; align-items: center;
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 10px 14px;
}
.item-name { font-weight: 600; font-size: 13px; flex: 1; }
.item-meta { font-size: 12px; color: var(--color-text-muted); display: flex; gap: 8px; align-items: center; }
.item-sku { background: var(--color-accent-glow); color: var(--accent-light); padding: 2px 6px; border-radius: 4px; font-size: 11px; }
.item-total { font-weight: 800; color: #34d399; font-size: 13px; min-width: 80px; text-align: right; }
.empty-text { font-size: 13px; color: var(--color-text-muted); text-align: center; margin: 10px 0; }

/* Status badges  */
.status-badge.processing { background: rgba(139,92,246,0.1); color: #c4b5fd; }
.status-badge.completed { background: rgba(34,197,94,0.1); color: #86efac; }
.status-badge.refunded { background: rgba(249,115,22,0.1); color: #fdba74; }

/* Timeline */
.timeline { display: flex; flex-direction: column; gap: 0; }
.timeline-item { display: flex; gap: 12px; position: relative; padding-bottom: 16px; }
.timeline-item:not(:last-child)::before {
  content: ''; position: absolute; left: 7px; top: 20px;
  bottom: 0; width: 2px; background: var(--color-border);
}
.timeline-dot {
  width: 16px; height: 16px; border-radius: 50%;
  margin-top: 3px; flex-shrink: 0;
  background: var(--color-border);
}
.timeline-dot.pending { background: #f59e0b; }
.timeline-dot.confirmed { background: #3b82f6; }
.timeline-dot.processing { background: #8b5cf6; }
.timeline-dot.shipping { background: #06b6d4; }
.timeline-dot.delivered { background: #10b981; }
.timeline-dot.completed { background: #22c55e; }
.timeline-dot.cancelled { background: #ef4444; }
.timeline-dot.refunded { background: #f97316; }
.timeline-content { flex: 1; }
.timeline-status { display: flex; align-items: center; gap: 8px; }
.timeline-from { font-size: 11px; color: var(--color-text-muted); }
.timeline-note { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
.timeline-time { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
</style>


