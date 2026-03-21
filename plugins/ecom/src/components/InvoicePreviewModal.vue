<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="show" class="inv-overlay" @click.self="$emit('close')">
        <div class="inv-modal">
          <!-- Header -->
          <div class="inv-modal__header">
            <h3>{{ t('admin.msg_ee8632be', 'Hoá đơn') }} <code>{{ invoice?.invoice_number }}</code></h3>
            <div class="inv-modal__actions">
              <button class="inv-btn inv-btn--outline" @click="printInvoice" :title="t('admin.msg_1323347b', 'In hoá đơn')">
                <Printer :size="14" /> In
              </button>
              <button class="inv-btn inv-btn--outline" @click="downloadPdf" :title="t('admin.msg_34de7842', 'Tải PDF')" >
                <Download :size="14" /> PDF
              </button>
              <button v-if="invoice?.customer_email" class="inv-btn inv-btn--outline"
                @click="sendEmail" :disabled="sending" :title="t('admin.msg_bef1559f', 'Gửi email')">
                <Mail :size="14" /> {{ sending ? t('admin.msg_6b22c83e', 'Đang gửi...') : 'Email' }}
              </button>
              <button class="inv-btn inv-btn--close" @click="$emit('close')">
                <X :size="16" />
              </button>
            </div>
          </div>

          <!-- Status bar -->
          <div class="inv-status-bar">
            <span class="inv-badge" :class="'inv-badge--' + invoice?.status">
              {{ statusLabel(invoice?.status) }}
            </span>
            <select v-if="invoice?.status !== 'cancelled'" class="inv-select"
              :value="invoice?.status" @change="updateStatus($event.target.value)">
              <option value="draft">{{ t('admin.msg_867cf3b9', 'Nháp') }}</option>
              <option value="issued">{{ t('admin.msg_3d064afb', 'Đã xuất') }}</option>
              <option value="paid">{{ t('admin.msg_0c9c7bc3', 'Đã thanh toán') }}</option>
              <option value="cancelled">{{ t('admin.msg_9daba04f', 'Huỷ') }}</option>
            </select>
          </div>

          <!-- Print Area -->
          <div ref="printArea" class="inv-print-area">
            <!-- Invoice Header -->
            <div class="inv-doc__header">
              <div>
                <h1 class="inv-doc__title">{{ t('admin.msg_cfecfcd1', 'HÓA ĐƠN') }}</h1>
                <div class="inv-doc__number">#{{ invoice?.invoice_number }}</div>
              </div>
              <div class="inv-doc__meta">
                <div><span class="inv-doc__label">{{ t('admin.msg_b0aa8a6c', 'Ngày xuất:') }}</span> {{ formatDate(invoice?.issued_at || invoice?.created_at) }}</div>
                <div v-if="invoice?.due_date"><span class="inv-doc__label">{{ t('admin.msg_108f4046', 'Hạn TT:') }}</span> {{ formatDate(invoice?.due_date) }}</div>
              </div>
            </div>

            <!-- Parties -->
            <div class="inv-doc__parties">
              <div class="inv-doc__party">
                <h4>{{ t('admin.msg_0caa5ce1', 'Khách hàng') }}</h4>
                <p class="inv-doc__name">{{ invoice?.customer_name }}</p>
                <p v-if="invoice?.customer_phone">{{ t('admin.phone_short', 'SĐT') }}: {{ invoice?.customer_phone }}</p>
                <p v-if="invoice?.customer_email">{{ invoice?.customer_email }}</p>
                <p v-if="invoice?.customer_address">{{ invoice?.customer_address }}</p>
              </div>
              <div class="inv-doc__party inv-doc__party--right" v-if="seller?.name">
                <h4>{{ t('admin.msg_e07c1d51', 'Người bán') }}</h4>
                <p class="inv-doc__name">{{ seller?.name }}</p>
                <p v-if="seller?.phone">{{ t('admin.phone_short', 'SĐT') }}: {{ seller?.phone }}</p>
                <p v-if="seller?.email">{{ seller?.email }}</p>
                <p v-if="seller?.address">{{ seller?.address }}</p>
                <p v-if="seller?.tax_id">MST: {{ seller?.tax_id }}</p>
              </div>
            </div>

            <!-- Items table -->
            <table class="inv-doc__table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{{ t('admin.product', 'Sản phẩm') }}</th>
                  <th class="right">{{ t('admin.msg_ba2fb8fb', 'Đơn giá') }}</th>
                  <th class="right">SL</th>
                  <th class="right">{{ t('admin.msg_b860ba79', 'Thành tiền') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, i) in (invoice?.items || [])" :key="i">
                  <td>{{ i + 1 }}</td>
                  <td>{{ item.name || '—' }}</td>
                  <td class="right">{{ formatPrice(item.price || 0) }}</td>
                  <td class="right">{{ item.qty || 1 }}</td>
                  <td class="right">{{ formatPrice((item.price || 0) * (item.qty || 1)) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- Totals -->
            <div class="inv-doc__totals">
              <div class="inv-doc__totals-row">
                <span>{{ t('admin.msg_e014dd77', 'Tạm tính:') }}</span>
                <span>{{ formatPrice(invoice?.subtotal || 0) }}</span>
              </div>
              <div v-if="Number(invoice?.discount_amount) > 0" class="inv-doc__totals-row">
                <span>{{ t('admin.msg_1286d2de', 'Giảm giá:') }}</span>
                <span class="green">-{{ formatPrice(invoice?.discount_amount) }}</span>
              </div>
              <div v-if="Number(invoice?.shipping_fee) > 0" class="inv-doc__totals-row">
                <span>{{ t('admin.msg_381c23f1', 'Phí giao hàng:') }}</span>
                <span>{{ formatPrice(invoice?.shipping_fee) }}</span>
              </div>
              <div v-if="Number(invoice?.tax_amount) > 0" class="inv-doc__totals-row">
                <span>{{ t('admin.msg_500aedd2', 'Thuế') }}{{ taxDetailLabel }}:</span>
                <span class="purple">{{ formatPrice(invoice?.tax_amount) }}</span>
              </div>
              <div class="inv-doc__totals-row inv-doc__totals-row--grand">
                <span>{{ t('admin.msg_91abc33d', 'TỔNG CỘNG:') }}</span>
                <span>{{ formatPrice(invoice?.total_amount || 0) }}</span>
              </div>
            </div>

            <!-- Notes -->
            <div v-if="invoice?.notes" class="inv-doc__notes">
              <strong>{{ t('admin.msg_1f871388', 'Ghi chú:') }}</strong> {{ invoice?.notes }}
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Printer, Download, Mail, X } from 'lucide-vue-next'
import { apiFetch, API_BASE } from '../helpers.js'
import { useI18n } from '../helpers.js'

const { t, formatCurrency } = useI18n()

const props = defineProps({
  show: Boolean,
  invoiceId: [Number, String],
})
const emit = defineEmits(['close', 'updated'])

const invoice = ref(null)
const seller = ref(null)
const sending = ref(false)

const taxDetailLabel = computed(() => {
  if (!invoice.value?.tax_details?.length) return ''
  return ' (' + invoice.value.tax_details.map(t => t.name).join(', ') + ')'
})

watch(() => props.invoiceId, async (id) => {
  if (!id) return
  try {
    const res = await apiFetch(`/invoices/${id}/preview`)
    const raw = await res.json()
    const d = raw?.invoice !== undefined ? raw : raw?.data
    if (d) {
      invoice.value = d.invoice
      seller.value = d.seller
    }
  } catch { /* silent */ }
}, { immediate: true })

function statusLabel(s) {
  return { draft: t('admin.msg_867cf3b9', 'Nháp'), issued: t('admin.msg_3d064afb', 'Đã xuất'), paid: t('admin.msg_04b5eaed', 'Đã TT'), cancelled: t('admin.msg_9daba04f', 'Huỷ') }[s] || s
}

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN').format(Number(v) || 0) + 'đ'
}

function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

async function updateStatus(newStatus) {
  try {
    await apiFetch(`/invoices/${invoice.value.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    })
    invoice.value.status = newStatus
    emit('updated')
  } catch { /* silent */ }
}

function printInvoice() {
  const printArea = document.querySelector('.inv-print-area')
  if (!printArea) return
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="utf-8"><title>${t('admin.msg_ee8632be', 'Hoá đơn')} ${invoice.value?.invoice_number}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#1f2937; padding:32px; }
      h1 { font-size:28px; font-weight:900; text-transform:uppercase; }
      h4 { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:#6b7280; margin-bottom:8px; }
      table { width:100%; border-collapse:collapse; margin:20px 0; }
      th { background:#1f2937; color:#fff; padding:10px 14px; text-align:left; font-size:11px; }
      td { padding:10px 14px; border-bottom:1px solid #e5e7eb; }
      .right { text-align:right; }
      .inv-doc__header { display:flex; justify-content:space-between; border-bottom:2px solid #1f2937; padding-bottom:20px; margin-bottom:24px; }
      .inv-doc__parties { display:flex; justify-content:space-between; margin-bottom:20px; gap:40px; }
      .inv-doc__totals { margin-left:auto; width:300px; }
      .inv-doc__totals-row { display:flex; justify-content:space-between; padding:6px 0; }
      .inv-doc__totals-row--grand { font-size:16px; font-weight:900; border-top:2px solid #1f2937; padding-top:12px; margin-top:8px; }
      .inv-doc__notes { margin-top:20px; padding:14px; background:#f3f4f6; border-radius:6px; }
      .green { color:#16a34a; } .purple { color:#7c3aed; }
      @media print { body { padding:0; } }
    </style>
  </head><body>${printArea.innerHTML}</body></html>`)
  win.document.close()
  win.print()
}

function downloadPdf() {
  const token = localStorage.getItem('auth_token')
  const url = `${API_BASE}/invoices/${invoice.value?.id}/pdf`
  const a = document.createElement('a')
  a.href = url + `?token=${token}`
  a.target = '_blank'
  a.click()
}

async function sendEmail() {
  sending.value = true
  try {
    await apiFetch(`/invoices/${invoice.value.id}/send-email`, { method: 'POST' })
    alert('✅ ' + t('admin.msg_6072e399', 'Đã gửi email hoá đơn!'))
  } catch (e) {
    alert('❌ ' + t('admin.msg_e93661fa', 'Gửi email thất bại'))
  } finally {
    sending.value = false
  }
}
</script>

<style scoped>
.inv-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  z-index: 10000; display: flex; align-items: center; justify-content: center;
}
.inv-modal {
  background: var(--bg-secondary, #1e293b); border-radius: 16px;
  width: 90vw; max-width: 800px; max-height: 90vh; overflow-y: auto;
  box-shadow: 0 25px 60px rgba(0,0,0,.4); border: 1px solid rgba(255,255,255,.08);
}
.inv-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,.06);
}
.inv-modal__header h3 { font-size: 16px; font-weight: 700; color: var(--text-primary, #e2e8f0); }
.inv-modal__header code { color: #f59e0b; font-size: 14px; }
.inv-modal__actions { display: flex; gap: 6px; align-items: center; }
.inv-btn {
  display: inline-flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 8px;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; border: none;
}
.inv-btn--outline {
  background: rgba(255,255,255,.05); color: var(--text-secondary, #94a3b8);
  border: 1px solid rgba(255,255,255,.1);
}
.inv-btn--outline:hover { background: rgba(255,255,255,.1); color: #fff; }
.inv-btn--close { background: none; color: var(--text-secondary, #94a3b8); padding: 6px; }
.inv-btn--close:hover { color: #ef4444; }

.inv-status-bar {
  display: flex; align-items: center; gap: 10px; padding: 10px 20px;
  background: rgba(255,255,255,.02); border-bottom: 1px solid rgba(255,255,255,.06);
}
.inv-badge {
  padding: 3px 10px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.inv-badge--draft { background: rgba(148,163,184,.15); color: #94a3b8; }
.inv-badge--issued { background: rgba(59,130,246,.15); color: #60a5fa; }
.inv-badge--paid { background: rgba(34,197,94,.15); color: #4ade80; }
.inv-badge--cancelled { background: rgba(239,68,68,.15); color: #f87171; }
.inv-select {
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
  color: var(--text-primary, #e2e8f0); padding: 4px 8px; border-radius: 6px; font-size: 12px;
}

/* Print Area — light theme for invoice document */
.inv-print-area {
  padding: 32px; background: #fff; color: #1f2937; margin: 16px; border-radius: 12px;
}
.inv-doc__header {
  display: flex; justify-content: space-between; align-items: flex-start;
  border-bottom: 2px solid #1f2937; padding-bottom: 20px; margin-bottom: 24px;
}
.inv-doc__title { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; color: #1f2937; }
.inv-doc__number { font-size: 14px; color: #6b7280; margin-top: 4px; }
.inv-doc__meta { text-align: right; }
.inv-doc__meta div { margin-bottom: 4px; font-size: 12px; }
.inv-doc__label { color: #6b7280; }
.inv-doc__parties { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 40px; }
.inv-doc__party { flex: 1; }
.inv-doc__party h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700; }
.inv-doc__party--right { text-align: right; }
.inv-doc__name { font-weight: 700; font-size: 14px; margin-bottom: 4px; }
.inv-doc__party p { font-size: 13px; margin-bottom: 3px; }

.inv-doc__table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
.inv-doc__table thead tr { background: #1f2937; }
.inv-doc__table th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #fff; }
.inv-doc__table td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
.inv-doc__table tbody tr:nth-child(even) { background: #f9fafb; }
.right { text-align: right; }

.inv-doc__totals { margin-left: auto; width: 300px; }
.inv-doc__totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
.inv-doc__totals-row span:first-child { color: #6b7280; }
.inv-doc__totals-row--grand { font-size: 16px; font-weight: 900; border-top: 2px solid #1f2937; padding-top: 12px; margin-top: 8px; }
.inv-doc__totals-row--grand span:first-child { color: #1f2937; }
.green { color: #16a34a; }
.purple { color: #7c3aed; }

.inv-doc__notes { margin-top: 24px; padding: 14px; background: #f3f4f6; border-radius: 6px; font-size: 12px; }
.inv-doc__notes strong { display: block; margin-bottom: 4px; }

/* Animations */
.modal-fade-enter-active, .modal-fade-leave-active { transition: all .3s ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
.modal-fade-enter-from .inv-modal, .modal-fade-leave-to .inv-modal { transform: scale(.95) translateY(10px); }
</style>
