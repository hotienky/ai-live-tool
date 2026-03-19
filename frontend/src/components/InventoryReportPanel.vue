<template>
  <div class="inv-report">
    <div class="rpt-header">
      <h2><BarChart3 :size="20" style="vertical-align:middle" /> Báo Cáo Kho & Giá Vốn</h2>
      <div class="tab-bar">
        <button v-for="t in tabs" :key="t.key" :class="['tab-btn', { active: activeTab === t.key }]" @click="activeTab = t.key">
          <component :is="t.icon" :size="14" /> {{ t.label }}
        </button>
      </div>
    </div>

    <!-- ═══ Tab: Tồn kho ═══ -->
    <div v-if="activeTab === 'stock'" class="tab-panel">
      <div class="rpt-stats">
        <div class="stat-card"><div class="stat-icon"><Package :size="20" /></div><div class="stat-value">{{ stockSummary.total_products || 0 }}</div><div class="stat-label">Sản phẩm</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--green"><Layers :size="20" /></div><div class="stat-value">{{ (stockSummary.total_stock || 0).toLocaleString() }}</div><div class="stat-label">Tổng tồn kho</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--blue"><DollarSign :size="20" /></div><div class="stat-value">{{ formatCurrency(stockSummary.total_stock_value || 0) }}</div><div class="stat-label">Giá trị kho (vốn)</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--warn"><AlertTriangle :size="20" /></div><div class="stat-value">{{ stockSummary.low_stock_count || 0 }}</div><div class="stat-label">Sắp hết / Hết hàng</div></div>
      </div>
      <div class="filter-bar">
        <input v-model="stockSearch" class="search-input" placeholder="Tìm SP, SKU..." @input="debouncedStockSearch" />
        <label class="toggle-label"><input type="checkbox" v-model="showLowOnly" @change="fetchStock" /> Chỉ hàng sắp hết</label>
        <button class="btn-export" @click="exportCSV('stock')"><Download :size="13" /> Xuất CSV</button>
      </div>
      <table>
        <thead><tr><th>{{ t('admin.product', 'Sản phẩm') }}</th><th>SKU</th><th>{{ t('admin.stock', 'Tồn kho') }}</th><th>Tối thiểu</th><th>Giá vốn</th><th>{{ t('admin.selling_price', 'Giá bán') }}</th><th>Giá trị kho</th><th>TT</th></tr></thead>
        <tbody>
          <tr v-for="p in stockProducts" :key="p.id" :class="{ 'row-warn': p.is_low, 'row-danger': p.is_out }">
            <td><strong>{{ p.name }}</strong></td>
            <td class="mono">{{ p.sku || '—' }}</td>
            <td class="qty" :class="{ 'text-danger': p.is_out, 'text-warn': p.is_low }">{{ p.stock }}</td>
            <td class="qty">{{ p.min_stock }}</td>
            <td>{{ formatCurrency(p.cost_price) }}</td>
            <td>{{ formatCurrency(p.price) }}</td>
            <td class="amount">{{ formatCurrency(p.stock_value) }}</td>
            <td>
              <span v-if="p.is_out" class="badge badge--danger">Hết hàng</span>
              <span v-else-if="p.is_low" class="badge badge--warn">Sắp hết</span>
              <span v-else class="badge badge--ok">OK</span>
            </td>
          </tr>
          <tr v-if="stockProducts.length === 0"><td colspan="8" class="empty">Không có dữ liệu</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ Tab: Xuất nhập tồn ═══ -->
    <div v-if="activeTab === 'movement'" class="tab-panel">
      <div class="filter-bar">
        <div class="date-range">
          <label>Từ</label><input type="date" v-model="mvFrom" />
          <label>Đến</label><input type="date" v-model="mvTo" />
          <button class="btn-filter" @click="fetchMovement"><RefreshCw :size="14" /> Xem</button>
          <button class="btn-export" @click="exportCSV('movement')"><Download :size="13" /> CSV</button>
        </div>
      </div>
      <div class="rpt-stats">
        <div class="stat-card"><div class="stat-icon"><ArrowDownToLine :size="20" /></div><div class="stat-value">{{ (mvSummary.total_import_qty || 0).toLocaleString() }}</div><div class="stat-label">SL nhập</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--green"><DollarSign :size="20" /></div><div class="stat-value">{{ formatCurrency(mvSummary.total_import_value || 0) }}</div><div class="stat-label">Giá trị nhập</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--red"><ArrowUpFromLine :size="20" /></div><div class="stat-value">{{ (mvSummary.total_export_qty || 0).toLocaleString() }}</div><div class="stat-label">SL xuất</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--warn"><Package :size="20" /></div><div class="stat-value">{{ mvSummary.products_moved || 0 }}</div><div class="stat-label">SP có biến động</div></div>
      </div>
      <table>
        <thead><tr><th>{{ t('admin.product', 'Sản phẩm') }}</th><th>SKU</th><th>Đầu kỳ</th><th>Nhập</th><th>GT nhập</th><th>Xuất</th><th>GT xuất</th><th>Cuối kỳ</th></tr></thead>
        <tbody>
          <tr v-for="m in mvItems" :key="m.product_id">
            <td><strong>{{ m.product_name }}</strong></td>
            <td class="mono">{{ m.sku || '—' }}</td>
            <td class="qty">{{ m.begin_stock }}</td>
            <td class="qty text-green">+{{ m.import_qty }}</td>
            <td class="amount">{{ formatCurrency(m.import_value) }}</td>
            <td class="qty text-red">-{{ m.export_qty }}</td>
            <td class="amount">{{ formatCurrency(m.export_value) }}</td>
            <td class="qty"><strong>{{ m.end_stock }}</strong></td>
          </tr>
          <tr v-if="mvItems.length === 0"><td colspan="8" class="empty">Không có biến động trong kỳ</td></tr>
        </tbody>
        <tfoot v-if="mvItems.length > 0">
          <tr class="total-row">
            <td colspan="2"><strong>{{ t('admin.total', 'Tổng cộng') }}</strong></td>
            <td></td>
            <td class="qty text-green"><strong>+{{ mvSummary.total_import_qty }}</strong></td>
            <td class="amount"><strong>{{ formatCurrency(mvSummary.total_import_value) }}</strong></td>
            <td class="qty text-red"><strong>-{{ mvSummary.total_export_qty }}</strong></td>
            <td class="amount"><strong>{{ formatCurrency(mvSummary.total_export_value) }}</strong></td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- ═══ Tab: Giá vốn (COGS) ═══ -->
    <div v-if="activeTab === 'cogs'" class="tab-panel">
      <div class="filter-bar">
        <div class="date-range">
          <label>Từ</label><input type="date" v-model="cogsFrom" />
          <label>Đến</label><input type="date" v-model="cogsTo" />
          <button class="btn-filter" @click="fetchCogs"><RefreshCw :size="14" /> Xem</button>
        </div>
      </div>
      <div class="rpt-stats">
        <div class="stat-card"><div class="stat-icon stat-icon--green"><TrendingUp :size="20" /></div><div class="stat-value">{{ formatCurrency(cogsSummary.total_revenue || 0) }}</div><div class="stat-label">{{ t('admin.revenue', 'Doanh thu') }}</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--red"><TrendingDown :size="20" /></div><div class="stat-value">{{ formatCurrency(cogsSummary.total_cogs || 0) }}</div><div class="stat-label">Giá vốn (COGS)</div></div>
        <div class="stat-card"><div class="stat-icon" :class="cogsSummary.gross_profit >= 0 ? 'stat-icon--green' : 'stat-icon--red'"><DollarSign :size="20" /></div><div class="stat-value" :class="cogsSummary.gross_profit >= 0 ? 'text-green' : 'text-red'">{{ formatCurrency(cogsSummary.gross_profit || 0) }}</div><div class="stat-label">Lợi nhuận gộp</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--blue"><Percent :size="20" /></div><div class="stat-value">{{ cogsSummary.gross_margin || 0 }}%</div><div class="stat-label">Biên lợi nhuận gộp</div></div>
      </div>

      <!-- Gross margin visual bar -->
      <div class="margin-bar-wrap" v-if="cogsSummary.total_revenue > 0">
        <div class="margin-bar">
          <div class="margin-bar__cogs" :style="{ width: Math.min(100, (cogsSummary.total_cogs / cogsSummary.total_revenue * 100)) + '%' }">
            <span>COGS {{ Math.round(cogsSummary.total_cogs / cogsSummary.total_revenue * 100) }}%</span>
          </div>
          <div class="margin-bar__profit">
            <span>Lợi nhuận {{ cogsSummary.gross_margin }}%</span>
          </div>
        </div>
      </div>

      <h4 style="margin:20px 0 12px">Chi tiết bút toán COGS</h4>
      <table>
        <thead><tr><th>Ngày</th><th>{{ t('admin.description', 'Mô tả') }}</th><th>Đơn hàng</th><th>Giá vốn</th></tr></thead>
        <tbody>
          <tr v-for="e in cogsEntries" :key="e.id">
            <td class="date">{{ formatDate(e.entry_date) }}</td>
            <td>{{ e.description }}</td>
            <td class="mono">#{{ e.reference_id }}</td>
            <td class="amount text-red">{{ formatCurrency(e.amount) }}</td>
          </tr>
          <tr v-if="cogsEntries.length === 0"><td colspan="4" class="empty">Chưa có bút toán COGS</td></tr>
        </tbody>
      </table>
    </div>

    <!-- ═══ Tab: Cảnh báo ═══ -->
    <div v-if="activeTab === 'alerts'" class="tab-panel">
      <div class="rpt-stats">
        <div class="stat-card"><div class="stat-icon stat-icon--warn"><AlertTriangle :size="20" /></div><div class="stat-value">{{ alertData.total || 0 }}</div><div class="stat-label">Sản phẩm cảnh báo</div></div>
        <div class="stat-card"><div class="stat-icon stat-icon--red"><XCircle :size="20" /></div><div class="stat-value">{{ alertData.out_of_stock || 0 }}</div><div class="stat-label">Hết hàng</div></div>
      </div>
      <table>
        <thead><tr><th>{{ t('admin.product', 'Sản phẩm') }}</th><th>SKU</th><th>{{ t('admin.stock', 'Tồn kho') }}</th><th>Tối thiểu</th><th>{{ t('admin.status', 'Trạng thái') }}</th></tr></thead>
        <tbody>
          <tr v-for="a in alertItems" :key="a.id" :class="{ 'row-danger': a.is_out }">
            <td><strong>{{ a.name }}</strong></td>
            <td class="mono">{{ a.sku || '—' }}</td>
            <td class="qty" :class="{ 'text-danger': a.is_out }">{{ a.stock }}</td>
            <td class="qty">{{ a.min_stock }}</td>
            <td><span class="badge" :class="a.is_out ? 'badge--danger' : 'badge--warn'">{{ a.is_out ? 'HẾT HÀNG' : 'SẮP HẾT' }}</span></td>
          </tr>
          <tr v-if="alertItems.length === 0"><td colspan="5" class="empty">Không có cảnh báo 🎉</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import {
  BarChart3, Package, Layers, DollarSign, AlertTriangle, XCircle,
  ArrowDownToLine, ArrowUpFromLine, TrendingUp, TrendingDown, Percent,
  RefreshCw, Download
} from 'lucide-vue-next'

