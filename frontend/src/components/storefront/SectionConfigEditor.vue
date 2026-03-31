<template>
  <div class="section-config-editor">
    <template v-if="isPrimitiveNode">
      <AdvancedStylePanel :section="section" />
      <div v-if="['container', 'grid', 'card', 'row', 'col'].includes(section.type)" class="param-row" style="flex-direction:column; margin-top:16px;">
        <label>Thành phần con (Elements)</label>
        <div class="sub-elements-box" style="border: 1px dashed var(--border-color, rgba(255,255,255,0.2)); border-radius: 4px; padding: 4px; min-height: 50px;">
          <slot name="children-editor" :section="section"></slot>
        </div>
      </div>
    </template>
    <template v-else>
    <!-- Visual Template Picker -->
    <SectionStylePicker
      :section-type="section.type"
      :params="getParams()"
      @apply-template="applyTemplateConfig"
    />

    <!-- Advanced Config (collapsible) -->
    <details class="advanced-config" :open="!hasVisualTemplates(section.type)">
      <summary class="advanced-config__toggle">
        <SlidersHorizontal :size="12" />
        <span>Tinh chỉnh nâng cao</span>
        <ChevronDown :size="12" class="advanced-config__arrow" />
      </summary>
      <div class="advanced-config__body">

        <!-- Schema-Driven Inputs -->
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
            <div v-for="(item, i) in getContent()" :key="i" class="content-item" style="flex-direction:column;gap:4px">
              <div v-for="subf in field.fields" :key="subf.key" style="display:flex; gap:4px; width: 100%;">
                
                <template v-if="subf.type === 'text' || subf.type === 'url'">
                  <input :type="subf.type" v-model="item[subf.key]" class="param-input param-input--wide" :placeholder="subf.placeholder" style="flex:1" />
                </template>
                
                <template v-else-if="subf.type === 'textarea'">
                  <textarea v-model="item[subf.key]" class="param-input param-input--wide content-textarea" rows="2" :placeholder="subf.placeholder" style="flex:1"></textarea>
                </template>

                <template v-else-if="subf.type === 'select'">
                  <select v-model="item[subf.key]" class="param-select">
                    <option v-for="o in subf.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                  </select>
                </template>
                
                <template v-else-if="subf.type === 'media'">
                  <MediaPicker v-model="item[subf.key]" :placeholder="subf.placeholder" accept="image/*,video/*" style="flex:1" />
                </template>

                <!-- Only show delete bin on first field to save space -->
                <button v-if="subf === field.fields[0]" class="btn-remove-item" @click="removeContentItem(i)"><Trash2 :size="12" /></button>
              </div>
            </div>
            <button class="btn-add-item" @click="addContentItem(field.defaults || (field.fields.reduce((acc, f) => { acc[f.key]=''; return acc }, {})))">
              <Plus :size="12" /> Thêm mục
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

        <details class="section-style-details">
          <summary><Palette :size="12" style="margin-right:4px"/> Style & Advanced</summary>
          <template v-for="sfield in styleSchema" :key="sfield.key">
            <div class="param-row">
              <label>{{ sfield.label }}</label>
              
              <template v-if="sfield.type === 'color'">
                <input type="color" v-model="section.params[sfield.key]" class="param-color" />
                <button v-if="section.params[sfield.key]" class="btn-clear-color" @click="section.params[sfield.key] = ''"><X :size="10" /></button>
              </template>
              
              <template v-else-if="sfield.type === 'select'">
                <select v-model="section.params[sfield.key]" class="param-select">
                  <option v-for="o in sfield.options" :key="o.value" :value="o.value">{{ o.label }}</option>
                </select>
              </template>
              
              <template v-else-if="sfield.type === 'text'">
                <input type="text" v-model="section.params[sfield.key]" class="param-input" />
              </template>
            </div>
          </template>
        </details>

      </div><!-- /.advanced-config__body -->
    </details><!-- /.advanced-config -->
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Sparkles, Trash2, Plus, X, Loader2, SlidersHorizontal, ChevronDown, Palette } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { apiFetch } from '../../composables/useApi.js'
import { useForms } from '../../composables/useForms.js'
import { sectionSchemas, styleSchema } from './sectionSchemas.js'
import { hasVisualTemplates } from './sectionTemplates.js'
import SectionStylePicker from './SectionStylePicker.vue'
import MediaPicker from '../MediaPicker.vue'
import RichTextEditor from '../RichTextEditor.vue'
import AdvancedStylePanel from './AdvancedStylePanel.vue'

