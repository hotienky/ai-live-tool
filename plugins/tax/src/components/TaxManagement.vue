<template>
  <div class="tax-management">
    <!-- Tax Config Section -->
    <section class="tax-section">
      <div class="tax-section__header">
        <h4 class="tax-section__title"><Settings :size="14" /> Cài đặt thuế</h4>
        <button class="tax-btn tax-btn--primary tax-btn--sm" @click="saveConfig" :disabled="savingConfig">
          <Save :size="13" /> {{ savingConfig ? 'Đang lưu...' : 'Lưu cấu hình' }}
        </button>
      </div>

      <div class="tax-config">
        <div class="tax-row">
          <label class="tax-label">Bật thuế</label>
          <label class="tax-switch">
            <input type="checkbox" v-model="config.enabled" />
            <span class="tax-switch__slider"></span>
          </label>
        </div>

        <template v-if="config.enabled">
          <div class="tax-row">
            <label class="tax-label">Giá đã bao gồm thuế</label>
            <label class="tax-switch">
              <input type="checkbox" v-model="config.price_includes_tax" />
              <span class="tax-switch__slider"></span>
            </label>
          </div>

          <div class="tax-row">
            <label class="tax-label">Nhãn hiển thị</label>
            <input type="text" v-model="config.label" class="tax-input tax-input--sm" placeholder="VAT" />
          </div>

          <div class="tax-row">
            <label class="tax-label">Hiển thị trên storefront</label>
            <select v-model="config.display_mode" class="tax-select">
              <option value="exclusive">Giá chưa gồm thuế + dòng thuế riêng</option>
              <option value="inclusive">Giá đã gồm thuế</option>
              <option value="both">Cả hai (giá + dòng thuế)</option>
            </select>
          </div>

          <div class="tax-row">
            <label class="tax-label">Cách làm tròn</label>
            <select v-model="config.rounding" class="tax-select tax-select--sm">
              <option value="round">Làm tròn</option>
              <option value="ceil">Làm tròn lên</option>
              <option value="floor">Làm tròn xuống</option>
            </select>
          </div>
        </template>
      </div>
    </section>

    <!-- Vietnam 2026 Quick Apply -->
    <section v-if="config.enabled && !rates.length" class="tax-section tax-section--vn">
      <div class="tax-section__header">
        <h4 class="tax-section__title"><Flag :size="14" /> Thuế suất Việt Nam 2026</h4>
      </div>
      <div class="tax-vn-apply">
        <p class="tax-vn-apply__desc">Áp dụng nhanh 4 mức thuế GTGT theo quy định Việt Nam hiện hành:</p>
        <div class="tax-vn-rates">
          <div class="tax-vn-rate"><span class="tax-vn-rate__pct">0%</span><span>Xuất khẩu</span></div>
          <div class="tax-vn-rate"><span class="tax-vn-rate__pct">5%</span><span>Thiết yếu</span></div>
          <div class="tax-vn-rate"><span class="tax-vn-rate__pct tax-vn-rate__pct--highlight">8%</span><span>Giảm thuế <small>(đến 31/12/2026)</small></span></div>
          <div class="tax-vn-rate"><span class="tax-vn-rate__pct">10%</span><span>Tiêu chuẩn</span></div>
        </div>
        <button class="tax-btn tax-btn--primary" @click="applyVN2026Rates" :disabled="applyingVN">
          <Flag :size="13" /> {{ applyingVN ? 'Đang tạo...' : 'Áp dụng thuế suất VN 2026' }}
        </button>
        <p class="tax-vn-legal">Theo Luật Thuế GTGT 2024 (hiệu lực 01/07/2025) &amp; Nghị định 174/2025/NĐ-CP</p>
      </div>
    </section>

    <!-- Tax Rates Section -->
    <section v-if="config.enabled" class="tax-section">
      <div class="tax-section__header">
        <h4 class="tax-section__title"><Percent :size="14" /> Danh sách thuế suất</h4>
        <div style="display:flex;gap:6px">
          <button v-if="rates.length" class="tax-btn tax-btn--sm" @click="applyVN2026Rates" :disabled="applyingVN" title="Thêm các mức thuế VN 2026 còn thiếu">
            <Flag :size="12" /> VN 2026
          </button>
          <button class="tax-btn tax-btn--sm" @click="openForm(null)">
            <Plus :size="13" /> Thêm thuế suất
          </button>
        </div>
      </div>

      <div v-if="loading" class="tax-loading">{{ t('admin.msg_d5fe42f6', 'Đang tải...') }}</div>

      <table v-else-if="rates.length" class="tax-table">
        <thead>
          <tr>
            <th>Tên</th>
            <th>Mã</th>
            <th>Thuế suất</th>
            <th>Loại</th>
            <th>Phạm vi</th>
            <th>Trạng thái</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rate in rates" :key="rate.id">
            <td class="tax-cell--name">{{ rate.name }}</td>
            <td><code>{{ rate.code }}</code></td>
            <td>
              <span class="tax-badge tax-badge--rate">
                {{ rate.type === 'percentage' ? rate.rate + '%' : formatCurrency(rate.rate) }}
              </span>
            </td>
            <td>{{ rate.type === 'percentage' ? 'Phần trăm' : 'Cố định' }}</td>
            <td>
              <span class="tax-badge" :class="'tax-badge--' + rate.scope">
                {{ scopeLabel(rate.scope) }}
              </span>
            </td>
            <td>
              <span class="tax-status" :class="{ active: rate.is_active }">
                {{ rate.is_active ? '✓ Hoạt động' : '○ Tắt' }}
              </span>
            </td>
            <td class="tax-cell--actions">
              <button class="tax-action-btn" @click="openForm(rate)" :title="t('admin.edit', 'Sửa')" ><Pencil :size="13" /></button>
              <button class="tax-action-btn tax-action-btn--danger" @click="deleteRate(rate)" :title="t('admin.delete', 'Xóa')" ><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="tax-empty">
        <Percent :size="28" />
        <p>Chưa có thuế suất nào. Bấm "Thêm thuế suất" hoặc "Áp dụng thuế suất VN 2026".</p>
      </div>
    </section>

    <!-- Cross-navigation to Accounting -->
    <section v-if="config.enabled" class="tax-section">
      <div class="tax-section__header">
        <h4 class="tax-section__title"><Receipt :size="14" /> Báo cáo thuế</h4>
        <button class="tax-btn tax-btn--sm" @click="emit('navigate-to-accounting')">
          <BarChart2 :size="13" /> Xem báo cáo kế toán →
        </button>
      </div>
      <div class="tax-config">
        <p class="tax-vn-legal">Xem báo cáo thuế thu, thuế hoàn, và thuế phải nộp theo tháng trong phần Kế toán.</p>
      </div>
    </section>

    <!-- Form Modal -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="showForm" class="tax-modal-overlay" @click.self="showForm = false">
          <div class="tax-modal">
            <div class="tax-modal__header">
              <h4>{{ editingRate ? 'Sửa thuế suất' : 'Thêm thuế suất' }}</h4>
              <button class="tax-modal__close" @click="showForm = false"><X :size="16" /></button>
            </div>

            <div class="tax-modal__body">
              <div class="tax-form-row">
                <label>Tên thuế suất *</label>
                <input v-model="form.name" type="text" class="tax-input" placeholder="VD: VAT 10%" />
              </div>
              <div class="tax-form-row">
                <label>Mã (code) *</label>
                <input v-model="form.code" type="text" class="tax-input" placeholder="VD: vat_10" />
              </div>
              <div class="tax-form-grid">
                <div class="tax-form-row">
                  <label>Thuế suất *</label>
                  <input v-model.number="form.rate" type="number" step="0.01" min="0" class="tax-input" placeholder="10" />
                </div>
                <div class="tax-form-row">
                  <label>Loại</label>
                  <select v-model="form.type" class="tax-select">
                    <option value="percentage">Phần trăm (%)</option>
                    <option value="fixed">Cố định (₫)</option>
                  </select>
                </div>
              </div>
              <div class="tax-form-grid">
                <div class="tax-form-row">
                  <label>Phạm vi áp dụng</label>
                  <select v-model="form.scope" class="tax-select">
                    <option value="global">Toàn bộ sản phẩm</option>
                    <option value="category">Theo danh mục</option>
                    <option value="product">Theo sản phẩm</option>
                    <option value="region">Theo khu vực</option>
                  </select>
                </div>
                <div class="tax-form-row">
                  <label>Ưu tiên</label>
                  <input v-model.number="form.priority" type="number" min="0" class="tax-input" />
                </div>
              </div>

              <div v-if="form.scope !== 'global'" class="tax-form-row">
                <label>Áp dụng cho (IDs, cách nhau bằng dấu phẩy)</label>
                <input v-model="form.applies_to_text" type="text" class="tax-input" placeholder="VD: 1, 2, 5" />
                <span class="tax-hint">
                  {{ form.scope === 'category' ? 'ID danh mục' : form.scope === 'product' ? 'ID sản phẩm' : 'ID tỉnh thành' }}
                </span>
              </div>

              <div class="tax-form-grid">
                <div class="tax-form-row">
                  <label class="tax-checkbox-label">
                    <input type="checkbox" v-model="form.is_compound" />
                    Thuế chồng thuế (tính trên giá + thuế trước)
                  </label>
                </div>
                <div class="tax-form-row">
                  <label class="tax-checkbox-label">
                    <input type="checkbox" v-model="form.is_active" />
                    Hoạt động
                  </label>
                </div>
              </div>
            </div>

            <div class="tax-modal__footer">
              <button class="tax-btn" @click="showForm = false">Huỷ</button>
              <button class="tax-btn tax-btn--primary" @click="saveRate" :disabled="savingRate">
                <Save :size="13" /> {{ savingRate ? 'Đang lưu...' : 'Lưu' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { useI18n } from '../helpers.js'
import { ref, onMounted } from 'vue'
import { Settings, Percent, Plus, Pencil, Trash2, Save, X, Flag, Receipt, BarChart2 } from 'lucide-vue-next'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'

const emit = defineEmits(['navigate-to-accounting'])
const { showToast } = useToast()
const { t } = useI18n()

const loading = ref(false)
const savingConfig = ref(false)
const savingRate = ref(false)
const applyingVN = ref(false)
const showForm = ref(false)
const editingRate = ref(null)
const rates = ref([])

const config = ref({
  enabled: false,
  price_includes_tax: false,
  display_mode: 'exclusive',
  label: 'VAT',
  rounding: 'round',
})

const defaultForm = {
  name: '', code: '', rate: 10, type: 'percentage',
  scope: 'global', applies_to_text: '', is_compound: false,
  is_active: true, priority: 0,
}
const form = ref({ ...defaultForm })

function scopeLabel(scope) {
  return { global: 'Toàn bộ', category: 'Danh mục', product: 'Sản phẩm', region: 'Khu vực' }[scope] || scope
}

function formatCurrency(v) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)
}

