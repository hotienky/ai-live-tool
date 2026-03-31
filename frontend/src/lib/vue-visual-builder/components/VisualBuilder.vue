<template>
  <div class="vvb-container">
    <!-- TOOLBAR TOP -->
    <header class="vvb-header">
      <div class="vvb-header__left">
        <slot name="header-left">
          <span class="vvb-brand">Visual Builder 🚀</span>
        </slot>
      </div>
      
      <!-- Responsive controls -->
      <div class="vvb-device-toggles">
        <button 
          :class="['vvb-btn-icon', { active: state.activeBreakpoint === 'desktop' }]" 
          @click="setActiveBreakpoint('desktop')" title="Desktop">
          <Monitor :size="14" />
        </button>
        <button 
          :class="['vvb-btn-icon', { active: state.activeBreakpoint === 'tablet' }]" 
          @click="setActiveBreakpoint('tablet')" title="Tablet">
          <Tablet :size="14" />
        </button>
        <button 
          :class="['vvb-btn-icon', { active: state.activeBreakpoint === 'mobile' }]" 
          @click="setActiveBreakpoint('mobile')" title="Mobile">
          <Smartphone :size="14" />
        </button>
      </div>

      <div class="vvb-header__right">
        <!-- History Controls -->
        <button 
          class="vvb-btn-text" 
          :disabled="!canUndo" 
          @click="undo" title="Undo (Ctrl+Z)">
          <Undo2 :size="14" />
        </button>
        <button 
          class="vvb-btn-text" 
          :disabled="!canRedo" 
          @click="redo" title="Redo (Ctrl+Shift+Z)">
          <Redo2 :size="14" />
        </button>
        
        <slot name="header-right"></slot>
      </div>
    </header>

    <div class="vvb-body">
      <!-- LEFT SIDEBAR: Structure / Blocks List -->
      <aside class="vvb-sidebar vvb-sidebar--left" v-if="!hideLeftSidebar">
        <div class="vvb-panel-title">Layers</div>
        <div class="vvb-layers-list">
          <slot name="layers">
            <!-- Render tree of sections here -->
            <VvbLayerTree :sections="state.sections" />
          </slot>
        </div>
      </aside>

      <!-- CENTER: Live Canvas Preview -->
      <main class="vvb-canvas-area">
        <div class="vvb-canvas-wrapper" :class="`vvb-canvas--${state.activeBreakpoint}`">
          <!-- We expect the user to pass the URL to the LiveCanvas via slot or props -->
          <slot name="canvas">
             <LiveCanvas :url="canvasUrl" />
          </slot>
        </div>
      </main>

      <!-- RIGHT SIDEBAR: Properties / Styles -->
      <aside class="vvb-sidebar vvb-sidebar--right" v-if="!hideRightSidebar">
        <div v-if="state.activeSectionId" class="vvb-config-panel">
          <div class="vvb-panel-title">Properties</div>
          <slot name="properties" :section-id="state.activeSectionId">
            <!-- Property Editor Component will inject here -->
             <StyleControlPanel :sectionId="state.activeSectionId" />
          </slot>
        </div>
        <div v-else class="vvb-empty-panel">
           <MousePointer2 :size="24" style="opacity:0.3; margin-bottom: 12px" />
           <p>Chọn một Block trên Canvas để cấu hình.</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { Monitor, Tablet, Smartphone, Undo2, Redo2, MousePointer2 } from 'lucide-vue-next'
import { useBuilderState } from '../core/state.js'
import LiveCanvas from './LiveCanvas.vue'
import StyleControlPanel from './StyleControlPanel.vue'

const props = defineProps({
  initialData: { type: Array, default: () => [] },
  canvasUrl: { type: String, default: '' },
  hideLeftSidebar: { type: Boolean, default: false },
  hideRightSidebar: { type: Boolean, default: false }
})

const emit = defineEmits(['update:data', 'save'])

const { state, loadLayoutFromData, setActiveBreakpoint, canUndo, canRedo, undo, redo, pushHistorySnapshot } = useBuilderState()

// Load initial data
onMounted(() => {
  if (props.initialData && props.initialData.length > 0) {
    loadLayoutFromData(props.initialData)
  }
})

// Emit updates when sections change
watch(() => state.sections, (val) => {
  emit('update:data', val)
}, { deep: true })
</script>

<style scoped>
.vvb-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #0f1115; /* Sleek dark mode builder */
  color: #e2e8f0;
  font-family: 'Inter', -apple-system, sans-serif;
  overflow: hidden;
}

.vvb-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: #181b21;
  border-bottom: 1px solid #272c36;
  flex-shrink: 0;
}

.vvb-brand { font-weight: 700; font-size: 14px; background: linear-gradient(90deg, #6366f1, #a855f7); -webkit-background-clip: text; color: transparent; }

.vvb-btn-icon, .vvb-btn-text {
  background: transparent;
  border: none;
  color: #94a3b8;
  border-radius: 6px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.vvb-btn-icon { width: 32px; height: 32px; }
.vvb-btn-text { padding: 6px 12px; font-size: 12px; font-weight: 600; gap: 6px; }

.vvb-btn-icon:hover:not(:disabled), .vvb-btn-text:hover:not(:disabled) {
  background: #272c36;
  color: #fff;
}
.vvb-btn-icon.active {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
}

.vvb-device-toggles { display: flex; gap: 4px; background: #0f1115; padding: 4px; border-radius: 8px; border: 1px solid #272c36; }

.vvb-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.vvb-sidebar {
  width: 280px;
  background: #181b21;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 10;
}
.vvb-sidebar--left { border-right: 1px solid #272c36; }
.vvb-sidebar--right { border-left: 1px solid #272c36; width: 320px; }

.vvb-panel-title {
  padding: 12px 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
  border-bottom: 1px solid #272c36;
}

.vvb-canvas-area {
  flex: 1;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
  position: relative;
}

.vvb-canvas-wrapper {
  background: #fff;
  height: 100%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1), height 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  display: flex;
  flex-direction: column;
}

.vvb-canvas--desktop { width: 100%; max-width: 1440px; }
.vvb-canvas--tablet { width: 768px; }
.vvb-canvas--mobile { width: 375px; }

.vvb-empty-panel {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 100%; color: #64748b; font-size: 13px; text-align: center; padding: 24px;
}
</style>
