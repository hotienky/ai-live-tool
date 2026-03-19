<template>
  <div class="ship-detail-page">
    <div class="sd-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> Quay lại</button>
      <div class="sd-header__center">
        <div class="sd-header__icon"><MapPin :size="15" /></div>
        <h3>Chi tiết Vận đơn #{{ shipment?.id || shipmentId }}</h3>
      </div>
      <div class="sd-actions">
        <button class="btn-print" @click="printShipmentLabel"><Printer :size="14" /> In phiếu</button>
        <button v-if="shipment && !['delivered','cancelled'].includes(shipment.status)" class="btn-cancel" @click="cancelShipment">
          <XCircle :size="14" /> Hủy Đơn
        </button>
      </div>
    </div>

    <div v-if="loading" class="sd-loading">
      <Loader2 :size="24" class="spin" /> <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else-if="shipment" class="sd-content">
      <!-- Two columns layout -->
      <div class="sd-col sd-col--left">
        <!-- Info Card -->
        <div class="sd-card">
          <h4><Package :size="16" /> Thông tin Vận đơn</h4>
          <div class="info-grid">
            <div class="info-item"><span>Người nhận</span><strong>{{ shipment.receiverName }}</strong></div>
            <div class="info-item"><span>Điện thoại</span><strong>{{ shipment.receiverPhone }}</strong></div>
            <div class="info-item span-2"><span>Địa chỉ</span><strong>{{ shipment.receiverAddress }}, {{ shipment.receiverWard }}, {{ shipment.receiverDistrict }}, {{ shipment.receiverProvince }}</strong></div>
            <div class="info-item"><span>ĐVVC</span><strong>{{ carrierLabels[shipment.carrier] || shipment.carrier }}</strong></div>
            <div class="info-item"><span>Mã VĐ</span><strong class="tracking-code">{{ shipment.trackingCode || '—' }}</strong></div>
            <div class="info-item"><span>Phí ship</span><strong class="price">{{ formatCurrency(shipment.shippingFee) }}</strong></div>
            <div class="info-item"><span>COD</span><strong class="price">{{ formatCurrency(shipment.codAmount) }}</strong></div>
          </div>
        </div>

        <!-- Update Status Card -->
        <div class="sd-card">
          <h4><RefreshCw :size="16" /> Cập nhật trạng thái</h4>
          <div class="status-flow">
            <button
              v-for="(label, key) in statusLabels"
              :key="key"
              class="status-flow__btn"
              :class="{ active: statusNewValue === key, current: shipment.status === key }"
              @click="statusNewValue = key"
            >{{ label }}</button>
          </div>
          <div class="form-grid" style="margin-top:16px">
            <div class="form-group span-2">
              <label>Mô tả / Ghi chú</label>
              <input v-model="statusDescription" class="form-input" placeholder="VD: Đã nhập kho phân loại..." />
            </div>
            <div class="form-group span-2">
              <label>Vị trí</label>
              <input v-model="statusLocation" class="form-input" placeholder="VD: Kho Tân Bình, HCM" />
            </div>
          </div>
          <button class="btn-primary" style="margin-top: 16px; width: 100%; justify-content: center;" @click="submitStatus" :disabled="saving">
            <Loader2 v-if="saving" :size="14" class="spin" />
            {{ saving ? 'Đang cập nhật...' : 'Cập nhật trạng thái' }}
          </button>
        </div>
      </div>

      <div class="sd-col sd-col--right">
        <!-- Timeline Card -->
        <div class="sd-card timeline-card">
          <h4><Clock :size="16" /> Lịch sử hành trình</h4>
          
          <div class="tracking-timeline" v-if="trackingHistory.length > 0">
            <div v-for="entry in trackingHistory" :key="entry.id" class="tracking-item">
              <div class="tracking-dot" :class="entry.status"></div>
              <div class="tracking-content">
                <div class="tracking-row">
                  <span class="tracking-badge" :class="entry.status">{{ statusLabels[entry.status] || entry.status }}</span>
                  <span class="tracking-source">{{ entry.source }}</span>
                </div>
                <div class="tracking-desc" v-if="entry.description">{{ entry.description }}</div>
                <div class="tracking-loc" v-if="entry.location"><MapPin :size="12" /> {{ entry.location }}</div>
                <div class="tracking-time">{{ formatDate(entry.createdAt) }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <MapPin :size="32" class="empty-state__icon" />
            <p class="empty-state__title">Chưa có lịch sử</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, MapPin, Printer, XCircle, Package, RefreshCw, Clock, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const props = defineProps({ shipmentId: { type: [Number, String], required: true } })
const emit = defineEmits(['back', 'updated'])

const loading = ref(true)
const saving = ref(false)
const shipment = ref(null)
const trackingHistory = ref([])

const statusNewValue = ref('')
const statusDescription = ref('')
const statusLocation = ref('')

const statusLabels = {
  draft: 'Nháp',
  pending: 'Chờ lấy',
  picked_up: 'Đã lấy',
  in_transit: 'Đang chuyển',
  out_for_delivery: 'Đang giao',
  delivered: 'Đã giao',
  returned: 'Hoàn hàng',
  cancelled: 'Đã hủy',
}
const carrierLabels = { manual: 'Thủ công', ghn: 'GHN', ghtk: 'GHTK', viettel_post: 'Viettel Post' }

onMounted(() => {
  loadData()
})

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}
function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadData() {
  loading.value = true
  try {
    const [shipRes, trackRes] = await Promise.all([
      apiFetch(`/shipments`), // Actually we should fetch single shipment by ID ideally, but shipping/ endpoint might not have show(). Let's fetch all and find, or assume we pass shipment object.
      apiFetch(`/shipments/${props.shipmentId}/tracking`)
    ]);
    
    // Instead of querying all, we assume there's a GET /shipments endpoint that might return list, we find ours.
    // If backend doesn't support GET /shipments/:id, we use the list.
    const rawShipments = await shipRes.json()
    const shipList = Array.isArray(rawShipments) ? rawShipments.map(mapKeys) : []
    shipment.value = shipList.find(s => s.id == props.shipmentId)
    
    trackingHistory.value = await trackRes.json()

    if (shipment.value) {
      statusNewValue.value = shipment.value.status
    }
  } catch (error) {
    showToast('Lỗi tải dữ liệu', 'error')
  } finally {
    loading.value = false
  }
}

