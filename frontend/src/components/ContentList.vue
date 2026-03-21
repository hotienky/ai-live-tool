<template>
  <div class="content-list">
    <!-- Editor mode -->
    <ContentEditor
      v-if="editing !== null"
      :contentType="contentType"
      :typeConfig="typeConfig"
      :editId="editing"
      @back="editing = null"
      @saved="onSaved"
    />

    <!-- List mode -->
    <template v-else>
      <!-- Header -->
      <div class="content-list__header">
        <div class="content-list__header-left">
          <component :is="iconComponent" :size="22" class="content-list__icon" />
          <h2 class="content-list__title">
            {{ typeConfig?.label_plural || contentType }} ({{ total }})
          </h2>
        </div>
        <button class="content-list__create-btn" @click="editing = ''">
          <Plus :size="16" /> {{ t('admin.create', 'Tạo mới') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="content-list__filters">
        <div class="content-list__search-wrap">
          <Search :size="16" class="content-list__search-icon" />
          <input
            v-model="search"
            type="text"
            :placeholder="t('admin.search', 'Tìm kiếm...')"
            class="content-list__search"
            @input="debouncedLoad"
          />
        </div>
        <select v-model="statusFilter" class="content-list__filter-select" @change="loadContent">
          <option value="">{{ t('admin.all_status', 'Tất cả') }}</option>
          <option value="draft">{{ t('admin.draft', 'Nháp') }}</option>
          <option value="published">{{ t('admin.published', 'Đã xuất bản') }}</option>
          <option value="archived">{{ t('admin.archived', 'Lưu trữ') }}</option>
        </select>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="content-list__loading">
        <Loader2 :size="24" class="spin" />
        <span>{{ t('admin.loading', 'Đang tải...') }}</span>
      </div>

      <!-- Empty state -->
      <div v-else-if="items.length === 0" class="content-list__empty">
        <FileText :size="48" />
        <p>{{ t('admin.no_content', 'Chưa có nội dung nào') }}</p>
        <button class="content-list__create-btn" @click="editing = ''">
          <Plus :size="16" /> {{ t('admin.create_first', 'Tạo cái đầu tiên') }}
        </button>
      </div>

      <!-- Table -->
      <div v-else class="content-list__table-wrap">
        <table class="content-list__table">
          <thead>
            <tr>
              <th class="content-list__th content-list__th--title">{{ t('admin.title', 'Tiêu đề') }}</th>
              <th class="content-list__th">Slug</th>
              <th class="content-list__th">{{ t('admin.status', 'Trạng thái') }}</th>
              <th class="content-list__th">{{ t('admin.date', 'Ngày tạo') }}</th>
              <th class="content-list__th content-list__th--actions">{{ t('admin.actions', 'Thao tác') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id" class="content-list__row">
              <td class="content-list__td content-list__td--title">
                <div class="content-list__item-title" @click="editing = item.id">
                  {{ item.title }}
                </div>
                <div v-if="item.excerpt" class="content-list__excerpt">{{ item.excerpt }}</div>
              </td>
              <td class="content-list__td content-list__td--slug">
                <code>/{{ item.slug }}</code>
              </td>
              <td class="content-list__td">
                <span
                  class="content-list__status"
                  :class="'content-list__status--' + item.status"
                >
                  {{ statusLabel(item.status) }}
                </span>
              </td>
              <td class="content-list__td content-list__td--date">
                {{ formatDate(item.created_at) }}
              </td>
              <td class="content-list__td content-list__td--actions">
                <button class="content-list__action-btn" @click="editing = item.id" title="Sửa">
                  <Pencil :size="14" />
                </button>
                <button class="content-list__action-btn content-list__action-btn--danger" @click="confirmDelete(item)" title="Xoá">
                  <Trash2 :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="content-list__pagination">
        <button
          v-for="p in lastPage" :key="p"
          class="content-list__page-btn"
          :class="{ 'content-list__page-btn--active': p === page }"
          @click="page = p; loadContent()"
        >
          {{ p }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { Plus, Search, FileText, Pencil, Trash2, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import ContentEditor from './ContentEditor.vue'

const { t } = useI18n()
const { showToast } = useToast()

const props = defineProps({
  contentType: { type: String, required: true },
  typeConfig: { type: Object, default: null },
})

const items = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const lastPage = ref(1)
const search = ref('')
const statusFilter = ref('')
const editing = ref(null) // null=list, ''=create, id=edit

const iconComponent = computed(() => {
  // Map icon string to lucide component — default to FileText
  return FileText
})

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { page.value = 1; loadContent() }, 300)
}

async function loadContent() {
  loading.value = true
  try {
    const params = new URLSearchParams()
    params.set('page', page.value)
    params.set('per_page', 20)
    if (search.value) params.set('search', search.value)
    if (statusFilter.value) params.set('status', statusFilter.value)

    const res = await apiFetch(`/content/${props.contentType}?${params}`)
    const data = await res.json()
    const result = data.data || data

    if (result.data) {
      // Paginated response
      items.value = result.data
      total.value = result.total || result.data.length
      lastPage.value = result.last_page || 1
    } else if (Array.isArray(result)) {
      items.value = result
      total.value = result.length
    }
  } catch (e) {
    showToast('Lỗi tải danh sách: ' + e.message, 'error')
  } finally {
    loading.value = false
  }
}

function onSaved() {
  editing.value = null
  loadContent()
}

function statusLabel(status) {
  const map = { draft: 'Nháp', published: 'Đã xuất bản', archived: 'Lưu trữ' }
  return map[status] || status
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

async function confirmDelete(item) {
  if (!confirm(`Xoá "${item.title}"?`)) return
  try {
    const res = await apiFetch(`/content/${props.contentType}/${item.id}`, { method: 'DELETE' })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || 'Đã xoá', 'success')
      loadContent()
    } else {
      showToast(data.message || 'Lỗi xoá', 'error')
    }
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

onMounted(loadContent)
</script>

<style scoped>
.content-list { padding: 0; }

/* Header */
.content-list__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.content-list__header-left { display: flex; align-items: center; gap: 10px; }
.content-list__icon { color: var(--accent-light, #6366f1); }
.content-list__title { font-size: 20px; font-weight: 700; }
.content-list__create-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px;
  background: var(--accent-light, #6366f1); color: white;
  border: none; font-weight: 600; font-size: 14px;
  cursor: pointer; transition: all 0.2s;
}
.content-list__create-btn:hover { filter: brightness(1.1); }

/* Filters */
.content-list__filters {
  display: flex; gap: 12px; margin-bottom: 20px;
}
.content-list__search-wrap {
  flex: 1; position: relative;
}
.content-list__search-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--color-text-muted);
}
.content-list__search {
  width: 100%; padding: 8px 12px 8px 36px; border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text); font-size: 14px;
}
.content-list__search:focus { border-color: var(--accent-light); outline: none; }
.content-list__filter-select {
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text); font-size: 14px;
}

/* Loading & Empty */
.content-list__loading, .content-list__empty {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 60px 20px;
  color: var(--color-text-muted); text-align: center;
}
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.content-list__table-wrap {
  border-radius: 12px; overflow: hidden;
  border: 1px solid var(--glass-border);
}
.content-list__table {
  width: 100%; border-collapse: collapse; font-size: 14px;
}
.content-list__th {
  padding: 12px 16px; text-align: left; font-size: 12px;
  font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;
  color: var(--color-text-secondary);
  background: var(--glass-bg);
  border-bottom: 1px solid var(--glass-border);
}
.content-list__th--title { width: 35%; }
.content-list__th--actions { width: 100px; text-align: center; }
.content-list__row { transition: background 0.15s; }
.content-list__row:hover { background: var(--glass-bg); }
.content-list__td {
  padding: 12px 16px; border-bottom: 1px solid var(--glass-border);
  vertical-align: middle;
}
.content-list__td--title { }
.content-list__item-title {
  font-weight: 600; color: var(--accent-light, #6366f1);
  cursor: pointer;
}
.content-list__item-title:hover { text-decoration: underline; }
.content-list__excerpt {
  font-size: 12px; color: var(--color-text-muted);
  margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  max-width: 300px;
}
.content-list__td--slug code {
  font-size: 12px; padding: 2px 8px; border-radius: 4px;
  background: var(--glass-bg);
}
.content-list__td--date { font-size: 13px; color: var(--color-text-secondary); }
.content-list__td--actions { text-align: center; }

/* Status badge */
.content-list__status {
  display: inline-block; padding: 3px 10px; border-radius: 12px;
  font-size: 11px; font-weight: 600;
}
.content-list__status--draft {
  background: #fef3c7; color: #92400e;
}
.content-list__status--published {
  background: #d1fae5; color: #065f46;
}
.content-list__status--archived {
  background: #e5e7eb; color: #374151;
}

/* Action buttons */
.content-list__action-btn {
  display: inline-flex; align-items: center; justify-content: center;
  width: 30px; height: 30px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-secondary); cursor: pointer;
  transition: all 0.2s; margin: 0 2px;
}
.content-list__action-btn:hover {
  background: var(--accent-light); color: white; border-color: var(--accent-light);
}
.content-list__action-btn--danger:hover {
  background: #ef4444; border-color: #ef4444;
}

/* Pagination */
.content-list__pagination {
  display: flex; justify-content: center; gap: 6px; margin-top: 20px;
}
.content-list__page-btn {
  padding: 6px 12px; border-radius: 8px;
  border: 1px solid var(--glass-border);
  background: transparent; color: var(--color-text);
  cursor: pointer; font-size: 13px; transition: all 0.2s;
}
.content-list__page-btn:hover { background: var(--glass-bg); }
.content-list__page-btn--active {
  background: var(--accent-light); color: white; border-color: var(--accent-light);
}
</style>
