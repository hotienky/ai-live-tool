<template>
  <div class="banner-mgr">
    <div class="bm-header">
      <h3><ImageIcon :size="16" /> Banner quảng cáo</h3>
      <div class="bm-actions">
        <select v-model="filterType" @change="reload" class="bm-filter">
          <option value="">Tất cả</option>
          <option value="banner">Banner</option>
          <option value="background">Background</option>
          <option value="breadcrumb">Breadcrumb</option>
        </select>
        <button class="btn-add" @click="openCreate">+ Thêm</button>
      </div>
    </div>

    <div class="bm-grid" v-if="banners.length">
      <div
        v-for="(b, index) in banners"
        :key="b.id"
        class="bm-card"
        :class="{
          'bm-inactive': b.status !== 1,
          'bm-dragging': dragIndex === index,
          'bm-drag-over': dragOverIndex === index && dragIndex !== index,
        }"
        draggable="true"
        @dragstart="onDragStart($event, index)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, index)"
        @dragenter.prevent="onDragEnter(index)"
        @dragleave="onDragLeave(index)"
        @drop.prevent="onDrop(index)"
      >
        <!-- Drag Handle -->
        <div class="bm-card__drag-handle" title="Kéo để sắp xếp">
          <GripVertical :size="16" />
        </div>

        <div class="bm-card__img" :style="{ backgroundImage: b.image ? `url(${b.image})` : 'none' }">
          <span class="bm-type-badge">{{ b.type }}</span>
          <span class="bm-sort-badge">#{{ b.sort }}</span>
          <button class="bm-status-toggle" :class="b.status === 1 ? 'on' : 'off'" @click.stop="toggleStatus(b)" :title="b.status === 1 ? 'Active' : 'Inactive'">
            {{ b.status === 1 ? '●' : '○' }}
          </button>
        </div>
        <div class="bm-card__info">
          <strong>{{ b.title || '(Chưa đặt tên)' }}</strong>
          <a v-if="b.url" :href="b.url" target="_blank" class="bm-url">{{ b.url }}</a>
        </div>
        <div class="bm-card__actions">
          <button class="btn-sm btn-edit" @click="openEdit(b)">Sửa</button>
          <button class="btn-sm btn-del" @click="handleDelete(b)">×</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">Chưa có banner nào</p>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa banner' : 'Thêm banner' }}</h3>
        <div class="form-group"><label>Tiêu đề</label><input v-model="form.title" /></div>
        <div class="form-group"><label>Hình ảnh (URL)</label><input v-model="form.image" placeholder="https://..." /></div>

        <!-- Image Preview -->
        <div class="bm-img-preview" v-if="form.image">
          <img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" @load="$event.target.style.display='block'" />
        </div>

        <div class="form-group"><label>Link đích (URL)</label><input v-model="form.url" placeholder="https://..." /></div>
        <div class="form-row">
          <div class="form-group">
            <label>Kiểu</label>
            <select v-model="form.type"><option value="banner">Banner</option><option value="background">Background</option><option value="breadcrumb">Breadcrumb</option></select>
          </div>
          <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
          <div class="form-group">
            <label>Trạng thái</label>
            <select v-model="form.status"><option :value="1">Active</option><option :value="0">Inactive</option></select>
          </div>
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
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useBanners } from '../composables/useBanners.js'
import { useToast } from '../composables/useToast.js'
import { Image as ImageIcon, GripVertical } from 'lucide-vue-next'
const { showToast } = useToast()
const { banners, loading, fetchBanners, createBanner, updateBanner, deleteBanner } = useBanners(apiFetch)

const filterType = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ title: '', image: '', url: '', type: 'banner', sort: 0, status: 1 })

// ─── Drag & Drop state ───
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, index) {
  dragIndex.value = index
  e.dataTransfer.effectAllowed = 'move'
  // Needed for Firefox
  e.dataTransfer.setData('text/plain', String(index))
}

function onDragEnd() {
  dragIndex.value = null
  dragOverIndex.value = null
}

function onDragOver(e, index) {
  e.dataTransfer.dropEffect = 'move'
}

function onDragEnter(index) {
  if (dragIndex.value !== null && dragIndex.value !== index) {
    dragOverIndex.value = index
  }
}

function onDragLeave(index) {
  if (dragOverIndex.value === index) {
    dragOverIndex.value = null
  }
}

async function onDrop(targetIndex) {
  const fromIndex = dragIndex.value
  dragOverIndex.value = null
  dragIndex.value = null

  if (fromIndex === null || fromIndex === targetIndex) return

  // Reorder locally for instant feedback
  const list = [...banners.value]
  const [moved] = list.splice(fromIndex, 1)
  list.splice(targetIndex, 0, moved)
  banners.value = list

  // Persist: update sort values for all items based on new positions
  try {
    const updates = list.map((b, i) => updateBanner(b.id, { sort: i }))
    await Promise.all(updates)
    showToast('Đã sắp xếp lại', 'success')
    reload()
  } catch (e) {
    showToast('Lỗi sắp xếp: ' + e.message, 'error')
    reload()
  }
}

function reload() { fetchBanners({ ...(filterType.value ? { type: filterType.value } : {}) }) }
onMounted(reload)

