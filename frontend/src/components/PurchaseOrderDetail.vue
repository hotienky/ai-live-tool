<template>
  <div class="pod-page">
    <div class="pod-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> Quay lại</button>
      <div class="pod-header__center">
        <h3 v-if="po">
          {{ po.po_number }}
          <span class="status-badge" :class="po.status">{{ statusLabel(po.status) }}</span>
          <span class="pay-badge" :class="po.payment_status">{{ payLabel(po.payment_status) }}</span>
        </h3>
      </div>
      <div v-if="po" class="header-actions">
        <button v-if="po.status === 'draft'" class="btn-order" @click="sendPO"><Send :size="13" /> Đặt hàng</button>
        <button v-if="['ordered','partial'].includes(po.status)" class="btn-receive" @click="showReceiveModal = true"><PackageCheck :size="13" /> Nhận hàng</button>
      </div>
    </div>

    <div v-if="loading" class="loading-hint">Đang tải...</div>
    <div v-else-if="po">
      <div class="pod-info-grid">
        <div><strong>NCC:</strong> {{ po.supplier?.name }}</div>
        <div><strong>Ngày đặt:</strong> {{ formatDate(po.order_date) }}</div>
        <div v-if="po.expected_date"><strong>Dự kiến:</strong> {{ formatDate(po.expected_date) }}</div>
        <div v-if="po.received_date"><strong>Đã nhận:</strong> {{ formatDate(po.received_date) }}</div>
        <div v-if="po.notes" class="pod-notes"><strong>Ghi chú:</strong> {{ po.notes }}</div>
      </div>

      <div class="pod-table-wrap">
        <table class="pod-table">
          <thead><tr><th>#</th><th>Sản phẩm</th><th>SKU</th><th>SL đặt</th><th>Đã nhận</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in (po.items || [])" :key="idx">
              <td>{{ idx+1 }}</td>
              <td>{{ item.product_name }}</td>
              <td class="sku">{{ item.sku || '—' }}</td>
              <td>{{ item.qty }}</td>
              <td><span :class="item.received_qty >= item.qty ? 'received-full' : item.received_qty > 0 ? 'received-partial' : ''">{{ item.received_qty || 0 }} / {{ item.qty }}</span></td>
              <td>{{ formatCurrency(item.unit_price) }}</td>
              <td class="amount">{{ formatCurrency(item.total || item.qty * item.unit_price) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="6" class="text-right fw-700">Tạm tính:</td><td class="amount">{{ formatCurrency(po.subtotal) }}</td></tr>
            <tr v-if="po.tax_amount"><td colspan="6" class="text-right">Thuế:</td><td>{{ formatCurrency(po.tax_amount) }}</td></tr>
            <tr v-if="po.discount_amount"><td colspan="6" class="text-right">Giảm giá:</td><td>-{{ formatCurrency(po.discount_amount) }}</td></tr>
            <tr><td colspan="6" class="text-right fw-800">Tổng cộng:</td><td class="amount fw-800">{{ formatCurrency(po.total_amount) }}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>

    <!-- Receive Modal (simple action, keep as modal per audit spec) -->
    <div class="modal-overlay" v-if="showReceiveModal" @click.self="showReceiveModal = false">
      <div class="modal">
        <h3><PackageCheck :size="16" style="vertical-align:middle" /> Nhận hàng — {{ po?.po_number }}</h3>
        <p class="receive-hint">Nhập số lượng thực nhận:</p>
        <table class="receive-table">
          <thead><tr><th>Sản phẩm</th><th>SL đặt</th><th>Đã nhận</th><th>Còn lại</th><th style="width:100px">Nhận lần này</th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in receiveItems" :key="idx">
              <td>{{ item.product_name }}</td><td>{{ item.qty }}</td><td>{{ item.received_qty }}</td><td>{{ item.remaining }}</td>
              <td><input type="number" v-model.number="item.receive_qty" :min="0" :max="item.remaining" class="item-input" /></td>
            </tr>
          </tbody>
        </table>
        <div class="form-group" style="margin-top:12px"><label>Ghi chú</label><input v-model="receiveNotes" class="form-input" placeholder="Ghi chú nhận hàng..." /></div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showReceiveModal = false">Hủy</button>
          <button class="btn-create" @click="submitReceive"><PackageCheck :size="14" /> Xác nhận nhận hàng</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Send, PackageCheck } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const props = defineProps({ editId: { type: [String, Number], required: true } })
const emit = defineEmits(['back', 'refresh'])

const po = ref(null)
const loading = ref(true)
const showReceiveModal = ref(false)
const receiveItems = ref([])
const receiveNotes = ref('')

onMounted(loadPO)

async function loadPO() {
  loading.value = true
  try {
    const res = await apiFetch(`/purchase-orders/${props.editId}`)
    const data = await res.json()
    po.value = data.data || data
  } catch { showToast('Không tải được đơn hàng', 'error') }
  loading.value = false
}

function openReceive() {
  receiveItems.value = (po.value.items || []).map(i => ({ ...i, received_qty: i.received_qty || 0, remaining: i.qty - (i.received_qty || 0), receive_qty: i.qty - (i.received_qty || 0) })).filter(i => i.remaining > 0)
  receiveNotes.value = ''
  showReceiveModal.value = true
}

async function sendPO() {
  if (!confirm(`Đặt hàng ${po.value.po_number}?`)) return
  try {
    await apiFetch(`/purchase-orders/${props.editId}/send`, { method: 'POST' })
    showToast('Đã chuyển sang Đã đặt', 'success')
    loadPO()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function submitReceive() {
  const items = receiveItems.value.filter(i => i.receive_qty > 0).map(i => ({ product_id: i.product_id, receive_qty: Math.min(i.receive_qty, i.remaining) }))
  if (items.length === 0) return showToast('Nhập số lượng nhận', 'error')
  try {
    const res = await apiFetch(`/purchase-orders/${props.editId}/receive`, { method: 'POST', body: JSON.stringify({ items, notes: receiveNotes.value }) })
    const data = await res.json()
    showToast(data.message || 'Đã nhận hàng', 'success')
    showReceiveModal.value = false
    loadPO()
    emit('refresh')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

function statusLabel(s) { return { draft: 'Nháp', ordered: 'Đã đặt', partial: 'Nhận 1 phần', received: 'Đã nhận', cancelled: 'Đã hủy' }[s] || s }
function payLabel(p) { return { unpaid: 'Chưa TT', partial: 'TT 1 phần', paid: 'Đã TT' }[p] || p }
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
</script>

<style scoped>
.pod-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.pod-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.pod-header__center { display: flex; align-items: center; gap: 8px; flex: 1; }
.pod-header h3 { margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; cursor: pointer; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.header-actions { display: flex; gap: 8px; }
.btn-order { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: #3b82f6; color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-receive { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.status-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.status-badge.draft { background: rgba(251,191,36,.1); color: #fbbf24; }
.status-badge.ordered { background: rgba(96,165,250,.1); color: #60a5fa; }
.status-badge.partial { background: rgba(245,158,11,.1); color: #f59e0b; }
.status-badge.received { background: rgba(52,211,153,.1); color: #34d399; }
.status-badge.cancelled { background: rgba(248,113,113,.1); color: #f87171; }
.pay-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.pay-badge.unpaid { background: rgba(248,113,113,.08); color: #f87171; }
.pay-badge.partial { background: rgba(251,191,36,.08); color: #fbbf24; }
.pay-badge.paid { background: rgba(52,211,153,.08); color: #34d399; }
.pod-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; margin-bottom: 16px; font-size: 13px; }
.pod-notes { grid-column: span 2; }
.pod-table-wrap { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; }
.pod-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.pod-table th { padding: 10px 14px; text-align: left; color: var(--color-text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid var(--color-border); background: var(--color-bg-elevated); }
.pod-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.pod-table tfoot td { border-top: 2px solid var(--color-border); }
.sku { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.amount { font-weight: 700; color: #34d399; }
.text-right { text-align: right; }
.fw-700 { font-weight: 700; }
.fw-800 { font-weight: 800; }
.received-full { color: #34d399; font-weight: 700; }
.received-partial { color: #fbbf24; font-weight: 700; }
.loading-hint { text-align: center; padding: 40px; color: var(--color-text-muted); }
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,.7); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 16px; padding: 28px; width: 720px; max-width: 90vw; box-shadow: 0 20px 60px rgba(0,0,0,.5); max-height: 85vh; overflow-y: auto; }
.modal h3 { margin: 0 0 16px; font-size: 16px; font-weight: 700; }
.receive-hint { font-size: 13px; color: var(--color-text-muted); margin: 0 0 12px; }
.receive-table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 12px; }
.receive-table th, .receive-table td { padding: 10px 12px; border-bottom: 1px solid var(--color-border); text-align: left; }
.receive-table th { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--color-text-muted); background: var(--color-bg-elevated); }
.item-input { width: 100%; padding: 6px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px; outline: none; box-sizing: border-box; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-input { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; box-sizing: border-box; }
.modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel { padding: 8px 18px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.btn-create { display: flex; align-items: center; gap: 6px; padding: 8px 18px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-weight: 600; cursor: pointer; }
</style>
