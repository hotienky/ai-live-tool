<template>
  <div class="cms-form-page">
    <div class="form-page-header">
      <button class="btn-back" @click="goBack">
        <ArrowLeft :size="16" /> Quay lại
      </button>
      <h3>{{ isEditing ? t('admin.msg_72f5b421', 'Sửa trang CMS') : t('admin.msg_4ae8d81c', 'Tạo trang CMS mới') }}</h3>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="16" class="spin" />
        {{ saving ? t('admin.saving', 'Đang lưu...') : (isEditing ? 'Cập nhật' : 'Tạo trang') }}
      </button>
    </div>

    <div class="form-page-body">
      <!-- Left Column: Basic Info -->
      <div class="form-col form-col--main">
        <LanguageTabs v-model="currentLang" style="margin-bottom: 20px;" :translations="form.translations" :fields="['title', 'content', 'meta_title', 'meta_description']" :baseData="form" />

        <div class="form-card">
          <h4>{{ t('admin.msg_1f4f57cd', 'Nội dung trang') }}</h4>
          
          <div class="form-group">
            <label>{{ t('admin.msg_ae4b89f8', 'Tiêu đề') }} <span class="required">*</span></label>
            <input v-model="fTitle" type="text" :placeholder="t('admin.msg_4ee531', 'Nhập tiêu đề trang...')" class="input-lg" />
          </div>

          <div class="form-group">
            <label>Alias (slug)</label>
            <div class="input-prefix">
              <span class="prefix">/</span>
              <input v-model="form.alias" type="text" :placeholder="t('admin.msg_ab966e', 'Tự tạo từ tiêu đề nếu để trống')" />
            </div>
          </div>

          <!-- Content Mode -->
          <div class="form-group" style="margin-top: 16px;">
            <label class="checkbox-label">
              <input type="checkbox" v-model="form.is_dynamic" />
              <span>{{ t('admin.msg_ea032500', 'Sử dụng Storefront Layout Builder (Kéo thả section)') }}</span>
            </label>

            <div v-if="form.is_dynamic" class="info-box">
              {{ t('admin.msg_layout_builder_info', 'Trang này sẽ được thiết kế bằng Layout Builder. Lưu lại để tự động chuyển sang trang thiết kế kéo thả.') }}
            </div>

            <div v-else class="form-group" style="margin-top: 12px;">
              <label>{{ t('admin.msg_d4c057ac', 'Nội dung') }}</label>
              <RichTextEditor v-model="fContent" :placeholder="t('admin.msg_html_placeholder', 'Nhập nội dung trang...')" />
            </div>
          </div>
        </div>

        <!-- SEO Section -->
        <div class="form-card">
          <h4 style="margin: 0 0 12px; font-size: 14px; font-weight: 700">🔍 SEO</h4>
          <div class="form-group">
            <label>Meta Title</label>
            <input v-model="fMetaTitle" :placeholder="t('admin.msg_073024', 'Tiêu đề SEO (tự động nếu để trống)')" />
          </div>
          <div class="form-group">
            <label>Meta Description</label>
            <textarea v-model="fMetaDesc" rows="3" :placeholder="t('admin.msg_9de927', 'Mô tả SEO (tự động nếu để trống)')"></textarea>
          </div>
        </div>
      </div>

      <!-- Right Column: Metadata -->
      <div class="form-col form-col--side">
        <div class="form-card">
          <h4>{{ t('admin.install', 'Cài đặt') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.status', 'Trạng thái') }}</label>
            <select v-model="form.status">
              <option :value="1">Published</option>
              <option :value="0">Draft</option>
            </select>
          </div>

          <div class="form-group">
            <label>{{ t('admin.msg_6345aae2', 'Thứ tự hiển thị') }}</label>
            <input v-model.number="form.sort" type="number" min="0" />
          </div>
        </div>

        <div class="form-card">
          <h4>{{ t('admin.msg_74aa5931', 'Hình đại diện') }}</h4>
          <div class="form-group">
            <label>{{ t('admin.image', 'Hình ảnh') }}</label>
            <MediaPicker v-model="form.image" :placeholder="t('admin.msg_2204d8', 'Chọn hoặc nhập URL hình ảnh...')" accept="image/*" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import MediaPicker from './MediaPicker.vue'
import RichTextEditor from './RichTextEditor.vue'
import { apiFetch } from '../composables/useApi.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useToast } from '../composables/useToast.js'
import LanguageTabs from './LanguageTabs.vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const { showToast } = useToast()
const { fetchPage, createPage, updatePage } = useCmsPages(apiFetch)

const props = defineProps({
  pageId: { type: [String, Number], default: null },
  languagesInstalled: { type: Boolean, default: false },
})
const emit = defineEmits(['navigate'])

const isEditing = ref(false)
const saving = ref(false)
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

const form = ref({
  title: '', alias: '', content: '', image: '',
  meta_title: '', meta_description: '',
  status: 1, sort: 0, is_dynamic: false,
  translations: {},
})

import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'
const { tField } = useContentTranslations(form, currentLang)

const fTitle = tField('title')
const fContent = tField('content')
const fMetaTitle = tField('meta_title')
const fMetaDesc = tField('meta_description')

function goBack() {
  emit('navigate', 'shop/cms')
}

onMounted(async () => {
  if (props.pageId) {
    isEditing.value = true
    try {
      const page = await fetchPage(props.pageId)
      if (page) {
        form.value = {
          title: page.title || '',
          alias: page.alias || '',
          content: page.content || '',
          image: page.image || '',
          meta_title: page.meta_title || '',
          meta_description: page.meta_description || '',
          status: page.status ?? 1,
          sort: page.sort ?? 0,
          is_dynamic: page.is_dynamic || false,
          translations: {},
        }
        
        // Fetch translations
        try {
          const transRes = await apiFetch(`/languages/content/cms_pages/${props.pageId}`)
          const transData = await transRes.json()
          if (transData?.grouped) {
            form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
          }
        } catch (e) {
          console.warn('Could not load CMS translations:', e)
        }
      }
    } catch (e) {
      showToast('Không tải được trang: ' + e.message, 'error')
    }
  }
})

async function handleSave() {
  if (!form.value.title) return showToast(t('admin.msg_d49775', 'Nhập tiêu đề'), 'error')
  saving.value = true
  try {
    if (isEditing.value && props.pageId) {
      await updatePage(props.pageId, form.value)
      showToast(t('admin.msg_ca320b', 'Đã cập nhật trang'), 'success')
    } else {
      await createPage(form.value)
      showToast(t('admin.msg_d46570', 'Đã tạo trang'), 'success')
    }
    // If dynamic page, navigate to Layout Builder
    if (form.value.is_dynamic) {
      emit('navigate', 'storefront-layout')
    } else {
      goBack()
    }
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cms-form-page {
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Header */
.form-page-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid var(--color-border);
}

.form-page-header h3 {
  margin: 0; font-size: 17px; font-weight: 700; flex: 1; text-align: center;
  color: var(--color-text-primary);
}

.btn-back {
  display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}

.btn-save {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 8px;
}

.btn-save:disabled {
  opacity: 0.5; cursor: not-allowed;
}

/* Layout Columns */
.form-page-body {
  display: flex; gap: 20px; align-items: flex-start;
}

.form-col--main { flex: 7; min-width: 0; display: flex; flex-direction: column; gap: 16px; }
.form-col--side { flex: 3; min-width: 240px; display: flex; flex-direction: column; gap: 16px; position: sticky; top: 16px; }

/* Cards */
.form-card {
  background: var(--color-bg-card); border: 1px solid var(--color-border);
  border-radius: 12px; padding: 20px;
}

.form-card h4 {
  font-size: 14px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary);
}

/* Forms */
.form-group { margin-bottom: 14px; display: flex; flex-direction: column; gap: 4px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); }
.required { color: #ef4444; }

.form-group input, 
.form-group select {
  width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); outline: none; transition: border-color 0.2s;
}

.form-group input:focus, 
.form-group select:focus {
  border-color: var(--color-accent-primary);
}

.input-lg {
  font-size: 1.1rem !important;
  padding: 12px 14px !important;
  font-weight: 600;
}

.input-prefix {
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-bg-primary);
}
.input-prefix .prefix {
  padding: 8px 8px 8px 12px;
  color: var(--color-text-muted);
  font-family: monospace;
  font-size: 0.9rem;
  background: var(--color-bg-card);
  border-right: 1px solid var(--color-border);
}
.input-prefix input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
  background: transparent !important;
}

.checkbox-label {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--color-accent-primary) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}
.checkbox-label input { width: auto; accent-color: var(--color-accent-primary); }

.info-box {
  padding: 12px 16px;
  margin-top: 8px;
  background: var(--color-accent-glow);
  border-radius: 8px;
  color: var(--color-accent-primary);
  font-size: 0.85rem;
  font-weight: 500;
  border: 1px solid rgba(124, 58, 237, 0.15); /* Tailwind purple base */
}

.textarea-code {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  resize: vertical;
  line-height: 1.6;
  outline: none;
  transition: border-color 0.2s;
}
.textarea-code:focus {
  border-color: var(--color-accent-primary);
}

.image-preview {
  margin-top: 8px;
}
.image-preview img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
  border: 1px solid var(--color-border);
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .form-page-body {
    flex-direction: column;
  }
  .form-col--side {
    position: static;
  }
}
</style>
