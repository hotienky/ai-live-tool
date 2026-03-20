<template>
  <div class="media-lib">
    <!-- Header -->
    <div class="ml-header">
      <h3><ImageIcon :size="16" /> {{ t('admin.media_library', 'Thư viện Media') }} <span class="ml-count">({{ pagination.total }})</span></h3>
      <div class="ml-actions">
        <div class="ml-search">
          <Search :size="14" />
          <input v-model="searchQuery" type="text" :placeholder="t('admin.search', 'Tìm kiếm...')" @input="debouncedSearch" />
        </div>
        <select v-model="filterType" @change="reload()" class="ml-filter">
          <option value="">{{ t('admin.all', 'Tất cả') }}</option>
          <option value="image">{{ t('admin.images', 'Hình ảnh') }}</option>
          <option value="video">Video</option>
        </select>
        <label class="ml-upload-btn">
          <Upload :size="14" /> Upload
          <input type="file" multiple accept="image/*,video/mp4,video/webm" @change="onFileSelect" style="display:none" />
        </label>
      </div>
    </div>

    <!-- Upload Progress -->
    <div class="ml-uploading" v-if="uploading">
      <Loader2 :size="16" class="spin" /> Đang upload {{ uploadCount }} file...
    </div>

    <!-- Drop Zone Overlay -->
    <div
      class="ml-dropzone"
      :class="{ 'ml-dropzone--active': isDragOver }"
      @dragover.prevent="isDragOver = true"
      @dragleave.prevent="isDragOver = false"
      @drop.prevent="onDrop"
    >
      <!-- Grid -->
      <div class="ml-grid" v-if="mediaList.length">
        <div
          v-for="item in mediaList"
          :key="item.id"
          class="ml-item"
          :class="{ 'ml-item--selected': selectedId === item.id }"
          @click="selectItem(item)"
        >
          <div class="ml-item__preview">
            <img v-if="isImage(item)" :src="item.thumbnail_url || item.url" :alt="item.alt || item.title" loading="lazy" />
            <div v-else class="ml-item__icon"><Film :size="28" /></div>
          </div>
          <div class="ml-item__name">{{ item.title || item.filename }}</div>
          <div class="ml-item__meta">{{ humanSize(item.size) }}</div>
        </div>
      </div>

      <!-- Empty / Drop Zone -->
      <div v-else-if="!loading" class="ml-empty">
        <Upload :size="36" />
        <p>{{ t('admin.no_media', 'Chưa có media nào') }}</p>
        <p class="ml-empty__hint">Kéo thả file vào đây hoặc click nút Upload</p>
      </div>

      <!-- Drag overlay -->
      <div v-if="isDragOver" class="ml-drop-overlay">
        <Upload :size="40" />
        <p>Thả file để upload</p>
      </div>
    </div>

    <!-- Pagination -->
    <div class="ml-pagination" v-if="pagination.lastPage > 1">
      <button class="pg-btn" :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">
        <ChevronLeft :size="14" />
      </button>
      <span class="pg-info">{{ pagination.page }} / {{ pagination.lastPage }}</span>
      <button class="pg-btn" :disabled="pagination.page >= pagination.lastPage" @click="goPage(pagination.page + 1)">
        <ChevronRight :size="14" />
      </button>
      <span class="pg-total">{{ pagination.total }} files</span>
    </div>

    <!-- Detail Panel (right side) -->
    <div class="ml-detail" v-if="selected">
      <div class="ml-detail__close" @click="selected = null">&times;</div>
      <div class="ml-detail__preview">
        <img v-if="isImage(selected)" :src="selected.medium_url || selected.url" :alt="selected.alt" />
        <div v-else class="ml-detail__icon"><Film :size="48" /></div>
      </div>
      <div class="ml-detail__info">
        <div class="ml-detail__filename">{{ selected.filename }}</div>
        <div class="ml-detail__stats">
          {{ humanSize(selected.size) }}
          <span v-if="selected.width"> · {{ selected.width }}×{{ selected.height }}</span>
          <span> · {{ selected.mime_type }}</span>
        </div>
        <div class="ml-detail__date">{{ new Date(selected.created_at).toLocaleDateString('vi-VN') }}</div>

        <div class="form-group">
          <label>Alt Text</label>
          <input v-model="editAlt" placeholder="Mô tả ảnh cho SEO" @blur="saveDetail" />
        </div>
        <div class="form-group">
          <label>Title</label>
          <input v-model="editTitle" placeholder="Tiêu đề" @blur="saveDetail" />
        </div>

        <div class="form-group">
          <label>URL</label>
          <div class="ml-url-row">
            <input :value="selected.url" readonly class="ml-url-input" />
            <button class="ml-copy-btn" @click="copyUrl(selected.url)"><Copy :size="13" /></button>
          </div>
        </div>

        <button class="act-btn act-cancel ml-delete-btn" @click="handleDelete(selected)">
          <Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useMedia } from '../composables/useMedia.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import {
  Image as ImageIcon, Search, Upload, Film, Trash2, Copy,
  ChevronLeft, ChevronRight, Loader2,
} from 'lucide-vue-next'

