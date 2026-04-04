<template>
  <div class="post-list">
    <!-- Editor mode -->
    <PostEditor
      v-if="editing !== null"
      :editId="editing"
      @back="editing = null"
      @saved="onSaved"
    />

    <!-- List mode -->
    <template v-else>
      <div class="post-list__header">
        <div class="post-list__header-left">
          <PenSquare :size="22" class="post-list__icon" />
          <h2 class="post-list__title">{{ t('admin.msg_posts', 'Bài viết') }} ({{ total }})</h2>
        </div>
        <button class="post-list__create-btn" @click="editing = ''">
          <Plus :size="16" /> {{ t('admin.msg_create_post', 'Viết bài mới') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="post-list__filters">
        <div class="post-list__search-wrap">
          <Search :size="16" class="post-list__search-icon" />
          <input v-model="search" type="text" :placeholder="t('admin.msg_search_posts', 'Tìm bài viết...')" class="post-list__search" @input="debouncedLoad" />
        </div>
        <select v-model="statusFilter" class="post-list__select" @change="loadPosts">
          <option value="">{{ t('admin.msg_all', 'Tất cả') }}</option>
          <option value="draft">{{ t('admin.msg_draft_label', 'Nháp') }}</option>
          <option value="published">{{ t('admin.msg_published_label', 'Đã xuất bản') }}</option>
          <option value="archived">{{ t('admin.msg_archived', 'Lưu trữ') }}</option>
        </select>
        <select v-model="categoryFilter" class="post-list__select" @change="loadPosts">
          <option value="">{{ t('admin.msg_all_categories', 'Tất cả danh mục') }}</option>
          <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="post-list__loading">
        <Loader2 :size="24" class="spin" /> {{ t('admin.msg_loading', 'Đang tải...') }}
      </div>

      <!-- Empty -->
      <div v-else-if="items.length === 0" class="post-list__empty">
        <FileText :size="48" />
        <p>{{ t('admin.msg_no_posts', 'Chưa có bài viết nào') }}</p>
        <button class="post-list__create-btn" @click="editing = ''">
          <Plus :size="16" /> {{ t('admin.msg_write_first_post', 'Viết bài đầu tiên') }}
        </button>
      </div>

      <!-- Table -->
      <div v-else class="post-list__table-wrap">
        <table class="post-list__table">
          <thead>
            <tr>
              <th class="post-list__th" style="width:40%">{{ t('admin.msg_title', 'Tiêu đề') }}</th>
              <th class="post-list__th">{{ t('admin.msg_category', 'Danh mục') }}</th>
              <th class="post-list__th">{{ t('admin.msg_status', 'Trạng thái') }}</th>
              <th class="post-list__th">{{ t('admin.msg_date', 'Ngày') }}</th>
              <th class="post-list__th" style="width:100px;text-align:center">{{ t('admin.msg_actions', 'Thao tác') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="post-list__row">
              <td class="post-list__td">
                <div class="post-list__item-title" @click="editing = item.id">
                  <Star v-if="item.meta?.is_featured" :size="14" class="post-list__featured" />
                  {{ item.title }}
                </div>
                <div v-if="item.excerpt" class="post-list__excerpt">{{ item.excerpt }}</div>
              </td>
              <td class="post-list__td">
                <span v-for="tax in getCategories(item)" :key="tax.id" class="post-list__cat-badge">{{ tax.term }}</span>
                <span v-if="!getCategories(item).length" class="post-list__no-cat">—</span>
              </td>
              <td class="post-list__td">
                <span class="post-list__status" :class="'post-list__status--' + item.status">
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="post-list__td post-list__td--date">
                {{ formatDate(item.published_at || item.created_at) }}
              </td>
              <td class="post-list__td" style="text-align:center">
                <button class="post-list__action" @click="editing = item.id" :title="t('admin.msg_edit', 'Sửa')"><Pencil :size="14" /></button>
                <button class="post-list__action post-list__action--danger" @click="confirmDelete(item)" :title="t('admin.delete', 'Xoá')"><Trash2 :size="14" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="post-list__pagination">
        <button v-for="p in lastPage" :key="p" class="post-list__page-btn" :class="{ 'post-list__page-btn--active': p === page }" @click="page = p; loadPosts()">{{ p }}</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, Search, FileText, PenSquare, Pencil, Trash2, Star, Loader2 } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useI18n } from '../../../composables/useI18n.js'
import PostEditor from './PostEditor.vue'

const { t } = useI18n()
const { showToast } = useToast()

const items = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const statusFilter = ref('')
const categoryFilter = ref('')
const categories = ref([])
const editing = ref(null)

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadPosts() }, 300)
}

