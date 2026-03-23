// Blog Plugin — PostEditor with RichTextEditor + AI Assistant
import { ref, reactive, onMounted, openBlock, createElementBlock, createElementVNode, createVNode, unref, withDirectives, vModelText, vModelSelect, toDisplayString, createTextVNode, createCommentVNode, createBlock, Fragment, renderList, withModifiers, withKeys, normalizeClass, h } from 'vue'
import { ChevronLeft, Save, Clock, Loader2, Sparkles, Wand2, FileText, List, Search, AlignLeft, ChevronDown, Plus, Type } from 'lucide-vue-next'

const B = window.__APP_BRIDGE__ || {}
const apiFetch = B.apiFetch || (async () => {})
const showToast = B.showToast || (() => {})
const RichTextEditor = B.components?.RichTextEditor || null
const MediaPicker = B.components?.MediaPicker || null

export default {
  name: 'PostEditor',
  props: {
    editId: { type: [Number, String], default: null }
  },
  emits: ['back', 'saved'],
  setup(props, { emit }) {
    const form = reactive({
      title: '', slug: '', body: '', excerpt: '', featured_image: '',
      status: 'draft', published_at: '',
      meta: { seo_title: '', seo_description: '', reading_time: null, is_featured: false },
      taxonomies: { category: [], tag: [] }
    })
    const saving = ref(false)
    const revisions = ref([])
    const newCat = ref('')
    const newTagVal = ref('')
    // AI state
    const showAi = ref(true)
    const aiPrompt = ref('')
    const aiTone = ref('professional')
    const aiLoading = ref(false)
    const aiResult = ref('')

    function autoSlug() {
      if (!form.slug && form.title) {
        form.slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      }
      if (form.body && !form.meta.reading_time) {
        form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
      }
    }

    function addTax(type, val) {
      val = (val || '').trim()
      if (!val) return
      if (!form.taxonomies[type]) form.taxonomies[type] = []
      if (!form.taxonomies[type].includes(val)) form.taxonomies[type].push(val)
    }
    function removeTax(type, idx) { form.taxonomies[type]?.splice(idx, 1) }
    function formatDate(d) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }

    async function loadContent() {
      if (!props.editId) return
      try {
        const data = await (await apiFetch(`/content/post/${props.editId}`)).json()
        const item = data.data || data
        form.title = item.title || ''; form.slug = item.slug || ''
        form.body = item.body || ''; form.excerpt = item.excerpt || ''
        form.featured_image = item.featured_image || ''
        form.status = item.status || 'draft'
        form.published_at = item.published_at ? item.published_at.slice(0, 16) : ''
        form.meta = { seo_title: '', seo_description: '', reading_time: null, is_featured: false, ...item.meta || {} }
        if (item.taxonomies) {
          const m = { category: [], tag: [] }
          for (const t of item.taxonomies) { if (!m[t.taxonomy]) m[t.taxonomy] = []; m[t.taxonomy].push(t.term) }
          form.taxonomies = m
        }
        revisions.value = item.revisions || []
      } catch { showToast('Lỗi tải bài viết', 'error') }
    }

    async function save() {
      if (!form.title.trim()) return showToast('Vui lòng nhập tiêu đề', 'warning')
      if (!form.excerpt && form.body) form.excerpt = form.body.replace(/<[^>]*>/g, '').substring(0, 160)
      if (form.body) form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
      saving.value = true
      try {
        const method = props.editId ? 'PUT' : 'POST'
        const url = props.editId ? `/content/post/${props.editId}` : '/content/post'
        const res = await apiFetch(url, { method, body: JSON.stringify(form) })
        const data = await res.json()
        if (res.ok) { showToast(data.message || 'Đã lưu', 'success'); emit('saved', data.data || data) }
        else showToast(data.message || 'Lỗi lưu', 'error')
      } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
      finally { saving.value = false }
    }

    // AI Functions
    async function aiGenerate(type) {
      let prompt = aiPrompt.value.trim()
      aiLoading.value = true
      try {
        let body = {}
        if (type === 'blog') {
          if (!prompt && !form.title) { showToast('Vui lòng nhập tiêu đề hoặc mô tả chủ đề', 'warning'); aiLoading.value = false; return }
          body = { prompt: prompt || form.title, type: 'blog', tone: aiTone.value }
        } else if (type === 'outline') {
          body = { prompt: `Tạo dàn bài chi tiết cho: "${prompt || form.title}"`, type: 'general', max_tokens: 1000, system: 'Tạo dàn bài rõ ràng với heading, subheading.' }
        } else if (type === 'title') {
          body = { prompt: `Gợi ý 5 tiêu đề hấp dẫn cho: "${prompt || form.title}"`, type: 'general', max_tokens: 500 }
        } else if (type === 'seo') {
          body = { prompt: form.title || prompt, type: 'seo', title: form.title, content: (form.body || '').substring(0, 2000) }
        } else if (type === 'excerpt') {
          if (!form.body) { showToast('Cần có nội dung trước', 'warning'); aiLoading.value = false; return }
          body = { prompt: `Tóm tắt 2-3 câu: ${form.body.substring(0, 3000)}`, type: 'general', max_tokens: 300 }
        }
        const res = await apiFetch('/ai/generate', { method: 'POST', body: JSON.stringify(body) })
        const data = await res.json()
        if (data.success) {
          const content = data.data?.content || data.data?.text || ''
          if (type === 'excerpt') { form.excerpt = content.replace(/<[^>]*>/g, '').trim(); showToast('Đã tạo tóm tắt', 'success') }
          else { aiResult.value = content; showToast('AI đã tạo nội dung', 'success') }
        } else showToast(data.message || 'AI không khả dụng', 'error')
      } catch (e) { showToast('Lỗi AI: ' + e.message, 'error') }
      finally { aiLoading.value = false }
    }

    function insertAi() { if (aiResult.value) { form.body = (form.body || '') + '\n' + aiResult.value; showToast('Đã chèn', 'success') } }
    function replaceAi() { if (aiResult.value) { form.body = aiResult.value; showToast('Đã thay thế', 'success') } }

    onMounted(loadContent)

    return { form, saving, revisions, newCat, newTagVal, showAi, aiPrompt, aiTone, aiLoading, aiResult,
      autoSlug, addTax, removeTax, formatDate, save, aiGenerate, insertAi, replaceAi }
  },
  render() {
    const s = this
    return h('div', { class: 'post-editor' }, [
      // Header
      h('div', { class: 'post-editor__header' }, [
        h('button', { class: 'post-editor__back', onClick: () => s.$emit('back') }, [
          h(ChevronLeft, { size: 16 }), ' Quay lại'
        ]),
        h('h2', { class: 'post-editor__title' }, s.editId ? 'Chỉnh sửa bài viết' : 'Viết bài mới')
      ]),
      // Body
      h('div', { class: 'post-editor__body' }, [
        // Main
        h('div', { class: 'post-editor__main' }, [
          // Title
          h('div', { class: 'post-editor__field' }, [
            h('label', { class: 'post-editor__label' }, 'Tiêu đề *'),
            h('input', { class: 'post-editor__input post-editor__input--title', type: 'text', value: s.form.title, placeholder: 'Tiêu đề bài viết...', onInput: e => s.form.title = e.target.value, onBlur: s.autoSlug })
          ]),
          // Slug
          h('div', { class: 'post-editor__field post-editor__slug-row' }, [
            h('label', { class: 'post-editor__label' }, 'Slug'),
            h('div', { class: 'post-editor__slug-input' }, [
              h('span', { class: 'post-editor__slug-prefix' }, '/blog/'),
              h('input', { class: 'post-editor__input', type: 'text', value: s.form.slug, placeholder: 'auto-generated', onInput: e => s.form.slug = e.target.value })
            ])
          ]),
          // Content — RichTextEditor or fallback textarea
          h('div', { class: 'post-editor__field' }, [
            h('label', { class: 'post-editor__label' }, 'Nội dung'),
            RichTextEditor
              ? h(RichTextEditor, { modelValue: s.form.body, 'onUpdate:modelValue': v => s.form.body = v, placeholder: 'Viết nội dung bài viết...' })
              : h('textarea', { class: 'post-editor__textarea', rows: 18, value: s.form.body, placeholder: 'Viết nội dung bài viết...', onInput: e => s.form.body = e.target.value })
          ]),
          // Excerpt
          h('div', { class: 'post-editor__field' }, [
            h('label', { class: 'post-editor__label' }, 'Tóm tắt'),
            h('textarea', { class: 'post-editor__textarea post-editor__textarea--sm', rows: 3, value: s.form.excerpt, placeholder: 'Tóm tắt ngắn...', onInput: e => s.form.excerpt = e.target.value })
          ]),
          // SEO section
          h('div', { class: 'post-editor__meta-section' }, [
            h('h3', { class: 'post-editor__section-title' }, 'SEO & Tuỳ chỉnh'),
            h('div', { class: 'post-editor__field' }, [
              h('label', { class: 'post-editor__label' }, 'SEO Title'),
              h('input', { class: 'post-editor__input', type: 'text', value: s.form.meta.seo_title, placeholder: 'Tiêu đề SEO...', onInput: e => s.form.meta.seo_title = e.target.value })
            ]),
            h('div', { class: 'post-editor__field' }, [
              h('label', { class: 'post-editor__label' }, 'Meta Description'),
              h('textarea', { class: 'post-editor__textarea post-editor__textarea--sm', rows: 2, value: s.form.meta.seo_description, placeholder: 'Mô tả meta...', onInput: e => s.form.meta.seo_description = e.target.value })
            ]),
            h('div', { class: 'post-editor__field post-editor__checkbox-field' }, [
              h('label', null, [
                h('input', { type: 'checkbox', checked: s.form.meta.is_featured, onChange: e => s.form.meta.is_featured = e.target.checked }),
                ' Bài viết nổi bật'
              ])
            ])
          ])
        ]),
        // Sidebar
        h('div', { class: 'post-editor__sidebar' }, [
          // AI Assistant Card
          h('div', { class: 'post-editor__card post-editor__ai-card' }, [
            h('div', { class: 'post-editor__ai-header', onClick: () => s.showAi = !s.showAi }, [
              h('h4', { class: 'post-editor__card-title post-editor__ai-title' }, [h(Sparkles, { size: 14 }), ' AI Assistant']),
              h(ChevronDown, { size: 14, class: s.showAi ? 'post-editor__ai-chevron open' : 'post-editor__ai-chevron' })
            ]),
            s.showAi ? h('div', { class: 'post-editor__ai-body' }, [
              // Quick actions
              h('div', { class: 'post-editor__ai-actions' }, [
                h('button', { class: 'post-editor__ai-btn', disabled: s.aiLoading, onClick: () => s.aiGenerate('blog') }, [h(FileText, { size: 12 }), ' Viết bài']),
                h('button', { class: 'post-editor__ai-btn', disabled: s.aiLoading, onClick: () => s.aiGenerate('outline') }, [h(List, { size: 12 }), ' Dàn bài']),
                h('button', { class: 'post-editor__ai-btn', disabled: s.aiLoading, onClick: () => s.aiGenerate('title') }, [h(Type, { size: 12 }), ' Gợi ý tiêu đề']),
                h('button', { class: 'post-editor__ai-btn', disabled: s.aiLoading, onClick: () => s.aiGenerate('seo') }, [h(Search, { size: 12 }), ' SEO']),
                h('button', { class: 'post-editor__ai-btn', disabled: s.aiLoading, onClick: () => s.aiGenerate('excerpt') }, [h(AlignLeft, { size: 12 }), ' Tóm tắt'])
              ]),
              // Prompt
              h('textarea', { class: 'post-editor__ai-input', rows: 3, value: s.aiPrompt, placeholder: 'Mô tả chủ đề hoặc yêu cầu cụ thể...', onInput: e => s.aiPrompt = e.target.value }),
              h('div', { class: 'post-editor__ai-opts' }, [
                h('select', { class: 'post-editor__ai-select', value: s.aiTone, onChange: e => s.aiTone = e.target.value }, [
                  h('option', { value: 'professional' }, 'Chuyên nghiệp'),
                  h('option', { value: 'casual' }, 'Thân thiện'),
                  h('option', { value: 'creative' }, 'Sáng tạo')
                ]),
                h('button', { class: 'post-editor__ai-gen', disabled: s.aiLoading, onClick: () => s.aiGenerate('blog') }, [
                  s.aiLoading ? h(Loader2, { size: 14, class: 'spin' }) : h(Wand2, { size: 14 }),
                  s.aiLoading ? ' Đang tạo...' : ' Tạo nội dung'
                ])
              ]),
              // Result
              s.aiResult ? h('div', { class: 'post-editor__ai-result' }, [
                h('div', { class: 'post-editor__ai-result-hdr' }, [
                  h('span', null, '📝 Kết quả'),
                  h('div', { class: 'post-editor__ai-result-acts' }, [
                    h('button', { onClick: s.insertAi, class: 'post-editor__ai-rb post-editor__ai-rb--ins' }, '+ Chèn'),
                    h('button', { onClick: s.replaceAi, class: 'post-editor__ai-rb post-editor__ai-rb--rep' }, '↻ Thay thế'),
                    h('button', { onClick: () => s.aiResult = '', class: 'post-editor__ai-rb' }, '✕')
                  ])
                ]),
                h('div', { class: 'post-editor__ai-result-body', innerHTML: s.aiResult.replace(/\n/g, '<br>') })
              ]) : null
            ]) : null
          ]),
          // Publish
          h('div', { class: 'post-editor__card' }, [
            h('h4', { class: 'post-editor__card-title' }, 'Xuất bản'),
            h('div', { class: 'post-editor__field' }, [
              h('select', { class: 'post-editor__select', value: s.form.status, onChange: e => s.form.status = e.target.value }, [
                h('option', { value: 'draft' }, 'Nháp'),
                h('option', { value: 'published' }, 'Xuất bản'),
                h('option', { value: 'archived' }, 'Lưu trữ')
              ])
            ]),
            s.form.status === 'published' ? h('div', { class: 'post-editor__field' }, [
              h('label', { class: 'post-editor__label' }, 'Ngày xuất bản'),
              h('input', { class: 'post-editor__input', type: 'datetime-local', value: s.form.published_at, onInput: e => s.form.published_at = e.target.value })
            ]) : null
          ]),
          // Featured image
          h('div', { class: 'post-editor__card' }, [
            h('h4', { class: 'post-editor__card-title' }, 'Ảnh đại diện'),
            s.form.featured_image ? h('div', { class: 'post-editor__img-preview' }, [
              h('img', { src: s.form.featured_image }), h('button', { class: 'post-editor__img-remove', onClick: () => s.form.featured_image = '' }, '✕')
            ]) : null,
            MediaPicker
              ? h(MediaPicker, { modelValue: s.form.featured_image, 'onUpdate:modelValue': v => s.form.featured_image = v, accept: 'image/*' })
              : h('input', { class: 'post-editor__input', type: 'text', value: s.form.featured_image, placeholder: 'URL ảnh', onInput: e => s.form.featured_image = e.target.value })
          ]),
          // Categories
          h('div', { class: 'post-editor__card' }, [
            h('h4', { class: 'post-editor__card-title' }, 'Danh mục'),
            h('div', { class: 'post-editor__tags' }, (s.form.taxonomies.category || []).map((t, i) =>
              h('span', { class: 'post-editor__tag', key: i }, [t, ' ', h('button', { class: 'post-editor__tag-x', onClick: () => s.removeTax('category', i) }, '✕')])
            )),
            h('div', { class: 'post-editor__tag-input' }, [
              h('input', { class: 'post-editor__input', type: 'text', value: s.newCat, placeholder: 'Thêm danh mục...', onInput: e => s.newCat = e.target.value, onKeydown: e => { if (e.key === 'Enter') { e.preventDefault(); s.addTax('category', s.newCat); s.newCat = '' } } }),
              h('button', { class: 'post-editor__tag-add', onClick: () => { s.addTax('category', s.newCat); s.newCat = '' } }, '+')
            ])
          ]),
          // Tags
          h('div', { class: 'post-editor__card' }, [
            h('h4', { class: 'post-editor__card-title' }, 'Thẻ'),
            h('div', { class: 'post-editor__tags' }, (s.form.taxonomies.tag || []).map((t, i) =>
              h('span', { class: 'post-editor__tag post-editor__tag--tag', key: i }, [t, ' ', h('button', { class: 'post-editor__tag-x', onClick: () => s.removeTax('tag', i) }, '✕')])
            )),
            h('div', { class: 'post-editor__tag-input' }, [
              h('input', { class: 'post-editor__input', type: 'text', value: s.newTagVal, placeholder: 'Thêm thẻ...', onInput: e => s.newTagVal = e.target.value, onKeydown: e => { if (e.key === 'Enter') { e.preventDefault(); s.addTax('tag', s.newTagVal); s.newTagVal = '' } } }),
              h('button', { class: 'post-editor__tag-add', onClick: () => { s.addTax('tag', s.newTagVal); s.newTagVal = '' } }, '+')
            ])
          ]),
          // Revisions
          s.revisions.length ? h('div', { class: 'post-editor__card' }, [
            h('h4', { class: 'post-editor__card-title' }, `Lịch sử (${s.revisions.length})`),
            h('ul', { class: 'post-editor__revisions' }, s.revisions.slice(0, 5).map(r =>
              h('li', { key: r.id }, [h(Clock, { size: 12 }), ' ', s.formatDate(r.created_at)])
            ))
          ]) : null
        ])
      ]),
      // Actions
      h('div', { class: 'post-editor__actions' }, [
        h('button', { class: 'post-editor__btn post-editor__btn--sec', onClick: () => s.$emit('back') }, 'Huỷ'),
        h('button', { class: 'post-editor__btn post-editor__btn--pri', onClick: s.save, disabled: s.saving }, [
          s.saving ? h(Loader2, { size: 14, class: 'spin' }) : h(Save, { size: 14 }),
          s.saving ? ' Đang lưu...' : ' Lưu bài viết'
        ])
      ])
    ])
  }
}
