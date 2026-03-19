<template>
  <div class="shipping-management">
    <div class="ship-header">
      <h2><Truck :size="20" style="vertical-align:middle" /> Quản Lý Vận Chuyển</h2>
      <div class="header-actions">
        <input v-model="searchTerm" class="search-input" placeholder="🔍 Tìm mã VĐ, người nhận..." />
        <select v-model="filterStatus" class="filter-select">
          <option value="">Tất cả TT</option>
          <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
        </select>
        <select v-model="filterCarrier" class="filter-select">
          <option value="">Tất cả ĐVVC</option>
          <option value="manual">Thủ công</option>
          <option value="ghn">GHN</option>
          <option value="ghtk">GHTK</option>
          <option value="viettel_post">Viettel Post</option>
        </select>
        <button class="btn-add" @click="openCreateModal(null)"><Plus :size="14" /> Tạo vận đơn</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="ship-stats">
      <div class="stat-card">
        <div class="stat-icon stat-icon--total"><Package :size="22" /></div>
        <div class="stat-value">{{ shipStats.total }}</div>
        <div class="stat-label">Tổng vận đơn</div>
      </div>
      <div class="stat-card revenue">
        <div class="stat-icon stat-icon--fee"><DollarSign :size="22" /></div>
        <div class="stat-value">{{ formatCurrency(shipStats.totalFees) }}</div>
        <div class="stat-label">Tổng phí ship</div>
      </div>
      <div class="stat-card warning">
        <div class="stat-icon stat-icon--transit"><Truck :size="22" /></div>
        <div class="stat-value">{{ shipStats.statusCounts?.in_transit || 0 }}</div>
        <div class="stat-label">Đang vận chuyển</div>
      </div>
      <div class="stat-card" style="--accent-color: #34d399;">
        <div class="stat-icon stat-icon--delivered"><CheckCircle :size="22" /></div>
        <div class="stat-value" style="color:#34d399">{{ shipStats.statusCounts?.delivered || 0 }}</div>
        <div class="stat-label">{{ t('admin.delivered', 'Đã giao') }}</div>
      </div>
      <div class="stat-card" style="--accent-color: #60a5fa;">
        <div class="stat-icon stat-icon--rate"><TrendingUp :size="22" /></div>
        <div class="stat-value" style="color:#60a5fa">{{ deliveryRate }}%</div>
        <div class="stat-label">Tỷ lệ giao TC</div>
      </div>
    </div>

    <!-- Shipments Table -->
    <div class="ship-table">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Đơn hàng</th>
            <th>Người nhận</th>
            <th>{{ t('admin.phone_short', 'SĐT') }}</th>
            <th>ĐVVC</th>
            <th>{{ t('admin.tracking_code', 'Mã vận đơn') }}</th>
            <th>Phí ship</th>
            <th>COD</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th>
            <th>{{ t('admin.created_at', 'Ngày tạo') }}</th>
            <th>{{ t('admin.actions', 'Hành động') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in displayedShipments" :key="s.id">
            <td>{{ s.id }}</td>
            <td>#{{ s.orderId || '—' }}</td>
            <td class="name-cell">{{ s.receiverName || '—' }}</td>
            <td>{{ s.receiverPhone || '—' }}</td>
            <td><span class="carrier-badge" :class="s.carrier">{{ carrierLabels[s.carrier] || s.carrier }}</span></td>
            <td class="tracking-code">{{ s.trackingCode || '—' }}</td>
            <td class="price">{{ formatCurrency(s.shippingFee) }}</td>
            <td class="price">{{ formatCurrency(s.codAmount) }}</td>
            <td>
              <span class="status-badge" :class="s.status">{{ statusLabels[s.status] || s.status }}</span>
            </td>
            <td>{{ formatDate(s.createdAt) }}</td>
            <td>
              <div class="action-btns">
                <button class="act-btn act-edit" @click="openStatusModal(s)"><RefreshCw :size="13" /> Cập nhật</button>
                <button class="act-btn act-ship" @click="openTrackingModal(s)"><MapPin :size="13" /> Theo dõi</button>
                <button class="act-btn act-print" @click="printShipmentLabel(s)"><Printer :size="13" /> In</button>
                <button v-if="!['delivered','cancelled'].includes(s.status)" class="act-btn act-cancel" @click="cancelShipment(s)"><XCircle :size="13" /> Hủy</button>
                <button v-if="s.status === 'draft'" class="act-btn act-cancel" @click="deleteShipment(s)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
              </div>
            </td>
          </tr>
          <tr v-if="displayedShipments.length === 0">
            <td colspan="11" class="empty">
              <div class="empty-state">
                <Truck :size="40" class="empty-state__icon" />
                <p class="empty-state__title">Chưa có vận đơn</p>
                <p class="empty-state__sub">Tạo vận đơn mới từ đơn hàng hoặc thủ công</p>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Shipment Modal (with order lookup) -->
    <div class="modal-overlay" v-if="showCreateModal" @click.self="showCreateModal = false">
      <div class="modal modal--wide">
        <h3><Truck :size="16" style="vertical-align:middle" /> Tạo vận đơn mới</h3>

        <!-- Step indicator -->
        <div class="step-indicator">
          <div class="step" :class="{ active: createStep === 1, done: createStep > 1 }"><span>1</span> Thông tin</div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: createStep === 2, done: createStep > 2 }"><span>2</span> Vận chuyển</div>
          <div class="step-line"></div>
          <div class="step" :class="{ active: createStep === 3 }"><span>3</span> Xác nhận</div>
        </div>

        <!-- Step 1: Order/Receiver Info -->
        <div v-if="createStep === 1">
          <div class="form-group" style="margin-bottom:14px">
            <label>Tạo từ đơn hàng (tùy chọn)</label>
            <div class="order-lookup">
              <input type="text" v-model="orderLookupId" placeholder="Nhập ID đơn hàng..." />
              <button @click="lookupOrder" class="btn-lookup" :disabled="!orderLookupId">Tìm</button>
            </div>
            <div v-if="orderLookupResult" class="order-found">
              <CheckCircle :size="14" style="color:#34d399" /> Đơn #{{ orderLookupResult.id }} — {{ orderLookupResult.customerName }} — {{ formatCurrency(orderLookupResult.totalAmount) }}
              <button @click="fillFromOrder" class="btn-fill">Điền thông tin</button>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Người nhận *</label>
              <input v-model="shipForm.receiverName" placeholder="Nguyễn Văn A" />
            </div>
            <div class="form-group">
              <label>SĐT nhận *</label>
              <input v-model="shipForm.receiverPhone" placeholder="0901234567" />
            </div>
            <div class="form-group span-2">
              <label>Địa chỉ nhận *</label>
              <input v-model="shipForm.receiverAddress" placeholder="123 Đường ABC, Q1, HCM" />
            </div>
            <div class="form-group">
              <label>Phường/Xã</label>
              <input v-model="shipForm.receiverWard" placeholder="Phường 1" />
            </div>
            <div class="form-group">
              <label>Quận/Huyện</label>
              <input v-model="shipForm.receiverDistrict" placeholder="Quận 1" />
            </div>
            <div class="form-group span-2">
              <label>Tỉnh/TP</label>
              <input v-model="shipForm.receiverProvince" placeholder="Hồ Chí Minh" />
            </div>
          </div>
        </div>

        <!-- Step 2: Carrier & Fees -->
        <div v-if="createStep === 2">
          <div class="carrier-selector">
            <div v-for="c in carriers" :key="c.key"
              class="carrier-card" :class="{ selected: shipForm.carrier === c.key }"
              @click="shipForm.carrier = c.key">
              <div class="carrier-card__icon"><Truck :size="20" /></div>
              <div class="carrier-card__name">{{ c.name }}</div>
              <div class="carrier-card__desc">{{ c.desc }}</div>
            </div>
          </div>
          <div class="form-grid" style="margin-top:16px">
            <div class="form-group">
              <label>Phí ship (VNĐ)</label>
              <input type="number" v-model.number="shipForm.shippingFee" placeholder="0" />
            </div>
            <div class="form-group">
              <label>COD (VNĐ)</label>
              <input type="number" v-model.number="shipForm.codAmount" placeholder="0" />
            </div>
            <div class="form-group">
              <label>Khối lượng (gram)</label>
              <input type="number" v-model.number="shipForm.weight" placeholder="500" />
            </div>
            <div class="form-group">
              <label>Phí bảo hiểm</label>
              <input type="number" v-model.number="shipForm.insuranceFee" placeholder="0" />
            </div>
            <div class="form-group span-2">
              <label>{{ t('admin.notes', 'Ghi chú') }}</label>
              <textarea v-model="shipForm.notes" rows="2" placeholder="Ghi chú vận đơn..."></textarea>
            </div>
          </div>
          <button v-if="shipForm.carrier !== 'manual'" class="btn-calc-fee" @click="calcFee" :disabled="calcingFee" style="margin-top:12px;width:100%;padding:10px;border:none;border-radius:8px;background:var(--accent-gradient);color:#fff;font-weight:700;cursor:pointer;opacity:1" :style="{ opacity: calcingFee ? 0.6 : 1 }">
            <Calculator :size="14" v-if="!calcingFee" /> {{ calcingFee ? 'Đang tính...' : 'Tính phí tự động' }}
          </button>
        </div>

        <!-- Step 3: Confirm -->
        <div v-if="createStep === 3">
          <div class="confirm-summary">
            <h4>Xác nhận thông tin vận đơn</h4>
            <div class="confirm-grid">
              <div class="confirm-item"><span>Người nhận:</span><strong>{{ shipForm.receiverName }}</strong></div>
              <div class="confirm-item"><span>SĐT:</span><strong>{{ shipForm.receiverPhone }}</strong></div>
              <div class="confirm-item span-2"><span>Địa chỉ:</span><strong>{{ shipForm.receiverAddress }}, {{ shipForm.receiverWard }}, {{ shipForm.receiverDistrict }}, {{ shipForm.receiverProvince }}</strong></div>
              <div class="confirm-item"><span>ĐVVC:</span><strong>{{ carrierLabels[shipForm.carrier] }}</strong></div>
              <div class="confirm-item"><span>Phí ship:</span><strong class="price">{{ formatCurrency(shipForm.shippingFee) }}</strong></div>
              <div class="confirm-item"><span>COD:</span><strong class="price">{{ formatCurrency(shipForm.codAmount) }}</strong></div>
              <div class="confirm-item"><span>Khối lượng:</span><strong>{{ shipForm.weight }}g</strong></div>
              <div class="confirm-item span-2" v-if="shipForm.notes"><span>Ghi chú:</span><strong>{{ shipForm.notes }}</strong></div>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <button class="btn-cancel" @click="showCreateModal = false">{{ t('admin.cancel', 'Hủy') }}</button>
          <button v-if="createStep > 1" class="btn-secondary-action" @click="createStep--">← Quay lại</button>
          <button v-if="createStep < 3" class="btn-create" @click="nextStep">Tiếp theo →</button>
          <button v-if="createStep === 3" class="btn-create" @click="createShipment"><Truck :size="14" /> Tạo vận đơn</button>
        </div>
      </div>
    </div>

    <!-- Update Status Modal -->
    <div class="modal-overlay" v-if="showStatusModal" @click.self="showStatusModal = false">
      <div class="modal">
        <h3><RefreshCw :size="16" style="vertical-align:middle" /> Cập nhật trạng thái — #{{ statusShipment?.id }}</h3>
        <div class="status-flow">
          <button
            v-for="(label, key) in statusLabels"
            :key="key"
            class="status-flow__btn"
            :class="{ active: statusNewValue === key, current: statusShipment?.status === key }"
            @click="statusNewValue = key"
          >{{ label }}</button>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label>{{ t('admin.description', 'Mô tả') }}</label>
          <input v-model="statusDescription" placeholder="Mô tả trạng thái..." />
        </div>
        <div class="form-group">
          <label>Vị trí</label>
          <input v-model="statusLocation" placeholder="VD: Kho HCM" />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showStatusModal = false">{{ t('admin.cancel', 'Hủy') }}</button>
          <button class="btn-create" @click="submitStatus">{{ t('admin.update', 'Cập nhật') }}</button>
        </div>
      </div>
    </div>

    <!-- Tracking Modal -->
    <div class="modal-overlay" v-if="showTrackingModal" @click.self="showTrackingModal = false">
      <div class="modal modal--wide">
        <h3><MapPin :size="16" style="vertical-align:middle" /> Theo dõi — #{{ trackingShipment?.id }}</h3>
        <div class="tracking-info">
          <div class="tracking-info__row"><strong>Người nhận:</strong> {{ trackingShipment?.receiverName }} — {{ trackingShipment?.receiverPhone }}</div>
          <div class="tracking-info__row"><strong>Địa chỉ:</strong> {{ trackingShipment?.receiverAddress }}</div>
          <div class="tracking-info__row" v-if="trackingShipment?.trackingCode"><strong>Mã vận đơn:</strong> {{ trackingShipment?.trackingCode }}</div>
        </div>
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
        <div v-else class="empty-state" style="padding:30px 0">
          <MapPin :size="32" class="empty-state__icon" />
          <p class="empty-state__title">Chưa có lịch sử</p>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary-action" @click="printShipmentLabel(trackingShipment)"><Printer :size="14" /> In phiếu gửi</button>
          <button class="btn-cancel" @click="showTrackingModal = false">{{ t('admin.close', 'Đóng') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useSocket } from '../composables/useSocket.js'
import {
  Truck, Plus, Package, DollarSign, CheckCircle, RefreshCw,
  MapPin, Trash2, XCircle, Printer, TrendingUp
} from 'lucide-vue-next'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({ /* tenant-scoped */ })
const emit = defineEmits(['navigate'])

const shipments = ref([])
const shipStats = ref({ total: 0, totalFees: 0, statusCounts: {} })
const searchTerm = ref('')
const filterStatus = useUrlParam('ship_status', '')
const filterCarrier = useUrlParam('ship_carrier', '')

const showCreateModal = ref(false)
const showStatusModal = ref(false)
const showTrackingModal = ref(false)
const createStep = ref(1)

const statusShipment = ref(null)
const statusNewValue = ref('')
const statusDescription = ref('')
const statusLocation = ref('')
const trackingShipment = ref(null)
const trackingHistory = ref([])
const orderLookupId = ref(null)
const orderLookupResult = ref(null)

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

const carriers = [
  { key: 'manual', name: 'Thủ công', desc: 'Tự giao hoặc nhập tay' },
  { key: 'ghn', name: 'GHN', desc: 'Giao Hàng Nhanh' },
  { key: 'ghtk', name: 'GHTK', desc: 'Giao Hàng Tiết Kiệm' },
  { key: 'viettel_post', name: 'Viettel Post', desc: 'Viettel Post' },
]

const defaultForm = () => ({
  orderId: null, carrier: 'manual',
  receiverName: '', receiverPhone: '', receiverAddress: '',
  receiverWard: '', receiverDistrict: '', receiverProvince: '',
  shippingFee: 0, codAmount: 0, weight: 500, insuranceFee: 0, notes: '',
})
const shipForm = ref(defaultForm())

const deliveryRate = computed(() => {
  const total = shipStats.value.total || 0
  const delivered = shipStats.value.statusCounts?.delivered || 0
  if (total === 0) return 0
  return ((delivered / total) * 100).toFixed(1)
})

const displayedShipments = computed(() => {
  if (!searchTerm.value) return shipments.value
  const s = searchTerm.value.toLowerCase()
  return shipments.value.filter(sh =>
    (sh.receiverName || '').toLowerCase().includes(s) ||
    (sh.receiverPhone || '').includes(s) ||
    (sh.trackingCode || '').toLowerCase().includes(s) ||
    String(sh.id).includes(s)
  )
})

onMounted(() => { fetchShipments(); fetchStats(); setupSocketListeners() })
watch([filterStatus, filterCarrier], () => fetchShipments())

const calcingFee = ref(false)

async function calcFee() {
  calcingFee.value = true
  try {
    const res = await apiFetch('/shipping/calculate-fee', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        carrier: shipForm.value.carrier,
        weight: shipForm.value.weight || 500,
        codAmount: shipForm.value.codAmount || 0
      }),
    })
    const data = await res.json()
    if (data.fee !== undefined) {
      shipForm.value.shippingFee = data.fee
      showToast('Đã tính phí: ' + data.fee.toLocaleString('vi-VN') + 'đ', 'success')
    } else {
      showToast(data.error || 'Không tính được phí', 'error')
    }
  } catch (e) {
    showToast('Lỗi tính phí: ' + e.message, 'error')
  } finally {
    calcingFee.value = false
  }
}

