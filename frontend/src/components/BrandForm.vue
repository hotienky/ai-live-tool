<template>
  <div class="brand-form-page">
    <div class="form-page-header">
      <button class="btn-back" @click="goBackToList"><ChevronLeft :size="16" /> {{ t('admin.back', 'Quay lại') }}</button>
      <h3>{{ isEditing ? t('admin.edit_brand', 'Sửa thương hiệu') : t('admin.add_brand', 'Thêm thương hiệu mới') }}</h3>
      <button class="btn-save" @click="handleSave" :disabled="!form.name">
        {{ isEditing ? t('admin.update', 'Cập nhật') : t('admin.create', 'Tạo thương hiệu') }}
      </button>
    </div>

    <div class="form-page-body">
      <!-- Left Column -->
      <div class="form-col form-col--main">
        <LanguageTabs v-model="currentLang" :translations="form.translations" :fields="['name', 'description', 'meta_title', 'meta_description']" :baseData="form" />

        <div class="form-card">
          <h4>{{ t('admin.basic_info', 'Thông tin cơ bản') }}</h4>
          <div class="form-row">
            <div class="form-group form-group--flex">
              <label>{{ t('admin.brand_name', 'Tên thương hiệu') }} *</label>
              <input v-model="fName" :placeholder="t('admin.brand_name_placeholder', 'Tên thương hiệu')" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.slug', 'Slug') }}</label>
              <input v-model="form.slug" :placeholder="t('admin.slug_placeholder', 'Tự tạo nếu để trống')" />
            </div>
          </div>
          
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }}</label>
            <textarea v-model="fDescription" rows="3" :placeholder="t('admin.description_placeholder', 'Mô tả...')"></textarea>
          </div>
        </div>

        <div class="form-card">
          <h4>🔍 {{ t('admin.seo', 'SEO') }}</h4>
          <div class="form-group"><label>{{ t('admin.meta_title', 'Meta Title') }}</label><input v-model="fMetaTitle" :placeholder="t('admin.meta_title_placeholder', 'Tiêu đề SEO')" /></div>
          <div class="form-group"><label>{{ t('admin.meta_description', 'Meta Description') }}</label><textarea v-model="fMetaDesc" rows="2" :placeholder="t('admin.meta_description_placeholder', 'Mô tả SEO')"></textarea></div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="form-col form-col--side">
        <div class="form-card">
          <h4>{{ t('admin.image', 'Hình ảnh') }}</h4>
          <div class="form-group">
            <label>Logo</label>
            <MediaPicker v-model="form.image" :placeholder="t('admin.msg_2204d8', 'Chọn hoặc nhập URL hình ảnh...')" accept="image/*" />
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
import MediaPicker from './MediaPicker.vue'
import LanguageTabs from './LanguageTabs.vue'
import { useI18n } from '../composables/useI18n.js'
import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  languagesInstalled: { type: Boolean, default: false },
  editId: { type: [String, Number], default: null },
})
const emit = defineEmits(['back', 'saved'])

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

function defaultForm() { return { name: '', slug: '', description: '', image: '', meta_title: '', meta_description: '', translations: {} } }

function goBackToList() {
  emit('back')
}

async function loadBrandForEdit(id) {
  try {
    const res = await apiFetch(`/brands/${id}`)
    const b = await res.json()
    if (!b) {
      showToast(t('admin.msg_617b9f', 'Không tìm thấy thương hiệu'), 'error')
      emit('back')
      return
    }

    form.value = { 
      name: b.name, slug: b.slug || '', description: b.description || '', image: b.image || '',
      meta_title: b.meta_title || '', meta_description: b.meta_description || '', translations: {} 
    }

    // Always fetch translations
    try {
      const transRes = await apiFetch(`/languages/content/brands/${id}`)
      const transData = await transRes.json()
      if (transData?.grouped) {
        form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
      }
    } catch (e) {
      console.warn('Could not load brand translations:', e)
    }

  } catch (e) {
    showToast(t('admin.msg_8ac155', 'Lỗi tải thương hiệu'), 'error')
    emit('back')
  }
}

async function handleSave() {
  if (!form.value.name) return
  try {
    const body = { ...form.value }
    if (isEditing.value) {
      await apiFetch(`/brands/${props.editId}`, { method: 'PUT', body: JSON.stringify(body) })
      showToast(t('admin.msg_a2f10f', 'Đã cập nhật thương hiệu'), 'success')
      emit('saved')
    } else {
      const res = await apiFetch('/brands', { method: 'POST', body: JSON.stringify(body) })
      showToast(t('admin.msg_aaabca', 'Đã thêm thương hiệu'), 'success')
      emit('saved', res.id || res.data?.id)
    }
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + (e.message || 'Unknown'), 'error') }
}

onMounted(() => {
  if (props.editId) {
    loadBrandForEdit(props.editId)
  }
})
</script>

<style scoped>
.brand-form-page { animation: slideIn 0.25s ease; }
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
.image-preview img { max-height: 120px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-primary); padding: 8px; object-fit: contain; }
.btn-save { padding: 8px 20px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 768px) {
  .form-page-body { flex-direction: column; }
  .form-col--side { position: static; }
}
</style>
