<template>
  <div class="cms-mgr">
    <div class="cm-header">
      <h3><FileText :size="16" /> Trang nội dung CMS</h3>
      <button class="btn-add" @click="openCreate">+ Thêm trang</button>
    </div>

    <div class="cm-list" v-if="pages.length">
      <div class="cm-card" v-for="p in pages" :key="p.id">
        <div class="cm-card__info">
          <strong>{{ p.title }}</strong>
          <span class="cm-slug">/{{ p.alias }}</span>
          <span class="status-dot" :class="p.status === 1 ? 'active' : 'inactive'">{{ p.status === 1 ? 'Published' : 'Draft' }}</span>
        </div>
        <div class="cm-card__actions">
          <button class="btn-sm btn-edit" @click="openEdit(p)">Sửa</button>
          <button class="btn-sm btn-del" @click="handleDelete(p)">×</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có trang CMS nào</p>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal--wide">
        <h3>{{ isEditing ? 'Sửa trang' : 'Thêm trang mới' }}</h3>
        <div class="form-group"><label>Tiêu đề</label><input v-model="form.title" /></div>
        <div class="form-group"><label>Alias (slug)</label><input v-model="form.alias" placeholder="Tự tạo từ tiêu đề nếu để trống" /></div>
        <div class="form-group"><label>Hình ảnh (URL)</label><input v-model="form.image" placeholder="https://..." /></div>
        <div class="form-group">
          <label>Nội dung (HTML)</label>
          <textarea v-model="form.content" rows="10" class="cm-textarea"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status"><option :value="1">Published</option><option :value="0">Draft</option></select>
          </div>
          <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave">{{ isEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useToast } from '../composables/useToast.js'
import { FileText } from 'lucide-vue-next'
const { showToast } = useToast()
const { pages, loading, fetchPages, createPage, updatePage, deletePage } = useCmsPages(apiFetch)
const props = defineProps({ shopId: [String, Number] })

const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ title: '', alias: '', content: '', image: '', status: 1, sort: 0 })

onMounted(() => fetchPages({ shopId: props.shopId }))
watch(() => props.shopId, () => fetchPages({ shopId: props.shopId }))

function openCreate() {
  isEditing.value = false; editId.value = null
  form.value = { title: '', alias: '', content: '', image: '', status: 1, sort: 0 }
  showModal.value = true
}
function openEdit(p) {
  isEditing.value = true; editId.value = p.id
  form.value = { title: p.title, alias: p.alias, content: p.content || '', image: p.image || '', status: p.status, sort: p.sort }
  showModal.value = true
}
async function handleSave() {
  if (!form.value.title) return showToast('Nhập tiêu đề', 'error')
  try {
    if (isEditing.value) {
      await updatePage(editId.value, form.value)
      showToast('✅ Đã cập nhật', 'success')
    } else {
      await createPage({ ...form.value, storeId: props.shopId })
      showToast('✅ Đã tạo trang', 'success')
    }
    showModal.value = false
    fetchPages({ shopId: props.shopId })
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleDelete(p) {
  if (!confirm(`Xóa trang "${p.title}"?`)) return
  await deletePage(p.id)
  fetchPages({ shopId: props.shopId })
  showToast('Đã xóa', 'success')
}
</script>

<style scoped>
.cms-mgr { padding: 0; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.cm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.cm-list { display: flex; flex-direction: column; gap: .4rem; }
.cm-card { display: flex; align-items: center; justify-content: space-between; padding: .6rem .8rem; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; }
.cm-card__info { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; }
.cm-slug { font-size: .75rem; color: var(--text-3); font-family: monospace; }
.status-dot { padding: 2px 8px; border-radius: 10px; font-size: .7rem; font-weight: 600; }
.status-dot.active { background: rgba(34,197,94,.15); color: #22c55e; }
.status-dot.inactive { background: rgba(239,68,68,.15); color: #ef4444; }
.cm-card__actions { display: flex; gap: .3rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-1); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
.modal--wide { max-width: 700px; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.form-row { display: flex; gap: .5rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: .5rem; }
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .4rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .85rem; }
.cm-textarea { width: 100%; padding: .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .82rem; font-family: monospace; resize: vertical; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
.btn-cancel { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text-2); cursor: pointer; }
.btn-save { padding: .4rem .8rem; border: none; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }
</style>
