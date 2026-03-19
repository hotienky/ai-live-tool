<template>
  <div class="language-tabs">
    <button
      v-for="lang in installedLanguages"
      :key="lang.code"
      type="button"
      class="lang-tab"
      :class="{ active: modelValue === lang.code }"
      @click="$emit('update:modelValue', lang.code)"
    >
      <span class="lang-flag">{{ lang.flag || '🌐' }}</span>
      <span class="lang-name">{{ lang.name }}</span>
      <span v-if="lang.is_default || lang.code === 'vi'" class="lang-badge">Gốc</span>
      <span v-else-if="fields && translations" class="lang-completeness" :class="{ done: getCompleteness(lang.code) === 100 }">
        {{ getCompleteness(lang.code) }}%
      </span>
      <span v-if="hasError(lang.code)" class="lang-error">!</span>
    </button>
    <div class="lang-actions" v-if="modelValue && !activeLangIsDefault && baseData && fields">
      <button class="btn-auto-translate" type="button" @click="doAutoTranslate" :disabled="isTranslating">
        <component :is="isTranslating ? 'Loader2' : 'Sparkles'" :size="14" :class="{ 'spin': isTranslating }" />
        {{ isTranslating ? 'Đang dịch...' : 'Dịch tự động' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'

const props = defineProps({
  modelValue: { type: String, required: true },
  errors: { type: Array, default: () => [] }, // array of language codes that have validation errors
  translations: { type: Object, default: () => null }, // The translations object from form.translations
  fields: { type: Array, default: () => null }, // Array of field keys e.g. ['name', 'description']
  baseData: { type: Object, default: () => null }, // The default language values (e.g. form)
})

import { Sparkles, Loader2 } from 'lucide-vue-next'

const emit = defineEmits(['update:modelValue'])

import { ref } from 'vue'
const installedLanguages = ref([])

onMounted(async () => {
  try {
    const res = await apiFetch('/languages')
    const json = await res.json()
    const data = Array.isArray(json) ? json : (json?.data || [])
    // Move default language to the front
    installedLanguages.value = data.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
    if (!props.modelValue && installedLanguages.value.length > 0) {
      emit('update:modelValue', installedLanguages.value[0].code)
    }
  } catch (e) {
    console.error('Failed to load languages in LanguageTabs', e)
  }
})

function hasError(code) {
  return props.errors.includes(code)
}

const activeLangIsDefault = computed(() => {
  const active = installedLanguages.value.find(l => l.code === props.modelValue)
  return active ? active.is_default : false
})

function getCompleteness(code) {
  if (!props.fields) return 0;
  // For default language, check baseData directly (form.name, form.description, etc.)
  const isDefault = installedLanguages.value.find(l => l.code === code)?.is_default
  let count = 0;
  for (const f of props.fields) {
    if (isDefault) {
      // Default language values live directly on the form object (baseData)
      if (props.baseData && props.baseData[f] && String(props.baseData[f]).trim()) count++;
    } else {
      // Non-default languages live in translations[code]
      const vals = props.translations?.[code] || {};
      if (vals[f] && String(vals[f]).trim()) count++;
    }
  }
  return props.fields.length ? Math.round((count / props.fields.length) * 100) : 0;
}

const isTranslating = ref(false);
async function doAutoTranslate() {
  if (!props.baseData || !props.fields || !props.translations) return;
  const code = props.modelValue;
  isTranslating.value = true;
  try {
    for (const f of props.fields) {
      const text = props.baseData[f];
      if (!text || !String(text).trim()) continue;
      
      const res = await apiFetch('/languages/auto-translate', {
        method: 'POST',
        body: JSON.stringify({ text, from: 'vi', to: code })
      })
      const data = await res.json()
      if (data?.translated) {
        if (!props.translations[code]) props.translations[code] = {}
        props.translations[code][f] = data.translated;
      }
    }
  } catch (e) {
    console.error('Translation failed', e)
  } finally {
    isTranslating.value = false;
  }
}
</script>

<style scoped>
.language-tabs {
  display: flex;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
  overflow-x: auto;
  align-items: flex-end; /* Align tabs to the bottom border */
}
.lang-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px; /* Overlap the container's border */
}
.lang-tab:hover {
  color: var(--color-text-primary);
}
.lang-tab.active {
  color: var(--color-accent-primary);
  font-weight: 600;
  border-bottom: 2px solid var(--color-accent-primary);
}
.lang-flag {
  font-size: 16px;
}
.lang-badge {
  font-size: 10px;
  background: var(--color-accent-glow);
  color: var(--color-accent-primary);
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 700;
}
.lang-error {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--color-danger);
  color: white;
  border-radius: 50%;
  font-size: 11px;
  font-weight: bold;
}
.lang-completeness {
  font-size: 11px;
  font-weight: 700;
  background: var(--color-bg-secondary, #f1f5f9);
  padding: 2px 6px;
  border-radius: 12px;
  color: var(--color-text-secondary);
  margin-left: 2px;
}
.lang-completeness.done {
  background: var(--color-success, #10b981);
  color: #fff;
}
.lang-actions {
  display: flex;
  margin-left: auto;
  align-items: center;
  padding-bottom: 8px;
}
.btn-auto-translate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--color-accent-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}
.btn-auto-translate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  filter: brightness(1.05);
}
.btn-auto-translate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
