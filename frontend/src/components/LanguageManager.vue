<template>
  <div class="lang-mgr">
    <div class="lang-mgr__header">
      <h3 class="section-title"><Globe :size="16" /> {{ t('admin.language_management', 'Quản lý ngôn ngữ') }} ({{ languages.length }})</h3>
      <button class="lang-sync-btn" @click="syncDefaults" :disabled="syncing">
        <RefreshCw :size="13" :class="{ spin: syncing }" /> {{ syncing ? t('admin.msg_97d2385a', 'Đang đồng bộ...') : t('admin.msg_1c7a3a28', 'Đồng bộ mặc định') }}
      </button>
    </div>

    <!-- Add language -->
    <div class="lang-add-row">
      <div class="lang-select-wrap" v-if="!showSelector">
        <button class="lang-add-btn" @click="showSelector = true" :disabled="availableLanguages.length === 0">
          <Plus :size="14" /> {{ t('admin.add_language', 'Thêm ngôn ngữ') }}
        </button>
        <span v-if="availableLanguages.length === 0" class="lang-hint">{{ t('admin.all_languages_installed', 'Đã cài đặt tất cả ngôn ngữ') }}</span>
      </div>
      <div class="lang-selector" v-else>
        <select v-model="selectedLangCode" class="lang-select">
          <option value="">-- {{ t('admin.choose_language', 'Chọn ngôn ngữ') }} --</option>
          <option v-for="lang in availableLanguages" :key="lang.code" :value="lang.code">
            {{ lang.flag }} {{ lang.name }} ({{ lang.code }})
          </option>
        </select>
        <button class="lang-add-btn" @click="addLanguage" :disabled="!selectedLangCode">
          <Plus :size="14" /> {{ t('admin.add', 'Thêm') }}
        </button>
        <button class="lang-cancel-btn" @click="showSelector = false; selectedLangCode = ''">
          <X :size="14" />
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> {{ t('admin.loading', 'Đang tải...') }}
    </div>

    <!-- Empty -->
    <div v-else-if="languages.length === 0" class="empty-state">
      <Globe :size="36" />
      <p>{{ t('admin.no_languages', 'Chưa có ngôn ngữ nào') }}</p>
      <small>{{ t('admin.add_language_hint', 'Thêm ngôn ngữ để hỗ trợ đa ngôn ngữ') }}</small>
    </div>

    <!-- Language list -->
    <div v-else class="lang-list">
      <div
        v-for="lang in languages"
        :key="lang.id"
        class="lang-item"
        :class="{
          'lang-item--active': selectedLangId === lang.id,
          'lang-item--base': isBase(lang)
        }"
      >
        <div class="lang-item__info" @click="selectLanguage(lang)">
          <span class="lang-item__flag">{{ getFlagEmoji(lang.code) }}</span>
          <span class="lang-item__code">{{ lang.code }}</span>
          <span class="lang-item__name">{{ lang.name }}</span>
          <span v-if="isBase(lang)" class="lang-item__base-badge">
            <Lock :size="10" /> {{ t('admin.base_language', 'Ngôn ngữ gốc') }}
          </span>
        </div>
        <div class="lang-item__actions">
          <button
            v-if="!isBase(lang)"
            class="lang-action-btn"
            @click="setDefault(lang.id)"
            :title="t('admin.set_default', 'Đặt mặc định')"
          >
            <Star :size="13" />
          </button>
          <button
            v-if="!isBase(lang)"
            class="lang-action-btn lang-action-btn--del"
            @click="deleteLanguage(lang.id)"
            :title="t('admin.delete', 'Xóa')"
          >
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Translation editor -->
    <div v-if="selectedLangId" class="trans-editor">
      <h4 class="trans-title">
        <FileText :size="14" />
        {{ t('admin.translations', 'Bản dịch') }} — {{ selectedLangName }}
        <span class="trans-count">({{ translations.length }} keys)</span>
      </h4>

      <!-- Add translation -->
      <div class="trans-add-row">
        <input v-model="newTransKey" placeholder="translation.key" class="trans-input trans-input--key" />
        <input v-model="newTransValue" :placeholder="t('admin.translation_value', 'Giá trị dịch')" class="trans-input trans-input--val" />
        <button class="trans-add-btn" @click="addTranslation" :disabled="!newTransKey">
          <Plus :size="13" />
        </button>
      </div>

      <!-- Search -->
      <div class="trans-search">
        <Search :size="13" class="trans-search__icon" />
        <input v-model="transSearch" :placeholder="t('admin.search_key_value', 'Tìm key hoặc giá trị...')" class="trans-search__input" />
      </div>

      <!-- Translation list -->
      <div class="trans-list">
        <div v-for="tr in filteredTranslations" :key="tr.key" class="trans-item">
          <code class="trans-item__key">{{ tr.key }}</code>
          <input
            class="trans-item__value"
            :value="tr.value"
            @change="updateTranslation(tr.key, $event.target.value)"
          />
        </div>
        <div v-if="filteredTranslations.length === 0" class="trans-empty">
          {{ t('admin.no_translations_found', 'Không tìm thấy bản dịch nào') }}
        </div>
      </div>

      <!-- Save translations -->
      <div class="trans-actions" v-if="hasTransChanges">
        <button class="trans-save-btn" @click="saveTranslations" :disabled="savingTrans">
          <Save :size="14" /> {{ savingTrans ? t('admin.saving', 'Đang lưu...') : t('admin.save_translations', 'Lưu bản dịch') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Globe, Plus, Trash2, Star, FileText, Search, Save, Loader2, X, Lock, RefreshCw } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

function isBase(lang) {
  return lang.is_default || lang.isDefault
}

// All supported languages loaded from DB (for flag lookup)
const allSupportedLanguages = ref([])

const { showToast } = useToast()
const languages = ref([])
const loading = ref(false)
const showSelector = ref(false)
const selectedLangCode = ref('')
const availableLanguages = ref([])

// Translation editor
const selectedLangId = ref(null)
const selectedLangName = ref('')
const translations = ref([])
const transSearch = ref('')
const newTransKey = ref('')
const newTransValue = ref('')
const hasTransChanges = ref(false)
const savingTrans = ref(false)
const pendingTransChanges = ref({})
const syncing = ref(false)

function getFlagEmoji(code) {
  const found = allSupportedLanguages.value.find(l => l.code === code)
  return found?.flag || '🌐'
}

const filteredTranslations = computed(() => {
  if (!transSearch.value.trim()) return translations.value
  const q = transSearch.value.toLowerCase()
  return translations.value.filter(tr =>
    tr.key.toLowerCase().includes(q) || (tr.value || '').toLowerCase().includes(q)
  )
})

async function loadLanguages() {
  loading.value = true
  try {
    const res = await apiFetch('/languages')
    const json = await res.json()
    languages.value = Array.isArray(json) ? json : (json?.data || [])
  } catch (e) {
    console.error('Load languages error:', e)
  } finally {
    loading.value = false
  }
}

async function loadAvailableLanguages() {
  try {
    const res = await apiFetch('/languages/supported')
    const json = await res.json()
    availableLanguages.value = Array.isArray(json) ? json : (json?.data || [])
  } catch (e) {
    console.warn('Failed to load available languages:', e)
    availableLanguages.value = []
  }
}

async function loadAllSupportedLanguages() {
  try {
    const res = await apiFetch('/languages/all-supported')
    const json = await res.json()
    allSupportedLanguages.value = Array.isArray(json) ? json : (json?.data || [])
  } catch (e) {
    console.warn('Failed to load all supported languages:', e)
    allSupportedLanguages.value = []
  }
}

async function addLanguage() {
  if (!selectedLangCode.value) return
  const langInfo = availableLanguages.value.find(l => l.code === selectedLangCode.value)
  if (!langInfo) return

  try {
    const res = await apiFetch('/languages', {
      method: 'POST',
      body: JSON.stringify({ code: langInfo.code, name: langInfo.name }),
    })
    const json = await res.json()
    const lang = json?.data || json
    if (lang && lang.id) {
      await loadLanguages()
      await loadAvailableLanguages()
      selectedLangCode.value = ''
      showSelector.value = false
      showToast(t('admin.language_added', 'Đã thêm ngôn ngữ'), 'success')
    }
  } catch (e) {
    showToast(t('admin.add_language_error', 'Lỗi thêm ngôn ngữ'), 'error')
  }
}

async function deleteLanguage(id) {
  const lang = languages.value.find(l => l.id === id)
  if (lang && isBase(lang)) {
    showToast(t('admin.cannot_delete_base', 'Không thể xóa ngôn ngữ gốc'), 'error')
    return
  }
  if (!confirm(t('admin.confirm_delete_language', 'Xóa ngôn ngữ này?'))) return
  try {
    const res = await apiFetch(`/languages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      languages.value = languages.value.filter(l => l.id !== id)
      if (selectedLangId.value === id) {
        selectedLangId.value = null
        translations.value = []
      }
      await loadAvailableLanguages()
      showToast(t('admin.language_deleted', 'Đã xóa ngôn ngữ'), 'success')
    } else {
      const err = await res.json()
      showToast(err?.message || 'Error', 'error')
    }
  } catch (e) {
    showToast(t('admin.delete_error', 'Lỗi xóa'), 'error')
  }
}

async function setDefault(id) {
  try {
    await apiFetch(`/languages/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ is_default: true }),
    })
    languages.value.forEach(l => {
      l.isDefault = l.id === id
      l.is_default = l.id === id
    })
    showToast(t('admin.default_language_set', 'Đã đặt ngôn ngữ mặc định'), 'success')
  } catch (e) {
    showToast(t('admin.update_error', 'Lỗi cập nhật'), 'error')
  }
}