async function loadConfig() {
  try {
    const res = await apiFetch('/tax-config')
    const raw = await res.json()
    // apiFetch.json() auto-unwraps {type, data} envelope → raw might be the config directly
    const d = raw?.enabled !== undefined ? raw : raw?.data
    if (d) {
      config.value.enabled = d.enabled === true || d.enabled === 'true'
      config.value.price_includes_tax = d.price_includes_tax === true || d.price_includes_tax === 'true'
      config.value.display_mode = d.display_mode || 'exclusive'
      config.value.label = d.label || 'VAT'
      config.value.rounding = d.rounding || 'round'
    }
  } catch { /* use defaults */ }
}

async function saveConfig() {
  savingConfig.value = true
  try {
    const res = await apiFetch('/tax-config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: config.value.enabled ? 'true' : 'false',
        price_includes_tax: config.value.price_includes_tax ? 'true' : 'false',
        display_mode: config.value.display_mode,
        label: config.value.label,
        rounding: config.value.rounding,
      }),
    })
    if (!res.ok) throw new Error()
    showToast('Đã lưu cấu hình thuế', 'success')
  } catch {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu cấu hình', 'error')
  } finally {
    savingConfig.value = false
  }
}

async function loadRates() {
  loading.value = true
  try {
    const res = await apiFetch('/tax-rates')
    const data = await res.json()
    rates.value = data?.data || []
  } catch { rates.value = [] }
  loading.value = false
}

