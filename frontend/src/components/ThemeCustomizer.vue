<template>
  <div class="theme-customizer">
    <div class="tc-header">
      <Palette :size="18" />
      <h3 class="tc-title">{{ t('admin.msg_b85df848', 'Tuỳ chỉnh giao diện Cửa Hàng') }}</h3>
      <span class="tc-subtitle">{{ t('admin.msg_6556e1b8', 'Chọn màu nhấn → tất cả màu sẽ tự động điều chỉnh') }}</span>
    </div>

    <!-- Accent Color Presets -->
    <section class="tc-section">
      <h4 class="tc-section__title"><Sparkles :size="14" /> {{ t('admin.msg_232a7945', 'Màu nhấn') }}</h4>
      <div class="tc-accent-grid">
        <button
          v-for="preset in accentPresets" :key="preset.name"
          class="tc-accent-btn"
          :class="{ active: form.dark.accent === preset.dark }"
          @click="applyAccentPreset(preset)"
          :title="preset.name"
        >
          <span class="tc-accent-btn__swatch" :style="{ background: preset.dark }"></span>
          <span class="tc-accent-btn__label">{{ preset.name }}</span>
        </button>
      </div>

      <!-- Custom color picker -->
      <div class="tc-custom-color">
        <label class="tc-label">{{ t('admin.msg_b9036bc1', 'Hoặc chọn màu tùy ý:') }}</label>
        <div class="tc-color-group">
          <input type="color" v-model="customAccent" @input="applyCustomAccent" class="tc-color" />
          <input type="text" v-model="customAccent" @change="applyCustomAccent" class="tc-color-text" maxlength="7" />
        </div>
      </div>

      <!-- Suggested complementary colors -->
      <div v-if="suggestedColors.length" class="tc-suggestions">
        <span class="tc-suggestions__label">{{ t('admin.msg_3733cef1', 'Gợi ý màu phối hợp:') }}</span>
        <div class="tc-suggestions__list">
          <button
            v-for="(c, i) in suggestedColors" :key="i"
            class="tc-suggestion-dot"
            :style="{ background: c.hex }"
            :title="c.label"
            @click="applySuggestion(c.hex)"
          ></button>
        </div>
      </div>

      <!-- Preview both modes -->
      <div class="tc-mode-preview">
        <div class="tc-mode-preview__card" style="background: #0a0a0f">
          <div class="tc-mode-preview__dot" :style="{ background: form.dark.accent }"></div>
          <span style="color:#f0f0f5; font-size:11px; font-weight:600">Dark</span>
        </div>
        <div class="tc-mode-preview__card" style="background: #f8f9fc">
          <div class="tc-mode-preview__dot" :style="{ background: form.light.accent }"></div>
          <span style="color:#1a1a2e; font-size:11px; font-weight:600">Light</span>
        </div>
      </div>
    </section>

    <!-- Theme Presets -->
    <section class="tc-section">
      <h4 class="tc-section__title"><LayoutGrid :size="14" /> {{ t('admin.msg_1e9067ab', 'Bộ giao diện') }}</h4>
      <div class="tc-presets">
        <button
          v-for="preset in themePresets" :key="preset.key"
          class="tc-preset"
          :class="{ active: form.preset === preset.key }"
          @click="applyThemePreset(preset)"
        >
          <div class="tc-preset__preview" :style="presetPreviewStyle(preset)">
            <div class="tc-preset__dot" :style="{ background: preset.dark.accent }"></div>
          </div>
          <span class="tc-preset__name">{{ preset.name }}</span>
        </button>
      </div>
    </section>

    <!-- Typography -->
    <section class="tc-section">
      <h4 class="tc-section__title"><Type :size="14" /> {{ t('admin.msg_d3d86c3a', 'Font chữ') }}</h4>
      <div class="tc-row">
        <label class="tc-label">Font Family</label>
        <select v-model="form.font" class="tc-select">
          <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
        </select>
      </div>
    </section>

    <!-- Layout -->
    <section class="tc-section">
      <h4 class="tc-section__title"><LayoutGrid :size="14" /> {{ t('admin.msg_bb9e2508', 'Bố cục') }}</h4>
      <div class="tc-row">
        <label class="tc-label">{{ t('admin.msg_02097c07', 'Bo góc') }} ({{ form.radius }}px)</label>
        <input type="range" v-model="form.radius" min="4" max="24" class="tc-range" />
      </div>
      <div class="tc-row">
        <label class="tc-label">{{ t('admin.msg_1ab99d45', 'Kiểu card') }}</label>
        <div class="tc-btn-group">
          <button
            v-for="s in cardStyles" :key="s.key"
            class="tc-btn-option"
            :class="{ active: form.card_style === s.key }"
            @click="form.card_style = s.key"
          >{{ s.label }}</button>
        </div>
      </div>
    </section>

    <!-- Default Mode -->
    <section class="tc-section">
      <h4 class="tc-section__title"><Moon :size="14" /> {{ t('admin.msg_fc1bf9f1', 'Chế độ mặc định') }}</h4>
      <div class="tc-btn-group tc-btn-group--wide">
        <button class="tc-btn-option" :class="{ active: form.mode === 'dark' }" @click="form.mode = 'dark'">
          <Moon :size="13" />{{ t('admin.dark', 'Tối') }}</button>
        <button class="tc-btn-option" :class="{ active: form.mode === 'light' }" @click="form.mode = 'light'">
          <Sun :size="13" />{{ t('admin.light', 'Sáng') }}</button>
      </div>
    </section>

    <!-- Save -->
    <div class="tc-actions">
      <button class="tc-save" @click="saveTheme" :disabled="saving">
        <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.msg_6085f91b', 'Lưu giao diện') }}
      </button>
      <button class="tc-reset" @click="resetToDefault">
        <RotateCcw :size="14" /> Đặt lại mặc định
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { Palette, Sparkles, PaintBucket, Type, LayoutGrid, Moon, Sun, Save, RotateCcw } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()
const emit = defineEmits(['saved'])
const saving = ref(false)
const customAccent = ref('#7c3aed')

