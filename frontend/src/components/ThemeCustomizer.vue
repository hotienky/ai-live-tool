<template>
  <div class="theme-customizer">
    <div class="tc-header">
      <Palette :size="18" />
      <h3 class="tc-title">Tuỳ chỉnh giao diện</h3>
      <span class="tc-subtitle">Thay đổi sẽ áp dụng ngay cho trang cửa hàng</span>
    </div>

    <!-- Presets -->
    <section class="tc-section">
      <h4 class="tc-section__title"><Sparkles :size="14" /> Bộ giao diện có sẵn</h4>
      <div class="tc-presets">
        <button
          v-for="preset in presets" :key="preset.key"
          class="tc-preset"
          :class="{ active: form.preset === preset.key }"
          @click="applyPreset(preset)"
        >
          <div class="tc-preset__preview" :style="presetPreviewStyle(preset)">
            <div class="tc-preset__dot" :style="{ background: preset.dark.accent }"></div>
          </div>
          <span class="tc-preset__name">{{ preset.name }}</span>
        </button>
      </div>
    </section>

    <!-- Per-mode Colors -->
    <section class="tc-section">
      <h4 class="tc-section__title"><PaintBucket :size="14" /> Màu sắc theo chế độ</h4>

      <!-- Mode tabs -->
      <div class="tc-mode-tabs">
        <button
          class="tc-mode-tab"
          :class="{ active: colorTab === 'dark' }"
          @click="colorTab = 'dark'"
        ><Moon :size="13" /> Chế độ Tối</button>
        <button
          class="tc-mode-tab"
          :class="{ active: colorTab === 'light' }"
          @click="colorTab = 'light'"
        ><Sun :size="13" /> Chế độ Sáng</button>
      </div>

      <!-- Dark mode colors -->
      <div v-if="colorTab === 'dark'" class="tc-color-panel">
        <div class="tc-row">
          <label class="tc-label">Màu nhấn (Dark)</label>
          <div class="tc-color-group">
            <input type="color" v-model="form.dark.accent" class="tc-color" />
            <input type="text" v-model="form.dark.accent" class="tc-color-text" maxlength="7" />
          </div>
        </div>
        <div class="tc-color-preview" :style="{ background: '#0a0a0f' }">
          <div class="tc-color-preview__swatch" :style="{ background: form.dark.accent }"></div>
          <span class="tc-color-preview__label" style="color: #f0f0f5">Xem trước nền tối</span>
        </div>
      </div>

      <!-- Light mode colors -->
      <div v-if="colorTab === 'light'" class="tc-color-panel">
        <div class="tc-row">
          <label class="tc-label">Màu nhấn (Light)</label>
          <div class="tc-color-group">
            <input type="color" v-model="form.light.accent" class="tc-color" />
            <input type="text" v-model="form.light.accent" class="tc-color-text" maxlength="7" />
          </div>
        </div>
        <div class="tc-color-preview" :style="{ background: '#f8f9fc' }">
          <div class="tc-color-preview__swatch" :style="{ background: form.light.accent }"></div>
          <span class="tc-color-preview__label" style="color: #1a1a2e">Xem trước nền sáng</span>
        </div>
      </div>
    </section>

    <!-- Typography -->
    <section class="tc-section">
      <h4 class="tc-section__title"><Type :size="14" /> Font chữ</h4>
      <div class="tc-row">
        <label class="tc-label">Font Family</label>
        <select v-model="form.font" class="tc-select">
          <option v-for="f in fonts" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
        </select>
      </div>
    </section>

    <!-- Layout -->
    <section class="tc-section">
      <h4 class="tc-section__title"><LayoutGrid :size="14" /> Bố cục</h4>
      <div class="tc-row">
        <label class="tc-label">Bo góc ({{ form.radius }}px)</label>
        <input type="range" v-model="form.radius" min="4" max="24" class="tc-range" />
      </div>
      <div class="tc-row">
        <label class="tc-label">Kiểu card</label>
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
      <h4 class="tc-section__title"><Moon :size="14" /> Chế độ mặc định</h4>
      <div class="tc-btn-group tc-btn-group--wide">
        <button
          class="tc-btn-option"
          :class="{ active: form.mode === 'dark' }"
          @click="form.mode = 'dark'"
        ><Moon :size="13" /> Tối</button>
        <button
          class="tc-btn-option"
          :class="{ active: form.mode === 'light' }"
          @click="form.mode = 'light'"
        ><Sun :size="13" /> Sáng</button>
      </div>
    </section>

    <!-- Save -->
    <div class="tc-actions">
      <button class="tc-save" @click="saveTheme" :disabled="saving">
        <Save :size="14" /> {{ saving ? 'Đang lưu...' : 'Lưu giao diện' }}
      </button>
      <button class="tc-reset" @click="resetToDefault">
        <RotateCcw :size="14" /> Đặt lại mặc định
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { Palette, Sparkles, PaintBucket, Type, LayoutGrid, Moon, Sun, Save, RotateCcw } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const emit = defineEmits(['saved'])
const saving = ref(false)
const colorTab = ref('dark')

const fonts = ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans']
const cardStyles = [
  { key: 'glass', label: 'Glass' },
  { key: 'solid', label: 'Solid' },
  { key: 'flat', label: 'Flat' },
]

