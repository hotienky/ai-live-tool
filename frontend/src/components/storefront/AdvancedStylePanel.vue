<template>
  <div class="advanced-style-panel">
    <!-- State Configurator -->
    <div class="asp-switcher">
      <div class="asp-tabs device-tabs">
        <button :class="{ active: activeDevice === 'desktop' }" @click="activeDevice = 'desktop'" data-tooltip="Desktop"><Monitor :size="14" /></button>
        <button :class="{ active: activeDevice === 'tablet' }" @click="activeDevice = 'tablet'" data-tooltip="Tablet"><Tablet :size="14" /></button>
        <button :class="{ active: activeDevice === 'mobile' }" @click="activeDevice = 'mobile'" data-tooltip="Mobile"><Smartphone :size="14" /></button>
      </div>
      <div class="asp-tabs state-tabs">
        <button :class="{ active: activeState === 'normal' }" @click="activeState = 'normal'">Normal</button>
        <button :class="{ active: activeState === 'hover' }" @click="activeState = 'hover'">Hover</button>
      </div>
    </div>
    
    <!-- 1. Nội dung cấu hình Core -->
    <div class="asp-section" v-if="hasContentConfig">
      <h4 class="asp-section-title">Nội dung ({{ type }})</h4>
      <div v-if="['text', 'heading', 'button', 'link'].includes(type)" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Văn bản
          <button @click="openWand('content')" class="btn-icon-soft" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <textarea v-if="['text','heading'].includes(type)" v-model="section.content" rows="3" class="asp-input" placeholder="Nhập văn bản..."></textarea>
        <input v-else v-model="section.content" type="text" class="asp-input" />
      </div>
      <div v-if="type === 'heading'" class="asp-row" style="margin-top: 8px">
        <label>Thẻ (SEO Tag)</label>
        <select v-model="safeSettings.tag" class="asp-input asp-input--select">
          <option value="">Auto (H2)</option>
          <option v-for="tag in ['h1','h2','h3','h4','h5','h6','p']" :key="tag" :value="tag">{{ tag.toUpperCase() }}</option>
        </select>
      </div>
      <div v-else-if="type === 'image'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Image URL
          <button @click="openWand('src')" class="btn-icon-soft" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <input v-model="safeSettings.src" type="text" class="asp-input" placeholder="https://..." />
        <label style="margin-top: 8px">Object Fit</label>
        <select v-model="safeStyle.objectFit" class="asp-input asp-input--select">
          <option value="">Default</option>
          <option value="cover">Cover</option>
          <option value="contain">Contain</option>
          <option value="fill">Fill</option>
        </select>
      </div>
      <div v-else-if="type === 'iframe' || type === 'video'" class="asp-row">
        <label>URL Nguồn (Src)</label>
        <input v-model="safeSettings.src" type="text" class="asp-input" placeholder="https://..." />
        <div v-if="type === 'video'" class="asp-grid" style="margin-top:8px">
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.autoplay"> Autoplay</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.loop"> Loop</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.controls"> Controls</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.muted"> Muted</label>
        </div>
      </div>
      <div v-if="type === 'link'" class="asp-row">
        <label>Liên kết (Href)</label>
        <input v-model="safeSettings.href" type="text" class="asp-input" placeholder="/about" />
        <div class="asp-row" style="margin-top: 8px;">
          <label>Mở Tab Nới</label>
          <select v-model="safeSettings.target" class="asp-input asp-input--select">
            <option value="">Không</option>
            <option value="_blank">Có (_blank)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Layout & Spacing Panel -->
    <details class="asp-accordion">
      <summary><LayoutGrid :size="14" /> Layout & Spacing <ChevronDown :size="14" class="asp-arr" /></summary>
      <div class="asp-accordion-body">
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Hiển thị</label>
            <select v-model="safeStyle.display" class="asp-input asp-input--select">
              <option value="">Auto</option>
              <option value="block">Block</option>
              <option value="flex">Flexbox</option>
              <option value="grid">Grid</option>
              <option value="inline-block">Inline Block</option>
              <option value="none">None</option>
            </select>
          </div>
          <div class="asp-col" v-if="safeStyle.display === 'flex'">
            <label>Hướng</label>
            <select v-model="safeStyle.flexDirection" class="asp-input asp-input--select">
              <option value="">Ngang (Row)</option>
              <option value="column">Dọc (Col)</option>
            </select>
          </div>
        </div>
        
        <div class="asp-grid" style="margin-bottom:8px" v-if="safeStyle.display === 'flex'">
          <div class="asp-col">
            <label>Căn ngang (Justify)</label>
            <select v-model="safeStyle.justifyContent" class="asp-input asp-input--select">
              <option value="">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="space-between">Space Between</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Căn dọc (Align)</label>
            <select v-model="safeStyle.alignItems" class="asp-input asp-input--select">
              <option value="">Stretch</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
            </select>
          </div>
        </div>
        
        <div class="asp-row" v-if="safeStyle.display === 'flex' || safeStyle.display === 'grid'" style="margin-bottom:12px">
          <label>Khoảng cách (Gap)</label>
          <input v-model="safeStyle.gap" class="asp-input" placeholder="Ví dụ: 16px" />
        </div>

        <div class="asp-grid" style="margin-bottom:12px">
          <div class="asp-col"><label>Width</label><input v-model="safeStyle.width" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Height</label><input v-model="safeStyle.height" class="asp-input" placeholder="auto" /></div>
        </div>
        <div class="asp-grid" style="margin-bottom:12px">
          <div class="asp-col"><label>Min Width</label><input v-model="safeStyle.minWidth" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Min Height</label><input v-model="safeStyle.minHeight" class="asp-input" placeholder="auto" /></div>
        </div>
        <div class="asp-grid" style="margin-bottom:12px">
          <div class="asp-col"><label>Max Width</label><input v-model="safeStyle.maxWidth" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Max Height</label><input v-model="safeStyle.maxHeight" class="asp-input" placeholder="auto" /></div>
        </div>

        <!-- Box Model Graphic -->
        <label>Margin (Lề ngoài) & Padding (Lề trong)</label>
        <div class="box-model">
          <div class="bm-header">MARGIN</div>
          <input v-model="safeStyle.marginTop" class="bm-input bm-mt" placeholder="-" />
          <input v-model="safeStyle.marginRight" class="bm-input bm-mr" placeholder="-" />
          <input v-model="safeStyle.marginBottom" class="bm-input bm-mb" placeholder="-" />
          <input v-model="safeStyle.marginLeft" class="bm-input bm-ml" placeholder="-" />
          <div class="bm-inner">
            <div class="bm-header">PADDING</div>
            <input v-model="safeStyle.paddingTop" class="bm-input bm-pt" placeholder="-" />
            <input v-model="safeStyle.paddingRight" class="bm-input bm-pr" placeholder="-" />
            <input v-model="safeStyle.paddingBottom" class="bm-input bm-pb" placeholder="-" />
            <input v-model="safeStyle.paddingLeft" class="bm-input bm-pl" placeholder="-" />
            <div class="bm-core"></div>
          </div>
        </div>

      </div>
    </details>

    <!-- Typography Panel -->
    <details class="asp-accordion">
      <summary><Type :size="14" /> Typography <ChevronDown :size="14" class="asp-arr" /></summary>
      <div class="asp-accordion-body">
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Phông (Font Family)</label>
            <input v-model="safeStyle.fontFamily" class="asp-input" placeholder="Kế thừa" />
          </div>
          <div class="asp-col">
            <label>Cỡ (Size)</label>
            <input v-model="safeStyle.fontSize" class="asp-input" placeholder="16px" />
          </div>
        </div>
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Độ đậm (Weight)</label>
            <select v-model="safeStyle.fontWeight" class="asp-input asp-input--select">
              <option value="">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">ExtraBold (800)</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Cao dòng (Line Height)</label>
            <input v-model="safeStyle.lineHeight" class="asp-input" placeholder="1.5" />
          </div>
        </div>
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Màu chữ (Color)</label>
            <div class="color-wrap">
              <input type="color" v-model="safeStyle.color" class="color-picker" />
              <input v-model="safeStyle.color" class="asp-input" style="flex:1" placeholder="#000000" />
            </div>
          </div>
          <div class="asp-col">
            <label>Căn chữ (Align)</label>
            <div class="group-btn">
              <button :class="{active: safeStyle.textAlign === 'left'}" @click="toggleStyle('textAlign', 'left', '')"><AlignLeft :size="12" /></button>
              <button :class="{active: safeStyle.textAlign === 'center'}" @click="toggleStyle('textAlign', 'center', '')"><AlignCenter :size="12" /></button>
              <button :class="{active: safeStyle.textAlign === 'right'}" @click="toggleStyle('textAlign', 'right', '')"><AlignRight :size="12" /></button>
            </div>
          </div>
        </div>
      </div>
    </details>

    <!-- Backgrounds Panel -->
    <details class="asp-accordion">
      <summary><ImageIcon :size="14" /> Nền (Backgrounds) <ChevronDown :size="14" class="asp-arr" /></summary>
      <div class="asp-accordion-body">
        <label>Màu nền (Background Color)</label>
        <div class="color-wrap" style="margin-bottom:8px">
          <input type="color" v-model="safeStyle.backgroundColor" class="color-picker" />
          <input v-model="safeStyle.backgroundColor" class="asp-input" style="flex:1" placeholder="transparent" />
        </div>
        <label>Ảnh nền (Background Image)</label>
        <input v-model="safeStyle.backgroundImage" class="asp-input" placeholder="url('...')" style="margin-bottom:8px" />
        
        <div class="asp-grid" v-if="safeStyle.backgroundImage">
          <div class="asp-col">
            <label>Kích cỡ hình</label>
            <select v-model="safeStyle.backgroundSize" class="asp-input asp-input--select">
              <option value="">Auto</option>
              <option value="cover">Cover</option>
              <option value="contain">Contain</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Vị trí</label>
            <select v-model="safeStyle.backgroundPosition" class="asp-input asp-input--select">
              <option value="">Top Left</option>
              <option value="center center">Center</option>
              <option value="top center">Top Center</option>
              <option value="bottom center">Bottom Center</option>
            </select>
          </div>
        </div>
      </div>
    </details>

    <!-- Borders & Effects Panel -->
    <details class="asp-accordion">
      <summary><Sparkles :size="14" /> Hiệu ứng & Viền <ChevronDown :size="14" class="asp-arr" /></summary>
      <div class="asp-accordion-body">
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Bo góc (Radius)</label>
            <input v-model="safeStyle.borderRadius" class="asp-input" placeholder="0px" />
          </div>
          <div class="asp-col">
            <label>Độ trong (Opacity)</label>
            <input v-model="safeStyle.opacity" class="asp-input" placeholder="1" />
          </div>
        </div>
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Viền (Border Width)</label>
            <input v-model="safeStyle.borderWidth" class="asp-input" placeholder="0px" />
          </div>
          <div class="asp-col">
            <label>Kiểu viền (Style)</label>
            <select v-model="safeStyle.borderStyle" class="asp-input asp-input--select">
              <option value="">Kế thừa</option>
              <option value="solid">Đặc (Solid)</option>
              <option value="dashed">Đứt (Dashed)</option>
              <option value="dotted">Chấm (Dotted)</option>
            </select>
          </div>
        </div>
        <label>Màu viền (Border Color)</label>
        <div class="color-wrap" style="margin-bottom:8px">
          <input type="color" v-model="safeStyle.borderColor" class="color-picker" />
          <input v-model="safeStyle.borderColor" class="asp-input" style="flex:1" placeholder="transparent" />
        </div>
        <label>Tràn viền (Overflow)</label>
        <select v-model="safeStyle.overflow" class="asp-input asp-input--select" style="margin-bottom:8px">
          <option value="">Hiển thị (Visible)</option>
          <option value="hidden">Cắt đi (Hidden)</option>
          <option value="auto">Cuộn (Auto)</option>
        </select>
        
        <label>Bóng đổ (Box Shadow)</label>
        <input v-model="safeStyle.boxShadow" class="asp-input" placeholder="0 4px 6px rgba(0,0,0,0.1)" style="margin-bottom:8px" />

        <label>Biến hình (Transform)</label>
        <input v-model="safeStyle.transform" class="asp-input" placeholder="scale(1.05) translateY(-5px)" />
        <small v-if="activeState === 'hover'" style="color:#fbbf24; font-size:10px; display:block; margin-top:4px">Kéo thả Transform vào thẻ Hover rất hữu ích!</small>
      </div>
    </details>

    <div class="asp-section">
      <h4 class="asp-section-title">Nâng cao (Advanced)</h4>
      <div class="asp-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenDesktop"> Ẩn trên Desktop
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenTablet"> Ẩn trên Tablet
        </label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenMobile"> Ẩn trên Mobile
        </label>
      </div>
      <div class="asp-row" style="margin-top:12px">
        <label>Tailwind / Custom Classes</label>
        <input v-model="safeSettings.classes" type="text" class="asp-input" placeholder="e.g. max-w-lg mx-auto" />
      </div>
    </div>

    <!-- Magic Wand Popover -->
    <div v-if="wandOpenFor" class="wand-popover">
      <div class="wand-header">
        Chèn Biến Dữ Liệu
        <button @click="wandOpenFor = null" class="btn-icon-soft"><X :size="12" /></button>
      </div>
      <div class="wand-list">
        <button v-for="v in dynamicVariables" :key="v.key" @click="insertVariable(v.key)" class="wand-item">
          <span class="wand-key">{{ v.key }}</span>
          <span class="wand-desc">{{ v.desc }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { Monitor, Tablet, Smartphone, Wand2, X, Sparkles, LayoutGrid, Type, Image as ImageIcon, ChevronDown, AlignLeft, AlignCenter, AlignRight } from 'lucide-vue-next'

const props = defineProps({
  section: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:section'])

const type = computed(() => props.section.type)

const activeDevice = ref('desktop')
const activeState = ref('normal')
const wandOpenFor = ref(null)

const dynamicVariables = [
  { key: '{{ item.id }}', desc: 'ID' },
  { key: '{{ item.title }}', desc: 'Tiêu đề' },
  { key: '{{ item.excerpt }}', desc: 'Đoạn trích' },
  { key: '{{ item.price }}', desc: 'Giá bán' },
  { key: '{{ item.compare_price }}', desc: 'Giá gốc' },
  { key: '{{ item.image }}', desc: 'Ảnh đại diện' },
  { key: '{{ item.url }}', desc: 'Đường dẫn' }
]

function openWand(field) {
  wandOpenFor.value = field
}

function insertVariable(val) {
  if (wandOpenFor.value === 'content') {
    if (!props.section.content) props.section.content = ''
    props.section.content += (props.section.content ? ' ' : '') + val
  } else if (wandOpenFor.value === 'src') {
    if (!props.section.settings) props.section.settings = { style: {} }
    props.section.settings.src = val
  }
  wandOpenFor.value = null
}

const initSettings = () => {
  if (!props.section.settings) {
    props.section.settings = { style: {}, hoverStyle: {}, tabletStyle: {}, mobileStyle: {} }
  }
  if (!props.section.settings.style) props.section.settings.style = {}
  if (!props.section.settings.hoverStyle) props.section.settings.hoverStyle = {}
  if (!props.section.settings.tabletStyle) props.section.settings.tabletStyle = {}
  if (!props.section.settings.tabletHoverStyle) props.section.settings.tabletHoverStyle = {}
  if (!props.section.settings.mobileStyle) props.section.settings.mobileStyle = {}
  if (!props.section.settings.mobileHoverStyle) props.section.settings.mobileHoverStyle = {}
}

import { watch } from 'vue'
watch(() => props.section, () => {
  initSettings()
}, { immediate: true, deep: false })

const safeSettings = computed(() => {
  return props.section.settings || {}
})

const safeStyle = computed(() => {
  if (!props.section.settings) return {}
  
  let key = 'style'
  if (activeDevice.value === 'desktop') {
    key = activeState.value === 'hover' ? 'hoverStyle' : 'style'
  } else if (activeDevice.value === 'tablet') {
    key = activeState.value === 'hover' ? 'tabletHoverStyle' : 'tabletStyle'
  } else if (activeDevice.value === 'mobile') {
    key = activeState.value === 'hover' ? 'mobileHoverStyle' : 'mobileStyle'
  }

  return props.section.settings[key] || {}
})

const hasContentConfig = computed(() => {
  return ['text', 'heading', 'image', 'button', 'link', 'iframe', 'video'].includes(type.value)
})

function toggleStyle(key, value, defaultVal = '') {
  if (safeStyle.value[key] === value) {
    safeStyle.value[key] = defaultVal
  } else {
    safeStyle.value[key] = value
  }
}
</script>

<style scoped>
.advanced-style-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  color: #e2e8f0;
}
.asp-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(0,0,0,0.15);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 8px;
  padding: 4px;
}
.asp-tabs {
  display: flex;
  align-items: center;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
  padding: 2px;
}
.asp-tabs button {
  background: transparent;
  color: #94a3b8;
  border: none;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.asp-tabs button:hover {
  color: #fff;
}
.asp-tabs button.active {
  background: #4f46e5;
  color: #fff;
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.asp-section {
  background: var(--bg-card, rgba(0,0,0,0.15));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  border-radius: 8px;
  padding: 12px;
}
.asp-section-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* Accordions */
.asp-accordion {
  background: var(--bg-card, rgba(0,0,0,0.15));
  border: 1px solid var(--border-color, rgba(255,255,255,0.05));
  border-radius: 8px;
  overflow: hidden;
}
.asp-accordion summary {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 700;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.03);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  list-style: none;
  user-select: none;
}
.asp-accordion summary::-webkit-details-marker { display: none; }
.asp-accordion summary:hover { background: rgba(255,255,255,0.06); }
.asp-arr { margin-left: auto; transition: transform 0.2s; color: #94a3b8; }
.asp-accordion[open] .asp-arr { transform: rotate(180deg); }
.asp-accordion-body {
  padding: 12px;
  border-top: 1px solid rgba(255,255,255,0.05);
}

.asp-row { margin-bottom: 8px; }
.asp-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.asp-col {
  display: flex;
  flex-direction: column;
}
label {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
  font-weight: 500;
}
.asp-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  background: #0f1115;
  color: #e2e8f0;
  font-size: 12px;
  transition: border-color 0.2s;
}
.asp-input:focus {
  outline: none;
  border-color: #6366f1;
}
.asp-input::placeholder { color: #475569; }
.asp-input--select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  padding-right: 28px;
}

.color-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.color-picker {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 4px;
  cursor: pointer;
  background: none;
}

.group-btn {
  display: flex;
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
  overflow: hidden;
}
.group-btn button {
  flex: 1;
  background: #0f1115;
  color: #94a3b8;
  border: none;
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-right: 1px solid rgba(255,255,255,0.1);
}
.group-btn button:last-child { border-right: none }
.group-btn button:hover { background: rgba(255,255,255,0.05); color: #fff; }
.group-btn button.active { background: rgba(99,102,241,0.2); color: #818cf8; }

.btn-icon-soft {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-icon-soft:hover { background: rgba(255,255,255,0.1); color: #fff; }

/* Box Model Graphic */
.box-model {
  position: relative;
  background: #0f1115;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 6px;
  width: 100%;
  max-width: 250px;
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  user-select: none;
  font-family: monospace;
}
.bm-header { position: absolute; top: 4px; left: 6px; font-size: 9px; color: #475569; font-weight: 700; width: 100%; pointer-events: none;}
.bm-input {
  position: absolute;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
  text-align: center;
  width: 30px;
  z-index: 2;
}
.bm-input:hover, .bm-input:focus { background: rgba(255,255,255,0.05); color: #fff; outline: none; border-radius: 4px; }
.bm-mt { top: 4px; left: 50%; transform: translateX(-50%); }
.bm-mb { bottom: 4px; left: 50%; transform: translateX(-50%); }
.bm-ml { left: 4px; top: 50%; transform: translateY(-50%); }
.bm-mr { right: 4px; top: 50%; transform: translateY(-50%); }

.bm-inner {
  position: relative;
  background: rgba(255,255,255,0.03);
  border: 1px dashed rgba(255,255,255,0.15);
  border-radius: 4px;
  padding: 24px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.bm-pt { top: 4px; left: 50%; transform: translateX(-50%); }
.bm-pb { bottom: 4px; left: 50%; transform: translateX(-50%); }
.bm-pl { left: 4px; top: 50%; transform: translateY(-50%); }
.bm-pr { right: 4px; top: 50%; transform: translateY(-50%); }

.bm-core {
  background: rgba(255,255,255,0.1);
  border-radius: 2px;
  width: 100%;
  height: 20px;
}

.wand-popover {
  position: absolute;
  top: 40px;
  left: 10px;
  right: 10px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.5);
  z-index: 1000;
  overflow: hidden;
}
.wand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #334155;
  font-size: 11px;
  font-weight: 600;
  background: rgba(0,0,0,0.2);
}
.wand-list {
  max-height: 200px;
  overflow-y: auto;
}
.wand-item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: none;
  border: none;
  font-size: 11px;
  color: #cbd5e1;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.03);
  transition: background 0.2s;
}
.wand-item:hover {
  background: rgba(99,102,241,0.2);
  color: #fff;
}
.wand-item .wand-key { font-family: monospace; color: #818cf8; }
.wand-item .wand-desc { opacity: 0.7; }
</style>
