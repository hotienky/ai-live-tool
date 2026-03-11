<template>
  <div class="cm">
    <div class="cm-header">
      <h3><FolderOpen :size="16" /> Quản lý danh mục <span class="cm-count">({{ categories.length }})</span></h3>
      <button class="btn-add" @click="openCreate">+ Thêm danh mục</button>
    </div>

    <div class="cm-list" v-if="categories.length">
      <div class="cm-card" v-for="c in categories" :key="c.id">
        <div class="cm-card__img">
          <img v-if="c.image" :src="c.image" :alt="c.name" class="cm-thumb" />
          <FolderOpen v-else :size="20" class="cm-placeholder" />
        </div>
        <div class="cm-card__info">
          <strong>{{ c.name }}</strong>
          <span class="cm-slug" v-if="c.slug">/{{ c.slug }}</span>
          <span class="cm-desc" v-if="c.description">{{ c.description }}</span>
        </div>
        <div class="cm-card__meta">
          <span class="cm-sort">Sort: {{ c.sort ?? 0 }}</span>
          <span class="status-dot" :class="c.is_active || c.is_active === undefined ? 'active' : 'inactive'"
            @click="toggleActive(c)">
            {{ c.is_active || c.is_active === undefined ? 'Active' : 'Ẩn' }}
          </span>
        </div>
        <div class="cm-card__actions">
          <button class="btn-sm btn-edit" @click="openEdit(c)"><Edit3 :size="13" /></button>
          <button class="btn-sm btn-del" @click="handleDelete(c)"><Trash2 :size="13" /></button>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có danh mục nào</p>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới' }}</h3>
        <div class="form-group"><label>Tên danh mục *</label><input v-model="form.name" placeholder="Tên" /></div>
        <div class="form-group"><label>Slug</label><input v-model="form.slug" placeholder="Tự tạo nếu để trống" /></div>
        <div class="form-group"><label>Mô tả</label><textarea v-model="form.description" rows="3" placeholder="Mô tả..."></textarea></div>
        <div class="form-group"><label>Hình ảnh (URL)</label><input v-model="form.image" placeholder="https://..." /></div>
        <div class="form-group" v-if="form.image">
          <div class="image-preview"><img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Danh mục cha</label>
            <select v-model="form.parent_id">
              <option :value="null">— Không có —</option>
              <option v-for="pc in categories.filter(x => x.id !== editId)" :key="pc.id" :value="pc.id">{{ pc.name }}</option>
            </select>
          </div>
          <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
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
import { FolderOpen, Edit3, Trash2 } from 'lucide-vue-next'

const { showToast } = useToast()
const props = defineProps({ /* tenant-scoped */ })

const categories = ref([])
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref(defaultForm())

function defaultForm() { return { name: '', slug: '', description: '', image: '', parent_id: null, sort: 0 } }

async function fetchCategories() {
  try {
    const res = await apiFetch(`/categories`)
    categories.value = await res.json()
  } catch { categories.value = [] }
}

function openCreate() { form.value = defaultForm(); isEditing.value = false; editId.value = null; showModal.value = true }
function openEdit(c) {
  form.value = { name: c.name, slug: c.slug || '', description: c.description || '', image: c.image || '', parent_id: c.parent_id || null, sort: c.sort ?? 0 }
  isEditing.value = true; editId.value = c.id; showModal.value = true
}

async function handleSave() {
  if (!form.value.name) return
  try {
    const body = { ...form.value }
    if (isEditing.value) {
      await apiFetch(`/categories/${editId.value}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast('Đã cập nhật danh mục', 'success')
    } else {
      await apiFetch('/categories', { method: 'POST', body: JSON.stringify(body) })
      showToast('Đã thêm danh mục', 'success')
    }
    showModal.value = false; await fetchCategories()
  } catch (e) { showToast('Lỗi: ' + (e.message || 'Unknown'), 'error') }
}

async function handleDelete(c) {
  if (!confirm(`Xóa danh mục "${c.name}"?`)) return
  try { await apiFetch(`/categories/${c.id}`, { method: 'DELETE' }); showToast('Đã xóa', 'success'); await fetchCategories() }
  catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function toggleActive(c) {
  try {
    await apiFetch(`/categories/${c.id}`, { method: 'PUT', body: JSON.stringify({ is_active: c.is_active === false ? true : false }) })
    c.is_active = c.is_active === false ? true : false
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

onMounted(() => fetchCategories())
</script>

<style scoped>
.cm { display: flex; flex-direction: column; gap: 16px; }
.cm-header { display: flex; align-items: center; justify-content: space-between; }
.cm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.cm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.btn-add { padding: 7px 16px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-add:hover { opacity: 0.85; }

.cm-list { display: flex; flex-direction: column; gap: 8px; }
.cm-card {
  display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.cm-card:hover { border-color: var(--color-accent-primary); }
.cm-card__img { flex-shrink: 0; }
.cm-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border); }
.cm-placeholder { color: var(--color-text-muted); }
.cm-card__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cm-card__info strong { font-size: 14px; }
.cm-slug { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.cm-desc { font-size: 12px; color: var(--color-text-secondary); }
.cm-card__meta { display: flex; align-items: center; gap: 8px; }
.cm-sort { font-size: 11px; color: var(--color-text-muted); }
.status-dot { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
.status-dot.active { background: rgba(16,185,129,0.15); color: #10b981; }
.status-dot.inactive { background: rgba(107,114,128,0.15); color: #6b7280; }
.cm-card__actions { display: flex; gap: 4px; }
.btn-sm { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s; }
.btn-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.btn-del:hover { color: #ef4444; border-color: #ef4444; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 16px; padding: 24px; width: 520px; max-width: 95vw; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 80px rgba(0,0,0,0.3); }
.modal h3 { font-size: 17px; font-weight: 700; margin: 0 0 20px; }
.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }
.image-preview { text-align: center; }
.image-preview img { max-height: 100px; border-radius: 8px; border: 1px solid var(--color-border); }
.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--color-border); }
.btn-cancel { padding: 8px 16px; border-radius: 8px; border: 1px solid var(--color-border); background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save { padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
