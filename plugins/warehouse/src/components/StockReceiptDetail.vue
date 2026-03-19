<template>
  <div class="srd-page">
    <div class="srd-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> Quay lại</button>
      <div class="srd-header__center">
        <h3 v-if="receipt">
          <span class="type-badge" :class="receipt.type">{{ typeLabel(receipt.type) }}</span>
          {{ receipt.receipt_number }}
          <span class="status-badge" :class="receipt.status">{{ statusLabel(receipt.status) }}</span>
        </h3>
      </div>
      <div class="header-actions" v-if="receipt">
        <button v-if="receipt.status === 'draft'" class="btn-confirm" @click="confirmReceipt"><Check :size="13" /> Xác nhận</button>
        <button v-if="receipt.status !== 'cancelled'" class="btn-cancel-action" @click="cancelReceipt"><X :size="13" /> Hủy phiếu</button>
      </div>
    </div>

    <div v-if="loading" class="loading-hint">Đang tải...</div>
    <div v-else-if="receipt">
      <div class="srd-info-grid">
        <div v-if="receipt.supplier"><strong>NCC:</strong> {{ receipt.supplier?.name }}</div>
        <div><strong>Ngày tạo:</strong> {{ formatDate(receipt.created_at) }}</div>
        <div v-if="receipt.confirmed_at"><strong>Xác nhận:</strong> {{ formatDate(receipt.confirmed_at) }}</div>
        <div v-if="receipt.notes" class="srd-notes"><strong>Ghi chú:</strong> {{ receipt.notes }}</div>
      </div>

      <div class="srd-table-wrap">
        <table class="srd-table">
          <thead><tr><th>#</th><th>Sản phẩm</th><th>SKU</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
          <tbody>
            <tr v-for="(item, idx) in (receipt.items || [])" :key="idx">
              <td>{{ idx+1 }}</td>
              <td>{{ item.product_name }}</td>
              <td class="sku">{{ item.sku || '—' }}</td>
              <td>{{ item.qty }}</td>
              <td>{{ formatCurrency(item.unit_price) }}</td>
              <td class="amount">{{ formatCurrency(item.total || item.qty * item.unit_price) }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td colspan="5" class="text-right fw-800">Tổng cộng:</td><td class="amount fw-800">{{ formatCurrency(receipt.total_amount) }}</td></tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Check, X } from 'lucide-vue-next'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'

const { showToast } = useToast()
const props = defineProps({ editId: { type: [String, Number], required: true } })
const emit = defineEmits(['back', 'refresh'])

const receipt = ref(null)
const loading = ref(true)

onMounted(loadReceipt)

async function loadReceipt() {
  loading.value = true
  try {
    const res = await apiFetch(`/stock-receipts/${props.editId}`)
    const data = await res.json()
    receipt.value = data.data || data
  } catch { showToast('Không tải được phiếu', 'error') }
  loading.value = false
}

async function confirmReceipt() {
  if (!confirm(`Xác nhận phiếu ${receipt.value.receipt_number}? Kho sẽ được cập nhật.`)) return
  try {
    await apiFetch(`/stock-receipts/${props.editId}/confirm`, { method: 'POST' })
    showToast('Đã xác nhận — Kho và kế toán đã cập nhật', 'success')
    loadReceipt(); emit('refresh')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function cancelReceipt() {
  if (!confirm(`Hủy phiếu ${receipt.value.receipt_number}?`)) return
  try {
    await apiFetch(`/stock-receipts/${props.editId}/cancel`, { method: 'POST' })
    showToast('Đã hủy phiếu', 'success')
    loadReceipt(); emit('refresh')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

function typeLabel(t) { return { import: 'Nhập kho', export: 'Xuất kho', return: 'Trả hàng', adjust: 'Kiểm kê' }[t] || t }
function statusLabel(s) { return { draft: 'Nháp', confirmed: 'Đã xác nhận', cancelled: 'Đã hủy' }[s] || s }
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }
</script>

<style scoped>
.srd-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.srd-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); flex-wrap: wrap; }
.srd-header__center { flex: 1; }
.srd-header h3 { margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; cursor: pointer; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.header-actions { display: flex; gap: 8px; }
.btn-confirm { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; cursor: pointer; }
.btn-cancel-action { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(239,68,68,.4); background: rgba(239,68,68,.08); color: #ef4444; font-size: 13px; cursor: pointer; }
.type-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.type-badge.import { background: rgba(52,211,153,.1); color: #34d399; }
.type-badge.export { background: rgba(248,113,113,.1); color: #f87171; }
.type-badge.return { background: rgba(251,191,36,.1); color: #fbbf24; }
.type-badge.adjust { background: rgba(96,165,250,.1); color: #60a5fa; }
.status-badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.status-badge.draft { background: rgba(251,191,36,.1); color: #fbbf24; }
.status-badge.confirmed { background: rgba(52,211,153,.1); color: #34d399; }
.status-badge.cancelled { background: rgba(248,113,113,.1); color: #f87171; }
.srd-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px; background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; margin-bottom: 16px; font-size: 13px; }
.srd-notes { grid-column: span 2; }
.srd-table-wrap { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden; }
.srd-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.srd-table th { padding: 10px 14px; text-align: left; color: var(--color-text-muted); font-size: 11px; font-weight: 700; text-transform: uppercase; border-bottom: 1px solid var(--color-border); background: var(--color-bg-elevated); }
.srd-table td { padding: 10px 14px; border-bottom: 1px solid var(--color-border); }
.srd-table tfoot td { border-top: 2px solid var(--color-border); }
.sku { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.amount { font-weight: 700; color: #34d399; }
.text-right { text-align: right; }
.fw-800 { font-weight: 800; }
.loading-hint { text-align: center; padding: 40px; color: var(--color-text-muted); }
</style>