async function selectLanguage(lang) {
  selectedLangId.value = lang.id
  selectedLangName.value = lang.name
  try {
    const res = await apiFetch(`/languages/${lang.id}/translations`)
    const json = await res.json()
    const data = json?.data || json
    translations.value = Array.isArray(data) ? data : []
    pendingTransChanges.value = {}
    hasTransChanges.value = false
  } catch (e) {
    translations.value = []
  }
}

function updateTranslation(key, value) {
  const item = translations.value.find(tr => tr.key === key)
  if (item) item.value = value
  pendingTransChanges.value[key] = value
  hasTransChanges.value = true
}

function addTranslation() {
  if (!newTransKey.value) return
  translations.value.push({ key: newTransKey.value, value: newTransValue.value })
  pendingTransChanges.value[newTransKey.value] = newTransValue.value
  hasTransChanges.value = true
  newTransKey.value = ''
  newTransValue.value = ''
}

async function saveTranslations() {
  savingTrans.value = true
  try {
    await apiFetch(`/languages/${selectedLangId.value}/translations`, {
      method: 'PUT',
      body: JSON.stringify({ translations: pendingTransChanges.value }),
    })
    showToast(t('admin.translations_saved', 'Đã lưu bản dịch'), 'success')
    hasTransChanges.value = false
    pendingTransChanges.value = {}
  } catch (e) {
    showToast(t('admin.save_translation_error', 'Lỗi lưu bản dịch'), 'error')
  } finally {
    savingTrans.value = false
  }
}

