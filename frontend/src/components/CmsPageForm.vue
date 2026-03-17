<template>
  <div class="cms-form-page">
    <div class="cms-form-page__header">
      <button class="btn-back" @click="goBack">
        <ArrowLeft :size="16" /> Quay lại
      </button>
      <h2>{{ isEditing ? 'Sửa trang CMS' : 'Tạo trang CMS mới' }}</h2>
    </div>

    <div class="cms-form-page__body">
      <div class="cms-form-page__main">
        <!-- Title -->
        <div class="form-group">
          <label>Tiêu đề <span class="required">*</span></label>
          <input v-model="form.title" type="text" placeholder="Nhập tiêu đề trang..." class="input-lg" />
        </div>

        <!-- Alias -->
        <div class="form-group">
          <label>Alias (slug)</label>
          <div class="input-prefix">
            <span class="prefix">/</span>
            <input v-model="form.alias" type="text" placeholder="Tự tạo từ tiêu đề nếu để trống" />
          </div>
        </div>

        <!-- Image -->
        <div class="form-group">
          <label>Hình ảnh (URL)</label>
          <input v-model="form.image" type="text" placeholder="https://..." />
          <div class="image-preview" v-if="form.image">
            <img :src="form.image" alt="Preview" @error="$event.target.style.display='none'" />
          </div>
        </div>

        <!-- Content Mode -->
        <div class="form-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.is_dynamic" />
            <span>Sử dụng Storefront Layout Builder (Kéo thả section)</span>
          </label>

          <div v-if="form.is_dynamic" class="info-box">
            Trang này sẽ được thiết kế bằng Layout Builder. Hãy lưu lại và chuyển sang tab "Bố cục Store" để thiết kế kéo thả.
          </div>

          <div v-else class="form-group" style="margin-top: 12px;">
            <label>Nội dung (HTML)</label>
            <textarea v-model="form.content" rows="18" class="textarea-code" placeholder="<h1>Tiêu đề</h1><p>Nội dung...</p>"></textarea>
          </div>
        </div>
      </div>

      <!-- Side panel -->
      <div class="cms-form-page__sidebar">
        <div class="sidebar-card">
          <h4>Trạng thái</h4>
          <select v-model="form.status">
            <option :value="1">Published</option>
            <option :value="0">Draft</option>
          </select>
        </div>

        <div class="sidebar-card">
          <h4>Thứ tự</h4>
          <input v-model.number="form.sort" type="number" min="0" />
        </div>

        <div class="sidebar-card" v-if="form.image">
          <h4>Xem trước ảnh</h4>
          <img :src="form.image" alt="Preview" class="sidebar-preview-img" @error="$event.target.style.display='none'" />
        </div>

        <!-- Actions -->
        <div class="sidebar-actions">
          <button class="btn-save" @click="handleSave" :disabled="saving">
            <Loader2 v-if="saving" :size="16" class="spin" />
            {{ saving ? 'Đang lưu...' : (isEditing ? 'Cập nhật' : 'Tạo trang') }}
          </button>
          <button class="btn-cancel" @click="goBack">Hủy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { ArrowLeft, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const { fetchPage, createPage, updatePage } = useCmsPages(apiFetch)

const props = defineProps({
  pageId: { type: [String, Number], default: null },
})
const emit = defineEmits(['navigate'])

const isEditing = ref(false)
const saving = ref(false)
const form = ref({
  title: '', alias: '', content: '', image: '',
  status: 1, sort: 0, is_dynamic: false,
})

function goBack() {
  emit('navigate', 'shop/cms')
}

onMounted(async () => {
  if (props.pageId) {
    isEditing.value = true
    try {
      const page = await fetchPage(props.pageId)
      if (page) {
        form.value = {
          title: page.title || '',
          alias: page.alias || '',
          content: page.content || '',
          image: page.image || '',
          status: page.status ?? 1,
          sort: page.sort ?? 0,
          is_dynamic: page.is_dynamic || false,
        }
      }
    } catch (e) {
      showToast('Không tải được trang: ' + e.message, 'error')
    }
  }
})

async function handleSave() {
  if (!form.value.title) return showToast('Nhập tiêu đề', 'error')
  saving.value = true
  try {
    if (isEditing.value && props.pageId) {
      await updatePage(props.pageId, form.value)
      showToast('Đã cập nhật trang', 'success')
    } else {
      await createPage(form.value)
      showToast('Đã tạo trang', 'success')
    }
    goBack()
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cms-form-page {
  padding: 24px 32px;
  max-width: 1200px;
  margin: 0 auto;
}

.cms-form-page__header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.cms-form-page__header h2 {
  margin: 0;
  font-size: 1.25rem;
  color: var(--text-1);
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-2);
  color: var(--text-2);
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s;
}
.btn-back:hover {
  background: var(--bg-3, rgba(255,255,255,0.08));
  color: var(--text-1);
}

.cms-form-page__body {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 24px;
  align-items: start;
}

.cms-form-page__main {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.form-group label {
  font-size: 0.8rem;
  color: var(--text-2);
  font-weight: 600;
}
.required { color: #ef4444; }

.form-group input,
.form-group select {
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-2);
  color: var(--text-1);
  font-size: 0.9rem;
  transition: border-color 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--accent);
}

.input-lg {
  font-size: 1.1rem !important;
  padding: 12px 14px !important;
  font-weight: 600;
}

.input-prefix {
  display: flex;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-2);
}
.input-prefix .prefix {
  padding: 10px 8px 10px 12px;
  color: var(--text-3);
  font-family: monospace;
  font-size: 0.9rem;
  background: var(--bg-3, rgba(255,255,255,0.03));
}
.input-prefix input {
  border: none !important;
  border-radius: 0 !important;
  flex: 1;
  background: transparent !important;
}

.image-preview {
  margin-top: 4px;
}
.image-preview img {
  max-width: 100%;
  max-height: 150px;
  border-radius: 8px;
  object-fit: cover;
}

.checkbox-label {
  display: flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  color: var(--accent) !important;
  font-weight: bold;
}
.checkbox-label input { width: auto; }

.info-box {
  padding: 12px 16px;
  background: var(--color-accent-glow, rgba(59,130,246,0.08));
  border-radius: 8px;
  color: var(--accent);
  font-size: 0.85rem;
  border: 1px solid rgba(59,130,246,0.15);
}

.textarea-code {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-2);
  color: var(--text-1);
  font-size: 0.85rem;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  resize: vertical;
  line-height: 1.6;
  transition: border-color 0.2s;
}
.textarea-code:focus {
  outline: none;
  border-color: var(--accent);
}

/* Sidebar */
.cms-form-page__sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 80px;
}

.sidebar-card {
  padding: 16px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 10px;
}
.sidebar-card h4 {
  margin: 0 0 8px;
  font-size: 0.8rem;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.sidebar-card select,
.sidebar-card input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg-1);
  color: var(--text-1);
  font-size: 0.85rem;
}

.sidebar-preview-img {
  width: 100%;
  border-radius: 8px;
  object-fit: cover;
  max-height: 180px;
}

.sidebar-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-save {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  border: none;
  border-radius: 8px;
  background: var(--accent);
  color: #fff;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: opacity 0.2s;
}
.btn-save:hover { opacity: 0.9; }
.btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-cancel {
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: transparent;
  color: var(--text-2);
  cursor: pointer;
  font-size: 0.85rem;
  text-align: center;
}
.btn-cancel:hover {
  background: var(--bg-3, rgba(255,255,255,0.05));
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .cms-form-page__body {
    grid-template-columns: 1fr;
  }
  .cms-form-page__sidebar {
    position: static;
  }
}
</style>
