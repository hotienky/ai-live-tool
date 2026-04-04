<template>
  <div class="cpb" :class="{ 'cpb--fullscreen': isFullscreen, 'cpb--zen': isFullscreen && leftCollapsed }">
    <!-- Header Toolbar -->
    <BuilderHeader
      :active-page-id="activePageId"
      :active-page-label="activePageLabel"
      :active-page="activePage"
      :builtin-page-options="builtinPageOptions"
      :dynamic-pages="dynamicPages"
      :page-dropdown-open="pageDropdownOpen"
      :layout-page-version="layoutPageVersion"
      :layout-page-status="layoutPageStatus"
      :preview-width="previewWidth"
      :preview-mode="previewMode"
      :is-x-ray-mode="isXRayMode"
      :undo-stack="undoStack"
      :redo-stack="redoStack"
      :history-dropdown-open="historyDropdownOpen"
      :saving="saving"
      :left-collapsed="leftCollapsed"
      :is-fullscreen="isFullscreen"
      :is-zen="isFullscreen && leftCollapsed"
      @update:page-dropdown-open="pageDropdownOpen = $event"
      @update:history-dropdown-open="historyDropdownOpen = $event"
      @update:preview-width="previewWidth = $event"
      @update:preview-mode="previewMode = $event"
      @update:is-fullscreen="isFullscreen = $event"
      @select-page="selectPage"
      @undo="undo"
      @redo="redo"
      @restore-history="restoreHistory"
      @toggle-zen="toggleZenMode"
      @toggle-xray="toggleXRay"
      @start-tour="startTour"
      @show-custom-css="showCustomCss = true"
      @show-seo-settings="showSeoSettings = true"
      @save-draft="saveDraft"
      @publish="handlePublish"
      @show-version-history="showVersionHistory = true"
    />

    <div class="cpb-body">
      <!-- LEFT SIDEBAR -->
      <BuilderLeftSidebar
        :left-tab="leftTab"
        :left-collapsed="leftCollapsed"
        :sections="sections"
        :section-meta="sectionMeta"
        :all-categories="allCategories"
        :active-config="activeConfig"
        :active-page-id="activePageId"
        :active-page-label="activePageLabel"
        :active-builtin-page="activeBuiltinPage"
        :active-sidebar-tab="activeSidebarTab"
        :expanded-section="expandedSection"
        :theme-config="themeConfig"
        :templates="templates"
        :active-template="activeTemplate"
        :current-page-bg="currentPageBg"
        :current-lang="currentLang"
        :page-configs="pageConfigs"
        @update:left-tab="leftTab = $event"
        @update:left-collapsed="leftCollapsed = $event"
        @update:active-sidebar-tab="activeSidebarTab = $event"
        @update:active-config="activeConfig = $event"
        @update:current-lang="currentLang = $event"
        @update:theme-config="themeConfig = $event"
        @update:current-page-bg="currentPageBg = $event"
        @update:page-configs="pageConfigs = $event"
        @update:sections="sections = $event"
        @open-block-editor="s => showBlockEditorFor = s"
        @apply-template="applyTemplate"
        @export-json="exportJson"
        @trigger-json-import="triggerJsonImport"
        @navigator-select="handleNavigatorSelect"
        @select-page="selectPage"
        @pages-updated="loadDynamicPages"
      />
      <!-- hidden file input for JSON import -->
      <input type="file" ref="jsonInputRef" accept=".json" style="display:none" @change="onJsonImportFile" />

      <!-- CENTER CANVAS -->
      <div class="cpb-center">
        <div class="cpb-canvas-wrap" :style="{ maxWidth: previewWidth }">
          <LayoutPreviewPanel
            ref="previewPanelRef"
            :preview-mode="previewMode"
            :preview-width="previewWidth"
            @update:preview-width="val => previewWidth = val"
            :preview-key="previewKey"
            v-model:storefront-url="storefrontUrl"
            :live-preview-base-url="livePreviewBaseUrl"
            :pages="pages"
            :active-builtin-page="activeBuiltinPage"
            :active-page-id="activePageId"
            :builtin-page-options="builtinPageOptions"
            :active-sections="activeSections"
            :section-meta="sectionMeta"
            :page-configs="pageConfigs"
            :footer-config="footerConfig"
            :header-config="headerConfig"
            :layout-payload="layoutPayload"
            @refresh-live="previewKey++"
            @section-selected="onPreviewSectionSelected"
            @section-hover="onPreviewSectionHover"
            @section-reorder="onPreviewSectionReorder"
            @inline-edit="onPreviewInlineEdit"
            @section-delete="onPreviewSectionDelete"
            @section-toggle="onPreviewSectionToggle"
            @add-section-at="onPreviewAddSectionAt"
            @open-config="onPreviewOpenConfig"
            @edit-image="onPreviewEditImage"
          />
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <BuilderRightPanel
        :active-config="activeConfig"
        :active-section-obj="activeSectionObj"
        :right-panel-title="rightPanelTitle"
        :header-config="headerConfig"
        :footer-config="footerConfig"
        :promo-config="promoConfig"
        :all-categories="allCategories"
        :active-page-id="activePageId"
        :grouped-library-items="groupedLibraryItems"
        :section-icon-map="sectionIconMap"
        :sections="sections"
        :templates="templates"
        :active-template="activeTemplate"
        @update:active-config="activeConfig = $event"
        @update:header-config="headerConfig = $event"
        @update:footer-config="footerConfig = $event"
        @update:promo-config="promoConfig = $event"
        @open-block-editor="s => showBlockEditorFor = s"
        @navigate-tab="tab => { activeConfig = null; $emit('navigate-tab', tab) }"
        @add-section="addLibrarySection"
        @apply-template="applyTemplate"
      />
    </div>

    <!-- Modals -->

    <!-- Custom CSS Modal -->
    <BuilderCustomCssModal
      v-model="showCustomCss"
      v-model:custom-css="customCss"
    />

    <!-- SEO Settings Dialog -->
    <BuilderSeoDialog
      v-model="showSeoSettings"
      :active-page-label="activePageLabel"
      :seo-config="currentSeoConfig"
      @save="saveSeoConfig"
    />

    <!-- Publish Note Dialog -->
    <BuilderPublishDialog
      v-model="showPublishDialog"
      v-model:publish-note="publishNote"
      v-model:publish-schedule="publishSchedule"
      :saving="saving"
      @confirm="confirmPublish"
    />

    <!-- Version History Flyout -->
    <LayoutVersionHistory
      :visible="showVersionHistory"
      :layout-page-id="layoutPageId"
      :current-version="layoutPageVersion"
      :current-status="layoutPageStatus"
      @close="showVersionHistory = false"
      @rollback="onRollback"
    />

    <!-- Zen Mode Floating Bar -->
    <BuilderZenBar
      :visible="isFullscreen && leftCollapsed"
      :preview-width="previewWidth"
      :saving="saving"
      :undo-stack="undoStack"
      :redo-stack="redoStack"
      @update:preview-width="previewWidth = $event"
      @undo="undo"
      @redo="redo"
      @publish="handlePublish"
      @toggle-zen="toggleZenMode"
    />


    <MediaPicker ref="globalImagePicker" style="display: none" :modelValue="''" @update:modelValue="onGlobalImagePicked" />

    <CommandPalette 
      :visible="showCommandPalette" 
      @update:visible="showCommandPalette = $event"
      :commands="builderCommands"
      @execute="executeCommand"
    />
  </div>