function openForm(rate) {
  if (rate) {
    editingRate.value = rate
    form.value = {
      ...rate,
      applies_to_text: (rate.applies_to || []).join(', '),
    }
  } else {
    editingRate.value = null
    form.value = { ...defaultForm }
  }
  showForm.value = true
}

async function saveRate() {
  if (!form.value.name || !form.value.code) {
    showToast('Vui lòng nhập tên và mã', 'error')
    return
  }
  savingRate.value = true
  try {
    const payload = {
      name: form.value.name,
      code: form.value.code,
      rate: form.value.rate,
      type: form.value.type,
      scope: form.value.scope,
      is_compound: form.value.is_compound,
      is_active: form.value.is_active,
      priority: form.value.priority || 0,
      applies_to: form.value.scope === 'global' ? null :
        form.value.applies_to_text.split(',').map(s => parseInt(s.trim())).filter(Boolean),
    }

    const url = editingRate.value ? `/tax-rates/${editingRate.value.id}` : '/tax-rates'
    const method = editingRate.value ? 'PUT' : 'POST'
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error()
    showToast(editingRate.value ? 'Đã cập nhật' : 'Đã thêm thuế suất', 'success')
    showForm.value = false
    await loadRates()
  } catch {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu thuế suất', 'error')
  } finally {
    savingRate.value = false
  }
}

