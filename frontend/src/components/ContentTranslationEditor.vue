<template>
  <div class="content-trans" v-if="moduleActive && languages.length > 1">
    <div class="trans-header">
      <Globe :size="15" />
      <span class="trans-label">{{ t('admin.msg_6f17b070', 'Nội dung đa ngôn ngữ') }}</span>
      <span class="trans-badge">{{ languages.length }} ngôn ngữ</span>
    </div>

    <!-- Language Tabs -->
    <div class="trans-tabs">
      <button
        v-for="lang in languages"
        :key="lang.id"
        class="trans-tab"
        :class="{ active: activeLangCode === lang.code }"
        @click="activeLangCode = lang.code"
      >
        <span class="tab-code">{{ lang.code.toUpperCase() }}</span>
        {{ lang.name }}
        <span v-if="lang.is_default" class="tab-default">●</span>
      </button>
    </div>

    <!-- Translation Fields per Language -->
    <div class="trans-fields" v-for="lang in languages" :key="'f-' + lang.code" v-show="activeLangCode === lang.code">
      <div class="trans-field" v-for="field in fields" :key="field.key">
        <label class="trans-field__label">
          {{ field.label }}
          <span v-if="lang.is_default" class="trans-field__hint">{{ t('admin.msg_5feac72d', '(ngôn ngữ mặc định)') }}</span>
          <!-- Auto-translate button (optional) -->
          <button
            v-if="!lang.is_default && getDefaultValue(field.key)"
            class="trans-auto-btn"
            :disabled="translatingKey === `${lang.code}-${field.key}`"
            @click="autoTranslateField(lang, field)"
            title="Dịch tự động từ ngôn ngữ mặc định"
          >
            <Languages :size="12" />
            {{ translatingKey === `${lang.code}-${field.key}` ? t('admin.msg_4d2e51fa', 'Đang dịch...') : t('admin.msg_e96aea8f', 'Dịch tự động') }}
          </button>
        </label>
        <textarea
          v-if="field.type === 'textarea'"
          class="trans-field__input trans-field__textarea"
          :value="getFieldValue(lang.code, field.key)"
          @input="setFieldValue(lang.code, field.key, $event.target.value)"
          :placeholder="getDefaultValue(field.key) || field.label"
          rows="3"
        ></textarea>
        <input
          v-else
          class="trans-field__input"
          :value="getFieldValue(lang.code, field.key)"
          @input="setFieldValue(lang.code, field.key, $event.target.value)"
          :placeholder="getDefaultValue(field.key) || field.label"
        />
      </div>

      <!-- Translate all fields button -->
      <button
        v-if="!lang.is_default && hasDefaultValues"
        class="trans-all-btn"
        :disabled="translatingAll"
        @click="autoTranslateAll(lang)"
      >
        <Languages :size="14" />
        {{ translatingAll ? t('admin.msg_106fa6dd', 'Đang dịch tất cả...') : t('admin.msg_a4970559', 'Dịch tự động tất cả') }}
      </button>
    </div>

    <!-- Save button -->
    <div class="trans-save" v-if="hasChanges">
      <button class="trans-save-btn" @click="saveTranslations" :disabled="saving">
        <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save_translations', 'Lưu bản dịch') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Globe, Save, Languages } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()

