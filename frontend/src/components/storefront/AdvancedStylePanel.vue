<template>
  <div class="advanced-style-panel">
    <!-- State Configurator -->
    <div class="asp-switcher">
      <div class="asp-tabs device-tabs">
        <button :class="{ active: activeDevice === 'desktop' }" @click="activeDevice = 'desktop'" title="Desktop"><Monitor :size="14" /></button>
        <button :class="{ active: activeDevice === 'tablet' }" @click="activeDevice = 'tablet'" title="Tablet"><Tablet :size="14" /></button>
        <button :class="{ active: activeDevice === 'mobile' }" @click="activeDevice = 'mobile'" title="Mobile"><Smartphone :size="14" /></button>
      </div>
      <div class="asp-tabs state-tabs">
        <button :class="{ active: activeState === 'normal' }" @click="activeState = 'normal'">Normal</button>
        <button :class="{ active: activeState === 'hover' }" @click="activeState = 'hover'">Hover</button>
      </div>
    </div>
    
    <!-- 1. Content/Settings logic for elements -->
    <div class="asp-section" v-if="hasContentConfig">
      <h4 class="asp-section-title">Nội dung ({{ type }})</h4>
      <div v-if="type === 'text' || type === 'heading'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Văn bản
          <button @click="openWand('content')" class="btn-icon-soft" title="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <textarea v-model="section.content" rows="3" class="asp-input" placeholder="Nhập văn bản..."></textarea>
      </div>
      <div v-if="type === 'heading'" class="asp-row" style="margin-top: 8px">
        <label>Thẻ tiêu đề (Tag)</label>
        <select v-model="safeSettings.tag" class="asp-input asp-input--select">
          <option value="">Default (H2)</option>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6</option>
          <option value="p">Paragraph</option>
        </select>
      </div>
      <div v-else-if="type === 'button'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Nhãn nút
          <button @click="openWand('content')" class="btn-icon-soft" title="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <input v-model="section.content" type="text" class="asp-input" />
      </div>
      <div v-else-if="type === 'image'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Đường dẫn thẻ ảnh (URL)
          <button @click="openWand('src')" class="btn-icon-soft" title="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <input v-model="safeSettings.src" type="text" class="asp-input" placeholder="https://..." />
        <label style="margin-top: 8px">Căn ảnh (Object Fit)</label>
        <select v-model="safeStyle.objectFit" class="asp-input asp-input--select">
          <option value="">Default</option>
          <option value="cover">Cover (Phủ kín)</option>
          <option value="contain">Contain (Vừa khung)</option>
          <option value="fill">Fill (Giãn đầy)</option>
        </select>
      </div>
      <div v-else-if="type === 'iframe'" class="asp-row">
        <label>URL (Iframe Embed)</label>
        <input v-model="safeSettings.src" type="text" class="asp-input" placeholder="https://..." />
      </div>
      <div v-else-if="type === 'video'" class="asp-row">
        <label>URL Nguồn Video</label>
        <input v-model="safeSettings.src" type="text" class="asp-input" placeholder="https://..." />
        <div class="asp-grid" style="margin-top:8px">
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.autoplay"> Autoplay</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.loop"> Loop</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.controls"> Controls</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" v-model="safeSettings.muted"> Muted</label>
        </div>
      </div>
      <div v-else-if="type === 'link'" class="asp-row">
        <label>Liên kết (Href)</label>
        <input v-model="safeSettings.href" type="text" class="asp-input" placeholder="/about" />
        <div class="asp-row" style="margin-top: 8px;">
          <label>Mở Tab Mới</label>
          <select v-model="safeSettings.target" class="asp-input asp-input--select">
            <option value="">Không (Current Tab)</option>
            <option value="_blank">Có (New Tab)</option>
          </select>
        </div>
        <label style="margin-top: 8px;">Nội dung Link</label>
        <input v-model="section.content" type="text" class="asp-input" />
      </div>
    </div>

    <!-- 2. Typography -->
    <div class="asp-section" v-if="['text', 'heading', 'button', 'link'].includes(type)">
      <h4 class="asp-section-title">Kiểu chữ</h4>
      <div class="asp-grid">
        <div class="asp-col">
          <label>Cỡ (Kích thước)</label>
          <input v-model="safeStyle.fontSize" type="text" class="asp-input asp-input--sm" placeholder="e.g. 16px" />
        </div>
        <div class="asp-col">
          <label>Độ đậm</label>
          <select v-model="safeStyle.fontWeight" class="asp-input asp-input--select">
            <option value="">Mặc định</option>
            <option value="400">Normal (400)</option>
            <option value="500">Medium (500)</option>
            <option value="600">Semi Bold (600)</option>
            <option value="700">Bold (700)</option>
            <option value="800">Extra Bold (800)</option>
          </select>
        </div>
      </div>
      <div class="asp-grid" style="margin-top: 8px">
        <div class="asp-col">
          <label>Căn lề (Align)</label>
          <select v-model="safeStyle.textAlign" class="asp-input asp-input--select">
            <option value="">None</option>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
            <option value="justify">Justify</option>
          </select>
        </div>
        <div class="asp-col">
          <label>Màu chữ</label>
          <input v-model="safeStyle.color" type="text" class="asp-input asp-input--sm" placeholder="#000000" />
          <div class="color-tokens">
            <button class="token-dot" style="background:var(--sf-primary)" @click="safeStyle.color = 'var(--sf-primary)'" title="Primary"></button>
            <button class="token-dot" style="background:var(--sf-accent)" @click="safeStyle.color = 'var(--sf-accent)'" title="Accent"></button>
            <button class="token-dot" style="background:var(--sf-bg)" @click="safeStyle.color = 'var(--sf-bg)'" title="Background"></button>
            <button class="token-dot" style="background:var(--sf-text)" @click="safeStyle.color = 'var(--sf-text)'" title="Text Color"></button>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Layout (Flex) -->
    <div class="asp-section" v-if="['container', 'grid', 'row', 'col', 'card'].includes(type)">
      <h4 class="asp-section-title">Bố cục (Layout)</h4>
      <div class="asp-grid">
        <div class="asp-col">
          <label>Hiển thị (Display)</label>
          <select v-model="safeStyle.display" class="asp-input asp-input--select">
            <option value="">Block</option>
            <option value="flex">Flexbox</option>
            <option value="grid">Grid</option>
            <option value="inline-block">Inline Block</option>
            <option value="none">None</option>
          </select>
        </div>
        <div class="asp-col">
          <label>Tràn (Overflow)</label>
          <select v-model="safeStyle.overflow" class="asp-input asp-input--select">
            <option value="">Default</option>
            <option value="hidden">Hidden</option>
            <option value="visible">Visible</option>
            <option value="auto">Auto / Scroll</option>
          </select>
        </div>
      </div>
      
      <template v-if="safeStyle.display === 'flex'">
        <div class="asp-grid" style="margin-top: 8px">
          <div class="asp-col">
            <label>Hướng</label>
            <select v-model="safeStyle.flexDirection" class="asp-input asp-input--select">
              <option value="row">Ngang (Row)</option>
              <option value="column">Dọc (Col)</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Căn ngang</label>
            <select v-model="safeStyle.justifyContent" class="asp-input asp-input--select">
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
              <option value="space-between">Space Between</option>
            </select>
          </div>
        </div>
        <div class="asp-grid" style="margin-top: 8px">
          <div class="asp-col">
            <label>Căn dọc</label>
            <select v-model="safeStyle.alignItems" class="asp-input asp-input--select">
              <option value="stretch">Stretch</option>
              <option value="flex-start">Start</option>
              <option value="center">Center</option>
              <option value="flex-end">End</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Khoảng cách (Gap)</label>
            <input v-model="safeStyle.gap" type="text" class="asp-input asp-input--sm" placeholder="e.g. 16px" />
          </div>
        </div>
      </template>

      <template v-if="safeStyle.display === 'grid'">
         <div class="asp-row" style="margin-top: 8px">
          <label>Lưới cột (Template Columns)</label>
          <input v-model="safeStyle.gridTemplateColumns" type="text" class="asp-input asp-input--sm" placeholder="1fr 1fr" />
        </div>
        <div class="asp-row" style="margin-top: 8px">
          <label>Khoảng cách (Gap)</label>
          <input v-model="safeStyle.gap" type="text" class="asp-input asp-input--sm" placeholder="16px" />
        </div>
      </template>
    </div>

    <!-- 4. Spacing -->
    <div class="asp-section">
      <h4 class="asp-section-title">Khoảng cách</h4>
      <div class="asp-grid">
        <div class="asp-col">
          <label>Padding (Trong)</label>
          <input v-model="safeStyle.padding" type="text" class="asp-input asp-input--sm" placeholder="10px 16px" />
        </div>
        <div class="asp-col">
          <label>Margin (Ngoài)</label>
          <input v-model="safeStyle.margin" type="text" class="asp-input asp-input--sm" placeholder="0 auto" />
        </div>
      </div>
      <div class="asp-grid" style="margin-top: 8px">
        <div class="asp-col">
          <label>Chiều rộng (Width)</label>
          <input v-model="safeStyle.width" type="text" class="asp-input asp-input--sm" placeholder="100%" />
        </div>
        <div class="asp-col">
          <label>Chiều cao (Height)</label>
          <input v-model="safeStyle.height" type="text" class="asp-input asp-input--sm" placeholder="auto" />
        </div>
      </div>
    </div>

    <!-- 5. Background & Border -->
    <div class="asp-section">
      <h4 class="asp-section-title">Trang trí (Background/Border)</h4>
      <div class="asp-grid">
        <div class="asp-col">
          <label>Màu nền</label>
          <input v-model="safeStyle.backgroundColor" type="text" class="asp-input asp-input--sm" placeholder="#ffffff" />
        </div>
        <div class="asp-col">
          <label>Bo góc (Radius)</label>
          <input v-model="safeStyle.borderRadius" type="text" class="asp-input asp-input--sm" placeholder="4px" />
        </div>
      </div>
      <div class="asp-grid" style="margin-top: 8px">
        <div class="asp-col">
          <label>Viền (Border)</label>
          <input v-model="safeStyle.border" type="text" class="asp-input asp-input--sm" placeholder="1px solid #ccc" />
        </div>
        <div class="asp-col">
          <label>Bóng đổ (Shadow)</label>
          <input v-model="safeStyle.boxShadow" type="text" class="asp-input asp-input--sm" placeholder="0 4px 6px rgba(0,0,0,0.1)" />
        </div>
      </div>
      <div class="asp-row" style="margin-top: 8px">
        <label>Ảnh nền (URL)</label>
        <input v-model="safeStyle.backgroundImage" type="text" class="asp-input asp-input--sm" placeholder="url(...)" />
      </div>
    </div>

    <!-- 6. Hiệu ứng (Effects) -->
    <div class="asp-section">
      <h4 class="asp-section-title">Trạng thái & Hiệu Ứng</h4>
      <div class="asp-row">
        <label>Biến đổi hình học (Transform)</label>
        <input v-model="safeStyle.transform" type="text" class="asp-input" placeholder="scale(1.05) translateY(-5px)" />
      </div>
      <div class="asp-row" style="margin-top: 8px">
        <label>Gia tốc chuyển động (Transition)</label>
        <input v-model="safeStyle.transition" type="text" class="asp-input" placeholder="all 0.3s ease" />
      </div>
    </div>

    <!-- 6. CSS Nâng cao -->
    <div class="asp-section">
      <h4 class="asp-section-title">Lớp CSS Tùy Chỉnh</h4>
      <div class="asp-row">
        <label>Tailwind / Custom Classes</label>
        <input v-model="safeSettings.classes" type="text" class="asp-input" placeholder="e.g. shadow-lg relative hidden-xs" />
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
import { Monitor, Tablet, Smartphone, Wand2, X } from 'lucide-vue-next'

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

