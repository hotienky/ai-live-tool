<template>
  <div class="template-store">
    <!-- Header -->
    <div class="tst-header">
      <div>
        <h2 class="tst-title"><Store :size="22" /> {{ t('admin.template_store', 'Template Store') }}</h2>
        <p class="tst-sub">{{ t('admin.tst_desc', 'Chọn template phù hợp lĩnh vực để có site ngay lập tức') }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="tst-filters">
      <div class="tst-search">
        <Search :size="14" />
        <input v-model="search" @input="debouncedLoad" type="text" :placeholder="t('admin.search_tpl', 'Tìm template...')" class="tst-search__input" />
      </div>
      <div class="tst-filter-row">
        <select v-model="filters.industry" @change="loadTemplates" class="tst-select">
          <option value="">{{ t('admin.all_industries', 'Tất cả lĩnh vực') }}</option>
          <option v-for="ind in industries" :key="ind.key" :value="ind.key">{{ ind.icon }} {{ ind.label }}</option>
        </select>
        <select v-model="filters.price" @change="loadTemplates" class="tst-select">
          <option value="">{{ t('admin.all_prices', 'Tất cả giá') }}</option>
          <option value="free">{{ t('admin.free', 'Miễn phí') }}</option>
          <option value="paid">{{ t('admin.paid', 'Có phí') }}</option>
        </select>
        <select v-model="filters.sort" @change="loadTemplates" class="tst-select">
          <option value="install_count">{{ t('admin.popular', 'Phổ biến') }}</option>
          <option value="rating">{{ t('admin.rating', 'Đánh giá') }}</option>
          <option value="created_at">{{ t('admin.newest', 'Mới nhất') }}</option>
          <option value="name">A-Z</option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="tst-loading"><Loader2 :size="20" class="spin" /> {{ t('admin.loading', 'Đang tải...') }}</div>

    <!-- Empty -->
    <div v-else-if="templates.length === 0" class="tst-empty">
      <Package :size="40" />
      <p>{{ t('admin.no_templates', 'Không tìm thấy template phù hợp') }}</p>
    </div>

    <!-- Template Grid -->
    <div v-else class="tst-grid">
      <div v-for="tpl in templates" :key="tpl.id" class="tst-card">
        <!-- Screenshot -->
        <div class="tst-card__preview" :style="{ background: tpl.theme_config?.colors?.primary || 'var(--bg-2)' }">
          <img v-if="tpl.screenshots?.[0]" :src="tpl.screenshots[0]" :alt="tpl.name" class="tst-card__img" />
          <div v-else class="tst-card__placeholder"><LayoutTemplate :size="32" /></div>
          <span v-if="tpl.is_featured" class="tst-card__featured">⭐ Featured</span>
          <span class="tst-card__price" :class="tpl.price > 0 ? 'tst-card__price--paid' : 'tst-card__price--free'">
            {{ tpl.price > 0 ? formatPrice(tpl.price) : t('admin.free', 'FREE') }}
          </span>
        </div>

        <!-- Info -->
        <div class="tst-card__body">
          <h4 class="tst-card__name">{{ tpl.name }}</h4>
          <div class="tst-card__meta">
            <span class="tst-card__industry">{{ tpl.industry }}</span>
            <span v-if="tpl.rating" class="tst-card__rating">⭐ {{ tpl.rating }}</span>
            <span class="tst-card__installs"><Download :size="11" /> {{ formatNumber(tpl.install_count || 0) }}</span>
          </div>
          <p class="tst-card__desc">{{ tpl.description }}</p>

          <!-- Required modules -->
          <div v-if="tpl.requires_modules?.length" class="tst-card__modules">
            <span v-for="m in tpl.requires_modules" :key="m" class="tst-card__module">{{ m }}</span>
          </div>

          <!-- Actions -->
          <div class="tst-card__actions">
            <button class="tst-btn tst-btn--install" @click="installTemplate(tpl)" :disabled="installing === tpl.template_id">
              <Download :size="13" />
              {{ installing === tpl.template_id ? t('admin.installing', 'Đang cài...') : (tpl.price > 0 ? t('admin.buy', 'Mua') : t('admin.install', 'Cài đặt')) }}
            </button>
            <button class="tst-btn tst-btn--preview" @click="previewTemplate(tpl)">
              <Eye :size="13" /> Preview
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="meta.last_page > 1" class="tst-pagination">
      <button v-for="p in meta.last_page" :key="p" class="tst-page-btn" :class="{ active: meta.current_page === p }" @click="goToPage(p)">{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Store, Search, Loader2, Package, LayoutTemplate, Download, Eye } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import { listIndustries } from '../core/industry-builder.js'

const { t } = useI18n()
const { showToast } = useToast()

const templates = ref([])
const loading = ref(true)
const installing = ref(null)
const search = ref('')
const filters = reactive({ industry: '', price: '', sort: 'install_count' })
const meta = reactive({ current_page: 1, per_page: 12, total: 0, last_page: 1 })

const industries = listIndustries().filter(i => i.key !== 'blank').map(i => ({
  key: i.key,
  label: i.label,
  icon: { ecommerce: '🛒', blog: '✍️', lms: '🎓', booking: '📅', restaurant: '🍽️', portfolio: '💼', business: '🏢' }[i.key] || '📦',
}))

let debounceTimer = null
function debouncedLoad() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadTemplates, 300)
}

