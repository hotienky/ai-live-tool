<template>
  <div class="vvb-props-panel" v-if="sectionNode">
    
    <div class="vvb-panel-group">
      <div class="vvb-group-title">Sơ cấp</div>
      
      <!-- Render dynamic schema input fields -->
      <template v-for="field in blockSpec.schema" :key="field.key">
        <div class="vvb-prop-row">
          <label>{{ field.label || field.key }}</label>
          <input 
            v-if="['text', 'number', 'url'].includes(field.type)" 
            :type="field.type" 
            v-model="sectionNode.params[field.key]" 
            class="vvb-input" 
          />
          <input 
            v-else-if="field.type === 'color'" 
            type="color" 
            v-model="sectionNode.params[field.key]" 
            class="vvb-color-picker" 
          />
          <select 
            v-else-if="field.type === 'select'" 
            v-model="sectionNode.params[field.key]" 
            class="vvb-select"
          >
            <option v-for="opt in field.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <input 
            v-else-if="field.type === 'boolean'" 
            type="checkbox" 
            v-model="sectionNode.params[field.key]" 
          />
        </div>
      </template>

    </div>

    <!-- Advanced UI Styles (Margin/Padding graphic) -->
    <div class="vvb-panel-group">
      <div class="vvb-group-title">Layout Styles (Spacing)</div>
      <div class="vvb-spacing-box">
        <!-- Visualization Margin/Padding Control -->
        <div class="vvb-box-margin">
          <div class="vvb-box-label">MARGIN</div>
          <input type="number" class="vvb-box-input top" v-model.number="sectionNode.params.marginTop" placeholder="-" />
          <input type="number" class="vvb-box-input bottom" v-model.number="sectionNode.params.marginBottom" placeholder="-" />
          
          <div class="vvb-box-padding">
            <div class="vvb-box-label">PADDING</div>
            <input type="number" class="vvb-box-input top" v-model.number="sectionNode.params.paddingTop" placeholder="-" />
            <input type="number" class="vvb-box-input bottom" v-model.number="sectionNode.params.paddingBottom" placeholder="-" />
            <div class="vvb-box-content"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useBuilderState } from '../core/state.js'
import { registry } from '../core/registry.js'

const props = defineProps({
  sectionId: { type: [String, Number], required: true }
})

const { state, pushHistorySnapshot } = useBuilderState()

const sectionNode = computed(() => {
  // Fallback to array index tracking for simplicity during Phase 1
  return state.sections[props.sectionId] || null
})

const blockSpec = computed(() => {
  if (!sectionNode.value) return { schema: [] }
  return registry.getBlockSpec(sectionNode.value.type) || { schema: [] }
})

// Watch value changes internally here to push state
// OR handle on change events.
</script>

<style scoped>
.vvb-props-panel {
  padding: 12px;
  overflow-y: auto;
  height: 100%;
}
.vvb-panel-group { margin-bottom: 24px; }
.vvb-group-title { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.05em; }

.vvb-prop-row { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.vvb-prop-row label { font-size: 11px; color: #cbd5e1; }

.vvb-input, .vvb-select {
  background: #0f1115; border: 1px solid #334155; color: #fff;
  padding: 6px 10px; border-radius: 6px; font-size: 12px;
  outline: none; width: 100%; transition: border-color 0.2s;
}
.vvb-input:focus, .vvb-select:focus { border-color: #6366f1; }

.vvb-color-picker { background: transparent; border: none; padding: 0; width: 30px; height: 30px; cursor: pointer; border-radius: 4px; }

/* Spacing Graphic Box */
.vvb-spacing-box {
  width: 100%; display: flex; justify-content: center; user-select: none;
}
.vvb-box-margin, .vvb-box-padding {
  position: relative; border-radius: 4px; display: flex; align-items: center; justify-content: center;
}
.vvb-box-margin {
  padding: 24px 34px; background: rgba(59, 130, 246, 0.05); border: 1px dashed rgba(59, 130, 246, 0.3); width: 100%; max-width: 240px;
}
.vvb-box-padding {
  padding: 24px 34px; background: rgba(34, 197, 94, 0.05); border: 1px dashed rgba(34, 197, 94, 0.3); width: 100%;
}
.vvb-box-content { background: #334155; border-radius: 2px; height: 20px; width: 100%; }

.vvb-box-label { position: absolute; top: 4px; left: 6px; font-size: 9px; color: #64748b; font-weight: 700; }
.vvb-box-input {
  position: absolute; width: 36px; background: transparent; border: none; color: #fff; font-size: 11px; text-align: center;
}
.vvb-box-input:hover, .vvb-box-input:focus { background: rgba(255,255,255,0.1); border-radius: 4px; outline: none; }

.vvb-box-input.top { top: 4px; left: 50%; transform: translateX(-50%); }
.vvb-box-input.bottom { bottom: 4px; left: 50%; transform: translateX(-50%); }
</style>
