<template>
  <div class="lang-mgr">
    <h3 class="section-title"><Globe :size="16" /> Quản lý ngôn ngữ ({{ languages.length }})</h3>

    <!-- Add language -->
    <div class="lang-add-row">
      <input v-model="newCode" placeholder="vi" class="lang-input lang-input--code" maxlength="5" />
      <input v-model="newName" placeholder="Tiếng Việt" class="lang-input lang-input--name" />
      <label class="lang-default-check">
        <input type="checkbox" v-model="newIsDefault" /> Mặc định
      </label>
      <button class="lang-add-btn" @click="addLanguage" :disabled="!newCode || !newName">
        <Plus :size="14" /> Thêm
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải...
    </div>

    <!-- Empty -->
    <div v-else-if="languages.length === 0" class="empty-state">
      <Globe :size="36" />
      <p>Chưa có ngôn ngữ nào</p>
      <small>Thêm ngôn ngữ để hỗ trợ đa ngôn ngữ</small>
    </div>

    <!-- Language list -->
    <div v-else class="lang-list">
      <div
        v-for="lang in languages"
        :key="lang.id"
        class="lang-item"
        :class="{ 'lang-item--active': selectedLangId === lang.id }"
      >
        <div class="lang-item__info" @click="selectLanguage(lang)">
          <span class="lang-item__code">{{ lang.code }}</span>
          <span class="lang-item__name">{{ lang.name }}</span>
          <span v-if="lang.isDefault || lang.is_default" class="lang-item__default">Mặc định</span>
        </div>
        <div class="lang-item__actions">
          <button
            v-if="!(lang.isDefault || lang.is_default)"
            class="lang-action-btn"
            @click="setDefault(lang.id)"
            title="Đặt mặc định"
          >
            <Star :size="13" />
          </button>
          <button class="lang-action-btn lang-action-btn--del" @click="deleteLanguage(lang.id)" title="Xóa">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>

    <!-- Translation editor -->
    <div v-if="selectedLangId" class="trans-editor">
      <h4 class="trans-title">
        <FileText :size="14" />
        Bản dịch — {{ selectedLangName }}
        <span class="trans-count">({{ translations.length }} keys)</span>
      </h4>

      <!-- Add translation -->
      <div class="trans-add-row">
        <input v-model="newTransKey" placeholder="translation.key" class="trans-input trans-input--key" />
        <input v-model="newTransValue" placeholder="Giá trị dịch" class="trans-input trans-input--val" />
        <button class="trans-add-btn" @click="addTranslation" :disabled="!newTransKey">
          <Plus :size="13" />
        </button>
      </div>

      <!-- Search -->
      <div class="trans-search">
        <Search :size="13" class="trans-search__icon" />
        <input v-model="transSearch" placeholder="Tìm key hoặc giá trị..." class="trans-search__input" />
      </div>

      <!-- Translation list -->
      <div class="trans-list">
        <div v-for="t in filteredTranslations" :key="t.key" class="trans-item">
          <code class="trans-item__key">{{ t.key }}</code>
          <input
            class="trans-item__value"
            :value="t.value"
            @change="updateTranslation(t.key, $event.target.value)"
          />
        </div>
        <div v-if="filteredTranslations.length === 0" class="trans-empty">
          Không tìm thấy bản dịch nào
        </div>
      </div>

      <!-- Save translations -->
      <div class="trans-actions" v-if="hasTransChanges">
        <button class="trans-save-btn" @click="saveTranslations" :disabled="savingTrans">
          <Save :size="14" /> {{ savingTrans ? 'Đang lưu...' : 'Lưu bản dịch' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Globe, Plus, Trash2, Star, FileText, Search, Save, Loader2 } from 'lucide-vue-next'

const { showToast } = useToast()
const languages = ref([])
const loading = ref(false)
const newCode = ref('')
const newName = ref('')
const newIsDefault = ref(false)

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

const filteredTranslations = computed(() => {
  if (!transSearch.value.trim()) return translations.value
  const q = transSearch.value.toLowerCase()
  return translations.value.filter(t =>
    t.key.toLowerCase().includes(q) || (t.value || '').toLowerCase().includes(q)
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

async function addLanguage() {
  if (!newCode.value || !newName.value) return
  try {
    const res = await apiFetch('/languages', {
      method: 'POST',
      body: JSON.stringify({ code: newCode.value, name: newName.value, is_default: newIsDefault.value }),
    })
    const json = await res.json()
    const lang = json?.data || json
    if (lang && lang.id) {
      await loadLanguages()
      newCode.value = ''
      newName.value = ''
      newIsDefault.value = false
      showToast('Đã thêm ngôn ngữ', 'success')
    }
  } catch (e) {
    showToast('Lỗi thêm ngôn ngữ', 'error')
  }
}

async function deleteLanguage(id) {
  if (!confirm('Xóa ngôn ngữ này?')) return
  try {
    const res = await apiFetch(`/languages/${id}`, { method: 'DELETE' })
    if (res.ok) {
      languages.value = languages.value.filter(l => l.id !== id)
      if (selectedLangId.value === id) {
        selectedLangId.value = null
        translations.value = []
      }
      showToast('Đã xóa ngôn ngữ', 'success')
    }
  } catch (e) {
    showToast('Lỗi xóa', 'error')
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
    showToast('Đã đặt ngôn ngữ mặc định', 'success')
  } catch (e) {
    showToast('Lỗi cập nhật', 'error')
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
  const item = translations.value.find(t => t.key === key)
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
    showToast('Đã lưu bản dịch', 'success')
    hasTransChanges.value = false
    pendingTransChanges.value = {}
  } catch (e) {
    showToast('Lỗi lưu bản dịch', 'error')
  } finally {
    savingTrans.value = false
  }
}

onMounted(() => loadLanguages())
</script>

<style scoped>
.lang-mgr { margin-top:0; }
.section-title { display:flex; align-items:center; gap:8px; font-size:15px; margin:0 0 16px; color:var(--color-text-primary); }

.lang-add-row { display:flex; gap:8px; margin-bottom:16px; align-items:center; flex-wrap:wrap; }
.lang-input {
  background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; color:var(--color-text-primary); padding:9px 14px; font-size:13px;
  transition:border-color 0.2s;
}
.lang-input:focus { outline:none; border-color:var(--color-accent-primary); }
.lang-input::placeholder { color:var(--color-text-muted); }
.lang-input--code { width:80px; text-transform:lowercase; font-family:monospace; }
.lang-input--name { flex:1; min-width:160px; }

.lang-default-check {
  display:flex; align-items:center; gap:6px; font-size:12px;
  color:var(--color-text-muted); cursor:pointer; white-space:nowrap;
}
.lang-default-check input { accent-color:var(--color-accent-primary); }

.lang-add-btn {
  background:var(--accent-gradient); color:#fff; border:none;
  padding:9px 18px; border-radius:8px; font-weight:700; font-size:13px;
  cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  white-space:nowrap; box-shadow:var(--accent-shadow); transition:all 0.2s;
}
.lang-add-btn:hover { transform:translateY(-1px); }
.lang-add-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

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

.lang-item__info { display:flex; align-items:center; gap:10px; flex:1; }
.lang-item__code {
  font-family:monospace; font-size:13px; font-weight:700;
  background:var(--color-bg-card-solid); padding:3px 10px; border-radius:6px;
  color:var(--color-accent-primary); text-transform:uppercase;
}
.lang-item__name { font-size:13px; font-weight:600; color:var(--color-text-primary); }
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
