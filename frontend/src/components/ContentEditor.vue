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

        <!-- ═══════════════════════════════════════════════ -->
        <!-- BODY — Dual Mode Editor: Rich Text / Block Builder -->
        <!-- ═══════════════════════════════════════════════ -->
        <div v-if="supports('body')" class="content-editor__field">
          <!-- Editor Mode Toggle -->
          <div class="ce-editor-bar">
            <label class="content-editor__label">{{ t('admin.content', 'Nội dung') }}</label>
            <div class="ce-mode-toggle">
              <button
                :class="['ce-mode-btn', { active: editorMode === 'richtext' }]"
                @click="switchMode('richtext')"
              >
                <Type :size="14" /> Rich Text
              </button>
              <button
                :class="['ce-mode-btn', { active: editorMode === 'blocks' }]"
                @click="switchMode('blocks')"
              >
                <LayoutGrid :size="14" /> Block Builder
              </button>
            </div>
          </div>

          <!-- Rich Text Mode (TipTap) -->
          <RichTextEditor
            v-if="editorMode === 'richtext'"
            v-model="form.body"
            :placeholder="t('admin.enter_content', 'Nhập nội dung...')"
          />

          <!-- Block Builder Mode -->
          <BlockEditor
            v-else-if="editorMode === 'blocks'"
            v-model="form.blocks"
          />
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
        <!-- ═══════════════════════════════════════════ -->
        <!-- AI Content Assistant -->
        <!-- ═══════════════════════════════════════════ -->
        <div class="content-editor__card ce-ai-card">
          <div class="ce-ai-header" @click="showAiPanel = !showAiPanel">
            <h4 class="content-editor__card-title ce-ai-title">
              <Sparkles :size="14" /> AI Assistant
            </h4>
            <ChevronDown :size="14" :class="['ce-ai-chevron', { open: showAiPanel }]" />
          </div>

          <div v-if="showAiPanel" class="ce-ai-body">
            <!-- AI Action Buttons -->
            <div class="ce-ai-actions">
              <button class="ce-ai-btn" @click="aiGenerate('blog')" :disabled="aiLoading">
                <FileText :size="13" /> Viết bài hoàn chỉnh
              </button>
              <button class="ce-ai-btn" @click="aiGenerate('outline')" :disabled="aiLoading">
                <List :size="13" /> Tạo dàn bài
              </button>
              <button class="ce-ai-btn" @click="aiGenerate('title')" :disabled="aiLoading">
                <Heading :size="13" /> Gợi ý tiêu đề
              </button>
              <button class="ce-ai-btn" @click="aiGenerate('seo')" :disabled="aiLoading">
                <Search :size="13" /> Tối ưu SEO
              </button>
              <button class="ce-ai-btn" @click="aiGenerate('excerpt')" :disabled="aiLoading">
                <AlignLeft :size="13" /> Tạo tóm tắt
              </button>
            </div>

            <!-- AI Prompt Input -->
            <div class="ce-ai-prompt">
              <textarea
                v-model="aiPrompt"
                class="ce-ai-input"
                rows="3"
                placeholder="Mô tả chủ đề bài viết hoặc yêu cầu cụ thể..."
              ></textarea>
              <div class="ce-ai-options">
                <select v-model="aiTone" class="ce-ai-select">
                  <option value="professional">Chuyên nghiệp</option>
                  <option value="casual">Thân thiện</option>
                  <option value="creative">Sáng tạo</option>
                  <option value="formal">Trang trọng</option>
                  <option value="humorous">Hài hước</option>
                </select>
                <button class="ce-ai-generate" @click="aiGenerate('blog')" :disabled="aiLoading || !aiPrompt.trim()">
                  <Loader2 v-if="aiLoading" :size="14" class="spin" />
                  <Wand2 v-else :size="14" />
                  {{ aiLoading ? 'Đang tạo...' : 'Tạo nội dung' }}
                </button>
              </div>
            </div>

            <!-- AI Result Preview -->
            <div v-if="aiResult" class="ce-ai-result">
              <div class="ce-ai-result-header">
                <span>📝 Kết quả AI</span>
                <div class="ce-ai-result-actions">
                  <button @click="insertAiResult" class="ce-ai-result-btn ce-ai-result-btn--insert">
                    <Plus :size="12" /> Chèn
                  </button>
                  <button @click="replaceWithAiResult" class="ce-ai-result-btn ce-ai-result-btn--replace">
                    <Replace :size="12" /> Thay thế
                  </button>
                  <button @click="aiResult = ''" class="ce-ai-result-btn">✕</button>
                </div>
              </div>
              <div class="ce-ai-result-content" v-html="aiResultHtml"></div>
            </div>
          </div>
        </div>

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
import {
  ChevronLeft, ChevronDown, Save, Clock, Loader2, Plus,
  Type, LayoutGrid, Sparkles, FileText, List, Heading,
  Search, AlignLeft, Wand2, Replace
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import ContentFieldRenderer from './ContentFieldRenderer.vue'
import RichTextEditor from './RichTextEditor.vue'
import BlockEditor from './builder/BlockEditor.vue'

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
  blocks: [],
})

