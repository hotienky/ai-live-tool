<template>
  <div class="cms-mgr">
    <div class="cm-header">
      <h3><FileText :size="16" /> {{ t('admin.msg_a503d10c', 'Trang nội dung CMS') }}</h3>
      <button class="btn-add" @click="$emit('navigate', 'shop/cms/create')">{{ t('admin.msg_47eef3e5', '+ Thêm trang') }}</button>
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
          <button class="btn-sm btn-edit" @click="$emit('navigate', `shop/cms/edit/${p.id}`)">{{ t('admin.msg_9026a724', 'Sửa') }}</button>
          <button class="btn-sm btn-del" @click="handleDelete(p)">{{ t('admin.msg_63922286', '×') }}</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">{{ t('admin.msg_6d9fee60', 'Chưa có trang CMS nào') }}</p>

    <!-- Preview Modal (keep this one since it's just a quick view) -->
    <div class="modal-overlay" v-if="showPreview" @click.self="showPreview = false">
      <div class="modal modal--wide">
        <div class="preview-header">
          <h3>{{ previewData.title }}</h3>
          <button class="btn-close" @click="showPreview = false">{{ t('admin.msg_63922286', '×') }}</button>
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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useToast } from '../composables/useToast.js'
import { FileText } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()
const { pages, loading, fetchPages, updatePage, deletePage } = useCmsPages(apiFetch)

const emit = defineEmits(['navigate'])
const showPreview = ref(false)
const previewData = ref({})

onMounted(() => fetchPages({}))

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
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}

async function handleDelete(p) {
  if (!confirm(`${t('admin.delete', 'Xóa')} trang "${p.title}"?`)) return
  await deletePage(p.id)
  fetchPages({})
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
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

.preview-header { display: flex; align-items: center; justify-content: space-between; }
.preview-header h3 { margin: 0; }
.btn-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-2); padding: 0; line-height: 1; }
.preview-meta { display: flex; align-items: center; gap: .5rem; margin-bottom: .8rem; }
.preview-image { margin-bottom: .8rem; border-radius: 8px; overflow: hidden; }
.preview-image img { max-width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; }
.preview-content { padding: .8rem; background: var(--bg-2); border-radius: 8px; border: 1px solid var(--border); line-height: 1.6; font-size: .9rem; min-height: 100px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
</style>
