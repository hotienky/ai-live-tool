<template>
  <div class="cms-mgr">
    
    <!-- LIST VIEW -->
    <div v-if="view === 'list'">
      <div class="cm-header">
        <h3><FileText :size="16" />{{ t('admin.msg_a503d10c', 'Trang nội dung CMS') }}</h3>
        <button class="btn-add" @click="openCreate">{{ t('admin.msg_47eef3e5', '+ Thêm trang') }}</button>
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
            <button class="btn-sm btn-edit" @click="openEdit(p)">{{ t('admin.edit', 'Sửa') }}</button>
            <button class="btn-sm btn-del" @click="handleDelete(p)">×</button>
          </div>
        </div>
      </div>
      <p v-else class="empty">{{ t('admin.msg_6d9fee60', 'Chưa có trang CMS nào') }}</p>
    </div>

    <!-- EDITOR VIEW -->
    <div v-else-if="view === 'editor'" class="cm-editor-view">
      <div class="cm-header">
        <div style="display:flex; align-items:center; gap: 8px;">
           <button class="btn-sm" @click="view = 'list'">← Quay lại</button>
           <h3>{{ editingId ? 'Sửa trang' : 'Tạo trang mới' }}</h3>
        </div>
        <button class="btn-add" @click="savePage" :disabled="saving">{{ saving ? 'Đang lưu...' : 'Lưu trang' }}</button>
      </div>

      <div class="cm-form">
        <div class="cm-form-group">
          <label>Tiêu đề trang (Title)</label>
          <input type="text" v-model="form.title" placeholder="Ví dụ: Giới thiệu công ty" class="cm-input" />
        </div>
        <div class="cm-form-row">
          <div class="cm-form-group half">
            <label>Đường dẫn tĩnh (Slug / Alias)</label>
            <input type="text" v-model="form.alias" placeholder="gioi-thieu" class="cm-input" />
          </div>
          <div class="cm-form-group half">
            <label>Sắp xếp (Sort Order)</label>
            <input type="number" v-model="form.sort" class="cm-input" />
          </div>
        </div>
        <div class="cm-form-group">
          <label>Nội dung (Content)</label>
          <RichTextEditor v-if="RichTextEditor" v-model="form.content" placeholder="Soạn nội dung trang..." />
          <textarea v-else v-model="form.content" rows="12" class="cm-input cm-textarea" placeholder="Nhập nội dung văn bản hoặc mã HTML (hỗ trợ shortcode)..."></textarea>
          <small style="color:var(--text-3); margin-top:4px; display:block;">Mẹo: Hỗ trợ mã HTML và các shortcode như <code>[lucky-draw id="1"]</code></small>
        </div>
        <div class="cm-form-row">
          <div class="cm-form-group half">
            <label>Meta Title (SEO)</label>
            <input type="text" v-model="form.meta_title" class="cm-input" />
          </div>
          <div class="cm-form-group half">
            <label>Meta Description (SEO)</label>
            <input type="text" v-model="form.meta_description" class="cm-input" />
          </div>
        </div>
        <div class="cm-form-group check-group">
          <label class="cm-checkbox">
            <input type="checkbox" v-model="form.status" :true-value="1" :false-value="0" />
            Trạng thái xuất bản (Published)
          </label>
        </div>
      </div>
    </div>

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
        <div class="preview-content" v-html="previewData.content"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useI18n, useToast, apiFetch } from '../helpers.js'
import { ref, shallowRef, onMounted } from 'vue'
import { useCmsPages } from '../composables/useCmsPages.js'
import { FileText } from 'lucide-vue-next'

const bridge = window.__APP_BRIDGE__ || {}
const editorComponent = shallowRef(bridge.components?.RichTextEditor || null)

const { showToast } = useToast()
const { t } = useI18n()
const { pages, loading, fetchPages, createPage, updatePage, deletePage } = useCmsPages(apiFetch)

const view = ref('list') // 'list' | 'editor'
const showPreview = ref(false)
const previewData = ref({})

// Editor state
const editingId = ref(null)
const saving = ref(false)
const form = ref({
  title: '',
  alias: '',
  content: '',
  sort: 0,
  status: 1,
  meta_title: '',
  meta_description: ''
})

onMounted(() => fetchPages({}))

function openCreate() {
  editingId.value = null
  form.value = { title: '', alias: '', content: '', sort: 0, status: 1, meta_title: '', meta_description: '' }
  view.value = 'editor'
}

function openEdit(p) {
  editingId.value = p.id
  form.value = { ...p }
  view.value = 'editor'
}

async function savePage() {
  if (!form.value.title) return showToast('Vui lòng nhập tiêu đề', 'error')
  saving.value = true
  try {
    if (editingId.value) {
      await updatePage(editingId.value, form.value)
      showToast('Đã cập nhật trang!', 'success')
    } else {
      await createPage(form.value)
      showToast('Đã tạo trang mới!', 'success')
    }
    view.value = 'list'
    fetchPages({})
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
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
    fetchPages({})
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function handleDelete(p) {
  if (!confirm(`Xóa trang "${p.title}"? Dữ liệu không thể khôi phục!`)) return
  await deletePage(p.id)
  fetchPages({})
  showToast('Đã xóa', 'success')
}
</script>

<style scoped>
.cms-mgr { padding: 0; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.cm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.btn-add:disabled { opacity: 0.7; cursor: not-allowed; }
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
.btn-sm { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-preview:hover { border-color: var(--accent); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }

/* Editor Form */
.cm-editor-view { background: var(--bg-1); border-radius: 8px; }
.cm-form { display: flex; flex-direction: column; gap: 1rem; background: var(--bg-2); padding: 16px; border-radius: 8px; border: 1px solid var(--border); }
.cm-form-row { display: flex; gap: 1rem; }
.cm-form-group { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.cm-form-group.half { flex: 1; }
.cm-form-group label { font-size: 0.8rem; font-weight: 600; color: var(--text-2); }
.cm-input { padding: 8px 12px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-1); color: var(--text-1); font-size: 0.9rem; }
.cm-input:focus { border-color: var(--accent); outline: none; }
.cm-textarea { resize: vertical; font-family: monospace; }
.cm-checkbox { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; cursor: pointer; }

/* Preview Modal */
.preview-header { display: flex; align-items: center; justify-content: space-between; }
.preview-header h3 { margin: 0; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-2); padding: 0; line-height: 1; }
.preview-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
.preview-content { padding: .8rem; background: var(--bg-2); border-radius: 8px; border: 1px solid var(--border); line-height: 1.6; font-size: .9rem; min-height: 100px; max-height: 60vh; overflow-y: auto; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.modal--wide { width: 90%; max-width: 800px; background: var(--bg-1); padding: 20px; border-radius: 12px; }
</style>
