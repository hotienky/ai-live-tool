<template>
  <div class="bcp">
    <!-- Empty state -->
    <div v-if="!block" class="bcp-empty">
      <Settings :size="28" class="bcp-empty__icon" />
      <p>Chọn một block để cấu hình</p>
    </div>

    <template v-else>
      <!-- Panel header -->
      <div class="bcp-header">
        <component :is="resolveIcon(blockDef?.icon)" :size="15" class="bcp-header__icon" />
        <h3 class="bcp-header__title">{{ blockDef?.label || blockDef?.name || block.type }}</h3>
      </div>

      <!-- Group tabs (khi schema có groups) -->
      <div v-if="groups.length > 1" class="bcp-tabs">
        <button
          v-for="g in groups"
          :key="g.key"
          class="bcp-tab"
          :class="{ active: activeGroup === g.key }"
          @click="activeGroup = g.key"
        >{{ g.label }}</button>
      </div>

      <!-- Fields -->
      <div class="bcp-body">
        <div v-for="field in activeFields" :key="field.key" class="bcp-field">
          <label class="bcp-label">{{ field.label }}</label>

          <!-- text / image (URL) -->
          <input
            v-if="field.type === 'text' || field.type === 'image'"
            :value="settings[field.key] ?? field.default ?? ''"
            @input="emit('update', field.key, $event.target.value)"
            type="text"
            class="bcp-input"
            :placeholder="field.placeholder || ''"
          />

          <!-- number -->
          <input
            v-else-if="field.type === 'number'"
            :value="settings[field.key] ?? field.default ?? ''"
            @input="emit('update', field.key, Number($event.target.value) || 0)"
            type="number"
            class="bcp-input"
            :placeholder="field.placeholder || ''"
          />

          <!-- slider -->
          <div v-else-if="field.type === 'slider'" class="bcp-slider">
            <input
              type="range"
              :min="field.min ?? 0"
              :max="field.max ?? 100"
              :step="field.step ?? 1"
              :value="settings[field.key] ?? field.default ?? field.min ?? 0"
              @input="emit('update', field.key, Number($event.target.value))"
              class="bcp-slider__range"
            />
            <span class="bcp-slider__val">
              {{ settings[field.key] ?? field.default ?? field.min ?? 0 }}
            </span>
          </div>

          <!-- color -->
          <div v-else-if="field.type === 'color'" class="bcp-color">
            <input
              type="color"
              :value="colorVal(field)"
              @input="emit('update', field.key, $event.target.value)"
              class="bcp-color__swatch"
            />
            <input
              type="text"
              :value="settings[field.key] ?? field.default ?? ''"
              @input="onColorText(field.key, $event.target.value)"
              class="bcp-input bcp-color__hex"
              placeholder="#ffffff"
              maxlength="7"
            />
            <button
              v-if="settings[field.key]"
              class="bcp-color__clear"
              @click="emit('update', field.key, '')"
              title="Xóa màu"
            >✕</button>
          </div>

          <!-- textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :value="settings[field.key] ?? field.default ?? ''"
            @input="emit('update', field.key, $event.target.value)"
            class="bcp-input bcp-textarea"
            rows="3"
            :placeholder="field.placeholder || ''"
          ></textarea>

          <!-- code / richtext / html -->
          <textarea
            v-else-if="['code', 'richtext', 'html'].includes(field.type)"
            :value="settings[field.key] ?? field.default ?? ''"
            @input="emit('update', field.key, $event.target.value)"
            class="bcp-input bcp-code"
            rows="6"
            :placeholder="field.placeholder || ''"
            spellcheck="false"
          ></textarea>

          <!-- select -->
          <select
            v-else-if="field.type === 'select'"
            :value="settings[field.key] ?? field.default ?? ''"
            @change="emit('update', field.key, $event.target.value)"
            class="bcp-input"
          >
            <option
              v-for="opt in field.options"
              :key="opt.value ?? opt"
              :value="opt.value ?? opt"
            >{{ opt.label ?? opt }}</option>
          </select>

          <!-- radio -->
          <div v-else-if="field.type === 'radio'" class="bcp-radios">
            <label
              v-for="opt in field.options"
              :key="opt.value ?? opt"
              class="bcp-radio"
              :class="{ active: (settings[field.key] ?? field.default) === (opt.value ?? opt) }"
            >
              <input
                type="radio"
                :checked="(settings[field.key] ?? field.default) === (opt.value ?? opt)"
                @change="emit('update', field.key, opt.value ?? opt)"
              />
              {{ opt.label ?? opt }}
            </label>
          </div>

          <!-- toggle -->
          <div
            v-else-if="field.type === 'toggle'"
            class="bcp-toggle"
            :class="{ active: settings[field.key] ?? field.default ?? false }"
            @click="emit('update', field.key, !(settings[field.key] ?? field.default ?? false))"
          >
            <div class="bcp-toggle__knob"></div>
          </div>

          <!-- api-select -->
          <div v-else-if="field.type === 'api-select'" class="bcp-api-select">
            <select
              :value="settings[field.key] ?? ''"
              @change="emit('update', field.key, $event.target.value || null)"
              class="bcp-input"
            >
              <option value="">{{ field.placeholder || 'Tất cả' }}</option>
              <option
                v-for="item in (apiOptions[field.key] || [])"
                :key="item.id ?? item.value"
                :value="item.id ?? item.value"
              >{{ item.name ?? item.label ?? item.title }}</option>
            </select>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, watch, reactive, ref } from 'vue'
