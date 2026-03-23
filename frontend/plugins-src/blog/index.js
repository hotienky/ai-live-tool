// Blog Plugin — Entry Point
// Registers: PostList (blog-posts + blog-categories), CommentManager (blog-comments), BlogSettings (blog-settings)
import { ref, reactive, onMounted, h, openBlock, createElementBlock, createElementVNode, toDisplayString, createVNode, unref, withDirectives, vModelText, vModelSelect, createTextVNode, createCommentVNode, createBlock, Fragment, renderList, normalizeClass } from 'vue'
import { PenSquare, Plus, Search, Loader2, FileText, Pencil, Trash2, Star, Check, ShieldAlert, MessageCircle, Settings, Save, Clock, FolderOpen } from 'lucide-vue-next'
import PostEditor from './PostEditor.js'

const B = window.__APP_BRIDGE__ || {}
const apiFetch = B.apiFetch || (async () => {})
const showToast = B.showToast || (() => {})
const t = B.t || ((k, v) => v)

// ════════════════════════════════════
// PostList — Blog Posts list + editor
// ════════════════════════════════════
const PostList = {
  name: 'PostList',
  setup() {
    const posts = ref([])
    const total = ref(0)
    const loading = ref(false)
    const page = ref(1)
    const lastPage = ref(1)
    const search = ref('')
    const statusFilter = ref('')
    const catFilter = ref('')
    const cats = ref([])
    const editId = ref(null)
    let debounce = null

    function onSearch() { clearTimeout(debounce); debounce = setTimeout(() => { page.value = 1; load() }, 300) }

    async function load() {
      loading.value = true
      try {
        const q = new URLSearchParams({ page: page.value, per_page: 20 })
        if (search.value) q.set('search', search.value)
        if (statusFilter.value) q.set('status', statusFilter.value)
        if (catFilter.value) { q.set('taxonomy', 'category'); q.set('term', catFilter.value) }
        const data = await (await apiFetch(`/content/post?${q}`)).json()
        const d = data.data || data
        posts.value = d.data || d; total.value = d.total || posts.value.length; lastPage.value = d.last_page || 1
        const cs = new Set()
        for (const p of posts.value) for (const tx of p.taxonomies || []) if (tx.taxonomy === 'category') cs.add(tx.term)
        cats.value = [...cs].sort()
      } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
      finally { loading.value = false }
    }

    function onSaved() { editId.value = null; load() }
    function getCats(p) { return (p.taxonomies || []).filter(t => t.taxonomy === 'category') }
    function statusLabel(s) { return { draft: 'Nháp', published: 'Đã xuất bản', archived: 'Lưu trữ' }[s] || s }
    function fmtDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' }
    async function del(p) {
      if (!confirm(`Xoá "${p.title}"?`)) return
      try { const r = await apiFetch(`/content/post/${p.id}`, { method: 'DELETE' }); if (r.ok) { showToast('Đã xoá', 'success'); load() } } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
    }

    onMounted(load)
    return { posts, total, loading, page, lastPage, search, statusFilter, catFilter, cats, editId, onSearch, load, onSaved, getCats, statusLabel, fmtDate, del }
  },
  render() {
    const s = this
    if (s.editId !== null) return h(PostEditor, { editId: s.editId, onBack: () => s.editId = null, onSaved: s.onSaved })

    return h('div', { class: 'post-list' }, [
      // Header
      h('div', { class: 'post-list__header' }, [
        h('div', { class: 'post-list__header-left' }, [
          h(PenSquare, { size: 22, class: 'post-list__icon' }),
          h('h2', { class: 'post-list__title' }, `Bài viết (${s.total})`)
        ]),
        h('button', { class: 'post-list__create-btn', onClick: () => s.editId = '' }, [h(Plus, { size: 16 }), ' Viết bài mới'])
      ]),
      // Filters
      h('div', { class: 'post-list__filters' }, [
        h('div', { class: 'post-list__search-wrap' }, [
          h(Search, { size: 16, class: 'post-list__search-icon' }),
          h('input', { class: 'post-list__search', type: 'text', placeholder: 'Tìm bài viết...', value: s.search, onInput: e => { s.search = e.target.value; s.onSearch() } })
        ]),
        h('select', { class: 'post-list__select', value: s.statusFilter, onChange: e => { s.statusFilter = e.target.value; s.load() } }, [
          h('option', { value: '' }, 'Tất cả'), h('option', { value: 'draft' }, 'Nháp'), h('option', { value: 'published' }, 'Đã xuất bản'), h('option', { value: 'archived' }, 'Lưu trữ')
        ]),
        h('select', { class: 'post-list__select', value: s.catFilter, onChange: e => { s.catFilter = e.target.value; s.load() } }, [
          h('option', { value: '' }, 'Tất cả danh mục'),
          ...s.cats.map(c => h('option', { value: c, key: c }, c))
        ])
      ]),
      // Content
      s.loading ? h('div', { class: 'post-list__loading' }, [h(Loader2, { size: 24, class: 'spin' }), ' Đang tải...'])
      : s.posts.length === 0 ? h('div', { class: 'post-list__empty' }, [h(FileText, { size: 48 }), h('p', null, 'Chưa có bài viết nào'), h('button', { class: 'post-list__create-btn', onClick: () => s.editId = '' }, [h(Plus, { size: 16 }), ' Viết bài đầu tiên'])])
      : h('div', { class: 'post-list__table-wrap' }, [
          h('table', { class: 'post-list__table' }, [
            h('thead', null, [h('tr', null, [
              h('th', { class: 'post-list__th', style: 'width:40%' }, 'Tiêu đề'),
              h('th', { class: 'post-list__th' }, 'Danh mục'),
              h('th', { class: 'post-list__th' }, 'Trạng thái'),
              h('th', { class: 'post-list__th' }, 'Ngày'),
              h('th', { class: 'post-list__th', style: 'width:100px;text-align:center' }, 'Thao tác')
            ])]),
            h('tbody', null, s.posts.map(p =>
              h('tr', { key: p.id, class: 'post-list__row' }, [
                h('td', { class: 'post-list__td' }, [
                  h('div', { class: 'post-list__item-title', onClick: () => s.editId = p.id }, [
                    p.meta?.is_featured ? h(Star, { size: 14, class: 'post-list__featured' }) : null,
                    ' ' + p.title
                  ]),
                  p.excerpt ? h('div', { class: 'post-list__excerpt' }, p.excerpt) : null
                ]),
                h('td', { class: 'post-list__td' }, s.getCats(p).map(c => h('span', { key: c.id, class: 'post-list__cat-badge' }, c.term)).concat(s.getCats(p).length ? [] : [h('span', { class: 'post-list__no-cat' }, '—')])),
                h('td', { class: 'post-list__td' }, [h('span', { class: `post-list__status post-list__status--${p.status}` }, s.statusLabel(p.status))]),
                h('td', { class: 'post-list__td post-list__td--date' }, s.fmtDate(p.published_at || p.created_at)),
                h('td', { class: 'post-list__td', style: 'text-align:center' }, [
                  h('button', { class: 'post-list__action', onClick: () => s.editId = p.id, title: 'Sửa' }, [h(Pencil, { size: 14 })]),
                  h('button', { class: 'post-list__action post-list__action--danger', onClick: () => s.del(p), title: 'Xoá' }, [h(Trash2, { size: 14 })])
                ])
              ])
            ))
          ])
        ]),
      // Pagination
      s.lastPage > 1 ? h('div', { class: 'post-list__pagination' }, Array.from({ length: s.lastPage }, (_, i) => i + 1).map(pg =>
        h('button', { key: pg, class: ['post-list__page-btn', pg === s.page ? 'post-list__page-btn--active' : ''], onClick: () => { s.page = pg; s.load() } }, pg)
      )) : null
    ])
  }
}