const saving = ref(false)
const revisions = ref([])
const newTag = reactive({})
const editorMode = ref('richtext') // 'richtext' | 'blocks'

// ── AI Assistant State ──
const showAiPanel = ref(false)
const aiPrompt = ref('')
const aiTone = ref('professional')
const aiLoading = ref(false)
const aiResult = ref('')

const metaFields = computed(() => props.typeConfig?.meta_fields || [])
const taxonomies = computed(() => props.typeConfig?.taxonomies || [])

const aiResultHtml = computed(() => {
  // Simple markdown-to-html for AI preview
  if (!aiResult.value) return ''
  return aiResult.value
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>')
})

function supports(feature) {
  return props.typeConfig?.supports?.includes(feature) ?? true
}

function switchMode(mode) {
  editorMode.value = mode
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

// ── AI Assistant Functions ──
async function aiGenerate(type) {
  // Build prompt from context
  let prompt = aiPrompt.value.trim()

  if (type === 'title') {
    prompt = prompt || form.body?.substring(0, 500) || 'Tạo tiêu đề cho bài viết blog'
    try {
      aiLoading.value = true
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Gợi ý 5 tiêu đề hấp dẫn cho bài viết về: "${prompt}"`,
          type: 'general',
          max_tokens: 500,
          temperature: 0.8,
        }),
      })
      const data = await res.json()
      if (data.success) {
        aiResult.value = data.data?.content || data.data?.text || ''
        showToast('Đã tạo gợi ý tiêu đề', 'success')
      } else {
        showToast(data.message || 'AI không khả dụng', 'error')
      }
    } catch (e) {
      showToast('Lỗi AI: ' + e.message, 'error')
    } finally {
      aiLoading.value = false
    }
    return
  }

  if (type === 'seo') {
    try {
      aiLoading.value = true
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: form.title || prompt,
          type: 'seo',
          title: form.title,
          content: form.body?.substring(0, 2000) || '',
        }),
      })
      const data = await res.json()
      if (data.success) {
        aiResult.value = data.data?.content || data.data?.text || ''
        showToast('Đã tạo SEO metadata', 'success')
      } else {
        showToast(data.message || 'AI không khả dụng', 'error')
      }
    } catch (e) {
      showToast('Lỗi AI: ' + e.message, 'error')
    } finally {
      aiLoading.value = false
    }
    return
  }

  if (type === 'excerpt') {
    const content = form.body?.substring(0, 3000) || ''
    if (!content) {
      showToast('Cần có nội dung bài viết trước', 'warning')
      return
    }
    try {
      aiLoading.value = true
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Tóm tắt bài viết sau trong 2-3 câu ngắn gọn, hấp dẫn:\n\n${content}`,
          type: 'general',
          max_tokens: 300,
          temperature: 0.5,
        }),
      })
      const data = await res.json()
      if (data.success) {
        const excerpt = data.data?.content || data.data?.text || ''
        form.excerpt = excerpt.replace(/<[^>]*>/g, '').trim()
        showToast('Đã tạo tóm tắt tự động', 'success')
      } else {
        showToast(data.message || 'AI không khả dụng', 'error')
      }
    } catch (e) {
      showToast('Lỗi AI: ' + e.message, 'error')
    } finally {
      aiLoading.value = false
    }
    return
  }

  if (type === 'outline') {
    prompt = prompt || form.title || 'Bài viết blog'
    try {
      aiLoading.value = true
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Tạo dàn bài chi tiết cho bài viết về: "${prompt}"`,
          type: 'general',
          max_tokens: 1000,
          temperature: 0.7,
          system: 'Bạn là content strategist. Tạo dàn bài rõ ràng với heading, subheading, và bullet points cho từng phần.',
        }),
      })
      const data = await res.json()
      if (data.success) {
        aiResult.value = data.data?.content || data.data?.text || ''
        showToast('Đã tạo dàn bài', 'success')
      } else {
        showToast(data.message || 'AI không khả dụng', 'error')
      }
    } catch (e) {
      showToast('Lỗi AI: ' + e.message, 'error')
    } finally {
      aiLoading.value = false
    }
    return
  }

  // type === 'blog' — Full blog post generation
  if (!prompt) {
    if (form.title) {
      prompt = form.title
    } else {
      showToast('Vui lòng nhập chủ đề bài viết', 'warning')
      return
    }
  }

  try {
    aiLoading.value = true
    const res = await apiFetch('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({
        prompt,
        type: 'blog',
        tone: aiTone.value,
        outline: aiResult.value || null, // Use previous outline if exists
      }),
    })
    const data = await res.json()
    if (data.success) {
      aiResult.value = data.data?.content || data.data?.text || ''
      showToast('Đã tạo bài viết bằng AI', 'success')
    } else {
      showToast(data.message || 'AI không khả dụng', 'error')
    }
  } catch (e) {
    showToast('Lỗi AI: ' + e.message, 'error')
  } finally {
    aiLoading.value = false
  }
}

function insertAiResult() {
  if (!aiResult.value) return
  // Convert markdown-ish text to HTML and append
  const html = aiResultHtml.value
  form.body = (form.body || '') + '\n' + (editorMode.value === 'richtext' ? html : aiResult.value)
  showToast('Đã chèn nội dung AI', 'success')
}

function replaceWithAiResult() {
  if (!aiResult.value) return
  const html = aiResultHtml.value
  form.body = editorMode.value === 'richtext' ? html : aiResult.value
  showToast('Đã thay thế nội dung', 'success')
}

// ── Content CRUD ──
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
    // Restore editor mode and blocks from meta
    if (item.meta?.editor_mode) {
      editorMode.value = item.meta.editor_mode
    }
    if (item.meta?.blocks) {
      form.blocks = item.meta.blocks
    }
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

    // Store editor_mode and blocks in meta
    const meta = {
      ...form.meta,
      editor_mode: editorMode.value,
    }
    if (editorMode.value === 'blocks' && form.blocks?.length) {
      meta.blocks = form.blocks
    }

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
        meta,
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
  display: grid; grid-template-columns: 1fr 320px; gap: 24px;
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
  background: var(--accent-gradient, linear-gradient(135deg, #7c3aed, #6d28d9)); color: white;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}
.content-editor__btn--primary:hover { transform: translateY(-1px); }
.content-editor__btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* ═══════════════════════════════════════
   EDITOR MODE TOGGLE
   ═══════════════════════════════════════ */
.ce-editor-bar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.ce-mode-toggle {
  display: flex; gap: 2px; padding: 3px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 8px;
}
.ce-mode-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border: none; background: transparent;
  color: var(--color-text-muted); font-size: 12px; font-weight: 600;
  border-radius: 6px; cursor: pointer; transition: all 0.2s;
  white-space: nowrap;
}
.ce-mode-btn:hover { color: var(--color-text-secondary); }
.ce-mode-btn.active {
  background: var(--accent-gradient, linear-gradient(135deg, #7c3aed, #6d28d9));
  color: #fff; box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

/* ═══════════════════════════════════════
   AI CONTENT ASSISTANT
   ═══════════════════════════════════════ */
.ce-ai-card {
  border-color: rgba(139, 92, 246, 0.2);
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.03));
}
.ce-ai-header {
  display: flex; align-items: center; justify-content: space-between;
  cursor: pointer; margin-bottom: 0;
}
.ce-ai-header:hover { opacity: 0.8; }
.ce-ai-title {
  display: flex !important; align-items: center; gap: 6px;
  margin-bottom: 0 !important;
  background: linear-gradient(135deg, #8b5cf6, #3b82f6);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.ce-ai-chevron {
  color: var(--color-text-muted); transition: transform 0.2s;
}
.ce-ai-chevron.open { transform: rotate(180deg); }

.ce-ai-body {
  margin-top: 14px; animation: aiFadeIn 0.2s ease;
}
.ce-ai-actions {
  display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px;
}
.ce-ai-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 5px 10px; border-radius: 6px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.08);
  color: var(--color-text-secondary);
  font-size: 11px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; white-space: nowrap;
}
.ce-ai-btn:hover {
  border-color: rgba(139, 92, 246, 0.4);
  background: rgba(139, 92, 246, 0.15);
  color: #a78bfa;
}
.ce-ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.ce-ai-prompt { margin-bottom: 12px; }
.ce-ai-input {
  width: 100%; padding: 8px 10px; border-radius: 8px;
  border: 1px solid rgba(139, 92, 246, 0.2);
  background: rgba(139, 92, 246, 0.05);
  color: var(--color-text-primary); font-size: 12px;
  font-family: inherit; resize: vertical; outline: none;
  transition: border-color 0.2s;
}
.ce-ai-input:focus { border-color: rgba(139, 92, 246, 0.5); }
.ce-ai-input::placeholder { color: var(--color-text-muted); }

.ce-ai-options {
  display: flex; gap: 8px; margin-top: 8px; align-items: center;
}
.ce-ai-select {
  flex: 1; padding: 6px 8px; border-radius: 6px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-secondary);
  font-size: 12px; outline: none;
}
.ce-ai-generate {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border: none; border-radius: 6px;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  color: #fff; font-size: 12px; font-weight: 700;
  cursor: pointer; transition: all 0.25s;
  box-shadow: 0 3px 10px rgba(139, 92, 246, 0.3);
  white-space: nowrap;
}
.ce-ai-generate:hover { transform: translateY(-1px); box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
.ce-ai-generate:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

/* AI Result */
.ce-ai-result {
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px; overflow: hidden;
  background: rgba(16, 185, 129, 0.03);
}
.ce-ai-result-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px; background: rgba(16, 185, 129, 0.06);
  font-size: 12px; font-weight: 600; color: var(--color-text-secondary);
}
.ce-ai-result-actions { display: flex; gap: 4px; }
.ce-ai-result-btn {
  padding: 3px 8px; border-radius: 4px; border: none;
  background: rgba(255,255,255,0.06); color: var(--color-text-secondary);
  font-size: 11px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 3px;
  transition: all 0.2s;
}
.ce-ai-result-btn:hover { background: rgba(255,255,255,0.12); }
.ce-ai-result-btn--insert { color: #34d399; }
.ce-ai-result-btn--insert:hover { background: rgba(16, 185, 129, 0.15); }
.ce-ai-result-btn--replace { color: #60a5fa; }
.ce-ai-result-btn--replace:hover { background: rgba(59, 130, 246, 0.15); }

.ce-ai-result-content {
  padding: 10px; font-size: 12px; line-height: 1.7;
  color: var(--color-text-secondary);
  max-height: 300px; overflow-y: auto;
}
.ce-ai-result-content :deep(h1),
.ce-ai-result-content :deep(h2),
.ce-ai-result-content :deep(h3) {
  color: var(--color-text-primary); margin: 8px 0 4px;
}
.ce-ai-result-content :deep(h1) { font-size: 16px; }
.ce-ai-result-content :deep(h2) { font-size: 14px; }
.ce-ai-result-content :deep(h3) { font-size: 13px; }
.ce-ai-result-content :deep(strong) { color: var(--color-text-primary); }
.ce-ai-result-content :deep(ul) { padding-left: 16px; }
.ce-ai-result-content :deep(li) { margin-bottom: 2px; }

@keyframes aiFadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .content-editor__body { grid-template-columns: 1fr; }
  .ce-ai-actions { flex-direction: column; }
  .ce-ai-options { flex-direction: column; }
}
</style>