const fonts = ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans']
const cardStyles = [
  { key: 'glass', label: 'Glass' },
  { key: 'solid', label: 'Solid' },
  { key: 'flat', label: 'Flat' },
]

// ── Accent Color Presets (12 beautiful colors) ──
const accentPresets = [
  { name: t('admin.msg_f5fd15ab', 'Tím'), dark: '#7c3aed', light: '#6d28d9' },
  { name: t('admin.msg_66711ac0', 'Xanh dương'), dark: '#3b82f6', light: '#2563eb' },
  { name: t('admin.msg_5ed48951', 'Xanh lá'), dark: '#10b981', light: '#059669' },
  { name: t('admin.msg_194746c9', 'Đỏ san hô'), dark: '#f43f5e', light: '#e11d48' },
  { name: 'Cam', dark: '#f59e0b', light: '#d97706' },
  { name: t('admin.msg_49b55ba4', 'Xanh ngọc'), dark: '#06b6d4', light: '#0891b2' },
  { name: t('admin.msg_f605c271', 'Hồng'), dark: '#ec4899', light: '#db2777' },
  { name: 'Xanh navy', dark: '#6366f1', light: '#4f46e5' },
  { name: t('admin.msg_da71c8e0', 'Đỏ rượu'), dark: '#be123c', light: '#9f1239' },
  { name: t('admin.msg_8c6d9157', 'Xanh rêu'), dark: '#65a30d', light: '#4d7c0f' },
  { name: t('admin.msg_b1374fac', 'Vàng gold'), dark: '#eab308', light: '#ca8a04' },
  { name: t('admin.msg_2e08e01b', 'Tím đậm'), dark: '#9333ea', light: '#7e22ce' },
]

// ── Theme Presets ──
const themePresets = [
  {
    key: 'clean_light', name: 'Clean Light', mode: 'light', font: 'Inter', radius: '10', card_style: 'solid', bg: '#f8f9fc',
    dark: { accent: '#3b82f6' }, light: { accent: '#2563eb' },
  },
  {
    key: 'modern_dark', name: 'Modern Dark', mode: 'dark', font: 'Inter', radius: '12', card_style: 'glass', bg: '#0a0a0f',
    dark: { accent: '#7c3aed' }, light: { accent: '#6d28d9' },
  },
  {
    key: 'warm', name: 'Warm', mode: 'light', font: 'Plus Jakarta Sans', radius: '14', card_style: 'solid', bg: '#f8f9fc',
    dark: { accent: '#f59e0b' }, light: { accent: '#d97706' },
  },
  {
    key: 'ocean', name: 'Ocean', mode: 'dark', font: 'Outfit', radius: '16', card_style: 'glass', bg: '#0a0a0f',
    dark: { accent: '#06b6d4' }, light: { accent: '#0891b2' },
  },
  {
    key: 'rose', name: 'Rose', mode: 'light', font: 'Inter', radius: '12', card_style: 'solid', bg: '#f8f9fc',
    dark: { accent: '#f43f5e' }, light: { accent: '#e11d48' },
  },
  {
    key: 'forest', name: 'Forest', mode: 'dark', font: 'Outfit', radius: '14', card_style: 'glass', bg: '#0a0a0f',
    dark: { accent: '#10b981' }, light: { accent: '#059669' },
  },
]

