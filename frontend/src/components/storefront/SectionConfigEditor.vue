<template>
  <div class="section-config-editor">
    <!-- TABS Navigation -->
    <div class="sf-config-tabs">
      <button :class="{ active: currentTab === 'content' }" @click="currentTab = 'content'">
        <LayoutList :size="14" /> Nội dung
      </button>
      <button :class="{ active: currentTab === 'style' }" @click="currentTab = 'style'">
        <Palette :size="14" /> Giao diện
      </button>
      <button :class="{ active: currentTab === 'advanced' }" @click="currentTab = 'advanced'">
        <Settings2 :size="14" /> Nâng cao
      </button>
    </div>
    
    <div class="sf-device-indicator" v-if="currentDevice !== 'desktop'">
      <component :is="currentDevice === 'mobile' ? 'Smartphone' : 'Tablet'" :size="14" />
      <span>Đang cấu hình giao diện {{ currentDevice === 'mobile' ? 'Mobile' : 'Tablet' }}</span>
    </div>

    <!-- TABS Body -->
    <div class="sf-config-body">
      <!-- ===== TAB: CONTENT ===== -->
      <div v-show="currentTab === 'content'" class="sf-tab-content">
        <template v-if="isPrimitiveNode">
          <AdvancedStylePanel :section="section" mode="content" />
          <div v-if="['container', 'grid', 'card', 'row', 'col'].includes(section.type)" class="param-row" style="flex-direction:column; margin-top:16px;">
            <label>Thành phần con (Elements)</label>
            <div class="sub-elements-box" style="border: 1px dashed var(--border-color, rgba(255,255,255,0.2)); border-radius: 4px; padding: 4px; min-height: 50px;">
              <slot name="children-editor" :section="section"></slot>
            </div>
          </div>
        </template>
        <template v-else>

        <!-- Data Source Quick Links (for data-bound sections) -->
        <div v-if="dataSourceLink" class="data-source-link">
      <div class="data-source-link__info">
        <Database :size="13" />
        <span>Dữ liệu lấy từ <strong>{{ dataSourceLink.label }}</strong></span>
      </div>
      <button class="data-source-link__btn" @click="$emit('navigate-tab', dataSourceLink.tab)">
        <ExternalLink :size="12" />
        Quản lý {{ dataSourceLink.label }}
      </button>
    </div>
    <!-- Visual Template Picker -->
    <SectionStylePicker
      :section-type="section.type"
      :params="getParams()"
      @apply-template="applyTemplateConfig"
    />

        <!-- Schema-Driven Inputs -->
        <div class="advanced-config__body" style="padding:0; border:none;">
        <template v-for="field in sectionSchemas[section.type] || []" :key="field.key">
          
          <!-- Standard Prop Inputs -->
          <div class="param-row" v-if="(field.type !== 'list' && field.type !== 'richtext' && field.type !== 'categoryList' && field.type !== 'children') && (!field.condition || getParams()[field.condition] !== false)">
            <label v-if="field.type !== 'visualEditor'">{{ field.label }}</label>
            
            <template v-if="field.type === 'boolean'">
              <label class="toggle-switch toggle-switch--sm" @click.stop>
                <input type="checkbox" v-model="getParams()[field.key]" />
                <span class="toggle-slider"></span>
              </label>
            </template>
            
            <template v-else-if="field.type === 'text' || field.type === 'url' || field.type === 'number'">
              <input :type="field.type" v-model="getParams()[field.key]" class="param-input" :class="{'param-input--wide': field.type!=='number'}" :min="field.min" :max="field.max" :step="field.step" :placeholder="field.placeholder" />
            </template>

            <template v-else-if="field.type === 'textarea'">
              <textarea v-model="getParams()[field.key]" class="param-input param-input--wide content-textarea" rows="2" :placeholder="field.placeholder"></textarea>
            </template>

            <template v-else-if="field.type === 'range'">
              <input type="range" v-model.number="getParams()[field.key]" :min="field.min" :max="field.max" :step="field.step" class="param-range" />
              <span class="param-value">{{ getParams()[field.key] || field.min }}</span>
            </template>

            <template v-else-if="field.type === 'select'">
              <select v-model="getParams()[field.key]" class="param-select">
                <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </template>

            <template v-else-if="field.type === 'categorySelect'">
              <select v-model="getParams()[field.key]" class="param-select">
                <option value="">{{ t('admin.msg_d8586d08', 'Tất cả') }}</option>
                <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </template>

            <template v-else-if="field.type === 'formSelect'">
              <select v-model="getParams()[field.key]" class="param-select">
                <option value="" disabled selected>-- Chọn Form --</option>
                <option v-for="f in availableForms" :key="f.id" :value="f.id">{{ f.title || f.id }}</option>
              </select>
              <button v-if="!availableForms.length" class="btn-save" style="margin-top:4px; font-size:10px" @click.prevent="alert('Chưa có Form nào. Hãy đến Tab Quản lý Biểu mẫu ở CMS để tạo mới.')">Chưa có form</button>
            </template>

            <template v-else-if="field.type === 'visualEditor'">
              <button class="btn-save" style="width: 100%; justify-content: center; background: var(--accent-gradient); min-width: 100%;" @click.stop="$emit('open-block-editor', section)">
                <Sparkles :size="14" /> {{ field.label }}
              </button>
            </template>
          </div>

          <!-- List / Content Array -->
          <div class="content-editor" v-if="field.type === 'list'">
            <label class="content-editor__label">{{ field.label }}</label>
            <div class="content-list-wrap">
              <div v-for="(item, i) in getContent()" :key="i" class="content-card">
                <div class="content-card__header">
                  <span class="content-card__title">Item {{ i + 1 }}</span>
                  <button class="btn-remove-item hover-danger" @click="removeContentItem(i)" :title="t('admin.msg_0be65507', 'Xóa')"><Trash2 :size="14" /></button>
                </div>
                <div class="content-card__body">
                  <div v-for="subf in field.fields" :key="subf.key" class="content-card__field">
                    <label class="content-card__label" v-if="subf.placeholder || subf.key">{{ subf.placeholder || subf.key }}</label>
                    <template v-if="subf.type === 'text' || subf.type === 'url'">
                      <input :type="subf.type" v-model="item[subf.key]" class="param-input param-input--wide" :placeholder="subf.placeholder" />
                    </template>
                    <template v-else-if="subf.type === 'textarea'">
                      <textarea v-model="item[subf.key]" class="param-input param-input--wide content-textarea" rows="2" :placeholder="subf.placeholder"></textarea>
                    </template>
                    <template v-else-if="subf.type === 'select'">
                      <select v-model="item[subf.key]" class="param-select param-select--wide">
                        <option v-for="o in subf.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                    </template>
                    <template v-else-if="subf.type === 'media'">
                      <MediaPicker v-model="item[subf.key]" :placeholder="subf.placeholder" accept="image/*,video/*" />
                    </template>
                  </div>
                </div>
              </div>
            </div>
            <button class="btn-add-item" @click="addContentItem(field.defaults || (field.fields.reduce((acc, f) => { acc[f.key]=''; return acc }, {})))">
              <Plus :size="14" /> {{ t('admin.msg_b6df6ccb', 'Thêm mục') }}
            </button>
          </div>

          <!-- Category Checkbox List -->
          <div class="content-editor" v-if="field.type === 'categoryList' && allCategories.length">
            <label class="content-editor__label">{{ field.label }}</label>
            <div v-for="cat in allCategories" :key="cat.id" class="param-row" style="margin-bottom: 4px;">
              <label style="font-size:12px">{{ cat.name }}</label>
              <label class="toggle-switch toggle-switch--sm" @click.stop>
                <input type="checkbox" :checked="(getParams()[field.key] || []).includes(cat.id)" @change="toggleCategoryId(cat.id, field.key)" />
                <span class="toggle-slider"></span>
              </label>
            </div>
            <small style="color:#888;font-size:11px">Bỏ chọn tất cả = hiện tất cả</small>
          </div>

          <!-- RichText -->
          <div class="content-editor" v-if="field.type === 'richtext'">
            <label class="content-editor__label">{{ field.label }}</label>
            <RichTextEditor :modelValue="getTextBlockContent()" @update:modelValue="setTextBlockContent($event)" placeholder="Nhập nội dung..." />
          </div>

          <!-- Nested Children grid component slot injection -->
          <div class="content-editor nested-container" v-if="field.type === 'children'" style="padding: 8px; background: rgba(0,0,0,0.02); border: 1px dashed var(--glass-border); border-radius: 8px; margin-top: 12px;">
            <label class="content-editor__label" style="display:flex; justify-content: space-between; align-items:center;">
              <span>{{ field.label }}</span>
              <span style="font-size: 10px; background: var(--accent-color); color: white; padding: 2px 6px; border-radius: 4px;">Khu vực kéo thả</span>
            </label>
            <slot name="children-editor" :field="field" :section="section"></slot>
          </div>

        </template>

        <!-- Style Params -->
        <div class="section-style-divider"></div>

        <!-- Per-section auto-translate button -->
        <div v-if="currentLang !== defaultLangCode" class="section-auto-translate">
          <button
            class="btn-section-translate"
            type="button"
            @click="autoTranslateSection"
            :disabled="isTranslating"
          >
            <component :is="isTranslating ? 'Loader2' : 'Sparkles'" :size="13" :class="{ spin: isTranslating }" />
            <span>{{ isTranslating ? t('admin.msg_4d2e51fa', 'Đang dịch...') : t('admin.msg_88469498', 'Dịch tự động section này') }}</span>
            <span class="btn-ai-badge">AI</span>
          </button>
        </div>

        </div><!-- /.advanced-config__body -->
        </template>
      </div><!-- /TAB: CONTENT -->

      <!-- ===== TAB: STYLE ===== -->
      <div v-show="currentTab === 'style'" class="sf-tab-content">
        <AdvancedStylePanel :section="section" mode="style" />
      </div>

      <!-- ===== TAB: ADVANCED ===== -->
      <div v-show="currentTab === 'advanced'" class="sf-tab-content">
        <AdvancedStylePanel :section="section" mode="advanced" />
      </div>

    </div><!-- /.sf-config-body -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { Sparkles, Trash2, Plus, X, Loader2, SlidersHorizontal, ChevronDown, Palette, LayoutList, Settings2, Database, ExternalLink } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { apiFetch } from '../../composables/useApi.js'
