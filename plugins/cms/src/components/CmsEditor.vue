<template>
  <div class="cms-editor">
    <div class="ce-header">
      <div class="ce-header__left">
        <button class="btn-back" @click="$emit('back')">
          <ChevronLeft :size="16" /> Quay lại
        </button>
        <h2>{{ editId ? 'Chỉnh sửa trang' : 'Tạo trang mới' }}</h2>
        <!-- Badges header -->
        <span v-if="form.is_system" class="badge badge--system"><Lock :size="10" /> Hệ thống</span>
        <span v-if="form.is_dynamic" class="badge badge--dynamic"><Layers :size="10" /> Dynamic</span>
      </div>
      <button class="btn-save" @click="savePage" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        <Save v-else :size="14" />
        {{ saving ? 'Đang lưu...' : 'Lưu trang' }}
      </button>
    </div>

    <div class="ce-body">
      <!-- Main content -->
      <div class="ce-main">
        <div class="ce-field">
          <label class="ce-label">Tiêu đề trang *</label>
          <input v-model="form.title" type="text" class="ce-input ce-input--title" placeholder="Ví dụ: Giới thiệu công ty" @blur="autoSlug" />
        </div>

        <div class="ce-field">
          <label class="ce-label">Đường dẫn (Slug)</label>
          <div class="ce-slug-input">
            <span class="ce-slug-prefix">/page/</span>
            <input v-model="form.alias" type="text" class="ce-input" placeholder="gioi-thieu-cong-ty" :disabled="form.is_system" />
          </div>
          <small v-if="form.is_system" class="ce-hint ce-hint--warn">Alias trang hệ thống không thể thay đổi.</small>
        </div>

        <!-- Nội dung chỉ hiển thị khi KHÔNG phải dynamic -->
        <template v-if="!form.is_dynamic">
          <div class="ce-field">
            <label class="ce-label">Nội dung</label>
            <component v-if="richEditor" :is="richEditor" v-model="form.content" placeholder="Soạn nội dung trang..." />
            <textarea v-else v-model="form.content" rows="16" class="ce-input ce-textarea" placeholder="Nhập nội dung HTML hoặc shortcode..."></textarea>
            <small class="ce-hint">Mẹo: Hỗ trợ HTML và shortcode như <code>[lucky-draw id="1"]</code></small>
          </div>
        </template>

        <!-- Khi dynamic: thông báo dẫn qua Page Builder (Phase 2) -->
        <template v-else>
          <div class="ce-dynamic-notice">
            <Layers :size="20" />
            <div>
              <strong>Trang này dùng Page Builder</strong>
              <p>Bố cục trang được quản lý bằng hệ thống kéo thả. Bộ biên soạn nội dung sẽ có ở Phase 2.</p>
            </div>
          </div>
        </template>
      </div>

      <!-- Sidebar -->
      <div class="ce-sidebar">
        <!-- Publish card -->
        <div class="ce-card">
          <h4 class="ce-card-title">Xuất bản</h4>
          <div class="ce-field">
            <select v-model="form.status" class="ce-select">
              <option :value="true">Xuất bản (Published)</option>
              <option :value="false">Nháp (Draft)</option>
            </select>
          </div>
        </div>

        <!-- Page type card -->
        <div class="ce-card">
          <h4 class="ce-card-title">Loại trang</h4>
          <label class="ce-toggle-row" :class="{ 'ce-toggle-row--disabled': form.is_system && form.alias === 'home' }">
            <span class="ce-toggle-label">
              <Layers :size="14" />
              Page Builder (Dynamic)
            </span>
            <div class="ce-toggle" :class="{ active: form.is_dynamic }" @click="toggleDynamic">
              <div class="ce-toggle__knob"></div>
            </div>
          </label>
          <p class="ce-hint" style="margin-top:.5rem">
            Bật để dùng hệ thống kéo thả block (Hero, Blog, Sản phẩm...).
            Tắt để dùng trình soạn thảo văn bản thông thường.
          </p>
        </div>

        <!-- SEO card -->
        <div class="ce-card">
          <h4 class="ce-card-title">SEO</h4>
          <div class="ce-field">
            <label class="ce-label">Meta Title</label>
            <input v-model="form.meta_title" type="text" class="ce-input" placeholder="Tiêu đề SEO..." />
          </div>
          <div class="ce-field">
            <label class="ce-label">Meta Description</label>
            <textarea v-model="form.meta_description" class="ce-input ce-textarea--sm" rows="3" placeholder="Mô tả meta..."></textarea>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, shallowRef, onMounted } from 'vue'
import { ChevronLeft, Save, Loader2, Layers, Lock } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useCmsPages } from '../composables/useCmsPages.js'

const bridge = window.__APP_BRIDGE__ || {}
const richEditor = shallowRef(bridge.components?.RichTextEditor || null)

const { showToast } = useToast()
const { createPage, updatePage, fetchPage } = useCmsPages(apiFetch)

const props = defineProps({
  editId: { type: [Number, String], default: null }
})
const emit = defineEmits(['back', 'saved'])

const saving = ref(false)
const form = ref({
  title: '',
  alias: '',
  content: '',
  status: true,
  is_dynamic: false,
  is_system: false,
  meta_title: '',
  meta_description: '',
})