const safeSettings = computed(() => {
  if (!props.section.settings) {
    props.section.settings = { style: {}, hoverStyle: {}, tabletStyle: {}, mobileStyle: {} }
  }
  return props.section.settings
})

const safeStyle = computed(() => {
  if (!safeSettings.value) return {}
  
  let key = 'style'
  if (activeDevice.value === 'desktop') {
    key = activeState.value === 'hover' ? 'hoverStyle' : 'style'
  } else if (activeDevice.value === 'tablet') {
    key = activeState.value === 'hover' ? 'tabletHoverStyle' : 'tabletStyle'
  } else if (activeDevice.value === 'mobile') {
    key = activeState.value === 'hover' ? 'mobileHoverStyle' : 'mobileStyle'
  }

  if (!safeSettings.value[key]) {
    safeSettings.value[key] = {}
  }
  return safeSettings.value[key]
})

const hasContentConfig = computed(() => {
  return ['text', 'heading', 'image', 'button', 'link', 'iframe', 'video'].includes(type.value)
})
</script>

<style scoped>
.advanced-style-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
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
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 6px;
}
.asp-row {
  margin-bottom: 8px;
}
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
  font-size: 11px;
  color: #94a3b8;
  margin-bottom: 4px;
  display: block;
}
.asp-input {
  width: 100%;
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(0,0,0,0.2);
  color: #e2e8f0;
  font-size: 12px;
  transition: border-color 0.2s;
}
.asp-input:focus {
  outline: none;
  border-color: #6366f1;
}
.asp-input--select {
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 14px;
  padding-right: 28px;
}
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
.btn-icon-soft:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
.color-tokens {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}
.color-tokens .token-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  padding: 0;
  transition: transform 0.1s;
}
.color-tokens .token-dot:hover {
  transform: scale(1.1);
}
.wand-popover {
  position: absolute;
  top: 40px;
  left: 10px;
  right: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  z-index: 1000;
  overflow: hidden;
}
.wand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  font-size: 11px;
  font-weight: 600;
  background: rgba(0,0,0,0.1);
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
  color: var(--text-secondary);
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.wand-item:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}
.wand-item .wand-key {
  font-family: monospace;
  color: var(--accent);
}
.wand-item .wand-desc {
  opacity: 0.7;
}
</style>
