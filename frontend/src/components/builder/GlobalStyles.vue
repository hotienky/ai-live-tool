<template>
  <div class="global-styles">
    <div class="gs-header">
      <Palette :size="18" />
      <div>
        <h3 class="gs-title">{{ t('admin.global_styles', 'Site Styles') }}</h3>
        <p class="gs-sub">{{ t('admin.gs_desc', 'Tuỳ chỉnh màu sắc, font, bố cục toàn site') }}</p>
      </div>
    </div>

    <!-- Colors -->
    <section class="gs-section">
      <h4 class="gs-section__title"><Paintbrush :size="14" /> {{ t('admin.colors', 'Bảng màu') }}</h4>
      <div class="gs-color-grid">
        <div v-for="(color, key) in config.colors" :key="key" class="gs-color-item">
          <label class="gs-color-label">{{ colorLabels[key] || key }}</label>
          <div class="gs-color-input">
            <input type="color" :value="color" @input="updateColor(key, $event.target.value)" class="gs-color-picker" />
            <input type="text" :value="color" @input="updateColor(key, $event.target.value)" class="gs-color-hex" maxlength="7" />
          </div>
        </div>
      </div>
    </section>

    <!-- Fonts -->
    <section class="gs-section">
      <h4 class="gs-section__title"><Type :size="14" /> {{ t('admin.fonts', 'Font chữ') }}</h4>
      <div class="gs-row">
        <label class="gs-label">Heading</label>
        <select v-model="config.fonts.heading" @change="emitChange" class="gs-select">
          <option v-for="f in fontOptions" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
        </select>
      </div>
      <div class="gs-row">
        <label class="gs-label">Body</label>
        <select v-model="config.fonts.body" @change="emitChange" class="gs-select">
          <option v-for="f in fontOptions" :key="f" :value="f" :style="{ fontFamily: f }">{{ f }}</option>
        </select>
      </div>
      <div class="gs-font-preview" :style="{ fontFamily: config.fonts.body }">
        <span :style="{ fontFamily: config.fonts.heading, fontSize: '20px', fontWeight: 700 }">Heading Font</span>
        <span>Body text preview — Aa Bb Cc Dd 0123</span>
      </div>
    </section>

    <!-- Layout -->
    <section class="gs-section">
      <h4 class="gs-section__title"><LayoutGrid :size="14" /> {{ t('admin.layout', 'Bố cục') }}</h4>
      <div class="gs-row">
        <label class="gs-label">Max Width</label>
        <select v-model="config.layout.maxWidth" @change="emitChange" class="gs-select">
          <option value="960px">960px</option>
          <option value="1080px">1080px</option>
          <option value="1200px">1200px</option>
          <option value="1440px">1440px</option>
          <option value="100%">Full Width</option>
        </select>
      </div>
      <div class="gs-row">
        <label class="gs-label">Container Padding</label>
        <div class="gs-range-row">
          <input type="range" v-model.number="config.layout.containerPadding" @input="emitChange" min="0" max="48" class="gs-range" />
          <span class="gs-range-val">{{ config.layout.containerPadding }}px</span>
        </div>
      </div>
      <div class="gs-row">
        <label class="gs-label">Section Spacing</label>
        <div class="gs-range-row">
          <input type="range" v-model.number="config.layout.sectionSpacing" @input="emitChange" min="16" max="120" class="gs-range" />
          <span class="gs-range-val">{{ config.layout.sectionSpacing }}px</span>
        </div>
      </div>
    </section>

    <!-- Dark Mode -->
    <section class="gs-section">
      <h4 class="gs-section__title"><Moon :size="14" /> {{ t('admin.dark_mode', 'Dark Mode') }}</h4>
      <div class="gs-btn-group">
        <button v-for="opt in darkModeOptions" :key="opt.value" class="gs-btn-option" :class="{ active: config.darkMode === opt.value }" @click="config.darkMode = opt.value; emitChange()">
          <component :is="opt.icon" :size="13" /> {{ opt.label }}
        </button>
      </div>
    </section>

    <!-- Actions -->
    <div class="gs-actions">
      <button class="gs-save" @click="save" :disabled="saving">
        <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save', 'Lưu') }}
      </button>
      <button class="gs-export" @click="exportStyles">
        <Download :size="14" /> Export JSON
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Palette, Paintbrush, Type, LayoutGrid, Moon, Sun, Monitor, Save, Download } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const emit = defineEmits(['change'])
const saving = ref(false)

const config = reactive({
  colors: {
    primary: '#7c3aed',
    secondary: '#1e293b',
    accent: '#7c3aed',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#334155',
  },
  fonts: {
    heading: 'Inter',
    body: 'Inter',
  },
  layout: {
    maxWidth: '1200px',
    containerPadding: 16,
    sectionSpacing: 64,
  },
  darkMode: 'auto',
})

const colorLabels = {
  primary: 'Primary',
  secondary: 'Secondary',
  accent: 'Accent',
  background: 'Background',
  surface: 'Surface',
  text: 'Text',
}

const fontOptions = [
  'Inter', 'Roboto', 'Outfit', 'Plus Jakarta Sans',
  'Playfair Display', 'Montserrat', 'Poppins', 'Lato',
  'Open Sans', 'Nunito', 'DM Sans', 'Space Grotesk',
]

const darkModeOptions = [
  { value: 'light', label: 'Light only', icon: Sun },
  { value: 'dark', label: 'Dark only', icon: Moon },
  { value: 'auto', label: 'Auto', icon: Monitor },
]