const presets = [
  {
    key: 'modern_dark', name: 'Modern Dark', mode: 'dark', font: 'Inter', radius: '12', card_style: 'glass', bg: '#0a0a0f',
    dark: { accent: '#7c3aed' },
    light: { accent: '#6d28d9' },
  },
  {
    key: 'clean_light', name: 'Clean Light', mode: 'light', font: 'Inter', radius: '10', card_style: 'solid', bg: '#f8f9fc',
    dark: { accent: '#3b82f6' },
    light: { accent: '#2563eb' },
  },
  {
    key: 'warm', name: 'Warm', mode: 'light', font: 'Plus Jakarta Sans', radius: '14', card_style: 'solid', bg: '#f8f9fc',
    dark: { accent: '#f59e0b' },
    light: { accent: '#d97706' },
  },
  {
    key: 'ocean', name: 'Ocean', mode: 'dark', font: 'Outfit', radius: '16', card_style: 'glass', bg: '#0a0a0f',
    dark: { accent: '#06b6d4' },
    light: { accent: '#0891b2' },
  },
]

const form = ref({
  mode: 'dark',
  font: 'Inter',
  radius: '12',
  card_style: 'glass',
  preset: 'modern_dark',
  dark: { accent: '#7c3aed' },
  light: { accent: '#6d28d9' },
})

function presetPreviewStyle(p) {
  return {
    background: p.bg,
    border: `2px solid ${p.dark.accent}33`,
  }
}

function applyPreset(preset) {
  form.value = {
    mode: preset.mode,
    font: preset.font,
    radius: preset.radius,
    card_style: preset.card_style,
    preset: preset.key,
    dark: { ...preset.dark },
    light: { ...preset.light },
  }
}

function resetToDefault() {
  applyPreset(presets[0])
}

// Apply accent to CMS admin CSS vars for live preview
// NOTE: This is intentionally scoped — we do NOT set --color-accent-primary
// because that belongs to the CMS admin "Màu nhấn" system.
// We only set --sf-accent vars for the StorefrontHome preview inside the admin.
function applyStorefrontPreviewVars(hexColor) {
  if (!hexColor || !/^#[0-9a-fA-F]{3,6}$/.test(hexColor)) return
  const root = document.documentElement
  let hex = hexColor.replace('#', '')
  if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2]
  const r = parseInt(hex.substring(0,2), 16)
  const g = parseInt(hex.substring(2,4), 16)
  const b = parseInt(hex.substring(4,6), 16)
  const lighten = (v) => Math.min(255, Math.round(v + (255 - v) * 0.3))
  const lr = lighten(r), lg = lighten(g), lb = lighten(b)
  const lightHex = `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`

  // Only set --sf-* vars (storefront namespace) — NOT --color-accent-primary
  root.style.setProperty('--sf-accent', hexColor)
  root.style.setProperty('--sf-accent-light', lightHex)
  root.style.setProperty('--sf-accent-glow', `rgba(${r},${g},${b},0.15)`)
  root.style.setProperty('--sf-accent-gradient', `linear-gradient(135deg, ${hexColor}, ${lightHex})`)
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
      // Load simple fields
      if (map.mode) form.value.mode = map.mode
      if (map.font) form.value.font = map.font
      if (map.radius) form.value.radius = map.radius
      if (map.card_style) form.value.card_style = map.card_style
      if (map.preset) form.value.preset = map.preset

      // Load per-mode colors (new format)
      if (map.dark_accent) {
        form.value.dark.accent = map.dark_accent
      } else if (map.accent) {
        form.value.dark.accent = map.accent
      }
      if (map.light_accent) {
        form.value.light.accent = map.light_accent
      } else if (map.accent) {
        form.value.light.accent = map.accent
      }
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
      // Per-mode accents
      { key: 'dark_accent', value: form.value.dark.accent },
      { key: 'light_accent', value: form.value.light.accent },
      // Backward compat: keep "accent" as the default mode's accent
      { key: 'accent', value: form.value.mode === 'light' ? form.value.light.accent : form.value.dark.accent },
    ]
    const res = await apiFetch('/system-config/group/theme', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
    if (!res.ok) throw new Error('Save failed')
    showToast('Đã lưu giao diện thành công!', 'success')
    emit('saved')
  } catch (e) {
    showToast('Lỗi lưu giao diện', 'error')
  } finally {
    saving.value = false
  }
}

onMounted(loadTheme)

// No watchers that change admin CSS — storefront colors are isolated from admin panel
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

/* Presets */
.tc-presets { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
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

/* Mode Tabs */
.tc-mode-tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  background: var(--glass-bg); border-radius: 10px; padding: 4px;
}
.tc-mode-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border: none; border-radius: 8px;
  background: transparent; color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.tc-mode-tab:hover { background: var(--color-bg-card-solid); }
.tc-mode-tab.active {
  background: var(--color-accent-primary); color: #fff;
  box-shadow: var(--accent-shadow);
}

/* Color panel */
.tc-color-panel { animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.tc-color-preview {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; border-radius: 10px; margin-top: 12px;
  border: 1px solid var(--color-border);
}
.tc-color-preview__swatch {
  width: 36px; height: 36px; border-radius: 8px; flex-shrink: 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
.tc-color-preview__label {
  font-size: 13px; font-weight: 600;
}

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
  .tc-presets { grid-template-columns: repeat(2, 1fr); }
  .tc-row { flex-direction: column; align-items: flex-start; }
}
</style>