import { useForms } from '../../composables/useForms.js'
import { sectionSchemas, styleSchema } from './sectionSchemas.js'
import { hasVisualTemplates } from './sectionTemplates.js'
import SectionStylePicker from './SectionStylePicker.vue'
import MediaPicker from '../MediaPicker.vue'
import RichTextEditor from '../RichTextEditor.vue'
import AdvancedStylePanel from './AdvancedStylePanel.vue'
import { Monitor, Tablet, Smartphone } from 'lucide-vue-next'

const currentDevice = inject('previewDevice', ref('desktop'))

const props = defineProps({
  section: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] },
  currentLang: { type: String, required: true },
  defaultLangCode: { type: String, required: true }
})
const isPrimitiveNode = computed(() => ['container', 'grid', 'card', 'row', 'col', 'heading', 'text', 'image', 'button', 'link', 'divider', 'iframe', 'video'].includes(props.section.type))

const currentTab = ref('content')

// Map section types to their external management tabs
const dataSourceMap = {
  categories: { tab: 'categories', label: 'Danh mục' },
  featured_products: { tab: 'products', label: 'Sản phẩm' },
  new_arrivals: { tab: 'products', label: 'Sản phẩm' },
  product_listing: { tab: 'products', label: 'Sản phẩm' },
  flash_sale: { tab: 'flash-sales', label: 'Flash Sale' },
  cms_pages: { tab: 'cms', label: 'Trang CMS' },
  blog_posts: { tab: 'blog-posts', label: 'Bài viết Blog' },
  blog_collection: { tab: 'blog-posts', label: 'Bài viết Blog' },
  form: { tab: 'forms', label: 'Biểu mẫu' },
  reviews: { tab: 'reviews', label: 'Đánh giá' },
  restaurant_menu: { tab: 'restaurant', label: 'Nhà hàng' },
  booking_services: { tab: 'booking', label: 'Đặt lịch' },
  salon_services: { tab: 'salon', label: 'Salon' },
  property_listings: { tab: 'realestate', label: 'Bất động sản' },
  upcoming_events: { tab: 'events', label: 'Sự kiện' },
}
const dataSourceLink = computed(() => dataSourceMap[props.section.type] || null)

