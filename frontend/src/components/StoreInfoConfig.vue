<template>
  <div class="store-info-panel">
    <h3 class="settings__panel-title"><Store :size="16" style="vertical-align:middle" /> Thông tin cửa hàng</h3>
    <p class="settings__panel-desc">Cấu hình thông tin cơ bản, liên hệ và mạng xã hội cho cửa hàng của bạn. Thông tin này sẽ được hiển thị ở Footer và các trang liên hệ.</p>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải dữ liệu...
    </div>

    <div v-else class="si-content">
      <!-- Cơ bản -->
      <div class="si-section">
        <h4 class="si-section-title">Thông tin cơ bản</h4>
        <div class="si-grid">
          <div class="settings__section">
            <label class="settings__field-label">Tên cửa hàng</label>
            <input v-model="form.shop_name" type="text" class="swp-input" placeholder="VD: Fashion VN" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Slogan / Tagline (Ngành nghề)</label>
            <input v-model="form.shop_tagline" type="text" class="swp-input" placeholder="VD: Chuyên sỉ lẻ quần áo / Thế giới đồ chơi / Đồ ăn vặt" />
            <small class="si-help">Mô tả ngắn về ngành nghề hoặc slogan của bạn để tự động thích ứng với trang web.</small>
          </div>
          <div class="settings__section" style="grid-column: 1 / -1;">
            <label class="settings__field-label">Logo URL</label>
            <div class="si-logo-row">
              <img v-if="form.logo" :src="form.logo" class="si-logo-preview" alt="Logo preview" />
              <div v-else class="si-logo-empty"><Image :size="24" /></div>
              <input v-model="form.logo" type="text" class="swp-input" placeholder="https://vd.com/logo.png" style="flex:1" />
            </div>
            <small class="si-help">Cung cấp đường dẫn tới hình ảnh logo của bạn.</small>
          </div>
        </div>
      </div>

      <!-- Liên hệ -->
      <div class="si-section">
        <h4 class="si-section-title">Thông tin liên hệ</h4>
        <div class="si-grid">
          <div class="settings__section">
            <label class="settings__field-label">Số điện thoại</label>
            <input v-model="form.phone" type="text" class="swp-input" placeholder="VD: 0912 345 678" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Email hỗ trợ</label>
            <input v-model="form.email" type="email" class="swp-input" placeholder="VD: support@shop.com" />
          </div>
          <div class="settings__section" style="grid-column: 1 / -1;">
            <label class="settings__field-label">Địa chỉ</label>
            <input v-model="form.address" type="text" class="swp-input" placeholder="VD: 123 Đường A, Quận B, TP. C" />
          </div>
        </div>
      </div>

      <!-- Mạng xã hội -->
      <div class="si-section">
        <h4 class="si-section-title">Mạng xã hội</h4>
        <div class="si-grid">
          <div class="settings__section">
            <label class="settings__field-label">Facebook</label>
            <input v-model="form.facebook" type="text" class="swp-input" placeholder="https://facebook.com/..." />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Instagram</label>
            <input v-model="form.instagram" type="text" class="swp-input" placeholder="https://instagram.com/..." />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">TikTok</label>
            <input v-model="form.tiktok" type="text" class="swp-input" placeholder="https://tiktok.com/@..." />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">YouTube</label>
            <input v-model="form.youtube" type="text" class="swp-input" placeholder="https://youtube.com/c/..." />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Zalo (SĐT hoặc Zalo.me)</label>
            <input v-model="form.zalo" type="text" class="swp-input" placeholder="VD: 0912345678" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Copyright (Footer)</label>
            <input v-model="form.copyright" type="text" class="swp-input" placeholder="VD: © 2026 Shop. Bản quyền thuộc về..." />
          </div>
        </div>
      </div>

      <div class="si-actions">
        <button class="btn-create" @click="save" :disabled="saving">
          <Save :size="16" /> {{ saving ? 'Đang lưu...' : 'Lưu thông tin' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Store, Save, Loader2, Image } from 'lucide-vue-next'

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  shop_name: '',
  shop_tagline: '',
  logo: '',
  phone: '',
  email: '',
  address: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  zalo: '',
  copyright: '',
})

async function loadData() {
  loading.value = true
  try {
    const res = await apiFetch('/system-config/group/store')
    const configs = await res.json()  // [{id, key, group_name, value}, ...]
    const rows = Array.isArray(configs) ? configs : (configs?.data || [])

    // Convert array of {key, value} to object
    const map = {}
    rows.forEach(c => { map[c.key] = c.value })

    // Assign to form
    Object.keys(form.value).forEach(k => {
      if (map[k] !== undefined) form.value[k] = map[k]
    })
  } catch (e) {
    console.error('Failed to load store info:', e)
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    // Backend updateGroup expects: {items: [{key, value}, ...]}
    const items = Object.entries(form.value).map(([key, value]) => ({ key, value: String(value ?? '') }))
    const res = await apiFetch('/system-config/group/store', {
      method: 'PUT',
      body: JSON.stringify({ items })
    })
    if (!res.ok) throw new Error('Save failed')
    showToast('Đã lưu thông tin cửa hàng', 'success')
  } catch (e) {
    console.error('Failed to save store info:', e)
    showToast('Lỗi khi lưu thông tin', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.store-info-panel {
  padding-bottom: 40px;
}

.settings__panel-desc {
  color: var(--color-text-muted);
  font-size: 13px;
  margin-bottom: 24px;
}

.si-section {
  background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.si-section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.si-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.settings__section { margin-bottom: 0; }

.swp-input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 13px;
  transition: all 0.2s;
}

.swp-input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.1);
}

.swp-input::placeholder { color: var(--color-text-muted); }

.si-help {
  display: block;
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 6px;
}

.si-logo-row {
  display: flex; gap: 12px; align-items: center;
}

.si-logo-preview {
  width: 48px; height: 48px; border-radius: 8px; object-fit: contain;
  background: var(--color-bg-primary); border: 1px solid var(--color-border);
}

.si-logo-empty {
  width: 48px; height: 48px; border-radius: 8px;
  background: var(--color-bg-primary); border: 1px dashed var(--color-border);
  display: flex; align-items: center; justify-content: center;
  color: var(--color-text-muted);
}

.si-actions {
  display: flex; justify-content: flex-end;
  margin-top: 16px;
}

/* btn-create is provided by style.css globally */

.loading-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 60px 0; color: var(--color-text-muted); gap: 12px; height: 300px;
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .si-grid { grid-template-columns: 1fr; }
}
</style>
