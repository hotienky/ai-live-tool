<template>
  <div class="cp" v-if="block">
    <div class="cp-header">
      <div class="cp-title">
        <component :is="resolveIcon(blockDef?.icon)" :size="16" class="cp-icon" />
        <h4>{{ blockDef?.name || block.type }}</h4>
      </div>
    </div>

    <div class="cp-tabs" v-if="blockDef?.groups?.length">
      <button v-for="group in blockDef.groups" :key="group.key"
        class="cp-tab" :class="{ 'cp-tab--active': activeTab === group.key }" 
        @click="activeTab = group.key">
        {{ group.label }}
      </button>
    </div>
    <div class="cp-tabs" v-else>
      <button class="cp-tab" :class="{ 'cp-tab--active': activeTab === 'content' }" @click="activeTab = 'content'">
        <Type :size="14" /> Nội dung
      </button>
      <button class="cp-tab" :class="{ 'cp-tab--active': activeTab === 'style' }" @click="activeTab = 'style'">
        <Palette :size="14" /> Kiểu dáng
      </button>
    </div>

    <div class="cp-scroll">
      <!-- DYNAMIC GROUPS -->
      <template v-if="blockDef?.groups?.length">
        <div v-for="group in blockDef.groups" :key="group.key" v-show="activeTab === group.key" class="cp-body">
          <template v-for="field in group.fields" :key="field.key">
            
            <div class="cp-field" v-if="field.type === 'text' || field.type === 'url' || field.type === 'number'">
              <label>{{ field.label }}</label>
              <input :type="field.type === 'number' ? 'number' : 'text'" :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" />
            </div>

            <div class="cp-field" v-else-if="field.type === 'textarea'">
              <label>{{ field.label }}</label>
              <textarea :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" rows="3"></textarea>
            </div>
            
            <div class="cp-field" v-else-if="field.type === 'richtext' || field.type === 'code'">
              <label>{{ field.label }}</label>
              <textarea :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" rows="6" style="font-family: monospace; font-size: 12px;"></textarea>
            </div>

            <div class="cp-field" v-else-if="field.type === 'select' || field.type === 'radio'">
              <label>{{ field.label }}</label>
              <div class="cp-select-wrap">
                <select :value="s[field.key]" @change="update(field.key, $event.target.value)">
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <ChevronDown :size="14" class="cp-select-icon" />
              </div>
            </div>

            <div class="cp-field" v-else-if="field.type === 'toggle'">
              <label class="cp-check-label">
                <input type="checkbox" :checked="s[field.key] !== false" @change="update(field.key, $event.target.checked)" />
                <span>{{ field.label }}</span>
              </label>
            </div>

            <div class="cp-field" v-else-if="field.type === 'color'">
              <label>{{ field.label }}</label>
              <div class="cp-color">
                <input type="color" :value="s[field.key] || '#ffffff'" @input="update(field.key, $event.target.value)" />
                <input type="text" :value="s[field.key]" @input="update(field.key, $event.target.value)" placeholder="Inherit" />
                <button v-if="s[field.key]" class="cp-btn-icon" @click="update(field.key, '')"><X :size="12" /></button>
              </div>
            </div>
            
            <div class="cp-field" v-else-if="field.type === 'slider' || field.type === 'range'">
              <label>{{ field.label }} ({{ s[field.key] || field.default }})</label>
              <input type="range" :value="s[field.key] !== undefined ? s[field.key] : field.default" :min="field.min" :max="field.max" :step="field.step || 1" @input="update(field.key, Number($event.target.value))" />
            </div>

            <div class="cp-field" v-else-if="field.type === 'image'">
              <label>{{ field.label }}</label>
              <MediaPicker :modelValue="s[field.key]" @update:modelValue="update(field.key, $event)" />
            </div>

          </template>
        </div>
      </template>

      <!-- FALLBACK FOR OLD NON-GROUPED SCHEMAS -->
      <template v-else>
        <!-- CONTENT TAB -->
        <div v-show="activeTab === 'content'" class="cp-body">
          <template v-for="field in (blockDef?.settingsSchema || [])" :key="field.key">
            
            <div class="cp-field" v-if="field.type === 'text'">
              <label>{{ field.label }}</label>
              <input type="text" :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" />
            </div>

            <div class="cp-field" v-else-if="field.type === 'textarea'">
              <label>{{ field.label }}</label>
              <textarea :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" rows="3"></textarea>
            </div>

            <div class="cp-field" v-else-if="field.type === 'richtext' || field.type === 'code'">
              <label>{{ field.label }}</label>
              <textarea :value="s[field.key]" @input="update(field.key, $event.target.value)" :placeholder="field.placeholder" rows="6" style="font-family: monospace; font-size: 12px;"></textarea>
              <p class="cp-help" v-if="field.type === 'richtext'">Hỗ trợ HTML cơ bản.</p>
            </div>

            <div class="cp-field" v-else-if="field.type === 'select'">
              <label>{{ field.label }}</label>
              <div class="cp-select-wrap">
                <select :value="s[field.key]" @change="update(field.key, $event.target.value)">
                  <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
                <ChevronDown :size="14" class="cp-select-icon" />
              </div>
            </div>

            <div class="cp-field" v-else-if="field.type === 'toggle'">
              <label class="cp-check-label">
                <input type="checkbox" :checked="s[field.key]" @change="update(field.key, $event.target.checked)" />
                <span>{{ field.label }}</span>
              </label>
            </div>

            <div class="cp-field" v-else-if="field.type === 'image'">
              <label>{{ field.label }}</label>
              <MediaPicker :modelValue="s[field.key]" @update:modelValue="update(field.key, $event)" />
            </div>

          </template>
          <p v-if="!blockDef?.settingsSchema?.length" class="cp-empty">Block này không có tùy chọn nội dung.</p>
        </div>

      <!-- STYLE TAB -->
      <div v-show="activeTab === 'style'" class="cp-body cp-style">
        
        <div class="cp-field">
          <label>Màu nền</label>
          <div class="cp-color">
            <input type="color" :value="s.bg_color || '#ffffff'" @input="update('bg_color', $event.target.value)" />
            <input type="text" :value="s.bg_color" @input="update('bg_color', $event.target.value)" placeholder="#ffffff" />
            <button v-if="s.bg_color" class="cp-btn-icon" @click="update('bg_color', '')"><X :size="12" /></button>
          </div>
        </div>

        <div class="cp-field">
          <label>Căn Lề (Padding)</label>
          <div class="cp-spacing">
            <input type="text" :value="s.pt" @input="update('pt', $event.target.value)" placeholder="Top" title="Padding Top" />
            <input type="text" :value="s.pr" @input="update('pr', $event.target.value)" placeholder="Right" title="Padding Right" />
            <input type="text" :value="s.pb" @input="update('pb', $event.target.value)" placeholder="Bottom" title="Padding Bottom" />
            <input type="text" :value="s.pl" @input="update('pl', $event.target.value)" placeholder="Left" title="Padding Left" />
          </div>
          <p class="cp-help">Ví dụ: 20px, 1rem, 5%</p>
        </div>

        <div class="cp-field">
          <label>Khoảng Cách (Margin)</label>
          <div class="cp-spacing">
            <input type="text" :value="s.mt" @input="update('mt', $event.target.value)" placeholder="Top" title="Margin Top" />
            <input type="text" :value="s.mr" @input="update('mr', $event.target.value)" placeholder="Right" title="Margin Right" />
            <input type="text" :value="s.mb" @input="update('mb', $event.target.value)" placeholder="Bottom" title="Margin Bottom" />
            <input type="text" :value="s.ml" @input="update('ml', $event.target.value)" placeholder="Left" title="Margin Left" />
          </div>
        </div>

        <div class="cp-field">
          <label>Bo góc (Border Radius)</label>
          <input type="text" :value="s.border_radius" @input="update('border_radius', $event.target.value)" placeholder="e.g. 8px, 50%" />
        </div>

        <div class="cp-field">
          <label>CSS Class Tùy chỉnh</label>
          <input type="text" :value="s.custom_class" @input="update('custom_class', $event.target.value)" placeholder="e.g. hide-on-mobile dark-theme" />
        </div>

      </div>
      </template>
    </div>


  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Settings, Image as ImageIcon, X, Palette, Type, ChevronDown, Box, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Columns, Layers } from 'lucide-vue-next'
