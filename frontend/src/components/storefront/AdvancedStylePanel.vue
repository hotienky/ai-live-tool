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
          <button @click="openWand('content')" class="asp-btn-icon" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
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
          <button @click="openWand('src')" class="asp-btn-icon" data-tooltip="Biến dữ liệu động" style="height:20px;width:20px;padding:2px"><Wand2 :size="12"/></button>
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
          <label>Mở Tab Mới</label>
          <select v-model="safeSettings.target" class="asp-input asp-input--select">
            <option value="">Không</option>
            <option value="_blank">Có (_blank)</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Layout & Spacing Panel -->
    <details class="asp-accordion" open>
      <summary>
        <LayoutGrid :size="14" /> Layout & Spacing 
        <ChevronDown :size="14" class="asp-arr" />
      </summary>
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
              <option value="space-around">Space Around</option>
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

        <div class="asp-grid" style="margin-bottom:8px" v-if="safeStyle.display === 'flex'">
          <div class="asp-col">
            <label>Quấn dòng (Flex Wrap)</label>
            <select v-model="safeStyle.flexWrap" class="asp-input asp-input--select">
              <option value="">Không</option>
              <option value="wrap">Wrap</option>
              <option value="wrap-reverse">Wrap Reverse</option>
            </select>
          </div>
          <div class="asp-col">
            <label>Khoảng cách (Gap)</label>
            <input v-model="safeStyle.gap" class="asp-input" placeholder="Ví dụ: 16px" />
          </div>
        </div>
        
        <div class="asp-row" v-if="safeStyle.display === 'grid'" style="margin-bottom:12px">
          <label>Grid Columns</label>
          <input v-model="safeStyle.gridTemplateColumns" class="asp-input" placeholder="1fr 1fr 1fr" />
        </div>
        <div class="asp-row" v-if="safeStyle.display === 'grid'" style="margin-bottom:12px">
          <label>Khoảng cách (Gap)</label>
          <input v-model="safeStyle.gap" class="asp-input" placeholder="16px" />
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
              <option value="300">Light (300)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semibold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">ExtraBold (800)</option>
              <option value="900">Black (900)</option>
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
        <div class="asp-grid" style="margin-bottom:8px">
          <div class="asp-col">
            <label>Khoảng chữ (Letter Spacing)</label>
            <input v-model="safeStyle.letterSpacing" class="asp-input" placeholder="normal" />
          </div>
          <div class="asp-col">
            <label>Trang trí (Decoration)</label>
            <select v-model="safeStyle.textDecoration" class="asp-input asp-input--select">
              <option value="">Không</option>
              <option value="underline">Gạch dưới</option>
              <option value="line-through">Gạch ngang</option>
              <option value="overline">Gạch trên</option>
            </select>
          </div>
        </div>
        <div class="asp-row">
          <label>Chuyển kiểu chữ (Transform)</label>
          <select v-model="safeStyle.textTransform" class="asp-input asp-input--select">
            <option value="">Không</option>
            <option value="uppercase">IN HOA</option>
            <option value="lowercase">viết thường</option>
            <option value="capitalize">Viết Hoa Đầu</option>
          </select>
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
        <label>Gradient (Background)</label>
        <input v-model="safeStyle.background" class="asp-input" placeholder="linear-gradient(135deg, #667eea, #764ba2)" style="margin-bottom:8px" />
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
          <option value="scroll">Scroll</option>
        </select>
        
        <label>Bóng đổ (Box Shadow)</label>
        <div class="asp-shadow-presets">
          <button v-for="preset in shadowPresets" :key="preset.name" 
            class="asp-shadow-chip" 
            :class="{ active: safeStyle.boxShadow === preset.value }"
            @click="safeStyle.boxShadow = safeStyle.boxShadow === preset.value ? '' : preset.value"
            :title="preset.name">
            {{ preset.label }}
          </button>
        </div>
        <input v-model="safeStyle.boxShadow" class="asp-input" placeholder="0 4px 6px rgba(0,0,0,0.1)" style="margin-bottom:8px" />

        <label>Biến hình (Transform)</label>
        <input v-model="safeStyle.transform" class="asp-input" placeholder="scale(1.05) translateY(-5px)" />
        <small v-if="activeState === 'hover'" class="asp-hint-hover">Tip: Transform + Transition rất hữu ích cho Hover!</small>

        <label style="margin-top:8px">Chuyển cảnh (Transition)</label>
        <input v-model="safeStyle.transition" class="asp-input" placeholder="all 0.3s ease" />

        <label style="margin-top:8px">Con trỏ (Cursor)</label>
        <select v-model="safeStyle.cursor" class="asp-input asp-input--select">
          <option value="">Mặc định</option>
          <option value="pointer">Pointer (Tay)</option>
          <option value="grab">Grab</option>
          <option value="not-allowed">Not Allowed</option>
          <option value="zoom-in">Zoom In</option>
        </select>
      </div>
    </details>

    <!-- Position Panel -->
    <details class="asp-accordion">
      <summary><Move :size="14" /> Vị trí (Position) <ChevronDown :size="14" class="asp-arr" /></summary>
      <div class="asp-accordion-body">
        <div class="asp-row">
          <label>Position</label>
          <select v-model="safeStyle.position" class="asp-input asp-input--select">
            <option value="">Static (Mặc định)</option>
            <option value="relative">Relative</option>
            <option value="absolute">Absolute</option>
            <option value="fixed">Fixed</option>
            <option value="sticky">Sticky</option>
          </select>
        </div>
        <div class="asp-grid" style="margin-top:8px" v-if="safeStyle.position && safeStyle.position !== 'static'">
          <div class="asp-col"><label>Top</label><input v-model="safeStyle.top" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Right</label><input v-model="safeStyle.right" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Bottom</label><input v-model="safeStyle.bottom" class="asp-input" placeholder="auto" /></div>
          <div class="asp-col"><label>Left</label><input v-model="safeStyle.left" class="asp-input" placeholder="auto" /></div>
        </div>
        <div class="asp-row" style="margin-top:8px" v-if="safeStyle.position && safeStyle.position !== 'static'">
          <label>Z-Index</label>
          <input v-model="safeStyle.zIndex" class="asp-input" placeholder="auto" />
        </div>
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
      <div class="asp-row" style="margin-top:8px">
        <label>Custom CSS ID</label>
        <input v-model="safeSettings.cssId" type="text" class="asp-input" placeholder="my-element" />
      </div>
    </div>

    <!-- Magic Wand Popover -->
    <div v-if="wandOpenFor" class="wand-popover">
      <div class="wand-header">
        Chèn Biến Dữ Liệu
        <button @click="wandOpenFor = null" class="asp-btn-icon"><X :size="12" /></button>
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
import { Monitor, Tablet, Smartphone, Wand2, X, Sparkles, LayoutGrid, Type, Image as ImageIcon, ChevronDown, AlignLeft, AlignCenter, AlignRight, Move } from 'lucide-vue-next'

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

