<template>
  <div class="content-editor">
    <!-- Header -->
    <div class="content-editor__header">
      <button class="content-editor__back" @click="$emit('back')">
        <ChevronLeft :size="16" /> {{ t('admin.back', 'Quay lại') }}
      </button>
      <h2 class="content-editor__title">
        {{ editId ? t('admin.edit', 'Chỉnh sửa') : t('admin.create', 'Tạo mới') }}
        {{ typeConfig?.label || contentType }}
      </h2>
    </div>

    <div class="content-editor__body">
      <!-- Main column -->
      <div class="content-editor__main">
        <!-- Title -->
        <div class="content-editor__field">
          <label class="content-editor__label">{{ t('admin.title', 'Tiêu đề') }} *</label>
          <input
            v-model="form.title"
            type="text"
            class="content-editor__input content-editor__input--title"
            :placeholder="t('admin.enter_title', 'Nhập tiêu đề...')"
            @blur="autoSlug"
          />
        </div>

        <!-- Slug -->
        <div v-if="supports('slug')" class="content-editor__field content-editor__slug-row">
          <label class="content-editor__label">Slug</label>
          <div class="content-editor__slug-input">
            <span class="content-editor__slug-prefix">/</span>
            <input v-model="form.slug" type="text" class="content-editor__input" placeholder="auto-generated" />
          </div>
        </div>

        <!-- Body -->
        <div v-if="supports('body')" class="content-editor__field">
          <label class="content-editor__label">{{ t('admin.content', 'Nội dung') }}</label>
          <textarea
            v-model="form.body"
            class="content-editor__textarea"
            rows="15"
            :placeholder="t('admin.enter_content', 'Nhập nội dung...')"
          ></textarea>
        </div>

        <!-- Excerpt -->
        <div v-if="supports('excerpt')" class="content-editor__field">
          <label class="content-editor__label">{{ t('admin.excerpt', 'Tóm tắt') }}</label>
          <textarea
            v-model="form.excerpt"
            class="content-editor__textarea content-editor__textarea--sm"
            rows="3"
            :placeholder="t('admin.enter_excerpt', 'Tóm tắt ngắn...')"
          ></textarea>
        </div>

        <!-- Meta fields -->
        <div v-if="metaFields.length" class="content-editor__meta-section">
          <h3 class="content-editor__section-title">{{ t('admin.custom_fields', 'Trường tuỳ chỉnh') }}</h3>
          <ContentFieldRenderer
            v-for="field in metaFields"
            :key="field.key"
            :field="field"
            :modelValue="form.meta[field.key] || ''"
            @update:modelValue="form.meta[field.key] = $event"
          />
        </div>
      </div>

      <!-- Sidebar -->
      <div class="content-editor__sidebar">
        <!-- Status -->
        <div class="content-editor__card">
          <h4 class="content-editor__card-title">{{ t('admin.publish', 'Xuất bản') }}</h4>
          <div class="content-editor__field">
            <label class="content-editor__label">{{ t('admin.status', 'Trạng thái') }}</label>
            <select v-model="form.status" class="content-editor__select">
              <option value="draft">{{ t('admin.draft', 'Nháp') }}</option>
              <option value="published">{{ t('admin.published', 'Đã xuất bản') }}</option>
              <option value="archived">{{ t('admin.archived', 'Lưu trữ') }}</option>
            </select>
          </div>
          <div v-if="form.status === 'published'" class="content-editor__field">
            <label class="content-editor__label">{{ t('admin.publish_date', 'Ngày xuất bản') }}</label>
            <input v-model="form.published_at" type="datetime-local" class="content-editor__input" />
          </div>
        </div>

        <!-- Featured Image -->
        <div v-if="supports('featured_image')" class="content-editor__card">
          <h4 class="content-editor__card-title">{{ t('admin.featured_image', 'Ảnh đại diện') }}</h4>
          <div v-if="form.featured_image" class="content-editor__featured-preview">
            <img :src="form.featured_image" alt="" />
            <button @click="form.featured_image = ''" class="content-editor__remove-img">✕</button>
          </div>
          <input
            v-model="form.featured_image"
            type="text"
            class="content-editor__input"
            placeholder="URL ảnh"
          />
        </div>

        <!-- Taxonomies (tags/categories) -->
        <div v-for="tax in taxonomies" :key="tax" class="content-editor__card">
          <h4 class="content-editor__card-title">{{ tax === 'category' ? t('admin.categories', 'Danh mục') : tax }}</h4>
          <div class="content-editor__tags">
            <span v-for="(term, i) in (form.taxonomies[tax] || [])" :key="i" class="content-editor__tag">
              {{ term }}
              <button @click="removeTag(tax, i)" class="content-editor__tag-remove">✕</button>
            </span>
          </div>
          <div class="content-editor__tag-input">
            <input
              v-model="newTag[tax]"
              type="text"
              :placeholder="'Thêm ' + tax + '...'"
              class="content-editor__input"
              @keydown.enter.prevent="addTag(tax)"
            />
            <button @click="addTag(tax)" class="content-editor__tag-add">+</button>
          </div>
        </div>

        <!-- Revisions -->
        <div v-if="revisions.length" class="content-editor__card">
          <h4 class="content-editor__card-title">
            {{ t('admin.revisions', 'Lịch sử chỉnh sửa') }} ({{ revisions.length }})
          </h4>
          <ul class="content-editor__revisions">
            <li v-for="rev in revisions.slice(0, 5)" :key="rev.id" class="content-editor__revision">
              <Clock :size="12" />
              <span>{{ formatDate(rev.created_at) }}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="content-editor__actions">
      <button class="content-editor__btn content-editor__btn--secondary" @click="$emit('back')">
        {{ t('admin.cancel', 'Huỷ') }}
      </button>
      <button class="content-editor__btn content-editor__btn--primary" @click="save" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        <Save v-else :size="14" />
        {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save', 'Lưu') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ChevronLeft, Save, Clock, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import ContentFieldRenderer from './ContentFieldRenderer.vue'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  contentType: { type: String, required: true },
  typeConfig: { type: Object, default: null },
  editId: { type: [Number, String], default: null },
})
const emit = defineEmits(['back', 'saved'])