function updateColor(key, value) {
  config.colors[key] = value
  emitChange()
}

function emitChange() {
  emit('change', { ...config })
}

async function save() {
  saving.value = true
  try {
    const items = []
    Object.entries(config.colors).forEach(([k, v]) => items.push({ key: `color_${k}`, value: v }))
    items.push({ key: 'font_heading', value: config.fonts.heading })
    items.push({ key: 'font_body', value: config.fonts.body })
    items.push({ key: 'layout_max_width', value: config.layout.maxWidth })
    items.push({ key: 'layout_container_padding', value: String(config.layout.containerPadding) })
    items.push({ key: 'layout_section_spacing', value: String(config.layout.sectionSpacing) })
    items.push({ key: 'dark_mode', value: config.darkMode })

    await apiFetch('/system-config/group/global_styles', {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
    showToast(t('admin.styles_saved', 'Đã lưu styles!'), 'success')
  } catch (e) {
    showToast(t('admin.styles_error', 'Lỗi lưu styles'), 'error')
  }
  saving.value = false
}

function exportStyles() {
  const json = JSON.stringify(config, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'site-styles.json'
  a.click()
  URL.revokeObjectURL(url)
}

async function loadConfig() {
  try {
    const res = await apiFetch('/system-config/group/global_styles')
    const data = await res.json()
    if (Array.isArray(data)) {
      data.forEach(row => {
        const k = row.key?.replace('global_styles.', '')
        if (k?.startsWith('color_')) config.colors[k.replace('color_', '')] = row.value
        if (k === 'font_heading') config.fonts.heading = row.value
        if (k === 'font_body') config.fonts.body = row.value
        if (k === 'layout_max_width') config.layout.maxWidth = row.value
        if (k === 'layout_container_padding') config.layout.containerPadding = Number(row.value)
        if (k === 'layout_section_spacing') config.layout.sectionSpacing = Number(row.value)
        if (k === 'dark_mode') config.darkMode = row.value
      })
    }
  } catch { /* use defaults */ }
}

onMounted(loadConfig)
</script>

<style scoped>
.global-styles {
  padding: 24px; background: var(--glass-bg);
  border: 1px solid var(--glass-border); border-radius: 16px;
}
.gs-header { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 24px; }
.gs-header svg { color: var(--accent); margin-top: 2px; }
.gs-title { font-size: 18px; font-weight: 800; margin: 0 0 4px; }
.gs-sub { font-size: 12px; color: var(--text-3); margin: 0; }

.gs-section {
  margin-bottom: 20px; padding: 16px;
  background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border); border-radius: 12px;
}
.gs-section__title {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 700; margin: 0 0 14px;
  color: var(--text-2);
}

/* Color grid */
.gs-color-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.gs-color-item { display: flex; flex-direction: column; gap: 4px; }
.gs-color-label { font-size: 10px; font-weight: 700; text-transform: uppercase; color: var(--text-3); }
.gs-color-input { display: flex; align-items: center; gap: 6px; }
.gs-color-picker { width: 32px; height: 32px; border: none; border-radius: 8px; cursor: pointer; padding: 1px; }
.gs-color-hex {
  width: 80px; padding: 6px 8px; border-radius: 6px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 12px; font-family: monospace; color: var(--text-1);
}

/* Rows */
.gs-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; margin-bottom: 10px;
}
.gs-label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.gs-select {
  padding: 8px 12px; border-radius: 8px; font-size: 13px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  color: var(--text-1); min-width: 180px;
}

/* Font preview */
.gs-font-preview {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 16px; border-radius: 8px; margin-top: 10px;
  background: var(--glass-bg); border: 1px dashed var(--color-border);
  font-size: 14px; color: var(--text-2);
}

/* Range */
.gs-range-row { display: flex; align-items: center; gap: 10px; flex: 1; max-width: 250px; }
.gs-range { flex: 1; accent-color: var(--accent); }
.gs-range-val { font-size: 12px; font-weight: 600; color: var(--text-3); min-width: 40px; }

/* Button group */
.gs-btn-group { display: flex; gap: 6px; }
.gs-btn-option {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; border-radius: 8px; font-size: 12px; font-weight: 700;
  border: 1px solid var(--color-border); background: var(--bg-2);
  color: var(--text-2); cursor: pointer; transition: all 0.2s;
}
.gs-btn-option.active { border-color: var(--accent); background: var(--color-accent-glow); color: var(--accent); }

/* Actions */
.gs-actions {
  display: flex; gap: 10px; margin-top: 20px;
  padding-top: 16px; border-top: 1px solid var(--color-border);
}
.gs-save {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 28px; border-radius: 10px; font-size: 13px; font-weight: 700;
  background: var(--accent-gradient); color: #fff; border: none;
  cursor: pointer; box-shadow: var(--accent-shadow); transition: all 0.2s;
}
.gs-save:hover { transform: translateY(-1px); }
.gs-save:disabled { opacity: 0.6; }
.gs-export {
  display: flex; align-items: center; gap: 6px;
  padding: 12px 20px; border-radius: 10px; font-size: 13px; font-weight: 600;
  background: var(--bg-2); border: 1px solid var(--color-border);
  color: var(--text-2); cursor: pointer;
}

@media (max-width: 640px) {
  .gs-color-grid { grid-template-columns: repeat(2, 1fr); }
  .gs-btn-group { flex-direction: column; }
}
</style>
