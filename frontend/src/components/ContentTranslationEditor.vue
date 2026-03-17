<template>
  <div class="content-trans" v-if="languages.length > 1">
    <div class="trans-header">
      <Globe :size="15" />
      <span class="trans-label">Nội dung đa ngôn ngữ</span>
      <span class="trans-badge">{{ languages.length }} ngôn ngữ</span>
    </div>

    <!-- Language Tabs -->
    <div class="trans-tabs">
      <button
        v-for="lang in languages"
        :key="lang.id"
        class="trans-tab"
        :class="{ active: activeLangId === lang.id }"
        @click="activeLangId = lang.id"
      >
        <span v-if="lang.icon" class="tab-icon">{{ lang.icon }}</span>
        {{ lang.name }}
        <span v-if="lang.is_default" class="tab-default">●</span>
      </button>
    </div>

    <!-- Translation Fields per Language -->
    <div class="trans-fields" v-for="lang in languages" :key="'f-' + lang.id" v-show="activeLangId === lang.id">
      <div class="trans-field" v-for="field in fields" :key="field.key">
        <label class="trans-field__label">
          {{ field.label }}
          <span v-if="lang.is_default" class="trans-field__hint">(ngôn ngữ mặc định)</span>
        </label>
        <textarea
          v-if="field.type === 'textarea'"
          class="trans-field__input trans-field__textarea"
          :value="getFieldValue(lang.id, field.key)"
          @input="setFieldValue(lang.id, field.key, $event.target.value)"
          :placeholder="getDefaultValue(field.key) || field.label"
          rows="3"
        ></textarea>
        <input
          v-else
          class="trans-field__input"
          :value="getFieldValue(lang.id, field.key)"
          @input="setFieldValue(lang.id, field.key, $event.target.value)"
          :placeholder="getDefaultValue(field.key) || field.label"
        />
      </div>
    </div>

    <!-- Save button -->
    <div class="trans-save" v-if="hasChanges">
      <button class="trans-save-btn" @click="saveTranslations" :disabled="saving">
        <Save :size="14" /> {{ saving ? 'Đang lưu...' : 'Lưu bản dịch' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { Globe, Save } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()

const props = defineProps({
  tableName: { type: String, required: true },
  rowId: { type: [Number, String], required: true },
  fields: {
    type: Array,
    required: true,
    // [{ key: 'name', label: 'Tên SP', type: 'text' }, { key: 'description', label: 'Mô tả', type: 'textarea' }]
  },
  defaultValues: {
    type: Object,
    default: () => ({}),
    // { name: 'Áo thun', description: 'Mô tả...' } — values from the base record (default language)
  },
})

const emit = defineEmits(['saved'])

const languages = ref([])
const activeLangId = ref(null)
const translations = ref({}) // { langId: { fieldName: value } }
const originalTranslations = ref({})
const saving = ref(false)

const hasChanges = computed(() => {
  return JSON.stringify(translations.value) !== JSON.stringify(originalTranslations.value)
})

function getFieldValue(langId, fieldKey) {
  return translations.value[langId]?.[fieldKey] || ''
}

function getDefaultValue(fieldKey) {
  return props.defaultValues?.[fieldKey] || ''
}

function setFieldValue(langId, fieldKey, value) {
  if (!translations.value[langId]) translations.value[langId] = {}
  translations.value[langId][fieldKey] = value
}

async function loadLanguages() {
  try {
    const data = await apiFetch('/languages')
    languages.value = Array.isArray(data) ? data.filter(l => l.is_active) : []
    if (languages.value.length > 0) {
      // Default to first non-default language (for editing translations)
      const nonDefault = languages.value.find(l => !l.is_default)
      activeLangId.value = nonDefault?.id || languages.value[0].id
    }
  } catch { languages.value = [] }
}

async function loadTranslations() {
  if (!props.rowId || props.rowId === 'new') return
  try {
    const data = await apiFetch(`/languages/content/${props.tableName}/${props.rowId}`)
    if (data?.grouped) {
      translations.value = JSON.parse(JSON.stringify(data.grouped))
      originalTranslations.value = JSON.parse(JSON.stringify(data.grouped))
    }
  } catch { /* empty */ }
}

async function saveTranslations() {
  saving.value = true
  try {
    await apiFetch(`/languages/content/${props.tableName}/${props.rowId}`, {
      method: 'PUT',
      body: JSON.stringify({ translations: translations.value }),
    })
    originalTranslations.value = JSON.parse(JSON.stringify(translations.value))
    showToast('Đã lưu bản dịch', 'success')
    emit('saved')
  } catch (e) {
    showToast('Lỗi lưu bản dịch', 'error')
  } finally {
    saving.value = false
  }
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
.tab-icon { font-size: 16px; }
.tab-default { color: #f59e0b; font-size: 8px; }

.trans-fields { display: flex; flex-direction: column; gap: 12px; }
.trans-field__label {
  display: block; font-size: 12px; font-weight: 700;
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