const emit = defineEmits(['open-block-editor', 'navigate-tab'])
const { t } = useI18n()
const { forms: availableForms, fetchForms } = useForms()


onMounted(() => {
  fetchForms()
})

// Content & Lang Data Initializer
function getParams() {
  const section = props.section;
  
  if (props.currentLang === props.defaultLangCode) {
    return new Proxy(section.params, {
      get(target, prop) {
        if (currentDevice.value === 'mobile' && section.mobileParams && section.mobileParams[prop] !== undefined && section.mobileParams[prop] !== '') {
          return section.mobileParams[prop];
        }
        if ((currentDevice.value === 'mobile' || currentDevice.value === 'tablet') && section.tabletParams && section.tabletParams[prop] !== undefined && section.tabletParams[prop] !== '') {
          return section.tabletParams[prop];
        }
        return target[prop];
      },
      set(target, prop, value) {
        if (currentDevice.value === 'mobile') {
          if (!section.mobileParams) section.mobileParams = {};
          section.mobileParams[prop] = value;
        } else if (currentDevice.value === 'tablet') {
          if (!section.tabletParams) section.tabletParams = {};
          section.tabletParams[prop] = value;
        } else {
          target[prop] = value;
        }
        return true;
      }
    });
  }
  
  if (!section.translations) section.translations = {};
  if (!section.translations[props.currentLang]) {
    section.translations[props.currentLang] = {
      params: { 
        title: section.params.title || '', 
        subtitle: section.params.subtitle || '', 
        buttonText: section.params.buttonText || '' 
      },
      content: JSON.parse(JSON.stringify(section.content || []))
    };
    if (Array.isArray(section.translations[props.currentLang].content)) {
      section.translations[props.currentLang].content.forEach(item => {
        if (typeof item === 'object') {
          if (item.name !== undefined) item.name = ''; 
          if (item.text !== undefined) item.text = ''; 
          if (item.question !== undefined) item.question = ''; 
          if (item.answer !== undefined) item.answer = '';
          if (item.label !== undefined) item.label = '';
        }
      });
    } else if (typeof section.translations[props.currentLang].content === 'string') {
      section.translations[props.currentLang].content = '';
    }
  }
  const baseParams = section.translations[props.currentLang].params;
  
  return new Proxy(baseParams, {
    get(target, prop) {
      if (currentDevice.value === 'mobile' && section.mobileParams && section.mobileParams[prop] !== undefined && section.mobileParams[prop] !== '') {
        return section.mobileParams[prop];
      }
      if ((currentDevice.value === 'mobile' || currentDevice.value === 'tablet') && section.tabletParams && section.tabletParams[prop] !== undefined && section.tabletParams[prop] !== '') {
        return section.tabletParams[prop];
      }
      return target[prop];
    },
    set(target, prop, value) {
      if (currentDevice.value === 'mobile') {
        if (!section.mobileParams) section.mobileParams = {};
        section.mobileParams[prop] = value;
      } else if (currentDevice.value === 'tablet') {
        if (!section.tabletParams) section.tabletParams = {};
        section.tabletParams[prop] = value;
      } else {
        target[prop] = value;
      }
      return true;
    }
  });
}

