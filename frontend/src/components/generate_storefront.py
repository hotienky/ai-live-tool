import re

with open("StorefrontLayoutBuilder.vue", "r") as f:
    original = f.read()

# Match the <script setup> block exactly
script_match = re.search(r'(<script setup>.*?</script>)', original, re.DOTALL)
script_content = script_match.group(1) if script_match else ''

# Create the new template Content
template_content = """<template>
  <div class="cpb">
    <!-- Header Toolbar -->
    <header class="cpb-header">
      <div class="cpb-header__left">
        <!-- Page Picker -->
        <div class="cpb-page-picker" tabindex="-1" @focusout="handlePickerFocusout">
          <button class="cpb-page-btn" @click="pageDropdownOpen = !pageDropdownOpen">
            <component :is="activePage.icon" :size="14" />
            <span>{{ activePageLabel }}</span>
            <ChevronDown :size="12" :style="{ transform: pageDropdownOpen ? 'rotate(180deg)' : 'rotate(0)' }" />
          </button>
          
          <div v-if="pageDropdownOpen" class="cpb-page-menu">
            <button class="cpb-page-item" :class="{ active: activePageId === null }" @click="selectPage(null)">
              <Home :size="14" /> Trang Chủ (Global)
            </button>
            <div class="cpb-page-group">Trang hệ thống</div>
            <button v-for="pg in builtinPageOptions" :key="pg.id" class="cpb-page-item" :class="{ active: activePageId === pg.id }" @click="selectPage(pg.id)">
              <component :is="pg.icon" :size="14" /> <span>{{ pg.label }}</span>
            </button>
            <template v-if="dynamicPages.length">
              <div class="cpb-page-group">Trang CMS động</div>
              <button v-for="p in dynamicPages" :key="p.id" class="cpb-page-item" :class="{ active: activePageId === p.id }" @click="selectPage(p.id)">
                <FileText :size="14" /> {{ p.title }}
              </button>
            </template>
          </div>
        </div>
        
        <span v-if="layoutPageVersion" class="cpb-status-badge" :class="'cpb-status-badge--' + layoutPageStatus">
          v{{ layoutPageVersion }} · {{ layoutPageStatus === 'published' ? 'Published' : 'Draft' }}
        </span>
      </div>

      <div class="cpb-header__center">
        <div class="cpb-viewport">
          <button :class="{ active: previewWidth === '100%' }" @click="previewWidth = '100%'" title="Desktop"><Monitor :size="16" /></button>
          <button :class="{ active: previewWidth === '768px' }" @click="previewWidth = '768px'" title="Tablet"><Tablet :size="16" /></button>
          <button :class="{ active: previewWidth === '400px' }" @click="previewWidth = '400px'" title="Mobile"><Smartphone :size="16" /></button>
          <button @click="previewMode = previewMode === 'wireframe' ? 'live' : 'wireframe'" style="margin-left: 8px;" :title="previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe'">
            <Eye v-if="previewMode === 'wireframe'" :size="16" />
            <Aperture v-else :size="16" />
          </button>
        </div>
      </div>

      <div class="cpb-header__right">
        <div class="cpb-history">
          <button @click="undo" :disabled="undoStack.length <= 1" title="Hoàn tác"><Undo2 :size="14" /></button>
          <button @click="redo" :disabled="redoStack.length === 0" title="Làm lại"><Redo2 :size="14" /></button>
        </div>
        
        <span class="cpb-save-status">
          <span v-if="saving" class="status-saving"><Loader2 :size="12" class="spin"/> Lưu...</span>
          <span v-else class="status-saved">✅ Đã lưu</span>
        </span>

        <button class="cpb-btn-secondary" @click="showCustomCss = true"><Code :size="14" /> CSS</button>
        <button class="cpb-btn-secondary" @click="saveDraft" :disabled="saving">Nháp</button>
        <button class="cpb-btn-save" @click="handlePublish" :disabled="saving">Xuất bản</button>
      </div>
    </header>

    <div class="cpb-body">
      <!-- LEFT SIDEBAR -->
      <div class="cpb-left" :class="{ 'cpb-left--collapsed': leftCollapsed }">
        <div class="cpb-sidebar-tabs">
          <button :class="{ active: leftTab === 'theme' }" @click="leftTab = 'theme'">Theme</button>
          <button :class="{ active: leftTab === 'structure' }" @click="leftTab = 'structure'">Cấu trúc</button>
          <button :class="{ active: leftTab === 'pages' }" @click="leftTab = 'pages'">Trang</button>
        </div>

        <div class="cpb-sidebar-content">
          <!-- THEME TAB -->
          <div v-show="leftTab === 'theme'" class="side-pad scroll-y">
            <LayoutThemeConfig v-model="themeConfig" />
            
            <!-- Templates (Only show on Global page) -->
            <div class="lb-section" style="margin-top: 16px;" v-if="!activePageId">
              <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục</h4>
              <div class="template-grid">
                <button v-for="tpl in templates" :key="tpl.key" class="template-card" :class="{ active: activeTemplate === tpl.key }" @click="applyTemplate(tpl.key)">
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
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'promo' }" @click="activeConfig = 'promo'">
                  <div class="cpb-layer-content"><Megaphone :size="14" /> Promo Bar</div>
                </div>
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'header' }" @click="activeConfig = 'header'">
                  <div class="cpb-layer-content"><PanelTop :size="14" /> Header</div>
                </div>
              </div>

              <!-- Main Body Content -->
              <div class="cpb-layer-separator">Nội dung trang {{ activePageLabel }}</div>

              <div class="cpb-layer-switch">
                <button :class="{ active: activeSidebarTab === 'elements' }" @click="activeSidebarTab = 'elements'">Section</button>
                <button :class="{ active: activeSidebarTab === 'navigator' }" @click="activeSidebarTab = 'navigator'">Layers</button>
              </div>
              
              <LayoutSectionManager
                v-if="activeSidebarTab === 'elements'"
                v-model:sections="sections"
                :section-meta="sectionMeta"
                :all-categories="allCategories"
                @open-block-editor="s => showBlockEditorFor = s"
                @active-change="id => activeConfig = id"
              />
              <LayoutNavigator
                v-if="activeSidebarTab === 'navigator'"
                :sections="sections"
                :expanded-section="expandedSection"
                @select-node="handleNavigatorSelect"
              />

              <button class="cpb-btn-add" @click="showLibrary = true"><Plus :size="14"/> Thêm section</button>

              <!-- Global Footer -->
              <div v-if="!activePageId" style="margin-top:8px">
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'footer' }" @click="activeConfig = 'footer'">
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
              @update:page-configs="v => pageConfigs = v"
            />
            
            <hr v-if="activeBuiltinPage" />
            
            <LayoutPageManager
              :active-page-id="activePageId"
              @select-page="selectPage"
              @pages-updated="loadDynamicPages"
            />
          </div>
        </div>

        <button class="cpb-collapse-btn" @click="leftCollapsed = !leftCollapsed">
          <ChevronLeft :size="16" :style="{ transform: leftCollapsed ? 'rotate(180deg)' : 'rotate(0)' }" />
        </button>
      </div>

      <!-- CENTER CANVAS -->
      <div class="cpb-center">
        <div class="cpb-canvas-wrap" :style="{ maxWidth: previewWidth }">
          <LayoutPreviewPanel
            ref="previewPanelRef"
            :preview-mode="previewMode"
            :preview-width="previewWidth"
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

      <!-- RIGHT PANEL (Properties) -->
      <div class="cpb-right" :class="{ 'cpb-right--open': activeConfig }">
        <div v-if="activeConfig" class="cpb-prop-header">
          <h4>{{ rightPanelTitle }}</h4>
          <button @click="activeConfig = null"><X :size="14"/></button>
        </div>
        
        <div class="cpb-prop-body scroll-y" style="padding: 16px;">
          <!-- Header Config -->
          <LayoutHeaderConfig v-if="activeConfig === 'header'" :header-config="headerConfig" :active-page-id="activePageId" @update:header-config="v => headerConfig = v" />
          
          <!-- Footer Config -->
          <LayoutFooterConfig v-else-if="activeConfig === 'footer'" :footer-config="footerConfig" :active-page-id="activePageId" @update:footer-config="v => footerConfig = v" />
          
          <!-- Promo Config -->
          <div v-else-if="activeConfig === 'promo'">
            <label class="toggle-row">
              <input type="checkbox" v-model="promoConfig.enabled" />
              <span>Hiển thị thanh thông báo (Promo Bar)</span>
            </label>
            <div class="form-group" v-if="promoConfig.enabled" style="margin-top: 12px">
              <label>Nội dung</label>
              <input v-model="promoConfig.text" class="param-input" placeholder="Miễn phí vận chuyển..." />
            </div>
            <div class="form-group" v-if="promoConfig.enabled" style="margin-top: 12px">
              <label>Link trỏ tới</label>
              <input v-model="promoConfig.link" class="param-input" placeholder="/products" />
            </div>
            <div class="form-group" v-if="promoConfig.enabled" style="margin-top: 12px">
              <label>Tên Nút (CTA Text)</label>
              <input v-model="promoConfig.ctaText" class="param-input" placeholder="Mua ngay" />
            </div>
          </div>
          
          <!-- Section Config -->
          <StyleControlPanel v-else-if="String(activeConfig).startsWith('section-')" :sectionId="activeConfig" />

        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Custom CSS Modal -->
    <div class="media-modal-overlay" v-if="showCustomCss" @click.self="showCustomCss = false">
      <div class="media-modal" style="width: 600px; height: 400px; border-radius: 8px;">
        <div class="media-modal-header">
          <h3><Code :size="16" /> CSS tùy chỉnh</h3>
          <button @click="showCustomCss = false"><X :size="20" /></button>
        </div>
        <div style="padding: 16px; flex: 1; display:flex">
          <textarea v-model="customCss" style="flex:1; width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 13px;" placeholder="/* Custom CSS cho layout này */&#10;.my-class { }"></textarea>
        </div>
        <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
          <button class="cpb-btn-save" @click="showCustomCss = false">Xong</button>
        </div>
      </div>
    </div>

    <!-- Section Library -->
    <div class="modal-overlay" v-if="showLibrary" @click.self="showLibrary = false">
      <div class="modal modal--library">
        <div class="modal__header">
          <h3><Layers :size="16" /> Thêm Section</h3>
          <button class="btn-close" @click="showLibrary = false"><X :size="18" /></button>
        </div>
        <div class="library-grouped">
          <div v-for="(items, category) in groupedLibraryItems" :key="category" class="library-group">
            <h4 class="library-group__title">{{ category }}</h4>
            <div class="library-grid">
              <button
                v-for="lib in items"
                :key="lib.type"
                class="library-card"
                :class="{ added: sections.some(s => s.type === lib.type), 'library-card--disabled': !lib.available }"
                @click="lib.available ? addLibrarySection(lib) : null"
                :disabled="!lib.available"
              >
                <span class="library-card__icon"><component :is="sectionIconMap[lib.icon] || Box" :size="22" /></span>
                <strong>{{ lib.label }}</strong>
                <span class="library-card__desc">{{ lib.description }}</span>
                <span v-if="sections.some(s => s.type === lib.type)" class="library-card__badge">Đã thêm</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Publish Note Dialog -->
    <div v-if="showPublishDialog" class="media-modal-overlay" @click.self="showPublishDialog = false">
      <div class="media-modal" style="width: 440px; border-radius: 12px;">
        <div class="media-modal-header">
          <h3><Package :size="16" /> Xuất bản layout</h3>
          <button @click="showPublishDialog = false"><X :size="20" /></button>
        </div>
        <div style="padding: 20px;">
          <p style="margin: 0 0 12px; font-size: 13px; color: var(--text-2);">Ghi chú cho lần publish này (tuỳ chọn)</p>
          <input v-model="publishNote" class="param-input" placeholder="VD: Cập nhật banner Tết, thêm section FAQ..." @keyup.enter="confirmPublish" />
        </div>
        <div style="padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
          <button class="cpb-btn-secondary" @click="showPublishDialog = false">Huỷ</button>
          <button class="cpb-btn-save" @click="confirmPublish" :disabled="saving">
            <Save :size="14" /> {{ saving ? 'Đang lưu...' : 'Xuất bản' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Version History Flyout -->
    <LayoutVersionHistory
      :visible="showVersionHistory"
      :layout-page-id="layoutPageId"
      :current-version="layoutPageVersion"
      :current-status="layoutPageStatus"
      @close="showVersionHistory = false"
      @rollback="onRollback"
    />

    <MediaPicker ref="globalImagePicker" style="display: none" :modelValue="''" @update:modelValue="onGlobalImagePicked" />
  </div>
</template>
"""