function autoSlug() {
  if (!form.value.alias && form.value.title && !form.value.is_system) {
    form.value.alias = form.value.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

function toggleDynamic() {
  // Trang home luôn dynamic — không cho tắt
  if (form.value.alias === 'home') return
  form.value.is_dynamic = !form.value.is_dynamic
}

async function loadPage() {
  if (!props.editId) return
  try {
    const data = await fetchPage(props.editId)
    const item = data.data || data
    form.value = {
      title: item.title || '',
      alias: item.alias || '',
      content: item.content || '',
      status: item.status ?? true,
      is_dynamic: item.is_dynamic ?? false,
      is_system: item.is_system ?? false,
      meta_title: item.meta_title || '',
      meta_description: item.meta_description || '',
    }
  } catch (e) {
    showToast('Lỗi tải trang: ' + e.message, 'error')
  }
}

async function savePage() {
  if (!form.value.title.trim()) return showToast('Vui lòng nhập tiêu đề', 'error')
  saving.value = true
  try {
    const payload = {
      title: form.value.title,
      alias: form.value.alias,
      content: form.value.content,
      status: form.value.status,
      is_dynamic: form.value.is_dynamic,
      meta_title: form.value.meta_title,
      meta_description: form.value.meta_description,
    }
    if (props.editId) {
      await updatePage(props.editId, payload)
      showToast('Đã cập nhật trang!', 'success')
    } else {
      await createPage(payload)
      showToast('Đã tạo trang mới!', 'success')
    }
    emit('saved')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadPage)
</script>

<style scoped>
.cms-editor { padding: 0; }
.ce-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.ce-header__left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.ce-header h2 { margin: 0; font-size: 18px; font-weight: 700; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border, #e5e7eb); background: transparent; color: var(--text-2, #6b7280); cursor: pointer; font-size: 13px; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent, #7c3aed); color: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-save:hover { filter: brightness(1.1); }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.ce-body { display: grid; grid-template-columns: 1fr 280px; gap: 20px; }
.ce-main { min-width: 0; }
.ce-sidebar { display: flex; flex-direction: column; gap: 16px; }

.ce-field { margin-bottom: 16px; }
.ce-label { display: block; font-size: 13px; font-weight: 600; color: var(--text-2, #6b7280); margin-bottom: 6px; }
.ce-input, .ce-select { width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--border, #e5e7eb); background: var(--bg-1, #fff); color: var(--text-1, #1f2937); font-size: 14px; box-sizing: border-box; }
.ce-input:focus { border-color: var(--accent, #7c3aed); outline: none; }
.ce-input:disabled { opacity: .5; cursor: not-allowed; }
.ce-input--title { font-size: 16px; font-weight: 600; padding: 12px 16px; }
.ce-textarea { resize: vertical; min-height: 300px; font-family: monospace; }
.ce-textarea--sm { resize: vertical; min-height: 60px; font-family: inherit; }
.ce-slug-input { display: flex; }
.ce-slug-prefix { padding: 8px 4px 8px 12px; font-size: 14px; color: var(--text-3, #9ca3af); border: 1px solid var(--border); border-right: none; border-radius: 8px 0 0 8px; background: var(--bg-2, #f9fafb); }
.ce-slug-input .ce-input { border-radius: 0 8px 8px 0; }
.ce-hint { display: block; margin-top: 6px; font-size: 12px; color: var(--text-3, #9ca3af); }
.ce-hint code { background: var(--bg-2, #f3f4f6); padding: 1px 6px; border-radius: 4px; font-size: 11px; }
.ce-hint--warn { color: #d97706; }

.ce-card { padding: 16px; border-radius: 10px; border: 1px solid var(--border, #e5e7eb); background: var(--bg-2, #f9fafb); }
.ce-card .ce-field { margin-bottom: 12px; }
.ce-card .ce-field:last-child { margin-bottom: 0; }
.ce-card-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-2, #6b7280); margin: 0 0 12px; }

/* Toggle switch */
.ce-toggle-row { display: flex; align-items: center; justify-content: space-between; cursor: pointer; }
.ce-toggle-row--disabled { opacity: .5; cursor: not-allowed; pointer-events: none; }
.ce-toggle-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-1); }
.ce-toggle { width: 36px; height: 20px; border-radius: 10px; background: var(--border); transition: background .2s; position: relative; flex-shrink: 0; }
.ce-toggle.active { background: var(--accent, #7c3aed); }
.ce-toggle__knob { position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.ce-toggle.active .ce-toggle__knob { transform: translateX(16px); }

/* Dynamic notice */
.ce-dynamic-notice { display: flex; gap: 14px; align-items: flex-start; padding: 20px; background: rgba(139,92,246,.06); border: 1px dashed rgba(139,92,246,.3); border-radius: 10px; color: var(--text-2); }
.ce-dynamic-notice strong { display: block; font-size: 14px; color: var(--text-1); margin-bottom: 4px; }
.ce-dynamic-notice p { margin: 0; font-size: 13px; line-height: 1.5; }

/* Badges */
.badge { display: inline-flex; align-items: center; gap: 3px; padding: 2px 8px; border-radius: 8px; font-size: .65rem; font-weight: 700; text-transform: uppercase; letter-spacing: .3px; }
.badge--system { background: rgba(251,191,36,.15); color: #d97706; border: 1px solid rgba(251,191,36,.3); }
.badge--dynamic { background: rgba(139,92,246,.15); color: #7c3aed; border: 1px solid rgba(139,92,246,.3); }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 768px) { .ce-body { grid-template-columns: 1fr; } }
</style>