async function loadTemplates(page = 1) {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page,
      per_page: 12,
      sort: filters.sort,
      ...(filters.industry && { industry: filters.industry }),
      ...(filters.price && { price: filters.price }),
      ...(search.value && { search: search.value }),
    })
    const res = await apiFetch(`/template-store?${params}`)
    const data = await res.json()
    templates.value = data.data || []
    Object.assign(meta, data.meta || {})
  } catch (e) {
    console.error('[TemplateStore] Load error:', e)
  }
  loading.value = false
}

async function installTemplate(tpl) {
  if (!confirm(t('admin.confirm_install', `Cài đặt template "${tpl.name}"? Theme và layout sẽ được áp dụng.`))) return
  installing.value = tpl.template_id
  try {
    const res = await apiFetch(`/template-store/${tpl.template_id}/install`, { method: 'POST' })
    const data = await res.json()
    if (data.success) {
      showToast(data.message || t('admin.install_ok', 'Đã cài template!'), 'success')
    } else {
      showToast(data.message || t('admin.install_err', 'Lỗi cài template'), 'error')
    }
  } catch (e) {
    showToast(t('admin.install_err', 'Lỗi cài template'), 'error')
  }
  installing.value = null
}

function previewTemplate(tpl) {
  if (tpl.preview_url) {
    window.open(tpl.preview_url, '_blank')
  } else {
    showToast(t('admin.no_preview', 'Chưa có preview cho template này'), 'info')
  }
}

function goToPage(page) {
  loadTemplates(page)
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ'
}

function formatNumber(n) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return n
}

onMounted(loadTemplates)
</script>

<style scoped>
.template-store { max-width: 1100px; }

.tst-header { margin-bottom: 24px; }
.tst-title { display: flex; align-items: center; gap: 10px; font-size: 24px; font-weight: 800; margin: 0 0 6px; }
.tst-title svg { color: var(--accent); }
.tst-sub { font-size: 14px; color: var(--text-3); margin: 0; }

/* Filters */
.tst-filters { margin-bottom: 24px; }
.tst-search {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 16px; border-radius: 10px; margin-bottom: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
}
.tst-search svg { color: var(--text-3); }
.tst-search__input { flex: 1; border: none; background: transparent; font-size: 14px; color: var(--text-1); outline: none; }
.tst-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
.tst-select {
  padding: 8px 14px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--glass-bg);
  color: var(--text-1);
}

.tst-loading, .tst-empty {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  padding: 60px 24px; color: var(--text-3);
}
.tst-empty p { margin: 0; }

/* Grid */
.tst-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px; }

/* Card */
.tst-card {
  border-radius: 14px; overflow: hidden;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  transition: all 0.3s;
}
.tst-card:hover { border-color: var(--color-border-hover); transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }

.tst-card__preview {
  height: 160px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
}
.tst-card__img { width: 100%; height: 100%; object-fit: cover; }
.tst-card__placeholder { color: rgba(255,255,255,0.3); }
.tst-card__featured {
  position: absolute; top: 10px; left: 10px;
  padding: 3px 10px; border-radius: 6px;
  background: rgba(0,0,0,0.6); color: #fbbf24;
  font-size: 10px; font-weight: 700; backdrop-filter: blur(4px);
}
.tst-card__price {
  position: absolute; top: 10px; right: 10px;
  padding: 4px 12px; border-radius: 6px;
  font-size: 12px; font-weight: 800;
  backdrop-filter: blur(4px);
}
.tst-card__price--free { background: rgba(16,185,129,0.2); color: #10b981; }
.tst-card__price--paid { background: rgba(245,158,11,0.2); color: #f59e0b; }

.tst-card__body { padding: 16px; }
.tst-card__name { font-size: 16px; font-weight: 700; margin: 0 0 6px; }
.tst-card__meta {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  font-size: 11px; color: var(--text-3);
}
.tst-card__industry {
  padding: 2px 8px; border-radius: 4px;
  background: var(--color-accent-glow, rgba(124,58,237,0.1));
  color: var(--accent); font-weight: 700; text-transform: capitalize;
}
.tst-card__rating { display: flex; align-items: center; gap: 2px; }
.tst-card__installs { display: flex; align-items: center; gap: 3px; }
.tst-card__desc {
  font-size: 13px; color: var(--text-3); line-height: 1.5; margin: 0 0 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tst-card__modules { display: flex; gap: 4px; margin-bottom: 12px; }
.tst-card__module {
  padding: 2px 8px; border-radius: 4px;
  background: rgba(245,158,11,0.12); color: #f59e0b;
  font-size: 10px; font-weight: 600;
}

/* Actions */
.tst-card__actions { display: flex; gap: 8px; }
.tst-btn {
  display: flex; align-items: center; gap: 5px; padding: 8px 16px;
  border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
  border: 1px solid var(--glass-border); transition: all 0.2s;
}
.tst-btn--install {
  background: var(--accent-gradient); color: #fff; border: none;
  box-shadow: var(--accent-shadow); flex: 1;
}
.tst-btn--install:hover { transform: translateY(-1px); }
.tst-btn--install:disabled { opacity: 0.5; cursor: wait; }
.tst-btn--preview { background: transparent; color: var(--text-2); }
.tst-btn--preview:hover { border-color: var(--accent); color: var(--accent); }

/* Pagination */
.tst-pagination {
  display: flex; justify-content: center; gap: 4px; margin-top: 32px;
}
.tst-page-btn {
  width: 36px; height: 36px; border-radius: 8px; font-size: 13px; font-weight: 700;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
}
.tst-page-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .tst-grid { grid-template-columns: 1fr; }
  .tst-filter-row { flex-direction: column; }
}
</style>