function openCreate() {
  isEditing.value = false; editId.value = null
  form.value = { title: '', image: '', url: '', type: 'banner', sort: 0, status: 1 }
  showModal.value = true
}
function openEdit(b) {
  isEditing.value = true; editId.value = b.id
  form.value = { title: b.title, image: b.image, url: b.url || '', type: b.type, sort: b.sort, status: b.status }
  showModal.value = true
}
async function toggleStatus(b) {
  try {
    const newStatus = b.status === 1 ? 0 : 1
    await updateBanner(b.id, { status: newStatus })
    showToast(newStatus === 1 ? 'Activated' : 'Deactivated', 'success')
    reload()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleSave() {
  if (!form.value.image) return showToast('Nhập URL hình ảnh', 'error')
  try {
    if (isEditing.value) {
      await updateBanner(editId.value, form.value)
      showToast('Đã cập nhật', 'success')
    } else {
      await createBanner({ ...form.value })
      showToast('Đã tạo banner', 'success')
    }
    showModal.value = false; reload()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function handleDelete(b) {
  if (!confirm(`Xóa banner "${b.title}"?`)) return
  await deleteBanner(b.id); reload()
  showToast('Đã xóa', 'success')
}
</script>

<style scoped>
.banner-mgr { padding: 0; }
.bm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.bm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.bm-actions { display: flex; gap: .5rem; }
.bm-filter { padding: .3rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .8rem; }
.btn-add { background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
.bm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.bm-card {
  display: flex;
  flex-direction: column;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  transition: all .25s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  cursor: grab;
}
.bm-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,.08); }
.bm-card:active { cursor: grabbing; }
.bm-inactive { opacity: .5; }

/* Drag States */
.bm-dragging {
  opacity: .35;
  transform: scale(.96) rotate(1deg);
  box-shadow: 0 8px 24px rgba(0,0,0,.12);
  border-color: var(--accent) !important;
}

.bm-drag-over {
  border: 2px dashed var(--accent) !important;
  transform: scale(1.02);
  box-shadow: 0 0 0 4px rgba(124, 58, 237, .12);
  background: rgba(124, 58, 237, .03);
}

/* Drag Handle */
.bm-card__drag-handle {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 100%;
  color: rgba(255,255,255,.4);
  background: linear-gradient(90deg, rgba(0,0,0,.25) 0%, transparent 100%);
  cursor: grab;
  transition: all .2s;
  opacity: 0;
}
.bm-card:hover .bm-card__drag-handle {
  opacity: 1;
  color: rgba(255,255,255,.8);
}
.bm-card__drag-handle:active { cursor: grabbing; }

/* Image — fixed 16:9 aspect ratio for consistency */
.bm-card__img {
  aspect-ratio: 16 / 9;
  background-size: cover;
  background-position: center;
  background-color: var(--bg-3, #333);
  position: relative;
  flex-shrink: 0;
}
.bm-type-badge {
  position: absolute; top: 8px; right: 8px;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  color: #fff; font-size: .65rem; font-weight: 600;
  padding: 3px 8px; border-radius: 4px; text-transform: uppercase;
  letter-spacing: .5px;
}
.bm-sort-badge {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  color: #fff; font-size: .65rem; font-weight: 600;
  padding: 3px 8px; border-radius: 4px;
}
.bm-status-toggle {
  position: absolute; bottom: 8px; right: 8px;
  background: rgba(0,0,0,.5); backdrop-filter: blur(4px);
  border: none; cursor: pointer; font-size: .9rem;
  border-radius: 50%; width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.bm-status-toggle.on { color: #22c55e; }
.bm-status-toggle.off { color: #ef4444; }
.bm-status-toggle:hover { background: rgba(0,0,0,.8); transform: scale(1.1); }

/* Info — flex-grow to fill remaining space, consistent padding */
.bm-card__info {
  flex: 1;
  padding: .75rem .85rem .5rem;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 56px;
}
.bm-card__info strong {
  font-size: .85rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.3;
}
.bm-url {
  font-size: .7rem;
  color: var(--accent);
  word-break: break-all;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: .8;
}

/* Actions — pinned at bottom, no more ↑↓ buttons */
.bm-card__actions {
  display: flex;
  gap: .4rem;
  padding: .5rem .85rem .75rem;
  border-top: 1px solid var(--border);
  margin-top: auto;
}
.btn-sm {
  padding: 4px 10px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: var(--bg-2);
  cursor: pointer;
  font-size: .75rem;
  color: var(--text-1);
  transition: all .15s;
}
.btn-sm:hover { background: var(--bg-3, #f0f0f0); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); border-color: #ef4444; }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }

/* Image Preview in Modal */
.bm-img-preview { margin: .3rem 0 .5rem; border-radius: 8px; overflow: hidden; background: var(--bg-3, #222); border: 1px solid var(--border); }
.bm-img-preview img { width: 100%; max-height: 150px; object-fit: cover; display: block; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
/* Removed local modal style */
.modal h3 { margin: 0 0 1rem; font-size: 1rem; }
.form-row { display: flex; gap: .5rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: .5rem; }
.form-group label { display: block; font-size: .75rem; color: var(--text-2); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .4rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-1); font-size: .85rem; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
.btn-cancel { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: transparent; color: var(--text-2); cursor: pointer; }
.btn-save { padding: .4rem .8rem; border: none; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; }
</style>