const form = ref({
  mode: 'light',
  font: 'Inter',
  radius: '10',
  card_style: 'solid',
  preset: 'clean_light',
  dark: { accent: '#3b82f6' },
  light: { accent: '#2563eb' },
})

// ── Color helpers ──
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l } else {
    const hue2rgb = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3)
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function deriveLight(hex) {
  const hsl = hexToHSL(hex)
  // For light mode: increase saturation slightly, darken a bit
  return hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.max(hsl.l - 8, 15))
}

// ── Suggested complementary colors ──
const suggestedColors = computed(() => {
  const hex = form.value.dark.accent
  if (!hex || hex.length < 7) return []
  const hsl = hexToHSL(hex)
  return [
    { label: t('admin.msg_62996aff', 'Tương phản'), hex: hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l) },
    { label: t('admin.msg_87c2ed54', 'Bổ sung 1'), hex: hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l) },
    { label: t('admin.msg_4086114b', 'Bổ sung 2'), hex: hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l) },
    { label: t('admin.msg_7045db86', 'Nhạt hơn'), hex: hslToHex(hsl.h, Math.max(hsl.s - 15, 0), Math.min(hsl.l + 20, 85)) },
    { label: t('admin.msg_8d5c2620', 'Đậm hơn'), hex: hslToHex(hsl.h, Math.min(hsl.s + 10, 100), Math.max(hsl.l - 15, 20)) },
    { label: t('admin.msg_10343733', 'Ấm hơn'), hex: hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l) },
  ]
})

function applyAccentPreset(preset) {
  form.value.dark.accent = preset.dark
  form.value.light.accent = preset.light
  customAccent.value = preset.dark
}

