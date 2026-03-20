<template>
  <div class="currency-input-wrap">
    <input
      ref="inputRef"
      :value="displayValue"
      @input="onInput"
      @blur="onBlur"
      @focus="onFocus"
      type="text"
      inputmode="numeric"
      :placeholder="placeholder"
      :class="inputClass"
    />
    <span v-if="currencySuffix" class="currency-input__suffix">{{ currencySuffix }}</span>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n.js'

const { currentLang } = useI18n()

// Language code → currency symbol mapping
const CURRENCY_MAP = {
  vi: '₫', en: '$', ja: '¥', zh: '¥', ko: '₩',
  th: '฿', fr: '€', de: '€', es: '€', it: '€', pt: 'R$',
  ru: '₽', ar: 'ر.س', hi: '₹', id: 'Rp', ms: 'RM',
}

const props = defineProps({
  modelValue: { type: [Number, String], default: 0 },
  placeholder: { type: String, default: '0' },
  suffix: { type: String, default: '' }, // empty = auto-detect from locale
  locale: { type: String, default: '' }, // explicit locale override (e.g. 'ja', 'en')
  inputClass: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const currencySuffix = computed(() => {
  if (props.suffix) return props.suffix // explicit symbol override
  const lang = props.locale || currentLang.value
  return CURRENCY_MAP[lang] || '₫'
})

const isFocused = ref(false)

function formatNumber(val) {
  if (val === null || val === undefined || val === '') return ''
  const num = typeof val === 'string' ? parseFloat(val.replace(/,/g, '')) : val
  if (isNaN(num)) return ''
  return num.toLocaleString('en-US')
}

function parseNumber(str) {
  if (!str) return 0
  const cleaned = str.replace(/[^0-9.-]/g, '')
  return parseFloat(cleaned) || 0
}

const displayValue = computed(() => {
  if (isFocused.value) {
    const val = props.modelValue
    if (val === 0 || val === '0' || val === null || val === undefined) return ''
    return String(val)
  }
  return formatNumber(props.modelValue)
})

function onInput(e) {
  const raw = e.target.value.replace(/[^0-9.-]/g, '')
  const num = parseFloat(raw) || 0
  emit('update:modelValue', num)
}

function onFocus() {
  isFocused.value = true
}

function onBlur() {
  isFocused.value = false
}
</script>

<style scoped>
.currency-input-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.currency-input-wrap input {
  width: 100%;
  padding-right: 28px;
}
.currency-input__suffix {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--color-text-muted, #6b7280);
  pointer-events: none;
  font-weight: 600;
}
</style>
