<template>
  <div class="mp-page">
    <div class="mp-page__header">
      <h2 class="mp-page__title">Quản lý Modules</h2>
      <p class="mp-page__desc">Quản lý modules, định giá và duyệt yêu cầu từ tenant</p>
    </div>

    <!-- Tabs -->
    <div class="mod-tabs">
      <button :class="['mod-tab', { active: tab === 'modules' }]" @click="tab = 'modules'">
        <Puzzle :size="16" /> Modules ({{ allModules.length }})
      </button>
      <button :class="['mod-tab', { active: tab === 'requests' }]" @click="tab = 'requests'; loadRequests()">
        <Clock :size="16" /> Yêu cầu chờ duyệt
        <span v-if="requests.length" class="mod-tab__badge">{{ requests.length }}</span>
      </button>
    </div>

    <!-- Modules Tab -->
    <div v-if="tab === 'modules'" class="mod-section">
      <div v-if="loading" class="mod-loading">Đang tải...</div>

      <div v-else class="mod-table-wrap">
        <table class="mod-table">
          <thead>
            <tr>
              <th>Module</th>
              <th>Danh mục</th>
              <th>Phiên bản</th>
              <th>Giá</th>
              <th>Trạng thái</th>
              <th style="width: 120px">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in allModules" :key="m.id">
              <td>
                <div class="mod-cell-name">
                  <strong>{{ m.name }}</strong>
                  <span class="mod-cell-id">{{ m.module_id }}</span>
                </div>
              </td>
              <td><span class="mod-cat-badge">{{ m.category }}</span></td>
              <td>{{ m.version }}</td>
              <td>
                <span v-if="m.price > 0" class="mod-price">{{ formatPrice(m.price) }}</span>
                <span v-else class="mod-price mod-price--free">Miễn phí</span>
              </td>
              <td>
                <span :class="['mod-status', m.is_active ? 'mod-status--active' : 'mod-status--off']">
                  {{ m.is_active ? 'Hoạt động' : 'Tắt' }}
                </span>
              </td>
              <td>
                <div class="mod-actions">
                  <button class="mod-action-btn" :title="m.is_active ? 'Tắt' : 'Bật'" @click="toggleModule(m)">
                    <ToggleLeft v-if="!m.is_active" :size="16" />
                    <ToggleRight v-else :size="16" />
                  </button>
                  <button class="mod-action-btn mod-action-btn--edit" title="Sửa giá" @click="editPrice(m)">
                    <Pencil :size="14" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Pending Requests Tab -->
    <div v-if="tab === 'requests'" class="mod-section">
      <div v-if="reqLoading" class="mod-loading">Đang tải...</div>

      <div v-else-if="requests.length === 0" class="mod-empty">
        <CheckCircle :size="48" />
        <p>Không có yêu cầu chờ duyệt</p>
      </div>

      <div v-else class="mod-table-wrap">
        <table class="mod-table">
          <thead>
            <tr>
              <th>Tenant</th>
              <th>Module</th>
              <th>Giá</th>
              <th>Ghi chú</th>
              <th>Ngày yêu cầu</th>
              <th style="width: 160px">Hành động</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in requests" :key="r.id">
              <td><strong>Tenant #{{ r.tenant_id }}</strong></td>
              <td>{{ r.module_name }}</td>
              <td><span class="mod-price">{{ formatPrice(r.module_price) }}</span></td>
              <td>{{ r.request_note || '—' }}</td>
              <td>{{ formatDate(r.requested_at) }}</td>
              <td>
                <div class="mod-actions">
                  <button class="mod-action-btn mod-action-btn--approve" title="Duyệt" @click="approveReq(r)">
                    <Check :size="16" /> Duyệt
                  </button>
                  <button class="mod-action-btn mod-action-btn--reject" title="Từ chối" @click="rejectReq(r)">
                    <X :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit Price Modal -->
    <div v-if="editingModule" class="mod-modal-overlay" @click.self="editingModule = null">
      <div class="mod-modal">
        <h3>Chỉnh giá: {{ editingModule.name }}</h3>
        <div class="mod-modal__field">
          <label>Giá (VNĐ)</label>
          <input v-model.number="editPrice_val" type="number" min="0" step="10000" placeholder="0 = Miễn phí" />
        </div>
        <div class="mod-modal__actions">
          <button class="mod-btn mod-btn--cancel" @click="editingModule = null">Huỷ</button>
          <button class="mod-btn mod-btn--save" @click="savePrice">Lưu</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { modules as modulesApi } from '../services/api.js'
import {
  Puzzle, Clock, CheckCircle, Check, X, ToggleLeft, ToggleRight, Pencil,
} from 'lucide-vue-next'

const tab = ref('modules')
const allModules = ref([])
const requests = ref([])
const loading = ref(true)
const reqLoading = ref(false)
const editingModule = ref(null)
const editPrice_val = ref(0)