// ════════════════════════════════════
// CommentManager
// ════════════════════════════════════
const CommentManager = {
  name: 'CommentManager',
  setup() {
    const comments = ref([]); const total = ref(0); const loading = ref(false); const page = ref(1); const lastPage = ref(1); const status = ref('')
    const counts = reactive({ pending: 0, approved: 0, spam: 0 })

    async function load() {
      loading.value = true
      try {
        const q = new URLSearchParams({ page: page.value, per_page: 20 }); if (status.value) q.set('status', status.value)
        const d = await (await apiFetch(`/comments?${q}`)).json(); const r = d.data || d
        comments.value = r.data || r; total.value = r.total || comments.value.length; lastPage.value = r.last_page || 1
      } catch { showToast('Lỗi tải bình luận', 'error') } finally { loading.value = false }
    }
    async function loadCounts() { try { for (const s of ['pending', 'approved', 'spam']) { const d = await (await apiFetch(`/comments?status=${s}&per_page=1`)).json(); counts[s] = d?.data?.total || 0 } } catch {} }
    async function approve(id) { try { await apiFetch(`/comments/${id}/approve`, { method: 'POST' }); showToast('Đã duyệt', 'success'); load(); loadCounts() } catch { showToast('Lỗi', 'error') } }
    async function spam(id) { try { await apiFetch(`/comments/${id}/spam`, { method: 'POST' }); showToast('Đã đánh dấu spam', 'success'); load(); loadCounts() } catch { showToast('Lỗi', 'error') } }
    async function del(id) { if (!confirm('Xoá bình luận?')) return; try { await apiFetch(`/comments/${id}`, { method: 'DELETE' }); showToast('Đã xoá', 'success'); load(); loadCounts() } catch { showToast('Lỗi', 'error') } }
    function fmtDate(d) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }
    function statusLabel(s) { return { pending: 'Chờ duyệt', approved: 'Đã duyệt', spam: 'Spam' }[s] || s }

    onMounted(() => { load(); loadCounts() })
    return { comments, total, loading, page, lastPage, status, counts, load, approve, spam, del, fmtDate, statusLabel }
  },
  render() {
    const s = this
    return h('div', { class: 'comment-mgr' }, [
      h('div', { class: 'comment-mgr__header' }, [
        h(MessageCircle, { size: 22, class: 'comment-mgr__icon' }),
        h('h2', { class: 'comment-mgr__title' }, `Bình luận (${s.total})`),
        h('div', { class: 'comment-mgr__badge-row' }, [
          h('span', { class: 'comment-mgr__badge comment-mgr__badge--pending', onClick: () => { s.status = 'pending'; s.load() } }, `${s.counts.pending} chờ duyệt`),
          h('span', { class: 'comment-mgr__badge comment-mgr__badge--approved', onClick: () => { s.status = 'approved'; s.load() } }, `${s.counts.approved} đã duyệt`),
          h('span', { class: 'comment-mgr__badge comment-mgr__badge--spam', onClick: () => { s.status = 'spam'; s.load() } }, `${s.counts.spam} spam`),
          h('span', { class: 'comment-mgr__badge', onClick: () => { s.status = ''; s.load() } }, 'Tất cả')
        ])
      ]),
      s.loading ? h('div', { class: 'comment-mgr__loading' }, [h(Loader2, { size: 20, class: 'spin' }), ' Đang tải...'])
      : s.comments.length === 0 ? h('div', { class: 'comment-mgr__empty' }, [h(MessageCircle, { size: 48 }), h('p', null, 'Chưa có bình luận nào')])
      : h('div', { class: 'comment-mgr__list' }, s.comments.map(c =>
          h('div', { key: c.id, class: `comment-mgr__item comment-mgr__item--${c.status}` }, [
            h('div', { class: 'comment-mgr__item-header' }, [
              h('span', { class: 'comment-mgr__author' }, c.author_name),
              c.author_email ? h('span', { class: 'comment-mgr__email' }, c.author_email) : null,
              h('span', { class: 'comment-mgr__date' }, s.fmtDate(c.created_at)),
              h('span', { class: `comment-mgr__status comment-mgr__status--${c.status}` }, s.statusLabel(c.status))
            ]),
            c.content ? h('div', { class: 'comment-mgr__post-ref' }, ['Trên: ', h('strong', null, c.content.title)]) : null,
            h('p', { class: 'comment-mgr__body' }, c.body),
            h('div', { class: 'comment-mgr__actions' }, [
              c.status !== 'approved' ? h('button', { class: 'comment-mgr__btn comment-mgr__btn--approve', onClick: () => s.approve(c.id) }, [h(Check, { size: 14 }), ' Duyệt']) : null,
              c.status !== 'spam' ? h('button', { class: 'comment-mgr__btn comment-mgr__btn--spam', onClick: () => s.spam(c.id) }, [h(ShieldAlert, { size: 14 }), ' Spam']) : null,
              h('button', { class: 'comment-mgr__btn comment-mgr__btn--delete', onClick: () => s.del(c.id) }, [h(Trash2, { size: 14 }), ' Xoá'])
            ])
          ])
        ))
    ])
  }
}

