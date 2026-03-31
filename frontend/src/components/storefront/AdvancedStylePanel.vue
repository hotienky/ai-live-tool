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
    
    <!-- 1. Content/Settings logic for elements -->
    <div class="asp-section" v-if="hasContentConfig">
      <h4 class="asp-section-title">Nội dung ({{ type }})</h4>
      <div v-if="type === 'text' || type === 'heading'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Văn bản
          <button @click="openWand('content')" class="btn-icon-soft" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
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
          <button @click="openWand('content')" class="btn-icon-soft" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
        </label>
        <input v-model="section.content" type="text" class="asp-input" />
      </div>
      <div v-else-if="type === 'image'" class="asp-row">
        <label style="display:flex;justify-content:space-between;align-items:center">
          Đường dẫn thẻ ảnh (URL)
          <button @click="openWand('src')" class="btn-icon-soft" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
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

    <!-- THUẬT TOÁN CHIẾT XUẤT Ý ĐỊNH (OMNI COMMAND & SMART DNA PILLS) -->
    <div class="asp-section asp-section--zen">
      <h4 class="asp-section-title" style="display:flex;align-items:center;">
        <Sparkles :size="14" style="margin-right: 6px; color: #a855f7" /> 
        Trợ lý thiết kế ý định (Zen UI)
      </h4>
      
      <!-- Omni Command Input -->
      <div class="asp-row">
        <div class="omni-search-box">
          <input 
            type="text" 
            v-model="omniQuery" 
            @keyup.enter="applyOmniCommand"
            class="asp-input omni-input" 
            placeholder="Bạn muốn tuỳ chỉnh gì? (Chưa hỗ trợ NLP)" 
            data-tooltip="Tính năng NLP đang phát triển..."
            disabled
          />
        </div>
        <div class="omni-hint" v-if="omniFeedback">{{ omniFeedback }}</div>
      </div>

      <!-- Contextual Smart Pills -->
      <div class="asp-row" style="margin-top: 16px">
        <label style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; display: block; letter-spacing: 0.5px;">Phím tắt cho {{ type }}</label>
        
        <div class="smart-pills-container">
          <!-- Text constraints -->
          <template v-if="['text', 'heading', 'button', 'link'].includes(type)">
            <button class="smart-pill" :class="{ active: safeStyle.textAlign === 'center' }" @click="toggleStyle('textAlign', 'center', '')">Căn giữa</button>
            <button class="smart-pill" :class="{ active: safeStyle.textAlign === 'right' }" @click="toggleStyle('textAlign', 'right', '')">Căn phải</button>
            <button class="smart-pill" :class="{ active: safeStyle.fontWeight === '700' }" @click="toggleStyle('fontWeight', '700', '')">In đậm</button>
            <button class="smart-pill" :class="{ active: safeStyle.color === 'var(--sf-primary)' }" @click="toggleStyle('color', 'var(--sf-primary)', '')">Màu hệ thống</button>
            <button class="smart-pill" :class="{ active: safeStyle.fontSize === '24px' }" @click="toggleStyle('fontSize', '24px', '')">Cỡ to (24px)</button>
          </template>

          <!-- Box constraints -->
          <template v-if="['container', 'grid', 'card', 'col', 'row', 'image'].includes(type) || type === 'button'">
            <button class="smart-pill" :class="{ active: safeStyle.borderRadius === '8px' }" @click="toggleStyle('borderRadius', '8px', '0')">Bo mềm (8px)</button>
            <button class="smart-pill" :class="{ active: safeStyle.borderRadius === '999px' }" @click="toggleStyle('borderRadius', '999px', '0')">Bo tròn xoe</button>
            <button class="smart-pill" :class="{ active: safeStyle.boxShadow }" @click="toggleStyle('boxShadow', '0 10px 15px -3px rgba(0,0,0,0.1)', '')">Bóng đổ nổi</button>
            <button class="smart-pill" :class="{ active: safeStyle.border }" @click="toggleStyle('border', '1px solid rgba(255,255,255,0.15)', '')">Có viền mỏng</button>
          </template>

          <!-- Layout constraints -->
          <template v-if="['container', 'grid', 'card', 'col', 'row'].includes(type)">
            <button class="smart-pill" :class="{ active: safeStyle.backgroundColor === 'rgba(255,255,255,0.05)' }" @click="toggleStyle('backgroundColor', 'rgba(255,255,255,0.05)', '')">Nền xám mờ</button>
            <button class="smart-pill" :class="{ active: safeStyle.padding === '16px' }" @click="toggleStyle('padding', '16px', '0')">Đệm vừa (p-4)</button>
            <button class="smart-pill" :class="{ active: safeStyle.padding === '32px' }" @click="toggleStyle('padding', '32px', '0')">Đệm to (p-8)</button>
            <button class="smart-pill" :class="{ active: safeStyle.display === 'flex' }" @click="applyFlexCenter">Lưới Flex Center</button>
            <button class="smart-pill" :class="{ active: safeStyle.width === '100%' }" @click="toggleStyle('width', '100%', 'auto')">Rộng 100%</button>
            <button class="smart-pill" :class="{ active: safeStyle.margin === '0 auto' }" @click="toggleStyle('margin', '0 auto', '0')">Chính giữa trang</button>
          </template>

          <!-- Gap constraints -->
          <template v-if="safeStyle.display === 'flex' || safeStyle.display === 'grid' || type === 'grid'">
             <button class="smart-pill" :class="{ active: safeStyle.gap === '16px' }" @click="toggleStyle('gap', '16px', '0')">Giãn cách (16px)</button>
          </template>

          <!-- Grid constraints -->
          <template v-if="type === 'grid'">
             <button class="smart-pill" :class="{ active: safeStyle.gridTemplateColumns === '1fr 1fr' }" @click="toggleStyle('gridTemplateColumns', '1fr 1fr', '')">Chia 2 cột</button>
             <button class="smart-pill" :class="{ active: safeStyle.gridTemplateColumns === '1fr 1fr 1fr' }" @click="toggleStyle('gridTemplateColumns', '1fr 1fr 1fr', '')">Chia 3 cột</button>
          </template>

          <!-- Hover constraints -->
          <template v-if="activeState === 'hover'">
            <button class="smart-pill" :class="{ active: safeStyle.transform === 'scale(1.05)' }" @click="toggleStyle('transform', 'scale(1.05)', '')">Phóng to (Zoom)</button>
            <button class="smart-pill" :class="{ active: safeStyle.transform === 'translateY(-10px)' }" @click="toggleStyle('transform', 'translateY(-10px)', '')">Nảy lên nhè nhẹ</button>
            <button class="smart-pill" :class="{ active: safeStyle.opacity === '0.7' }" @click="toggleStyle('opacity', '0.7', '1')">Mờ đi (Opacity)</button>
          </template>
        </div>
      </div>
    </div>

    <!-- 7. Hiển thị Responsive (Visibility) -->
    <div class="asp-section">
      <h4 class="asp-section-title">Khả năng hiển thị theo Thiết bị</h4>
      <div class="asp-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenDesktop"> Ẩn trên máy tính (Desktop >1024px)
        </label>
      </div>
      <div class="asp-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenTablet"> Ẩn trên máy tính bảng (Tablet)
        </label>
      </div>
      <div class="asp-row">
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer">
          <input type="checkbox" v-model="safeSettings.hiddenMobile"> Ẩn trên điện thoại (Mobile <768px)
        </label>
      </div>
    </div>

    <!-- 8. Animate On Scroll (AOS) -->
    <div class="asp-section">
      <h4 class="asp-section-title">Hiệu ứng cuộn trang (AOS)</h4>
      <div class="asp-row">
        <label>Kiểu xuất hiện (Animation)</label>
        <select v-model="safeSettings.aosAnim" class="asp-input asp-input--select">
          <option value="">Không có (Mặc định)</option>
          <option value="fade-up">Fade Up</option>
          <option value="fade-down">Fade Down</option>
          <option value="fade-left">Fade Left</option>
          <option value="fade-right">Fade Right</option>
          <option value="zoom-in">Zoom In</option>
          <option value="zoom-in-up">Zoom In Up</option>
          <option value="flip-left">Flip Left</option>
          <option value="flip-up">Flip Up</option>
        </select>
      </div>
      <div class="asp-row" style="margin-top:8px" v-if="safeSettings.aosAnim">
        <label>Độ trễ thời gian (Delay: ms)</label>
        <div style="display:flex; gap:8px; align-items:center">
          <input type="range" v-model.number="safeSettings.aosDelay" min="0" max="1500" step="50" style="flex:1" />
          <span style="font-size:11px;color:#94a3b8;width:35px">{{ safeSettings.aosDelay || 0 }}ms</span>
        </div>
      </div>
    </div>

    <!-- 9. Lớp CSS Tùy Chỉnh -->
    <div class="asp-section">
      <h4 class="asp-section-title">Lớp CSS Tùy Chỉnh</h4>
      <div class="asp-row">
        <label>Tailwind / Custom Classes</label>
        <input v-model="safeSettings.classes" type="text" class="asp-input" placeholder="e.g. shadow-lg relative" />
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
import { Monitor, Tablet, Smartphone, Wand2, X, Sparkles, Search } from 'lucide-vue-next'

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