function applyCustomAccent() {
  if (!customAccent.value || !/^#[0-9a-fA-F]{6}$/.test(customAccent.value)) return
  form.value.dark.accent = customAccent.value
  form.value.light.accent = deriveLight(customAccent.value)
}

function applySuggestion(hex) {
  form.value.dark.accent = hex
  form.value.light.accent = deriveLight(hex)
  customAccent.value = hex
}

function applyThemePreset(preset) {
  form.value = {
    mode: preset.mode,
    font: preset.font,
    radius: preset.radius,
    card_style: preset.card_style,
    preset: preset.key,
    dark: { ...preset.dark },
    light: { ...preset.light },
  }
  customAccent.value = preset.dark.accent
}

function presetPreviewStyle(p) {
  return {
    background: p.bg,
    border: `2px solid ${p.dark.accent}33`,
  }
}

function resetToDefault() {
  applyThemePreset(themePresets[0])
}

async function loadTheme() {
  try {
    const res = await apiFetch('/system-config/group/theme')
    const rows = await res.json()
    if (Array.isArray(rows)) {
      const map = {}
      rows.forEach(row => {
        const k = row.key?.replace('theme.', '')
        if (k) map[k] = row.value
      })
      if (map.mode) form.value.mode = map.mode
      if (map.font) form.value.font = map.font
      if (map.radius) form.value.radius = map.radius
      if (map.card_style) form.value.card_style = map.card_style
      if (map.preset) form.value.preset = map.preset

      if (map.dark_accent) form.value.dark.accent = map.dark_accent
      else if (map.accent) form.value.dark.accent = map.accent
      if (map.light_accent) form.value.light.accent = map.light_accent
      else if (map.accent) form.value.light.accent = map.accent

      customAccent.value = form.value.dark.accent
    }
  } catch { /* use defaults */ }
}

async function saveTheme() {
  saving.value = true
  try {
    const items = [
      { key: 'mode', value: form.value.mode },
      { key: 'font', value: form.value.font },
      { key: 'radius', value: String(form.value.radius) },
      { key: 'card_style', value: form.value.card_style },
      { key: 'preset', value: form.value.preset || '' },
      { key: 'dark_accent', value: form.value.dark.accent },
      { key: 'light_accent', value: form.value.light.accent },
      { key: 'accent', value: form.value.mode === 'light' ? form.value.light.accent : form.value.dark.accent },
    ]
    const res = await apiFetch('/system-config/group/theme', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
    if (!res.ok) throw new Error('Save failed')
    showToast(t('admin.msg_7a0bef', 'Đã lưu giao diện thành công!'), 'success')
    emit('saved')
  } catch (e) {
    showToast(t('admin.msg_f2f4cc', 'Lỗi lưu giao diện'), 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadTheme)
</script>

<style scoped>
.theme-customizer {
  padding: 24px;
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
}

.tc-header { margin-bottom: 24px; }
.tc-title {
  font-size: 18px; font-weight: 800; margin: 8px 0 4px;
  color: var(--color-text-primary);
  display: flex; align-items: center; gap: 8px;
}
.tc-subtitle { font-size: 12px; color: var(--color-text-muted); }

.tc-section {
  margin-bottom: 20px; padding: 16px;
  background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.tc-section__title {
  font-size: 13px; font-weight: 700; margin-bottom: 12px;
  color: var(--color-text-secondary);
  display: flex; align-items: center; gap: 6px;
}

/* ── Accent Color Grid ── */
.tc-accent-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
  margin-bottom: 16px;
}
.tc-accent-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 10px 4px; border-radius: 10px; cursor: pointer;
  border: 2px solid transparent; background: none;
  transition: all 0.2s; color: var(--color-text-secondary);
}
.tc-accent-btn:hover { border-color: var(--color-text-muted); }
.tc-accent-btn.active {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}
.tc-accent-btn__swatch {
  width: 32px; height: 32px; border-radius: 50%;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.2s;
}
.tc-accent-btn:hover .tc-accent-btn__swatch { transform: scale(1.1); }
.tc-accent-btn__label { font-size: 10px; font-weight: 700; white-space: nowrap; }

/* Custom color picker */
.tc-custom-color {
  display: flex; align-items: center; gap: 12px;
  margin-bottom: 14px;
}

/* Suggestions */
.tc-suggestions {
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
  padding: 10px 14px;
  border-radius: 8px;
  background: var(--glass-bg);
  border: 1px dashed var(--color-border);
}
.tc-suggestions__label {
  font-size: 11px; font-weight: 600; color: var(--color-text-muted);
  white-space: nowrap;
}
.tc-suggestions__list { display: flex; gap: 6px; }
.tc-suggestion-dot {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.tc-suggestion-dot:hover { transform: scale(1.2); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }

/* Mode preview */
.tc-mode-preview {
  display: flex; gap: 10px;
}
.tc-mode-preview__card {
  flex: 1; display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; border-radius: 10px;
  border: 1px solid var(--color-border);
}
.tc-mode-preview__dot {
  width: 28px; height: 28px; border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

/* Presets */
.tc-presets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.tc-preset {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 12px; border-radius: 10px; cursor: pointer;
  border: 2px solid var(--color-border); background: none;
  transition: all 0.2s; color: var(--color-text-secondary);
}
.tc-preset:hover { border-color: var(--color-text-muted); }
.tc-preset.active {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}
.tc-preset__preview {
  width: 100%; height: 40px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.tc-preset__dot { width: 16px; height: 16px; border-radius: 50%; }
.tc-preset__name { font-size: 11px; font-weight: 700; }

/* Form rows */
.tc-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.tc-row:last-child { margin-bottom: 0; }
.tc-label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); white-space: nowrap; }

/* Color picker */
.tc-color-group { display: flex; align-items: center; gap: 8px; }
.tc-color {
  width: 36px; height: 36px; border: none; border-radius: 8px;
  cursor: pointer; padding: 2px;
  background: var(--color-bg-card-solid);
}
.tc-color-text {
  width: 80px; padding: 8px 10px; border-radius: 8px;
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  color: var(--color-text-primary); font-size: 13px; font-family: monospace;
}

/* Select */
.tc-select {
  padding: 8px 12px; border-radius: 8px;
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  color: var(--color-text-primary); font-size: 13px;
  min-width: 180px;
}

/* Range */
.tc-range { flex: 1; max-width: 200px; accent-color: var(--color-accent-primary); }

/* Button group */
.tc-btn-group { display: flex; gap: 6px; }
.tc-btn-group--wide { width: 100%; }
.tc-btn-group--wide .tc-btn-option { flex: 1; }
.tc-btn-option {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--color-border); background: var(--color-bg-card-solid);
  color: var(--color-text-secondary); cursor: pointer; transition: all 0.2s;
}
.tc-btn-option:hover { border-color: var(--color-text-muted); }
.tc-btn-option.active {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
  color: var(--color-accent-primary);
}

/* Actions */
.tc-actions {
  display: flex; gap: 10px; margin-top: 20px; padding-top: 16px;
  border-top: 1px solid var(--color-border);
}
.tc-save {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: var(--accent-gradient); color: #fff; border: none;
  cursor: pointer; box-shadow: var(--accent-shadow); transition: all 0.2s;
}
.tc-save:hover { transform: translateY(-1px); }
.tc-save:disabled { opacity: 0.6; cursor: wait; }
.tc-reset {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: var(--color-bg-card-solid); color: var(--color-text-secondary);
  border: 1px solid var(--color-border); cursor: pointer; transition: all 0.2s;
}
.tc-reset:hover { color: var(--color-text-primary); border-color: var(--color-text-muted); }

@media (max-width: 640px) {
  .tc-accent-grid { grid-template-columns: repeat(4, 1fr); }
  .tc-presets { grid-template-columns: repeat(2, 1fr); }
  .tc-row { flex-direction: column; align-items: flex-start; }
}
</style>