async function deleteRate(rate) {
  if (!confirm(`${t('admin.delete', 'Xóa')} thuế suất "${rate.name}"?`)) return
  try {
    const res = await apiFetch(`/tax-rates/${rate.id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error()
    showToast('Đã xoá', 'success')
    await loadRates()
  } catch {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' xoá', 'error')
  }
}

const VN_2026_RATES = [
  { name: 'GTGT 0% — Xuất khẩu', code: 'vat_0_export', rate: 0, type: 'percentage', scope: 'global', is_active: true, priority: 0 },
  { name: 'GTGT 5% — Thiết yếu', code: 'vat_5_essential', rate: 5, type: 'percentage', scope: 'global', is_active: true, priority: 1 },
  { name: 'GTGT 8% — Giảm thuế (NĐ 174/2025)', code: 'vat_8_reduced', rate: 8, type: 'percentage', scope: 'global', is_active: true, priority: 2 },
  { name: 'GTGT 10% — Tiêu chuẩn', code: 'vat_10_standard', rate: 10, type: 'percentage', scope: 'global', is_active: true, priority: 3 },
]

async function applyVN2026Rates() {
  applyingVN.value = true
  let created = 0
  const existingCodes = rates.value.map(r => r.code)
  try {
    for (const rate of VN_2026_RATES) {
      if (existingCodes.includes(rate.code)) continue
      const res = await apiFetch('/tax-rates', { method: 'POST', body: JSON.stringify(rate) })
      if (res.ok) created++
    }
    if (created > 0) {
      showToast(`Đã tạo ${created} thuế suất VN 2026`, 'success')
      await loadRates()
    } else {
      showToast('Tất cả thuế suất VN 2026 đã tồn tại', 'info')
    }
  } catch {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' tạo thuế suất', 'error')
  }
  applyingVN.value = false
}

onMounted(async () => {
  await loadConfig()
  if (config.value.enabled) await loadRates()
})
</script>

<style scoped>
.tax-management { display: flex; flex-direction: column; gap: 20px; }

.tax-section {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 14px;
  overflow: hidden;
}

.tax-section__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
}

.tax-section__title {
  font-size: 14px; font-weight: 700;
  color: var(--color-text-primary);
  display: flex; align-items: center; gap: 8px;
  margin: 0;
}

/* Config */
.tax-config { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }

.tax-row {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}

.tax-label {
  font-size: 13px; font-weight: 600; color: var(--color-text-secondary);
}

.tax-input, .tax-select {
  padding: 10px 14px; border-radius: 10px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-primary); font-size: 13px;
  transition: border-color 0.2s; outline: none;
}
.tax-input:focus, .tax-select:focus { border-color: var(--color-accent-primary); outline: none; }
.tax-input--sm { max-width: 120px; }
.tax-select--sm { max-width: 160px; }

/* Switch */
.tax-switch { position: relative; width: 44px; height: 24px; cursor: pointer; }
.tax-switch input { opacity: 0; width: 0; height: 0; }
.tax-switch__slider {
  position: absolute; inset: 0; border-radius: 12px;
  background: var(--color-border); transition: 0.3s;
}
.tax-switch__slider::before {
  content: ''; position: absolute; width: 18px; height: 18px;
  left: 3px; top: 3px; border-radius: 50%;
  background: #fff; transition: 0.3s;
}
.tax-switch input:checked + .tax-switch__slider { background: var(--color-accent-primary); }
.tax-switch input:checked + .tax-switch__slider::before { transform: translateX(20px); }

/* Table */
.tax-table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 13px; }
.tax-table th {
  text-align: left; padding: 12px 16px; font-weight: 700; font-size: 11px;
  color: var(--color-text-muted); border-bottom: 1px solid var(--color-border);
  text-transform: uppercase; letter-spacing: 0.5px;
  background: var(--color-bg-elevated);
}
.tax-table td { padding: 12px 16px; border-bottom: 1px solid var(--color-border); }
.tax-table tbody tr { transition: background 0.15s; }
.tax-table tbody tr:hover { background: var(--color-bg-elevated); }
.tax-cell--name { font-weight: 600; color: var(--color-text-primary); }
.tax-cell--actions { display: flex; gap: 6px; }

/* Badges */
.tax-badge {
  display: inline-flex; padding: 3px 10px; border-radius: 8px;
  font-size: 11px; font-weight: 700; letter-spacing: 0.2px;
}
.tax-badge--rate { background: var(--color-accent-glow); color: var(--color-accent-primary); }
.tax-badge--global { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.tax-badge--category { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.tax-badge--product { background: rgba(245, 158, 11, 0.12); color: #f59e0b; }
.tax-badge--region { background: rgba(168, 85, 247, 0.12); color: #a855f7; }

.tax-status { font-size: 12px; font-weight: 600; }
.tax-status.active { color: #10b981; }

/* Buttons */
.tax-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.25s;
}
.tax-btn:hover { border-color: var(--color-border-hover); transform: translateY(-1px); }
.tax-btn--primary {
  background: var(--accent-gradient); color: #fff; border: none;
  box-shadow: var(--accent-shadow);
}
.tax-btn--primary:hover { transform: translateY(-1px); }
.tax-btn--primary:disabled { opacity: 0.6; cursor: wait; }
.tax-btn--sm { padding: 6px 12px; font-size: 12px; }

.tax-action-btn {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-muted);
  cursor: pointer; transition: all 0.2s;
}
.tax-action-btn:hover { background: var(--color-bg-elevated); color: var(--color-accent-primary); }
.tax-action-btn--danger:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.3); }

/* Empty & Loading */
.tax-empty, .tax-loading {
  padding: 40px 20px; text-align: center;
  color: var(--color-text-muted); font-size: 13px;
}
.tax-empty p { margin: 8px 0 0; }

/* Modal */
.tax-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.tax-modal {
  background: var(--color-bg-primary); border: 1px solid var(--glass-border);
  border-radius: 16px; width: 560px; max-width: 90vw; max-height: 85vh;
  overflow-y: auto; box-shadow: 0 24px 64px rgba(0, 0, 0, 0.3);
}
.tax-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 24px; border-bottom: 1px solid var(--color-border);
}
.tax-modal__header h4 { margin: 0; font-size: 16px; font-weight: 800; color: var(--color-text-primary); }
.tax-modal__close {
  background: none; border: none; color: var(--color-text-muted);
  cursor: pointer; padding: 4px;
}
.tax-modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.tax-modal__footer {
  display: flex; justify-content: flex-end; gap: 10px;
  padding: 16px 24px; border-top: 1px solid var(--color-border);
}

.tax-form-row { display: flex; flex-direction: column; gap: 6px; }
.tax-form-row label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.tax-form-row .tax-input, .tax-form-row .tax-select { width: 100%; }
.tax-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tax-hint { font-size: 11px; color: var(--color-text-muted); }
.tax-checkbox-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--color-text-secondary); cursor: pointer;
}

/* Modal transitions */
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.2s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

@media (max-width: 640px) {
  .tax-form-grid { grid-template-columns: 1fr; }
  .tax-row { flex-direction: column; align-items: flex-start; gap: 6px; }
}

/* VN 2026 Quick Apply */
.tax-section--vn { border-color: rgba(245, 158, 11, 0.3); }
.tax-vn-apply { padding: 20px 24px; }
.tax-vn-apply__desc { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 14px; }
.tax-vn-rates {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;
  margin-bottom: 16px;
}
.tax-vn-rate {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 8px; border-radius: 10px;
  background: var(--color-bg-elevated); border: 1px solid var(--color-border);
  font-size: 12px; color: var(--color-text-muted); font-weight: 600;
  transition: border-color 0.2s;
}
.tax-vn-rate:hover { border-color: var(--color-accent-primary); }
.tax-vn-rate__pct {
  font-size: 22px; font-weight: 800; color: var(--color-text-primary);
}
.tax-vn-rate__pct--highlight { color: #f59e0b; }
.tax-vn-legal {
  font-size: 11px; color: var(--color-text-muted); margin-top: 12px;
  font-style: italic;
}
@media (max-width: 640px) {
  .tax-vn-rates { grid-template-columns: repeat(2, 1fr); }
}
</style>