// Socket auto-refresh for shipment events
function setupSocketListeners() {
  try {
    const { socket } = useSocket()
    if (socket?.value) {
      socket.value.on('shipment_updated', () => { fetchShipments(); fetchStats() })
      socket.value.on('shipment_created', () => { fetchShipments(); fetchStats() })
    }
  } catch { /* socket not available */ }
}

const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
function mapKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(mapKeys)
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
}

async function fetchShipments() {
  try {
    let url = `/shipments?`
    if (filterStatus.value) url += `status=${filterStatus.value}&`
    if (filterCarrier.value) url += `carrier=${filterCarrier.value}&`
    const res = await apiFetch(url)
    const raw = await res.json()
    shipments.value = Array.isArray(raw) ? raw.map(mapKeys) : []
  } catch { shipments.value = [] }
}

async function fetchStats() {
  try {
    let url = `/shipments/stats`
    const res = await apiFetch(url)
    shipStats.value = await res.json()
  } catch { /* silent */ }
}

function openCreateModal(orderId) {
  shipForm.value = defaultForm()
  createStep.value = 1
  orderLookupId.value = orderId || null
  orderLookupResult.value = null
  showCreateModal.value = true
  if (orderId) lookupOrder()
}

function nextStep() {
  if (createStep.value === 1) {
    if (!shipForm.value.receiverName || !shipForm.value.receiverPhone) {
      return showToast('Vui lòng nhập tên và SĐT người nhận', 'error')
    }
  }
  createStep.value++
}

