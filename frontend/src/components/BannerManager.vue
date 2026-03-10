<template>
  <div class="banner-mgr">
    <div class="bm-header">
      <h3><Image :size="16" /> Banner quảng cáo</h3>
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
      <div class="bm-card" v-for="b in banners" :key="b.id">
        <div class="bm-card__img" :style="{ backgroundImage: b.image ? `url(${b.image})` : 'none' }">
          <span class="bm-type-badge">{{ b.type }}</span>
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
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useBanners } from '../composables/useBanners.js'
import { useToast } from '../composables/useToast.js'
import { Image } from 'lucide-vue-next'
const { showToast } = useToast()
const { banners, loading, fetchBanners, createBanner, updateBanner, deleteBanner } = useBanners(apiFetch)
const props = defineProps({ shopId: [String, Number] })

const filterType = ref('')
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ title: '', image: '', url: '', type: 'banner', sort: 0, status: 1 })

function reload() { fetchBanners({ shopId: props.shopId, ...(filterType.value ? { type: filterType.value } : {}) }) }
onMounted(reload)
watch(() => props.shopId, reload)

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
async function handleSave() {
  if (!form.value.image) return showToast('Nhập URL hình ảnh', 'error')
  try {
    if (isEditing.value) {
      await updateBanner(editId.value, form.value)
      showToast('✅ Đã cập nhật', 'success')
    } else {
      await createBanner({ ...form.value, storeId: props.shopId })
      showToast('✅ Đã tạo banner', 'success')
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
.bm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: .6rem; }
.bm-card { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.bm-card__img { height: 100px; background-size: cover; background-position: center; background-color: var(--bg-3, #333); position: relative; }
.bm-type-badge { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,.6); color: #fff; font-size: .65rem; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; }
.bm-card__info { padding: .5rem .6rem; }
.bm-card__info strong { font-size: .85rem; display: block; }
.bm-url { font-size: .7rem; color: var(--accent); word-break: break-all; }
.bm-card__actions { display: flex; gap: .3rem; padding: 0 .6rem .5rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; }
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: var(--bg-1); border-radius: 12px; padding: 1.5rem; width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; }
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