const form = reactive({
  title: '',
  slug: '',
  body: '',
  excerpt: '',
  featured_image: '',
  status: 'draft',
  published_at: '',
  meta: {},
  taxonomies: {},
})

const saving = ref(false)
const revisions = ref([])
const newTag = reactive({})

const metaFields = computed(() => props.typeConfig?.meta_fields || [])
const taxonomies = computed(() => props.typeConfig?.taxonomies || [])

function supports(feature) {
  return props.typeConfig?.supports?.includes(feature) ?? true
}

function autoSlug() {
  if (!form.slug && form.title) {
    form.slug = form.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

function addTag(taxonomy) {
  const val = (newTag[taxonomy] || '').trim()
  if (!val) return
  if (!form.taxonomies[taxonomy]) form.taxonomies[taxonomy] = []
  if (!form.taxonomies[taxonomy].includes(val)) {
    form.taxonomies[taxonomy].push(val)
  }
  newTag[taxonomy] = ''
}

function removeTag(taxonomy, index) {
  form.taxonomies[taxonomy]?.splice(index, 1)
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function loadContent() {
  if (!props.editId) return
  try {
    const res = await apiFetch(`/content/${props.contentType}/${props.editId}`)
    const data = await res.json()
    const item = data.data || data
    form.title = item.title || ''
    form.slug = item.slug || ''
    form.body = item.body || ''
    form.excerpt = item.excerpt || ''
    form.featured_image = item.featured_image || ''
    form.status = item.status || 'draft'
    form.published_at = item.published_at ? item.published_at.slice(0, 16) : ''
    form.meta = item.meta || {}
    // Map taxonomies
    if (item.taxonomies) {
      const taxMap = {}
      for (const t of item.taxonomies) {
        if (!taxMap[t.taxonomy]) taxMap[t.taxonomy] = []
        taxMap[t.taxonomy].push(t.term)
      }
      Object.assign(form.taxonomies, taxMap)
    }
    revisions.value = item.revisions || []
  } catch (e) {
    showToast('Lỗi tải nội dung: ' + e.message, 'error')
  }
}

async function save() {
  if (!form.title.trim()) {
    showToast('Vui lòng nhập tiêu đề', 'warning')
    return
  }
  saving.value = true
  try {
    const method = props.editId ? 'PUT' : 'POST'
    const url = props.editId
      ? `/content/${props.contentType}/${props.editId}`
      : `/content/${props.contentType}`

    const res = await apiFetch(url, {
      method,
      body: JSON.stringify({
        title: form.title,
        slug: form.slug,
        body: form.body,
        excerpt: form.excerpt,
        featured_image: form.featured_image,
        status: form.status,
        published_at: form.published_at || null,
        meta: form.meta,
        taxonomies: form.taxonomies,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || 'Đã lưu thành công', 'success')
      emit('saved', data.data || data)
    } else {
      showToast(data.message || 'Lỗi lưu', 'error')
    }
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadContent)
</script>

<style scoped>
.content-editor { padding: 20px 0; }

.content-editor__header {
  display: flex; align-items: center; gap: 16px; margin-bottom: 24px;
}
.content-editor__back {
  display: flex; align-items: center; gap: 4px; padding: 6px 12px;
  border-radius: 8px; border: 1px solid var(--glass-border);
  background: transparent; color: var(--color-text-secondary); cursor: pointer;
  font-size: 13px; transition: all 0.2s;
}
.content-editor__back:hover { background: var(--glass-bg); }
.content-editor__title {
  font-size: 20px; font-weight: 700; color: var(--color-text);
}

.content-editor__body {
  display: grid; grid-template-columns: 1fr 300px; gap: 24px;
}

.content-editor__main { min-width: 0; }
.content-editor__sidebar { display: flex; flex-direction: column; gap: 16px; }

.content-editor__field { margin-bottom: 16px; }
.content-editor__label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary); margin-bottom: 6px;
}

.content-editor__input, .content-editor__textarea, .content-editor__select {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg, rgba(255,255,255,0.06));
  color: var(--color-text); font-size: 14px;
  transition: border-color 0.2s;
}
.content-editor__input:focus, .content-editor__textarea:focus, .content-editor__select:focus {
  border-color: var(--accent-light, #6366f1); outline: none;
}
.content-editor__input--title { font-size: 18px; font-weight: 600; padding: 12px 16px; }
.content-editor__textarea { resize: vertical; min-height: 200px; font-family: inherit; }
.content-editor__textarea--sm { min-height: 80px; }

.content-editor__slug-row { }
.content-editor__slug-input { display: flex; align-items: center; }
.content-editor__slug-prefix {
  padding: 8px 4px 8px 12px; font-size: 14px; color: var(--color-text-muted);
  border: 1px solid var(--glass-border); border-right: none; border-radius: 8px 0 0 8px;
  background: var(--glass-bg);
}
.content-editor__slug-input .content-editor__input {
  border-radius: 0 8px 8px 0;
}

.content-editor__meta-section {
  border-top: 1px solid var(--glass-border); padding-top: 20px; margin-top: 8px;
}
.content-editor__section-title {
  font-size: 15px; font-weight: 700; margin-bottom: 16px;
}

/* Sidebar cards */
.content-editor__card {
  padding: 16px; border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg);
}
.content-editor__card-title {
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--color-text-secondary);
  margin-bottom: 12px;
}

/* Featured image */
.content-editor__featured-preview {
  position: relative; margin-bottom: 8px;
}
.content-editor__featured-preview img {
  width: 100%; border-radius: 8px; object-fit: cover; max-height: 160px;
}
.content-editor__remove-img {
  position: absolute; top: 6px; right: 6px; width: 24px; height: 24px;
  border-radius: 50%; background: rgba(0,0,0,0.6); color: white;
  border: none; cursor: pointer; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}

/* Tags */
.content-editor__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }
.content-editor__tag {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 16px; font-size: 12px;
  background: var(--accent-light, #6366f1); color: white;
}
.content-editor__tag-remove {
  background: none; border: none; color: rgba(255,255,255,0.7);
  cursor: pointer; font-size: 11px; padding: 0;
}
.content-editor__tag-input { display: flex; gap: 6px; }
.content-editor__tag-input .content-editor__input { flex: 1; }
.content-editor__tag-add {
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: transparent; color: var(--accent-light); cursor: pointer; font-weight: 700;
}

/* Revisions */
.content-editor__revisions { list-style: none; padding: 0; margin: 0; }
.content-editor__revision {
  display: flex; align-items: center; gap: 6px;
  padding: 4px 0; font-size: 12px; color: var(--color-text-muted);
}

/* Actions */
.content-editor__actions {
  display: flex; justify-content: flex-end; gap: 12px;
  margin-top: 24px; padding-top: 20px;
  border-top: 1px solid var(--glass-border);
}
.content-editor__btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 10px; font-size: 14px;
  font-weight: 600; cursor: pointer; transition: all 0.2s; border: none;
}
.content-editor__btn--secondary {
  background: var(--glass-bg); color: var(--color-text-secondary);
  border: 1px solid var(--glass-border);
}
.content-editor__btn--secondary:hover { background: var(--glass-border); }
.content-editor__btn--primary {
  background: var(--accent-light, #6366f1); color: white;
}
.content-editor__btn--primary:hover { filter: brightness(1.1); }
.content-editor__btn:disabled { opacity: 0.6; cursor: not-allowed; }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .content-editor__body { grid-template-columns: 1fr; }
}
</style>