async function syncDefaults() {
  syncing.value = true
  try {
    const res = await apiFetch('/languages/sync-defaults', { method: 'POST' })
    const json = await res.json()
    const data = json?.data || json
    const total = Object.values(data).reduce((a, b) => a + b, 0)
    if (total > 0) {
      showToast(t('admin.msg_synced', 'Đã đồng bộ') + ` ${total} translations`, 'success')
      // Reload translations if a language is selected
      if (selectedLangId.value) {
        const lang = languages.value.find(l => l.id === selectedLangId.value)
        if (lang) await selectLanguage(lang)
      }
    } else {
      showToast(t('admin.msg_865009', 'Tất cả translations đã được đồng bộ'), 'info')
    }
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' đồng bộ: ' + e.message, 'error')
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  await loadLanguages()
  await Promise.all([loadAvailableLanguages(), loadAllSupportedLanguages()])
})
</script>

<style scoped>
.lang-mgr { margin-top:0; }
.lang-mgr__header { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.section-title { display:flex; align-items:center; gap:8px; font-size:15px; margin:0; color:var(--color-text-primary); }
.lang-sync-btn {
  background:none; border:1px solid var(--color-border); border-radius:8px;
  padding:7px 14px; font-size:12px; cursor:pointer;
  color:var(--color-text-muted); display:inline-flex; align-items:center; gap:5px;
  transition:all 0.2s;
}
.lang-sync-btn:hover { border-color:var(--color-accent-primary); color:var(--color-accent-primary); }
.lang-sync-btn:disabled { opacity:0.5; cursor:wait; }

.lang-add-row { margin-bottom:16px; }
.lang-select-wrap { display:flex; align-items:center; gap:10px; }
.lang-hint { font-size:12px; color:var(--color-text-muted); }

.lang-selector { display:flex; gap:8px; align-items:center; }
.lang-select {
  flex:1; min-width:260px; background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; color:var(--color-text-primary); padding:9px 14px; font-size:13px;
  cursor:pointer; transition:border-color 0.2s; appearance:auto;
}
.lang-select:focus { outline:none; border-color:var(--color-accent-primary); }

.lang-add-btn {
  background:var(--accent-gradient); color:#fff; border:none;
  padding:9px 18px; border-radius:8px; font-weight:700; font-size:13px;
  cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  white-space:nowrap; box-shadow:var(--accent-shadow); transition:all 0.2s;
}
.lang-add-btn:hover { transform:translateY(-1px); }
.lang-add-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

.lang-cancel-btn {
  background:none; border:1px solid var(--color-border); border-radius:8px;
  padding:9px 12px; cursor:pointer; color:var(--color-text-muted); transition:all 0.15s;
}
.lang-cancel-btn:hover { border-color:var(--color-text-muted); color:var(--color-text-primary); }

/* Language list */
.lang-list { display:flex; flex-direction:column; gap:6px; margin-bottom:20px; }
.lang-item {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:12px 16px; border-radius:10px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  cursor:pointer; transition:all 0.2s;
}
.lang-item:hover { border-color:var(--color-border-hover); }
.lang-item--active { border-color:var(--color-accent-primary); background: var(--color-accent-glow); }
.lang-item--base { border-left:3px solid var(--color-accent-primary); }

.lang-item__info { display:flex; align-items:center; gap:10px; flex:1; }
.lang-item__flag { font-size:18px; line-height:1; }
.lang-item__code {
  font-family:monospace; font-size:13px; font-weight:700;
  background:var(--color-bg-card-solid); padding:3px 10px; border-radius:6px;
  color:var(--color-accent-primary); text-transform:uppercase;
}
.lang-item__name { font-size:13px; font-weight:600; color:var(--color-text-primary); }
.lang-item__base-badge {
  font-size:10px; padding:2px 8px; border-radius:6px; font-weight:700;
  background:var(--color-accent-glow); color:var(--color-accent-primary);
  display:inline-flex; align-items:center; gap:3px;
}
.lang-item__default {
  font-size:10px; padding:2px 8px; border-radius:6px; font-weight:700;
  background:rgba(245,158,11,0.12); color:#f59e0b;
}

.lang-item__actions { display:flex; gap:6px; }
.lang-action-btn {
  background:none; border:1px solid var(--color-border); border-radius:6px;
  padding:4px 6px; cursor:pointer; color:var(--color-text-muted); transition:all 0.15s;
}
.lang-action-btn:hover { border-color:var(--color-accent-primary); color:var(--color-accent-primary); }
.lang-action-btn--del:hover { border-color:#ef4444; color:#ef4444; }

/* Translation editor */
.trans-editor {
  margin-top:16px; padding-top:16px; border-top:1px solid var(--color-border);
}
.trans-title { display:flex; align-items:center; gap:6px; font-size:14px; margin:0 0 12px; color:var(--color-text-primary); }
.trans-count { font-size:12px; color:var(--color-text-muted); font-weight:400; }

.trans-add-row { display:flex; gap:6px; margin-bottom:10px; }
.trans-input {
  background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; color:var(--color-text-primary); padding:8px 12px; font-size:12px;
}
.trans-input:focus { outline:none; border-color:var(--color-accent-primary); }
.trans-input::placeholder { color:var(--color-text-muted); }
.trans-input--key { width:200px; font-family:monospace; }
.trans-input--val { flex:1; }
.trans-add-btn {
  background:var(--accent-gradient); color:#fff; border:none;
  padding:8px 12px; border-radius:8px; cursor:pointer; display:flex; align-items:center;
}
.trans-add-btn:disabled { opacity:0.5; }

.trans-search { position:relative; margin-bottom:10px; }
.trans-search__icon { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--color-text-muted); }
.trans-search__input {
  width:100%; background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; padding:8px 12px 8px 32px; color:var(--color-text-primary); font-size:12px;
}
.trans-search__input:focus { outline:none; border-color:var(--color-accent-primary); }
.trans-search__input::placeholder { color:var(--color-text-muted); }

.trans-list { max-height:360px; overflow-y:auto; display:flex; flex-direction:column; gap:4px; }
.trans-item { display:flex; align-items:center; gap:8px; padding:4px 0; }
.trans-item__key {
  flex:0 0 200px; font-size:11px; color:var(--color-text-muted);
  font-family:monospace; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
.trans-item__value {
  flex:1; background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:6px; padding:6px 10px; color:var(--color-text-primary); font-size:12px;
}
.trans-item__value:focus { outline:none; border-color:var(--color-accent-primary); }
.trans-empty { padding:20px; text-align:center; color:var(--color-text-muted); font-size:13px; }

.trans-actions { margin-top:12px; display:flex; justify-content:flex-end; }
.trans-save-btn {
  background:var(--color-success,#10b981); color:#fff; border:none;
  padding:10px 24px; border-radius:8px; font-weight:700; font-size:13px;
  cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  transition:all 0.2s; box-shadow:0 4px 12px rgba(16,185,129,0.3);
}
.trans-save-btn:hover { transform:translateY(-1px); }
.trans-save-btn:disabled { opacity:0.6; cursor:wait; }

.loading-state,.empty-state {
  display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:40px 20px; color:var(--color-text-muted); text-align:center;
}
.empty-state p { font-size:14px; font-weight:600; color:var(--color-text-secondary); margin:0; }
.empty-state small { font-size:12px; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
