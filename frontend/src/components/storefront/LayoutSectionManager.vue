<template>
  <div class="section-list">
    <LanguageTabs v-model="currentLang" style="margin-bottom: 16px" />
    <div
      v-for="(section, idx) in list"
      :key="section.type"
      class="section-item-wrap"
    >
      <div
        class="section-item"
        :class="{
          disabled: !section.enabled,
          dragging: dragIndex === idx,
          'drag-over': dragOverIndex === idx && dragIndex !== idx,
          expanded: expandedSection === section.type,
        }"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
        @dragover.prevent="onDragOver($event, idx)"
        @dragenter.prevent="onDragEnter(idx)"
        @dragleave="onDragLeave(idx)"
        @drop.prevent="onDrop(idx)"
      >
        <div class="section-item__left">
          <div class="section-item__drag-handle">
            <GripVertical :size="14" />
          </div>
          <component :is="sectionMeta[section.type]?.icon" :size="14" />
          <span>{{ sectionMeta[section.type]?.label || section.type }}</span>
        </div>
        <div class="section-item__right">
          <button
            class="btn-params"
            @click.stop="toggleExpand(section.type)"
            title="Tùy chỉnh"
          ><Settings2 :size="13" /></button>
          <label class="toggle-switch" @click.stop>
            <input type="checkbox" v-model="section.enabled" />
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <!-- Expanded Section Parameters -->
      <transition name="expand">
        <div v-if="expandedSection === section.type" class="section-params">
          <!-- Schema-Driven Inputs -->
          <template v-for="field in sectionSchemas[section.type] || []" :key="field.key">
            
            <!-- Standard Prop Inputs -->
            <div class="param-row" v-if="(field.type !== 'list' && field.type !== 'richtext' && field.type !== 'categoryList' && field.type !== 'children') && (!field.condition || getParams(section)[field.condition] !== false)">
              <label v-if="field.type !== 'visualEditor'">{{ field.label }}</label>
              
              <template v-if="field.type === 'boolean'">
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="getParams(section)[field.key]" />
                  <span class="toggle-slider"></span>
                </label>
              </template>
              
              <template v-else-if="field.type === 'text' || field.type === 'url' || field.type === 'number'">
                <input :type="field.type" v-model="getParams(section)[field.key]" class="param-input" :class="{'param-input--wide': field.type!=='number'}" :min="field.min" :max="field.max" :step="field.step" :placeholder="field.placeholder" />
              </template>

              <template v-else-if="field.type === 'range'">
                <input type="range" v-model.number="getParams(section)[field.key]" :min="field.min" :max="field.max" :step="field.step" class="param-range" />
                <span class="param-value">{{ getParams(section)[field.key] || field.min }}</span>
              </template>

              <template v-else-if="field.type === 'select'">
                <select v-model="getParams(section)[field.key]" class="param-select">
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </template>

              <template v-else-if="field.type === 'categorySelect'">
                <select v-model="getParams(section)[field.key]" class="param-select">
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
              <div v-for="(item, i) in getContent(section)" :key="i" class="content-item" style="flex-direction:column;gap:4px">
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
                  <button v-if="subf === field.fields[0]" class="btn-remove-item" @click="removeContentItem(section, i)"><Trash2 :size="12" /></button>
                </div>
              </div>
              <button class="btn-add-item" @click="addContentItem(section, field.defaults || (field.fields.reduce((acc, f) => { acc[f.key]=''; return acc }, {})))">
                <Plus :size="12" /> Thêm mục
              </button>
            </div>

            <!-- Category Checkbox List -->
            <div class="content-editor" v-if="field.type === 'categoryList' && allCategories.length">
              <label class="content-editor__label">{{ field.label }}</label>
              <div v-for="cat in allCategories" :key="cat.id" class="param-row" style="margin-bottom: 4px;">
                <label style="font-size:12px">{{ cat.name }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" :checked="(getParams(section)[field.key] || []).includes(cat.id)" @change="toggleCategoryId(section, cat.id, field.key)" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <small style="color:#888;font-size:11px">Bỏ chọn tất cả = hiện tất cả</small>
            </div>

            <!-- RichText -->
            <div class="content-editor" v-if="field.type === 'richtext'">
              <label class="content-editor__label">{{ field.label }}</label>
              <RichTextEditor :modelValue="getTextBlockContent(section)" @update:modelValue="setTextBlockContent(section, $event)" placeholder="Nhập nội dung..." />
            </div>

            <!-- Nested Children grid -->
            <div class="content-editor nested-container" v-if="field.type === 'children'" style="padding: 8px; background: rgba(0,0,0,0.02); border: 1px dashed var(--glass-border); border-radius: 8px; margin-top: 12px;">
              <label class="content-editor__label" style="display:flex; justify-content: space-between; align-items:center;">
                <span>{{ field.label }}</span>
                <span style="font-size: 10px; background: var(--accent-color); color: white; padding: 2px 6px; border-radius: 4px;">Khu vực kéo thả</span>
              </label>
              <!-- Recursive Call to Self -->
              <LayoutSectionManager 
                v-if="expandedSection === section.type"
                :sections="section.children || (section.children = [])"
                @update:sections="section.children = $event"
                :sectionMeta="sectionMeta"
                :allCategories="allCategories"
              />
              <div v-if="!section.children || section.children.length === 0" style="text-align: center; padding: 20px; font-size: 11px; color: #888;">
                Chưa có component nào tron lưới. Kéo component từ danh sách thả vào đây.
              </div>
            </div>

          </template>

          <!-- Style Params -->
          <div class="section-style-divider"></div>

          <!-- Per-section auto-translate button -->
          <div v-if="currentLang !== defaultLangCode" class="section-auto-translate">
            <button
              class="btn-section-translate"
              type="button"
              @click="autoTranslateSection(section)"
              :disabled="translatingSection === section.type"
            >
              <component :is="translatingSection === section.type ? 'Loader2' : 'Sparkles'" :size="13" :class="{ spin: translatingSection === section.type }" />
              <span>{{ translatingSection === section.type ? t('admin.msg_4d2e51fa', 'Đang dịch...') : t('admin.msg_88469498', 'Dịch tự động section này') }}</span>
              <span class="btn-ai-badge">AI</span>
            </button>
          </div>

          <details class="section-style-details">
            <summary>🎨 Style & Advanced</summary>
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
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { GripVertical, Settings2, Trash2, Plus, X, Sparkles, Loader2 } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'
import { apiFetch } from '../../composables/useApi.js'
import { sectionSchemas, styleSchema } from './sectionSchemas.js'
import LanguageTabs from '../LanguageTabs.vue'
import MediaPicker from '../MediaPicker.vue'
import RichTextEditor from '../RichTextEditor.vue'

const { t } = useI18n()
import { useLanguages } from '../../composables/useLanguages.js'
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

const props = defineProps({
  sections: { type: Array, required: true },
  sectionMeta: { type: Object, required: true },
  allCategories: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:sections', 'open-block-editor'])

const list = computed({
  get: () => props.sections,
  set: v => emit('update:sections', v),
})

const expandedSection = ref(null)

// Drag Drop Logic
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, idx) { dragIndex.value = idx; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', String(idx)) }
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }
function onDragEnter(idx) { if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx }
function onDragLeave(idx) { if (dragOverIndex.value === idx) dragOverIndex.value = null }
function onDrop(targetIdx) {
  const fromIdx = dragIndex.value
  dragOverIndex.value = null
  dragIndex.value = null
  if (fromIdx === null || fromIdx === targetIdx) return
  const currentList = [...list.value]
  const [moved] = currentList.splice(fromIdx, 1)
  currentList.splice(targetIdx, 0, moved)
  currentList.forEach((s, i) => { s.order = i })
  list.value = currentList
}

function toggleExpand(type) {
  expandedSection.value = expandedSection.value === type ? null : type
}

// Multi-language Helpers
function getParams(section) {
  if (currentLang.value === defaultLangCode.value) return section.params;
  if (!section.translations) section.translations = {};
  if (!section.translations[currentLang.value]) {
    section.translations[currentLang.value] = {
      params: { 
        title: section.params.title || '', 
        subtitle: section.params.subtitle || '', 
        buttonText: section.params.buttonText || '' 
      },
      content: JSON.parse(JSON.stringify(section.content || []))
    };
    if (Array.isArray(section.translations[currentLang.value].content)) {
      section.translations[currentLang.value].content.forEach(item => {
        if (typeof item === 'object') {
          if (item.name) item.name = ''; 
          if (item.text) item.text = ''; 
          if (item.question) item.question = ''; 
          if (item.answer) item.answer = '';
          if (item.label) item.label = '';
        }
      });
    } else if (typeof section.translations[currentLang.value].content === 'string') {
      section.translations[currentLang.value].content = '';
    }
  }
  return section.translations[currentLang.value].params;
}

function getContent(section) {
  if (currentLang.value === defaultLangCode.value) return section.content;
  getParams(section);
  return section.translations[currentLang.value].content;
}

function getTextBlockContent(section) {
  if (currentLang.value === defaultLangCode.value) return typeof section.content === 'string' ? section.content : '';
  getParams(section);
  return typeof section.translations[currentLang.value].content === 'string' ? section.translations[currentLang.value].content : '';
}

function setTextBlockContent(section, val) {
  if (currentLang.value === defaultLangCode.value) section.content = val;
  else {
    getParams(section);
    section.translations[currentLang.value].content = val;
  }
}

function addContentItem(section, defaultItem) {
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
function removeContentItem(section, index) {
  if (Array.isArray(section.content)) section.content.splice(index, 1)
  if (section.translations) {
    Object.keys(section.translations).forEach(lang => {
      const tContent = section.translations[lang].content
      if (Array.isArray(tContent)) tContent.splice(index, 1)
    })
  }
}
function toggleCategoryId(section, catId, key = 'selectedCategoryIds') {
  if (!section.params[key]) section.params[key] = []
  const idx = section.params[key].indexOf(catId)
  if (idx >= 0) section.params[key].splice(idx, 1)
  else section.params[key].push(catId)
}

// ── Per-section auto translate ──
const translatingSection = ref(null)

async function autoTranslateSection(section) {
  const lang = currentLang.value
  if (!lang || lang === defaultLangCode.value) return
  translatingSection.value = section.type
  const schema = sectionSchemas[section.type] || []

  try {
    getParams(section)
    const tp = section.translations[lang].params
    const tc = section.translations[lang].content

    // Translate top-level params (text, richtext)
    for (const field of schema) {
      if ((field.type === 'text' || field.type === 'richtext') && section.params[field.key]) {
        try {
          const res = await apiFetch('/languages/auto-translate', {
            method: 'POST',
            body: JSON.stringify({ text: section.params[field.key], from: defaultLangCode.value, to: lang })
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
              body: JSON.stringify({ text: item[k], from: defaultLangCode.value, to: lang })
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
          body: JSON.stringify({ text: section.content, from: defaultLangCode.value, to: lang })
        })
        const data = await res.json()
        if (data?.translated) section.translations[lang].content = data.translated
      } catch {}
    }
  } catch (e) {
    console.error('Section auto-translate failed:', e)
  } finally {
    translatingSection.value = null
  }
}
</script>

<style scoped>
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
