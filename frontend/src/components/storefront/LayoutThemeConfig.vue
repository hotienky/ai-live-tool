<template>
  <div class="lb-section" v-show="!activePageId">
    <div class="lb-section__header" @click="isOpen = !isOpen">
      <h4 class="lb-section__title" style="margin: 0;"><div style="display:flex;align-items:center;gap:6px"><Palette :size="14" /> {{ t('admin.theme_settings', 'Giao diện & Màu sắc (Theme)') }}</div></h4>
      <ChevronDown :size="14" :class="{ 'rotate-180': isOpen }" style="transition: transform 0.2s" />
    </div>

    <div v-if="isOpen" class="lb-section__body" style="padding-top: 12px; display: flex; flex-direction: column; gap: 12px;">

      <!-- Preset Palettes -->
      <div class="theme-presets">
        <label class="theme-presets__label">Bảng màu nhanh</label>
        <div class="theme-presets__grid">
          <button 
            v-for="(preset, pi) in presets" :key="pi" class="theme-preset-btn"
            :title="preset.name"
            @click="applyPreset(preset)"
          >
            <span class="theme-preset-btn__colors">
              <span :style="{ background: preset.primaryColor }"></span>
              <span :style="{ background: preset.accentColor }"></span>
              <span :style="{ background: preset.backgroundColor }"></span>
            </span>
            <span class="theme-preset-btn__name">{{ preset.name }}</span>
          </button>
        </div>
      </div>

      <div class="param-divider"></div>
      
      <!-- Primary Color -->
      <div class="param-row">
        <label>Màu chủ đạo (Primary)</label>
        <div class="color-picker-wrapper">
          <input type="color" v-model="theme.primaryColor" class="param-color" />
          <input type="text" v-model="theme.primaryColor" class="param-input param-input--sm" style="width: 85px" />
        </div>
      </div>

      <!-- Accent Color -->
      <div class="param-row">
        <label>Màu nhấn (Secondary/Action)</label>
        <div class="color-picker-wrapper">
          <input type="color" v-model="theme.accentColor" class="param-color" />
          <input type="text" v-model="theme.accentColor" class="param-input param-input--sm" style="width: 85px" />
        </div>
      </div>

      <!-- Background -->
      <div class="param-row">
        <label>Màu nền trang</label>
        <div class="color-picker-wrapper">
          <input type="color" v-model="theme.backgroundColor" class="param-color" />
          <input type="text" v-model="theme.backgroundColor" class="param-input param-input--sm" style="width: 85px" />
        </div>
      </div>

      <!-- Text Color -->
      <div class="param-row">
        <label>Màu chữ chính</label>
        <div class="color-picker-wrapper">
          <input type="color" v-model="theme.textColor" class="param-color" />
          <input type="text" v-model="theme.textColor" class="param-input param-input--sm" style="width: 85px" />
        </div>
      </div>

      <div class="param-divider"></div>

      <!-- Typography -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Phông chữ chính (Body)</label>
        <select v-model="theme.fontFamily" class="param-select" style="max-width:100%">
          <option value="'Inter', sans-serif">Inter (Mặc định)</option>
          <option value="'Roboto', sans-serif">Roboto</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
          <option value="'Open Sans', sans-serif">Open Sans</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Nunito', sans-serif">Nunito</option>
          <option value="'Lato', sans-serif">Lato</option>
          <option value="'Outfit', sans-serif">Outfit</option>
          <option value="'DM Sans', sans-serif">DM Sans</option>
          <option value="system-ui, sans-serif">System UI</option>
        </select>
        <span class="font-preview" :style="{ fontFamily: theme.fontFamily }" style="text-align: left; margin-top:2px">Xin chào 123</span>
      </div>

      <!-- Heading Font -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Phông tiêu đề (Heading)</label>
        <select v-model="theme.headingFontFamily" class="param-select" style="max-width:100%">
          <option value="">Giống phông chính</option>
          <option value="'Playfair Display', serif">Playfair Display (Sang trọng)</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Outfit', sans-serif">Outfit</option>
          <option value="'DM Serif Display', serif">DM Serif Display</option>
          <option value="'Merriweather', serif">Merriweather</option>
          <option value="'Raleway', sans-serif">Raleway</option>
        </select>
        <span v-if="theme.headingFontFamily" class="font-preview font-preview--heading" :style="{ fontFamily: theme.headingFontFamily }" style="text-align: left; margin-top:2px">Tiêu Đề</span>
      </div>

      <!-- Border Radius -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Bo góc nút/thẻ (Border Radius)</label>
        <select v-model="theme.borderRadius" class="param-select">
          <option value="0px">Vuông (0px)</option>
          <option value="4px">Nhẹ (4px)</option>
          <option value="8px">Vừa (8px)</option>
          <option value="12px">Mềm (12px)</option>
          <option value="16px">Tròn lớn (16px)</option>
          <option value="99px">Tròn khuyết (Pill)</option>
        </select>
      </div>

      <div class="param-divider"></div>

      <!-- Container Width -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Chiều rộng nội dung (max-width)</label>
        <select v-model="theme.containerWidth" class="param-select">
          <option value="960px">Hẹp (960px)</option>
          <option value="1080px">Vừa (1080px)</option>
          <option value="1200px">Tiêu chuẩn (1200px)</option>
          <option value="1320px">Rộng (1320px)</option>
          <option value="1440px">Siêu rộng (1440px)</option>
          <option value="100%">Toàn trang (100%)</option>
        </select>
      </div>

      <!-- Button Style -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Kiểu nút (Button Style)</label>
        <select v-model="theme.buttonStyle" class="param-select">
          <option value="solid">Filled (Đặc)</option>
          <option value="outline">Outline (Viền)</option>
          <option value="ghost">Ghost (Trong suốt)</option>
          <option value="gradient">Gradient</option>
        </select>
      </div>

      <div class="param-divider"></div>

      <!-- Spacing Scale -->
      <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
        <label>Mật độ khoảng cách (Spacing)</label>
        <select v-model="theme.spacingScale" class="param-select">
          <option value="compact">Chặt (Compact)</option>
          <option value="normal">Chuẩn (Normal)</option>
          <option value="relaxed">Thoáng (Relaxed)</option>
          <option value="spacious">Rộng rãi (Spacious)</option>
        </select>
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Palette, ChevronDown } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const props = defineProps({
  modelValue: { type: Object, required: true },
  activePageId: { default: null }
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const isOpen = ref(true)

const presets = [
  { name: 'Modern Blue', primaryColor: '#3b82f6', accentColor: '#06b6d4', backgroundColor: '#ffffff', textColor: '#1e293b' },
  { name: 'Deep Purple', primaryColor: '#7c3aed', accentColor: '#c084fc', backgroundColor: '#faf5ff', textColor: '#1e1b4b' },
  { name: 'Rose Gold', primaryColor: '#e11d48', accentColor: '#f472b6', backgroundColor: '#fff1f2', textColor: '#1f2937' },
  { name: 'Forest', primaryColor: '#059669', accentColor: '#34d399', backgroundColor: '#f0fdf4', textColor: '#1a2e1a' },
  { name: 'Dark Mode', primaryColor: '#6366f1', accentColor: '#a78bfa', backgroundColor: '#0f172a', textColor: '#e2e8f0' },
  { name: 'Warm Gold', primaryColor: '#d97706', accentColor: '#f59e0b', backgroundColor: '#fffbeb', textColor: '#292524' },
  { name: 'Coral', primaryColor: '#f97316', accentColor: '#fb923c', backgroundColor: '#fff7ed', textColor: '#1c1917' },
  { name: 'Ocean Night', primaryColor: '#0ea5e9', accentColor: '#38bdf8', backgroundColor: '#0c1222', textColor: '#cbd5e1' },
  { name: 'Minimal', primaryColor: '#18181b', accentColor: '#71717a', backgroundColor: '#fafafa', textColor: '#27272a' },
  { name: 'Neon', primaryColor: '#8b5cf6', accentColor: '#22d3ee', backgroundColor: '#0a0a0a', textColor: '#f5f5f5' },
  { name: 'Luxury', primaryColor: '#b45309', accentColor: '#ca8a04', backgroundColor: '#1c1917', textColor: '#fef3c7' },
  { name: 'Sky', primaryColor: '#0284c7', accentColor: '#38bdf8', backgroundColor: '#f0f9ff', textColor: '#0c4a6e' },
]

function applyPreset(preset) {
  theme.value.primaryColor = preset.primaryColor
  theme.value.accentColor = preset.accentColor
  theme.value.backgroundColor = preset.backgroundColor
  theme.value.textColor = preset.textColor
}

const theme = ref({
  primaryColor: props.modelValue?.primaryColor || '#0066ff',
  accentColor: props.modelValue?.accentColor || '#ff4757',
  backgroundColor: props.modelValue?.backgroundColor || '#ffffff',
  textColor: props.modelValue?.textColor || '#1f2937',
  fontFamily: props.modelValue?.fontFamily || "'Inter', sans-serif",
  headingFontFamily: props.modelValue?.headingFontFamily || '',
  borderRadius: props.modelValue?.borderRadius || '8px',
  containerWidth: props.modelValue?.containerWidth || '1200px',
  buttonStyle: props.modelValue?.buttonStyle || 'solid',
  spacingScale: props.modelValue?.spacingScale || 'normal',
})

watch(theme, (newVal) => {
  emit('update:modelValue', JSON.parse(JSON.stringify(newVal)))
}, { deep: true })

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    Object.assign(theme.value, newVal)
  }
}, { deep: true })
</script>

<style scoped>
.lb-section__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}
.rotate-180 {
  transform: rotate(180deg);
}
.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}
.param-color {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  cursor: pointer;
  background: none;
}
.param-color::-webkit-color-swatch-wrapper {
  padding: 0;
}
.param-color::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}
.param-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 0;
}

/* Theme Presets */
.theme-presets__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  display: block;
}
.theme-presets__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}
.theme-preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 6px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-card);
  cursor: pointer;
  transition: all 0.2s;
}
.theme-preset-btn:hover {
  border-color: var(--accent);
  box-shadow: 0 0 0 1px var(--accent);
  transform: translateY(-1px);
}
.theme-preset-btn__colors {
  display: flex;
  gap: 3px;
}
.theme-preset-btn__colors span {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}
.theme-preset-btn__name {
  font-size: 10px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
.font-preview {
  display: block;
  margin-top: 4px;
  padding: 4px 8px;
  font-size: 13px;
  color: #475569;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}
.font-preview--heading {
  font-size: 16px;
  font-weight: 700;
}
</style>