</template>

<script setup>
import { driver } from "driver.js"
import "driver.js/dist/driver.css"

// ====== TOUR GUIDE ======
function startTour() {
  const driverObj = driver({
    showProgress: true,
    steps: [
      { popover: { title: 'Chào mừng đến Mebifarm Builder 🚀', description: 'Đây là công cụ dàn trang (Page Builder) mượt mà và trực quan nhất. Hãy theo dõi các tính năng chính nhé!' } },
      { element: '.cpb-page-picker', popover: { title: '1. Quản lý Trang (Pages)', description: 'Chuyển đổi thiết kế cho Trang chủ, Giỏ hàng, Tài khoản hoặc tạo các trang CMS động.' } },
      { element: '.cpb-viewport', popover: { title: '2. Responsive & X-Ray', description: 'Chỉnh sửa giao diện trên Desktop/Tablet/Mobile. Bật nút (X) để quét khung xương HTML.' } },
      { element: '.cpb-history-container', popover: { title: '3. Lịch sử (Undo/Redo)', description: 'Bạn lỡ tay xoá nhầm? Đừng lo, mọi thao tác đều được lưu vết để dễ dàng phục hồi.' } },
      { element: 'button[title*="Lưu lại cấu hình"]', popover: { title: '4. Lưu & Xuất bản', description: 'Nơi lưu nháp và ra mắt giao diện thật cho Tenant.' } },
      { element: 'button[title*="Chế độ tập trung"]', popover: { title: '5. Chế độ Tập Trung (Zen Mode)', description: 'Ấn phím F hoặc nút này để mở rộng tối đa màn hình thiết kế, loại bỏ mọi bảng công cụ dư thừa.' } },
      { element: '.cpb-left', popover: { title: '6. Quản lý Theme & Layers', description: 'Cột trái chứa tuỳ chỉnh màu sắc Theme tổng thể, hoặc sơ đồ lớp (Layer Tree) của tất cả thành phần đang có.' } },
      { element: '.cpb-center', popover: { title: '7. Live Canvas (Khung xem trước)', description: 'Click vào chữ, ảnh hay khối bất kỳ trên Live Canvas này để bắt đầu chỉnh sửa tức thì.' } },
      { element: '.cpb-right', popover: { title: '8. Hub Inspector (Trạm Điều Khiển)', description: 'Mọi thao tác Thêm khối mới, Chọn Layout, hoặc hiển thị Bảng Tuỳ Chỉnh tham số đều diễn ra mượt mà tại cột này!' } },
      { popover: { title: 'Hoàn tất! Cùng bắt đầu.', description: 'Vọc vạch đã đời rồi nhớ Lưu Nháp hoặc Xuất Bản nhé. Chúc bạn tạo ra một giao diện tuyệt vời!' } }
    ]
  });
  driverObj.drive();
}

