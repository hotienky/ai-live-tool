<template>
  <div class="store-info-panel">
    <h3 class="settings__panel-title"><Store :size="16" style="vertical-align:middle" /> {{ t('admin.msg_e9a1b334', 'Thông tin cửa hàng') }}</h3>
    <p class="settings__panel-desc">Cấu hình thông tin cơ bản, liên hệ và mạng xã hội cho cửa hàng của bạn. Thông tin này sẽ được hiển thị ở Footer và các trang liên hệ.</p>

    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" />{{ t('admin.msg_54033c7f', 'Đang tải dữ liệu...') }}</div>

    <div v-else class="si-content">
      <LanguageTabs v-model="currentLang" style="margin-bottom: 24px" :translations="form.translations" :fields="['shop_name', 'address', 'contact_email', 'contact_phone', 'contact_time']" :baseData="form" />

      <!-- Cơ bản -->
      <div class="si-section">
        <h4 class="si-section-title">{{ t('admin.msg_41100f72', 'Thông tin cơ bản') }}</h4>
        <div class="si-grid">
          <div class="settings__section">
            <label class="settings__field-label">{{ t('admin.store_name', 'Tên cửa hàng') }}</label>
            <input v-model="fShopName" type="text" class="swp-input" placeholder="VD: Fashion VN" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">{{ t('admin.msg_9cc5bbbf', 'Slogan / Tagline (Ngành nghề)') }}</label>
            <input v-model="fShopTagline" type="text" class="swp-input" :placeholder="t('admin.msg_f30c7a', 'VD: Chuyên sỉ lẻ quần áo / Thế giới đồ chơi / Đồ ăn vặt')" />
            <small class="si-help">{{ t('admin.msg_2d113f22', 'Mô tả ngắn về ngành nghề hoặc slogan của bạn để tự động thích ứng với trang web.') }}</small>
          </div>
          <div class="settings__section" style="grid-column: 1 / -1;">
            <label class="settings__field-label">{{ t('admin.msg_2615276a', 'Mô tả cửa hàng') }}</label>
            <textarea v-model="fDescription" class="swp-input" rows="3" :placeholder="t('admin.msg_216ffc', 'VD: Chuyên cung cấp quần áo thời trang chất lượng cao với mức giá hợp lý...')"></textarea>
            <small class="si-help">{{ t('admin.msg_776d179b', 'Mô tả ngắn về cửa hàng, hiển thị ở Footer và SEO meta.') }}</small>
          </div>
          <div class="settings__section" style="grid-column: 1 / -1;">
            <label class="settings__field-label">Logo</label>
            <MediaPicker v-model="form.logo" :placeholder="t('admin.msg_2204d8', 'Chọn hoặc nhập URL hình ảnh...')" accept="image/*" />
            <small class="si-help">{{ t('admin.msg_4f75c40f', 'Cung cấp đường dẫn tới hình ảnh logo của bạn.') }}</small>
          </div>
        </div>
      </div>

      <!-- Liên hệ -->
      <div class="si-section">
        <h4 class="si-section-title">{{ t('admin.msg_9253b4a4', 'Thông tin liên hệ') }}</h4>
        <div class="si-grid">
          <div class="settings__section">
            <label class="settings__field-label">{{ t('admin.phone', 'Số điện thoại') }}</label>
            <input v-model="form.phone" type="text" class="swp-input" placeholder="VD: 0912 345 678" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">{{ t('admin.msg_9034770f', 'Email hỗ trợ') }}</label>
            <input v-model="form.email" type="email" class="swp-input" placeholder="VD: support@shop.com" />
          </div>
          <div class="settings__section" style="grid-column: 1 / -1;">
            <label class="settings__field-label">{{ t('admin.address', 'Địa chỉ') }}</label>
            <input v-model="fAddress" type="text" class="swp-input" :placeholder="t('admin.msg_c3f171', 'VD: 123 Đường A, Quận B, TP. C')" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">{{ t('admin.msg_db2974eb', 'Giờ làm việc') }}</label>
            <input v-model="fWorkingHours" type="text" class="swp-input" placeholder="VD: 8:00 - 21:00 (T2 - CN)" />
          </div>
        </div>
      </div>

      <!-- Mạng xã hội -->
      <div class="si-section">
        <h4 class="si-section-title">{{ t('admin.msg_0f1252b7', 'Mạng xã hội') }}</h4>
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
            <label class="settings__field-label">{{ t('admin.msg_435da1db', 'Zalo (SĐT hoặc Zalo.me)') }}</label>
            <input v-model="form.zalo" type="text" class="swp-input" placeholder="VD: 0912345678" />
          </div>
          <div class="settings__section">
            <label class="settings__field-label">Copyright (Footer)</label>
            <input v-model="fCopyright" type="text" class="swp-input" :placeholder="t('admin.msg_fa7d3b', 'VD: © 2026 Shop. Bản quyền thuộc về...')" />
          </div>
        </div>
      </div>

      <div class="si-actions">
        <button class="btn-create" @click="save" :disabled="saving">
          <Save :size="16" /> {{ saving ? t('admin.saving', 'Đang lưu...') : 'Lưu thông tin' }}
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
import MediaPicker from './MediaPicker.vue'
import LanguageTabs from './LanguageTabs.vue'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()

const loading = ref(true)
const saving = ref(false)

const form = ref({
  shop_name: '',
  shop_tagline: '',
  description: '',
  logo: '',
  phone: '',
  email: '',
  address: '',
  working_hours: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  zalo: '',
  copyright: '',
  translations: {}
})

const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'
const { tField } = useContentTranslations(form, currentLang)

const fShopName = tField('shop_name')
const fShopTagline = tField('shop_tagline')
const fDescription = tField('description')
const fAddress = tField('address')
const fWorkingHours = tField('working_hours')
const fCopyright = tField('copyright')

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
      if (k !== 'translations' && map[k] !== undefined) form.value[k] = map[k]
    })
    
    // Load translations
    const transRes = await apiFetch(`/languages/content/configs/store`)
    if (transRes.ok) {
      const transData = await transRes.json()
      if (transData?.grouped) {
        form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
      }
    }
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
    const { translations, ...baseForm } = form.value
    const items = Object.entries(baseForm).map(([key, value]) => ({ key, value: String(value ?? '') }))
    
    // Save base config
    const res = await apiFetch('/system-config/group/store', {
      method: 'PUT',
      body: JSON.stringify({ items })
    })
    if (!res.ok) throw new Error('Save failed')

    // Save translations
    await apiFetch('/languages/content/configs/store', {
      method: 'POST',
      body: JSON.stringify({ translations: translations || {} })
    })

    showToast(t('admin.msg_373752', 'Đã lưu thông tin cửa hàng'), 'success')
  } catch (e) {
    console.error('Failed to save store info:', e)
    showToast(t('admin.msg_95d254', 'Lỗi khi lưu thông tin'), 'error')
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
  box-shadow: 0 0 0 2px var(--color-accent-glow);
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
