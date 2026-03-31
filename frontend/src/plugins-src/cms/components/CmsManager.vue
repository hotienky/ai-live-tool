<template>
  <div class="cms-mgr">
    <!-- PAGE BUILDER VIEW -->
    <CmsPageBuilder
      v-if="builderPageId !== null"
      :pageId="builderPageId"
      @back="builderPageId = null; fetchPages({})"
    />

    <!-- EDITOR VIEW -->
    <CmsEditor
      v-else-if="editId !== null"
      :editId="editId"
      @back="editId = null"
      @saved="onSaved"
    />

    <!-- LIST VIEW -->
    <template v-else>
      <div class="cm-header">
        <h3><FileText :size="16" />{{ t('admin.msg_a503d10c', 'Trang nội dung CMS') }}</h3>
        <button class="btn-add" @click="editId = ''">{{ t('admin.msg_47eef3e5', '+ Thêm trang') }}</button>
      </div>

      <div class="cm-list" v-if="pages.length">
        <div class="cm-card" v-for="p in pages" :key="p.id">
          <div class="cm-card__info">
            <div class="cm-card__title-row">
              <strong>{{ p.title }}</strong>
              <span v-if="p.is_system" class="badge badge--system" title="Trang hệ thống — không thể xóa">
                <Lock :size="10" /> Hệ thống
              </span>
              <span v-if="p.is_dynamic" class="badge badge--dynamic" title="Trang có Page Builder">
                <Layers :size="10" /> Dynamic
              </span>
            </div>
            <span class="cm-slug">/{{ p.alias }}</span>
            <span class="status-dot" :class="p.status ? 'active' : 'inactive'" @click="toggleStatus(p)">
              {{ p.status ? 'Published' : 'Draft' }}
            </span>
          </div>
          <div class="cm-card__meta">
            <span class="cm-sort">Sort: {{ p.sort }}</span>
          </div>
          <div class="cm-card__actions">
            <button class="btn-sm btn-preview" @click="previewPage(p)" title="Xem trước">⊙</button>
            <!-- Nút Page Builder chỉ hiện cho trang dynamic đã có ID -->
            <button
              v-if="p.is_dynamic"
              class="btn-sm btn-builder"
              @click="builderPageId = p.id"
              title="Mở Page Builder"
            >
              <Layout :size="12" />
            </button>
            <button class="btn-sm btn-edit" @click="editId = p.id">{{ t('admin.edit', 'Sửa') }}</button>
            <button
              v-if="!p.is_system"
              class="btn-sm btn-del"
              @click="handleDelete(p)"
              title="Xóa trang"
            >×</button>
            <span v-else class="btn-sm btn-del-disabled" title="Trang hệ thống không thể xóa">×</span>
          </div>
        </div>
      </div>
      <p v-else class="empty">{{ t('admin.msg_6d9fee60', 'Chưa có trang CMS nào') }}</p>

      <!-- Preview Modal -->
      <div class="modal-overlay" v-if="showPreview" @click.self="showPreview = false">
        <div class="modal modal--wide">
          <div class="preview-header">
            <h3>{{ previewData.title }}</h3>
            <button class="btn-close" @click="showPreview = false">×</button>
          </div>
          <div class="preview-meta">
            <span class="cm-slug">/{{ previewData.alias }}</span>
            <span class="status-dot" :class="previewData.status ? 'active' : 'inactive'">
              {{ previewData.status ? 'Published' : 'Draft' }}
            </span>
            <span v-if="previewData.is_system" class="badge badge--system"><Lock :size="10" /> Hệ thống</span>
            <span v-if="previewData.is_dynamic" class="badge badge--dynamic"><Layers :size="10" /> Dynamic</span>
          </div>
          <div
            class="preview-content"
            v-html="previewData.is_dynamic
              ? '<p style=\'color:#888;font-style:italic\'>Trang dynamic — mở Page Builder để xem bố cục.</p>'
              : previewData.content"
          ></div>
          <div v-if="previewData.is_dynamic" class="preview-footer">
            <button class="btn-builder-modal" @click="builderPageId = previewData.id; showPreview = false">
              <Layout :size="13" /> Mở Page Builder
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { useI18n, useToast, apiFetch } from '../helpers.js'
import { ref, onMounted } from 'vue'
import { useCmsPages } from '../composables/useCmsPages.js'
import { FileText, Lock, Layers, Layout } from 'lucide-vue-next'
import CmsEditor from './CmsEditor.vue'
import CmsPageBuilder from './CmsPageBuilder.vue'

