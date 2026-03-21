<template>
  <div class="block-settings" v-if="block">
    <div class="bs-header">
      <h4 class="bs-title">{{ typeDef?.label || block.type }}</h4>
      <button class="bs-close" @click="$emit('close')"><X :size="14" /></button>
    </div>

    <!-- Tabs -->
    <div class="bs-tabs">
      <button :class="{ active: tab === 'content' }" @click="tab = 'content'">
        <PenLine :size="12" /> Content
      </button>
      <button :class="{ active: tab === 'style' }" @click="tab = 'style'">
        <Palette :size="12" /> Style
      </button>
    </div>

    <!-- Content Tab -->
    <div v-if="tab === 'content'" class="bs-panel">
      <div v-for="field in (typeDef?.settings || [])" :key="field.key" class="bs-field">
        <label class="bs-label">{{ field.label }}</label>

        <!-- Text input -->
        <input v-if="field.type === 'text'" type="text" :value="block.content[field.key]" @input="updateContent(field.key, $event.target.value)" class="bs-input" />

        <!-- Number -->
        <input v-else-if="field.type === 'number'" type="number" :value="block.content[field.key]" @input="updateContent(field.key, Number($event.target.value))" class="bs-input bs-input--sm" />

        <!-- Select -->
        <select v-else-if="field.type === 'select'" :value="block.content[field.key]" @change="updateContent(field.key, $event.target.value)" class="bs-select">
          <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>

        <!-- Color -->
        <div v-else-if="field.type === 'color'" class="bs-color-group">
          <input type="color" :value="block.content[field.key] || '#000000'" @input="updateContent(field.key, $event.target.value)" class="bs-color" />
          <input type="text" :value="block.content[field.key]" @input="updateContent(field.key, $event.target.value)" class="bs-input bs-input--sm" maxlength="7" />
        </div>

        <!-- Toggle -->
        <label v-else-if="field.type === 'toggle'" class="bs-toggle">
          <input type="checkbox" :checked="block.content[field.key]" @change="updateContent(field.key, $event.target.checked)" />
          <span class="bs-toggle__slider"></span>
        </label>

        <!-- Richtext (textarea fallback) -->
        <textarea v-else-if="field.type === 'richtext'" :value="block.content[field.key]" @input="updateContent(field.key, $event.target.value)" rows="4" class="bs-textarea" />

        <!-- Code -->
        <textarea v-else-if="field.type === 'code'" :value="block.content[field.key]" @input="updateContent(field.key, $event.target.value)" rows="6" class="bs-textarea bs-textarea--code" />

        <!-- Image -->
        <div v-else-if="field.type === 'image'" class="bs-image-field">
          <input type="text" :value="block.content[field.key]" @input="updateContent(field.key, $event.target.value)" class="bs-input" placeholder="Image URL" />
        </div>
      </div>
    </div>

    <!-- Style Tab -->
    <div v-if="tab === 'style'" class="bs-panel">
      <StyleControls :style-data="block.style" :responsive="block.responsive" :animation="block.animation" @update:style="updateStyle" @update:responsive="updateResponsive" @update:animation="updateAnimation" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { X, PenLine, Palette } from 'lucide-vue-next'
import { blockRegistry } from '../core/blocks.js'
import StyleControls from './StyleControls.vue'

const props = defineProps({
  block: { type: Object, default: null },
})
const emit = defineEmits(['update', 'close'])

const tab = ref('content')

const typeDef = computed(() => props.block ? blockRegistry.get(props.block.type) : null)

function updateContent(key, value) {
  emit('update', {
    ...props.block,
    content: { ...props.block.content, [key]: value },
  })
}

function updateStyle(newStyle) {
  emit('update', { ...props.block, style: newStyle })
}

function updateResponsive(newResp) {
  emit('update', { ...props.block, responsive: newResp })
}

function updateAnimation(anim) {
  emit('update', { ...props.block, animation: anim })
}
</script>

<style scoped>
.block-settings {
  display: flex; flex-direction: column; height: 100%;
  overflow-y: auto;
}

.bs-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px; border-bottom: 1px solid var(--glass-border);
}
.bs-title { font-size: 14px; font-weight: 700; margin: 0; }
.bs-close { background: none; border: none; color: var(--text-3); cursor: pointer; padding: 4px; }

/* Tabs */
.bs-tabs {
  display: flex; border-bottom: 1px solid var(--glass-border);
}
.bs-tabs button {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px; font-size: 12px; font-weight: 700; cursor: pointer;
  border: none; background: transparent; color: var(--text-3); transition: all 0.2s;
  border-bottom: 2px solid transparent;
}
.bs-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }

/* Panel */
.bs-panel { padding: 16px; display: flex; flex-direction: column; gap: 14px; }

/* Fields */
.bs-field { display: flex; flex-direction: column; gap: 4px; }
.bs-label { font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; letter-spacing: 0.5px; }
.bs-input {
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 13px; color: var(--text-1);
}
.bs-input:focus { outline: none; border-color: var(--accent); }
.bs-input--sm { max-width: 120px; }

.bs-select {
  padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 13px; color: var(--text-1);
}

.bs-textarea {
  padding: 10px 12px; border-radius: 8px; resize: vertical;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 13px; color: var(--text-1); line-height: 1.5;
}
.bs-textarea--code { font-family: monospace; font-size: 12px; }

.bs-color-group { display: flex; align-items: center; gap: 8px; }
.bs-color { width: 36px; height: 36px; border: none; border-radius: 8px; cursor: pointer; padding: 2px; }

/* Toggle */
.bs-toggle { position: relative; display: inline-flex; width: 40px; height: 22px; cursor: pointer; }
.bs-toggle input { opacity: 0; width: 0; height: 0; }
.bs-toggle__slider {
  position: absolute; inset: 0; border-radius: 11px;
  background: var(--color-border); transition: all 0.2s;
}
.bs-toggle__slider::before {
  content: ''; position: absolute; width: 16px; height: 16px;
  border-radius: 50%; background: #fff; left: 3px; top: 3px; transition: all 0.2s;
}
.bs-toggle input:checked + .bs-toggle__slider { background: var(--accent); }
.bs-toggle input:checked + .bs-toggle__slider::before { left: 21px; }
</style>