function formatPrice(p) {
  if (!p || p === 0) return 'Miễn phí'
  return new Intl.NumberFormat('vi-VN').format(p) + 'đ'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function loadModules() {
  loading.value = true
  try {
    const data = await modulesApi.list()
    allModules.value = data?.modules || data || []
  } catch (e) {
    console.error('Load modules failed:', e)
  } finally {
    loading.value = false
  }
}

async function loadRequests() {
  reqLoading.value = true
  try {
    const data = await modulesApi.pendingRequests()
    requests.value = data?.requests || data || []
  } catch (e) {
    console.error('Load requests failed:', e)
  } finally {
    reqLoading.value = false
  }
}

async function toggleModule(m) {
  try {
    await modulesApi.toggle(m.id)
    await loadModules()
  } catch (e) {
    alert('Lỗi: ' + e.message)
  }
}

function editPrice(m) {
  editingModule.value = m
  editPrice_val.value = m.price || 0
}

async function savePrice() {
  try {
    await modulesApi.update(editingModule.value.id, { price: editPrice_val.value })
    editingModule.value = null
    await loadModules()
  } catch (e) {
    alert('Lỗi: ' + e.message)
  }
}

async function approveReq(r) {
  if (!confirm(`Duyệt yêu cầu ${r.module_name} cho Tenant #${r.tenant_id}?`)) return
  try {
    await modulesApi.approve(r.id)
    await loadRequests()
  } catch (e) {
    alert('Lỗi: ' + e.message)
  }
}

async function rejectReq(r) {
  const reason = prompt('Lý do từ chối (tuỳ chọn):')
  if (reason === null) return
  try {
    await modulesApi.reject(r.id, reason)
    await loadRequests()
  } catch (e) {
    alert('Lỗi: ' + e.message)
  }
}

onMounted(() => {
  loadModules()
  loadRequests()
})
</script>

<style scoped>
.mp-page { padding: 24px 32px; }
.mp-page__header { margin-bottom: 24px; }
.mp-page__title { font-size: 22px; font-weight: 700; color: var(--mp-text-primary); margin: 0 0 4px; }
.mp-page__desc { font-size: 13px; color: var(--mp-text-muted); margin: 0; }

/* Tabs */
.mod-tabs {
  display: flex; gap: 4px; margin-bottom: 20px;
  border-bottom: 1px solid var(--mp-border); padding-bottom: 0;
}
.mod-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border: none; background: none;
  font-size: 13px; font-weight: 500; color: var(--mp-text-muted);
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.2s; position: relative;
}
.mod-tab:hover { color: var(--mp-text-primary); }
.mod-tab.active {
  color: #3b82f6; border-bottom-color: #3b82f6; font-weight: 600;
}
.mod-tab__badge {
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
  padding: 1px 6px; border-radius: 10px; min-width: 18px; text-align: center;
}

/* Table */
.mod-table-wrap { overflow-x: auto; }
.mod-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.mod-table th {
  text-align: left; padding: 10px 12px; font-weight: 600;
  color: var(--mp-text-muted); border-bottom: 1px solid var(--mp-border);
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
}
.mod-table td {
  padding: 12px; border-bottom: 1px solid var(--mp-border);
  color: var(--mp-text-primary);
}
.mod-table tr:hover td { background: var(--mp-nav-hover-bg); }

.mod-cell-name { display: flex; flex-direction: column; gap: 2px; }
.mod-cell-id { font-size: 11px; color: var(--mp-text-muted); font-family: monospace; }

.mod-cat-badge {
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
  background: rgba(99,102,241,0.12); color: #818cf8;
}

.mod-price { font-weight: 600; color: #f59e0b; }
.mod-price--free { color: #22c55e; }

.mod-status {
  padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
}
.mod-status--active { background: rgba(34,197,94,0.12); color: #22c55e; }
.mod-status--off { background: rgba(248,113,113,0.12); color: #f87171; }

/* Actions */
.mod-actions { display: flex; gap: 6px; }
.mod-action-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
  border: 1px solid var(--mp-border); background: var(--mp-bg-input);
  color: var(--mp-text-secondary); cursor: pointer; transition: all 0.2s;
}
.mod-action-btn:hover { background: var(--mp-nav-hover-bg); color: var(--mp-text-primary); }

.mod-action-btn--approve {
  background: rgba(34,197,94,0.1); border-color: rgba(34,197,94,0.3);
  color: #22c55e;
}
.mod-action-btn--approve:hover { background: rgba(34,197,94,0.2); }

.mod-action-btn--reject {
  background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.3);
  color: #f87171;
}
.mod-action-btn--reject:hover { background: rgba(248,113,113,0.2); }

.mod-action-btn--edit {
  background: rgba(59,130,246,0.1); border-color: rgba(59,130,246,0.3);
  color: #3b82f6;
}

/* Loading / Empty */
.mod-loading, .mod-empty {
  text-align: center; padding: 60px 20px; color: var(--mp-text-muted);
}
.mod-empty svg { opacity: 0.3; margin-bottom: 12px; }

/* Modal */
.mod-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 50;
  backdrop-filter: blur(4px);
}
.mod-modal {
  background: var(--mp-bg-card); border: 1px solid var(--mp-border);
  border-radius: 12px; padding: 24px; min-width: 360px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.mod-modal h3 {
  font-size: 16px; font-weight: 700; color: var(--mp-text-primary);
  margin: 0 0 16px;
}
.mod-modal__field { margin-bottom: 16px; }
.mod-modal__field label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--mp-text-muted); margin-bottom: 6px;
}
.mod-modal__field input {
  width: 100%; padding: 10px 12px; border-radius: 8px;
  border: 1px solid var(--mp-border); background: var(--mp-bg-input);
  color: var(--mp-text-primary); font-size: 14px;
}
.mod-modal__actions { display: flex; gap: 8px; justify-content: flex-end; }

.mod-btn {
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: none; cursor: pointer; transition: all 0.2s;
}
.mod-btn--cancel {
  background: var(--mp-bg-input); color: var(--mp-text-secondary);
  border: 1px solid var(--mp-border);
}
.mod-btn--save {
  background: #3b82f6; color: #fff;
}
.mod-btn--save:hover { background: #2563eb; }
</style>
