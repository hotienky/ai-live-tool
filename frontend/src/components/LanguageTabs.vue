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
      <span v-if="lang.is_default" class="lang-badge">{{ t('admin.msg_3a73b238', 'Gốc') }}</span>
      <span v-else-if="fields && translations" class="lang-completeness" :class="{ done: getCompleteness(lang.code) === 100 }">
        {{ getCompleteness(lang.code) }}%
      </span>
      <span v-if="hasError(lang.code)" class="lang-error">!</span>
    </button>
    <div class="lang-actions" v-if="modelValue && !activeLangIsDefault && baseData && fields">
      <button class="btn-auto-translate" type="button" @click="doAutoTranslate" :disabled="isTranslating" :class="{ translating: isTranslating }">
        <span class="btn-ai-icon">
          <component :is="isTranslating ? 'Loader2' : 'Sparkles'" :size="13" :class="{ 'spin': isTranslating }" />
        </span>
        <span class="btn-ai-text">{{ isTranslating ? t('admin.msg_4d2e51fa', 'Đang dịch...') : t('admin.msg_e96aea8f', 'Dịch tự động') }}</span>
        <span class="btn-ai-badge">AI</span>
        <span class="btn-shimmer"></span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const props = defineProps({
  modelValue: { type: String, required: true },
  errors: { type: Array, default: () => [] }, // array of language codes that have validation errors
  translations: { type: Object, default: () => null }, // The translations object from form.translations
  fields: { type: Array, default: () => null }, // Array of field keys e.g. ['name', 'description']
  baseData: { type: Object, default: () => null }, // The default language values (e.g. form)
})

import { Sparkles, Loader2 } from 'lucide-vue-next'

const emit = defineEmits(['update:modelValue'])

import { ref, watch } from 'vue'
import { useLanguages } from '../composables/useLanguages.js'

const FLAG_MAP = {
  vi: '🇻🇳', en: '🇬🇧', ja: '🇯🇵', ko: '🇰🇷', zh: '🇨🇳',
  fr: '🇫🇷', de: '🇩🇪', es: '🇪🇸', it: '🇮🇹', pt: '🇵🇹',
  ru: '🇷🇺', th: '🇹🇭', id: '🇮🇩', ms: '🇲🇾', ar: '🇸🇦',
}

const { languages: sharedLanguages, loadLanguages } = useLanguages()
loadLanguages() // ensure loaded (cached, safe to call multiple times)

const installedLanguages = ref([])

// Watch the shared reactive languages and sync with flag mapping
watch(sharedLanguages, (langs) => {
  if (!langs || !langs.length) return
  const mapped = langs.map(l => ({
    ...l,
    flag: l.flag || l.icon || FLAG_MAP[l.code] || '🌐',
  }))
  // Move default language to the front
  installedLanguages.value = mapped.sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0))
  if (!props.modelValue && installedLanguages.value.length > 0) {
    emit('update:modelValue', installedLanguages.value[0].code)
  }
}, { immediate: true })

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
      
      const defaultLang = installedLanguages.value.find(l => l.is_default)?.code || 'vi'
      const res = await apiFetch('/languages/auto-translate', {
        method: 'POST',
        body: JSON.stringify({ text, from: defaultLang, to: code })
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
  flex-wrap: wrap;
  gap: 8px;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 24px;
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px 7px 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #ec4899 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  overflow: hidden;
  letter-spacing: 0.02em;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35), inset 0 1px 0 rgba(255,255,255,0.15);
  transition: all 0.25s ease;
}
.btn-auto-translate::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0.0));
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
.btn-auto-translate:hover:not(:disabled) {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5), 0 0 0 3px rgba(168, 85, 247, 0.15);
  filter: brightness(1.08);
}
.btn-auto-translate:active:not(:disabled) {
  transform: translateY(0) scale(0.98);
}
.btn-auto-translate:disabled {
  cursor: not-allowed;
  opacity: 0.75;
}
.btn-ai-icon {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.18);
  border-radius: 50%;
  padding: 3px;
}
.btn-ai-text {
  position: relative;
  z-index: 1;
}
.btn-ai-badge {
  font-size: 9px;
  font-weight: 800;
  background: rgba(255,255,255,0.25);
  border-radius: 6px;
  padding: 1px 5px;
  letter-spacing: 0.08em;
  line-height: 1.5;
}
/* Shimmer sweep */
.btn-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    105deg,
    transparent 30%,
    rgba(255, 255, 255, 0.22) 50%,
    transparent 70%
  );
  background-size: 200% 100%;
  animation: shimmer-sweep 2.8s ease-in-out infinite;
  pointer-events: none;
}
.btn-auto-translate.translating .btn-shimmer {
  animation: shimmer-sweep 1.2s linear infinite;
}
@keyframes shimmer-sweep {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
</style>