const props = defineProps({
  tableName: { type: String, required: true },
  rowId: { type: [Number, String], required: true },
  fields: {
    type: Array,
    required: true,
    // [{ key: 'name', label: t('admin.msg_06245ff0', 'Tên SP'), type: 'text' }, { key: 'description', label: t('admin.msg_e9c02d54', 'Mô tả'), type: 'textarea' }]
  },
  defaultValues: {
    type: Object,
    default: () => ({}),
    // { name: t('admin.msg_5dd9d036', 'Áo thun'), description: t('admin.msg_750a2054', 'Mô tả...') } — values from the base record (default language)
  },
  moduleActive: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['saved'])

const languages = ref([])
const activeLangCode = ref(null)
const translations = ref({}) // { locale: { fieldName: value } }
const originalTranslations = ref({})
const saving = ref(false)
const translatingKey = ref(null)
const translatingAll = ref(false)

// Find default language code
const defaultLangCode = computed(() => {
  const def = languages.value.find(l => l.is_default)
  return def?.code || 'vi'
})

const hasDefaultValues = computed(() => {
  return props.fields.some(f => !!props.defaultValues?.[f.key])
})

const hasChanges = computed(() => {
  return JSON.stringify(translations.value) !== JSON.stringify(originalTranslations.value)
})

function getFieldValue(langCode, fieldKey) {
  return translations.value[langCode]?.[fieldKey] || ''
}

function getDefaultValue(fieldKey) {
  return props.defaultValues?.[fieldKey] || ''
}

function setFieldValue(langCode, fieldKey, value) {
  if (!translations.value[langCode]) translations.value[langCode] = {}
  translations.value[langCode][fieldKey] = value
}

async function loadLanguages() {
  try {
    const res = await apiFetch('/languages')
    const json = await res.json()
    const data = json?.data || json
    languages.value = Array.isArray(data) ? data : []
    if (languages.value.length > 0) {
      const nonDefault = languages.value.find(l => !l.is_default)
      activeLangCode.value = nonDefault?.code || languages.value[0].code
    }
  } catch { languages.value = [] }
}

async function loadTranslations() {
  if (!props.rowId || props.rowId === 'new') return
  try {
    const res = await apiFetch(`/languages/content/${props.tableName}/${props.rowId}`)
    if (!res.ok) return
    const data = await res.json()
    if (data?.grouped) {
      const grouped = Array.isArray(data.grouped) ? {} : data.grouped
      translations.value = JSON.parse(JSON.stringify(grouped))
      originalTranslations.value = JSON.parse(JSON.stringify(grouped))
    }
  } catch (e) {
    console.warn('Could not load translations:', e)
  }
}

async function saveTranslations() {
  saving.value = true
  try {
    const res = await apiFetch(`/languages/content/${props.tableName}/${props.rowId}`, {
      method: 'PUT',
      body: JSON.stringify({ translations: translations.value }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.error || err?.message || 'Server error')
    }
    originalTranslations.value = JSON.parse(JSON.stringify(translations.value))
    showToast(t('admin.msg_a7250d', 'Đã lưu bản dịch'), 'success')
    emit('saved')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu bản dịch: ' + (e?.message || ''), 'error')
  } finally {
    saving.value = false
  }
}

// Auto-translate a single field
async function autoTranslateField(lang, field) {
  const text = getDefaultValue(field.key)
  if (!text) return
  translatingKey.value = `${lang.code}-${field.key}`
  try {
    const res = await apiFetch('/languages/auto-translate', {
      method: 'POST',
      body: JSON.stringify({ text, from: defaultLangCode.value, to: lang.code }),
    })
    const json = await res.json()
    const translated = json?.data?.translated || json?.translated
    if (translated) {
      setFieldValue(lang.code, field.key, translated)
    }
  } catch (e) {
    showToast(t('admin.msg_7c7d29', 'Lỗi dịch tự động'), 'error')
  } finally {
    translatingKey.value = null
  }
}

// Auto-translate all fields for a language
async function autoTranslateAll(lang) {
  translatingAll.value = true
  
  const textsToTranslate = []
  const mappings = []
  
  for (const field of props.fields) {
    const text = getDefaultValue(field.key)
    if (!text) continue
    textsToTranslate.push(text)
    mappings.push(field.key)
  }

  if (textsToTranslate.length > 0) {
    try {
      const res = await apiFetch('/languages/auto-translate-batch', {
        method: 'POST',
        body: JSON.stringify({ texts: textsToTranslate, from: defaultLangCode.value, to: lang.code }),
      })
      const json = await res.json()
      const translatedArray = json?.data?.translated || json?.translated
      
      if (Array.isArray(translatedArray) && translatedArray.length === textsToTranslate.length) {
        for (let i = 0; i < mappings.length; i++) {
          if (translatedArray[i]) {
            setFieldValue(lang.code, mappings[i], translatedArray[i])
          }
        }
        showToast(t('admin.msg_2ec816', 'Đã dịch tự động tất cả'), 'success')
      }
    } catch { 
      showToast(t('admin.msg_7c7d29', 'Lỗi dịch tự động'), 'error')
    }
  }
  
  translatingAll.value = false
}

onMounted(async () => {
  await loadLanguages()
  await loadTranslations()
})

watch(() => props.rowId, async () => {
  await loadTranslations()
})
</script>

<style scoped>
.content-trans {
  margin-top: 20px; padding: 20px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 12px;
}

.trans-header {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px; color: var(--color-text-primary);
}
.trans-label { font-size: 14px; font-weight: 700; }
.trans-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 6px;
  background: var(--color-accent-glow); color: var(--color-accent-primary);
  font-weight: 700;
}

.trans-tabs {
  display: flex; gap: 6px; margin-bottom: 16px;
  border-bottom: 1px solid var(--color-border); padding-bottom: 8px;
}
.trans-tab {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border: 1px solid var(--color-border);
  border-radius: 8px 8px 0 0; background: var(--color-bg-card-solid);
  cursor: pointer; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary); transition: all 0.2s;
}
.trans-tab:hover { color: var(--color-text-primary); }
.trans-tab.active {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}
.tab-code {
  font-size: 10px; font-weight: 800; padding: 1px 6px;
  background: var(--color-bg-card-solid); border-radius: 4px;
  color: var(--color-text-muted); font-family: monospace;
}
.tab-default { color: #f59e0b; font-size: 8px; }

.trans-fields { display: flex; flex-direction: column; gap: 12px; }
.trans-field__label {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 700;
  color: var(--color-text-secondary); margin-bottom: 6px;
}
.trans-field__hint { font-weight: 400; color: var(--color-text-muted); }
.trans-field__input {
  width: 100%; background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border); border-radius: 8px;
  color: var(--color-text-primary); padding: 10px 14px;
  font-size: 13px; font-family: inherit; transition: border-color 0.2s;
  box-sizing: border-box;
}
.trans-field__input:focus { outline: none; border-color: var(--color-accent-primary); }
.trans-field__input::placeholder { color: var(--color-text-muted); }
.trans-field__textarea { resize: vertical; min-height: 60px; }

/* Auto-translate button */
.trans-auto-btn {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 600; cursor: pointer;
  background: rgba(99,102,241,0.08); color: #6366f1;
  border: 1px solid rgba(99,102,241,0.2);
  transition: all 0.2s;
}
.trans-auto-btn:hover { background: rgba(99,102,241,0.15); }
.trans-auto-btn:disabled { opacity: 0.5; cursor: wait; }

.trans-all-btn {
  margin-top: 12px; align-self: flex-start;
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 8px;
  font-size: 12px; font-weight: 700; cursor: pointer;
  background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #fff;
  border: none; box-shadow: 0 4px 12px rgba(99,102,241,0.3);
  transition: all 0.2s;
}
.trans-all-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(99,102,241,0.4); }
.trans-all-btn:disabled { opacity: 0.6; cursor: wait; transform: none; }

.trans-save { display: flex; justify-content: flex-end; margin-top: 16px; }
.trans-save-btn {
  background: var(--color-success, #10b981); color: #fff; border: none;
  padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(16,185,129,0.3);
}
.trans-save-btn:hover { transform: translateY(-1px); }
.trans-save-btn:disabled { opacity: 0.6; cursor: wait; }
</style>
