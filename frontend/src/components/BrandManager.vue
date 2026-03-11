<template>
  <div class="bm">
    <div class="bm-header">
      <h3><Award :size="16" /> Quản lý thương hiệu <span class="bm-count">({{ brands.length }})</span></h3>
      <button class="btn-add" @click="openCreate">+ Thêm thương hiệu</button>
    </div>

    <div class="bm-grid" v-if="brands.length">
      <div v-for="b in brands" :key="b.id" class="bm-card">
        <div class="bm-card__img">
          <img v-if="b.image" :src="b.image" :alt="b.name" class="bm-logo" />
          <Award v-else :size="28" class="bm-placeholder" />
        </div>
        <div class="bm-card__info">
          <strong>{{ b.name }}</strong>
          <span class="bm-slug" v-if="b.slug">/{{ b.slug }}</span>
        </div>
        <div class="bm-card__actions">
          <button class="btn-sm btn-edit" @click="openEdit(b)"><Edit3 :size="13" /></button>
          <button class="btn-sm btn-del" @click="handleDelete(b)"><Trash2 :size="13" /></button>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có thương hiệu nào</p>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới' }}</h3>
        <div class="form-group"><label>Tên *</label><input v-model="form.name" placeholder="Tên thương hiệu" /></div>
        <div class="form-group"><label>Slug</label><input v-model="form.slug" placeholder="Tự tạo nếu để trống" /></div>
        <div class="form-group"><label>Mô tả</label><textarea v-model="form.description" rows="3" placeholder="Mô tả..."></textarea></div>
        <div class="form-group"><label>Logo (URL)</label><input v-model="form.image" placeholder="https://..." /></div>
        <div class="form-group" v-if="form.image">
          <div class="image-preview"><img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave" :disabled="!form.name">{{ isEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Award, Edit3, Trash2 } from 'lucide-vue-next'

const { showToast } = useToast()
const props = defineProps({ /* tenant-scoped */ })

const brands = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref(defaultForm())

function defaultForm() { return { name: '', slug: '', description: '', image: '' } }

async function fetchBrands() {
  try { const res = await apiFetch(`/brands`); brands.value = await res.json() }
  catch { brands.value = [] }
}

function openCreate() { form.value = defaultForm(); isEditing.value = false; editId.value = null; showModal.value = true }
function openEdit(b) {
  form.value = { name: b.name, slug: b.slug || '', description: b.description || '', image: b.image || '' }
  isEditing.value = true; editId.value = b.id; showModal.value = true
}

async function handleSave() {
  if (!form.value.name) return
  try {
    const body = { ...form.value }
    if (isEditing.value) {
      await apiFetch(`/brands/${editId.value}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast('Đã cập nhật thương hiệu', 'success')
    } else {
      await apiFetch('/brands', { method: 'POST', body: JSON.stringify(body) })
      showToast('Đã thêm thương hiệu', 'success')
    }
    showModal.value = false; await fetchBrands()
  } catch (e) { showToast('Lỗi: ' + (e.message || 'Unknown'), 'error') }
}

async function handleDelete(b) {
  if (!confirm(`Xóa "${b.name}"?`)) return
  try { await apiFetch(`/brands/${b.id}`, { method: 'DELETE' }); showToast('Đã xóa', 'success'); await fetchBrands() }
  catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

onMounted(() => fetchBrands())
</script>

<style scoped>
.bm { display: flex; flex-direction: column; gap: 16px; }
.bm-header { display: flex; align-items: center; justify-content: space-between; }
.bm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.bm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.btn-add { padding: 7px 16px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-add:hover { opacity: 0.85; }

.bm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.bm-card {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.bm-card:hover { border-color: var(--color-accent-primary); }
.bm-card__img { flex-shrink: 0; }
.bm-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-primary); padding: 4px; }
.bm-placeholder { color: var(--color-text-muted); }
.bm-card__info { flex: 1; }
.bm-card__info strong { font-size: 14px; display: block; }
.bm-slug { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.bm-card__actions { display: flex; gap: 4px; }
.btn-sm { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
.btn-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.btn-del:hover { color: #ef4444; border-color: #ef4444; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 16px; padding: 24px; width: 480px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.3); }
.modal h3 { font-size: 17px; font-weight: 700; margin: 0 0 20px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; }
.form-group input:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.image-preview { text-align: center; }
.image-preview img { max-height: 80px; border-radius: 8px; border: 1px solid var(--color-border); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.btn-cancel { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save { padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
