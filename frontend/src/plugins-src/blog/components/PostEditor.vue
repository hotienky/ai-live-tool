<template>
  <div class="post-editor">
    <div class="post-editor__header">
      <button class="post-editor__back" @click="$emit('back')">
        <ChevronLeft :size="16" /> {{ t('admin.msg_go_back', 'Quay lại') }}
      </button>
      <h2 class="post-editor__title">{{ editId ? t('admin.msg_edit_post', 'Chỉnh sửa bài viết') : t('admin.msg_create_post', 'Viết bài mới') }}</h2>
    </div>

    <div class="post-editor__body">
      <!-- Main -->
      <div class="post-editor__main">
        <div class="post-editor__field">
          <label class="post-editor__label">{{ t('admin.msg_title_required', 'Tiêu đề *') }}</label>
          <input v-model="form.title" type="text" class="post-editor__input post-editor__input--title" :placeholder="t('admin.msg_post_title_placeholder', 'Tiêu đề bài viết...')" @blur="autoSlug" />
        </div>

        <div class="post-editor__field post-editor__slug-row">
          <label class="post-editor__label">Slug</label>
          <div class="post-editor__slug-input">
            <span class="post-editor__slug-prefix">/blog/</span>
            <input v-model="form.slug" type="text" class="post-editor__input" placeholder="auto-generated" />
          </div>
        </div>

        <div class="post-editor__field">
          <div class="post-editor__content-header">
            <label class="post-editor__label">{{ t('admin.msg_content', 'Nội dung') }}</label>
            <button type="button" class="post-editor__ai-btn" @click="showAiPanel = !showAiPanel">
              <SparklesIcon :size="12" /> {{ t('admin.msg_ai_write', 'AI Viết bài') }}
            </button>
          </div>

          <!-- AI Write Panel -->
          <div v-if="showAiPanel" class="post-editor__ai-panel">
            <textarea
              v-model="aiPrompt"
              class="post-editor__ai-textarea"
              rows="2"
              :placeholder="t('admin.msg_ai_prompt_placeholder', 'Mô tả bài viết... VD: Bài viết về lợi ích của thiền định cho sức khỏe tâm thần')"
            />
            <div class="post-editor__ai-actions">
              <select v-model="aiTone" class="post-editor__ai-select">
                <option value="professional">{{ t('admin.msg_tone_professional', 'Chuyên nghiệp') }}</option>
                <option value="friendly">{{ t('admin.msg_tone_friendly', 'Thân thiện') }}</option>
                <option value="creative">{{ t('admin.msg_tone_creative', 'Sáng tạo') }}</option>
                <option value="informative">{{ t('admin.msg_tone_informative', 'Thông tin') }}</option>
              </select>
              <button type="button" class="post-editor__ai-generate" @click="generatePost" :disabled="aiLoading || !aiPrompt.trim()">
                <Loader2 v-if="aiLoading" :size="12" class="spin" />
                <SparklesIcon v-else :size="12" />
                {{ aiLoading ? t('admin.msg_ai_writing', 'Đang viết...') : t('admin.msg_generate_post', 'Tạo bài viết') }}
              </button>
            </div>
          </div>

          <RichTextEditor v-model="form.body" :placeholder="t('admin.msg_write_content', 'Viết nội dung bài viết...')" />
        </div>

        <div class="post-editor__field">
          <label class="post-editor__label">{{ t('admin.msg_excerpt', 'Tóm tắt') }}</label>
          <textarea v-model="form.excerpt" class="post-editor__textarea post-editor__textarea--sm" rows="3" :placeholder="t('admin.msg_excerpt_placeholder', 'Tóm tắt ngắn (tự động tạo nếu để trống)...')"></textarea>
        </div>

        <!-- SEO Fields -->
        <div class="post-editor__meta-section">
          <h3 class="post-editor__section-title">{{ t('admin.msg_seo_customization', 'SEO & Tùy chỉnh') }}</h3>
          <div class="post-editor__field">
            <label class="post-editor__label">SEO Title</label>
            <input v-model="form.meta.seo_title" type="text" class="post-editor__input" :placeholder="t('admin.msg_seo_title_placeholder', 'Tiêu đề SEO...')" />
          </div>
          <div class="post-editor__field">
            <label class="post-editor__label">Meta Description</label>
            <textarea v-model="form.meta.seo_description" class="post-editor__textarea post-editor__textarea--sm" rows="2" :placeholder="t('admin.msg_meta_desc_placeholder', 'Mô tả meta...')"></textarea>
          </div>
          <div class="post-editor__field post-editor__checkbox-field">
            <label><input type="checkbox" v-model="form.meta.is_featured" /> {{ t('admin.msg_featured_post', 'Bài viết nổi bật') }}</label>
          </div>
          <div class="post-editor__field">
            <label class="post-editor__label">{{ t('admin.msg_reading_time', 'Thời gian đọc (phút)') }}</label>
            <input v-model.number="form.meta.reading_time" type="number" class="post-editor__input" placeholder="Auto-calculated" min="1" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="post-editor__sidebar">
        <!-- Publish -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">{{ t('admin.msg_publish', 'Xuất bản') }}</h4>
          <div class="post-editor__field">
            <select v-model="form.status" class="post-editor__select">
              <option value="draft">{{ t('admin.msg_draft_label', 'Nháp') }}</option>
              <option value="published">{{ t('admin.msg_published_label', 'Xuất bản') }}</option>
              <option value="archived">{{ t('admin.msg_archived', 'Lưu trữ') }}</option>
            </select>
          </div>
          <div v-if="form.status === 'published'" class="post-editor__field">
            <label class="post-editor__label">{{ t('admin.msg_publish_date', 'Ngày xuất bản') }}</label>
            <input v-model="form.published_at" type="datetime-local" class="post-editor__input" />
          </div>
        </div>

        <!-- Featured Image -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">{{ t('admin.msg_featured_image', 'Ảnh đại diện') }}</h4>
          <div v-if="form.featured_image" class="post-editor__img-preview">
            <img :src="form.featured_image" alt="" />
            <button @click="form.featured_image = ''" class="post-editor__img-remove">✕</button>
          </div>
          <input v-model="form.featured_image" type="text" class="post-editor__input" placeholder="URL ảnh" />
        </div>

        <!-- Categories -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">{{ t('admin.msg_category', 'Danh mục') }}</h4>
          <div class="post-editor__tags">
            <span v-for="(c, i) in (form.taxonomies.category || [])" :key="i" class="post-editor__tag">
              {{ c }} <button @click="removeTag('category', i)" class="post-editor__tag-x">✕</button>
            </span>
          </div>
          <div class="post-editor__tag-input">
            <input v-model="newCategory" type="text" :placeholder="t('admin.msg_add_category', 'Thêm danh mục...')" class="post-editor__input" @keydown.enter.prevent="addTag('category', newCategory); newCategory = ''" />
            <button @click="addTag('category', newCategory); newCategory = ''" class="post-editor__tag-add">+</button>
          </div>
        </div>

        <!-- Tags -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">{{ t('admin.msg_tags', 'Thẻ') }}</h4>
          <div class="post-editor__tags">
            <span v-for="(tg, i) in (form.taxonomies.tag || [])" :key="i" class="post-editor__tag post-editor__tag--tag">
              {{ tg }} <button @click="removeTag('tag', i)" class="post-editor__tag-x">✕</button>
            </span>
          </div>
          <div class="post-editor__tag-input">
            <input v-model="newTagVal" type="text" :placeholder="t('admin.msg_add_tag', 'Thêm thẻ...')" class="post-editor__input" @keydown.enter.prevent="addTag('tag', newTagVal); newTagVal = ''" />
            <button @click="addTag('tag', newTagVal); newTagVal = ''" class="post-editor__tag-add">+</button>
          </div>
        </div>

        <!-- Revisions -->
        <div v-if="revisions.length" class="post-editor__card">
          <h4 class="post-editor__card-title">{{ t('admin.msg_history', 'Lịch sử') }} ({{ revisions.length }})</h4>
          <ul class="post-editor__revisions">
            <li v-for="rev in revisions.slice(0, 5)" :key="rev.id">
              <Clock :size="12" /> {{ formatDate(rev.created_at) }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="post-editor__actions">
      <button class="post-editor__btn post-editor__btn--sec" @click="$emit('back')">{{ t('admin.msg_cancel', 'Huỷ') }}</button>
      <button class="post-editor__btn post-editor__btn--pri" @click="save" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        <Save v-else :size="14" />
        {{ saving ? t('admin.msg_saving', 'Đang lưu...') : t('admin.msg_save_post', 'Lưu bài viết') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ChevronLeft, Save, Clock, Loader2, Sparkles as SparklesIcon } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t } = useI18n()

const bridge = window.__APP_BRIDGE__ || {}
const RichTextEditor = bridge.components?.RichTextEditor

const { showToast } = useToast()
const props = defineProps({ editId: { type: [Number, String], default: null } })
const emit = defineEmits(['back', 'saved'])

const form = reactive({
  title: '', slug: '', body: '', excerpt: '',
  featured_image: '', status: 'draft', published_at: '',
  meta: { seo_title: '', seo_description: '', reading_time: null, is_featured: false },
  taxonomies: { category: [], tag: [] },
})
const saving = ref(false)
const revisions = ref([])
const newCategory = ref('')
const newTagVal = ref('')

// AI state
const showAiPanel = ref(false)
const aiPrompt = ref('')
const aiTone = ref('professional')
const aiLoading = ref(false)

async function generatePost() {
  if (!aiPrompt.value.trim()) return
  aiLoading.value = true
  try {
    const res = await apiFetch('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ type: 'blog', prompt: aiPrompt.value, tone: aiTone.value }),
    })
    const data = await res.json()
    if (data.success && data.data?.content) {
      form.body = data.data.content.replace(/```html\n?|```\n?/g, '').trim()
      if (!form.title) {
        // Auto-extract title from first h1/h2 in generated content
        const match = form.body.match(/<h[12][^>]*>(.*?)<\/h[12]>/i)
        if (match) form.title = match[1].replace(/<[^>]*>/g, '')
      }
      showAiPanel.value = false
      aiPrompt.value = ''
      showToast(t('admin.msg_post_generated', '✨ Đã tạo bài viết!'), 'success')
    } else {
      showToast(data.message || t('admin.msg_ai_not_configured', 'AI chưa cấu hình'), 'error')
    }
  } catch (e) {
    showToast(t('admin.msg_ai_error', 'Lỗi AI: ') + e.message, 'error')
  } finally {
    aiLoading.value = false
  }
}

