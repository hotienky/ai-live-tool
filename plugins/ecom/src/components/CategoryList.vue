<template>
  <div class="cm">
    <div class="cm-header">
      <h3><FolderOpen :size="16" /> {{ t('admin.msg_78a6ea2d', 'Quản lý danh mục') }} <span class="cm-count">({{ categories.length }})</span></h3>
      <button class="btn-add" @click="$emit('create')">{{ t('admin.msg_2fb39036', '+ Thêm danh mục') }}</button>
    </div>

    <div class="cm-list" v-if="categories.length">
      <div class="cm-card" v-for="c in categories" :key="c.id">
        <div class="cm-card__img">
          <img v-if="c.image" :src="c.image" :alt="c.name" class="cm-thumb" />
          <FolderOpen v-else :size="20" class="cm-placeholder" />
        </div>
        <div class="cm-card__info">
          <strong>{{ c.name }}</strong>
          <span class="cm-slug" v-if="c.slug">/{{ c.slug }}</span>
          <span class="cm-desc" v-if="c.description">{{ c.description }}</span>
        </div>
        <div class="cm-card__meta">
          <span class="cm-sort">Sort: {{ c.sort ?? 0 }}</span>
          <span class="status-dot" :class="c.is_active || c.is_active === undefined ? 'active' : 'inactive'"
            @click="toggleActive(c)">
            {{ c.is_active || c.is_active === undefined ? 'Active' : t('admin.msg_f7bc96f2', 'Ẩn') }}
          </span>
        </div>
        <div class="cm-card__actions">
          <button class="act-btn act-edit" @click="$emit('edit', c)"><Edit3 :size="13" /> {{ t('admin.edit', 'Sửa') }}</button>
          <button class="act-btn act-cancel" @click="handleDelete(c)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">{{ t('admin.no_categories', 'Chưa có danh mục nào') }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'
import { FolderOpen, Edit3, Trash2 } from 'lucide-vue-next'
import { useI18n } from '../helpers.js'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

const emit = defineEmits(['create', 'edit'])

const categories = ref([])

async function fetchCategories() {
  try {
    const res = await apiFetch(`/categories`)
    categories.value = await res.json()
  } catch { categories.value = [] }
}

async function handleDelete(c) {
  if (!confirm(`${t('admin.delete', 'Xóa')} ${t('admin.msg_category', 'danh mục')} \"${c.name}\"?`)) return
  try {
    await apiFetch(`/categories/${c.id}`, { method: 'DELETE' })
    showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
    await fetchCategories()
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
  }
}

async function toggleActive(c) {
  try {
    await apiFetch(`/categories/${c.id}`, { method: 'PUT', body: JSON.stringify({ is_active: c.is_active === false ? true : false }) })
    c.is_active = c.is_active === false ? true : false
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error')
  }
}

onMounted(() => fetchCategories())

defineExpose({ fetchCategories })
</script>

<style scoped>
.cm { display: flex; flex-direction: column; gap: 16px; }
.cm-header { display: flex; align-items: center; justify-content: space-between; }
.cm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.cm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.btn-add { padding: 7px 16px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-add:hover { opacity: 0.85; }

.cm-list { display: flex; flex-direction: column; gap: 8px; }
.cm-card {
  display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.cm-card:hover { border-color: var(--color-accent-primary); }
.cm-card__img { flex-shrink: 0; }
.cm-thumb { width: 40px; height: 40px; object-fit: cover; border-radius: 8px; border: 1px solid var(--color-border); }
.cm-placeholder { color: var(--color-text-muted); }
.cm-card__info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.cm-card__info strong { font-size: 14px; }
.cm-slug { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.cm-desc { font-size: 12px; color: var(--color-text-secondary); }

.cm-card__meta { display: flex; align-items: center; gap: 8px; }
.cm-sort { font-size: 11px; color: var(--color-text-muted); }
.status-dot { display: inline-block; padding: 3px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; cursor: pointer; }
.status-dot.active { background: rgba(16,185,129,0.15); color: #10b981; }
.status-dot.inactive { background: rgba(107,114,128,0.15); color: #6b7280; }

.cm-card__actions { display: flex; gap: 4px; }
.act-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-primary); cursor: pointer; font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }
.act-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.act-cancel:hover { color: #ef4444; border-color: #ef4444; }

.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
