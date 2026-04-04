<template>
  <div class="cpb-left" :class="{ 'cpb-left--collapsed': leftCollapsed }">
    <div style="background: var(--bg-1); border-bottom: 1px solid var(--border);">
      <LanguageTabs :modelValue="currentLang" @update:modelValue="$emit('update:currentLang', $event)" :fields="[]" :baseData="{}" />
    </div>
    <div class="cpb-sidebar-tabs">
      <button :class="{ active: leftTab === 'theme' }" @click="$emit('update:leftTab', 'theme')" title="Theme"><span>Theme</span></button>
      <button :class="{ active: leftTab === 'structure' }" @click="$emit('update:leftTab', 'structure')" title="Cấu trúc"><span>Cấu trúc</span></button>
      <button :class="{ active: leftTab === 'pages' }" @click="$emit('update:leftTab', 'pages')" title="Trang"><span>Trang</span></button>
    </div>

    <div class="cpb-sidebar-content">
      <!-- THEME TAB -->
      <div v-show="leftTab === 'theme'" class="side-pad scroll-y">
        <LayoutThemeConfig :modelValue="themeConfig" @update:modelValue="$emit('update:themeConfig', $event)" :active-page-id="activePageId" />

        <!-- Per-Page Theme Config -->
        <div class="lb-section" style="margin-top: 16px;" v-if="activePageId && !String(activePageId).startsWith('__template_')">
          <h4 class="lb-section__title"><Palette :size="14" /> Cài đặt riêng cho trang này</h4>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 12px; line-height: 1.4;">Bạn có thể chỉ định màu nền riêng cho <b>{{ activePageLabel }}</b> để ghi đè (override) khai báo màu nền chung của hệ thống.</p>

          <div class="param-row" style="flex-direction: column; align-items: stretch; gap: 6px;">
            <label>Màu nền trang</label>
            <div class="color-picker-wrapper" style="display:flex; align-items:center; gap:8px;">
              <input type="color" :value="currentPageBg" @input="$emit('update:currentPageBg', $event.target.value)" class="param-color" style="width:28px; height:28px; border:1px solid #cbd5e1; border-radius:4px; padding:0; background:none; cursor:pointer;" />
              <input type="text" :value="currentPageBg" @input="$emit('update:currentPageBg', $event.target.value)" class="param-input param-input--sm" style="flex:1" placeholder="Bỏ trống..." />
              <button v-if="currentPageBg" @click="$emit('update:currentPageBg', '')" class="btn-clear-color" title="Xóa" style="width: 24px; height: 24px; border:none; background:#f1f5f9; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#ef4444; transition: 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#f1f5f9'">
                <X :size="12" />
              </button>
            </div>
          </div>
        </div>

        <!-- Templates (Only show on Global page) -->
        <div class="lb-section" style="margin-top: 16px;" v-if="!activePageId">
          <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục</h4>
          <div class="template-grid">
            <button v-for="tpl in templates" :key="tpl.key" class="template-card" :class="{ active: activeTemplate === tpl.key }" @click="$emit('apply-template', tpl.key)">
              <component :is="tpl.icon" :size="20" />
              <span class="template-card__name">{{ tpl.name }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- STRUCTURE TAB -->
      <div v-show="leftTab === 'structure'" class="side-pad scroll-y">
        <div class="cpb-layers">
          <!-- Global Site Blocks -->
          <div v-if="!activePageId">
            <div class="cpb-layer-item" :class="{ active: activeConfig === 'promo' }" @click="$emit('update:activeConfig', 'promo')" title="Cấu hình Promo Bar">
              <div class="cpb-layer-content"><Megaphone :size="14" /> Promo Bar</div>
            </div>
            <div class="cpb-layer-item" :class="{ active: activeConfig === 'header' }" @click="$emit('update:activeConfig', 'header')" title="Cấu hình Header">
              <div class="cpb-layer-content"><PanelTop :size="14" /> Header</div>
            </div>
          </div>

          <!-- Main Body Content -->
          <div class="cpb-layer-separator">Nội dung {{ activePageLabel }}</div>

          <div class="cpb-layer-switch">
            <button :class="{ active: activeSidebarTab === 'elements' }" @click="$emit('update:activeSidebarTab', 'elements')" title="Quản lý các khối nội dung (Sections)">Section</button>
            <button :class="{ active: activeSidebarTab === 'navigator' }" @click="$emit('update:activeSidebarTab', 'navigator')" title="Xem cấu trúc các lớp (Layers)">Layers</button>
          </div>

          <LayoutSectionManager
            v-if="activeSidebarTab === 'elements'"
            :sections="sections"
            @update:sections="$emit('update:sections', $event)"
            :section-meta="sectionMeta"
            :all-categories="allCategories"
            @open-block-editor="s => $emit('open-block-editor', s)"
            @active-change="id => $emit('update:activeConfig', id)"
          />
          <LayoutNavigator
            v-if="activeSidebarTab === 'navigator'"
            :sections="sections"
            :expanded-section="expandedSection"
            @select-node="n => $emit('navigator-select', n)"
          />

          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <button class="cpb-btn-add" style="flex: 1;" @click="$emit('update:activeConfig', 'library')"><Plus :size="14"/> Thêm section</button>
            <div style="display: flex; gap: 4px;">
              <button class="cpb-btn-add" style="padding: 0 10px; background: rgba(99,102,241,0.1); color: #6366f1" title="Export JSON" @click="$emit('export-json')"><Download :size="14"/></button>
              <button class="cpb-btn-add" style="padding: 0 10px; background: rgba(99,102,241,0.1); color: #6366f1" title="Import JSON" @click="$emit('trigger-json-import')"><Upload :size="14"/></button>
            </div>
          </div>

          <!-- Global Footer -->
          <div v-if="!activePageId" style="margin-top:8px">
            <div class="cpb-layer-item" :class="{ active: activeConfig === 'footer' }" @click="$emit('update:activeConfig', 'footer')" title="Cấu hình Footer">
              <div class="cpb-layer-content"><PanelBottom :size="14" /> Footer</div>
            </div>
          </div>

        </div>
      </div>

      <!-- PAGES TAB -->
      <div v-show="leftTab === 'pages'" class="side-pad scroll-y">
        <!-- Active Built-in Page Config (Trang cụ thể) -->
        <LayoutPageConfigs
          v-if="activeBuiltinPage"
          :page-configs="pageConfigs"
          :active-page-id="activePageId"
          @update:page-configs="v => $emit('update:pageConfigs', v)"
        />

        <hr v-if="activeBuiltinPage" />

        <LayoutPageManager
          :active-page-id="activePageId"
          @select-page="id => $emit('select-page', id)"
          @pages-updated="$emit('pages-updated')"
        />
      </div>
    </div>

    <button class="cpb-collapse-btn" @click="$emit('update:leftCollapsed', !leftCollapsed)" title="Đóng/Mở thanh công cụ (Sidebar)">
      <ChevronLeft :size="16" :style="{ transform: leftCollapsed ? 'rotate(180deg)' : 'rotate(0)' }" />
    </button>
  </div>
</template>

<script setup>
import { Palette, Megaphone, PanelTop, PanelBottom, Plus, Download, Upload, X, ChevronLeft } from 'lucide-vue-next'
import LanguageTabs from '../LanguageTabs.vue'
import LayoutThemeConfig from '../storefront/LayoutThemeConfig.vue'
import LayoutSectionManager from '../storefront/LayoutSectionManager.vue'
import LayoutNavigator from '../storefront/LayoutNavigator.vue'
import LayoutPageConfigs from '../storefront/LayoutPageConfigs.vue'
import LayoutPageManager from '../storefront/LayoutPageManager.vue'

defineProps({
  leftTab: { type: String, default: 'structure' },
  leftCollapsed: { type: Boolean, default: false },
  sections: { type: Array, default: () => [] },
  sectionMeta: { type: Object, default: () => ({}) },
  allCategories: { type: Array, default: () => [] },
  activeConfig: { default: null },
  activePageId: { default: null },
  activePageLabel: { type: String, default: '' },
  activeBuiltinPage: { default: null },
  activeSidebarTab: { type: String, default: 'elements' },
  expandedSection: { default: null },
  themeConfig: { type: Object, default: () => ({}) },
  templates: { type: Array, default: () => [] },
  activeTemplate: { type: String, default: '' },
  currentPageBg: { type: String, default: '' },
  currentLang: { type: String, default: 'vi' },
  pageConfigs: { type: Object, default: () => ({}) },
})

defineEmits([
  'update:leftTab',
  'update:leftCollapsed',
  'update:activeSidebarTab',
  'update:activeConfig',
  'update:currentLang',
  'update:themeConfig',
  'update:currentPageBg',
  'update:pageConfigs',
  'update:sections',
  'open-block-editor',
  'apply-template',
  'add-section',
  'export-json',
  'trigger-json-import',
  'navigator-select',
  'select-page',
  'pages-updated',
])
</script>

<style scoped>
/* Left Panel */
.cpb-left { width: 280px; background: #fff; border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.3s; position: relative; flex-shrink: 0; z-index: 5; }
.cpb-left:not(.cpb-left--collapsed) { overflow: visible; }
.cpb-left--collapsed { width: 0; border-right: none; overflow: hidden; }
.cpb-left--collapsed .cpb-collapse-btn { left: 0; border-radius: 0 8px 8px 0; border-left: none; }
.cpb-sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); overflow: hidden; }
.cpb-sidebar-tabs button { flex: 1; min-width: 0; padding: 12px 6px; background: transparent; border: none; font-size: 12px; font-weight: 600; color: var(--text-3); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; display: flex; align-items: center; justify-content: center; }
.cpb-sidebar-tabs button span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: inline-block; max-width: 100%; }
.cpb-sidebar-tabs button.active { color: var(--accent); border-bottom-color: var(--accent); }
.cpb-sidebar-tabs button:hover:not(.active) { color: var(--text-1); background: var(--bg-2); }
.cpb-sidebar-content { flex: 1; overflow: auto; display: flex; flex-direction: column; }
.side-pad { padding: 16px; }
.scroll-y { overflow-y: auto; }

