<template>
  <div class="page-panel" v-if="!activePageId">
    <!-- Quick Add Page -->
    <div class="lb-section">
      <h4 class="lb-section__title">
        <component :is="icons.FileStack" :size="14" /> {{ t('admin.msg_6a466765', 'Quản lý Trang') }}
        <button class="pp-add-btn" @click="openCreateDialog" :data-tooltip="t('admin.msg_47eef3e5', 'Thêm trang')">
          <component :is="icons.Plus" :size="12" />
        </button>
      </h4>

      <!-- CMS Page List — compact inline cards -->
      <div v-if="loading" class="pp-loading">
        <component :is="icons.Loader2" :size="14" class="spin" /> {{ t('admin.loading', 'Đang tải...') }}
      </div>
      <div v-else class="pp-page-list">
        <div
          v-for="page in sortedPages"
          :key="page.id"
          class="pp-page-card"
          :class="{ 'pp-page-card--system': page.is_system }"
        >
          <div class="pp-page-card__info">
            <div class="pp-page-card__title">
              <component :is="page.is_dynamic ? icons.Layout : icons.FileText" :size="12" />
              <span>{{ page.title }}</span>
              <span v-if="page.is_system" class="pp-badge pp-badge--system">Hệ thống</span>
            </div>
            <span class="pp-page-card__slug">/page/{{ page.alias }}</span>
          </div>
          <div class="pp-page-card__actions">
            <span
              class="pp-status-dot"
              :class="page.status ? 'pp-status-dot--active' : 'pp-status-dot--draft'"
              @click.stop="togglePageStatus(page)"
              :data-tooltip="page.status ? 'Published — Click để chuyển sang Draft' : 'Draft — Click để Published'"
            >
              {{ page.status ? '✓' : '○' }}
            </span>
            <button
              v-if="page.is_dynamic"
              class="pp-action-btn pp-action-btn--builder"
              @click.stop="$emit('select-page', page.id)"
              :data-tooltip="t('admin.msg_open_builder', 'Mở bố cục trang')"
            >
              <component :is="icons.Paintbrush" :size="11" />
            </button>
            <button
              class="pp-action-btn pp-action-btn--edit"
              @click.stop="openEditDialog(page)"
              :data-tooltip="t('admin.edit', 'Sửa')"
            >
              <component :is="icons.Pencil" :size="11" />
            </button>
            <button
              v-if="!page.is_system"
              class="pp-action-btn pp-action-btn--del"
              @click.stop="handleDeletePage(page)"
              :data-tooltip="t('admin.delete', 'Xóa')"
            >
              <component :is="icons.Trash2" :size="11" />
            </button>
          </div>
        </div>
        <p v-if="!sortedPages.length" class="pp-empty">{{ t('admin.msg_6d9fee60', 'Chưa có trang CMS nào') }}</p>
      </div>
    </div>

    <!-- Create/Edit Page Dialog (inline flyout) -->
    <Teleport to="body">
      <transition name="slide-in">
        <div v-if="showDialog" class="pp-dialog-overlay" @click.self="showDialog = false">
          <div class="pp-dialog">
            <div class="pp-dialog__header">
              <h3>
                <component :is="dialogEditId ? icons.Pencil : icons.Plus" :size="16" />
                {{ dialogEditId ? 'Chỉnh sửa trang' : 'Tạo trang mới' }}
              </h3>
              <button class="pp-dialog__close" @click="showDialog = false">
                <component :is="icons.X" :size="18" />
              </button>
            </div>
            <div class="pp-dialog__body">
              <div class="pp-field">
                <label>Tiêu đề *</label>
                <input
                  v-model="dialogForm.title"
                  type="text"
                  class="pp-input pp-input--title"
                  placeholder="VD: Giới thiệu, Liên hệ, Chính sách..."
                  @blur="autoSlug"
                  ref="titleInput"
                />
              </div>
              <div class="pp-field">
                <label>Đường dẫn</label>
                <div class="pp-slug-row">
                  <span class="pp-slug-prefix">/page/</span>
                  <input
                    v-model="dialogForm.alias"
                    type="text"
                    class="pp-input"
                    placeholder="gioi-thieu"
                    :disabled="dialogForm.is_system"
                  />
                </div>
              </div>
              <div class="pp-field">
                <label>Loại trang</label>
                <div class="pp-type-cards">
                  <div
                    class="pp-type-card"
                    :class="{ active: !dialogForm.is_dynamic }"
                    @click="dialogForm.is_dynamic = false"
                  >
                    <component :is="icons.FileText" :size="20" />
                    <strong>Trang tĩnh</strong>
                    <span>Soạn nội dung HTML</span>
                  </div>
                  <div
                    class="pp-type-card"
                    :class="{ active: dialogForm.is_dynamic }"
                    @click="dialogForm.is_dynamic = true"
                  >
                    <component :is="icons.Layout" :size="20" />
                    <strong>Page Builder</strong>
                    <span>Kéo thả sections</span>
                  </div>
                </div>
              </div>
              <!-- Content for static pages -->
              <div v-if="!dialogForm.is_dynamic" class="pp-field">
                <label>Nội dung</label>
                <textarea
                  v-model="dialogForm.content"
                  rows="8"
                  class="pp-input pp-textarea"
                  placeholder="Nhập nội dung HTML..."
                ></textarea>
              </div>
              <!-- SEO collapsible -->
              <details class="pp-seo-details">
                <summary>🔍 SEO (Tùy chọn)</summary>
                <div class="pp-field">
                  <label>Meta Title</label>
                  <input v-model="dialogForm.meta_title" class="pp-input" placeholder="Tiêu đề SEO..." />
                </div>
                <div class="pp-field">
                  <label>Meta Description</label>
                  <textarea v-model="dialogForm.meta_description" class="pp-input pp-textarea--sm" rows="2" placeholder="Mô tả meta..."></textarea>
                </div>
              </details>
            </div>
            <div class="pp-dialog__footer">
              <button class="pp-btn pp-btn--ghost" @click="showDialog = false">Hủy</button>
              <button class="pp-btn pp-btn--primary" @click="saveDialogPage" :disabled="dialogSaving">
                <component :is="dialogSaving ? icons.Loader2 : icons.Save" :size="14" :class="{ spin: dialogSaving }" />
                {{ dialogSaving ? 'Đang lưu...' : (dialogEditId ? 'Cập nhật' : 'Tạo trang') }}
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { FileStack, Plus, FileText, Layers, Paintbrush, Pencil, Trash2, X, Save, Loader2, Layout } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { apiFetch } from '../../composables/useApi.js'
import { useToast } from '../../composables/useToast.js'
import { useCmsPages } from '../../composables/useCmsPages.js'