# Now the style content
style_content = """
<style scoped>
.cpb { display: flex; flex-direction: column; height: 100vh; background: var(--bg-1, #fcfcfc); overflow: hidden; outline: none; }
.cpb-header { display: flex; align-items: center; justify-content: space-between; height: 52px; padding: 0 16px; background: #fff; border-bottom: 1px solid var(--border, #e5e7eb); z-index: 10; font-size: 13px; }
.cpb-header__left, .cpb-header__center, .cpb-header__right { display: flex; align-items: center; gap: 12px; }
.cpb-header__left { flex: 1; min-width: 0; }
.cpb-header__center { flex: 1; justify-content: center; }
.cpb-header__right { flex: 1; justify-content: flex-end; align-items: center; }

/* Page Picker */
.cpb-page-picker { position: relative; }
.cpb-page-btn { display: flex; align-items: center; gap: 6px; background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-weight: 600; cursor: pointer; color: var(--text-1); transition: 0.2s; }
.cpb-page-btn:hover { background: #fff; border-color: var(--text-3); }
.cpb-page-menu { position: absolute; top: calc(100% + 4px); left: 0; background: #fff; border: 1px solid var(--border); border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 220px; max-height: 400px; overflow-y: auto; z-index: 100; padding: 6px; }
.cpb-page-item { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; background: none; border: none; padding: 8px 10px; border-radius: 4px; cursor: pointer; color: var(--text-2); font-size: 13px; font-weight: 500;}
.cpb-page-item:hover { background: var(--bg-2, #f3f4f6); color: var(--text-1); }
.cpb-page-item.active { background: rgba(124, 58, 237, 0.1); color: var(--accent); font-weight: 600; }
.cpb-page-group { padding: 8px 10px 4px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; border-top: 1px solid var(--border); margin-top: 4px; }

/* Global Toolbar Elements */
.cpb-viewport { display: flex; background: var(--bg-2); padding: 4px; border-radius: 8px; border: 1px solid var(--border); }
.cpb-viewport button { background: transparent; border: none; width: 32px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-3); border-radius: 4px; cursor: pointer; transition: 0.2s; }
.cpb-viewport button.active { background: #fff; color: var(--accent, #7c3aed); box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.cpb-history { display: flex; gap: 4px; border-right: 1px solid var(--border); padding-right: 12px; }
.cpb-history button { background: transparent; border: none; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-2); border-radius: 4px; cursor: pointer; }
.cpb-history button:hover:not(:disabled) { background: var(--bg-2); }
.cpb-history button:disabled { opacity: 0.3; cursor: not-allowed; }

.cpb-save-status { font-size: 11px; font-weight: 600; min-width: 70px; text-align: right; }
.status-saved { color: #10b981; display: inline-flex; align-items: center; gap: 4px; }
.status-saving { color: #3b82f6; display: inline-flex; align-items: center; gap: 4px; }

.cpb-btn-secondary { background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2); display: flex; align-items: center; gap: 6px; transition: 0.2s; }
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); }
.cpb-btn-save { background: var(--accent, #7c3aed); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }

/* Status badge */
.cpb-status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
.cpb-status-badge--published { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.cpb-status-badge--draft { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

/* Body Area */
.cpb-body { display: flex; flex: 1; overflow: hidden; position: relative; }

/* Left Panel */
.cpb-left { width: 300px; background: #fff; border-right: 1px solid var(--border); display: flex; flex-direction: column; transition: width 0.3s; position: relative; flex-shrink: 0; z-index: 5; }
.cpb-left--collapsed { width: 0; border-right: none; }
.cpb-left--collapsed .cpb-collapse-btn { left: 0; border-radius: 0 8px 8px 0; border-left: none; }
.cpb-sidebar-tabs { display: flex; border-bottom: 1px solid var(--border); }
.cpb-sidebar-tabs button { flex: 1; padding: 12px 0; background: transparent; border: none; font-size: 13px; font-weight: 600; color: var(--text-3); cursor: pointer; border-bottom: 2px solid transparent; transition: 0.2s; }
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

/* Center Canvas */
.cpb-center { flex: 1; background: var(--bg-2, #f3f4f6); overflow-y: auto; display: flex; flex-direction: column; align-items: center; transition: padding 0.3s; }
.cpb-canvas-wrap { width: 100%; min-height: 100%; background: transparent; display: flex; flex-direction: column; transition: max-width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-sizing: border-box; }

/* Right Panel */
.cpb-right { width: 340px; background: #fff; border-left: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1); flex-shrink: 0; z-index: 5; }
.cpb-right:not(.cpb-right--open) { transform: translateX(100%); position: absolute; right: 0; height: 100%; }
.cpb-prop-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); background: var(--bg-2); }
.cpb-prop-header h4 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-1); }
.cpb-prop-header button { background: none; border: none; cursor: pointer; color: var(--text-3); padding: 4px; border-radius: 4px; }
.cpb-prop-header button:hover { background: #fff; color: var(--text-1); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.cpb-prop-body { flex: 1; display:flex; flex-direction: column; }

/* Shared forms */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: 12px; font-weight: 600; color: var(--text-2); }
.param-input { width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px; outline: none; transition: 0.2s; }
.param-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(124,58,237,0.1); }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-1); }

/* Modals */
.modal-overlay, .media-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(2px); }
.media-modal { background: #fff; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
.media-modal-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.media-modal-header h3 { margin: 0; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 700; color: var(--text-1); }
.media-modal-header button { background: none; border: none; cursor: pointer; color: var(--text-3); }
.media-modal-header button:hover { color: var(--text-1); }

/* Library Styles */
.modal--library { background: #fff; border-radius: 12px; width: 85vw; max-width: 1000px; height: 80vh; max-height: 800px; display: flex; flex-direction: column; }
.modal__header { padding: 16px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
.modal__header h3 { margin: 0; font-size: 16px; display:flex; align-items: center; gap: 8px; font-weight: 800;}
.library-grouped { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 32px; background: var(--bg-1); }
.library-group__title { margin: 0 0 16px; font-size: 15px; font-weight: 700; color: var(--text-1); padding-bottom: 8px; border-bottom: 2px solid var(--bg-2); }
.library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; }
.library-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; cursor: pointer; outline: none; position: relative; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.library-card:hover:not(.library-card--disabled) { border-color: var(--accent); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.library-card__icon { color: var(--accent); opacity: 0.8; }
.library-card strong { font-size: 13px; color: var(--text-1); }
.library-card__desc { font-size: 11px; color: var(--text-3); line-height: 1.4; }
.library-card.added { border-color: var(--accent); background: rgba(124,58,237,0.03); opacity: 0.7; }
.library-card__badge { position: absolute; top: -8px; right: -8px; font-size: 10px; font-weight: 700; background: var(--accent); color: #fff; padding: 2px 6px; border-radius: 12px; }
.library-card--disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }
.btn-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-3); }

/* Utilities */
.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>
"""

