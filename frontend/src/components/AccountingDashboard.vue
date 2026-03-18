<template>
  <div class="acc">
    <!-- Date Range Filter -->
    <div class="acc-filter">
      <div class="acc-filter__dates">
        <input type="date" v-model="dateFrom" class="acc-input" />
        <span class="acc-filter__sep">→</span>
        <input type="date" v-model="dateTo" class="acc-input" />
        <button class="acc-btn acc-btn--sm" @click="loadAll">Áp dụng</button>
      </div>
      <div class="acc-filter__tabs">
        <button v-for="t in tabs" :key="t.key" :class="['acc-tab', { active: activeTab === t.key }]" @click="activeTab = t.key">
          <component :is="t.icon" :size="13" /> {{ t.label }}
        </button>
      </div>
    </div>

    <!-- ═══ Tab: Tổng Quan ═══ -->
    <template v-if="activeTab === 'overview'">
      <div class="acc-cards">
        <div class="acc-card acc-card--revenue">
          <div class="acc-card__icon"><TrendingUp :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">Doanh thu</span>
            <span class="acc-card__value">{{ formatPrice(summary.revenue) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--expense">
          <div class="acc-card__icon"><TrendingDown :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">Chi phí</span>
            <span class="acc-card__value">{{ formatPrice(summary.expenses) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--profit">
          <div class="acc-card__icon"><DollarSign :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">Lợi nhuận</span>
            <span class="acc-card__value">{{ formatPrice(summary.profit) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--tax">
          <div class="acc-card__icon"><Receipt :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">Thuế phải nộp</span>
            <span class="acc-card__value">{{ formatPrice(summary.tax_payable) }}</span>
          </div>
        </div>
      </div>

      <!-- Monthly Chart (simple bar visualization) -->
      <div class="acc-section">
        <h4 class="acc-section__title"><BarChart2 :size="14" /> Biểu đồ theo tháng</h4>
        <div class="acc-chart">
          <div v-for="m in monthly" :key="m.month" class="acc-chart__bar-group">
            <div class="acc-chart__bars">
              <div class="acc-chart__bar acc-chart__bar--revenue" :style="{ height: barH(m.revenue) }" :title="'DT: ' + formatPrice(m.revenue)"></div>
              <div class="acc-chart__bar acc-chart__bar--expense" :style="{ height: barH(m.expenses) }" :title="'CP: ' + formatPrice(m.expenses)"></div>
              <div class="acc-chart__bar acc-chart__bar--tax" :style="{ height: barH(m.tax) }" :title="'Thuế: ' + formatPrice(m.tax)"></div>
            </div>
            <span class="acc-chart__label">T{{ m.month }}</span>
          </div>
        </div>
        <div class="acc-chart__legend">
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#10b981"></span> Doanh thu</span>
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#ef4444"></span> Chi phí</span>
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#8b5cf6"></span> Thuế</span>
        </div>
      </div>
    </template>

    <!-- ═══ Tab: Báo Cáo Thuế ═══ -->
    <template v-if="activeTab === 'tax'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><Receipt :size="14" /> Báo cáo thuế năm {{ taxYear }}</h4>
          <div class="acc-section__actions">
            <button class="acc-btn acc-btn--sm" @click="exportTaxCSV" title="Xuất CSV"><Download :size="12" /> CSV</button>
            <button class="acc-btn acc-btn--sm" @click="taxYear--; loadTaxReport()">←</button>
            <span>{{ taxYear }}</span>
            <button class="acc-btn acc-btn--sm" @click="taxYear++; loadTaxReport()">→</button>
          </div>
        </div>
        <table class="acc-table" v-if="taxReport.length">
          <thead>
            <tr>
              <th>Tháng</th>
              <th>Doanh thu</th>
              <th>Thuế thu</th>
              <th>Thuế hoàn</th>
              <th>Thuế phải nộp</th>
              <th>Đơn hàng</th>
              <th>Hoàn trả</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in taxReport" :key="r.month">
              <td>Tháng {{ r.month }}</td>
              <td>{{ formatPrice(r.total_sales) }}</td>
              <td class="acc-cell--green">{{ formatPrice(r.tax_collected) }}</td>
              <td class="acc-cell--red">{{ formatPrice(r.tax_refunded) }}</td>
              <td><strong>{{ formatPrice(r.tax_payable) }}</strong></td>
              <td>{{ r.order_count }}</td>
              <td>{{ r.refund_count }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td><strong>Tổng</strong></td>
              <td><strong>{{ formatPrice(taxReport.reduce((s,r) => s + r.total_sales, 0)) }}</strong></td>
              <td class="acc-cell--green"><strong>{{ formatPrice(taxReport.reduce((s,r) => s + r.tax_collected, 0)) }}</strong></td>
              <td class="acc-cell--red"><strong>{{ formatPrice(taxReport.reduce((s,r) => s + r.tax_refunded, 0)) }}</strong></td>
              <td><strong>{{ formatPrice(taxReport.reduce((s,r) => s + r.tax_payable, 0)) }}</strong></td>
              <td><strong>{{ taxReport.reduce((s,r) => s + r.order_count, 0) }}</strong></td>
              <td><strong>{{ taxReport.reduce((s,r) => s + r.refund_count, 0) }}</strong></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <!-- ═══ Tab: Sổ Thu Chi ═══ -->
    <template v-if="activeTab === 'entries'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><BookOpen :size="14" /> Sổ thu chi</h4>
          <div style="display:flex;gap:6px">
            <button class="acc-btn acc-btn--sm" @click="exportEntriesCSV" title="Xuất CSV"><Download :size="12" /> CSV</button>
            <button class="acc-btn acc-btn--primary acc-btn--sm" @click="openEntryForm()">
              <Plus :size="13" /> Thêm bút toán
            </button>
          </div>
        </div>

        <div class="acc-entries-filter">
          <select v-model="entryFilter.type" class="acc-select" @change="loadEntries">
            <option value="">Tất cả loại</option>
            <option value="revenue">Thu</option>
            <option value="expense">Chi</option>
            <option value="adjustment">Điều chỉnh</option>
          </select>
        </div>

        <table class="acc-table" v-if="entries.length">
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Loại</th>
              <th>Danh mục</th>
              <th>Mô tả</th>
              <th>Số tiền</th>
              <th>Thuế</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in entries" :key="e.id">
              <td>{{ formatDate(e.entry_date) }}</td>
              <td>
                <span class="acc-badge" :class="'acc-badge--' + e.type">
                  {{ { revenue: 'Thu', expense: 'Chi', adjustment: 'Đ/C' }[e.type] }}
                </span>
              </td>
              <td>{{ categoryLabel(e.category) }}</td>
              <td class="acc-cell--desc">{{ e.description }}</td>
              <td :class="{ 'acc-cell--green': e.amount > 0, 'acc-cell--red': e.amount < 0 }">
                {{ formatPrice(Math.abs(e.amount)) }}
              </td>
              <td>{{ e.tax_amount > 0 ? formatPrice(e.tax_amount) : '—' }}</td>
              <td class="acc-cell--actions">
                <button v-if="!e.reference_type" class="acc-action-btn acc-action-btn--danger" @click="deleteEntry(e)" title="Xoá"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="acc-empty">Chưa có bút toán nào.</div>
      </div>
    </template>

    <!-- ═══ Tab: Hoá Đơn ═══ -->
    <template v-if="activeTab === 'invoices'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><FileText :size="14" /> Hoá đơn</h4>
        </div>
        <table class="acc-table" v-if="invoices.length">
          <thead>
            <tr>
              <th>Số HĐ</th>
              <th>Khách hàng</th>
              <th>Tổng tiền</th>
              <th>Thuế</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inv in invoices" :key="inv.id">
              <td><code>{{ inv.invoice_number }}</code></td>
              <td>{{ inv.customer_name }}</td>
              <td><strong>{{ formatPrice(inv.total_amount) }}</strong></td>
              <td>{{ inv.tax_amount > 0 ? formatPrice(inv.tax_amount) : '—' }}</td>
              <td>
                <span class="acc-badge" :class="'acc-badge--' + inv.status">
                  {{ statusLabel(inv.status) }}
                </span>
              </td>
              <td>{{ formatDate(inv.created_at) }}</td>
              <td class="acc-cell--actions">
                <button class="acc-action-btn" @click="openInvoicePdf(inv.id)" title="Xem/Tải PDF"><Download :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="acc-empty">Chưa có hoá đơn nào.</div>
      </div>
    </template>

    <!-- ═══ Tab: Cài Đặt ═══ -->
    <template v-if="activeTab === 'settings'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><Settings :size="14" /> Cài đặt kế toán</h4>
          <button class="acc-btn acc-btn--primary acc-btn--sm" @click="saveConfig" :disabled="savingConfig">
            <Save :size="13" /> {{ savingConfig ? 'Đang lưu...' : 'Lưu cấu hình' }}
          </button>
        </div>

        <div class="acc-settings">
          <!-- Auto Email -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">Hoá đơn & Email</h5>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>Tự động gửi email hoá đơn</label>
                <select v-model="accConfig.auto_email" class="acc-select">
                  <option value="true">Bật — gửi khi đơn delivered</option>
                  <option value="false">Tắt</option>
                </select>
              </div>
              <div class="acc-form-row">
                <label>Tiền tố hoá đơn</label>
                <input type="text" v-model="accConfig.invoice_prefix" class="acc-input" placeholder="INV" />
                <span class="acc-form-hint">VD: INV → INV-2026-00001, HD → HD-2026-00001</span>
              </div>
            </div>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>Hạn thanh toán mặc định</label>
                <select v-model="accConfig.payment_terms" class="acc-select">
                  <option value="0">Không có hạn</option>
                  <option value="7">7 ngày</option>
                  <option value="14">14 ngày</option>
                  <option value="30">30 ngày</option>
                </select>
              </div>
              <div class="acc-form-row">
                <label>Nội dung footer hoá đơn</label>
                <input type="text" v-model="accConfig.footer_text" class="acc-input" placeholder="Cảm ơn quý khách!" />
              </div>
            </div>
          </div>

          <!-- Tax Label -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">Thuế</h5>
            <div class="acc-form-row" style="max-width:320px">
              <label>Nhãn thuế hiển thị</label>
              <input type="text" v-model="accConfig.tax_label" class="acc-input" placeholder="VAT" />
              <span class="acc-form-hint">Hiển trên storefront: "+ VAT", "Đã gồm VAT"</span>
            </div>
          </div>

          <!-- Custom Categories -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">Danh mục kế toán tuỳ chỉnh</h5>
            <p class="acc-form-hint" style="margin-bottom:10px">Thêm danh mục ngoài mặc định (Doanh thu ĐH, Phí VC, Hoàn trả...)</p>
            <div v-for="(cat, ci) in customCategories" :key="ci" class="acc-custom-cat">
              <input type="text" v-model="cat.key" class="acc-input" placeholder="key (vd: office)" style="flex:1" />
              <input type="text" v-model="cat.label" class="acc-input" placeholder="Tên (vd: Văn phòng)" style="flex:1.5" />
              <button class="acc-action-btn acc-action-btn--danger" @click="customCategories.splice(ci, 1)">
                <Trash2 :size="13" />
              </button>
            </div>
            <button class="acc-btn acc-btn--sm" @click="customCategories.push({ key: '', label: '' })" style="margin-top:6px">
              <Plus :size="12" /> Thêm danh mục
            </button>
          </div>

          <!-- Seller Info -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">Thông tin người bán (hiển trên hoá đơn)</h5>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>Tên cửa hàng / Công ty</label>
                <input type="text" v-model="accConfig.seller_name" class="acc-input" />
              </div>
              <div class="acc-form-row">
                <label>Mã số thuế</label>
                <input type="text" v-model="accConfig.seller_tax_id" class="acc-input" placeholder="VD: 0123456789" />
              </div>
            </div>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>SĐT</label>
                <input type="text" v-model="accConfig.seller_phone" class="acc-input" />
              </div>
              <div class="acc-form-row">
                <label>Email</label>
                <input type="text" v-model="accConfig.seller_email" class="acc-input" />
              </div>
            </div>
            <div class="acc-form-row">
              <label>Địa chỉ</label>
              <input type="text" v-model="accConfig.seller_address" class="acc-input" />
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Entry Form Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showEntryForm" class="acc-modal-overlay" @click.self="showEntryForm = false">
          <div class="acc-modal">
            <div class="acc-modal__header">
              <h4>Thêm bút toán</h4>
              <button class="acc-modal__close" @click="showEntryForm = false"><X :size="16" /></button>
            </div>
            <div class="acc-modal__body">
              <div class="acc-form-row">
                <label>Loại *</label>
                <select v-model="entryForm.type" class="acc-select">
                  <option value="revenue">Thu (revenue)</option>
                  <option value="expense">Chi (expense)</option>
                  <option value="adjustment">Điều chỉnh</option>
                </select>
              </div>
              <div class="acc-form-grid">
                <div class="acc-form-row">
                  <label>Danh mục *</label>
                  <select v-model="entryForm.category" class="acc-select">
                    <option value="order_revenue">Doanh thu đơn hàng</option>
                    <option value="shipping_cost">Phí vận chuyển</option>
                    <option value="refund">Hoàn trả</option>
                    <option value="marketing">Marketing</option>
                    <option value="salary">Lương</option>
                    <option value="rent">Thuê mặt bằng</option>
                    <option value="supplies">Vật tư</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <div class="acc-form-row">
                  <label>Ngày *</label>
                  <input type="date" v-model="entryForm.entry_date" class="acc-input" />
                </div>
              </div>
              <div class="acc-form-grid">
                <div class="acc-form-row">
                  <label>Số tiền *</label>
                  <input type="number" v-model.number="entryForm.amount" class="acc-input" step="1000" />
                </div>
                <div class="acc-form-row">
                  <label>Thuế</label>
                  <input type="number" v-model.number="entryForm.tax_amount" class="acc-input" step="100" />
                </div>
              </div>
              <div class="acc-form-row">
                <label>Mô tả</label>
                <input type="text" v-model="entryForm.description" class="acc-input" placeholder="VD: Chi phí quảng cáo T3/2026" />
              </div>
            </div>
            <div class="acc-modal__footer">
              <button class="acc-btn" @click="showEntryForm = false">Huỷ</button>
              <button class="acc-btn acc-btn--primary" @click="saveEntry" :disabled="savingEntry">
                <Save :size="13" /> {{ savingEntry ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2,
  BookOpen, FileText, Plus, Trash2, Save, X, Download, Settings,
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()

const tabs = [
  { key: 'overview', label: 'Tổng quan', icon: BarChart2 },
  { key: 'tax', label: 'Báo cáo thuế', icon: Receipt },
  { key: 'entries', label: 'Sổ thu chi', icon: BookOpen },
  { key: 'invoices', label: 'Hoá đơn', icon: FileText },
  { key: 'settings', label: 'Cài đặt', icon: Settings },
]
const activeTab = ref('overview')

// Dates
const dateFrom = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const dateTo = ref(new Date().toISOString().slice(0, 10))

// Data
const summary = ref({ revenue: 0, expenses: 0, profit: 0, tax_payable: 0, tax_collected: 0, adjustments: 0 })
const monthly = ref([])
const taxReport = ref([])
const taxYear = ref(new Date().getFullYear())
const entries = ref([])
const invoices = ref([])
const entryFilter = ref({ type: '' })
const showEntryForm = ref(false)
const savingEntry = ref(false)
const entryForm = ref({ type: 'expense', category: 'other', amount: 0, tax_amount: 0, description: '', entry_date: new Date().toISOString().slice(0, 10) })

// Config
const accConfig = ref({
  auto_email: 'true',
  invoice_prefix: 'INV',
  payment_terms: '0',
  tax_label: 'VAT',
  footer_text: 'Cảm ơn quý khách!',
  custom_categories: '[]',
  seller_name: '',
  seller_phone: '',
  seller_email: '',
  seller_address: '',
  seller_tax_id: '',
})
const customCategories = ref([])
const savingConfig = ref(false)

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

const catLabels = {
  order_revenue: 'Doanh thu ĐH', shipping_cost: 'Phí VC', refund: 'Hoàn trả',
  marketing: 'Marketing', salary: 'Lương', rent: 'Thuê MB', supplies: 'Vật tư', other: 'Khác', tax: 'Thuế',
}
function categoryLabel(c) { return catLabels[c] || c }

const statusLabels = { draft: 'Nháp', issued: 'Đã xuất', paid: 'Đã TT', cancelled: 'Huỷ' }
function statusLabel(s) { return statusLabels[s] || s }

function barH(val) {
  const max = Math.max(...monthly.value.map(m => Math.max(m.revenue, m.expenses, m.tax)), 1)
  return Math.max(4, (val / max) * 120) + 'px'
}

// API calls
async function fetchJSON(url) {
  try {
    const res = await apiFetch(url)
    const data = await res.json()
    return data?.data || data
  } catch { return null }
}

async function loadSummary() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  const data = await fetchJSON(`/accounting/summary?${params}`)
  if (data) summary.value = data
}

async function loadMonthly() {
  const data = await fetchJSON(`/accounting/monthly?year=${taxYear.value}`)
  if (data) monthly.value = data
}

async function loadTaxReport() {
  const data = await fetchJSON(`/accounting/tax-report?year=${taxYear.value}`)
  if (data) taxReport.value = data
}

async function loadEntries() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  if (entryFilter.value.type) params.set('type', entryFilter.value.type)
  params.set('per_page', '50')
  const data = await fetchJSON(`/accounting/entries?${params}`)
  entries.value = data?.items || []
}

async function loadInvoices() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  params.set('per_page', '50')
  const data = await fetchJSON(`/invoices?${params}`)
  invoices.value = data?.items || []
}

async function loadAll() {
  await Promise.all([loadSummary(), loadMonthly(), loadTaxReport(), loadEntries(), loadInvoices()])
}

function openEntryForm() {
  entryForm.value = { type: 'expense', category: 'other', amount: 0, tax_amount: 0, description: '', entry_date: new Date().toISOString().slice(0, 10) }
  showEntryForm.value = true
}

async function saveEntry() {
  if (!entryForm.value.amount || !entryForm.value.entry_date) {
    showToast('Vui lòng nhập số tiền và ngày', 'error'); return
  }
  savingEntry.value = true
  try {
    const res = await apiFetch('/accounting/entries', {
      method: 'POST',
      body: JSON.stringify(entryForm.value),
    })
    if (!res.ok) throw new Error()
    showToast('Đã tạo bút toán', 'success')
    showEntryForm.value = false
    loadAll()
  } catch { showToast('Lỗi tạo bút toán', 'error') }
  savingEntry.value = false
}

async function deleteEntry(e) {
  if (!confirm(`Xoá bút toán "${e.description}"?`)) return
  try {
    const res = await apiFetch(`/accounting/entries/${e.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    showToast('Đã xoá', 'success')
    loadAll()
  } catch { showToast('Lỗi xoá', 'error') }
}

function getApiBaseUrl() {
  // Derive API base from apiFetch base
  const host = window.location.hostname
  const apiBase = host.replace('.cms.', '.api.')
  return `${window.location.protocol}//${apiBase}/api`
}

function exportTaxCSV() {
  const base = getApiBaseUrl()
  window.open(`${base}/accounting/export-tax-report?year=${taxYear.value}`, '_blank')
}

function exportEntriesCSV() {
  const base = getApiBaseUrl()
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  if (entryFilter.value.type) params.set('type', entryFilter.value.type)
  window.open(`${base}/accounting/export-entries?${params}`, '_blank')
}

function openInvoicePdf(id) {
  const base = getApiBaseUrl()
  window.open(`${base}/invoices/${id}/pdf`, '_blank')
}

onMounted(loadAll)

// Config functions
async function loadConfig() {
  const data = await fetchJSON('/accounting/config')
  if (data) {
    accConfig.value = { ...accConfig.value, ...data }
    // Parse custom_categories
    try {
      const cats = typeof data.custom_categories === 'string'
        ? JSON.parse(data.custom_categories)
        : data.custom_categories
      customCategories.value = Array.isArray(cats) ? cats : []
    } catch { customCategories.value = [] }
  }
}

async function saveConfig() {
  savingConfig.value = true
  try {
    // Serialize custom_categories
    accConfig.value.custom_categories = JSON.stringify(
      customCategories.value.filter(c => c.key && c.label)
    )
    const res = await apiFetch('/accounting/config', {
      method: 'PUT',
      body: JSON.stringify(accConfig.value),
    })
    if (!res.ok) throw new Error()
    showToast('Đã lưu cấu hình kế toán', 'success')
  } catch { showToast('Lỗi lưu cấu hình', 'error') }
  savingConfig.value = false
}

loadConfig()
</script>

<style scoped>
.acc { padding: 24px; overflow-y: auto; height: 100%; }

/* Filter bar */
.acc-filter {
  display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;
  margin-bottom: 24px;
}
.acc-filter__dates { display: flex; align-items: center; gap: 8px; }
.acc-filter__sep { color: var(--color-text-muted); font-size: 14px; }
.acc-filter__tabs { display: flex; gap: 6px; flex-wrap: wrap; }
.acc-tab {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.25s;
}
.acc-tab:hover { border-color: var(--color-border-hover); transform: translateY(-1px); }
.acc-tab.active {
  background: var(--accent-gradient); color: #fff; border-color: transparent;
  box-shadow: var(--accent-shadow);
}

/* ═══ Stat Cards ═══ */
.acc-cards {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px; margin-bottom: 24px;
}
.acc-card {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; padding: 20px;
  display: flex; align-items: center; gap: 14px;
  position: relative; overflow: hidden; transition: all 0.3s;
}
.acc-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px; opacity: 0.6;
}
.acc-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.acc-card__icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.acc-card--revenue .acc-card__icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.acc-card--revenue::before { background: linear-gradient(90deg, transparent, #10b981, transparent); }
.acc-card--revenue .acc-card__value { color: #34d399; }

.acc-card--expense .acc-card__icon { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.acc-card--expense::before { background: linear-gradient(90deg, transparent, #ef4444, transparent); }
.acc-card--expense .acc-card__value { color: #ef4444; }

.acc-card--profit .acc-card__icon { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.acc-card--profit::before { background: linear-gradient(90deg, transparent, #3b82f6, transparent); }
.acc-card--profit .acc-card__value { color: #60a5fa; }

.acc-card--tax .acc-card__icon { background: rgba(139, 92, 246, 0.12); color: #8b5cf6; }
.acc-card--tax::before { background: linear-gradient(90deg, transparent, #8b5cf6, transparent); }
.acc-card--tax .acc-card__value { color: #a78bfa; }

.acc-card__body { display: flex; flex-direction: column; }
.acc-card__label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; letter-spacing: 0.3px; }
.acc-card__value { font-size: 22px; font-weight: 800; color: var(--color-text-primary); margin-top: 2px; }

/* ═══ Section ═══ */
.acc-section {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px; overflow: hidden; margin-bottom: 20px;
}
.acc-section__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
}
.acc-section__title {
  font-size: 14px; font-weight: 700; margin: 0;
  display: flex; align-items: center; gap: 8px; color: var(--color-text-primary);
}
.acc-section__actions { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; }

/* ═══ Chart ═══ */
.acc-chart {
  display: flex; align-items: flex-end; gap: 8px;
  padding: 24px 20px 8px; min-height: 170px;
}
.acc-chart__bar-group { display: flex; flex-direction: column; align-items: center; flex: 1; }
.acc-chart__bars { display: flex; gap: 3px; align-items: flex-end; }
.acc-chart__bar {
  width: 16px; border-radius: 4px 4px 0 0; transition: height 0.4s ease;
  cursor: default;
}
.acc-chart__bar--revenue { background: linear-gradient(180deg, #34d399, #10b981); }
.acc-chart__bar--expense { background: linear-gradient(180deg, #f87171, #ef4444); }
.acc-chart__bar--tax { background: linear-gradient(180deg, #a78bfa, #8b5cf6); }
.acc-chart__bar:hover { opacity: 0.85; transform: scaleY(1.03); }
.acc-chart__label { font-size: 10px; color: var(--color-text-muted); margin-top: 6px; font-weight: 600; }
.acc-chart__legend {
  display: flex; gap: 16px; padding: 8px 20px 16px;
  font-size: 11px; color: var(--color-text-muted); font-weight: 600;
}
.acc-legend { display: flex; align-items: center; gap: 5px; }
.acc-legend__dot { width: 8px; height: 8px; border-radius: 2px; }

/* ═══ Table ═══ */
.acc-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.acc-table th {
  padding: 12px 16px; text-align: left; font-weight: 700; font-size: 11px;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
  text-transform: uppercase; letter-spacing: 0.5px;
  background: var(--color-bg-elevated);
}
.acc-table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
.acc-table tfoot td { border-top: 2px solid var(--color-border); background: var(--glass-bg); font-weight: 700; }
.acc-table tbody tr { transition: background 0.15s; }
.acc-table tbody tr:hover { background: var(--color-bg-elevated); }
.acc-cell--green { color: #34d399; font-weight: 600; }
.acc-cell--red { color: #f87171; font-weight: 600; }
.acc-cell--desc { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.acc-cell--actions { display: flex; gap: 4px; }

/* ═══ Badges ═══ */
.acc-badge {
  display: inline-flex; padding: 3px 10px; border-radius: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
}
.acc-badge--revenue { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.acc-badge--expense { background: rgba(239, 68, 68, 0.12); color: #ef4444; }
.acc-badge--adjustment { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.acc-badge--draft { background: rgba(107, 114, 128, 0.12); color: #6b7280; }
.acc-badge--issued { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.acc-badge--paid { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.acc-badge--cancelled { background: rgba(239, 68, 68, 0.12); color: #ef4444; }

/* ═══ Inputs ═══ */
.acc-input, .acc-select {
  padding: 10px 14px; border-radius: 10px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); font-size: 13px;
  transition: border-color 0.2s; outline: none;
}
.acc-input:focus, .acc-select:focus { border-color: var(--color-accent-primary); }

/* ═══ Buttons ═══ */
.acc-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.25s;
}
.acc-btn:hover { border-color: var(--color-border-hover); transform: translateY(-1px); }
.acc-btn--sm { padding: 6px 12px; font-size: 12px; }
.acc-btn--primary {
  background: var(--accent-gradient); color: #fff; border: none;
  box-shadow: var(--accent-shadow);
}
.acc-btn--primary:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.acc-btn--primary:disabled { opacity: 0.6; transform: none; }
.acc-action-btn {
  width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-muted);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.acc-action-btn:hover { background: var(--color-bg-elevated); }
.acc-action-btn--danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

.acc-empty, .acc-entries-filter {
  padding: 20px; font-size: 13px; color: var(--color-text-muted);
}
.acc-entries-filter { display: flex; gap: 8px; border-bottom: 1px solid var(--color-border); }

/* ═══ Modal ═══ */
.acc-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.acc-modal {
  background: var(--color-bg-primary); border: 1px solid var(--glass-border);
  border-radius: 16px; width: 520px; max-width: 90vw;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
}
.acc-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--color-border);
}
.acc-modal__header h4 { margin: 0; font-size: 16px; font-weight: 800; }
.acc-modal__close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; }
.acc-modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.acc-modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 14px 24px; border-top: 1px solid var(--color-border);
}

/* ═══ Forms ═══ */
.acc-form-row { display: flex; flex-direction: column; gap: 6px; }
.acc-form-row label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.acc-form-row .acc-input, .acc-form-row .acc-select { width: 100%; }
.acc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .acc-cards { grid-template-columns: 1fr 1fr; }
  .acc-filter { flex-direction: column; align-items: stretch; }
  .acc-form-grid { grid-template-columns: 1fr; }
}

/* ═══ Settings ═══ */
.acc-settings { padding: 20px 24px; display: flex; flex-direction: column; gap: 20px; }
.acc-settings-group {
  padding: 18px 20px; background: var(--color-bg-elevated); border-radius: 12px;
  border: 1px solid var(--glass-border);
}
.acc-settings-group__title {
  margin: 0 0 14px; font-size: 14px; font-weight: 700; color: var(--color-text-primary);
}
.acc-form-hint { font-size: 11px; color: var(--color-text-muted); margin-top: 2px; }
.acc-custom-cat {
  display: flex; gap: 8px; align-items: center; margin-bottom: 6px;
}

</style>

