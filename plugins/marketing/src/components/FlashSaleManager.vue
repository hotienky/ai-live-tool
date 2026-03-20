<template>
  <div class="fsm">
    <!-- Header -->
    <div class="fsm-header">
      <div class="fsm-header__left">
        <div class="fsm-header__icon"><Zap :size="18" /></div>
        <div>
          <h2 class="fsm-header__title">Flash Sales</h2>
          <p class="fsm-header__sub">{{ t('admin.msg_b6f8819c', 'Quản lý chương trình flash sale và sản phẩm giảm giá có thời hạn') }}</p>
        </div>
      </div>
      <button class="btn-add" @click="openCreate">
        <Plus :size="15" /> Tạo Flash Sale
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="fsm-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-row"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="sales.length === 0" class="fsm-empty">
      <div class="fsm-empty__icon"><Zap :size="32" /></div>
      <p class="fsm-empty__text">{{ t('admin.msg_32557884', 'Chưa có Flash Sale nào') }}</p>
      <p class="fsm-empty__hint">{{ t('admin.flash_sale_hint', 'Tạo chương trình flash sale để thu hút khách hàng mua hàng nhanh hơn') }}</p>
      <button class="btn-add" @click="openCreate"><Plus :size="15" />{{ t('admin.msg_601a1164', 'Tạo Flash Sale đầu tiên') }}</button>
    </div>

    <!-- Sales table -->
    <div v-else class="fsm-table-wrap">
      <table class="fsm-table">
        <thead>
          <tr>
            <th>{{ t('admin.msg_e7fc4d79', 'Chương trình') }}</th>
            <th>{{ t('admin.time', 'Thời gian') }}</th>
            <th>{{ t('admin.promotion.product', 'Sản phẩm') }}</th>
            <th>{{ t('admin.status', 'Trạng thái') }}</th>
            <th>{{ t('admin.on_off', 'Bật/Tắt') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sale in sales" :key="sale.id" class="fsm-table__row">
            <td class="fsm-table__name">{{ sale.name }}</td>
            <td class="fsm-table__time">
              <span>{{ formatDate(sale.start_date) }}</span>
              <span class="fsm-table__arrow">→</span>
              <span>{{ formatDate(sale.end_date) }}</span>
            </td>
            <td class="fsm-table__count">
              <Package :size="13" />
              {{ sale.items?.length || 0 }} SP
            </td>
            <td>
              <span class="badge" :class="badgeClass(sale)">{{ statusLabel(sale) }}</span>
            </td>
            <td>
              <label class="toggle">
                <input type="checkbox" :checked="sale.is_active" @change="toggleActive(sale)" />
                <span class="toggle__slider"></span>
              </label>
            </td>
            <td class="fsm-table__actions">
              <button class="btn-icon" @click="openEdit(sale)" :title="t('admin.msg_e1504e01', 'Chỉnh sửa')" ><Pencil :size="14" /></button>
              <button class="btn-icon btn-icon--danger" @click="confirmDelete(sale)" :title="t('admin.delete', 'Xóa')" ><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Confirm delete modal -->
    <teleport to="body">
      <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3 class="modal__title"><Trash2 :size="17" />{{ t('admin.msg_f4ccd7ee', 'Xác nhận xóa') }}</h3>
            <button class="btn-icon" @click="deleteTarget = null"><X :size="16" /></button>
          </div>
          <div class="modal__body">
            <p>{{ t('admin.msg_4ed187a8', 'Xóa') }}<strong>{{ deleteTarget.name }}</strong>{{ t('admin.msg_b4b5e394', '? Toàn bộ sản phẩm trong Flash Sale này cũng sẽ bị xóa.') }}</p>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="deleteTarget = null">{{ t('admin.cancel', 'Hủy') }}</button>
            <button class="btn-danger" @click="deleteSale">{{ t('admin.delete', 'Xóa') }}</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { useI18n } from '../helpers.js'
import { ref, onMounted } from 'vue'
import { Zap, Plus, Pencil, Trash2, X, Package } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'

const { showToast } = useToast()
const { t } = useI18n()
const emit = defineEmits(['navigate'])

const sales = ref([])
const loading = ref(true)
const deleteTarget = ref(null)

// ── Load ──
async function load() {
  loading.value = true
  try {
    const res = await apiFetch('/flash-sales')
    const data = await res.json()
    sales.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { sales.value = [] }
  loading.value = false
}

// ── Navigate to form page (emit so parent can update URL) ──
function openCreate() {
  emit('navigate', 'shop/flash-sales/create')
}
function openEdit(sale) {
  emit('navigate', `shop/flash-sales/edit/${sale.id}`)
}

// ── Status helpers ──
function statusLabel(sale) {
  if (!sale.is_active) return t('admin.msg_258f00b2', 'Tắt')
  const now = new Date()
  if (new Date(sale.start_date) > now) return t('admin.msg_dd75ad6e', 'Sắp diễn ra')
  if (new Date(sale.end_date) < now) return t('admin.msg_1f742f2b', 'Hết hạn')
  return t('admin.msg_6fb3041e', 'Đang chạy')
}
function badgeClass(sale) {
  const s = statusLabel(sale)
  if (s === t('admin.msg_6fb3041e', 'Đang chạy')) return 'badge--green'
  if (s === t('admin.msg_dd75ad6e', 'Sắp diễn ra')) return 'badge--blue'
  return 'badge--gray'
}
function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Toggle ──
async function toggleActive(sale) {
  try {
    await apiFetch(`/flash-sales/${sale.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...sale, is_active: !sale.is_active }),
    })
    sale.is_active = !sale.is_active
    showToast(sale.is_active ? t('admin.msg_d767c93f', 'Đã bật Flash Sale') : t('admin.msg_6804d6dc', 'Đã tắt Flash Sale'), 'success')
  } catch { showToast('Có lỗi xảy ra', 'error') }
}

// ── Delete ──
function confirmDelete(sale) { deleteTarget.value = sale }
async function deleteSale() {
  try {
    await apiFetch(`/flash-sales/${deleteTarget.value.id}`, { method: 'DELETE' })
    showToast('Đã xóa Flash Sale', 'success')
    deleteTarget.value = null
    await load()
  } catch { showToast('Có lỗi xảy ra', 'error') }
}

onMounted(load)
</script>

<style scoped>
.fsm { padding: 0; }

/* Header */
.fsm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 1rem;
}
.fsm-header__left { display: flex; align-items: flex-start; gap: .75rem; }
.fsm-header__icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--accent); color: #fff;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.fsm-header__title { margin: 0 0 2px; font-size: 1rem; font-weight: 700; color: var(--text-1); }
.fsm-header__sub { margin: 0; font-size: .75rem; color: var(--text-3); }

/* Skeleton */
.fsm-skeleton { display: flex; flex-direction: column; gap: .5rem; }
.skeleton-row {
  height: 52px; border-radius: 8px; background: var(--bg-2);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

/* Empty */
.fsm-empty {
  text-align: center; padding: 3rem 1rem;
  background: var(--bg-2); border: 1px dashed var(--border); border-radius: 10px;
}
.fsm-empty__icon {
  display: inline-flex; width: 56px; height: 56px; border-radius: 16px;
  background: var(--bg-3); color: var(--text-3);
  align-items: center; justify-content: center; margin-bottom: .75rem;
}
.fsm-empty__text { margin: 0 0 .25rem; font-size: .9rem; font-weight: 600; color: var(--text-1); }
.fsm-empty__hint { margin: 0 0 1rem; font-size: .8rem; color: var(--text-3); }

/* Buttons */
.btn-add {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .4rem .75rem; border: none; border-radius: 7px; cursor: pointer;
  background: var(--accent); color: #fff;
  font-size: .82rem; font-weight: 600; white-space: nowrap; transition: opacity .15s;
}
.btn-add:hover { opacity: .88; }
.btn-ghost {
  padding: .4rem .75rem; border: 1px solid var(--border); border-radius: 7px;
  background: transparent; cursor: pointer; font-size: .82rem; color: var(--text-2);
}
.btn-ghost:hover { background: var(--bg-2); }
.btn-danger {
  padding: .4rem .75rem; border: none; border-radius: 7px; cursor: pointer;
  background: #ef4444; color: #fff; font-size: .82rem; font-weight: 600;
}
.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid var(--border); background: transparent; cursor: pointer;
  color: var(--text-2); transition: all .15s;
}
.btn-icon:hover { background: var(--bg-2); color: var(--text-1); }
.btn-icon--danger:hover { background: rgba(239,68,68,.1); color: #ef4444; border-color: rgba(239,68,68,.4); }

/* Table */
.fsm-table-wrap {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden; background: var(--bg-1);
}
.fsm-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.fsm-table th {
  padding: .55rem .75rem; text-align: left; background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; color: var(--text-3);
}
.fsm-table td {
  padding: .65rem .75rem; border-bottom: 1px solid var(--border);
  color: var(--text-1); vertical-align: middle;
}
.fsm-table__row:last-child td { border-bottom: none; }
.fsm-table__name { font-weight: 600; }
.fsm-table__time {
  display: flex; align-items: center; gap: .3rem;
  font-size: .75rem; color: var(--text-2);
}
.fsm-table__arrow { color: var(--text-3); }
.fsm-table__count {
  display: flex; align-items: center; gap: .3rem; font-size: .78rem; color: var(--text-2);
}
.fsm-table__actions { display: flex; gap: .3rem; }

/* Badges */
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 20px;
  font-size: .68rem; font-weight: 700; letter-spacing: .02em;
}
.badge--green { background: rgba(16,185,129,.12); color: #059669; }
.badge--blue  { background: rgba(99,102,241,.12);  color: #4f46e5; }
.badge--gray  { background: var(--bg-3); color: var(--text-3); }

/* Toggle */
.toggle { position: relative; display: inline-block; width: 34px; height: 20px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider {
  position: absolute; inset: 0; border-radius: 20px;
  background: var(--bg-3); transition: background .2s;
}
.toggle__slider::before {
  content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
  background: #fff; left: 3px; top: 3px; transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle input:checked + .toggle__slider { background: var(--accent); }
.toggle input:checked + .toggle__slider::before { transform: translateX(14px); }

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--bg-1); border: 1px solid var(--border); border-radius: 14px;
  width: 400px; max-width: calc(100vw - 32px);
  display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
}
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .9rem 1.1rem; border-bottom: 1px solid var(--border);
}
.modal__title {
  display: flex; align-items: center; gap: .4rem;
  margin: 0; font-size: .9rem; font-weight: 700; color: var(--text-1);
}
.modal__body { padding: 1.1rem; }
.modal__footer {
  padding: .75rem 1.1rem; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: .5rem;
  background: var(--bg-2);
}
</style>