import {
  Settings, Box, Image, FileText, Minus, Code,
  BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, ImageIcon, Sparkles,
} from 'lucide-vue-next'
import { apiFetch } from '../../helpers.js'

const props = defineProps({
  block: { type: Object, default: null },
  blockDef: { type: Object, default: null },
})
const emit = defineEmits(['update'])

const ICON_MAP = {
  Image, FileText, Minus, Code, BookOpen, TrendingUp,
  ShoppingBag, Star, FolderTree, Box, ImageIcon, Sparkles,
}
function resolveIcon(name) { return ICON_MAP[name] || Box }

const settings = computed(() => props.block?.settings || {})

/**
 * Hỗ trợ cả 2 format:
 *  - Cũ: blockDef.settingsSchema = [...fields] (flat)
 *  - Mới: blockDef.groups = [{ key, label, fields }]
 */
const groups = computed(() => {
  if (props.blockDef?.groups?.length) return props.blockDef.groups
  const flat = props.blockDef?.settingsSchema || []
  if (!flat.length) return []
  // wrap flat schema thành 1 group duy nhất để render thống nhất
  return [{ key: '_all', label: 'Cài đặt', fields: flat }]
})

const activeGroup = ref(null)

// Reset tab khi block thay đổi
watch(() => props.block?.id, () => {
  activeGroup.value = groups.value[0]?.key || null
}, { immediate: true })

watch(groups, (g) => {
  if (!activeGroup.value && g.length) {
    activeGroup.value = g[0].key
  }
})

const activeFields = computed(() => {
  const g = groups.value.find(g => g.key === activeGroup.value)
  return g?.fields || []
})

// ── Color helpers ──
function colorVal(field) {
  const v = settings.value[field.key] ?? field.default ?? ''
  // input type=color cần giá trị hex hợp lệ
  return /^#[0-9a-fA-F]{6}$/.test(v) ? v : '#ffffff'
}

function onColorText(key, val) {
  // chỉ emit khi là hex hợp lệ hoặc rỗng
  if (!val || /^#[0-9a-fA-F]{6}$/.test(val)) {
    emit('update', key, val)
  }
}

// ── API-select options cache ──
const apiOptions = reactive({})

async function loadApiOptions(field) {
  if (!field.endpoint) return
  try {
    const res = await apiFetch(field.endpoint)
    const json = await res.json()
    apiOptions[field.key] = Array.isArray(json) ? json : (json.data || [])
  } catch {
    apiOptions[field.key] = []
  }
}

