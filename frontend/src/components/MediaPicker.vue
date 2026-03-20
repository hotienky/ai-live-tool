<template>
  <div class="media-picker">
    <!-- Preview + Input Row -->
    <div class="mp-input-row">
      <div class="mp-preview" v-if="modelValue" @click="openPicker">
        <img :src="modelValue" :alt="alt" @error="$event.target.style.display='none'" />
      </div>
      <div class="mp-controls">
        <input :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" :placeholder="placeholder" class="mp-url-input" />
        <button type="button" class="mp-browse-btn" @click="openPicker" :title="t('admin.choose_media', 'Chọn từ Media')">
          <ImageIcon :size="14" />
        </button>
        <button type="button" class="mp-clear-btn" @click="$emit('update:modelValue', '')" v-if="modelValue" :title="t('admin.msg_4ed187a8', 'Xóa')" >
          &times;
        </button>
      </div>
    </div>

    <!-- Modal Overlay -->
    <Teleport to="body">
      <div class="mp-modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="mp-modal">
          <div class="mp-modal__header">
            <h3><ImageIcon :size="16" /> {{ t('admin.choose_media', 'Chọn Media') }}</h3>
            <button class="mp-modal__close" @click="showModal = false">&times;</button>
          </div>

          <div class="mp-modal__body">
            <!-- Upload + Search bar -->
            <div class="mp-modal__toolbar">
              <div class="mp-modal__search">
                <Search :size="14" />
                <input v-model="searchQuery" type="text" :placeholder="t('admin.search', 'Tìm kiếm...')" @input="debouncedSearch" />
              </div>
              <label class="mp-upload-btn">
                <Upload :size="14" /> Upload
                <input type="file" multiple :accept="accept" @change="onFileSelect" style="display:none" />
              </label>
            </div>

            <!-- Upload progress -->
            <div class="mp-uploading" v-if="uploading">
              <Loader2 :size="14" class="spin" />{{ t('admin.uploading', 'Đang upload...') }}</div>

            <!-- Grid -->
            <div class="mp-grid" v-if="mediaList.length">
              <div
                v-for="item in mediaList"
                :key="item.id"
                class="mp-grid-item"
                :class="{ 'mp-grid-item--selected': pickerSelectedUrl === (item.url) }"
                @click="pickerSelectItem(item)"
              >
                <div class="mp-grid-item__img">
                  <img v-if="isImage(item)" :src="item.thumbnail_url || item.url" :alt="item.alt" loading="lazy" />
                  <div v-else class="mp-grid-item__icon"><Film :size="20" /></div>
                </div>
                <div class="mp-grid-item__name">{{ item.filename }}</div>
              </div>
            </div>
            <p v-else-if="!loading" class="mp-empty">{{ t('admin.no_media', 'Chưa có media') }}</p>

            <!-- Pagination inside modal -->
            <div class="mp-pagination" v-if="pagination.lastPage > 1">
              <button :disabled="pagination.page <= 1" @click="goPage(pagination.page - 1)">←</button>
              <span>{{ pagination.page }}/{{ pagination.lastPage }}</span>
              <button :disabled="pagination.page >= pagination.lastPage" @click="goPage(pagination.page + 1)">→</button>
            </div>
          </div>

          <div class="mp-modal__footer">
            <button class="btn-cancel" @click="showModal = false">{{ t('admin.cancel', 'Hủy') }}</button>
            <button class="btn-save" :disabled="!pickerSelectedUrl" @click="confirmSelection">{{ t('admin.select', 'Chọn') }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useMedia } from '../composables/useMedia.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import { Image as ImageIcon, Search, Upload, Film, Loader2 } from 'lucide-vue-next'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()
const { mediaList, loading, pagination, fetchMedia, uploadMedia } = useMedia()

const props = defineProps({
  modelValue: { type: String, default: '' },
  accept: { type: String, default: 'image/*,video/mp4,video/webm' },
  placeholder: { type: String, default: 'URL hình ảnh...' },
  alt: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const showModal = ref(false)
const searchQuery = ref('')
const uploading = ref(false)
const pickerSelectedUrl = ref('')

function openPicker() {
  showModal.value = true
  pickerSelectedUrl.value = props.modelValue || ''
  fetchMedia({ page: 1 })
}

let searchTimer = null
function debouncedSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    fetchMedia({ search: searchQuery.value, page: 1 })
  }, 300)
}

function goPage(pg) {
  fetchMedia({ search: searchQuery.value, page: pg })
}

function pickerSelectItem(item) {
  pickerSelectedUrl.value = item.url
}