/* Collapse Button */
.cpb-collapse-btn { position: absolute; right: -12px; top: 16px; width: 24px; height: 32px; background: #fff; border: 1px solid var(--border); border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-2); cursor: pointer; z-index: 10; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
.cpb-collapse-btn:hover { color: var(--accent); border-color: var(--accent); }

/* Layers */
.cpb-layers { display: flex; flex-direction: column; gap: 4px; }
.cpb-layer-item { padding: 10px 12px; border-radius: 6px; background: var(--bg-2); border: 1px solid transparent; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.cpb-layer-content { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--text-1); }
.cpb-layer-item:hover { border-color: var(--border); background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
.cpb-layer-item.active { border-color: var(--accent); background: rgba(124, 58, 237, 0.05); color: var(--accent); }
.cpb-layer-item.active .cpb-layer-content { color: var(--accent); font-weight: 600; }
.cpb-layer-separator { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-3); margin: 16px 0 8px; }
.cpb-layer-switch { display: flex; background: var(--bg-2); border-radius: 6px; padding: 4px; margin-bottom: 12px; }
.cpb-layer-switch button { flex: 1; border: none; background: transparent; padding: 6px; font-size: 12px; font-weight: 600; color: var(--text-2); border-radius: 4px; cursor: pointer; }
.cpb-layer-switch button.active { background: #fff; color: var(--accent); box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
.cpb-btn-add { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; border: 1px dashed var(--border); background: transparent; padding: 10px; border-radius: 6px; color: var(--accent); font-weight: 600; cursor: pointer; margin-top: 12px; transition: 0.2s; }
.cpb-btn-add:hover { background: rgba(124, 58, 237, 0.05); border-color: var(--accent); }

/* Templates Grid */
.template-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
.template-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border-radius: 12px; border: 2px solid var(--border); background: #fff; cursor: pointer; transition: all 0.2s; color: var(--text-2); text-align: center; }
.template-card:hover { border-color: var(--accent); color: var(--text-1); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.template-card.active { border-color: var(--accent); background: rgba(124,58,237,0.05); color: var(--accent); }
.template-card__name { font-size: 12px; font-weight: 700; }
</style>