function autoSlug() {
  if (!form.slug && form.title) {
    form.slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  if (form.body && !form.meta.reading_time) {
    form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
  }
}

function addTag(taxonomy, val) {
  val = (val || '').trim()
  if (!val) return
  if (!form.taxonomies[taxonomy]) form.taxonomies[taxonomy] = []
  if (!form.taxonomies[taxonomy].includes(val)) form.taxonomies[taxonomy].push(val)
}
function removeTag(taxonomy, i) { form.taxonomies[taxonomy]?.splice(i, 1) }

function formatDate(d) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }

async function loadPost() {
  if (!props.editId) return
  try {
    const res = await apiFetch(`/content/post/${props.editId}`)
    const data = await res.json()
    const item = data.data || data
    form.title = item.title || ''; form.slug = item.slug || ''
    form.body = item.body || ''; form.excerpt = item.excerpt || ''
    form.featured_image = item.featured_image || ''
    form.status = item.status || 'draft'
    form.published_at = item.published_at ? item.published_at.slice(0, 16) : ''
    form.meta = { seo_title: '', seo_description: '', reading_time: null, is_featured: false, ...(item.meta || {}) }
    if (item.taxonomies) {
      const taxMap = { category: [], tag: [] }
      for (const t of item.taxonomies) {
        if (!taxMap[t.taxonomy]) taxMap[t.taxonomy] = []
        taxMap[t.taxonomy].push(t.term)
      }
      form.taxonomies = taxMap
    }
    revisions.value = item.revisions || []
  } catch (e) { showToast(t('admin.msg_load_posts_error', 'Lỗi tải bài viết'), 'error') }
}