import { ref, computed, onMounted, watch, provide } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import LayoutPreviewPanel from './storefront/LayoutPreviewPanel.vue'
import LayoutVersionHistory from './storefront/LayoutVersionHistory.vue'
import CommandPalette from './storefront/CommandPalette.vue'
import BuilderHeader from './builder/BuilderHeader.vue'
import BuilderLeftSidebar from './builder/BuilderLeftSidebar.vue'
import BuilderRightPanel from './builder/BuilderRightPanel.vue'
import BuilderSeoDialog from './builder/BuilderSeoDialog.vue'
import BuilderCustomCssModal from './builder/BuilderCustomCssModal.vue'
import BuilderPublishDialog from './builder/BuilderPublishDialog.vue'
import BuilderZenBar from './builder/BuilderZenBar.vue'
import MediaPicker from './MediaPicker.vue'
import { BuilderRegistry } from '../lib/vue-visual-builder'
import { useToast } from '../composables/useToast.js'
import { Home, FileText } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import { sectionMeta as sectionMetaRegistry } from './storefront/sectionSchemas.js'
import { industryTemplates } from './storefront/templatePresets.js'
import { useLanguages } from '../composables/useLanguages.js'

import { useBuilderHistory } from '../composables/builder/useBuilderHistory.js'
import { useBuilderPreview } from '../composables/builder/useBuilderPreview.js'
import { useBuilderPersistence } from '../composables/builder/useBuilderPersistence.js'
import { useBuilderSections } from '../composables/builder/useBuilderSections.js'
import { useBuilderNavLinks } from '../composables/builder/useBuilderNavLinks.js'
import { useBuilderLayout } from '../composables/builder/useBuilderLayout.js'
import { useBuilderSeo } from '../composables/builder/useBuilderSeo.js'
import { useBuilderUI } from '../composables/builder/useBuilderUI.js'
import { createBuilderConstants } from '../composables/builder/useBuilderConstants.js'