const { t } = useI18n()

const tabs = [
  { key: 'stock', label: 'Tồn kho', icon: Package },
  { key: 'movement', label: 'Xuất nhập tồn', icon: ArrowDownToLine },
  { key: 'cogs', label: 'Giá vốn', icon: TrendingDown },
  { key: 'alerts', label: 'Cảnh báo', icon: AlertTriangle },
]
const activeTab = ref('stock')

// ── Stock ──
const stockProducts = ref([])
const stockSummary = ref({})
const stockSearch = ref('')
const showLowOnly = ref(false)
let stockTimer = null

function debouncedStockSearch() {
  clearTimeout(stockTimer)
  stockTimer = setTimeout(fetchStock, 300)
}

async function fetchStock() {
  try {
    let url = '/inventory/stock-report'
    const params = []
    if (stockSearch.value) params.push(`search=${stockSearch.value}`)
    if (showLowOnly.value) params.push('low_stock=1')
    if (params.length) url += '?' + params.join('&')
    const res = await apiFetch(url)
    const data = await res.json()
    stockProducts.value = data.data?.products || []
    stockSummary.value = data.data?.summary || {}
  } catch { stockProducts.value = [] }
}

// ── Movement ──
const mvItems = ref([])
const mvSummary = ref({})
const mvFrom = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const mvTo = ref(new Date().toISOString().split('T')[0])

