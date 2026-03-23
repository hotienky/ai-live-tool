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
        <h3 class="bcp-header__title">{{ blockDef?.name || block.type }}</h3>
      </div>

      <!-- Settings fields -->
      <div class="bcp-body">
        <div v-for="field in schema" :key="field.key" class="bcp-field">
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

          <!-- textarea -->
          <textarea
            v-else-if="field.type === 'textarea'"
            :value="settings[field.key] ?? field.default ?? ''"
            @input="emit('update', field.key, $event.target.value)"
            class="bcp-input bcp-textarea"
            rows="3"
            :placeholder="field.placeholder || ''"
          ></textarea>

          <!-- code / richtext / html-embed -->
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

          <!-- api-select: shows text input with async options below -->
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
import { computed, watch, reactive } from 'vue'
import {
  Settings, Box, Image, FileText, Minus, Code,
  BookOpen, TrendingUp, ShoppingBag, Star, FolderTree, ImageIcon,
} from 'lucide-vue-next'
import { apiFetch } from '../../helpers.js'

const props = defineProps({
  block: { type: Object, default: null },
  blockDef: { type: Object, default: null },
})
const emit = defineEmits(['update'])

const ICON_MAP = {
  Image, FileText, Minus, Code, BookOpen, TrendingUp,
  ShoppingBag, Star, FolderTree, Box, ImageIcon,
}
function resolveIcon(name) { return ICON_MAP[name] || Box }

const settings = computed(() => props.block?.settings || {})
const schema = computed(() => props.blockDef?.settingsSchema || [])

// Fetch options for api-select fields
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
  for (const field of (def.settingsSchema || [])) {
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
}
.bcp-header__icon { color: var(--accent, #7c3aed); }
.bcp-header__title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-1);
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