function getContent() {
  if (props.currentLang === props.defaultLangCode) return props.section.content;
  getParams(); // ensure initialized
  return props.section.translations[props.currentLang].content;
}

function getTextBlockContent() {
  if (props.currentLang === props.defaultLangCode) return typeof props.section.content === 'string' ? props.section.content : '';
  getParams();
  return typeof props.section.translations[props.currentLang].content === 'string' ? props.section.translations[props.currentLang].content : '';
}

function setTextBlockContent(val) {
  if (props.currentLang === props.defaultLangCode) props.section.content = val;
  else {
    getParams();
    props.section.translations[props.currentLang].content = val;
  }
}

function addContentItem(defaultItem) {
  const section = props.section;
  if (!section.content) section.content = []
  section.content.push({ ...defaultItem })
  if (section.translations) {
    Object.keys(section.translations).forEach(lang => {
      const tContent = section.translations[lang].content
      if (Array.isArray(tContent)) {
        const emptyItem = JSON.parse(JSON.stringify(defaultItem))
        if (emptyItem.name !== undefined) emptyItem.name = ''
        if (emptyItem.text !== undefined) emptyItem.text = ''
        if (emptyItem.question !== undefined) emptyItem.question = ''
        if (emptyItem.answer !== undefined) emptyItem.answer = ''
        if (emptyItem.label !== undefined) emptyItem.label = ''
        tContent.push(emptyItem)
      }
    })
  }
}