async function save() {
  if (!form.title.trim()) return showToast(t('admin.msg_please_enter_title', 'Vui lòng nhập tiêu đề'), 'warning')
  if (!form.excerpt && form.body) {
    form.excerpt = form.body.replace(/<[^>]*>/g, '').substring(0, 160)
  }
  if (form.body) {
    form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
  }

  saving.value = true
  try {
    const method = props.editId ? 'PUT' : 'POST'
    const url = props.editId ? `/content/post/${props.editId}` : '/content/post'
    const res = await apiFetch(url, { method, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { showToast(data.message || t('admin.msg_saved', 'Đã lưu'), 'success'); emit('saved', data.data || data) }
    else showToast(data.message || t('admin.msg_save_error', 'Lỗi lưu'), 'error')
  } catch (e) { showToast(t('admin.msg_error_prefix', 'Lỗi: ') + e.message, 'error') }
  finally { saving.value = false }
}

onMounted(loadPost)
</script>

<style scoped>
.post-editor__header { display:flex; align-items:center; gap:16px; margin-bottom:24px }
.post-editor__back { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--color-text-secondary); cursor:pointer; font-size:13px }
.post-editor__title { font-size:20px; font-weight:700 }
.post-editor__body { display:grid; grid-template-columns:1fr 300px; gap:24px }
.post-editor__main { min-width:0 }
.post-editor__sidebar { display:flex; flex-direction:column; gap:16px }
.post-editor__field { margin-bottom:16px }
.post-editor__label { display:block; font-size:13px; font-weight:600; color:var(--color-text-secondary); margin-bottom:6px }
.post-editor__input,.post-editor__textarea,.post-editor__select { width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:14px }
.post-editor__input:focus,.post-editor__textarea:focus { border-color:var(--accent-light); outline:none }
.post-editor__input--title { font-size:18px; font-weight:600; padding:12px 16px }
.post-editor__textarea { resize:vertical; min-height:200px; font-family:inherit }
.post-editor__textarea--sm { min-height:60px }
.post-editor__slug-row {}
.post-editor__slug-input { display:flex }
.post-editor__slug-prefix { padding:8px 4px 8px 12px; font-size:14px; color:var(--color-text-muted); border:1px solid var(--glass-border); border-right:none; border-radius:8px 0 0 8px; background:var(--glass-bg) }
.post-editor__slug-input .post-editor__input { border-radius:0 8px 8px 0 }
.post-editor__meta-section { border-top:1px solid var(--glass-border); padding-top:20px; margin-top:8px }
.post-editor__section-title { font-size:15px; font-weight:700; margin-bottom:16px }
.post-editor__checkbox-field label { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer }
.post-editor__card { padding:16px; border-radius:12px; border:1px solid var(--glass-border); background:var(--glass-bg) }
.post-editor__card-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--color-text-secondary); margin-bottom:12px }
.post-editor__img-preview { position:relative; margin-bottom:8px }
.post-editor__img-preview img { width:100%; border-radius:8px; object-fit:cover; max-height:160px }
.post-editor__img-remove { position:absolute; top:6px; right:6px; width:24px; height:24px; border-radius:50%; background:rgba(0,0,0,.6); color:#fff; border:none; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center }
.post-editor__tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px }
.post-editor__tag { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:16px; font-size:12px; background:var(--accent-light,#6366f1); color:#fff }
.post-editor__tag--tag { background:#10b981 }
.post-editor__tag-x { background:none; border:none; color:rgba(255,255,255,.7); cursor:pointer; font-size:11px; padding:0 }
.post-editor__tag-input { display:flex; gap:6px }
.post-editor__tag-input .post-editor__input { flex:1 }
.post-editor__tag-add { padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--accent-light); cursor:pointer; font-weight:700 }
.post-editor__revisions { list-style:none; padding:0; margin:0 }
.post-editor__revisions li { display:flex; align-items:center; gap:6px; padding:4px 0; font-size:12px; color:var(--color-text-muted) }
.post-editor__actions { display:flex; justify-content:flex-end; gap:12px; margin-top:24px; padding-top:20px; border-top:1px solid var(--glass-border) }
.post-editor__btn { display:flex; align-items:center; gap:6px; padding:10px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; border:none }
.post-editor__btn--sec { background:var(--glass-bg); color:var(--color-text-secondary); border:1px solid var(--glass-border) }
.post-editor__btn--pri { background:var(--accent-light,#6366f1); color:#fff }
.post-editor__btn--pri:hover { filter:brightness(1.1) }
.post-editor__btn:disabled { opacity:.6; cursor:not-allowed }

/* AI Write */
.post-editor__content-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px }
.post-editor__content-header .post-editor__label { margin-bottom:0 }
.post-editor__ai-btn { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:6px; border:1px solid rgba(124,58,237,.3); background:linear-gradient(135deg,rgba(124,58,237,.08),rgba(37,99,235,.08)); color:var(--accent-light,#7c3aed); font-size:11px; font-weight:600; cursor:pointer }
.post-editor__ai-panel { display:flex; flex-direction:column; gap:6px; margin-bottom:10px; padding:10px; border-radius:8px; border:1px solid rgba(124,58,237,.2); background:rgba(124,58,237,.04) }
.post-editor__ai-textarea { width:100%; padding:7px 10px; border-radius:7px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:12px; resize:vertical; font-family:inherit; outline:none }
.post-editor__ai-textarea:focus { border-color:var(--accent-light) }
.post-editor__ai-actions { display:flex; gap:6px; align-items:center }
.post-editor__ai-select { padding:6px 8px; border-radius:6px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:12px; flex:1 }
.post-editor__ai-generate { display:flex; align-items:center; gap:5px; padding:6px 12px; border-radius:7px; border:none; background:var(--accent-light,#6366f1); color:#fff; font-size:12px; font-weight:600; cursor:pointer }
.post-editor__ai-generate:disabled { opacity:.5; cursor:not-allowed }

.spin { animation:spin .8s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
@media(max-width:768px) { .post-editor__body { grid-template-columns:1fr } }
</style>