const { t } = useI18n()
const { showToast } = useToast()
const { pages: cmsPages, fetchPages, createPage, updatePage, deletePage } = useCmsPages(apiFetch)

const icons = { FileStack, Plus, FileText, Layers, Paintbrush, Pencil, Trash2, X, Save, Loader2, Layout }

defineProps({
  activePageId: { type: [String, Number], default: null },
})
const emit = defineEmits(['select-page', 'pages-updated'])

const loading = ref(true)
const showDialog = ref(false)
const dialogEditId = ref(null)
const dialogSaving = ref(false)
const titleInput = ref(null)

const dialogForm = ref({
  title: '',
  alias: '',
  content: '',
  status: true,
  is_dynamic: true,
  is_system: false,
  meta_title: '',
  meta_description: '',
})

const sortedPages = computed(() => {
  const items = Array.isArray(cmsPages.value) ? cmsPages.value : (cmsPages.value?.data || [])
  return [...items].sort((a, b) => {
    if (a.is_system && !b.is_system) return -1
    if (!a.is_system && b.is_system) return 1
    return (a.sort || 0) - (b.sort || 0)
  })
})

async function loadPages() {
  loading.value = true
  await fetchPages({})
  loading.value = false
}

function openCreateDialog() {
  dialogEditId.value = null
  dialogForm.value = {
    title: '',
    alias: '',
    content: '',
    status: true,
    is_dynamic: true,
    is_system: false,
    meta_title: '',
    meta_description: '',
  }
  showDialog.value = true
  nextTick(() => titleInput.value?.focus())
}