import MediaPicker from '../../../../components/MediaPicker.vue'

const props = defineProps({
  block: { type: Object, default: null }
})

const emit = defineEmits(['update'])

const bridge = window.__APP_BRIDGE__ || {}

const activeTab = ref('content')

const blockDef = computed(() => {
  if (!props.block) return null
  return bridge.getBlockByType?.(props.block.type) || null
})

const s = computed(() => props.block?.settings || {})

const ICON_MAP = { Image: ImageIcon, FileText, Minus, Code, BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, Box, ImageIcon, Columns, Layers }
function resolveIcon(name) { return ICON_MAP[name] || Box }

function update(key, val) {
  emit('update', props.block.id, key, val)
}

</script>

<style scoped>
.cp { display: flex; flex-direction: column; height: 100%; background: var(--bg-1, #fff); border-left: 1px solid var(--border, #e5e7eb); }

.cp-header {
  padding: 16px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
}
.cp-title { display: flex; align-items: center; gap: 8px; }
.cp-title h4 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-1); }
.cp-icon { color: var(--accent, #7c3aed); }

.cp-tabs {
  display: flex; border-bottom: 1px solid var(--border);
  background: var(--bg-2, #f9fafb);
}
.cp-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 0; background: none; border: none; font-size: 12px; font-weight: 600;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.cp-tab:hover { color: var(--text-2); background: rgba(0,0,0,0.02); }
.cp-tab--active { color: var(--accent); border-bottom-color: var(--accent); background: #fff; }

.cp-scroll { flex: 1; overflow-y: auto; }
.cp-body { display: flex; flex-direction: column; gap: 16px; padding: 16px; }

.cp-field { display: flex; flex-direction: column; gap: 6px; }
.cp-field label { font-size: 12px; font-weight: 600; color: var(--text-2); }
.cp-field input[type="text"], .cp-field textarea, .cp-field select {
  width: 100%; width: -moz-available; width: -webkit-fill-available; box-sizing: border-box;
  padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px;
  font-size: 13px; color: var(--text-1); background: #fff; outline: none; transition: border-color .2s;
}
.cp-field input[type="text"]:focus, .cp-field textarea:focus, .cp-field select:focus {
  border-color: var(--accent); box-shadow: 0 0 0 2px rgba(124,58,237,0.1);
}
.cp-help { font-size: 11px; color: var(--text-3); margin: 0; }

.cp-select-wrap { position: relative; }
.cp-select-wrap select { appearance: none; padding-right: 30px; cursor: pointer; }
.cp-select-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); pointer-events: none; color: var(--text-3); }

.cp-check-label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.cp-check-label input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }



/* Buttons */
.cp-btn-secondary { background: #fff; border: 1px solid var(--border); padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; cursor: pointer; color: var(--text-2); }
.cp-btn-secondary:hover { border-color: var(--text-3); color: var(--text-1); }
.cp-btn-icon { background: none; border: none; padding: 4px; color: var(--text-3); cursor: pointer; border-radius: 4px; display: flex; align-items: center; justify-content: center; }
.cp-btn-icon:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }

/* Style Specific */
.cp-color { display: flex; align-items: center; gap: 8px; }
.cp-color input[type="color"] {
  width: 32px; height: 32px; padding: 0; border: 1px solid var(--border);
  border-radius: 6px; cursor: pointer; background: none;
}
.cp-color input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
.cp-color input[type="color"]::-webkit-color-swatch { border: none; border-radius: 5px; }

.cp-spacing { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 4px; }
.cp-spacing input { text-align: center; padding: 8px 4px !important; }

.cp-empty { font-size: 13px; color: var(--text-3); text-align: center; padding: 30px 0; }

</style>