watch(() => props.blockDef, (def) => {
  if (!def) return
  const allFields = (def.groups || []).flatMap(g => g.fields || [])
    .concat(def.settingsSchema || [])
  for (const field of allFields) {
    if (field.type === 'api-select' && field.endpoint && !apiOptions[field.key]) {
      loadApiOptions(field)
    }
  }
}, { immediate: true })
</script>

<style scoped>
.bcp {
  width: 260px;
  min-width: 240px;
  background: var(--bg-2, #f9fafb);
  border-left: 1px solid var(--border, #e5e7eb);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bcp-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-3, #9ca3af);
  gap: 10px;
  padding: 24px;
  text-align: center;
}
.bcp-empty__icon { opacity: .4; }
.bcp-empty p { margin: 0; font-size: 13px; }

.bcp-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.bcp-header__icon { color: var(--accent, #7c3aed); }
.bcp-header__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
}

/* ── Group Tabs ── */
.bcp-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--bg-1, #fff);
}
.bcp-tab {
  flex: 1;
  padding: 7px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2, #6b7280);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.bcp-tab:hover { color: var(--accent, #7c3aed); }
.bcp-tab.active {
  color: var(--accent, #7c3aed);
  border-bottom-color: var(--accent, #7c3aed);
}

.bcp-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bcp-field { display: flex; flex-direction: column; gap: 5px; }
.bcp-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2, #6b7280);
  text-transform: uppercase;
  letter-spacing: .4px;
}

.bcp-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 7px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--bg-1, #fff);
  color: var(--text-1);
  font-size: 13px;
  box-sizing: border-box;
}
.bcp-input:focus { outline: none; border-color: var(--accent, #7c3aed); }
.bcp-textarea { resize: vertical; min-height: 64px; }
.bcp-code {
  font-family: monospace;
  font-size: 11px;
  resize: vertical;
  min-height: 80px;
}

/* ── Slider ── */
.bcp-slider {
  display: flex;
  align-items: center;
  gap: 8px;
}
.bcp-slider__range {
  flex: 1;
  height: 4px;
  accent-color: var(--accent, #7c3aed);
  cursor: pointer;
}
.bcp-slider__val {
  min-width: 28px;
  text-align: right;
  font-size: 12px;
  font-weight: 700;
  color: var(--accent, #7c3aed);
  background: rgba(124,58,237,.08);
  border-radius: 5px;
  padding: 2px 6px;
}

/* ── Color ── */
.bcp-color {
  display: flex;
  align-items: center;
  gap: 6px;
}
.bcp-color__swatch {
  width: 32px;
  height: 32px;
  padding: 2px;
  border-radius: 7px;
  border: 1px solid var(--border);
  cursor: pointer;
  flex-shrink: 0;
  background: var(--bg-1, #fff);
}
.bcp-color__hex {
  flex: 1;
  padding: 7px 8px;
  font-size: 12px;
  font-family: monospace;
}
.bcp-color__clear {
  padding: 4px 6px;
  border-radius: 5px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-3);
  font-size: 10px;
  cursor: pointer;
  flex-shrink: 0;
}
.bcp-color__clear:hover { color: #ef4444; border-color: #ef4444; }

/* ── Radio ── */
.bcp-radios { display: flex; gap: 6px; flex-wrap: wrap; }
.bcp-radio {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg-1);
  font-size: 12px;
  cursor: pointer;
  transition: all .15s;
}
.bcp-radio input { display: none; }
.bcp-radio.active { border-color: var(--accent); color: var(--accent); background: rgba(124,58,237,.06); }
.bcp-radio:hover:not(.active) { border-color: var(--accent); }

/* ── Toggle ── */
.bcp-toggle {
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: var(--border, #d1d5db);
  position: relative;
  cursor: pointer;
  transition: background .2s;
}
.bcp-toggle.active { background: var(--accent, #7c3aed); }
.bcp-toggle__knob {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  transition: transform .2s;
  box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.bcp-toggle.active .bcp-toggle__knob { transform: translateX(16px); }

.bcp-api-select { display: flex; flex-direction: column; gap: 4px; }
</style>