async function fetchMovement() {
  try {
    const res = await apiFetch(`/inventory/movement-report?from=${mvFrom.value}&to=${mvTo.value}`)
    const data = await res.json()
    mvItems.value = data.data?.items || []
    mvSummary.value = data.data?.summary || {}
  } catch { mvItems.value = [] }
}

// ── COGS ──
const cogsEntries = ref([])
const cogsSummary = ref({})
const cogsFrom = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0])
const cogsTo = ref(new Date().toISOString().split('T')[0])

async function fetchCogs() {
  try {
    const res = await apiFetch(`/inventory/cogs-report?from=${cogsFrom.value}&to=${cogsTo.value}`)
    const data = await res.json()
    cogsEntries.value = data.data?.entries || []
    cogsSummary.value = data.data?.summary || {}
  } catch { cogsEntries.value = [] }
}

// ── Alerts ──
const alertItems = ref([])
const alertData = ref({})

async function fetchAlerts() {
  try {
    const res = await apiFetch('/inventory/low-stock-alerts')
    const data = await res.json()
    alertItems.value = data.data?.alerts || []
    alertData.value = { total: data.data?.total || 0, out_of_stock: data.data?.out_of_stock || 0 }
  } catch { alertItems.value = [] }
}

// Fetch on tab change
watch(activeTab, (tab) => {
  if (tab === 'stock') fetchStock()
  else if (tab === 'movement') fetchMovement()
  else if (tab === 'cogs') fetchCogs()
  else if (tab === 'alerts') fetchAlerts()
})

onMounted(fetchStock)

