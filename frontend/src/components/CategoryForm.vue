<template>
  <div class="category-form-page">
    <div class="form-page-header">
      <button class="btn-back" @click="goBackToList"><ChevronLeft :size="16" /> Quay lại</button>
      <h3>{{ isEditing ? 'Sửa danh mục' : 'Thêm danh mục mới' }}</h3>
      <button class="btn-save" @click="handleSave" :disabled="!form.name">
        {{ isEditing ? 'Cập nhật' : 'Tạo danh mục' }}
      </button>
    </div>

    <div class="form-page-body">
      <!-- Left Column -->
      <div class="form-col form-col--main">
        <LanguageTabs v-if="languagesInstalled" v-model="currentLang" :translations="form.translations" :fields="['name', 'description', 'meta_title', 'meta_description']" :baseData="form" />

        <div class="form-card">
          <h4>Thông tin cơ bản</h4>
          <div class="form-row">
            <div class="form-group form-group--flex">
              <label>Tên danh mục *</label>
              <input v-model="fName" :placeholder="t('admin.category_name', 'Tên danh mục')" />
            </div>
            <div class="form-group">
              <label>Slug</label>
              <input v-model="form.slug" placeholder="Tự tạo nếu để trống" />
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }}</label>
            <textarea v-model="fDescription" rows="3" placeholder="Mô tả..."></textarea>
          </div>
        </div>

        <div class="form-card">
          <h4>🔍 SEO</h4>
          <div class="form-group"><label>Meta Title</label><input v-model="fMetaTitle" placeholder="Tiêu đề SEO" /></div>
          <div class="form-group"><label>Meta Description</label><textarea v-model="fMetaDesc" rows="2" placeholder="Mô tả SEO"></textarea></div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="form-col form-col--side">
        <div class="form-card">
          <h4>Cấu trúc</h4>
          <div class="form-group">
            <label>Danh mục cha</label>
            <select v-model="form.parent_id">
              <option :value="null">— Không có —</option>
              <option v-for="pc in categories.filter(x => x.id !== editId)" :key="pc.id" :value="pc.id">{{ pc.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.order', 'Thứ tự') }}</label>
            <input v-model.number="form.sort" type="number" />
          </div>
        </div>

        <div class="form-card">
          <h4>Hình ảnh</h4>
          <div class="form-group">
            <label>Hình ảnh (URL)</label>
            <input v-model="form.image" placeholder="https://..." />
          </div>
          <div class="form-group" v-if="form.image">
            <div class="image-preview"><img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" /></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { ChevronLeft } from 'lucide-vue-next'
import LanguageTabs from './LanguageTabs.vue'
import { useI18n } from '../composables/useI18n.js'
import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  languagesInstalled: { type: Boolean, default: false },
  editId: { type: [String, Number], default: null }
})
const emit = defineEmits(['back', 'saved'])

const categories = ref([])
const isEditing = ref(!!props.editId)
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)
const form = ref(defaultForm())

const { tField } = useContentTranslations(form, currentLang)

const fName = tField('name')
const fDescription = tField('description')
const fMetaTitle = tField('meta_title')
const fMetaDesc = tField('meta_description')

function defaultForm() { return { name: '', slug: '', description: '', image: '', parent_id: null, sort: 0, meta_title: '', meta_description: '', translations: {} } }

function goBackToList() {
  emit('back')
}

async function loadCategoryForEdit(id) {
  try {
    // Try to find in local array first (fast path), otherwise fetch from API
    let c = categories.value.find(x => String(x.id) === String(id))
    if (!c) {
      try {
        const res = await apiFetch(`/categories/${id}`)
        c = await res.json()
      } catch { /* ignore */ }
    }

    if (c) {
      form.value = { 
        name: c.name, slug: c.slug || '', description: c.description || '', image: c.image || '', 
        parent_id: c.parent_id || null, sort: c.sort ?? 0,
        meta_title: c.meta_title || '', meta_description: c.meta_description || '', translations: {} 
      }
    } else {
      showToast('Không tìm thấy danh mục', 'error')
      emit('back')
      return
    }

    // Always fetch translations
    try {
      const transRes = await apiFetch(`/languages/content/categories/${id}`)
      const transData = await transRes.json()
      if (transData?.grouped) {
        form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
      }
    } catch (e) {
      console.warn('Could not load category translations:', e)
    }

  } catch (e) {
    showToast('Lỗi tải danh mục', 'error')
    emit('back')
  }
}

async function handleSave() {
  if (!form.value.name) return
  try {
    const body = { ...form.value }
    if (isEditing.value) {
      await apiFetch(`/categories/${props.editId}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast('Đã cập nhật danh mục', 'success')
      emit('saved')
    } else {
      const res = await apiFetch('/categories', { method: 'POST', body: JSON.stringify(body) })
      showToast('Đã thêm danh mục', 'success')
      emit('saved', res.id || res.data?.id)
    }
  } catch (e) { showToast('Lỗi: ' + (e.message || 'Unknown'), 'error') }
}

onMounted(async () => {
  try {
    const res = await apiFetch(`/categories`)
    categories.value = await res.json()
  } catch { categories.value = [] }

  if (props.editId) {
    loadCategoryForEdit(props.editId)
  }
})
</script>

<style scoped>
.category-form-page { animation: slideIn 0.25s ease; }
@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.form-page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);
}
.form-page-header h3 { margin: 0; font-size: 17px; font-weight: 700; flex: 1; text-align: center; }
.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.form-page-body {
  display: flex; gap: 20px; align-items: flex-start;
}
.form-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.form-col--side { flex: 3; min-width: 240px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

.form-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}
.form-card h4 {
  font-size: 14px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary);
}

.form-group { margin-bottom: 14px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.form-group input, .form-group select, .form-group textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--color-accent-primary); }
.form-group--flex { flex: 1; }
.form-row { display: flex; gap: 12px; }
.form-row .form-group { flex: 1; }

.image-preview { text-align: center; margin-top: 8px; }
.image-preview img { max-height: 120px; border-radius: 8px; border: 1px solid var(--color-border); }
.btn-save { padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .form-page-body { flex-direction: column; }
  .form-col--side { position: static; }
}
</style>