Object.keys(sectionMetaRegistry).forEach(type => {
  BuilderRegistry.registerBlock(type, {
    label: sectionMetaRegistry[type].label,
    icon: sectionMetaRegistry[type].icon,
    category: sectionMetaRegistry[type].category || 'General',
    schema: []
  })
})

const showVisualBuilderPro = ref(false)
const isFullscreen = ref(false)
const { t, formatCurrency } = useI18n()
const {
  defaultHeaderConfig, defaultFooterConfig, defaultPromoConfig, defaultPageConfigs,
  sectionMeta, defaultParams, pageList, templates, builtinPageOptions
} = createBuilderConstants(t)
const { showToast } = useToast()

const { defaultLangCode, loadLanguages } = useLanguages()
loadLanguages()
const currentLang = ref(defaultLangCode.value || 'vi')
provide('currentLang', currentLang)

// ─── Core state ───
const sections = ref([])
const pages = ref({})
const customCss = ref('')
const themeConfig = ref({
  primaryColor: '#6366f1',
  accentColor: '#10b981',
  backgroundColor: '#f9fafb',
  textColor: '#1f2937',
  fontFamily: "'Inter', sans-serif",
  borderRadius: '8px'
})
const activeTemplate = ref('full_store')
const saving = ref(false)
const expandedSection = ref(null)
const previewMode = ref('live')
const previewWidth = ref('100%')
const previewKey = ref(0)
const storefrontUrl = ref(window.location.origin.replace('.cms.', '.'))
const expandedPageConfig = ref(null)
const promoOpen = ref(false)

const currentDevice = computed(() => {
  if (previewWidth.value === '375px') return 'mobile'
  if (previewWidth.value === '768px') return 'tablet'
  return 'desktop'
})
provide('previewDevice', currentDevice)

const isXRayMode = ref(false)
const showCommandPalette = ref(false)
const controlsCollapsed = ref(false)

const leftTab = ref('structure')
const leftCollapsed = ref(true)
const activeConfig = ref(null)
const showCustomCss = ref(false)

const activePageId = ref(null)
const activeSidebarTab = ref('elements')
const dynamicPages = ref([])
const pageDropdownOpen = ref(false)

const previewPanelRef = ref(null)

// ─── Defaults (from createBuilderConstants) ───
const headerConfig = ref({ ...defaultHeaderConfig })
const footerConfig = ref(JSON.parse(JSON.stringify(defaultFooterConfig)))
const promoConfig = ref({ ...defaultPromoConfig })
const pageConfigs = ref(JSON.parse(JSON.stringify(defaultPageConfigs)))

// ─── Builtin page computed ───
const activeBuiltinPage = computed(() => {
  if (typeof activePageId.value === 'string') {
    if (activePageId.value.startsWith('__template_')) return null
    if (activePageId.value.startsWith('__')) return activePageId.value.slice(2)
  }
  return null
})

const activeTemplatePage = computed(() => {
  if (typeof activePageId.value === 'string' && activePageId.value.startsWith('__template_')) {
    return activePageId.value.slice(11)
  }
  return null
})

// ─── Composables ───
const {
  undoStack,
  redoStack,
  historyDropdownOpen,
  handleHistoryFocusout,
  pushUndo,
  undo,
  redo,
  restoreHistory,
} = useBuilderHistory(
  { sections, pageConfigs, headerConfig, footerConfig, promoConfig },
  showToast
)

const activeSections = computed(() =>
  sections.value.filter(s => s.enabled).sort((a, b) => a.order - b.order)
)

const {
  addSectionAtInsertIndex,
  globalImagePicker,
  globalImagePickerTarget,
  onPreviewSectionSelected,
  onPreviewSectionHover,
  onPreviewSectionReorder,
  onPreviewInlineEdit,
  onPreviewSectionDelete,
  onPreviewSectionToggle,
  onPreviewAddSectionAt,
  onPreviewOpenConfig,
  onPreviewEditImage,
  onGlobalImagePicked,
  handleNavigatorSelect,
} = useBuilderPreview(
  { sections, activeSections, activeConfig, expandedSection, promoOpen, previewPanelRef, headerConfig, footerConfig },
  pushUndo,
  showToast,
  sectionMeta,
  t
)