function openEditDialog(page) {
  dialogEditId.value = page.id
  dialogForm.value = {
    title: page.title || '',
    alias: page.alias || '',
    content: page.content || '',
    status: page.status ?? true,
    is_dynamic: page.is_dynamic ?? false,
    is_system: page.is_system ?? false,
    meta_title: page.meta_title || '',
    meta_description: page.meta_description || '',
  }
  showDialog.value = true
  nextTick(() => titleInput.value?.focus())
}

function autoSlug() {
  if (!dialogForm.value.alias && dialogForm.value.title && !dialogForm.value.is_system) {
    dialogForm.value.alias = dialogForm.value.title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
  }
}

async function saveDialogPage() {
  if (!dialogForm.value.title.trim()) {
    showToast('Vui lòng nhập tiêu đề trang', 'error')
    return
  }
  dialogSaving.value = true
  try {
    const payload = {
      title: dialogForm.value.title,
      alias: dialogForm.value.alias,
      content: dialogForm.value.content,
      status: dialogForm.value.status,
      is_dynamic: dialogForm.value.is_dynamic,
      meta_title: dialogForm.value.meta_title,
      meta_description: dialogForm.value.meta_description,
    }
    if (dialogEditId.value) {
      await updatePage(dialogEditId.value, payload)
      showToast('Đã cập nhật trang!', 'success')
    } else {
      await createPage(payload)
      showToast('Đã tạo trang mới!', 'success')
    }
    showDialog.value = false
    await loadPages()
    emit('pages-updated')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    dialogSaving.value = false
  }
}

async function handleDeletePage(page) {
  if (!confirm(`Xóa trang "${page.title}"? Không thể khôi phục!`)) return
  try {
    await deletePage(page.id)
    showToast('Đã xóa trang', 'success')
    await loadPages()
    emit('pages-updated')
  } catch (e) {
    showToast('Lỗi xóa trang: ' + e.message, 'error')
  }
}

async function togglePageStatus(page) {
  try {
    const newStatus = !page.status
    await updatePage(page.id, { status: newStatus })
    showToast(newStatus ? 'Đã xuất bản' : 'Đã chuyển sang nháp', 'success')
    await loadPages()
    emit('pages-updated')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}

onMounted(loadPages)
</script>

<style scoped>
/* ═══════ Page Panel — Inline CMS Management ═══════ */
.pp-add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1.5px dashed var(--color-accent-primary, #6366f1);
  background: none;
  color: var(--color-accent-primary, #6366f1);
  cursor: pointer;
  margin-left: auto;
  transition: all 0.2s;
}
.pp-add-btn:hover {
  background: var(--color-accent-glow, rgba(99,102,241,0.08));
  transform: scale(1.1);
}

.pp-loading {
  padding: 16px;
  text-align: center;
  color: var(--text-3);
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.pp-page-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pp-page-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  background: var(--color-bg-card, #fff);
  transition: all 0.15s;
  gap: 6px;
}
.pp-page-card:hover {
  border-color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99,102,241,0.03));
}

.pp-page-card__info {
  flex: 1;
  min-width: 0;
}
.pp-page-card__title {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-1);
}
.pp-page-card__title span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pp-page-card__slug {
  font-size: 10px;
  color: var(--text-3);
  font-family: monospace;
}

.pp-badge {
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .3px;
  padding: 1px 5px;
  border-radius: 4px;
  flex-shrink: 0;
}
.pp-badge--system {
  background: rgba(251,191,36,.15);
  color: #d97706;
}

.pp-page-card__actions {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
}

.pp-status-dot {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}
.pp-status-dot--active {
  background: rgba(34,197,94,0.15);
  color: #22c55e;
}
.pp-status-dot--draft {
  background: rgba(239,68,68,0.1);
  color: #ef4444;
}
.pp-status-dot:hover {
  transform: scale(1.15);
}

.pp-action-btn {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 5px;
  border: none;
  background: none;
  color: var(--text-3);
  cursor: pointer;
  transition: all 0.15s;
  padding: 0;
}
.pp-action-btn:hover {
  background: var(--color-bg-card-hover, #f1f5f9);
  color: var(--text-1);
}
.pp-action-btn--builder:hover {
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99,102,241,0.08));
}
.pp-action-btn--del:hover {
  color: #ef4444;
  background: rgba(239,68,68,0.08);
}