// ════════════════════════════════════
// BlogSettings
// ════════════════════════════════════
const BlogSettings = {
  name: 'BlogSettings',
  setup() {
    const saving = ref(false)
    const cfg = reactive({
      posts_per_page: 12, show_reading_time: true, show_author: true, show_featured_image: true,
      comments_enabled: true, comments_moderation: true, nested_comments: true,
      rss_enabled: true, auto_sitemap: true, og_tags: true
    })
    async function loadCfg() {
      try {
        const d = await (await apiFetch('/system-config?group=blog')).json(); const items = d.data || d
        if (Array.isArray(items)) for (const i of items) if (i.key && cfg.hasOwnProperty(i.key)) cfg[i.key] = i.value === 'true' ? true : i.value === 'false' ? false : isNaN(i.value) ? i.value : Number(i.value)
      } catch {}
    }
    async function saveCfg() {
      saving.value = true
      try {
        for (const [k, v] of Object.entries(cfg)) await apiFetch('/system-config', { method: 'POST', body: JSON.stringify({ group: 'blog', key: k, value: String(v) }) })
        showToast('Đã lưu cài đặt blog', 'success')
      } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
      finally { saving.value = false }
    }
    onMounted(loadCfg)
    return { saving, cfg, saveCfg }
  },
  render() {
    const s = this
    const checkbox = (label, key) => h('div', { class: 'blog-settings__field' }, [
      h('label', { class: 'blog-settings__check' }, [
        h('input', { type: 'checkbox', checked: s.cfg[key], onChange: e => s.cfg[key] = e.target.checked }), ` ${label}`
      ])
    ])
    return h('div', { class: 'blog-settings' }, [
      h('div', { class: 'blog-settings__header' }, [h(Settings, { size: 22, class: 'blog-settings__icon' }), h('h2', { class: 'blog-settings__title' }, 'Cài đặt Blog')]),
      h('div', { class: 'blog-settings__grid' }, [
        h('div', { class: 'blog-settings__card' }, [
          h('h3', { class: 'blog-settings__card-title' }, 'Chung'),
          h('div', { class: 'blog-settings__field' }, [h('label', null, 'Số bài mỗi trang'), h('input', { class: 'blog-settings__input', type: 'number', min: 1, max: 50, value: s.cfg.posts_per_page, onInput: e => s.cfg.posts_per_page = Number(e.target.value) })]),
          checkbox('Hiển thị thời gian đọc', 'show_reading_time'),
          checkbox('Hiển thị tác giả', 'show_author'),
          checkbox('Hiển thị ảnh đại diện', 'show_featured_image')
        ]),
        h('div', { class: 'blog-settings__card' }, [
          h('h3', { class: 'blog-settings__card-title' }, 'Bình luận'),
          checkbox('Cho phép bình luận', 'comments_enabled'),
          checkbox('Duyệt bình luận trước', 'comments_moderation'),
          checkbox('Cho phép trả lời (nested)', 'nested_comments')
        ]),
        h('div', { class: 'blog-settings__card' }, [
          h('h3', { class: 'blog-settings__card-title' }, 'RSS & SEO'),
          checkbox('Bật RSS Feed', 'rss_enabled'),
          checkbox('Tự động thêm vào sitemap', 'auto_sitemap'),
          checkbox('Open Graph meta tags', 'og_tags')
        ])
      ]),
      h('div', { class: 'blog-settings__actions' }, [
        h('button', { class: 'blog-settings__btn', onClick: s.saveCfg, disabled: s.saving }, [
          s.saving ? h(Loader2, { size: 14, class: 'spin' }) : h(Save, { size: 14 }),
          s.saving ? ' Đang lưu...' : ' Lưu cài đặt'
        ])
      ])
    ])
  }
}