const shadowPresets = [
  { name: 'Không', label: '✕', value: '' },
  { name: 'Nhẹ', label: 'S', value: '0 1px 3px rgba(0,0,0,0.08)' },
  { name: 'Vừa', label: 'M', value: '0 4px 12px rgba(0,0,0,0.1)' },
  { name: 'Mạnh', label: 'L', value: '0 8px 24px rgba(0,0,0,0.12)' },
  { name: 'XL', label: 'XL', value: '0 16px 40px rgba(0,0,0,0.15)' },
  { name: 'Card', label: '◻', value: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.04)' },
  { name: 'Nổi', label: '⬆', value: '0 20px 60px -12px rgba(0,0,0,0.25)' },
]

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
  color: #334155;
}
.asp-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 4px;
}
.asp-tabs {
  display: flex;
  align-items: center;
  background: #e2e8f0;
  border-radius: 8px;
  padding: 2px;
}
.asp-tabs button {
  background: transparent;
  color: #64748b;
  border: none;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}
.asp-tabs button:hover {
  color: #1e293b;
  background: rgba(255,255,255,0.5);
}
.asp-tabs button.active {
  background: #fff;
  color: var(--accent, #6366f1);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}
.asp-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
}
.asp-section-title {
  margin: 0 0 12px 0;
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  border-bottom: 1px solid #e2e8f0;
  padding-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Accordions */
.asp-accordion {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.2s;
}
.asp-accordion:hover {
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
.asp-accordion summary {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 700;
  color: #334155;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  background: #fafbfc;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  list-style: none;
  user-select: none;
  border-bottom: 1px solid transparent;
  transition: all 0.15s;
}
.asp-accordion summary::-webkit-details-marker { display: none; }
.asp-accordion summary:hover { background: #f1f5f9; }
.asp-accordion[open] > summary { 
  border-bottom-color: #e2e8f0; 
  color: var(--accent, #6366f1);
}
.asp-arr { margin-left: auto; transition: transform 0.2s; color: #94a3b8; }
.asp-accordion[open] .asp-arr { transform: rotate(180deg); }
.asp-accordion-body {
  padding: 14px;
  background: #fff;
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
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
  display: block;
  font-weight: 600;
}
.asp-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #1e293b;
  font-size: 12px;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.asp-input:focus {
  outline: none;
  border-color: var(--accent, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.08);
}
.asp-input::placeholder { color: #94a3b8; }
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
  gap: 6px;
}
.color-picker {
  width: 28px;
  height: 28px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  cursor: pointer;
  background: none;
  flex-shrink: 0;
}
.color-picker::-webkit-color-swatch-wrapper { padding: 2px; }
.color-picker::-webkit-color-swatch { border: none; border-radius: 4px; }

.group-btn {
  display: flex;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
}
.group-btn button {
  flex: 1;
  background: #fff;
  color: #64748b;
  border: none;
  padding: 6px 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  border-right: 1px solid #e2e8f0;
  transition: all 0.15s;
}
.group-btn button:last-child { border-right: none }
.group-btn button:hover { background: #f8fafc; color: #1e293b; }
.group-btn button.active { background: rgba(99,102,241,0.1); color: var(--accent, #6366f1); }

.asp-btn-icon {
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
.asp-btn-icon:hover { background: #f1f5f9; color: var(--accent, #6366f1); }

/* Shadow Presets */
.asp-shadow-presets {
  display: flex;
  gap: 4px;
  margin: 6px 0;
  flex-wrap: wrap;
}
.asp-shadow-chip {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #64748b;
  cursor: pointer;
  transition: all 0.15s;
}
.asp-shadow-chip:hover { border-color: #cbd5e1; background: #f8fafc; }
.asp-shadow-chip.active {
  background: rgba(99, 102, 241, 0.1);
  color: var(--accent, #6366f1);
  border-color: var(--accent, #6366f1);
}

.asp-hint-hover {
  color: var(--accent, #6366f1);
  font-size: 10px;
  display: block;
  margin-top: 4px;
  font-weight: 500;
}

/* Box Model Graphic */
.box-model {
  position: relative;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 100%;
  max-width: 260px;
  padding: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 8px auto 0;
  user-select: none;
  font-family: monospace;
}
.bm-header { position: absolute; top: 4px; left: 6px; font-size: 9px; color: #94a3b8; font-weight: 700; width: 100%; pointer-events: none;}
.bm-input {
  position: absolute;
  background: transparent;
  border: none;
  color: #64748b;
  font-size: 11px;
  text-align: center;
  width: 32px;
  z-index: 2;
  border-radius: 4px;
}
.bm-input:hover, .bm-input:focus { background: #e2e8f0; color: #1e293b; outline: none; }
.bm-mt { top: 4px; left: 50%; transform: translateX(-50%); }
.bm-mb { bottom: 4px; left: 50%; transform: translateX(-50%); }
.bm-ml { left: 4px; top: 50%; transform: translateY(-50%); }
.bm-mr { right: 4px; top: 50%; transform: translateY(-50%); }

.bm-inner {
  position: relative;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
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
  background: #e2e8f0;
  border-radius: 4px;
  width: 100%;
  height: 20px;
}

.wand-popover {
  position: absolute;
  top: 40px;
  left: 10px;
  right: 10px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.12);
  z-index: 1000;
  overflow: hidden;
}
.wand-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-bottom: 1px solid #e2e8f0;
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  background: #fafbfc;
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
  padding: 8px 14px;
  background: none;
  border: none;
  font-size: 12px;
  color: #475569;
  text-align: left;
  cursor: pointer;
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}
.wand-item:hover {
  background: rgba(99,102,241,0.06);
  color: #1e293b;
}
.wand-item .wand-key { font-family: monospace; color: var(--accent, #6366f1); font-weight: 600; font-size: 11px; }
.wand-item .wand-desc { font-size: 11px; color: #94a3b8; }
</style>