const {
  layoutPageId,
  layoutPageVersion,
  layoutPageStatus,
  showVersionHistory,
  showPublishDialog,
  publishNote,
  publishSchedule,
  publishNoteInput,
  jsonInputRef,
  loadLayout,
  buildMeta,
  ensureLayoutPage,
  saveLayout,
  saveDraft,
  handlePublish,
  confirmPublish,
  onRollback,
  exportJson,
  triggerJsonImport,
  onJsonImportFile,
} = useBuilderPersistence(
  { sections, pages, customCss, themeConfig, pageConfigs, headerConfig, footerConfig, promoConfig, activeTemplate, activePageId, storefrontUrl, saving },
  { activeBuiltinPage, activeTemplatePage },
  apiFetch,
  showToast,
  t,
  pushUndo,
  defaultParams,
  defaultPageConfigs,
  defaultHeaderConfig,
  defaultFooterConfig,
  defaultPromoConfig
)

const {
  dragIndex,
  dragOverIndex,
  showLibrary,
  allCategories,
  showBlockEditorFor,
  showAiPanel,
  aiPrompt,
  aiLoading,
  addLibrarySection,
  applyTemplate,
  addContentItem,
  removeContentItem,
  toggleCategoryId,
  loadCategories,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  toggleExpand,
  generateLayout,
} = useBuilderSections(
  { sections, expandedSection, activeConfig, addSectionAtInsertIndex, activeTemplate },
  showToast,
  defaultParams,
  sectionMeta,
  t,
  pushUndo,
  industryTemplates
)

const {
  navLinks,
  collectionNavLinks,
  cmsPageList,
  showNavLinkModal,
  navLinkEditing,
  navLinkForm,
  pageSelectMode,
  fetchNavLinks,
  fetchCmsPageList,
  openCreateNavLink,
  openEditNavLink,
  saveNavLink,
  deleteNavLink,
} = useBuilderNavLinks(apiFetch, showToast, t)

// Computed: current active page display (icon + label)
const activePage = computed(() => {
  if (activePageId.value === null) return { icon: Home, label: t('admin.msg_af830e1f', 'Trang Chủ (Global)') }
  const builtin = builtinPageOptions.find(p => p.id === activePageId.value)
  if (builtin) return builtin
  const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
  if (dyn) return { icon: FileText, label: dyn.title }
  return { icon: Home, label: t('admin.msg_af830e1f', 'Trang Chủ (Global)') }
})

function selectPage(id) {
  activePageId.value = id
  pageDropdownOpen.value = false
  loadLayout()
}
function handlePickerFocusout(e) {
  const next = e.relatedTarget
  if (!e.currentTarget.contains(next)) pageDropdownOpen.value = false
}

watch(sections, () => pushUndo(), { deep: true })

// ── SEO ──
const {
  showSeoSettings,
  currentSeoConfig,
  saveSeoConfig,
} = useBuilderSeo(
  { activePageId, dynamicPages, pageConfigs },
  { activeBuiltinPage },
  apiFetch
)

// ── Layout helpers (footer drag, currentPageBg, livePreviewBaseUrl, layoutPayload) ──
const {
  allPaymentMethods,
  addFooterCol,
  removeFooterCol,
  footerDragIdx,
  footerDragOverIdx,
  footerItemDrag,
  onFooterDragStart,
  onFooterDragEnd,
  onFooterDragOver,
  onFooterDrop,
  onFooterItemDrop,
  onFooterContactDrop,
  currentPageBg,
  builtinPageLang,
  getPageConfigI18n,
  setPageConfigI18n,
  livePreviewBaseUrl,
  layoutPayload,
  footerPreviewStyle,
} = useBuilderLayout(
  { sections, pages, customCss, themeConfig, headerConfig, footerConfig, promoConfig, pageConfigs, activeTemplate, activePageId, storefrontUrl, dynamicPages },
  { activeBuiltinPage },
  pushUndo,
  t
)

// ── UI (keyboard shortcuts, zen mode, xray, commands, library items) ──
const {
  toggleZenMode,
  toggleXRay,
  builderCommands,
  executeCommand,
  groupedLibraryItems,
  sectionIconMap,
} = useBuilderUI(
  { leftCollapsed, isFullscreen, activeConfig, previewWidth, isXRayMode, showCommandPalette, previewPanelRef },
  { undo, redo, handlePublish }
)