// ════════════════════════════════════
// Plugin Registration
// ════════════════════════════════════
const MODULE_ID = 'blog'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__

if (hooks) {
  hooks.addFilter('sidebar_items', items => {
    items.push({ key: 'blog/posts', label: t('admin.blog', 'Blog'), icon: PenSquare, featureGroup: 'blog', moduleId: 'blog' })
    return items
  }, 15)
  hooks.addFilter('admin_routes', routes => {
    Object.assign(routes.routeToTab, { 'blog/posts': 'blog-posts', 'blog/categories': 'blog-categories', 'blog/comments': 'blog-comments', 'blog/settings': 'blog-settings' })
    return routes
  })
}

if (bridge?.registerPlugin) {
  bridge.registerPlugin(MODULE_ID, {
    components: {
      'blog-posts': PostList,
      'blog-categories': PostList,
      'blog-comments': CommentManager,
      'blog-settings': BlogSettings,
    },
    tabs: [
      { key: 'blog-posts', label: t('admin.posts', 'Bài viết'), icon: 'FileText' },
      { key: 'blog-categories', label: t('admin.categories', 'Danh mục'), icon: 'FolderOpen' },
      { key: 'blog-comments', label: t('admin.comments', 'Bình luận'), icon: 'MessageCircle' },
      { key: 'blog-settings', label: t('admin.settings', 'Cài đặt'), icon: 'Settings' },
    ]
  })
}

console.log('[Plugin:blog] Blog module loaded ✅ (with RichTextEditor + AI)')
