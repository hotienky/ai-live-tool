<template>
  <div class="bm">
    <div class="bm-header">
      <h3><Award :size="16" /> Quản lý thương hiệu <span class="bm-count">({{ brands.length }})</span></h3>
      <button class="btn-add" @click="$emit('create')">+ Thêm thương hiệu</button>
    </div>

    <div class="bm-grid" v-if="brands.length">
      <div v-for="b in brands" :key="b.id" class="bm-card">
        <div class="bm-card__img">
          <img v-if="b.image" :src="b.image" :alt="b.name" class="bm-logo" />
          <Award v-else :size="28" class="bm-placeholder" />
        </div>
        <div class="bm-card__info">
          <strong>{{ b.name }}</strong>
          <span class="bm-slug" v-if="b.slug">/{{ b.slug }}</span>
        </div>
        <div class="bm-card__actions">
          <button class="act-btn act-edit" @click="$emit('edit', b)"><Edit3 :size="13" /> {{ t('admin.edit', 'Sửa') }}</button>
          <button class="act-btn act-cancel" @click="handleDelete(b)"><Trash2 :size="13" /> {{ t('admin.delete', 'Xóa') }}</button>
        </div>
      </div>
    </div>
    <p v-else class="empty">{{ t('admin.no_brands', 'Chưa có thương hiệu nào') }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Award, Edit3, Trash2 } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const emit = defineEmits(['create', 'edit'])

const brands = ref([])

async function fetchBrands() {
  try { const res = await apiFetch(`/brands`); brands.value = await res.json() }
  catch { brands.value = [] }
}

async function handleDelete(b) {
  if (!confirm(`Xóa "${b.name}"?`)) return
  try { await apiFetch(`/brands/${b.id}`, { method: 'DELETE' }); showToast('Đã xóa', 'success'); await fetchBrands() }
  catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

onMounted(() => fetchBrands())

defineExpose({ fetchBrands })
</script>

<style scoped>
.bm { display: flex; flex-direction: column; gap: 16px; }
.bm-header { display: flex; align-items: center; justify-content: space-between; }
.bm-header h3 { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; margin: 0; }
.bm-count { font-size: 13px; font-weight: 500; color: var(--color-text-muted); }
.btn-add { padding: 7px 16px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-add:hover { opacity: 0.85; }

.bm-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.bm-card {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--color-border); transition: border-color 0.2s;
}
.bm-card:hover { border-color: var(--color-accent-primary); }
.bm-card__img { flex-shrink: 0; }
.bm-logo { width: 44px; height: 44px; object-fit: contain; border-radius: 10px; border: 1px solid var(--color-border); background: var(--color-bg-primary); padding: 4px; }
.bm-placeholder { color: var(--color-text-muted); }
.bm-card__info { flex: 1; }
.bm-card__info strong { font-size: 14px; display: block; }
.bm-slug { font-size: 11px; color: var(--color-text-muted); font-family: monospace; }
.bm-card__actions { display: flex; gap: 4px; }

.act-btn { padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-border); background: var(--color-bg-primary); cursor: pointer; font-size: 11px; color: var(--color-text-muted); display: flex; align-items: center; gap: 4px; }
.act-edit:hover { color: #3b82f6; border-color: #3b82f6; }
.act-cancel:hover { color: #ef4444; border-color: #ef4444; }

.empty { text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 14px; }
</style>