// === OMNI COMMAND & SMART PILLS LOGIC ===
const omniQuery = ref('')
const omniFeedback = ref('')

function toggleStyle(key, value, defaultVal = '') {
  if (safeStyle.value[key] === value) {
    safeStyle.value[key] = defaultVal
  } else {
    safeStyle.value[key] = value
  }
}

function applyFlexCenter() {
  if (safeStyle.value.display === 'flex') {
    safeStyle.value.display = ''
    safeStyle.value.flexDirection = ''
    safeStyle.value.justifyContent = ''
    safeStyle.value.alignItems = ''
  } else {
    safeStyle.value.display = 'flex'
    safeStyle.value.flexDirection = 'column'
    safeStyle.value.justifyContent = 'center'
    safeStyle.value.alignItems = 'center'
  }
}

function applyHoverPop() {
  toggleStyle('transform', 'translateY(-5px) scale(1.02)', '')
  toggleStyle('boxShadow', '0 20px 25px -5px rgba(0,0,0,0.1)', '')
}

function applyOmniCommand() {
  omniFeedback.value = "NLP Bot đang được nâng cấp... Hãy dùng tạm Nút Bấm bên dưới nhé!"
  setTimeout(() => omniFeedback.value = "", 3000)
}
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

/* ZEN UI: OMNI COMMAND & PILLS */
.asp-section--zen {
  background: rgba(168, 85, 247, 0.05); /* very light purple tint */
  border: 1px dashed rgba(168, 85, 247, 0.2);
}
.omni-search-box {
  position: relative;
  width: 100%;
}
.omni-icon {
  position: absolute;
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}
.omni-input {
  width: 100%;
  padding-left: 28px;
  border-radius: 6px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: #fff;
  transition: all 0.2s;
}
.omni-input:focus {
  border-color: #a855f7;
  box-shadow: 0 0 0 2px rgba(168, 85, 247, 0.2);
}
.omni-hint {
  font-size: 10px;
  color: #a855f7;
  margin-top: 4px;
}
.smart-pills-container {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.smart-pill {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #cbd5e1;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}
.smart-pill:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
  color: #fff;
}
.smart-pill.active {
  background: #a855f7;
  border-color: #a855f7;
  color: #fff;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.4);
}
</style>