async function lookupOrder() {
  if (!orderLookupId.value) return
  try {
    const res = await apiFetch(`/orders/${orderLookupId.value}`)
    orderLookupResult.value = mapKeys(await res.json())
  } catch {
    orderLookupResult.value = null
    showToast('Không tìm thấy đơn hàng', 'error')
  }
}

function fillFromOrder() {
  if (!orderLookupResult.value) return
  const o = orderLookupResult.value
  shipForm.value.orderId = o.id
  shipForm.value.receiverName = o.customerName || ''
  shipForm.value.receiverPhone = o.customerPhone || ''
  shipForm.value.receiverAddress = o.customerAddress || ''
  shipForm.value.codAmount = o.totalAmount || 0
  showToast('Đã điền thông tin từ đơn hàng', 'success')
}

async function createShipment() {
  try {
    await apiFetch('/shipments', {
      method: 'POST',
      body: JSON.stringify({ ...shipForm.value }),
    })
    showToast('Đã tạo vận đơn', 'success')
    showCreateModal.value = false
    fetchShipments()
    fetchStats()
  } catch (err) { showToast('Lỗi: ' + err.message, 'error') }
}

function openStatusModal(shipment) {
  statusShipment.value = shipment
  statusNewValue.value = shipment.status
  statusDescription.value = ''
  statusLocation.value = ''
  showStatusModal.value = true
}