function removeContentItem(index) {
  const section = props.section;
  if (Array.isArray(section.content)) section.content.splice(index, 1)
  if (section.translations) {
    Object.keys(section.translations).forEach(lang => {
      const tContent = section.translations[lang].content
      if (Array.isArray(tContent)) tContent.splice(index, 1)
    })
  }
}

function toggleCategoryId(catId, key = 'selectedCategoryIds') {
  const params = props.section.params; // base params handles categories
  if (!params[key]) params[key] = []
  const idx = params[key].indexOf(catId)
  if (idx >= 0) params[key].splice(idx, 1)
  else params[key].push(catId)
}

function applyTemplateConfig(config) {
  // Merge template config into section params
  Object.keys(config).forEach(k => {
    props.section.params[k] = config[k]
  })
}

// Auto-Translate Logic
const isTranslating = ref(false)

async function autoTranslateSection() {
  const lang = props.currentLang
  const section = props.section
  if (!lang || lang === props.defaultLangCode) return
  isTranslating.value = true
  const schema = sectionSchemas[section.type] || []

  try {
    getParams() // ensure base
    const tp = section.translations[lang].params
    const tc = section.translations[lang].content
    
    // 1. Gather all texts to translate
    const textsToTranslate = []
    const mappings = [] // keep track of where to place the results

    // Top-level params
    for (const field of schema) {
      if ((field.type === 'text' || field.type === 'richtext') && section.params[field.key]) {
        textsToTranslate.push(section.params[field.key])
        mappings.push({ type: 'param', key: field.key })
      }
    }

    // Content array items
    const listField = schema.find(f => f.type === 'list')
    if (listField && Array.isArray(section.content) && Array.isArray(tc)) {
      const translatableKeys = listField.fields.filter(f => f.type === 'text' || f.type === 'textarea').map(f => f.key)
      for (let i = 0; i < section.content.length; i++) {
        const item = section.content[i]
        if (!tc[i]) tc[i] = {}
        for (const k of translatableKeys) {
          if (!item[k] || !String(item[k]).trim()) continue
          textsToTranslate.push(item[k])
          mappings.push({ type: 'content_list', index: i, key: k })
        }
      }
    }

    // Plain string content block
    if (typeof section.content === 'string' && section.content.trim()) {
      textsToTranslate.push(section.content)
      mappings.push({ type: 'content_string' })
    }

    if (textsToTranslate.length === 0) {
      isTranslating.value = false
      return
    }

    // 2. Perform Batch Translation
    const res = await apiFetch('/languages/auto-translate-batch', {
      method: 'POST',
      body: JSON.stringify({ texts: textsToTranslate, from: props.defaultLangCode, to: lang })
    })
    const data = await res.json()
    const translatedArray = data?.data?.translated || data?.translated

    if (Array.isArray(translatedArray) && translatedArray.length === textsToTranslate.length) {
      // 3. Scatter results back
      for (let i = 0; i < mappings.length; i++) {
        const tr = translatedArray[i]
        const map = mappings[i]
        if (!tr) continue
        
        if (map.type === 'param') {
          tp[map.key] = tr
        } else if (map.type === 'content_list') {
          tc[map.index][map.key] = tr
        } else if (map.type === 'content_string') {
          section.translations[lang].content = tr
        }
      }
    }
  } catch (e) {
    console.error('Section auto-translate failed:', e)
  } finally {
    isTranslating.value = false
  }
}
</script>

