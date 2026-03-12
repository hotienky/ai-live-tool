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
            <div class="tc-preset__dot" :style="{ background: preset.accent }"></div>
          </div>
          <span class="tc-preset__name">{{ preset.name }}</span>
        </button>
      </div>
    </section>

    <!-- Colors -->
    <section class="tc-section">
      <h4 class="tc-section__title"><PaintBucket :size="14" /> Màu sắc</h4>
      <div class="tc-row">
        <label class="tc-label">Màu chính (Accent)</label>
        <div class="tc-color-group">
          <input type="color" v-model="form.accent" class="tc-color" />
          <input type="text" v-model="form.accent" class="tc-color-text" maxlength="7" />
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

    <!-- Mode -->
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
import { ref, onMounted } from 'vue'
import { Palette, Sparkles, PaintBucket, Type, LayoutGrid, Moon, Sun, Save, RotateCcw } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'

const { showToast } = useToast()
const saving = ref(false)

const fonts = ['Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans']
const cardStyles = [
  { key: 'glass', label: 'Glass' },
  { key: 'solid', label: 'Solid' },
  { key: 'flat', label: 'Flat' },
]

const presets = [
  { key: 'modern_dark', name: 'Modern Dark', mode: 'dark', accent: '#7c3aed', font: 'Inter', radius: '12', card_style: 'glass', bg: '#0a0a0f' },
  { key: 'clean_light', name: 'Clean Light', mode: 'light', accent: '#3b82f6', font: 'Inter', radius: '10', card_style: 'solid', bg: '#f8f9fc' },
  { key: 'warm', name: 'Warm', mode: 'light', accent: '#f59e0b', font: 'Plus Jakarta Sans', radius: '14', card_style: 'solid', bg: '#f8f9fc' },
  { key: 'ocean', name: 'Ocean', mode: 'dark', accent: '#06b6d4', font: 'Outfit', radius: '16', card_style: 'glass', bg: '#0a0a0f' },
]

const form = ref({
  mode: 'dark',
  accent: '#7c3aed',
  font: 'Inter',
  radius: '12',
  card_style: 'glass',
  preset: 'modern_dark',
})

function presetPreviewStyle(p) {
  return {
    background: p.bg,
    border: `2px solid ${p.accent}33`,
  }
}

function applyPreset(preset) {
  form.value = {
    mode: preset.mode,
    accent: preset.accent,
    font: preset.font,
    radius: preset.radius,
    card_style: preset.card_style,
    preset: preset.key,
  }
}

function resetToDefault() {
  applyPreset(presets[0])
}

async function loadTheme() {
  try {
    const data = await apiFetch('/system-config/group/theme')
    if (data && typeof data === 'object') {
      for (const [key, value] of Object.entries(data)) {
        const k = key.replace('theme.', '')
        if (k in form.value) form.value[k] = value
      }
    }
  } catch { /* defaults */ }
}

async function saveTheme() {
  saving.value = true
  try {
    const payload = {}
    for (const [k, v] of Object.entries(form.value)) {
      payload[`theme.${k}`] = String(v)
    }
    await apiFetch('/system-config/group/theme', {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
    showToast('Đã lưu giao diện thành công!', 'success')
  } catch (e) {
    showToast('Lỗi lưu giao diện', 'error')
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
  background: rgba(124,58,237,0.06);
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
.tc-range { flex: 1; max-width: 200px; accent-color: var(--color-accent-primary, #7c3aed); }

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
  background: rgba(124,58,237,0.1);
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
  background: linear-gradient(135deg, #7c3aed, #a855f7); color: #fff; border: none;
  cursor: pointer; box-shadow: 0 4px 16px rgba(124,58,237,0.3); transition: all 0.2s;
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