function confirmSelection() {
  emit('update:modelValue', pickerSelectedUrl.value)
  showModal.value = false
}

async function onFileSelect(e) {
  const files = Array.from(e.target.files)
  if (!files.length) return
  uploading.value = true
  try {
    const results = await uploadMedia(files)
    showToast(t('admin.msg_uploaded', 'Đã upload') + ` ${files.length} file`, 'success')
    // Auto-select the first uploaded file
    if (results?.length) {
      pickerSelectedUrl.value = results[0].url
    }
    fetchMedia({ search: searchQuery.value, page: 1 })
  } catch (e) {
    showToast('Upload lỗi: ' + e.message, 'error')
  }
  uploading.value = false
  e.target.value = ''
}

function isImage(item) {
  return item.mime_type?.startsWith('image/')
}
</script>

<style scoped>
/* Input Row */
.mp-input-row { display: flex; align-items: flex-start; gap: 8px; }
.mp-preview {
  width: 48px; height: 48px; border-radius: 8px; overflow: hidden; flex-shrink: 0;
  border: 1px solid var(--color-border); cursor: pointer;
}
.mp-preview img { width: 100%; height: 100%; object-fit: cover; }
.mp-controls { display: flex; align-items: center; gap: 4px; flex: 1; }
.mp-url-input {
  flex: 1; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}
.mp-url-input:focus { border-color: var(--color-accent-primary); }
.mp-browse-btn {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-card); color: var(--color-accent-primary); cursor: pointer; transition: all 0.15s;
}
.mp-browse-btn:hover { border-color: var(--color-accent-primary); background: var(--color-accent-glow); }
.mp-clear-btn {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: none;
  background: rgba(239,68,68,0.1); color: #ef4444; font-size: 16px; cursor: pointer;
}
.mp-clear-btn:hover { background: rgba(239,68,68,0.2); }

/* Modal */
.mp-modal-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.55); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.mp-modal {
  width: 90vw; max-width: 900px; max-height: 85vh;
  display: flex; flex-direction: column;
  background: var(--color-bg-secondary); border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.25); animation: popIn 0.2s ease;
}
@keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.mp-modal__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid var(--color-border);
}
.mp-modal__header h3 { margin: 0; font-size: 15px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
.mp-modal__close { font-size: 22px; cursor: pointer; color: var(--color-text-muted); background: none; border: none; line-height: 1; }

.mp-modal__body { flex: 1; overflow-y: auto; padding: 16px 20px; }

.mp-modal__toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.mp-modal__search {
  display: flex; align-items: center; gap: 6px; flex: 1;
  padding: 6px 12px; border-radius: 8px; background: var(--color-bg-primary); border: 1px solid var(--color-border);
}
.mp-modal__search:focus-within { border-color: var(--color-accent-primary); }
.mp-modal__search svg { color: var(--color-text-muted); }
.mp-modal__search input { border: none; background: transparent; color: var(--color-text-primary); font-size: 13px; outline: none; width: 100%; }

.mp-upload-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.mp-uploading { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--color-accent-primary); margin-bottom: 8px; }

/* Grid inside modal */
.mp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 8px;
}
.mp-grid-item {
  border: 2px solid var(--color-border); border-radius: 8px; overflow: hidden;
  cursor: pointer; transition: all 0.15s;
}
.mp-grid-item:hover { border-color: var(--color-border-hover, var(--color-text-muted)); }
.mp-grid-item--selected { border-color: var(--color-accent-primary); box-shadow: 0 0 0 2px var(--color-accent-glow); }
.mp-grid-item__img {
  aspect-ratio: 1; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-primary);
}
.mp-grid-item__img img { width: 100%; height: 100%; object-fit: cover; }
.mp-grid-item__icon { color: var(--color-text-muted); }
.mp-grid-item__name { padding: 4px 6px; font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.mp-empty { text-align: center; padding: 40px 0; color: var(--color-text-muted); font-size: 13px; }

.mp-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 12px; }
.mp-pagination button { padding: 4px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card); cursor: pointer; color: var(--color-text-primary); font-size: 12px; }
.mp-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

.mp-modal__footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px; border-top: 1px solid var(--color-border);
}
.btn-cancel { padding: 7px 16px; border: 1px solid var(--color-border); border-radius: 8px; background: transparent; color: var(--color-text-secondary); cursor: pointer; font-size: 13px; }
.btn-save { padding: 7px 20px; border: none; border-radius: 8px; background: var(--color-accent-primary); color: #fff; cursor: pointer; font-size: 13px; font-weight: 600; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>