const props = defineProps({
  section: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] },
  currentLang: { type: String, required: true },
  defaultLangCode: { type: String, required: true }
})
const isPrimitiveNode = computed(() => ['container', 'grid', 'card', 'row', 'col', 'heading', 'text', 'image', 'button', 'link', 'divider', 'iframe', 'video'].includes(props.section.type))
const emit = defineEmits(['open-block-editor'])
const { t } = useI18n()
const { forms: availableForms, fetchForms } = useForms()

import { onMounted } from 'vue'
onMounted(() => {
  fetchForms()
})

// Content & Lang Data Initializer
function getParams() {
  const section = props.section;
  if (props.currentLang === props.defaultLangCode) return section.params;
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
  return section.translations[props.currentLang].params;
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

    // Translate top-level params (text, richtext)
    for (const field of schema) {
      if ((field.type === 'text' || field.type === 'richtext') && section.params[field.key]) {
        try {
          const res = await apiFetch('/languages/auto-translate', {
            method: 'POST',
            body: JSON.stringify({ text: section.params[field.key], from: props.defaultLangCode, to: lang })
          })
          const data = await res.json()
          if (data?.translated) tp[field.key] = data.translated
        } catch {}
      }
    }

    // Translate content array items
    const listField = schema.find(f => f.type === 'list')
    if (listField && Array.isArray(section.content) && Array.isArray(tc)) {
      const translatableKeys = listField.fields.filter(f => f.type === 'text' || f.type === 'textarea').map(f => f.key)
      for (let i = 0; i < section.content.length; i++) {
        const item = section.content[i]
        if (!tc[i]) tc[i] = {}
        for (const k of translatableKeys) {
          if (!item[k] || !String(item[k]).trim()) continue
          try {
            const res = await apiFetch('/languages/auto-translate', {
              method: 'POST',
              body: JSON.stringify({ text: item[k], from: props.defaultLangCode, to: lang })
            })
            const data = await res.json()
            if (data?.translated) tc[i][k] = data.translated
          } catch {}
        }
      }
    }

    // Translate old plain string content block if any
    if (typeof section.content === 'string' && section.content.trim()) {
      try {
        const res = await apiFetch('/languages/auto-translate', {
          method: 'POST',
          body: JSON.stringify({ text: section.content, from: props.defaultLangCode, to: lang })
        })
        const data = await res.json()
        if (data?.translated) section.translations[lang].content = data.translated
      } catch {}
    }
  } catch (e) {
    console.error('Section auto-translate failed:', e)
  } finally {
    isTranslating.value = false
  }
}
</script>

<style scoped>
.advanced-config {
  margin-top: 8px;
  border: 1px solid var(--color-border, #e2e8f0);
  border-radius: 8px;
  overflow: hidden;
}
.advanced-config__toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted, #94a3b8);
  cursor: pointer;
  user-select: none;
  background: var(--glass-bg, #f8fafc);
  border: none;
  list-style: none;
  transition: all 0.15s;
}
.advanced-config__toggle:hover {
  color: var(--color-text-primary, #334155);
  background: var(--color-bg-card-hover, #f1f5f9);
}
.advanced-config__toggle::-webkit-details-marker { display: none; }
.advanced-config__arrow {
  margin-left: auto;
  transition: transform 0.2s;
}
.advanced-config[open] .advanced-config__arrow {
  transform: rotate(180deg);
}
.advanced-config__body {
  padding: 8px 10px 12px;
  border-top: 1px solid var(--color-border, #e2e8f0);
}

.section-config-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
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
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