const { showToast } = useToast()
const { t } = useI18n()
const { pages, fetchPages, updatePage, deletePage } = useCmsPages(apiFetch)

// editId: null = list, '' = create, <number> = edit
const editId = ref(null)
const builderPageId = ref(null)
const showPreview = ref(false)
const previewData = ref({})

onMounted(() => fetchPages({}))

function onSaved() {
  editId.value = null
  fetchPages({})
}

function previewPage(p) {
  previewData.value = p
  showPreview.value = true
}

async function toggleStatus(p) {
  try {
    const newStatus = !p.status
    await updatePage(p.id, { status: newStatus })
    showToast(newStatus ? 'Published' : 'Set to Draft', 'success')
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
.cms-mgr { display: flex; flex-direction: column; flex: 1; height: 100%; min-height: 0; }
.cm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; padding: 20px 20px 0 20px; }
.cm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .5rem 1rem; border-radius: 8px; cursor: pointer; font-size: .85rem; font-weight: 600; }
.btn-add:hover { filter: brightness(1.1); }
.cm-list { display: flex; flex-direction: column; gap: .4rem; padding: 0 20px 20px 20px; overflow-y: auto; flex: 1; }
.cm-card { display: flex; align-items: center; justify-content: space-between; padding: .6rem .8rem; background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; gap: .5rem; }
.cm-card__info { display: flex; align-items: center; gap: .6rem; flex-wrap: wrap; flex: 1; }
.cm-card__title-row { display: flex; align-items: center; gap: .4rem; flex-wrap: wrap; }
.cm-slug { font-size: .75rem; color: var(--text-3); font-family: monospace; }
.status-dot { padding: 2px 8px; border-radius: 10px; font-size: .7rem; font-weight: 600; cursor: pointer; transition: all .2s; }
.status-dot:hover { transform: scale(1.05); }
.status-dot.active { background: rgba(34,197,94,.15); color: #22c55e; }
.status-dot.inactive { background: rgba(239,68,68,.15); color: #ef4444; }
.cm-card__meta { font-size: .7rem; color: var(--text-3); }
.cm-sort { background: var(--bg-3, rgba(255,255,255,.05)); padding: 2px 6px; border-radius: 4px; }
.cm-card__actions { display: flex; gap: .3rem; align-items: center; }
.btn-sm { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); display: inline-flex; align-items: center; gap: 3px; }
.btn-preview:hover { border-color: var(--accent); }
.btn-builder { color: var(--accent); border-color: rgba(124,58,237,.3); background: rgba(124,58,237,.05); }
.btn-builder:hover { background: rgba(124,58,237,.1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.btn-del-disabled { padding: 4px 10px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); font-size: .75rem; color: var(--text-3); opacity: .4; cursor: not-allowed; }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 7px; border-radius: 8px; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
.badge--system { background: rgba(251,191,36,.15); color: #d97706; border: 1px solid rgba(251,191,36,.3); }
.badge--dynamic { background: rgba(139,92,246,.15); color: #7c3aed; border: 1px solid rgba(139,92,246,.3); }

/* Preview modal */
.preview-header { display: flex; align-items: center; justify-content: space-between; }
.preview-header h3 { margin: 0; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-2); padding: 0; line-height: 1; }
.preview-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; flex-wrap: wrap; }
.preview-content { padding: .8rem; background: var(--bg-2); border-radius: 8px; border: 1px solid var(--border); line-height: 1.6; font-size: .9rem; min-height: 80px; max-height: 50vh; overflow-y: auto; }
.preview-footer { margin-top: 12px; display: flex; justify-content: flex-end; }
.btn-builder-modal { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-builder-modal:hover { filter: brightness(1.1); }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.modal--wide { width: 90%; max-width: 800px; background: var(--bg-1); padding: 20px; border-radius: 12px; }
</style>