async function submitStatus() {
  try {
    await apiFetch(`/shipments/${statusShipment.value.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({
        status: statusNewValue.value,
        description: statusDescription.value,
        location: statusLocation.value,
      }),
    })
    showToast(`Đã cập nhật: ${statusLabels[statusNewValue.value]}`, 'success')
    showStatusModal.value = false
    fetchShipments()
    fetchStats()
  } catch (err) { showToast('Lỗi: ' + err.message, 'error') }
}

async function openTrackingModal(shipment) {
  trackingShipment.value = shipment
  showTrackingModal.value = true
  try {
    const res = await apiFetch(`/shipments/${shipment.id}/tracking`)
    trackingHistory.value = await res.json()
  } catch { trackingHistory.value = [] }
}

async function cancelShipment(s) {
  if (!confirm(`Hủy vận đơn #${s.id}?`)) return
  try {
    await apiFetch(`/shipments/${s.id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled', description: 'Hủy vận đơn' }),
    })
    showToast('Đã hủy vận đơn', 'success')
    fetchShipments()
    fetchStats()
  } catch { showToast('Lỗi hủy vận đơn', 'error') }
}

async function deleteShipment(s) {
  if (!confirm(`Xóa vận đơn #${s.id}?`)) return
  try {
    await apiFetch(`/shipments/${s.id}`, { method: 'DELETE' })
    showToast('Đã xóa vận đơn', 'success')
    fetchShipments()
    fetchStats()
  } catch { showToast('Lỗi xóa vận đơn', 'error') }
}

function printShipmentLabel(s) {
  if (!s) return
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
      @media print { body { padding:10px; } }
    </style>
  </head><body>
    <div class="header">
      <h1>Phiếu Gửi Hàng</h1>
      <p>${carrierLabels[s.carrier] || s.carrier} — ${new Date().toLocaleDateString('vi-VN')}</p>
    </div>
    <div class="barcode">${s.trackingCode || `VD-${String(s.id).padStart(6,'0')}`}</div>
    <div class="section">
      <div class="section-title">Người gửi</div>
      <div class="row"><span class="label">Tên:</span><span class="value">${s.senderName || 'Shop'}</span></div>
      <div class="row"><span class="label">SĐT:</span><span class="value">${s.senderPhone || '—'}</span></div>
    </div>
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
    ${s.notes ? `<div class="section"><div class="section-title">Ghi chú</div><p>${s.notes}</p></div>` : ''}
    <div class="footer">In lúc ${new Date().toLocaleString('vi-VN')} — AI Live Tool</div>
  </body></html>`)
  win.document.close()
  setTimeout(() => win.print(), 300)
}

// Expose for parent to call (from OrderManagement)
defineExpose({ openCreateModal })

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.shipping-management { padding: 24px; overflow-y: auto; height: 100%; }
.ship-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px; flex-wrap: wrap; gap: 12px;
}
.ship-header h2 { margin: 0; font-size: 20px; font-weight: 800; }
.header-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.search-input {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; min-width: 180px; outline: none; transition: border-color 0.2s;
}
.search-input:focus { border-color: var(--color-accent-primary); }
.search-input::placeholder { color: var(--color-text-muted); }
.filter-select {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px;
  font-size: 13px; outline: none; transition: border-color 0.2s;
}
.filter-select:focus { border-color: var(--color-accent-primary); }
.filter-select option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.btn-add {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 18px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
}
.btn-add:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }

/* Stats */
.ship-stats {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.stat-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 18px; text-align: center;
  position: relative; overflow: hidden; transition: all 0.3s;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; opacity: 0.6;
}
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); box-shadow: var(--shadow-card); }
.stat-value { font-size: 24px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; letter-spacing: 0.3px; }
.stat-card.revenue .stat-value { color: #34d399; }
.stat-card.revenue::before { background: linear-gradient(90deg, transparent, #34d399, transparent); }
.stat-card.warning .stat-value { color: #fbbf24; }
.stat-card.warning::before { background: linear-gradient(90deg, transparent, #fbbf24, transparent); }
.stat-icon {
  width: 40px; height: 40px; border-radius: 10px; display: flex;
  align-items: center; justify-content: center; margin: 0 auto 8px;
}
.stat-icon--total { background: var(--color-accent-glow); color: var(--accent-light); }
.stat-icon--fee { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--transit { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-icon--delivered { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--rate { background: rgba(96,165,250,0.12); color: #60a5fa; }

/* Table */
.ship-table { overflow-x: auto; }
table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th {
  padding: 12px 14px; text-align: left; color: var(--color-text-muted);
  font-weight: 700; font-size: 11px; text-transform: uppercase;
  letter-spacing: 0.5px; border-bottom: 1px solid var(--color-border);
}
td { padding: 12px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.name-cell { font-weight: 600; }
.tracking-code { font-family: 'SF Mono', monospace; font-size: 12px; color: var(--accent-light); }
.price { font-weight: 700; color: #34d399; }

.carrier-badge {
  padding: 3px 8px; border-radius: 6px; font-size: 11px; font-weight: 700;
}
.carrier-badge.manual { background: rgba(148,163,184,0.1); color: #94a3b8; }
.carrier-badge.ghn { background: rgba(245,158,11,0.1); color: #f59e0b; }
.carrier-badge.ghtk { background: rgba(52,211,153,0.1); color: #34d399; }
.carrier-badge.viettel_post { background: rgba(239,68,68,0.1); color: #ef4444; }

.status-badge {
  padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
}
.status-badge.draft { background: rgba(148,163,184,0.1); color: #94a3b8; }
.status-badge.pending { background: rgba(245,158,11,0.1); color: #fbbf24; }
.status-badge.picked_up { background: rgba(59,130,246,0.1); color: #60a5fa; }
.status-badge.in_transit { background: rgba(168,85,247,0.1); color: #c4b5fd; }
.status-badge.out_for_delivery { background: rgba(251,191,36,0.1); color: #fbbf24; }
.status-badge.delivered { background: rgba(52,211,153,0.1); color: #34d399; }
.status-badge.returned { background: rgba(239,68,68,0.1); color: #fca5a5; }
.status-badge.cancelled { background: rgba(239,68,68,0.1); color: #f87171; }

.action-btns { display: flex; gap: 4px; flex-wrap: wrap; }

.empty { text-align: center; color: var(--color-text-muted); padding: 40px; }
.empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.empty-state__icon { color: var(--color-text-muted); opacity: 0.4; }
.empty-state__title { font-size: 15px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state__sub { font-size: 13px; color: var(--color-text-muted); margin: 0; }

/* Modals */
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
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.form-group { margin-bottom: 0; }
.form-group.span-2 { grid-column: span 2; }
.form-group label { display: block; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 6px; font-weight: 700; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  color: var(--color-text-primary); padding: 10px 14px; border-radius: 10px; font-size: 13px;
  font-family: inherit; box-sizing: border-box; outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group textarea:focus, .form-group select:focus { border-color: var(--color-accent-primary); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }
.btn-cancel {
  background: var(--color-bg-card-solid); color: var(--color-text-secondary); border: 1px solid var(--color-border);
  padding: 10px 20px; border-radius: 10px; cursor: pointer; font-weight: 600; transition: all 0.2s;
}
.btn-cancel:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.btn-create {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 24px; border-radius: 10px; font-weight: 700; cursor: pointer;
  transition: all 0.25s; box-shadow: var(--accent-shadow);
  display: inline-flex; align-items: center; gap: 6px;
}
.btn-create:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-secondary-action {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 16px; border-radius: 10px;
  font-weight: 600; cursor: pointer; font-size: 13px;
  display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;
}
.btn-secondary-action:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

/* Step indicator */
.step-indicator {
  display: flex; align-items: center; justify-content: center; gap: 0;
  margin-bottom: 24px; padding: 16px 0;
}
.step {
  display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
  color: var(--color-text-muted); transition: all 0.3s;
}
.step span {
  width: 24px; height: 24px; border-radius: 50%; display: flex;
  align-items: center; justify-content: center; font-size: 11px; font-weight: 800;
  border: 2px solid var(--glass-border); background: var(--glass-bg); transition: all 0.3s;
}
.step.active { color: var(--accent-light); }
.step.active span { background: var(--accent-gradient); color: #fff; border-color: transparent; }
.step.done span { background: #34d399; color: #fff; border-color: transparent; }
.step.done { color: #34d399; }
.step-line { width: 40px; height: 2px; background: var(--glass-border); margin: 0 8px; }

/* Order lookup */
.order-lookup { display: flex; gap: 8px; }
.order-lookup input { flex: 1; }
.btn-lookup {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); padding: 10px 16px; border-radius: 10px;
  font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap;
}
.btn-lookup:hover:not(:disabled) { border-color: var(--color-accent-primary); color: var(--color-text-primary); }
.btn-lookup:disabled { opacity: 0.4; cursor: not-allowed; }
.order-found {
  margin-top: 10px; padding: 10px 14px; border-radius: 10px;
  background: rgba(52,211,153,0.06); border: 1px solid rgba(52,211,153,0.15);
  display: flex; align-items: center; gap: 8px; font-size: 13px; flex-wrap: wrap;
}
.btn-fill {
  margin-left: auto; background: linear-gradient(135deg, #34d399, #059669); color: #fff;
  border: none; padding: 5px 12px; border-radius: 8px; font-size: 11px;
  font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-fill:hover { transform: scale(1.02); }

/* Carrier selector */
.carrier-selector { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.carrier-card {
  padding: 16px; border-radius: 12px; cursor: pointer; text-align: center;
  background: var(--glass-bg); border: 2px solid var(--glass-border); transition: all 0.2s;
}
.carrier-card:hover { border-color: var(--color-border-hover); }
.carrier-card.selected {
  border-color: var(--color-accent-primary); background: var(--color-accent-glow);
  box-shadow: var(--accent-shadow);
}
.carrier-card__icon { color: var(--color-text-muted); margin-bottom: 6px; }
.carrier-card.selected .carrier-card__icon { color: var(--accent-light); }
.carrier-card__name { font-weight: 800; font-size: 14px; }
.carrier-card__desc { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }

/* Confirm summary */
.confirm-summary { padding: 16px; border-radius: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border); }
.confirm-summary h4 { margin: 0 0 14px 0; font-weight: 800; font-size: 14px; }
.confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.confirm-item { font-size: 13px; }
.confirm-item.span-2 { grid-column: span 2; }
.confirm-item span { color: var(--color-text-muted); display: block; font-size: 11px; margin-bottom: 2px; }
.confirm-item strong { color: var(--color-text-primary); }
.confirm-item strong.price { color: #34d399; }

/* Status flow buttons */
.status-flow { display: flex; flex-wrap: wrap; gap: 8px; }
.status-flow__btn {
  padding: 8px 14px; border-radius: 10px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.2s;
}
.status-flow__btn.current { border-color: var(--accent-light); color: var(--accent-light); }
.status-flow__btn.active {
  background: var(--accent-gradient); color: #fff;
  border-color: transparent; box-shadow: var(--accent-shadow);
}

/* Tracking info + timeline */
.tracking-info {
  margin-bottom: 16px; padding: 14px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.tracking-info__row { font-size: 13px; margin-bottom: 4px; }
.tracking-timeline { max-height: 400px; overflow-y: auto; }
.tracking-item {
  display: flex; gap: 14px; padding: 12px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}
.tracking-dot { width: 10px; height: 10px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.tracking-dot.draft { background: #94a3b8; }
.tracking-dot.pending { background: #fbbf24; }
.tracking-dot.picked_up { background: #60a5fa; }
.tracking-dot.in_transit { background: var(--accent-light); }
.tracking-dot.out_for_delivery { background: #fbbf24; }
.tracking-dot.delivered { background: #34d399; }
.tracking-dot.returned, .tracking-dot.cancelled { background: #f87171; }
.tracking-content { flex: 1; min-width: 0; }
.tracking-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tracking-badge {
  padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.tracking-badge.draft { background: rgba(148,163,184,0.1); color: #94a3b8; }
.tracking-badge.pending { background: rgba(245,158,11,0.1); color: #fbbf24; }
.tracking-badge.picked_up { background: rgba(59,130,246,0.1); color: #60a5fa; }
.tracking-badge.in_transit { background: rgba(168,85,247,0.1); color: #c4b5fd; }
.tracking-badge.out_for_delivery { background: rgba(251,191,36,0.1); color: #fbbf24; }
.tracking-badge.delivered { background: rgba(52,211,153,0.1); color: #34d399; }
.tracking-badge.returned, .tracking-badge.cancelled { background: rgba(239,68,68,0.1); color: #f87171; }
.tracking-source { font-size: 10px; color: var(--color-text-muted); font-style: italic; }
.tracking-desc { font-size: 12px; color: var(--color-text-secondary); }
.tracking-loc { font-size: 12px; color: var(--color-text-muted); margin-top: 2px; }
.tracking-time { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }
</style>
