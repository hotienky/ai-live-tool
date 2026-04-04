<template>
  <!-- RIGHT PANEL backdrop (click outside to close) -->
  <div v-if="activeConfig" class="cpb-right-backdrop" @click="$emit('update:activeConfig', null)"></div>

  <!-- RIGHT PANEL (Properties) -->
  <div class="cpb-right" :class="{ 'cpb-right--open': activeConfig }">
    <div v-if="activeConfig && activeConfig !== 'library'" class="cpb-prop-header" style="justify-content: flex-start; gap: 12px;">
      <button class="cpb-btn-secondary" @click="$emit('update:activeConfig', 'library')" title="Quay lại Kho Layout" style="padding: 6px; border: none; background: var(--bg-2)"><ChevronLeft :size="16"/></button>
      <h4 style="margin: 0; font-size: 14px; font-weight: 600; flex: 1;">{{ rightPanelTitle }}</h4>
      <button class="cpb-btn-secondary" @click="$emit('update:activeConfig', null)" title="Đóng" style="padding: 6px; border: none;"><X :size="16"/></button>
    </div>
    <div v-else-if="activeConfig === 'library'" class="cpb-prop-header">
      <h4>Kho Giao Diện</h4>
      <button @click="$emit('update:activeConfig', null)" title="Đóng"><X :size="16"/></button>
    </div>

    <div class="cpb-prop-body scroll-y" style="padding: 16px;">
      <!-- Header Config -->
      <LayoutHeaderConfig v-if="activeConfig === 'header'" :header-config="headerConfig" :active-page-id="activePageId" @update:header-config="v => $emit('update:headerConfig', v)" />

      <!-- Footer Config -->
      <LayoutFooterConfig v-else-if="activeConfig === 'footer'" :footer-config="footerConfig" :active-page-id="activePageId" @update:footer-config="v => $emit('update:footerConfig', v)" />

      <!-- Promo Config -->
      <BuilderPromoConfig v-else-if="activeConfig === 'promo'" :modelValue="promoConfig" @update:modelValue="v => $emit('update:promoConfig', v)" />

      <!-- Library (Kho Layout) -->
      <BuilderLibraryPanel
        v-if="activeConfig === 'library'"
        :grouped-library-items="groupedLibraryItems"
        :section-icon-map="sectionIconMap"
        :sections="sections"
        :templates="templates"
        :active-template="activeTemplate"
        :active-page-id="activePageId"
        @add-section="lib => $emit('add-section', lib)"
        @apply-template="key => $emit('apply-template', key)"
      />

      <!-- Section Config (Content + Style) -->
      <template v-else-if="activeSectionObj">
        <SectionConfigEditor
          :section="activeSectionObj"
          :all-categories="allCategories"
          :current-lang="'vi'"
          :default-lang-code="'vi'"
          @open-block-editor="s => $emit('open-block-editor', s)"
          @navigate-tab="tab => { $emit('update:activeConfig', null); $emit('navigate-tab', tab) }"
        />
      </template>

    </div>
  </div>
</template>

<script setup>
import { X, ChevronLeft } from 'lucide-vue-next'
import LayoutHeaderConfig from '../storefront/LayoutHeaderConfig.vue'
import LayoutFooterConfig from '../storefront/LayoutFooterConfig.vue'
import SectionConfigEditor from '../storefront/SectionConfigEditor.vue'
import BuilderPromoConfig from './BuilderPromoConfig.vue'
import BuilderLibraryPanel from './BuilderLibraryPanel.vue'

defineProps({
  activeConfig: { default: null },
  activeSectionObj: { default: null },
  rightPanelTitle: { type: String, default: '' },
  headerConfig: { type: Object, default: () => ({}) },
  footerConfig: { type: Object, default: () => ({}) },
  promoConfig: { type: Object, default: () => ({}) },
  allCategories: { type: Array, default: () => [] },
  activePageId: { default: null },
  groupedLibraryItems: { type: Object, default: () => ({}) },
  sectionIconMap: { type: Object, default: () => ({}) },
  sections: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  activeTemplate: { type: String, default: '' },
})

defineEmits([
  'update:activeConfig',
  'update:headerConfig',
  'update:footerConfig',
  'update:promoConfig',
  'open-block-editor',
  'navigate-tab',
  'add-section',
  'apply-template',
])
</script>

<style scoped>
.cpb-right-backdrop { position: absolute; inset: 0; z-index: 19; cursor: default; }
.cpb-right { width: 360px; background: #fff; border-left: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); position: absolute; right: 0; top: 0; height: 100%; z-index: 20; box-shadow: -6px 0 32px rgba(0,0,0,0.10); }
.cpb-right:not(.cpb-right--open) { transform: translateX(100%); pointer-events: none; }
.cpb-prop-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); background: #fff; }
.cpb-prop-header h4 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-1); }
.cpb-prop-header button { background: none; border: none; cursor: pointer; color: var(--text-3); padding: 4px; border-radius: 4px; }
.cpb-prop-header button:hover { background: #fff; color: var(--text-1); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.cpb-prop-body { flex: 1; display:flex; flex-direction: column; }
.cpb-btn-secondary { background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2); display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); border-color: var(--text-3); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.scroll-y { overflow-y: auto; }
</style>