async function loadPosts() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, per_page: 20 })
    if (search.value) params.set('search', search.value)
    if (statusFilter.value) params.set('status', statusFilter.value)
    if (categoryFilter.value) {
      params.set('taxonomy', 'category')
      params.set('term', categoryFilter.value)
    }
    const res = await apiFetch(`/content/post?${params}`)
    const data = await res.json()
    const result = data.data || data
    items.value = result.data || result
    total.value = result.total || items.value.length
    lastPage.value = result.last_page || 1
    // Collect unique categories
    const cats = new Set()
    for (const item of items.value) {
      for (const t of (item.taxonomies || [])) {
        if (t.taxonomy === 'category') cats.add(t.term)
      }
    }
    categories.value = [...cats].sort()
  } catch (e) {
    showToast(t('admin.msg_load_posts_error', 'Lỗi tải bài viết: ') + e.message, 'error')
  } finally {
    loading.value = false
  }
}

function onSaved() { editing.value = null; loadPosts() }
function getCategories(item) { return (item.taxonomies || []).filter(t => t.taxonomy === 'category') }
function statusLabel(status) { return { draft: t('admin.msg_draft_label', 'Nháp'), published: t('admin.msg_published_label', 'Đã xuất bản'), archived: t('admin.msg_archived', 'Lưu trữ') }[status] || status }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('vi-VN') : '' }

async function confirmDelete(item) {
  if (!confirm(t('admin.msg_confirm_delete_item', 'Xoá "{title}"?').replace('{title}', item.title))) return
  try {
    const res = await apiFetch(`/content/post/${item.id}`, { method: 'DELETE' })
    if (res.ok) { showToast(t('admin.msg_deleted', 'Đã xoá'), 'success'); loadPosts() }
  } catch (e) { showToast(t('admin.msg_error_prefix', 'Lỗi: ') + e.message, 'error') }
}

onMounted(loadPosts)
</script>

<style scoped>
.post-list__header { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px }
.post-list__header-left { display:flex; align-items:center; gap:10px }
.post-list__icon { color:var(--accent-light,#6366f1) }
.post-list__title { font-size:20px; font-weight:700 }
.post-list__create-btn { display:flex; align-items:center; gap:6px; padding:10px 18px; border-radius:10px; background:var(--accent-light,#6366f1); color:#fff; border:none; font-weight:600; font-size:14px; cursor:pointer; transition:all 0.2s }
.post-list__create-btn:hover { filter:brightness(1.1) }
.post-list__filters { display:flex; gap:12px; margin-bottom:20px }
.post-list__search-wrap { flex:1; position:relative }
.post-list__search-icon { position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--color-text-muted) }
.post-list__search { width:100%; padding:8px 12px 8px 36px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:14px }
.post-list__search:focus { border-color:var(--accent-light); outline:none }
.post-list__select { padding:8px 12px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:14px }
.post-list__loading,.post-list__empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 20px; color:var(--color-text-muted) }
.spin { animation:spin .8s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.post-list__table-wrap { border-radius:12px; overflow:hidden; border:1px solid var(--glass-border) }
.post-list__table { width:100%; border-collapse:collapse; font-size:14px }
.post-list__th { padding:12px 16px; text-align:left; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--color-text-secondary); background:var(--glass-bg); border-bottom:1px solid var(--glass-border) }
.post-list__row { transition:background .15s }
.post-list__row:hover { background:var(--glass-bg) }
.post-list__td { padding:12px 16px; border-bottom:1px solid var(--glass-border); vertical-align:middle }
.post-list__item-title { font-weight:600; color:var(--accent-light,#6366f1); cursor:pointer; display:flex; align-items:center; gap:4px }
.post-list__item-title:hover { text-decoration:underline }
.post-list__featured { color:#f59e0b }
.post-list__excerpt { font-size:12px; color:var(--color-text-muted); margin-top:2px; max-width:300px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
.post-list__cat-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:11px; background:var(--glass-bg); border:1px solid var(--glass-border); margin-right:4px }
.post-list__no-cat { color:var(--color-text-muted) }
.post-list__status { display:inline-block; padding:3px 10px; border-radius:12px; font-size:11px; font-weight:600 }
.post-list__status--draft { background:#fef3c7; color:#92400e }
.post-list__status--published { background:#d1fae5; color:#065f46 }
.post-list__status--archived { background:#e5e7eb; color:#374151 }
.post-list__td--date { font-size:13px; color:var(--color-text-secondary) }
.post-list__action { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--color-text-secondary); cursor:pointer; transition:all .2s; margin:0 2px }
.post-list__action:hover { background:var(--accent-light); color:#fff; border-color:var(--accent-light) }
.post-list__action--danger:hover { background:#ef4444; border-color:#ef4444 }
.post-list__pagination { display:flex; justify-content:center; gap:6px; margin-top:20px }
.post-list__page-btn { padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--color-text); cursor:pointer; font-size:13px }
.post-list__page-btn--active { background:var(--accent-light); color:#fff; border-color:var(--accent-light) }
</style>
