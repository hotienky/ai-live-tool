<template>
  <div class="section-config-editor">
    <!-- Visual Template Picker -->
    <SectionStylePicker
      :section-type="section.type"
      :params="getParams"
      @apply-template="applyTemplateConfig"
    />

    <!-- Schema-Driven Inputs -->
    <template v-for="field in sectionSchemas[section.type] || []" :key="field.key">
      <!-- Standard Prop Inputs -->
      <div class="param-row" v-if="(field.type !== 'list' && field.type !== 'richtext' && field.type !== 'categoryList' && field.type !== 'children') && (!field.condition || getParams[field.condition] !== false)">
        <label v-if="field.type !== 'visualEditor'">{{ field.label }}</label>
        
        <template v-if="field.type === 'boolean'">
          <label class="toggle-switch toggle-switch--sm" @click.stop>
            <input type="checkbox" v-model="getParams[field.key]" />
            <span class="toggle-slider"></span>
          </label>
        </template>
        
        <template v-else-if="field.type === 'text' || field.type === 'url' || field.type === 'number'">
          <input :type="field.type" v-model="getParams[field.key]" class="param-input" :class="{'param-input--wide': field.type!=='number'}" :min="field.min" :max="field.max" :step="field.step" :placeholder="field.placeholder" />
        </template>

        <template v-else-if="field.type === 'range'">
          <input type="range" v-model.number="getParams[field.key]" :min="field.min" :max="field.max" :step="field.step" class="param-range" />
          <span class="param-value">{{ getParams[field.key] || field.min }}</span>
        </template>

        <template v-else-if="field.type === 'select'">
          <select v-model="getParams[field.key]" class="param-select">
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </template>

        <template v-else-if="field.type === 'categorySelect'">
          <select v-model="getParams[field.key]" class="param-select">
            <option value="">{{ t('admin.msg_d8586d08', 'Tất cả') }}</option>
            <option v-for="c in allCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
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
        <div v-for="(item, i) in getContent" :key="i" class="content-item" style="flex-direction:column;gap:4px">
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
            <input type="checkbox" :checked="(getParams[field.key] || []).includes(cat.id)" @change="toggleCategoryId(cat.id, field.key)" />
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

    </template>

    <!-- Style Params -->
    <div class="section-style-divider"></div>

    <details class="section-style-details">
      <summary><Sparkles :size="12" style="margin-right:4px" /> Tùy chỉnh nâng cao</summary>
      
      <!-- Responsive Visibility -->
      <div class="param-row" style="margin-top: 8px;">
        <label>Ẩn trên Desktop</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" v-model="section.params.hideDesktop" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="param-row">
        <label>Ẩn trên Tablet</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" v-model="section.params.hideTablet" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="param-row">
        <label>Ẩn trên Mobile</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" v-model="section.params.hideMobile" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="param-divider"></div>

      <!-- Spacing Controls -->
      <div class="param-row">
        <label>Padding trên (px)</label>
        <input type="number" v-model.number="section.params.paddingTop" class="param-input param-input--sm" min="0" max="200" step="4" placeholder="auto" style="width:65px" />
      </div>
      <div class="param-row">
        <label>Padding dưới (px)</label>
        <input type="number" v-model.number="section.params.paddingBottom" class="param-input param-input--sm" min="0" max="200" step="4" placeholder="auto" style="width:65px" />
      </div>
      <div class="param-row">
        <label>Margin trên (px)</label>
        <input type="number" v-model.number="section.params.marginTop" class="param-input param-input--sm" min="0" max="200" step="4" placeholder="0" style="width:65px" />
      </div>
      <div class="param-row">
        <label>Margin dưới (px)</label>
        <input type="number" v-model.number="section.params.marginBottom" class="param-input param-input--sm" min="0" max="200" step="4" placeholder="0" style="width:65px" />
      </div>
      <div class="param-divider"></div>

      <!-- Full Width Toggle -->
      <div class="param-row">
        <label>Rộng toàn trang</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" v-model="section.params.fullWidth" />
          <span class="toggle-slider"></span>
        </label>
      </div>

      <!-- Animation -->
      <div class="param-row">
        <label>Hiệu ứng xuất hiện</label>
        <select v-model="section.params.animation" class="param-select">
          <option value="">Không</option>
          <option value="fade-up">Fade Up</option>
          <option value="fade-in">Fade In</option>
          <option value="slide-left">Slide Left</option>
          <option value="slide-right">Slide Right</option>
          <option value="zoom-in">Zoom In</option>
        </select>
      </div>

      <!-- Custom CSS Class -->
      <div class="param-row">
        <label>CSS Class (thêm)</label>
        <input type="text" v-model="section.params.cssClass" class="param-input" placeholder="my-custom-class" />
      </div>
      <div class="param-divider"></div>

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
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Sparkles, Trash2, Plus, X } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { sectionSchemas, styleSchema } from './sectionSchemas.js'
import SectionStylePicker from './SectionStylePicker.vue'
import MediaPicker from '../MediaPicker.vue'
import RichTextEditor from '../RichTextEditor.vue'

const props = defineProps({
  section: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] }
})
const { t } = useI18n()

// Ensure language-specific params object exists
const getParams = computed(() => {
  if (!props.section.i18n) Object.assign(props.section, { i18n: {} })
  const lang = window.localStorage.getItem('sf_admin_lang') || 'vi'
  if (!props.section.i18n[lang]) {
    props.section.i18n[lang] = JSON.parse(JSON.stringify(props.section.params || {}))
  }
  return props.section.i18n[lang]
})

function applyTemplateConfig(config) {
  Object.assign(getParams.value, config.params)
  if (config.style) Object.assign(props.section.params, config.style) // Style is global
}

// Content List Helpers
const getContent = computed(() => {
  if (!getParams.value.content) getParams.value.content = []
  return getParams.value.content
})
function addContentItem(itemPayload) {
  getContent.value.push(JSON.parse(JSON.stringify(itemPayload)))
}
function removeContentItem(index) {
  getContent.value.splice(index, 1)
}
function toggleCategoryId(categoryId, fieldKey) {
  if (!getParams.value[fieldKey]) getParams.value[fieldKey] = []
  const list = getParams.value[fieldKey]
  const idx = list.indexOf(categoryId)
  if (idx > -1) list.splice(idx, 1)
  else list.push(categoryId)
}

// RichText Helper
function getTextBlockContent() {
  return getParams.value.html_content || ''
}
function setTextBlockContent(val) {
  getParams.value.html_content = val
}
</script>

<style scoped>
.section-config-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