const { t } = useI18n()
const { showToast } = useToast()
const { mediaList, loading, pagination, fetchMedia, uploadMedia, updateMedia, deleteMedia } = useMedia()

const searchQuery = ref('')
const filterType = ref('')
const selected = ref(null)
const selectedId = ref(null)
const editAlt = ref('')
const editTitle = ref('')
const isDragOver = ref(false)
const uploading = ref(false)
const uploadCount = ref(0)

// ── Upload constraints ──
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'video/mp4', 'video/webm']

function reload() {
  fetchMedia({ search: searchQuery.value, type: filterType.value, page: 1 })
}

let searchTimer = null
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => reload(), 300)
}

function goPage(pg) {
  fetchMedia({ search: searchQuery.value, type: filterType.value, page: pg })
}

function selectItem(item) {
  selected.value = item
  selectedId.value = item.id
  editAlt.value = item.alt || ''
  editTitle.value = item.title || ''
}

async function saveDetail() {
  if (!selected.value) return
  try {
    const result = await updateMedia(selected.value.id, { alt: editAlt.value, title: editTitle.value })
    if (result?.data) {
      Object.assign(selected.value, result.data)
    }
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

async function handleDelete(item) {
  if (!confirm(`Xóa "${item.filename}"?`)) return
  try {
    await deleteMedia(item.id)
    showToast('Đã xóa', 'success')
    selected.value = null
    selectedId.value = null
    reload()
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

async function onFileSelect(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  await doUpload(files)
  e.target.value = '' // reset input
}

function onDrop(e) {
  isDragOver.value = false
  const files = Array.from(e.dataTransfer.files)
  if (files.length) doUpload(files)
}

async function doUpload(files) {
  // ── Client-side validation ──
  const rejected = []
  const valid = []
  for (const f of files) {
    if (f.size > MAX_FILE_SIZE) {
      rejected.push(`"${f.name}" vượt quá 10MB (${humanSize(f.size)})`)
    } else if (!ALLOWED_TYPES.includes(f.type)) {
      rejected.push(`"${f.name}" — định dạng "${f.type || 'không rõ'}" không được hỗ trợ`)
    } else {
      valid.push(f)
    }
  }
  if (rejected.length) {
    showToast(rejected.join('\n'), 'error')
  }
  if (!valid.length) return

  uploading.value = true
  uploadCount.value = valid.length
  try {
    const result = await uploadMedia(valid)
    // Check per-file errors in response
    const errors = (result?.data || []).filter(r => r.error)
    const successes = (result?.data || []).filter(r => !r.error)
    if (successes.length) {
      showToast(`Đã upload ${successes.length} file thành công`, 'success')
    }
    if (errors.length) {
      const msgs = errors.map(e => `"${e.filename}": ${e.message}`).join('\n')
      showToast(`Lỗi upload:\n${msgs}`, 'error')
    }
    reload()
  } catch (e) {
    showToast('Upload lỗi: ' + (e.message || 'Không xác định'), 'error')
  }
  uploading.value = false
}

function copyUrl(url) {
  navigator.clipboard.writeText(url)
  showToast('Đã copy URL', 'success')
}

function isImage(item) {
  return item.mime_type?.startsWith('image/')
}

function humanSize(bytes) {
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB'
  if (bytes >= 1024) return (bytes / 1024).toFixed(0) + ' KB'
  return bytes + ' B'
}

onMounted(() => reload())
</script>

<style scoped>
.media-lib { position: relative; }
.ml-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
.ml-header h3 { display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700; margin: 0; }
.ml-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.ml-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ml-search { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 8px; background: var(--color-bg-primary); border: 1px solid var(--color-border); }
.ml-search:focus-within { border-color: var(--color-accent-primary); }
.ml-search svg { color: var(--color-text-muted); }
.ml-search input { border: none; background: transparent; color: var(--color-text-primary); font-size: 13px; outline: none; width: 160px; }
.ml-filter { padding: 6px 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px; }

.ml-upload-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 16px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity 0.2s;
}
.ml-upload-btn:hover { opacity: 0.85; }

.ml-uploading {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 14px; margin-bottom: 12px;
  border-radius: 8px; background: var(--color-accent-glow);
  color: var(--color-accent-primary); font-size: 13px; font-weight: 600;
}
.spin { animation: spin 1s linear infinite; }

/* Dropzone */
.ml-dropzone { position: relative; min-height: 300px; }
.ml-drop-overlay {
  position: absolute; inset: 0; z-index: 10;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
  background: rgba(124, 58, 237, 0.12); backdrop-filter: blur(4px);
  border: 2px dashed var(--color-accent-primary); border-radius: 12px;
  color: var(--color-accent-primary); font-size: 16px; font-weight: 700;
  pointer-events: none;
}

/* Grid */
.ml-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}
.ml-item {
  border: 2px solid var(--color-border);
  border-radius: 10px; overflow: hidden;
  cursor: pointer; transition: all 0.2s;
  background: var(--color-bg-card);
}
.ml-item:hover { border-color: var(--color-border-hover); transform: translateY(-2px); box-shadow: var(--shadow-card); }
.ml-item--selected { border-color: var(--color-accent-primary); box-shadow: 0 0 0 2px var(--color-accent-glow); }
.ml-item__preview {
  aspect-ratio: 1; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-primary);
}
.ml-item__preview img { width: 100%; height: 100%; object-fit: cover; }
.ml-item__icon { color: var(--color-text-muted); }
.ml-item__name {
  padding: 6px 8px 2px; font-size: 11px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ml-item__meta { padding: 0 8px 6px; font-size: 10px; color: var(--color-text-muted); }

/* Empty */
.ml-empty { text-align: center; padding: 60px 20px; color: var(--color-text-muted); }
.ml-empty svg { margin-bottom: 12px; opacity: 0.4; }
.ml-empty p { margin: 4px 0; }
.ml-empty__hint { font-size: 12px; }

/* Pagination */
.ml-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 16px 0; }
.pg-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); cursor: pointer; }
.pg-btn:hover:not(:disabled) { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.pg-info { font-size: 13px; font-weight: 600; }
.pg-total { font-size: 12px; color: var(--color-text-muted); margin-left: 8px; }

/* Detail Panel */
.ml-detail {
  position: fixed; top: 0; right: 0; bottom: 0; width: 340px; z-index: 100;
  background: var(--color-bg-secondary); border-left: 1px solid var(--color-border);
  overflow-y: auto; padding: 20px; animation: slideInRight 0.2s ease;
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
}
@keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
.ml-detail__close { position: absolute; top: 12px; right: 12px; font-size: 20px; cursor: pointer; color: var(--color-text-muted); line-height: 1; }
.ml-detail__close:hover { color: var(--color-text-primary); }
.ml-detail__preview { border-radius: 8px; overflow: hidden; margin-bottom: 16px; background: var(--color-bg-primary); }
.ml-detail__preview img { width: 100%; display: block; }
.ml-detail__icon { display: flex; align-items: center; justify-content: center; height: 200px; color: var(--color-text-muted); }
.ml-detail__filename { font-size: 14px; font-weight: 700; margin-bottom: 4px; word-break: break-all; }
.ml-detail__stats { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.ml-detail__date { font-size: 11px; color: var(--color-text-muted); margin-bottom: 16px; }

.ml-detail .form-group { margin-bottom: 10px; }
.ml-detail .form-group label { display: block; font-size: 11px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 3px; }
.ml-detail .form-group input { width: 100%; padding: 6px 10px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px; outline: none; }
.ml-detail .form-group input:focus { border-color: var(--color-accent-primary); }

.ml-url-row { display: flex; gap: 4px; }
.ml-url-input { flex: 1; font-size: 11px !important; font-family: monospace; }
.ml-copy-btn { display: flex; align-items: center; justify-content: center; width: 30px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-card); cursor: pointer; color: var(--color-text-muted); transition: all 0.15s; }
.ml-copy-btn:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.ml-delete-btn { margin-top: 16px; width: 100%; justify-content: center; padding: 8px; }
</style>