async function submitStatus() {
  saving.value = true
  try {
    await apiFetch(`/shipments/${props.shipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: statusNewValue.value,
        description: statusDescription.value,
        location: statusLocation.value,
      }),
    })
    showToast(`Đã cập nhật: ${statusLabels[statusNewValue.value]}`, 'success')
    statusDescription.value = ''
    statusLocation.value = ''
    await loadData() // Refresh
    emit('updated')
  } catch (err) { 
    showToast('Lỗi: ' + err.message, 'error') 
  } finally {
    saving.value = false
  }
}

async function cancelShipment() {
  if (!confirm(`Hủy vận đơn #${props.shipmentId}?`)) return
  try {
    await apiFetch(`/shipments/${props.shipmentId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', description: 'Hủy vận đơn qua hệ thống' }),
    })
    showToast('Đã hủy vận đơn', 'success')
    await loadData()
    emit('updated')
  } catch { showToast('Lỗi hủy vận đơn', 'error') }
}

function printShipmentLabel() {
  if (!shipment.value) return
  const s = shipment.value
  const win = window.open('', '_blank', 'width=400,height=600')
  win.document.write(`<!DOCTYPE html><html><head><title>Phiếu gửi hàng #${s.id}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family:'Segoe UI',sans-serif; padding:20px; font-size:13px; }
      .header { text-align:center; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:12px; }
      .header h1 { font-size:18px; text-transform:uppercase; }
      .header p { font-size:11px; color:#666; }
      .section { margin-bottom:14px; }
      .section-title { font-weight:700; font-size:12px; text-transform:uppercase; margin-bottom:6px; border-bottom:1px dashed #ccc; padding-bottom:4px; }
      .row { display:flex; justify-content:space-between; margin-bottom:3px; }
      .row .label { color:#666; }
      .row .value { font-weight:600; text-align:right; max-width:60%; }
      .barcode { text-align:center; margin:16px 0; font-family:monospace; font-size:20px; letter-spacing:3px; }
      .footer { text-align:center; border-top:1px solid #ccc; padding-top:10px; font-size:10px; color:#999; margin-top:16px; }
    </style>
  </head><body>
    <div class="header">
      <h1>Phiếu Gửi Hàng</h1>
      <p>${carrierLabels[s.carrier] || s.carrier} — ${new Date().toLocaleDateString('vi-VN')}</p>
    </div>
    <div class="barcode">${s.trackingCode || `VD-${String(s.id).padStart(6,'0')}`}</div>
    <div class="section">
      <div class="section-title">Người nhận</div>
      <div class="row"><span class="label">Tên:</span><span class="value">${s.receiverName || '—'}</span></div>
      <div class="row"><span class="label">SĐT:</span><span class="value">${s.receiverPhone || '—'}</span></div>
      <div class="row"><span class="label">Địa chỉ:</span><span class="value">${s.receiverAddress || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Thông tin gói hàng</div>
      <div class="row"><span class="label">Khối lượng:</span><span class="value">${s.weight || 500}g</span></div>
      <div class="row"><span class="label">Phí ship:</span><span class="value">${Number(s.shippingFee || 0).toLocaleString('vi-VN')}đ</span></div>
      <div class="row"><span class="label">COD:</span><span class="value">${Number(s.codAmount || 0).toLocaleString('vi-VN')}đ</span></div>
    </div>
    <div class="footer">In lúc ${new Date().toLocaleString('vi-VN')}</div>
  </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 300)
}
</script>

<style scoped>
.ship-detail-page { animation: fadeUp .2s ease; max-width: 1000px; margin: 0 auto; padding-bottom: 40px; }
@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

.sd-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 16px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
.sd-header__center { display: flex; align-items: center; gap: 8px; }
.sd-header__icon { width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.sd-header h3 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text-1); }

.sd-actions { display: flex; gap: 8px; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-1); font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-print { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-2); font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-print:hover { border-color: var(--accent); color: var(--text-1); }
.btn-cancel { display: flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: 1px solid #ef4444; background: #fef2f2; color: #ef4444; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: #ef4444; color: #fff; }

.sd-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px; color: var(--text-muted); gap: 12px; }

.sd-content { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: start; }

.sd-card { background: var(--bg-1); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
.sd-card h4 { display: flex; align-items: center; gap: 8px; margin: 0 0 16px; font-size: 15px; font-weight: 700; color: var(--text-1); border-bottom: 1px solid var(--border); padding-bottom: 12px; }

/* Info Grid */
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.info-item { display: flex; flex-direction: column; gap: 4px; padding: 12px; background: var(--bg-2); border-radius: 8px; }
.info-item.span-2 { grid-column: span 2; }
.info-item span { font-size: 12px; color: var(--text-2); font-weight: 600; }
.info-item strong { font-size: 14px; color: var(--text-1); word-break: break-word; }
.info-item strong.price { color: #10b981; }
.tracking-code { font-family: monospace; letter-spacing: 1px; color: var(--accent) !important; }

/* Status Flow */
.status-flow { display: flex; flex-wrap: wrap; gap: 8px; }
.status-flow__btn { padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); font-size: 12px; font-weight: 600; cursor: pointer; transition: all .2s; flex: 1; min-width: 80px; text-align: center; }
.status-flow__btn:hover { border-color: var(--accent); color: var(--text-1); }
.status-flow__btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }
.status-flow__btn.current { border: 2px solid var(--accent); font-weight: 800; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 13px; color: var(--text-2); margin-bottom: 6px; font-weight: 700; }
.form-input { width: 100%; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); padding: 10px 14px; border-radius: 8px; font-size: 13px; box-sizing: border-box; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: var(--accent); }
.btn-primary { display: flex; align-items: center; gap: 6px; padding: 10px 24px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-weight: 700; cursor: pointer; box-shadow: var(--shadow-sm); }

/* Timeline */
.timeline-card { min-height: 400px; }
.tracking-timeline { position: relative; padding-left: 14px; }
.tracking-timeline::before { content: ''; position: absolute; left: 6px; top: 10px; bottom: 10px; width: 2px; background: var(--border); border-radius: 2px; }
.tracking-item { position: relative; padding-bottom: 24px; }
.tracking-item:last-child { padding-bottom: 0; }
.tracking-dot { position: absolute; left: -14px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--bg-2); border: 2px solid var(--border); z-index: 2; box-shadow: 0 0 0 4px var(--bg-1); }
.tracking-dot.delivered { background: #10b981; border-color: #10b981; }
.tracking-dot.pending, .tracking-dot.in_transit { background: var(--accent); border-color: var(--accent); }
.tracking-content { padding-left: 12px; }
.tracking-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.tracking-badge { display: inline-flex; padding: 2px 8px; border-radius: 20px; font-size: 11px; font-weight: 700; background: var(--bg-2); color: var(--text-2); }
.tracking-badge.delivered { background: rgba(16,185,129,0.1); color: #10b981; }
.tracking-badge.in_transit, .tracking-badge.pending { background: var(--accent-glow); color: var(--accent); }
.tracking-source { font-size: 11px; color: var(--text-muted); font-family: monospace; }
.tracking-desc { font-size: 13px; color: var(--text-1); margin-bottom: 4px; line-height: 1.4; }
.tracking-loc { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 4px; margin-bottom: 4px; }
.tracking-time { font-size: 11px; color: var(--text-muted); }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 0; color: var(--text-muted); gap: 12px; }
.empty-state__icon { opacity: 0.5; }
.empty-state__title { font-size: 14px; font-weight: 600; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
