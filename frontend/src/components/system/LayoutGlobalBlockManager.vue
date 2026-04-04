<template>
  <div class="gbm">
    <div class="gbm-header">
      <div class="gbm-header__left">
        <div class="gbm-header__icon"><ComponentIcon :size="18" /></div>
        <div>
          <h2 class="gbm-header__title">Global Blocks (Symbols)</h2>
          <p class="gbm-header__sub">Quản lý các khối giao diện dùng chung theo kiến trúc Modular</p>
        </div>
      </div>
      <button class="btn-add" @click="openCreate">
        <Plus :size="15" /> Tạo Global Block
      </button>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="gbm-skeleton">
      <div v-for="i in 3" :key="i" class="skeleton-row"></div>
    </div>

    <!-- Empty state -->
    <div v-else-if="blocks.length === 0" class="gbm-empty">
      <div class="gbm-empty__icon"><ComponentIcon :size="32" /></div>
      <p class="gbm-empty__text">Chưa có Global Block nào</p>
      <p class="gbm-empty__hint">Tạo một khối dùng chung (như Header, Banner, Popup) để chèn vào nhiều trang giao diện mà chỉ cần bảo trì ở một nơi.</p>
      <button class="btn-add" @click="openCreate"><Plus :size="15" /> Tạo Global Block đầu tiên</button>
    </div>

    <!-- Block list table -->
    <div v-else class="gbm-table-wrap">
      <table class="gbm-table">
        <thead>
          <tr>
            <th>Tên hiển thị (Name)</th>
            <th>Mã tham chiếu (Ref)</th>
            <th>Cập nhật lần cuối</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="block in blocks" :key="block.id" class="gbm-table__row">
            <td class="gbm-table__name">{{ block.name }}</td>
            <td class="gbm-table__ref"><span class="badge">{{ block.ref }}</span></td>
            <td class="gbm-table__time">{{ formatDate(block.updated_at) }}</td>
            <td class="gbm-table__actions">
              <button class="btn-icon" @click="openEdit(block)" title="Sửa JSON Builder"><Pencil :size="14" /></button>
              <button class="btn-icon btn-icon--danger" @click="confirmDelete(block)" title="Xóa"><Trash2 :size="14" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="modal-backdrop" @click.self="showModal = false">
        <div class="modal">
          <div class="modal__header">
            <h3 class="modal__title"><ComponentIcon :size="17" /> {{ editForm.id ? 'Sửa Global Block' : 'Tạo Global Block' }}</h3>
            <button class="btn-icon" @click="showModal = false"><X :size="16" /></button>
          </div>
          <div class="modal__body">
            <div class="form-row">
              <div class="form-group">
                <label>Tên hiển thị <span class="required">*</span></label>
                <input type="text" v-model="editForm.name" class="form-input" placeholder="VD: Banner Sale 2026" />
              </div>
              <div class="form-group">
                <label>Mã tham chiếu (ref) <span class="required">*</span></label>
                <input type="text" v-model="editForm.ref" class="form-input" placeholder="VD: promo_banner" :disabled="!!editForm.id" />
                <small style="color:var(--text-3); font-size: 11px; margin-top:4px; display:block">Sử dụng mã này vào ô "Ref" trong Layour Builder.</small>
              </div>
            </div>
            
            <div class="form-group" style="margin-top: 1rem">
              <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 8px;">
                <label style="margin-bottom:0">Cấu trúc layout_json</label>
              </div>
              <LanguageTabs
                v-if="currentLang"
                v-model="currentLang"
                :base-data="{ block_json: editForm.block_json }"
                :translations="editForm.translations"
                :fields="['block_json']"
                @auto-translate="() => alert('Chức năng dịch tự động JSON sẽ được phát triển sau.')"
              />
              <div style="font-size:12px; color:var(--text-3); margin-bottom: 6px; margin-top:-16px; line-height: 1.4;">
                Dán mã JSON block vào đây (tương ứng với ngôn ngữ đang chọn).
              </div>
              <textarea v-model="currentBlockJson" class="form-input json-editor" rows="12" placeholder="{ &quot;type&quot;: &quot;banner&quot;, ... }"></textarea>
            </div>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="showModal = false">Hủy</button>
            <button class="btn-save" @click="saveBlock" :disabled="saving">
              <Rocket v-if="saving" :size="14" class="spin" />
              {{ saving ? 'Đang lưu...' : 'Lưu Block' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete confirm modal -->
      <div v-if="deleteTarget" class="modal-backdrop" @click.self="deleteTarget = null">
        <div class="modal modal--sm">
          <div class="modal__header">
            <h3 class="modal__title"><Trash2 :size="17" /> Xác nhận xóa</h3>
            <button class="btn-icon" @click="deleteTarget = null"><X :size="16" /></button>
          </div>
          <div class="modal__body">
            <p>Xóa vĩnh viễn <strong>{{ deleteTarget.name }}</strong>?</p>
            <p style="color:#ef4444; font-size:12px; margin-top:8px">Nếu bạn xoá block này, tất cả các trang web đang chứa nó sẽ bị mất hiển thị thành phần đó!</p>
          </div>
          <div class="modal__footer">
            <button class="btn-ghost" @click="deleteTarget = null">Hủy</button>
            <button class="btn-danger" @click="deleteBlock">Xóa vĩnh viễn</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Component as ComponentIcon, Plus, Pencil, Trash2, X, Rocket } from 'lucide-vue-next'
import { apiFetch } from '../../composables/useApi.js'
import { useToast } from '../../composables/useToast.js'
import { useLanguages } from '../../composables/useLanguages.js'
import LanguageTabs from '../LanguageTabs.vue'

const { showToast } = useToast()
const { defaultLangCode, loadLanguages } = useLanguages()
loadLanguages()

const currentLang = ref('')
watch(defaultLangCode, (code) => {
  if (code && !currentLang.value) currentLang.value = code
}, { immediate: true })

const blocks = ref([])
const loading = ref(true)
const showModal = ref(false)
const saving = ref(false)
const deleteTarget = ref(null)

const editForm = ref({
  id: null,
  name: '',
  ref: '',
  block_json: '{\n  "type": "banner",\n  "params": {}\n}',
  translations: {}
})

const currentBlockJson = computed({
  get() {
    if (!currentLang.value || currentLang.value === defaultLangCode.value) {
      return editForm.value.block_json;
    }
    return editForm.value.translations?.[currentLang.value]?.block_json || editForm.value.block_json;
  },
  set(val) {
    if (!currentLang.value || currentLang.value === defaultLangCode.value) {
      editForm.value.block_json = val;
    } else {
      if (!editForm.value.translations) editForm.value.translations = {};
      if (!editForm.value.translations[currentLang.value]) {
        editForm.value.translations[currentLang.value] = {};
      }
      editForm.value.translations[currentLang.value].block_json = val;
    }
  }
})

async function load() {
  loading.value = true
  try {
    const res = await apiFetch('/layout-global-blocks')
    const data = await res.json()
    blocks.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (e) {
    showToast('Lỗi tải danh sách block: ' + e.message, 'error')
    blocks.value = []
  }
  loading.value = false
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function openCreate() {
  editForm.value = {
    id: null,
    name: '',
    ref: '',
    block_json: '{\n  "type": "banner",\n  "params": {}\n}',
    translations: {}
  }
  currentLang.value = defaultLangCode.value
  showModal.value = true
}

function openEdit(block) {
  let prettyJson = block.block_json
  try {
    if (typeof prettyJson === 'string') prettyJson = JSON.parse(prettyJson)
    prettyJson = JSON.stringify(prettyJson, null, 2)
  } catch {
    // leave as is
  }

  let formattedTranslations = {}
  try {
    if (block.translations) {
      for(const k in block.translations) {
        let bJson = block.translations[k]?.block_json
        if (bJson) {
           if (typeof bJson === 'string') bJson = JSON.parse(bJson)
           formattedTranslations[k] = { block_json: JSON.stringify(bJson, null, 2) }
        }
      }
    }
  } catch(e) {
    formattedTranslations = block.translations || {}
  }

  editForm.value = {
    id: block.id,
    name: block.name || '',
    ref: block.ref || '',
    block_json: prettyJson,
    translations: formattedTranslations
  }
  currentLang.value = defaultLangCode.value
  showModal.value = true
}

async function saveBlock() {
  if (!editForm.value.name || !editForm.value.ref) {
    showToast('Vui lòng nhập tên và mã tham chiếu', 'error')
    return
  }

  let finalJsonObject = null
  try {
    if (editForm.value.block_json) {
      finalJsonObject = JSON.parse(editForm.value.block_json)
    }
  } catch (e) {
    showToast('block_json ngôn ngữ gốc không đúng định dạng JSON hợp lệ!', 'error')
    return
  }

  // Parse translations block_json securely
  let finalTranslations = {}
  try {
    for (const locale in editForm.value.translations) {
      if (editForm.value.translations[locale] && editForm.value.translations[locale].block_json) {
        let localeJsonStr = editForm.value.translations[locale].block_json
        if (typeof localeJsonStr === 'string') {
          finalTranslations[locale] = { block_json: JSON.parse(localeJsonStr) }
        } else {
          finalTranslations[locale] = { block_json: localeJsonStr } // already object
        }
      }
    }
  } catch(e) {
    showToast('Mã JSON ở một trong các ngôn ngữ dịch không hợp lệ.', 'error')
    return 
  }

  saving.value = true
  const payload = {
    name: editForm.value.name,
    ref: editForm.value.ref,
    block_json: finalJsonObject,
    translations: finalTranslations
  }

  try {
    if (editForm.value.id) {
      await apiFetch(`/layout-global-blocks/${editForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      showToast('Đã lưu Global Block', 'success')
    } else {
      await apiFetch(`/layout-global-blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      showToast('Đã tạo Global Block', 'success')
    }
    showModal.value = false
    await load()
  } catch (e) {
    showToast('Lỗi lưu block: ' + e.message, 'error')
  }
  saving.value = false
}

function confirmDelete(block) { deleteTarget.value = block }

async function deleteBlock() {
  try {
    await apiFetch(`/layout-global-blocks/${deleteTarget.value.id}`, { method: 'DELETE' })
    showToast('Đã xóa khối dùng chung', 'success')
    deleteTarget.value = null
    await load()
  } catch (e) {
    showToast('Lỗi xóa block: ' + e.message, 'error')
  }
}

onMounted(load)
</script>

<style scoped>
/* Layout */
.gbm { padding: 0; }

/* Header */
.gbm-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 1.25rem; gap: 1rem;
}
.gbm-header__left { display: flex; align-items: flex-start; gap: .75rem; }
.gbm-header__icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: var(--color-accent-primary, #6366f1); color: #fff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.gbm-header__title { margin: 0 0 2px; font-size: 1rem; font-weight: 700; color: var(--text-1); }
.gbm-header__sub { margin: 0; font-size: .75rem; color: var(--text-3); }

/* Skeleton */
.gbm-skeleton { display: flex; flex-direction: column; gap: .5rem; }
.skeleton-row {
  height: 52px; border-radius: 8px;
  background: var(--bg-2);
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

/* Empty state */
.gbm-empty {
  text-align: center; padding: 3rem 1rem;
  background: var(--bg-2); border: 1px dashed var(--border); border-radius: 10px;
}
.gbm-empty__icon {
  display: inline-flex; align-items: center; justify-content: center;
  width: 56px; height: 56px; border-radius: 16px;
  background: var(--bg-3); color: var(--text-3); margin-bottom: .75rem;
}
.gbm-empty__text { margin: 0 0 .25rem; font-size: .9rem; font-weight: 600; color: var(--text-1); }
.gbm-empty__hint { margin: 0 0 1rem; font-size: .8rem; color: var(--text-3); }

/* Buttons */
.btn-add {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .4rem .75rem; border: none; border-radius: 7px; cursor: pointer;
  background: var(--color-accent-primary, #6366f1); color: #fff;
  font-size: .82rem; font-weight: 600; white-space: nowrap;
  transition: opacity .15s;
}
.btn-add:hover { opacity: .88; }
.btn-save {
  padding: .4rem .85rem; border: none; border-radius: 7px; cursor: pointer;
  background: var(--color-accent-primary, #6366f1); color: #fff; font-size: .82rem; font-weight: 600;
  transition: opacity .15s;
  display: flex; align-items: center; gap: 6px;
}
.btn-save:hover { opacity: .88; }
.btn-save:disabled { opacity: .6; cursor: not-allowed; }
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
.gbm-table-wrap {
  border: 1px solid var(--border); border-radius: 10px; overflow: hidden;
  background: var(--bg-1);
}
.gbm-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.gbm-table th {
  padding: .55rem .75rem; text-align: left;
  background: var(--bg-2); border-bottom: 1px solid var(--border);
  font-size: .7rem; font-weight: 600; text-transform: uppercase;
  letter-spacing: .04em; color: var(--text-3);
}
.gbm-table td {
  padding: .65rem .75rem; border-bottom: 1px solid var(--border);
  color: var(--text-1); vertical-align: middle;
}
.gbm-table__row:last-child td { border-bottom: none; }
.gbm-table__name { font-weight: 600; }
.gbm-table__actions { display: flex; gap: .3rem; }

/* Badges */
.badge {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: .7rem; font-family: monospace; background: var(--bg-3); color: var(--color-accent-primary, #6366f1);
  border: 1px solid var(--border);
}

/* Modal */
.modal-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--bg-1); border: 1px solid var(--border); border-radius: 14px;
  width: 680px; max-width: calc(100vw - 32px); min-height: 40vh; max-height: 90vh;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 20px 50px rgba(0,0,0,.25);
}
.modal--sm { width: 400px; }
.modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: .9rem 1.1rem; border-bottom: 1px solid var(--border); flex-shrink: 0;
}
.modal__title {
  display: flex; align-items: center; gap: .4rem;
  margin: 0; font-size: .9rem; font-weight: 700; color: var(--text-1);
}
.modal__body { padding: 1.1rem; overflow-y: auto; flex: 1; }
.modal__footer {
  padding: .75rem 1.1rem; border-top: 1px solid var(--border);
  display: flex; justify-content: flex-end; gap: .5rem; flex-shrink: 0;
  background: var(--bg-2);
}

/* Form */
.form-group { margin-bottom: .75rem; flex: 1;}
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: .4rem; font-weight: 600; }
.required { color: #ef4444; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
.form-input {
  width: 100%; padding: .5rem .6rem; border-radius: 7px;
  border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1);
  font-size: .82rem; box-sizing: border-box;
  transition: border-color .15s;
}
.form-input:focus { outline: none; border-color: var(--color-accent-primary, #6366f1); }
.json-editor {
  font-family: monospace; font-size: 13px; line-height: 1.5;
  background: #1e293b; color: #e2e8f0; border-color: #0f172a;
}
.json-editor:focus {
  border-color: var(--color-accent-primary, #6366f1);
  box-shadow: inset 0 0 0 1px var(--color-accent-primary, #6366f1);
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
