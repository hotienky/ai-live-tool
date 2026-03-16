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
          <span class="status-dot" :class="p.status === 1 ? 'active' : 'inactive'" @click="toggleStatus(p)">
            {{ p.status === 1 ? 'Published' : 'Draft' }}
          </span>
        </div>
        <div class="cm-card__meta">
          <span class="cm-sort">Sort: {{ p.sort }}</span>
        </div>
        <div class="cm-card__actions">
          <button class="btn-sm btn-preview" @click="previewPage(p)">⊙</button>
          <button class="btn-sm btn-edit" @click="openEdit(p)">Sửa</button>
          <button class="btn-sm btn-del" @click="handleDelete(p)">×</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có trang CMS nào</p>

    <!-- Preview Modal -->
    <div class="modal-overlay" v-if="showPreview" @click.self="showPreview = false">
      <div class="modal modal--wide">
        <div class="preview-header">
          <h3>{{ previewData.title }}</h3>
          <button class="btn-close" @click="showPreview = false">×</button>
        </div>
        <div class="preview-meta">
          <span class="cm-slug">/{{ previewData.alias }}</span>
          <span class="status-dot" :class="previewData.status === 1 ? 'active' : 'inactive'">
            {{ previewData.status === 1 ? 'Published' : 'Draft' }}
          </span>
        </div>
        <div class="preview-image" v-if="previewData.image">
          <img :src="previewData.image" alt="Page image" />
        </div>
        <div class="preview-content" v-html="previewData.content"></div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal modal--wide">
        <h3>{{ isEditing ? 'Sửa trang' : 'Thêm trang mới' }}</h3>

        <!-- Tab switch: Edit / Preview -->
        <div class="cm-tabs">
          <button :class="{ active: editTab === 'edit' }" @click="editTab = 'edit'"><Pencil :size="12" /> Chỉnh sửa</button>
          <button :class="{ active: editTab === 'preview' }" @click="editTab = 'preview'">Xem trước</button>
        </div>

        <div v-show="editTab === 'edit'">
          <div class="form-group"><label>Tiêu đề</label><input v-model="form.title" /></div>
          <div class="form-group"><label>Alias (slug)</label><input v-model="form.alias" placeholder="Tự tạo từ tiêu đề nếu để trống" /></div>
          <div class="form-group"><label>Hình ảnh (URL)</label><input v-model="form.image" placeholder="https://..." /></div>
          <div class="form-group" v-if="form.image">
            <div class="image-preview">
              <img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" />
            </div>
          </div>
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; user-select: none; margin-bottom: 12px; color: var(--accent); font-weight: bold;">
              <input type="checkbox" v-model="form.is_dynamic" style="width: auto;" />
              Sử dụng Storefront Layout Builder (Kéo thả section)
            </label>
            <div v-if="form.is_dynamic" style="padding: 12px; background: rgba(124, 58, 237, 0.1); border-radius: 6px; color: var(--accent); font-size: 0.85rem;">
              Trang này sẽ được thiết kế bằng Layout Builder. Hãy lưu lại và chuyển sang tab "Bố cục Store" để thiết kế kéo thả.
            </div>
            <div v-else>
              <label>Nội dung (HTML)</label>
              <textarea v-model="form.content" rows="12" class="cm-textarea"></textarea>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Trạng thái</label>
              <select v-model="form.status"><option :value="1">Published</option><option :value="0">Draft</option></select>
            </div>
            <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
          </div>
        </div>

        <div v-show="editTab === 'preview'" class="cm-preview-pane">
          <h4 class="preview-title">{{ form.title || '(Chưa có tiêu đề)' }}</h4>
          <div class="preview-image" v-if="form.image">
            <img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" />
          </div>
          <div class="preview-content" v-html="form.content || '<p style=&quot;color: var(--text-3)&quot;>Chưa có nội dung</p>'"></div>
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
const props = defineProps({ /* tenant-scoped */ })