<style scoped>
.sf-config-tabs {
  display: flex;
  background: var(--color-bg-secondary, #f8fafc);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 4px;
}
.sf-config-tabs button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: transparent;
  border: none;
  border-radius: 6px;
  padding: 8px 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted, #64748b);
  cursor: pointer;
  transition: all 0.2s;
}
.sf-config-tabs button:hover {
  color: var(--color-text-primary, #334155);
}
.sf-config-tabs button.active {
  background: #fff;
  color: var(--color-accent-primary, #6366f1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.sf-tab-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(2px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-config-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* List / Content Cards */
.content-list-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 8px;
}
.content-card {
  background: var(--color-bg-primary, #ffffff);
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.02);
  overflow: hidden;
  transition: all 0.2s ease-in-out;
}
.content-card:hover {
  border-color: var(--color-accent-primary, #6366f1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.04);
}
.content-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: var(--color-bg-secondary, #f8fafc);
  border-bottom: 1px solid var(--color-border, #f1f5f9);
}
.content-card__title {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted, #64748b);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.btn-remove-item {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.btn-remove-item:hover.hover-danger {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}
.content-card__body {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.content-card__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.content-card__label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary, #475569);
}
.param-select--wide {
  width: 100%;
}
.btn-add-item {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; border-radius: 10px;
  border: 1px dashed var(--color-border, #cbd5e1);
  background: var(--color-bg-secondary, #f8fafc);
  color: var(--color-text-secondary, #475569);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-add-item:hover {
  border-color: var(--color-accent-primary, #6366f1);
  color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99,102,241,0.05));
}


/* Per-section auto-translate */
.section-auto-translate {
  margin: 8px 0;
  display: flex;
  justify-content: flex-end;
}
.btn-section-translate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px 6px 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #ec4899 100%);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 10px rgba(124, 58, 237, 0.3);
}
.btn-section-translate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.45);
  filter: brightness(1.08);
}
.btn-section-translate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.btn-ai-badge {
  font-size: 9px;
  font-weight: 800;
  background: rgba(255,255,255,0.25);
  border-radius: 6px;
  padding: 1px 5px;
  letter-spacing: 0.08em;
}
.spin {
  animation: spin 1s linear infinite;
}


.data-source-link {
  display: flex; flex-direction: column; gap: 8px;
  padding: 10px 12px; margin-bottom: 12px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(139, 92, 246, 0.08));
  border: 1px solid rgba(99, 102, 241, 0.2);
  border-radius: 8px;
}
.data-source-link__info {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--text-2, #6b7280);
}
.data-source-link__info strong { color: var(--text-1, #374151); }
.data-source-link__btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(99, 102, 241, 0.12); color: #6366f1;
  border: 1px solid rgba(99, 102, 241, 0.25); border-radius: 6px;
  padding: 6px 12px; font-size: 12px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
  align-self: flex-start;
}
.data-source-link__btn:hover {
  background: #6366f1; color: #fff;
  border-color: #6366f1;
}

.sf-device-indicator {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  background: rgba(245, 158, 11, 0.1); color: #d97706; padding: 6px 12px;
  border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 12px;
  border: 1px dashed rgba(245, 158, 11, 0.3);
}
</style>