.pp-empty {
  text-align: center;
  padding: 20px 10px;
  color: var(--text-3);
  font-size: 12px;
}

/* ═══════ Dialog Overlay ═══════ */
.pp-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp-dialog {
  width: 560px;
  max-width: 95vw;
  max-height: 90vh;
  background: var(--bg-1, #fff);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0,0,0,0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pp-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.pp-dialog__header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-1);
}
.pp-dialog__close {
  background: none;
  border: none;
  color: var(--text-3);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}
.pp-dialog__close:hover {
  background: var(--bg-2);
  color: var(--text-1);
}

.pp-dialog__body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

.pp-field {
  margin-bottom: 16px;
}
.pp-field label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 6px;
}

.pp-input {
  width: 100%;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--bg-1);
  color: var(--text-1);
  font-size: 13px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.pp-input:focus {
  border-color: var(--color-accent-primary, #6366f1);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-accent-glow, rgba(99,102,241,0.1));
}
.pp-input:disabled { opacity: .5; cursor: not-allowed; }
.pp-input--title { font-size: 15px; font-weight: 600; padding: 11px 14px; }
.pp-textarea { resize: vertical; min-height: 120px; font-family: monospace; font-size: 12px; }
.pp-textarea--sm { min-height: 50px; font-family: inherit; }

.pp-slug-row {
  display: flex;
}
.pp-slug-prefix {
  padding: 9px 6px 9px 12px;
  font-size: 13px;
  color: var(--text-3);
  border: 1px solid var(--border);
  border-right: none;
  border-radius: 8px 0 0 8px;
  background: var(--bg-2);
  white-space: nowrap;
}
.pp-slug-row .pp-input {
  border-radius: 0 8px 8px 0;
}

/* Page Type Cards */
.pp-type-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.pp-type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 12px;
  border-radius: 10px;
  border: 2px solid var(--border);
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
  background: var(--bg-1);
}
.pp-type-card:hover {
  border-color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99,102,241,0.03));
}
.pp-type-card.active {
  border-color: var(--color-accent-primary, #6366f1);
  background: rgba(99,102,241,0.06);
  box-shadow: 0 0 0 3px var(--color-accent-glow, rgba(99,102,241,0.1));
}
.pp-type-card strong {
  font-size: 12px;
  color: var(--text-1);
}
.pp-type-card span {
  font-size: 10px;
  color: var(--text-3);
}
.pp-type-card svg {
  color: var(--color-accent-primary, #6366f1);
}

/* SEO Details */
.pp-seo-details {
  margin-top: 8px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}
.pp-seo-details summary {
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  cursor: pointer;
  background: var(--bg-2);
  user-select: none;
}
.pp-seo-details summary:hover {
  background: var(--color-bg-card-hover, #f1f5f9);
}
.pp-seo-details[open] > summary { border-bottom: 1px solid var(--border); }
.pp-seo-details .pp-field {
  padding: 12px;
  margin-bottom: 0;
}

/* Dialog Footer */
.pp-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  background: var(--bg-2);
}

.pp-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}
.pp-btn--ghost {
  background: none;
  color: var(--text-2);
  border: 1px solid var(--border);
}
.pp-btn--ghost:hover {
  background: var(--bg-2);
  color: var(--text-1);
}
.pp-btn--primary {
  background: var(--color-accent-primary, #6366f1);
  color: #fff;
}
.pp-btn--primary:hover {
  filter: brightness(1.1);
}
.pp-btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Transitions */
.slide-in-enter-active { transition: all 0.3s ease-out; }
.slide-in-leave-active { transition: all 0.2s ease-in; }
.slide-in-enter-from { opacity: 0; }
.slide-in-enter-from .pp-dialog { transform: scale(0.95) translateY(10px); }
.slide-in-leave-to { opacity: 0; }
.slide-in-leave-to .pp-dialog { transform: scale(0.95) translateY(10px); }

.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
