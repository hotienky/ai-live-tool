<template>
  <div class="acc">
    <!-- Date Range Filter -->
    <div class="acc-filter">
      <div class="acc-filter__dates">
        <input type="date" v-model="dateFrom" class="acc-input" />
        <span class="acc-filter__sep">→</span>
        <input type="date" v-model="dateTo" class="acc-input" />
        <button class="acc-btn acc-btn--sm" @click="loadAll">{{ t('admin.msg_3b00fe35', 'Áp dụng') }}</button>
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
            <span class="acc-card__label">{{ t('admin.revenue', 'Doanh thu') }}</span>
            <span class="acc-card__value">{{ formatPrice(summary.revenue) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--expense">
          <div class="acc-card__icon"><TrendingDown :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">{{ t('admin.msg_ca482423', 'COGS (Giá vốn)') }}</span>
            <span class="acc-card__value">{{ formatPrice(summary.cogs || 0) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--profit">
          <div class="acc-card__icon"><DollarSign :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">{{ t('admin.msg_0489c93f', 'Lợi nhuận gộp') }}</span>
            <span class="acc-card__value" :style="{ color: (summary.gross_profit || 0) >= 0 ? '#34d399' : '#f87171' }">{{ formatPrice(summary.gross_profit || 0) }}</span>
          </div>
        </div>
        <div class="acc-card acc-card--tax">
          <div class="acc-card__icon"><Receipt :size="20" /></div>
          <div class="acc-card__body">
            <span class="acc-card__label">{{ t('admin.msg_1fe3aa98', 'Lợi nhuận ròng') }}</span>
            <span class="acc-card__value" :style="{ color: (summary.profit || 0) >= 0 ? '#34d399' : '#f87171' }">{{ formatPrice(summary.profit) }}</span>
          </div>
        </div>
      </div>

      <!-- COGS Breakdown Bar -->
      <div v-if="summary.revenue > 0" class="acc-cogs-bar">
        <div class="acc-cogs-bar__inner">
          <div class="acc-cogs-bar__segment acc-cogs-bar__segment--cogs" :style="{ width: Math.min(100, ((summary.cogs || 0) / summary.revenue * 100)) + '%' }">
            <span v-if="(summary.cogs || 0) / summary.revenue > 0.15">COGS {{ Math.round((summary.cogs || 0) / summary.revenue * 100) }}%</span>
          </div>
          <div class="acc-cogs-bar__segment acc-cogs-bar__segment--opex" :style="{ width: Math.min(100 - ((summary.cogs || 0) / summary.revenue * 100), ((summary.operating_expenses || 0) / summary.revenue * 100)) + '%' }">
            <span v-if="(summary.operating_expenses || 0) / summary.revenue > 0.15">Chi phí {{ Math.round((summary.operating_expenses || 0) / summary.revenue * 100) }}%</span>
          </div>
          <div class="acc-cogs-bar__segment acc-cogs-bar__segment--profit">
            <span v-if="(summary.profit || 0) / summary.revenue > 0.1">LN {{ Math.round((summary.profit || 0) / summary.revenue * 100) }}%</span>
          </div>
        </div>
        <div class="acc-cogs-bar__legend">
          <span><span class="acc-legend__dot" style="background:#f87171"></span> COGS</span>
          <span><span class="acc-legend__dot" style="background:#fbbf24"></span> {{ t('admin.msg_60c56fe0', 'Chi phí VH') }}</span>
          <span><span class="acc-legend__dot" style="background:#34d399"></span> {{ t('admin.msg_44eb540c', 'Lợi nhuận') }}</span>
        </div>
      </div>

      <!-- Tax Status Info -->
      <div v-if="taxConfig.enabled" class="acc-tax-info">
        <div class="acc-tax-info__left">
          <span class="acc-badge acc-badge--paid">{{ t('admin.msg_2f8fb0a4', 'Thuế đang bật') }}</span>
          <span class="acc-tax-info__label">{{ taxConfig.label || 'VAT' }}</span>
          <span v-if="taxConfig.price_includes_tax" class="acc-badge acc-badge--draft">{{ t('admin.msg_2cc981ee', 'Giá đã gồm thuế') }}</span>
        </div>
        <div class="acc-tax-info__rates">
          <span v-for="r in activeTaxRates" :key="r.id" class="acc-badge acc-badge--issued">
            {{ r.name }}: {{ r.rate }}%
          </span>
        </div>
      </div>
      <div v-else class="acc-tax-info">
        <span class="acc-badge acc-badge--cancelled">{{ t('admin.msg_1824c072', 'Thuế chưa bật') }}</span>
        <button class="acc-btn acc-btn--sm" @click="emit('navigate-to-tax')">{{ t('admin.msg_e8af0d80', 'Bật cấu hình thuế →') }}</button>
      </div>

      <!-- Monthly Chart (simple bar visualization) -->
      <div class="acc-section">
        <h4 class="acc-section__title"><BarChart2 :size="14" /> {{ t('admin.msg_f7dd7d95', 'Biểu đồ theo tháng') }}</h4>
        <div class="acc-chart">
          <div v-for="m in monthly" :key="m.month" class="acc-chart__bar-group">
            <div class="acc-chart__bars">
              <div class="acc-chart__bar acc-chart__bar--revenue" :style="{ height: barH(m.revenue) }" :title="'DT: ' + formatPrice(m.revenue)"></div>
              <div class="acc-chart__bar acc-chart__bar--expense" :style="{ height: barH(m.expenses) }" :title="'CP: ' + formatPrice(m.expenses)"></div>
              <div class="acc-chart__bar acc-chart__bar--tax" :style="{ height: barH(m.tax) }" :title="t('admin.msg_f725f73e', 'Thuế: ') + formatPrice(m.tax)"></div>
            </div>
            <span class="acc-chart__label">T{{ m.month }}</span>
          </div>
        </div>
        <div class="acc-chart__legend">
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#10b981"></span> Doanh thu</span>
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#ef4444"></span> {{ t('admin.msg_7c203ff2', 'Chi phí') }}</span>
          <span class="acc-legend"><span class="acc-legend__dot" style="background:#8b5cf6"></span> {{ t('admin.msg_500aedd2', 'Thuế') }}</span>
        </div>
      </div>
    </template>

    <!-- ═══ Tab: Báo Cáo Thuế ═══ -->
    <template v-if="activeTab === 'tax'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><Receipt :size="14" /> Báo cáo thuế năm {{ taxYear }}</h4>
          <div class="acc-section__actions">
            <button class="acc-btn acc-btn--sm" @click="exportExcel('tax')" :title="t('admin.msg_17760def', 'Xuất Excel')" ><Download :size="12" /> Excel</button>
            <button class="acc-btn acc-btn--sm" @click="exportTaxCSV" :title="t('admin.msg_47bfce15', 'Xuất CSV')" ><Download :size="12" /> CSV</button>
            <button class="acc-btn acc-btn--sm" @click="taxYear--; loadTaxReport()">←</button>
            <span>{{ taxYear }}</span>
            <button class="acc-btn acc-btn--sm" @click="taxYear++; loadTaxReport()">→</button>
          </div>
        </div>
        <table class="acc-table" v-if="taxReport.length">
          <thead>
            <tr>
              <th>{{ t('admin.msg_5703304d', 'Tháng') }}</th>
              <th>{{ t('admin.revenue', 'Doanh thu') }}</th>
              <th>{{ t('admin.msg_5f4eb02f', 'Thuế thu') }}</th>
              <th>{{ t('admin.msg_8c1b2179', 'Thuế hoàn') }}</th>
              <th>{{ t('admin.msg_c335377a', 'Thuế phải nộp') }}</th>
              <th>{{ t('admin.msg_adb21d16', 'Đơn hàng') }}</th>
              <th>{{ t('admin.msg_94280c8b', 'Hoàn trả') }}</th>
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
              <td><strong>{{ t('admin.msg_195075fe', 'Tổng') }}</strong></td>
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
          <h4 class="acc-section__title"><BookOpen :size="14" /> {{ t('admin.msg_9df87a66', 'Sổ thu chi') }}</h4>
          <div style="display:flex;gap:6px">
            <button class="acc-btn acc-btn--sm" @click="exportExcel('entries')" :title="t('admin.msg_17760def', 'Xuất Excel')" ><Download :size="12" /> Excel</button>
            <button class="acc-btn acc-btn--sm" @click="exportExcel('combined')" :title="t('admin.msg_2a7b6a8c', 'Xuất tổng hợp')" ><Download :size="12" /> {{ t('admin.msg_8e4e2737', 'Tổng hợp') }}</button>
            <button class="acc-btn acc-btn--sm" @click="exportEntriesCSV" :title="t('admin.msg_47bfce15', 'Xuất CSV')" ><Download :size="12" /> CSV</button>
            <button class="acc-btn acc-btn--primary acc-btn--sm" @click="openEntryForm()">
              <Plus :size="13" /> Thêm bút toán
            </button>
          </div>
        </div>

        <div class="acc-entries-filter">
          <select v-model="entryFilter.type" class="acc-select" @change="loadEntries">
            <option value="">{{ t('admin.msg_ca84e246', 'Tất cả loại') }}</option>
            <option value="revenue">Thu</option>
            <option value="expense">Chi</option>
            <option value="adjustment">{{ t('admin.msg_6a48ef4e', 'Điều chỉnh') }}</option>
          </select>
        </div>

        <table class="acc-table" v-if="entries.length">
          <thead>
            <tr>
              <th>{{ t('admin.msg_b9474a12', 'Ngày') }}</th>
              <th>{{ t('admin.type', 'Loại') }}</th>
              <th>{{ t('admin.msg_53d8de58', 'Danh mục') }}</th>
              <th>{{ t('admin.description', 'Mô tả') }}</th>
              <th>{{ t('admin.msg_8cde2607', 'Số tiền') }}</th>
              <th>{{ t('admin.msg_500aedd2', 'Thuế') }}</th>
              <th>{{ t('admin.msg_557d70a8', 'Tham chiếu') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in entries" :key="e.id">
              <td>{{ formatDate(e.entry_date) }}</td>
              <td>
                <span class="acc-badge" :class="'acc-badge--' + e.type">
                  {{ { revenue: 'Thu', expense: 'Chi', adjustment: t('admin.msg_6cdd7e54', 'Đ/C') }[e.type] }}
                </span>
              </td>
              <td>{{ categoryLabel(e.category) }}</td>
              <td class="acc-cell--desc">{{ e.description }}</td>
              <td :class="{ 'acc-cell--green': e.amount > 0, 'acc-cell--red': e.amount < 0 }">
                {{ formatPrice(Math.abs(e.amount)) }}
              </td>
              <td>{{ e.tax_amount > 0 ? formatPrice(e.tax_amount) : '—' }}</td>
              <td>
                <a v-if="e.reference_type === 'order'" href="#" class="acc-ref-link" @click.prevent="$emit('navigate-to-order', e.reference_id)">
                  ĐH #{{ e.reference_id }}
                </a>
                <span v-else-if="e.reference_type">{{ e.reference_type }}#{{ e.reference_id }}</span>
                <span v-else>—</span>
              </td>
              <td class="acc-cell--actions">
                <button v-if="!e.reference_type" class="acc-action-btn acc-action-btn--danger" @click="deleteEntry(e)" :title="t('admin.delete', 'Xóa')" ><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="acc-empty">{{ t('admin.msg_898dd800', 'Chưa có bút toán nào.') }}</div>
      </div>
    </template>

    <!-- ═══ Tab: Hoá Đơn ═══ -->
    <template v-if="activeTab === 'invoices'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><FileText :size="14" /> {{ t('admin.msg_ee8632be', 'Hoá đơn') }}</h4>
        </div>
        <table class="acc-table" v-if="invoices.length">
          <thead>
            <tr>
              <th>{{ t('admin.msg_080b58bf', 'Số HĐ') }}</th>
              <th>{{ t('admin.msg_0caa5ce1', 'Khách hàng') }}</th>
              <th>{{ t('admin.msg_d0a16ea2', 'Tổng tiền') }}</th>
              <th>{{ t('admin.msg_500aedd2', 'Thuế') }}</th>
              <th>{{ t('admin.status', 'Trạng thái') }}</th>
              <th>{{ t('admin.created_at', 'Ngày tạo') }}</th>
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
                <button class="acc-action-btn" @click="previewInvoiceId = inv.id; showInvoicePreview = true" :title="t('admin.msg_ec9f1c00', 'Xem hoá đơn')" ><Eye :size="13" /></button>
                <button class="acc-action-btn" @click="openInvoicePdf(inv.id)" :title="t('admin.msg_34de7842', 'Tải PDF')" ><Download :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="acc-empty">{{ t('admin.msg_31d2fd91', 'Chưa có hoá đơn nào.') }}</div>
      </div>
    </template>

    <!-- ═══ Tab: Lãi Lỗ (P&L) ═══ -->
    <template v-if="activeTab === 'pnl'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><TrendingUp :size="14" /> {{ t('admin.msg_32cd6d1a', 'Báo cáo lãi lỗ') }}</h4>
          <button class="acc-btn acc-btn--sm" @click="exportExcel('combined')" :title="t('admin.msg_17760def', 'Xuất Excel')" ><Download :size="12" /> Excel</button>
        </div>
        <div v-if="pnlData" class="acc-pnl">
          <!-- Revenue -->
          <div class="acc-pnl__section">
            <h5 class="acc-pnl__title acc-pnl__title--green">DOANH THU</h5>
            <div v-for="cat in pnlData.revenue?.by_category" :key="cat.category" class="acc-pnl__row">
              <span>{{ categoryLabel(cat.category) }} <small>({{ cat.count }} bút toán)</small></span>
              <span class="acc-cell--green">{{ formatPrice(cat.amount) }}</span>
            </div>
            <div class="acc-pnl__subtotal">
              <span>{{ t('admin.msg_d5da9a6a', 'Tổng doanh thu') }}</span>
              <span>{{ formatPrice(pnlData.revenue?.total) }}</span>
            </div>
          </div>

          <!-- Expenses -->
          <div class="acc-pnl__section">
            <h5 class="acc-pnl__title acc-pnl__title--red">{{ t('admin.msg_32df3811', 'CHI PHÍ') }}</h5>
            <div v-for="cat in pnlData.expenses?.by_category" :key="cat.category" class="acc-pnl__row">
              <span>{{ categoryLabel(cat.category) }} <small>({{ cat.count }} bút toán)</small></span>
              <span class="acc-cell--red">{{ formatPrice(cat.amount) }}</span>
            </div>
            <div class="acc-pnl__subtotal">
              <span>{{ t('admin.msg_0fe77f32', 'Tổng chi phí') }}</span>
              <span>{{ formatPrice(pnlData.expenses?.total) }}</span>
            </div>
          </div>

          <!-- Summary -->
          <div class="acc-pnl__section acc-pnl__section--summary">
            <div class="acc-pnl__row"><span>{{ t('admin.msg_dac5e917', 'Điều chỉnh (hoàn trả)') }}</span><span>{{ formatPrice(pnlData.adjustments) }}</span></div>
            <div class="acc-pnl__row"><span>{{ t('admin.msg_c335377a', 'Thuế phải nộp') }}</span><span class="acc-cell--purple">{{ formatPrice(pnlData.tax_payable) }}</span></div>
            <div class="acc-pnl__subtotal acc-pnl__subtotal--big">
              <span>{{ t('admin.msg_0489c93f', 'Lợi nhuận gộp') }}</span>
              <span :class="pnlData.gross_profit >= 0 ? 'acc-cell--green' : 'acc-cell--red'">{{ formatPrice(pnlData.gross_profit) }}</span>
            </div>
            <div class="acc-pnl__subtotal acc-pnl__subtotal--big">
              <span>{{ t('admin.msg_1fe3aa98', 'Lợi nhuận ròng') }}</span>
              <span :class="pnlData.net_profit >= 0 ? 'acc-cell--green' : 'acc-cell--red'">{{ formatPrice(pnlData.net_profit) }}</span>
            </div>
            <div class="acc-pnl__row">
              <span>{{ t('admin.msg_14899507', 'Biên lợi nhuận') }}</span>
              <span :class="pnlData.margin >= 0 ? 'acc-cell--green' : 'acc-cell--red'">{{ pnlData.margin }}%</span>
            </div>
          </div>
        </div>
        <div v-else class="acc-empty">{{ t('admin.loading', 'Đang tải...') }}</div>
      </div>
    </template>

    <!-- ═══ Tab: Cân Đối ═══ -->
    <template v-if="activeTab === 'balance'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><DollarSign :size="14" /> {{ t('admin.msg_40c88349', 'Bảng cân đối kế toán') }}</h4>
          <div class="acc-section__actions">
            <span class="acc-balance-date">Tại ngày: {{ formatDate(balanceData?.as_of) }}</span>
          </div>
        </div>
        <div v-if="balanceData" class="acc-balance">
          <div class="acc-balance__group">
            <h5 class="acc-balance__title acc-balance__title--blue">{{ t('admin.msg_613d3333', 'TÀI SẢN') }}</h5>
            <div class="acc-balance__row"><span>{{ t('admin.msg_047caf53', 'Tiền mặt') }}</span><span>{{ formatPrice(balanceData.assets?.cash_on_hand) }}</span></div>
            <div class="acc-balance__row"><span>{{ t('admin.msg_d77fbcba', 'Phải thu (HĐ chưa TT)') }}</span><span>{{ formatPrice(balanceData.assets?.accounts_receivable) }}</span></div>
            <div class="acc-balance__total"><span>{{ t('admin.msg_484d9e65', 'Tổng tài sản') }}</span><span>{{ formatPrice(balanceData.assets?.total) }}</span></div>
          </div>
          <div class="acc-balance__group">
            <h5 class="acc-balance__title acc-balance__title--red">{{ t('admin.msg_4f385a76', 'NỢ PHẢI TRẢ') }}</h5>
            <div class="acc-balance__row"><span>{{ t('admin.msg_c335377a', 'Thuế phải nộp') }}</span><span>{{ formatPrice(balanceData.liabilities?.tax_payable) }}</span></div>
            <div class="acc-balance__row"><span>{{ t('admin.msg_df55beb8', 'HĐ quá hạn') }}</span><span>{{ formatPrice(balanceData.liabilities?.overdue_invoices) }}</span></div>
            <div class="acc-balance__total"><span>{{ t('admin.msg_bc11fe25', 'Tổng nợ') }}</span><span>{{ formatPrice(balanceData.liabilities?.total) }}</span></div>
          </div>
          <div class="acc-balance__group">
            <h5 class="acc-balance__title acc-balance__title--green">{{ t('admin.msg_e5aa2663', 'VỐN CHỦ SỞ HỮU') }}</h5>
            <div class="acc-balance__total acc-balance__total--big">
              <span>{{ t('admin.msg_080a344b', 'Vốn chủ sở hữu') }}</span>
              <span :class="balanceData.equity >= 0 ? 'acc-cell--green' : 'acc-cell--red'">{{ formatPrice(balanceData.equity) }}</span>
            </div>
          </div>
          <div class="acc-balance__info">
            <span>Tổng HĐ: {{ balanceData.summary?.invoice_count || 0 }}</span>
            <span>Đã TT: {{ balanceData.summary?.paid_invoice_count || 0 }}</span>
          </div>
        </div>
        <div v-else class="acc-empty">{{ t('admin.loading', 'Đang tải...') }}</div>
      </div>
    </template>

    <!-- ═══ Tab: Cài Đặt ═══ -->
    <template v-if="activeTab === 'settings'">
      <div class="acc-section">
        <div class="acc-section__header">
          <h4 class="acc-section__title"><Settings :size="14" /> {{ t('admin.msg_584ca27a', 'Cài đặt kế toán') }}</h4>
          <button class="acc-btn acc-btn--primary acc-btn--sm" @click="saveConfig" :disabled="savingConfig">
            <Save :size="13" /> {{ savingConfig ? t('admin.saving', 'Đang lưu...') : t('admin.save_config', 'Lưu cấu hình') }}
          </button>
        </div>

        <div class="acc-settings">
          <!-- Auto Email -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">{{ t('admin.msg_c5f30546', 'Hoá đơn & Email') }}</h5>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>{{ t('admin.msg_964d0650', 'Tự động gửi email hoá đơn') }}</label>
                <select v-model="accConfig.auto_email" class="acc-select">
                  <option value="true">{{ t('admin.msg_09507128', 'Bật — gửi khi đơn delivered') }}</option>
                  <option value="false">{{ t('admin.msg_258f00b2', 'Tắt') }}</option>
                </select>
              </div>
              <div class="acc-form-row">
                <label>{{ t('admin.msg_795cc2fe', 'Tiền tố hoá đơn') }}</label>
                <input type="text" v-model="accConfig.invoice_prefix" class="acc-input" placeholder="INV" />
                <span class="acc-form-hint">VD: INV → INV-2026-00001, HD → HD-2026-00001</span>
              </div>
            </div>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>{{ t('admin.msg_36c65cb3', 'Hạn thanh toán mặc định') }}</label>
                <select v-model="accConfig.payment_terms" class="acc-select">
                  <option value="0">{{ t('admin.msg_a4f770ff', 'Không có hạn') }}</option>
                  <option value="7">{{ t('admin.msg_d51ffbc9', '7 ngày') }}</option>
                  <option value="14">{{ t('admin.msg_b9805682', '14 ngày') }}</option>
                  <option value="30">{{ t('admin.msg_06199c63', '30 ngày') }}</option>
                </select>
              </div>
              <div class="acc-form-row">
                <label>{{ t('admin.msg_465cb713', 'Nội dung footer hoá đơn') }}</label>
                <input type="text" v-model="accConfig.footer_text" class="acc-input" :placeholder="t('admin.msg_52e445', 'Cảm ơn quý khách!')" />
              </div>
            </div>
          </div>

          <!-- Tax Integration -->
          <div class="acc-settings-group">
            <div class="acc-settings-group__header">
              <h5 class="acc-settings-group__title">{{ t('admin.msg_f0bbcc74', 'Cấu hình thuế GTGT') }}</h5>
              <button class="acc-btn acc-btn--sm" @click="emit('navigate-to-tax')">
                <Settings :size="12" /> Quản lý thuế →
              </button>
            </div>
            <div v-if="taxConfig.enabled" class="acc-tax-status">
              <div class="acc-tax-status__row">
                <span class="acc-badge acc-badge--paid">{{ t('admin.msg_9eae5130', 'Bật') }}</span>
                <span>{{ t('admin.msg_a273899d', 'Nhãn:') }} <strong>{{ taxConfig.label || 'VAT' }}</strong></span>
                <span>{{ t('admin.msg_cea0c32e', 'Hiển thị:') }} <strong>{{ taxConfig.display_mode === 'inclusive' ? 'Giá đã gồm thuế' : taxConfig.display_mode === 'exclusive' ? 'Giá + thuế riêng' : 'Cả hai' }}</strong></span>
                <span v-if="taxConfig.price_includes_tax" class="acc-badge acc-badge--draft">{{ t('admin.msg_f503a745', 'Giá gồm thuế') }}</span>
              </div>
              <div v-if="activeTaxRates.length" class="acc-tax-status__rates">
                <span class="acc-form-hint">{{ t('admin.msg_c04d344c', 'Thuế suất đang áp dụng:') }}</span>
                <div class="acc-tax-rates-list">
                  <div v-for="r in activeTaxRates" :key="r.id" class="acc-tax-rate-chip">
                    <span class="acc-tax-rate-chip__pct">{{ r.rate }}%</span>
                    <span class="acc-tax-rate-chip__name">{{ r.name }}</span>
                  </div>
                </div>
              </div>
              <div v-else class="acc-form-hint" style="margin-top:8px">{{ t('admin.msg_4b1acf92', 'Chưa có thuế suất nào.') }} <a href="#" @click.prevent="emit('navigate-to-tax')" style="color:var(--color-accent-primary)">{{ t('admin.msg_3a814db3', 'Thêm thuế suất →') }}</a></div>
            </div>
            <div v-else class="acc-tax-status">
              <span class="acc-badge acc-badge--cancelled">{{ t('admin.msg_1824c072', 'Thuế chưa bật') }}</span>
              <span class="acc-form-hint" style="margin-left:8px">{{ t('admin.msg_34691806', 'Bật thuế trong trang') }} <a href="#" @click.prevent="emit('navigate-to-tax')" style="color:var(--color-accent-primary)">{{ t('admin.tax_management', 'Quản lý thuế') }}</a> {{ t('admin.msg_f659f4dd', 'để tích hợp với kế toán.') }}</span>
            </div>
          </div>

          <!-- Custom Categories -->
          <div class="acc-settings-group">
            <h5 class="acc-settings-group__title">{{ t('admin.msg_1c846665', 'Danh mục kế toán tuỳ chỉnh') }}</h5>
            <p class="acc-form-hint" style="margin-bottom:10px">{{ t('admin.msg_45363757', 'Thêm danh mục ngoài mặc định (Doanh thu ĐH, Phí VC, Hoàn trả...)') }}</p>
            <div v-for="(cat, ci) in customCategories" :key="ci" class="acc-custom-cat">
              <input type="text" v-model="cat.key" class="acc-input" placeholder="key (vd: office)" style="flex:1" />
              <input type="text" v-model="cat.label" class="acc-input" :placeholder="t('admin.msg_a205de', 'Tên (vd: Văn phòng)')" style="flex:1.5" />
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
            <h5 class="acc-settings-group__title">{{ t('admin.msg_5cc2e9af', 'Thông tin người bán (hiển trên hoá đơn)') }}</h5>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>{{ t('admin.msg_c9c58407', 'Tên cửa hàng / Công ty') }}</label>
                <input type="text" v-model="accConfig.seller_name" class="acc-input" />
              </div>
              <div class="acc-form-row">
                <label>{{ t('admin.msg_05755dd6', 'Mã số thuế') }}</label>
                <input type="text" v-model="accConfig.seller_tax_id" class="acc-input" placeholder="VD: 0123456789" />
              </div>
            </div>
            <div class="acc-form-grid">
              <div class="acc-form-row">
                <label>{{ t('admin.msg_5457a69f', 'SĐT') }}</label>
                <input type="text" v-model="accConfig.seller_phone" class="acc-input" />
              </div>
              <div class="acc-form-row">
                <label>Email</label>
                <input type="text" v-model="accConfig.seller_email" class="acc-input" />
              </div>
            </div>
            <div class="acc-form-row">
              <label>{{ t('admin.address', 'Địa chỉ') }}</label>
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
              <h4>{{ t('admin.msg_9e1b88d0', 'Thêm bút toán') }}</h4>
              <button class="acc-modal__close" @click="showEntryForm = false"><X :size="16" /></button>
            </div>
            <div class="acc-modal__body">
              <div class="acc-form-row">
                <label>{{ t('admin.msg_568d862e', 'Loại *') }}</label>
                <select v-model="entryForm.type" class="acc-select">
                  <option value="revenue">Thu (revenue)</option>
                  <option value="expense">Chi (expense)</option>
                  <option value="adjustment">{{ t('admin.msg_6a48ef4e', 'Điều chỉnh') }}</option>
                </select>
              </div>
              <div class="acc-form-grid">
                <div class="acc-form-row">
                  <label>{{ t('admin.msg_685b6c36', 'Danh mục *') }}</label>
                  <select v-model="entryForm.category" class="acc-select">
                    <option value="order_revenue">{{ t('admin.msg_c4f7fae9', 'Doanh thu đơn hàng') }}</option>
                    <option value="cogs">{{ t('admin.msg_534a0154', 'Giá vốn hàng bán (COGS)') }}</option>
                    <option value="shipping_cost">{{ t('admin.shipping_fee', 'Phí vận chuyển') }}</option>
                    <option value="refund">{{ t('admin.msg_94280c8b', 'Hoàn trả') }}</option>
                    <option value="marketing">Marketing</option>
                    <option value="salary">{{ t('admin.msg_0931b128', 'Lương') }}</option>
                    <option value="rent">{{ t('admin.msg_9a2b203a', 'Thuê mặt bằng') }}</option>
                    <option value="supplies">{{ t('admin.msg_a9274621', 'Vật tư') }}</option>
                    <option value="other">{{ t('admin.msg_06c1f85a', 'Khác') }}</option>
                  </select>
                </div>
                <div class="acc-form-row">
                  <label>{{ t('admin.msg_ec04e223', 'Ngày *') }}</label>
                  <input type="date" v-model="entryForm.entry_date" class="acc-input" />
                </div>
              </div>
              <div class="acc-form-grid">
                <div class="acc-form-row">
                  <label>{{ t('admin.msg_b203db75', 'Số tiền *') }}</label>
                  <input type="number" v-model.number="entryForm.amount" class="acc-input" step="1000" />
                </div>
                <div class="acc-form-row">
                  <label>{{ t('admin.msg_500aedd2', 'Thuế') }}</label>
                  <input type="number" v-model.number="entryForm.tax_amount" class="acc-input" step="100" />
                </div>
              </div>
              <div class="acc-form-row">
                <label>{{ t('admin.description', 'Mô tả') }}</label>
                <input type="text" v-model="entryForm.description" class="acc-input" :placeholder="t('admin.msg_237d9f', 'VD: Chi phí quảng cáo T3/2026')" />
              </div>
            </div>
            <div class="acc-modal__footer">
              <button class="acc-btn" @click="showEntryForm = false">{{ t('admin.msg_9daba04f', 'Huỷ') }}</button>
              <button class="acc-btn acc-btn--primary" @click="saveEntry" :disabled="savingEntry">
                <Save :size="13" /> {{ savingEntry ? t('admin.saving', 'Đang lưu...') : 'Lưu' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Invoice Preview Modal -->
    <InvoicePreviewModal
      :show="showInvoicePreview"
      :invoiceId="previewInvoiceId"
      @close="showInvoicePreview = false"
      @updated="loadInvoices"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import {
  TrendingUp, TrendingDown, DollarSign, Receipt, BarChart2,
  BookOpen, FileText, Plus, Trash2, Save, X, Download, Settings, Flag, Eye,
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import InvoicePreviewModal from './InvoicePreviewModal.vue'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const emit = defineEmits(['navigate-to-tax', 'navigate-to-order'])
const { showToast } = useToast()

const tabs = [
  { key: 'overview', label: t('admin.msg_09c0fd66', 'Tổng quan'), icon: BarChart2 },
  { key: 'tax', label: t('admin.msg_06015044', 'Báo cáo thuế'), icon: Receipt },
  { key: 'entries', label: t('admin.msg_9df87a66', 'Sổ thu chi'), icon: BookOpen },
  { key: 'invoices', label: t('admin.msg_ee8632be', 'Hoá đơn'), icon: FileText },
  { key: 'pnl', label: t('admin.msg_4b74a5d2', 'Lãi lỗ'), icon: TrendingUp },
  { key: 'balance', label: t('admin.msg_f4b1279c', 'Cân đối'), icon: DollarSign },
  { key: 'settings', label: t('admin.msg_1a691070', 'Cài đặt'), icon: Settings },
]
const activeTab = ref('overview')

// Dates
const dateFrom = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10))
const dateTo = ref(new Date().toISOString().slice(0, 10))

// Data
const summary = ref({ revenue: 0, expenses: 0, profit: 0, tax_payable: 0, tax_collected: 0, adjustments: 0, cogs: 0, gross_profit: 0, operating_expenses: 0 })
const monthly = ref([])
const taxReport = ref([])
const taxYear = ref(new Date().getFullYear())
const entries = ref([])
const invoices = ref([])
const entryFilter = ref({ type: '' })
const showEntryForm = ref(false)
const savingEntry = ref(false)
const entryForm = ref({ type: 'expense', category: 'other', amount: 0, tax_amount: 0, description: '', entry_date: new Date().toISOString().slice(0, 10) })

// New data: P&L, Balance Sheet, Invoice Preview
const pnlData = ref(null)
const balanceData = ref(null)
const showInvoicePreview = ref(false)
const previewInvoiceId = ref(null)

// Config
const accConfig = ref({
  auto_email: 'true',
  invoice_prefix: 'INV',
  payment_terms: '0',
  tax_label: 'VAT',
  footer_text: t('admin.msg_52e4453a', 'Cảm ơn quý khách!'),
  custom_categories: '[]',
  seller_name: '',
  seller_phone: '',
  seller_email: '',
  seller_address: '',
  seller_tax_id: '',
})
const customCategories = ref([])
const savingConfig = ref(false)

// Tax integration data
const taxConfig = ref({ enabled: false, price_includes_tax: false, display_mode: 'exclusive', label: 'VAT' })
const activeTaxRates = ref([])

function formatPrice(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v || 0)
}
function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN')
}

const catLabels = {
  order_revenue: t('admin.msg_898ab6cf', 'Doanh thu ĐH'), shipping_cost: t('admin.msg_7960dd56', 'Phí VC'), refund: t('admin.msg_94280c8b', 'Hoàn trả'), cogs: t('admin.msg_4b50770c', 'Giá vốn (COGS)'),
  inventory_purchase: t('admin.msg_94e97353', 'Nhập kho'), inventory_export: t('admin.msg_25af27c7', 'Xuất kho'), inventory_return: t('admin.msg_67702abb', 'Trả NCC'), inventory_adjust: t('admin.msg_cd34d41d', 'Kiểm kê'),
  marketing: 'Marketing', salary: t('admin.msg_0931b128', 'Lương'), rent: t('admin.msg_3fa5ac09', 'Thuê MB'), supplies: t('admin.msg_a9274621', 'Vật tư'), other: t('admin.msg_06c1f85a', 'Khác'), tax: t('admin.msg_500aedd2', 'Thuế'),
}
function categoryLabel(c) { return catLabels[c] || c }

const statusLabels = { draft: t('admin.msg_867cf3b9', 'Nháp'), issued: t('admin.msg_3d064afb', 'Đã xuất'), paid: t('admin.msg_04b5eaed', 'Đã TT'), cancelled: t('admin.msg_9daba04f', 'Huỷ') }
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

async function loadPnl() {
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  const data = await fetchJSON(`/accounting/profit-loss?${params}`)
  pnlData.value = data || {
    revenue: { total: 0, by_category: [] },
    expenses: { total: 0, by_category: [] },
    adjustments: 0, tax_payable: 0, gross_profit: 0, net_profit: 0, margin: 0,
  }
}

async function loadBalance() {
  const data = await fetchJSON(`/accounting/balance-sheet?as_of=${dateTo.value}`)
  balanceData.value = data || {
    as_of: dateTo.value,
    assets: { cash_on_hand: 0, accounts_receivable: 0, total: 0 },
    liabilities: { tax_payable: 0, overdue_invoices: 0, total: 0 },
    equity: 0,
    summary: { invoice_count: 0, paid_invoice_count: 0 },
  }
}

async function loadAll() {
  await Promise.all([loadSummary(), loadMonthly(), loadTaxReport(), loadEntries(), loadInvoices(), loadTaxConfig(), loadPnl(), loadBalance()])
}

function openEntryForm() {
  entryForm.value = { type: 'expense', category: 'other', amount: 0, tax_amount: 0, description: '', entry_date: new Date().toISOString().slice(0, 10) }
  showEntryForm.value = true
}

async function saveEntry() {
  if (!entryForm.value.amount || !entryForm.value.entry_date) {
    showToast(t('admin.msg_04c8a0', 'Vui lòng nhập số tiền và ngày'), 'error'); return
  }
  savingEntry.value = true
  try {
    const res = await apiFetch('/accounting/entries', {
      method: 'POST',
      body: JSON.stringify(entryForm.value),
    })
    if (!res.ok) throw new Error()
    showToast(t('admin.msg_687d3a', 'Đã tạo bút toán'), 'success')
    showEntryForm.value = false
    loadAll()
  } catch { showToast(t('admin.msg_8262f5', 'Lỗi tạo bút toán'), 'error') }
  savingEntry.value = false
}

async function deleteEntry(e) {
  if (!confirm(`${t('admin.delete', 'Xóa')} bút toán "${e.description}"?`)) return
  try {
    const res = await apiFetch(`/accounting/entries/${e.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    showToast(t('admin.msg_4ef74b', 'Đã xoá'), 'success')
    loadAll()
  } catch { showToast(t('admin.msg_78bfe3', 'Lỗi xoá'), 'error') }
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

function exportExcel(type) {
  const base = getApiBaseUrl()
  const params = new URLSearchParams()
  if (dateFrom.value) params.set('from', dateFrom.value)
  if (dateTo.value) params.set('to', dateTo.value)
  if (type === 'tax') {
    params.set('year', taxYear.value)
    window.open(`${base}/accounting/export-tax-excel?${params}`, '_blank')
  } else if (type === 'entries') {
    if (entryFilter.value.type) params.set('type', entryFilter.value.type)
    window.open(`${base}/accounting/export-entries-excel?${params}`, '_blank')
  } else {
    params.set('year', taxYear.value)
    window.open(`${base}/accounting/export-combined?${params}`, '_blank')
  }
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
    showToast(t('admin.msg_390420', 'Đã lưu cấu hình kế toán'), 'success')
  } catch { showToast(t('admin.msg_166445', 'Lỗi lưu cấu hình'), 'error') }
  savingConfig.value = false
}

loadConfig()

async function loadTaxConfig() {
  try {
    const res = await apiFetch('/tax-config')
    const raw = await res.json()
    const d = raw?.enabled !== undefined ? raw : raw?.data
    if (d) {
      taxConfig.value.enabled = d.enabled === true || d.enabled === 'true'
      taxConfig.value.price_includes_tax = d.price_includes_tax === true || d.price_includes_tax === 'true'
      taxConfig.value.display_mode = d.display_mode || 'exclusive'
      taxConfig.value.label = d.label || 'VAT'
    }
  } catch { /* fallback */ }
  if (taxConfig.value.enabled) {
    try {
      const res = await apiFetch('/tax-rates')
      const raw = await res.json()
      const rates = Array.isArray(raw) ? raw : raw?.data || []
      activeTaxRates.value = rates.filter(r => r.is_active)
    } catch { activeTaxRates.value = [] }
  }
}
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

/* COGS Breakdown Bar */
.acc-cogs-bar { margin: 16px 0 20px; }
.acc-cogs-bar__inner { display: flex; height: 32px; border-radius: 10px; overflow: hidden; font-size: 11px; font-weight: 700; }
.acc-cogs-bar__segment { display: flex; align-items: center; justify-content: center; color: #fff; min-width: 4px; transition: width 0.5s ease; }
.acc-cogs-bar__segment--cogs { background: rgba(248,113,113,0.7); }
.acc-cogs-bar__segment--opex { background: rgba(251,191,36,0.5); }
.acc-cogs-bar__segment--profit { background: rgba(52,211,153,0.5); flex: 1; }
.acc-cogs-bar__legend { display: flex; gap: 16px; margin-top: 8px; font-size: 11px; color: var(--color-text-muted); }

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

/* ═══ Tax Integration ═══ */
.acc-tax-info {
  display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;
  padding: 12px 16px; margin-bottom: 20px; border-radius: 10px;
  background: var(--color-bg-elevated); border: 1px solid var(--glass-border);
  font-size: 13px;
}
.acc-tax-info__left { display: flex; align-items: center; gap: 8px; }
.acc-tax-info__label { font-weight: 700; color: var(--color-text-primary); }
.acc-tax-info__rates { display: flex; flex-wrap: wrap; gap: 6px; }

.acc-settings-group__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.acc-settings-group__header .acc-settings-group__title { margin: 0; }

.acc-tax-status { margin-top: 4px; }
.acc-tax-status__row {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  font-size: 13px; color: var(--color-text-secondary);
}
.acc-tax-status__rates { margin-top: 12px; }
.acc-tax-rates-list {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;
}
.acc-tax-rate-chip {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  font-size: 12px; transition: border-color 0.2s;
}
.acc-tax-rate-chip:hover { border-color: var(--color-accent-primary); }
.acc-tax-rate-chip__pct {
  font-weight: 800; font-size: 14px; color: var(--color-accent-primary);
}
.acc-tax-rate-chip__name {
  color: var(--color-text-muted); font-weight: 600;
}

/* ═══ P&L Report ═══ */
.acc-pnl { display: flex; flex-direction: column; gap: 16px; }
.acc-pnl__section {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 12px; padding: 16px; transition: border-color .2s;
}
.acc-pnl__section:hover { border-color: var(--color-accent-primary); }
.acc-pnl__section--summary { background: rgba(139,92,246,.06); border-color: rgba(139,92,246,.2); }
.acc-pnl__title {
  font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--glass-border);
}
.acc-pnl__title--green { color: #4ade80; }
.acc-pnl__title--red { color: #f87171; }
.acc-pnl__row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 5px 0; font-size: 13px; color: var(--color-text-secondary);
}
.acc-pnl__row small { color: var(--color-text-muted); font-size: 11px; }
.acc-pnl__subtotal {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0 0; margin-top: 6px; border-top: 1px solid var(--glass-border);
  font-size: 14px; font-weight: 700; color: var(--color-text-primary);
}
.acc-pnl__subtotal--big { font-size: 16px; }

/* ═══ Balance Sheet ═══ */
.acc-balance { display: flex; flex-direction: column; gap: 16px; }
.acc-balance__group {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 12px; padding: 16px; transition: border-color .2s;
}
.acc-balance__group:hover { border-color: var(--color-accent-primary); }
.acc-balance__title {
  font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;
  margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--glass-border);
}
.acc-balance__title--blue { color: #60a5fa; }
.acc-balance__title--red { color: #f87171; }
.acc-balance__title--green { color: #4ade80; }
.acc-balance__row {
  display: flex; justify-content: space-between; padding: 5px 0;
  font-size: 13px; color: var(--color-text-secondary);
}
.acc-balance__total {
  display: flex; justify-content: space-between;
  padding: 8px 0 0; margin-top: 6px; border-top: 1px solid var(--glass-border);
  font-size: 14px; font-weight: 700; color: var(--color-text-primary);
}
.acc-balance__total--big { font-size: 18px; }
.acc-balance__info {
  display: flex; gap: 16px; padding: 10px 16px;
  background: var(--glass-bg); border-radius: 10px;
  font-size: 12px; color: var(--color-text-muted);
}
.acc-balance-date { font-size: 12px; color: var(--color-text-muted); }

/* Reference link */
.acc-ref-link {
  color: var(--color-accent-primary); text-decoration: none; font-weight: 600;
  cursor: pointer; transition: color .2s;
}
.acc-ref-link:hover { color: #60a5fa; text-decoration: underline; }

/* Purple accent */
.acc-cell--purple { color: #a78bfa; }

</style>