script_patch = """
const leftTab = ref('structure')
const leftCollapsed = ref(false)
const activeConfig = ref(null)
const showCustomCss = ref(false)

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
  if (String(activeConfig.value).startsWith('section-')) return 'Section'
  return 'Tùy chỉnh'
})

const rightPanelTitle = activeConfigName

function onPreviewOpenConfig({ type, targetObj }) {
  if (type === 'header') activeConfig.value = 'header'
  else if (type === 'footer') activeConfig.value = 'footer'
  else if (type === 'promo') activeConfig.value = 'promo'
  else if (type === 'section') activeConfig.value = 'section-' + targetObj.id
}
"""

# Inject this inside script content
final_script = script_content.replace('function onPreviewOpenConfig({ type }) {', '// Replaced by generator')

if "const promoOpen = ref(false)" in final_script:
    final_script = final_script.replace('const promoOpen = ref(false)', 'const promoOpen = ref(false)\n' + script_patch)
else:
    # Append at the end before </script>
    final_script = final_script.replace('</script>', script_patch + '\n</script>')

with open("StorefrontLayoutBuilderUpdated.vue", "w") as fw:
    fw.write(template_content)
    fw.write("\\n")
    fw.write(final_script)
    fw.write("\\n")
    fw.write(style_content)

print("Generated StorefrontLayoutBuilderUpdated.vue successfully!")