function formatCurrency(v) { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0) }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }

function exportCSV(type) {
  const host = window.location.hostname
  const apiBase = host.replace('.cms.', '.api.')
  const base = `${window.location.protocol}//${apiBase}/api`
  if (type === 'movement') {
    window.open(`${base}/inventory/export-csv?type=movement&from=${mvFrom.value}&to=${mvTo.value}`, '_blank')
  } else {
    window.open(`${base}/inventory/export-csv?type=stock`, '_blank')
  }
}
</script>

<style scoped>
.inv-report { padding: 24px; overflow-y: auto; height: 100%; }
.rpt-header { margin-bottom: 24px; }
.rpt-header h2 { margin: 0 0 16px; font-size: 20px; font-weight: 800; }
.tab-bar { display: flex; gap: 6px; flex-wrap: wrap; }
.tab-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px; font-size: 13px; font-weight: 600;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
}
.tab-btn.active {
  background: var(--accent-gradient); color: #fff;
  border-color: transparent; box-shadow: var(--accent-shadow);
}
.tab-btn:not(.active):hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

.tab-panel { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.rpt-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 14px; margin-bottom: 20px; }
.stat-card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 14px; padding: 18px; text-align: center; transition: all 0.3s; }
.stat-card:hover { transform: translateY(-2px); border-color: var(--color-border-hover); }
.stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 8px; background: var(--color-accent-glow); color: var(--accent-light); }
.stat-icon--green { background: rgba(52,211,153,0.12); color: #34d399; }
.stat-icon--red { background: rgba(248,113,113,0.12); color: #f87171; }
.stat-icon--blue { background: rgba(96,165,250,0.12); color: #60a5fa; }
.stat-icon--warn { background: rgba(251,191,36,0.12); color: #fbbf24; }
.stat-value { font-size: 20px; font-weight: 800; color: var(--color-text-primary); }
.stat-label { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; font-weight: 600; }

.filter-bar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
.search-input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 9px 14px; border-radius: 10px; font-size: 13px; min-width: 200px; outline: none; }
.search-input:focus { border-color: var(--color-accent-primary); }
.toggle-label { font-size: 13px; color: var(--color-text-secondary); cursor: pointer; display: flex; align-items: center; gap: 6px; }
.date-range { display: flex; align-items: center; gap: 8px; }
.date-range label { font-size: 12px; color: var(--color-text-muted); font-weight: 600; }
.date-range input { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-primary); padding: 8px 12px; border-radius: 10px; font-size: 13px; outline: none; }
.btn-filter { background: var(--accent-gradient); color: #fff; border: none; padding: 8px 16px; border-radius: 10px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
.btn-export { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--color-text-secondary); padding: 8px 14px; border-radius: 10px; font-weight: 600; cursor: pointer; font-size: 12px; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s; }
.btn-export:hover { border-color: var(--color-accent-primary); color: var(--color-text-primary); }

table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
thead { background: var(--color-bg-elevated); }
th { padding: 10px 14px; text-align: left; color: var(--color-text-muted); font-weight: 700; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid var(--color-border); }
td { padding: 10px 14px; border-bottom: 1px solid var(--color-border); color: var(--color-text-primary); }
tr:hover { background: var(--color-accent-glow); }
.mono { font-family: monospace; font-size: 12px; color: var(--color-text-muted); }
.qty { text-align: center; font-weight: 700; }
.amount { font-weight: 700; }
.date { font-size: 12px; color: var(--color-text-muted); }
.text-green { color: #34d399; }
.text-red { color: #f87171; }
.text-warn { color: #fbbf24; }
.text-danger { color: #ef4444; }
.empty { text-align: center; padding: 30px; color: var(--color-text-muted); }

.row-warn { border-left: 3px solid #fbbf24; }
.row-danger { border-left: 3px solid #f87171; background: rgba(248,113,113,0.03); }

.badge { padding: 3px 10px; border-radius: 8px; font-size: 11px; font-weight: 700; }
.badge--ok { background: rgba(52,211,153,0.08); color: #34d399; }
.badge--warn { background: rgba(251,191,36,0.08); color: #fbbf24; }
.badge--danger { background: rgba(248,113,113,0.08); color: #f87171; }

.total-row td { border-top: 2px solid var(--color-border); background: var(--glass-bg); }

/* Margin bar */
.margin-bar-wrap { margin: 16px 0; }
.margin-bar { display: flex; height: 36px; border-radius: 10px; overflow: hidden; font-size: 12px; font-weight: 700; }
.margin-bar__cogs { background: rgba(248,113,113,0.2); color: #f87171; display: flex; align-items: center; justify-content: center; min-width: 60px; }
.margin-bar__profit { background: rgba(52,211,153,0.15); color: #34d399; display: flex; align-items: center; justify-content: center; flex: 1; min-width: 60px; }
</style>