const showModal = ref(false)
const showPreview = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const editTab = ref('edit')
const form = ref({ title: '', alias: '', content: '', image: '', status: 1, sort: 0, is_dynamic: false })
const previewData = ref({})

onMounted(() => fetchPages({  }))

function openCreate() {
  isEditing.value = false; editId.value = null; editTab.value = 'edit'
  form.value = { title: '', alias: '', content: '', image: '', status: 1, sort: 0, is_dynamic: false }
  showModal.value = true
}
function openEdit(p) {
  isEditing.value = true; editId.value = p.id; editTab.value = 'edit'
  form.value = { title: p.title, alias: p.alias, content: p.content || '', image: p.image || '', status: p.status, sort: p.sort, is_dynamic: p.is_dynamic || false }
  showModal.value = true
}
function previewPage(p) {
  previewData.value = p
  showPreview.value = true
}
async function toggleStatus(p) {
  try {
    const newStatus = p.status === 1 ? 0 : 1
    await updatePage(p.id, { status: newStatus })
    showToast(newStatus === 1 ? 'Published' : 'Set to Draft', 'success')
    fetchPages({  })
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleSave() {
  if (!form.value.title) return showToast('Nhập tiêu đề', 'error')
  try {
    if (isEditing.value) {
      await updatePage(editId.value, form.value)
      showToast('Đã cập nhật', 'success')
    } else {
      await createPage({ ...form.value,  })
      showToast('Đã tạo trang', 'success')
    }
    showModal.value = false
    fetchPages({  })
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleDelete(p) {
  if (!confirm(`Xóa trang "${p.title}"?`)) return
  await deletePage(p.id)
  fetchPages({  })
  showToast('Đã xóa', 'success')
}
</script>

<style scoped>
.cms-mgr { padding: 0; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.cm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.cm-list { display: flex; flex-direction: column; gap: .4rem; }
.cm-card { display: flex; align-items: center; justify-content: space-between; padding: .6rem .8rem; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; gap: .5rem; }
.cm-card__info { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; flex: 1; }
.cm-slug { font-size: .75rem; color: var(--text-3); font-family: monospace; }
.status-dot { padding: 2px 8px; border-radius: 10px; font-size: .7rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.status-dot:hover { transform: scale(1.05); }
.status-dot.active { background: rgba(34,197,94,.15); color: #22c55e; }
.status-dot.inactive { background: rgba(239,68,68,.15); color: #ef4444; }
.cm-card__meta { font-size: .7rem; color: var(--text-3); }
.cm-sort { background: var(--bg-3, rgba(255,255,255,.05)); padding: 2px 6px; border-radius: 4px; }
.cm-card__actions { display: flex; gap: .3rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-preview:hover { border-color: var(--accent); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }

/* Tabs */
.cm-tabs { display: flex; gap: 0; margin-bottom: 1rem; border-bottom: 1px solid var(--border); }
.cm-tabs button { background: none; border: none; padding: .5rem 1rem; font-size: .85rem; cursor: pointer; color: var(--text-2); border-bottom: 2px solid transparent; transition: all .2s; }
.cm-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }
.cm-tabs button:hover { color: var(--text-1); }

/* Preview */
.cm-preview-pane { min-height: 200px; }
.preview-header { display: flex; align-items: center; justify-content: space-between; }
.preview-header h3 { margin: 0; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-2); padding: 0; line-height: 1; }
.preview-title { margin: 0 0 .5rem; font-size: 1.1rem; }
.preview-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
.preview-image { margin-bottom: .8rem; border-radius: 8px; overflow: hidden; }
.preview-image img { max-width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }
.preview-content { padding: .8rem; background: var(--bg-2); border-radius: 8px; border: 1px solid var(--border); line-height: 1.6; font-size: .9rem; min-height: 100px; }
.image-preview { margin-top: 4px; }
.image-preview img { max-width: 100%; max-height: 120px; border-radius: 6px; object-fit: cover; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
/* Removed local modal style */
/* Removed modal wide override */
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