const activeSectionObj = computed(() => {
  const id = activeConfig.value
  if (!id || id === 'header' || id === 'footer' || id === 'promo') return null
  return sections.value.find(s => s.id === id || s.type === id) || null
})

const activePageLabel = computed(() => {
  if (activePageId.value === null) return 'Trang Chủ (Global)'
  const builtin = builtinPageOptions.find(p => p.id === activePageId.value)
  if (builtin) return builtin.label
  const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
  if (dyn) return dyn.title
  return 'Page'
})

const activeConfigName = computed(() => {
  if (activeConfig.value === 'header') return 'Header'
  if (activeConfig.value === 'footer') return 'Footer'
  if (activeConfig.value === 'promo') return 'Promo Bar'
  if (activeSectionObj.value) {
    const meta = sectionMeta[activeSectionObj.value.type]
    return meta?.label || activeSectionObj.value.type
  }
  return 'Tùy chỉnh'
})

const rightPanelTitle = activeConfigName

async function loadDynamicPages() {
  try {
    const res = await apiFetch('/cms-pages')
    const data = await res.json()
    dynamicPages.value = (Array.isArray(data) ? data : (data.data || [])).filter(p => p.is_dynamic)
  } catch (e) {}
}

onMounted(() => { loadDynamicPages(); loadLayout(); loadCategories(); fetchNavLinks(); fetchCmsPageList() })
</script>\n
<style scoped>
.cpb { display: flex; flex-direction: column; height: calc(100vh - 140px); min-height: 600px; background: var(--bg-1, #fcfcfc); overflow: hidden; outline: none; border-radius: 8px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
.cpb--fullscreen { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; border-radius: 0; border: none; box-shadow: none; margin: 0; animation: cpb-fullscreen-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
@keyframes cpb-fullscreen-enter {
  0% { transform: scale(0.97) translateY(10px); opacity: 0; border-radius: 16px; }
  100% { transform: scale(1) translateY(0); opacity: 1; border-radius: 0; }
}

/* Body Area */
.cpb-body { display: flex; flex: 1; overflow: hidden; position: relative; }

/* Center Canvas */
.cpb-center { flex: 1; background: var(--bg-2, #f1f5f9); overflow-y: auto; display: flex; flex-direction: column; align-items: center; transition: padding 0.3s; }
.cpb-canvas-wrap { width: 100%; min-height: 100%; background: transparent; display: flex; flex-direction: column; transition: max-width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-sizing: border-box; padding: 24px; }

/* Modals */
.modal-overlay, .media-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.media-modal { background: #fff; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.media-modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.media-modal-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-1); }
.media-modal-header button { background: none; border: none; cursor: pointer; color: var(--text-3); }
.media-modal-header button:hover { color: var(--text-1); }

/* Zen Mode Floating Bar */
.zen-floating-bar {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px);
  z-index: 100001; opacity: 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}
.zen-floating-bar--visible {
  transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto;
}
.zen-actions {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 100px;
  box-shadow: 0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
}
.zen-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent;
  color: var(--text-2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.zen-btn:hover:not(:disabled) { background: #fff; color: var(--text-1); box-shadow: 0 8px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.zen-btn.active { background: #fff; color: var(--accent); box-shadow: 0 4px 12px rgba(124,58,237,0.15); }
.zen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.zen-divider { width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 4px; }
.zen-btn--publish {
  width: auto; padding: 0 16px; border-radius: 100px; gap: 6px; font-weight: 600; font-size: 13px;
  background: var(--accent); color: #fff; box-shadow: 0 4px 12px rgba(124,58,237,0.3);
}
.zen-btn--publish:hover:not(:disabled) { background: var(--accent); filter: brightness(1.1); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(124,58,237,0.4); }

/* Buttons used in modals */
.cpb-btn-secondary { background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2); display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); border-color: var(--text-3); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.cpb-btn-save { background: var(--accent, #7c3aed); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }
</style>
