<template>
  <div class="cpb" :class="{ 'cpb--fullscreen': isFullscreen, 'cpb--zen': isFullscreen && leftCollapsed }">
    <!-- Header Toolbar -->
    <header class="cpb-header">
      <div class="cpb-header__left">
        <!-- Page Picker -->
        <div class="cpb-page-picker" tabindex="-1" @focusout="handlePickerFocusout">
          <button class="cpb-page-btn" @click="pageDropdownOpen = !pageDropdownOpen" title="Chọn trang cần chỉnh sửa">
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
          <button :class="{ active: previewWidth === '375px' }" @click="previewWidth = '375px'" title="Mobile"><Smartphone :size="16" /></button>
          <button @click="previewMode = previewMode === 'wireframe' ? 'live' : 'wireframe'" style="margin-left: 8px;" :title="previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe'">
            <Eye v-if="previewMode === 'wireframe'" :size="16" />
            <Aperture v-else :size="16" />
          </button>
          <button @click="toggleXRay" :class="{ 'cpb-btn-icon--active': isXRayMode }" style="margin-left: 8px;" title="Chế độ quét khung xương (X)">
            <Scan :size="16" />
          </button>
        </div>
      </div>

      <div class="cpb-header__right">
        <div class="cpb-history cpb-history-container" @focusout="handleHistoryFocusout" tabindex="-1">
          <div class="cpb-history__btn-group">
            <button @click="undo" :disabled="undoStack.length <= 1" title="Hoàn tác"><Undo2 :size="14" /></button>
            <button @click="historyDropdownOpen = !historyDropdownOpen" :disabled="undoStack.length <= 1" class="history-dropdown-toggle" title="Xem lịch sử khôi phục"><ChevronDown :size="12" /></button>
          </div>
          <button @click="redo" :disabled="redoStack.length === 0" title="Làm lại"><Redo2 :size="14" /></button>
          
          <div v-if="historyDropdownOpen" class="history-dropdown-menu">
            <div class="history-dropdown-header">Lịch sử khôi phục</div>
            <div class="history-dropdown-list">
              <button v-for="(item, idx) in undoStack.slice().reverse()" :key="idx" class="history-dropdown-item" @click="restoreHistory(undoStack.length - 1 - idx)">
                <div class="history-dropdown-info">
                  <span class="history-time">{{ item.time }}</span>
                  <span class="history-label" :class="{'current-state': idx === 0}">{{ idx === 0 ? 'Hiện tại' : item.label }}</span>
                </div>
                <Check v-if="idx === 0" :size="14" class="history-current-icon" />
              </button>
            </div>
          </div>
        </div>
        
        <span class="cpb-save-status" style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
          <span v-if="saving" class="status-saving" title="Đang lưu dữ liệu..."><Loader2 :size="16" class="spin"/></span>
          <span v-else class="status-saved" title="Đã lưu mới nhất"><Check :size="16" style="color: #10b981;"/></span>
        </span>

        <button class="cpb-btn-secondary" @click="toggleZenMode" :title="leftCollapsed ? 'Hiển thị công cụ (F)' : 'Chế độ tập trung (F)'" :class="{ 'cpb-btn-secondary--active': leftCollapsed }">
          <Focus :size="14" />
        </button>
        <button class="cpb-btn-secondary" @click="isFullscreen = !isFullscreen" :title="isFullscreen ? 'Thu nhỏ (Esc)' : 'Toàn màn hình'">
          <Minimize v-if="isFullscreen" :size="14" />
          <Maximize v-else :size="14" />
        </button>
        <button class="cpb-btn-secondary" @click="startTour" title="Hướng dẫn sử dụng toàn tập Builder"><HelpCircle :size="14" /></button>
        <button class="cpb-btn-secondary" @click="showCustomCss = true" title="Tùy chỉnh CSS nâng cao toàn cục"><Code :size="14" /></button>
        <button class="cpb-btn-secondary" @click="saveDraft" :disabled="saving" title="Lưu nháp hiện trạng mà chưa áp dụng ngay"><Save :size="14" /> Nháp</button>
        <button class="cpb-btn-save" @click="handlePublish" :disabled="saving" title="Xuất bản cập nhật lên website live"><Package v-if="!saving" :size="14" /><Loader2 v-else class="spin" :size="14" /> Xuất bản</button>
      </div>
    </header>

    <div class="cpb-body">
      <!-- LEFT SIDEBAR -->
      <div class="cpb-left" :class="{ 'cpb-left--collapsed': leftCollapsed }">
        <div class="cpb-sidebar-tabs">
          <button :class="{ active: leftTab === 'theme' }" @click="leftTab = 'theme'" title="Theme"><span>Theme</span></button>
          <button :class="{ active: leftTab === 'structure' }" @click="leftTab = 'structure'" title="Cấu trúc"><span>Cấu trúc</span></button>
          <button :class="{ active: leftTab === 'pages' }" @click="leftTab = 'pages'" title="Trang"><span>Trang</span></button>
        </div>

        <div class="cpb-sidebar-content">
          <!-- THEME TAB -->
          <div v-show="leftTab === 'theme'" class="side-pad scroll-y">
            <LayoutThemeConfig v-model="themeConfig" :active-page-id="activePageId" />
            
            <!-- Per-Page Theme Config -->
            <div class="lb-section" style="margin-top: 16px;" v-if="activePageId && !String(activePageId).startsWith('__template_')">
              <h4 class="lb-section__title"><Palette :size="14" /> Cài đặt riêng cho trang này</h4>
              <p style="font-size: 11px; color: #64748b; margin-bottom: 12px; line-height: 1.4;">Bạn có thể chỉ định màu nền riêng cho <b>{{ activePageLabel }}</b> để ghi đè (override) khai báo màu nền chung của hệ thống.</p>
              
              <div class="param-row">
                <label>Màu nền trang</label>
                <div class="color-picker-wrapper" style="display:flex; align-items:center; gap:8px;">
                  <input type="color" v-model="currentPageBg" class="param-color" style="width:28px; height:28px; border:1px solid #cbd5e1; border-radius:4px; padding:0; background:none; cursor:pointer;" />
                  <input type="text" v-model="currentPageBg" class="param-input param-input--sm" style="width: 70px" placeholder="Bỏ trống..." />
                  <button v-if="currentPageBg" @click="currentPageBg = ''" class="btn-clear-color" title="Xóa" style="width: 24px; height: 24px; border:none; background:#f1f5f9; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#ef4444; transition: 0.2s;" onmouseover="this.style.background='#fee2e2'" onmouseout="this.style.background='#f1f5f9'">
                    <X :size="12" />
                  </button>
                </div>
              </div>
            </div>
            
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
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'promo' }" @click="activeConfig = 'promo'" title="Cấu hình Promo Bar">
                  <div class="cpb-layer-content"><Megaphone :size="14" /> Promo Bar</div>
                </div>
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'header' }" @click="activeConfig = 'header'" title="Cấu hình Header">
                  <div class="cpb-layer-content"><PanelTop :size="14" /> Header</div>
                </div>
              </div>

              <!-- Main Body Content -->
              <div class="cpb-layer-separator">Nội dung {{ activePageLabel }}</div>

              <div class="cpb-layer-switch">
                <button :class="{ active: activeSidebarTab === 'elements' }" @click="activeSidebarTab = 'elements'" title="Quản lý các khối nội dung (Sections)">Section</button>
                <button :class="{ active: activeSidebarTab === 'navigator' }" @click="activeSidebarTab = 'navigator'" title="Xem cấu trúc các lớp (Layers)">Layers</button>
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

              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="cpb-btn-add" style="flex: 1;" @click="activeConfig = 'library'"><Plus :size="14"/> Thêm section</button>
                <div style="display: flex; gap: 4px;">
                  <button class="cpb-btn-add" style="padding: 0 10px; background: rgba(99,102,241,0.1); color: #6366f1" title="Export JSON" @click="exportJson"><Download :size="14"/></button>
                  <button class="cpb-btn-add" style="padding: 0 10px; background: rgba(99,102,241,0.1); color: #6366f1" title="Import JSON" @click="triggerJsonImport"><Upload :size="14"/></button>
                  <input type="file" ref="jsonInputRef" accept=".json" style="display:none" @change="onJsonImportFile" />
                </div>
              </div>

              <!-- Global Footer -->
              <div v-if="!activePageId" style="margin-top:8px">
                <div class="cpb-layer-item" :class="{ active: activeConfig === 'footer' }" @click="activeConfig = 'footer'" title="Cấu hình Footer">
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

        <button class="cpb-collapse-btn" @click="leftCollapsed = !leftCollapsed" title="Đóng/Mở thanh công cụ (Sidebar)">
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

      <!-- RIGHT PANEL backdrop (click outside to close) -->
      <div v-if="activeConfig" class="cpb-right-backdrop" @click="activeConfig = null"></div>

      <!-- RIGHT PANEL (Properties) -->
      <div class="cpb-right" :class="{ 'cpb-right--open': activeConfig }">
        <div v-if="activeConfig && activeConfig !== 'library'" class="cpb-prop-header" style="justify-content: flex-start; gap: 12px;">
          <button class="cpb-btn-secondary" @click="activeConfig = 'library'" title="Quay lại Kho Layout" style="padding: 6px; border: none; background: var(--bg-2)"><ChevronLeft :size="16"/></button>
          <h4 style="margin: 0; font-size: 14px; font-weight: 600; flex: 1;">{{ rightPanelTitle }}</h4>
          <button class="cpb-btn-secondary" @click="activeConfig = null" title="Đóng" style="padding: 6px; border: none;"><X :size="16"/></button>
        </div>
        <div v-else-if="activeConfig === 'library'" class="cpb-prop-header">
          <h4>Kho Giao Diện</h4>
          <button @click="activeConfig = null" title="Đóng"><X :size="16"/></button>
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
            <template v-if="promoConfig.enabled">
              <div class="form-group" style="margin-top: 12px">
                <label>Nội dung</label>
                <input v-model="promoConfig.text" class="param-input" placeholder="Miễn phí vận chuyển..." />
              </div>
              <div class="form-group" style="margin-top: 12px">
                <label>Link trỏ tới</label>
                <input v-model="promoConfig.link" class="param-input" placeholder="/products" />
              </div>
              <div class="form-group" style="margin-top: 12px">
                <label>Tên Nút (CTA Text)</label>
                <input v-model="promoConfig.ctaText" class="param-input" placeholder="Mua ngay" />
              </div>
              <div class="param-divider"></div>
              <div class="form-group">
                <label>Màu nền</label>
                <div style="display:flex;gap:6px;align-items:center">
                  <input type="color" v-model="promoConfig.bgColor" class="param-color" />
                  <input v-model="promoConfig.bgColor" class="param-input" placeholder="#7c3aed" />
                </div>
              </div>
              <div class="form-group">
                <label>Màu chữ</label>
                <div style="display:flex;gap:6px;align-items:center">
                  <input type="color" v-model="promoConfig.textColor" class="param-color" />
                  <input v-model="promoConfig.textColor" class="param-input" placeholder="#ffffff" />
                </div>
              </div>
              <div class="form-group">
                <label>Cỡ chữ</label>
                <select v-model="promoConfig.fontSize" class="param-select">
                  <option value="12px">Nhỏ (12px)</option>
                  <option value="13px">Vừa (13px)</option>
                  <option value="14px">Lớn (14px)</option>
                  <option value="15px">Rất lớn (15px)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Có thể đóng</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="promoConfig.dismissible" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
          </div>
          <!-- Library (Kho Layout) -->
          <div v-if="activeConfig === 'library'" class="library-container">
            <!-- Templates Grid -->
            <div class="lb-section" v-if="!activePageId" style="margin-bottom: 24px;">
              <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục ưu tiên</h4>
              <div class="template-grid">
                <button v-for="tpl in templates" :key="tpl.key" class="template-card" :class="{ active: activeTemplate === tpl.key }" @click="applyTemplate(tpl.key)">
                  <component :is="tpl.icon" :size="20" />
                  <span class="template-card__name">{{ tpl.name }}</span>
                </button>
              </div>
            </div>

            <!-- Sections Library Grid -->
            <div class="library-grouped">
              <div v-for="(items, category) in groupedLibraryItems" :key="category" class="library-group">
                <h4 class="library-group__title">{{ category }}</h4>
                <div class="library-grid-sidebar">
                  <button
                    v-for="lib in items"
                    :key="lib.type"
                    class="library-card-row"
                    :class="{ added: sections.some(s => s.type === lib.type), 'library-card-row--disabled': !lib.available }"
                    @click="lib.available ? addLibrarySection(lib) : null"
                    :disabled="!lib.available"
                  >
                    <span class="library-card-row__icon"><component :is="sectionIconMap[lib.icon] || Box" :size="20" /></span>
                    <div class="library-card-row__text" style="flex:1; text-align:left">
                      <strong>{{ lib.label }}</strong>
                      <span style="display:block; font-size: 11.5px; margin-top:2px; font-weight: normal; color: var(--text-3); line-height: 1.3">{{ lib.description }}</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Section Config (Content + Style) -->
          <template v-else-if="activeSectionObj">
            <SectionConfigEditor
              :section="activeSectionObj"
              :all-categories="allCategories"
              :current-lang="'vi'"
              :default-lang-code="'vi'"
              @open-block-editor="s => showBlockEditorFor = s"
              @navigate-tab="tab => { activeConfig = null; $emit('navigate-tab', tab) }"
            />
          </template>

        </div>
      </div>
    </div>

    <!-- Modals -->
    <!-- Custom CSS Modal -->
    <div class="media-modal-overlay" v-if="showCustomCss" @click.self="showCustomCss = false">
      <div class="media-modal" style="width: 600px; height: 400px; border-radius: 8px;">
        <div class="media-modal-header">
          <h3><Code :size="16" /> CSS tùy chỉnh</h3>
          <button @click="showCustomCss = false" title="Đóng"><X :size="20" /></button>
        </div>
        <div style="padding: 16px; flex: 1; display:flex">
          <textarea v-model="customCss" style="flex:1; width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 13px;" placeholder="/* Custom CSS cho layout này */&#10;.my-class { }"></textarea>
        </div>
        <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
          <button class="cpb-btn-save" @click="showCustomCss = false">Xong</button>
        </div>
      </div>
    </div>


    <!-- Publish Note Dialog -->
    <div v-if="showPublishDialog" class="media-modal-overlay" @click.self="showPublishDialog = false">
      <div class="media-modal" style="width: 440px; border-radius: 12px;">
        <div class="media-modal-header">
          <h3><Package :size="16" /> Xuất bản layout</h3>
          <button @click="showPublishDialog = false" title="Đóng"><X :size="20" /></button>
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

    <!-- Zen Mode Floating Bar -->
    <div class="zen-floating-bar" :class="{ 'zen-floating-bar--visible': isFullscreen && leftCollapsed }">
      <div class="zen-actions">
        <button class="zen-btn" @click="toggleZenMode" title="Thoát chế độ tập trung (F)"><Focus :size="16" /></button>
        <div class="zen-divider"></div>
        <button class="zen-btn" @click="previewWidth = '100%'" :class="{ active: previewWidth === '100%' }" title="Xem trước trên Desktop"><Monitor :size="16" /></button>
        <button class="zen-btn" @click="previewWidth = '768px'" :class="{ active: previewWidth === '768px' }" title="Xem trước trên Tablet"><Tablet :size="16" /></button>
        <button class="zen-btn" @click="previewWidth = '375px'" :class="{ active: previewWidth === '375px' }" title="Xem trước trên Mobile"><Smartphone :size="16" /></button>
        <div class="zen-divider"></div>
        <button class="zen-btn" @click="undo" :disabled="undoStack.length <= 1" title="Hoàn tác"><Undo2 :size="16" /></button>
        <button class="zen-btn" @click="redo" :disabled="redoStack.length === 0" title="Làm lại"><Redo2 :size="16" /></button>
        <div class="zen-divider"></div>
        <button class="zen-btn zen-btn--publish" @click="handlePublish" :disabled="saving">
          <Loader2 v-if="saving" :size="14" class="spin"/> 
          <Save v-else :size="14"/> Xuất bản
        </button>
      </div>
    </div>


    <MediaPicker ref="globalImagePicker" style="display: none" :modelValue="''" @update:modelValue="onGlobalImagePicked" />

    <CommandPalette 
      :visible="showCommandPalette" 
      @update:visible="showCommandPalette = $event"
      :commands="builderCommands"
      @execute="executeCommand"
    />
  </div>
</template>
\n<script setup>
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

import { ref, computed, onMounted, watch, nextTick, inject, provide } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import LayoutThemeConfig from './storefront/LayoutThemeConfig.vue'
import LayoutHeaderConfig from './storefront/LayoutHeaderConfig.vue'
import LayoutFooterConfig from './storefront/LayoutFooterConfig.vue'
import LayoutPageConfigs from './storefront/LayoutPageConfigs.vue'
import LayoutSectionManager from './storefront/LayoutSectionManager.vue'
import SectionConfigEditor from './storefront/SectionConfigEditor.vue'
import LayoutNavigator from './storefront/LayoutNavigator.vue'
import LayoutPreviewPanel from './storefront/LayoutPreviewPanel.vue'
import LayoutVersionHistory from './storefront/LayoutVersionHistory.vue'
import LayoutPageManager from './storefront/LayoutPageManager.vue'
import CommandPalette from './storefront/CommandPalette.vue'
import LanguageTabs from './LanguageTabs.vue'
import BlockEditor from './builder/BlockEditor.vue'
import MediaPicker from './MediaPicker.vue'
import { VisualBuilder, BuilderRegistry, StyleControlPanel } from '../lib/vue-visual-builder'
import { useToast } from '../composables/useToast.js'
import {
  LayoutDashboard, Save, Palette, Rows3, GripVertical, Settings2, ChevronUp, ChevronDown, Download, Upload,
  Eye, ShoppingBag, ShoppingCart, User, Truck, FileStack, Plus, X, Code,
  Image, Grid3x3, Zap, Sparkles, Clock, BookOpen, Store, Target, Package,
  Monitor, Tablet, Smartphone, AlertCircle, Layers, CreditCard,
  MessageSquareQuote, HelpCircle, Images, Video, Type, Mail, Share2, Award,
  Trash2, Undo2, Redo2, FileEdit, Home, Heart, Lock, FileText, Link, Pencil, Paintbrush, Loader2,
  History, Tag, Shield, LayoutGrid, Newspaper, ChevronLeft, PanelTop, PanelBottom,
  Aperture, Megaphone, FolderOpen, ShieldCheck, Star, Film, Box,
  CalendarDays, UtensilsCrossed, Flower2, Building2, PartyPopper, Maximize, Minimize, Focus, Scan
} from 'lucide-vue-next'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useI18n } from '../composables/useI18n.js'
import { sectionMeta as sectionMetaRegistry, getAllSectionsWithAvailability } from './storefront/sectionSchemas.js'
import { industryTemplates } from './storefront/templatePresets.js'
import { getDefaultSectionsForPage, getPageSlugFromId } from './storefront/defaultPageSections.js'

Object.keys(sectionMetaRegistry).forEach(type => {
  BuilderRegistry.registerBlock(type, {
    label: sectionMetaRegistry[type].label,
    icon: sectionMetaRegistry[type].icon,
    category: sectionMetaRegistry[type].category || 'General',
    schema: [] // Expand this iteratively
  })
})

const showVisualBuilderPro = ref(false)
const isFullscreen = ref(false)
const { t, formatCurrency } = useI18n()

// VIP Zen Mode Toggle
function toggleZenMode() {
  if (leftCollapsed.value) {
    // Restore
    leftCollapsed.value = false
  } else {
    // Enter Zen
    leftCollapsed.value = true
  }
}

// Keyboard shortcuts — consolidated into handleGlobalKeydown below (line ~786)
// Removed duplicate onMounted listener to prevent double-firing.

const { showToast } = useToast()

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
const showLibrary = ref(false)
const previewMode = ref('live')
const previewWidth = ref('100%')

const currentDevice = computed(() => {
  if (previewWidth.value === '375px') return 'mobile'
  if (previewWidth.value === '768px') return 'tablet'
  return 'desktop'
})
provide('previewDevice', currentDevice)

const previewKey = ref(0)
const storefrontUrl = ref(window.location.origin.replace('.cms.', '.'))
const expandedPageConfig = ref(null)
const allCategories = ref([])
const showBlockEditorFor = ref(null)

const historyDropdownOpen = ref(false)
function handleHistoryFocusout(e) {
  const next = e.relatedTarget
  if (!e.currentTarget.contains(next)) historyDropdownOpen.value = false
}
function restoreHistory(index) {
  if (index < 0 || index >= undoStack.value.length) return
  isTrackingHistory = true
  
  // Pop items onto redo stack until we reach the desired index
  while (undoStack.value.length - 1 > index) {
    redoStack.value.push(undoStack.value.pop())
  }
  
  const item = undoStack.value[index]
  const snap = JSON.parse(item.snap)
  
  sections.value = snap.sections || []
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
  if (snap.promoConfig) promoConfig.value = snap.promoConfig

  historyDropdownOpen.value = false
  showToast('Đã khôi phục trạng thái', 'info')
  nextTick(() => { isTrackingHistory = false })
}

const isXRayMode = ref(false)
function toggleXRay() {
  isXRayMode.value = !isXRayMode.value
  if (previewPanelRef.value) {
    previewPanelRef.value.postMessageToIframe('toggle-xray', isXRayMode.value)
  }
}

const showCommandPalette = ref(false)
const builderCommands = computed(() => {
  return [
    { id: 'zen', title: 'Chế độ Tập trung (Zen Mode)', description: 'Ẩn toàn bộ thanh công cụ để ngắm canvas', shortcut: 'F', icon: Focus, action: toggleZenMode },
    { id: 'fs', title: 'Toàn màn hình', description: 'Mở rộng Builder lấp đầy màn hình', shortcut: 'Esc', icon: Maximize, action: () => isFullscreen.value = true },
    { id: 'mobile', title: 'Xem trước trên Mobile', description: 'Thu hẹp khung nhìn xuống 375px', icon: Smartphone, action: () => previewWidth.value = '375px' },
    { id: 'desktop', title: 'Xem trước trên Desktop', description: 'Mở rộng khung nhìn lên 100%', icon: Monitor, action: () => previewWidth.value = '100%' },
    { id: 'save', title: 'Xuất bản (Publish)', description: 'Lưu thay đổi lên Live', shortcut: 'Ctrl+S', icon: Save, action: handlePublish },
  ]
})

function executeCommand(cmd) {
  if (typeof cmd.action === 'function') {
    cmd.action()
  }
}


// ── Module awareness for section availability ──
const _injectedModules = inject('installedModules', ref([]))
const installedModules = computed(() => {
  const v = _injectedModules.value
  return Array.isArray(v) ? v : []
})

// ── Dynamic library items grouped by category ──
const allLibrarySections = computed(() => getAllSectionsWithAvailability(installedModules.value))
const groupedLibraryItems = computed(() => {
  const groups = {}
  for (const item of allLibrarySections.value) {
    const cat = item.category || 'Khác'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  }
  return groups
})

// ── Icon name → component map for library cards ──
const sectionIconMap = {
  Image, Tag, Zap, FileText, Type, Images, Film, Star, HelpCircle, Mail, Share2,
  ShieldCheck, Award, LayoutGrid, Box, FolderOpen, ShoppingBag, Sparkles, FileEdit,
  UtensilsCrossed, CalendarDays, Flower2, Building2, PartyPopper
}

// ── Layout Page Integration ──
const layoutPageId = ref(null)
const layoutPageVersion = ref(0)
const layoutPageStatus = ref('draft')
const showVersionHistory = ref(false)
const showPublishDialog = ref(false)
const publishNote = ref('')
const publishNoteInput = ref(null)

// ─── Controls panel toggle ───
const controlsCollapsed = ref(false)

// ─── AI Generate Layout ───
const showAiPanel = ref(false)
const aiPrompt = ref('')
const aiLoading = ref(false)

async function generateLayout() {
  if (!aiPrompt.value.trim()) return
  aiLoading.value = true
  try {
    const res = await apiFetch('/ai/generate', {
      method: 'POST',
      body: JSON.stringify({ type: 'layout', prompt: aiPrompt.value }),
    })
    const data = await res.json()
    if (!data.success) { showToast(data.message || 'AI chưa cấu hình', 'error'); return }

    const raw = (data.data?.content || '').replace(/```json\n?|```\n?/g, '').trim()
    let generated
    try { generated = JSON.parse(raw) } catch { showToast('AI trả về định dạng không hợp lệ', 'error'); return }
    if (!Array.isArray(generated)) { showToast('Kết quả không phải JSON array', 'error'); return }

    pushUndo()
    const base = sections.value.length
    const newSections = generated.map((s, i) => ({
      type: s.type || 'text_block',
      enabled: s.enabled !== false,
      order: base + i,
      params: { ...(defaultParams[s.type] || {}), ...(s.params || {}) },
      content: s.content ?? [],
    })).filter(s => sectionMeta[s.type])

    sections.value = [...sections.value, ...newSections]
    aiPrompt.value = ''
    showAiPanel.value = false
    showToast(`✨ Đã tạo ${newSections.length} section từ AI`, 'success')
  } catch (e) {
    showToast('Lỗi AI: ' + e.message, 'error')
  } finally {
    aiLoading.value = false
  }
}

const activePageId = ref(null)
const activeSidebarTab = ref('elements')
const dynamicPages = ref([])
const pageDropdownOpen = ref(false)

// Builtin page options with proper lucide icons
const builtinPageOptions = [
  { id: '__products',       label: t('admin.msg_4c779e64', 'Trang sản phẩm'),    icon: ShoppingBag },
  { id: '__productDetail',  label: t('admin.msg_6055caf1', 'Chi tiết sản phẩm'), icon: Package },
  { id: '__checkout',       label: t('admin.msg_d555e4bc', 'Thanh toán'),          icon: CreditCard },
  { id: '__auth',           label: t('admin.msg_50e04c81', 'Đăng nhập / Đăng ký'), icon: Lock },
  { id: '__account',        label: t('admin.msg_7bd53616', 'Tài khoản'),           icon: User },
  { id: '__wishlist',       label: t('admin.msg_2958eac6', 'Yêu thích'),          icon: Heart },
  { id: '__cart',           label: t('admin.msg_6b413a7c', 'Giỏ hàng'),           icon: ShoppingCart },
  { id: '__order_tracking', label: t('admin.msg_45fc7ddf', 'Tra cứu đơn'),        icon: Truck },
  { id: '__blog',           label: 'Blog',                                          icon: BookOpen },
  { id: '__template_product_card', label: '[Template] Thẻ Sản phẩm',            icon: Layers },
  { id: '__template_blog_card',    label: '[Template] Thẻ Bài viết',            icon: Layers },
]

// Computed: current active page display (icon + label)
const activePage = computed(() => {
  if (activePageId.value === null) return { icon: Home, label: t('admin.msg_af830e1f', 'Trang Chủ (Global)') }
  const builtin = builtinPageOptions.find(p => p.id === activePageId.value)
  if (builtin) return builtin
  const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
  if (dyn) return { icon: FileText, label: dyn.title }
  return { icon: Home, label: t('admin.msg_af830e1f', 'Trang Chủ (Global)') }
})

// Extracts 'products'/'productDetail'/etc from '__products'/'__productDetail'
const activeBuiltinPage = computed(() => {
  if (typeof activePageId.value === 'string') {
    if (activePageId.value.startsWith('__template_')) return null
    if (activePageId.value.startsWith('__')) return activePageId.value.slice(2)
  }
  return null
})

const activeTemplatePage = computed(() => {
  if (typeof activePageId.value === 'string' && activePageId.value.startsWith('__template_')) {
    return activePageId.value.slice(11) // e.g. 'product_card'
  }
  return null
})

function selectPage(id) {
  activePageId.value = id
  pageDropdownOpen.value = false
  loadLayout()
}
function handlePickerFocusout(e) {
  // Close dropdown when focus leaves the container entirely
  const next = e.relatedTarget
  if (!e.currentTarget.contains(next)) pageDropdownOpen.value = false
}

// Undo/Redo stack for layout history
import { onBeforeUnmount } from 'vue'
const undoStack = ref([])
const redoStack = ref([])
const MAX_UNDO = 30
let isTrackingHistory = false

function getSnapshot() {
  return JSON.stringify({ sections: sections.value, pageConfigs: pageConfigs.value, headerConfig: headerConfig.value, footerConfig: footerConfig.value, promoConfig: promoConfig.value })
}

let pushUndoTimer = null
function pushUndo() {
  if (isTrackingHistory) return
  if (pushUndoTimer) clearTimeout(pushUndoTimer)
  pushUndoTimer = setTimeout(() => {
    // Save structured snapshot
    const item = {
      snap: getSnapshot(),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      label: 'Thay đổi cấu trúc'
    }
    undoStack.value.push(item)
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
    redoStack.value = [] // Clear redo
  }, 250)
}

watch(sections, () => pushUndo(), { deep: true })

function undo() {
  if (undoStack.value.length <= 1) return
  isTrackingHistory = true
  redoStack.value.push(undoStack.value.pop()) // Save current for redo
  const item = undoStack.value[undoStack.value.length - 1]
  const snap = JSON.parse(item.snap)
  
  sections.value = snap.sections || []
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
  if (snap.promoConfig) promoConfig.value = snap.promoConfig

  showToast('Đã hoàn tác (Undo)', 'info')
  nextTick(() => { isTrackingHistory = false })
}

function redo() {
  if (redoStack.value.length === 0) return
  isTrackingHistory = true
  const nextItem = redoStack.value.pop()
  undoStack.value.push(nextItem)
  const snap = JSON.parse(nextItem.snap)
  
  sections.value = snap.sections || []
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
  if (snap.promoConfig) promoConfig.value = snap.promoConfig

  showToast('Đã làm lại (Redo)', 'info')
  nextTick(() => { isTrackingHistory = false })
}


function handleGlobalKeydown(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return
  
  // Esc to exit fullscreen or close panel
  if (e.key === 'Escape') {
    if (isFullscreen.value) isFullscreen.value = false
    if (activeConfig.value) activeConfig.value = null
  }
  
  // F to toggle Zen Mode
  if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    toggleZenMode()
  }
  
  // X to toggle X-Ray
  if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    toggleXRay()
  }
  
  // Ctrl+K to open command palette
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
  }
  
  // Ctrl+S to save
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handlePublish()
  }
  
  // Undo / Redo
  if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
    e.preventDefault()
    if (e.shiftKey) redo()
    else undo()
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
    e.preventDefault()
    redo()
  }
}
onMounted(() => { window.addEventListener('keydown', handleGlobalKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleGlobalKeydown) })

// Header / Footer config
const defaultHeaderConfig = { logoPosition: 'left', maxNavLinks: 5, showSearch: true, sticky: true, showThemeToggle: true }
const headerConfig = ref({ ...defaultHeaderConfig })
const defaultFooterConfig = {
  columns: [
    { title: t('admin.msg_1437f79c', 'Về chúng tôi'), type: 'links', links: [{ label: t('admin.msg_33f0741f', 'Giới thiệu'), url: '/page/gioi-thieu' }, { label: t('admin.msg_98b31963', 'Chính sách bảo mật'), url: '/page/chinh-sach-bao-mat' }] },
    { title: t('admin.msg_c1513256', 'Hỗ trợ'), type: 'links', links: [{ label: t('admin.msg_6aba341e', 'Chính sách vận chuyển'), url: '/page/chinh-sach-van-chuyen' }, { label: t('admin.msg_0ea7d28b', 'Đổi trả & Hoàn tiền'), url: '/page/doi-tra' }] },
    { title: t('admin.msg_9276b119', 'Liên hệ'), type: 'contact', items: [{ icon: 'phone', label: 'Hotline', value: '' }, { icon: 'email', label: 'Email', value: '' }] },
  ],
  social: [],
  paymentMethods: ['cod', 'bank'],
  badges: [],
  legalText: '',
  copyrightText: '',
  bgColor: '',
  textColor: '',
  headingColor: '',
}
const footerConfig = ref(JSON.parse(JSON.stringify(defaultFooterConfig)))
const defaultPromoConfig = { 
  enabled: true, 
  text: '🎉 Miễn phí vận chuyển cho đơn từ 500K — Mua ngay!', 
  link: '/products', 
  ctaText: 'Mua sắm',
  bgColor: '#7c3aed',
  textColor: '#ffffff',
  fontSize: '13px',
  dismissible: true,
}
const promoConfig = ref({ ...defaultPromoConfig })
const promoOpen = ref(false)

const leftTab = ref('structure')
const leftCollapsed = ref(true)
const activeConfig = ref(null)
const activeSectionObj = computed(() => {
  const id = activeConfig.value
  if (!id || id === 'header' || id === 'footer' || id === 'promo') return null
  // Match by section id or type
  return sections.value.find(s => s.id === id || s.type === id) || null
})
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
  if (activeSectionObj.value) {
    const meta = sectionMeta[activeSectionObj.value.type]
    return meta?.label || activeSectionObj.value.type
  }
  return 'Tùy chỉnh'
})

const rightPanelTitle = activeConfigName

function onPreviewOpenConfig(payload) {
  const { type, index, targetObj } = payload || {}
  
  if (type === 'header') activeConfig.value = 'header'
  else if (type === 'footer') activeConfig.value = 'footer'
  else if (type === 'promo') activeConfig.value = 'promo'
  else if (type === 'promo-bar') activeConfig.value = 'promo'
  else if (type === 'section' && targetObj && targetObj.id) {
    activeConfig.value = targetObj.id
  } else if (index !== undefined && sections.value[index]) {
    // Map visual builder click index to the actual section ID
    const sectionId = sections.value[index].id
    activeConfig.value = sectionId || sections.value[index].type
  }
}


const footerPreviewStyle = computed(() => {
  const s = {}
  if (footerConfig.value.bgColor) s.background = footerConfig.value.bgColor
  return s
})

const allPaymentMethods = [
  { code: 'cod', label: 'COD' },
  { code: 'bank', label: 'Bank Transfer' },
  { code: 'visa', label: 'VISA' },
  { code: 'mastercard', label: 'Mastercard' },
  { code: 'jcb', label: 'JCB' },
  { code: 'momo', label: 'MoMo' },
  { code: 'zalopay', label: 'ZaloPay' },
  { code: 'vnpay', label: 'VNPay' },
  { code: 'napas', label: 'Napas' },
  { code: 'applepay', label: 'Apple Pay' },
]

function addFooterCol() {
  footerConfig.value.columns.push({ title: '', type: 'links', links: [], items: [], content: '' })
}
function removeFooterCol(idx) {
  footerConfig.value.columns.splice(idx, 1)
}

// Footer column drag-drop
const footerDragIdx = ref(-1)
const footerDragOverIdx = ref(-1)
const footerItemDrag = ref(null)

function onFooterDragStart(e, idx) {
  footerDragIdx.value = idx
  e.dataTransfer.effectAllowed = 'move'
}
function onFooterDragEnd() {
  footerDragIdx.value = -1
  footerDragOverIdx.value = -1
}
function onFooterDragOver(e, idx) {
  footerDragOverIdx.value = idx
}
function onFooterDrop(idx) {
  const from = footerDragIdx.value
  if (from < 0 || from === idx) { onFooterDragEnd(); return }
  const cols = footerConfig.value.columns
  const [moved] = cols.splice(from, 1)
  cols.splice(idx, 0, moved)
  onFooterDragEnd()
}
function onFooterItemDrop(ci, targetLi) {
  const src = footerItemDrag.value
  if (!src || src.ci !== ci || src.li === targetLi) { footerItemDrag.value = null; return }
  const arr = footerConfig.value.columns[ci].links
  const [moved] = arr.splice(src.li, 1)
  arr.splice(targetLi, 0, moved)
  footerItemDrag.value = null
}
function onFooterContactDrop(ci, targetIi) {
  const src = footerItemDrag.value
  if (!src || src.ci !== ci || src.ii === targetIi) { footerItemDrag.value = null; return }
  const arr = footerConfig.value.columns[ci].items
  const [moved] = arr.splice(src.ii, 1)
  arr.splice(targetIi, 0, moved)
  footerItemDrag.value = null
}

const defaultPageConfigs = {
  products: {
    sidebarPosition: 'left',
    gridColumns: 4,
    itemsPerPage: 12,
    showFilters: { category: true, brand: true, price: true },
    pageTitle: t('admin.msg_1d1aa192', 'Sản phẩm'),
    pageDescription: '',
    translations: {},
  },
  productDetail: {
    galleryStyle: 'thumbnails',
    layoutRatio: '50-50',
    showBreadcrumb: true,
    showRelatedProducts: true,
    relatedCount: 6,
    showReviews: true,
    pageTitle: t('admin.msg_6055caf1', 'Chi tiết sản phẩm'),
    pageDescription: '',
    translations: {},
  },
  checkout: {
    showCoupon: true,
    showNotes: true,
    showSteps: true,
    layout: 'two-column',
    pageTitle: t('admin.msg_d555e4bc', 'Thanh toán'),
    pageDescription: '',
    translations: {},
  },
  auth: {
    allowRegister: true,
    allowForgotPassword: true,
    showSocialLogin: false,
    cardMaxWidth: 440,
    pageTitle: t('admin.msg_50e04c81', 'Đăng nhập / Đăng ký'),
    pageDescription: '',
    translations: {},
  },
  account: {
    showOrders: true,
    showAddresses: true,
    showPasswordChange: true,
    sidebarPosition: 'left',
    pageTitle: t('admin.msg_7bd53616', 'Tài khoản'),
    pageDescription: '',
    translations: {},
  },
  blog: {
    gridColumns: 3,
    postsPerPage: 9,
    layout: 'grid',
    pageTitle: 'Blog',
    pageDescription: '',
    translations: {},
  },
}
const pageConfigs = ref(JSON.parse(JSON.stringify(defaultPageConfigs)))

const currentPageBg = computed({
  get() {
    if (!activePageId.value) return ''
    const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
    return pageConfigs.value[id]?.backgroundColor || ''
  },
  set(val) {
    if (!activePageId.value) return
    const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
    if (!pageConfigs.value[id]) pageConfigs.value[id] = {}
    pageConfigs.value[id].backgroundColor = val
    // Tự động trigger watch
    pageConfigs.value = { ...pageConfigs.value }
  }
})

// ─── Builtin Page i18n ───
import { useLanguages } from '../composables/useLanguages.js'
const { defaultLangCode: dfLangCode, loadLanguages: loadLangs2 } = useLanguages()
loadLangs2()
const builtinPageLang = ref(dfLangCode.value)

function getPageConfigI18n(pageName, field) {
  if (builtinPageLang.value === dfLangCode.value) return pageConfigs.value[pageName]?.[field] || ''
  const t = pageConfigs.value[pageName]?.translations?.[builtinPageLang.value]
  return t?.[field] || ''
}
function setPageConfigI18n(pageName, field, value) {
  if (builtinPageLang.value === dfLangCode.value) {
    if (pageConfigs.value[pageName]) pageConfigs.value[pageName][field] = value
    return
  }
  if (!pageConfigs.value[pageName].translations) pageConfigs.value[pageName].translations = {}
  if (!pageConfigs.value[pageName].translations[builtinPageLang.value]) {
    pageConfigs.value[pageName].translations[builtinPageLang.value] = { pageTitle: '', pageDescription: '' }
  }
  pageConfigs.value[pageName].translations[builtinPageLang.value][field] = value
}

// ─── Drag & Drop ───
const dragIndex = ref(null)
const dragOverIndex = ref(null)

function onDragStart(e, idx) {
  dragIndex.value = idx
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', String(idx))
}
function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }
function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }
function onDragEnter(idx) {
  if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx
}
function onDragLeave(idx) {
  if (dragOverIndex.value === idx) dragOverIndex.value = null
}
function onDrop(targetIdx) {
  const fromIdx = dragIndex.value
  dragOverIndex.value = null
  dragIndex.value = null
  if (fromIdx === null || fromIdx === targetIdx) return
  const list = [...sections.value]
  const [moved] = list.splice(fromIdx, 1)
  list.splice(targetIdx, 0, moved)
  list.forEach((s, i) => { s.order = i })
  sections.value = list
}

// ─── Section expand ───
function toggleExpand(type) {
  expandedSection.value = expandedSection.value === type ? null : type
}

// ─── Builder Bridge: Preview Overlay Event Handlers ───
const previewPanelRef = ref(null)
const addSectionAtInsertIndex = ref(null)

function onPreviewSectionSelected({ type, index, id }) {
  if (id === '__promo' || type === 'promo-bar') {
    promoOpen.value = true
    activeConfig.value = 'promo'
    return
  }
  if (id === '__header' || type === 'header') {
    activeConfig.value = 'header'
    return
  }
  if (id === '__footer' || type === 'footer') {
    activeConfig.value = 'footer'
    return
  }
  
  // Use index to find the exact section in activeSections
  let section = null
  if (index !== undefined && index >= 0) {
    section = activeSections.value[index]
  }
  if (!section) {
    section = sections.value.find(s => s.id === id || s.type === type)
  }
  
  if (section) {
    activeConfig.value = section.id || section.type
    expandedSection.value = section.id || section.type
    // Switch to properties tab if needed
    // Scroll the section into view in the left panel
    nextTick(() => {
      const el = document.querySelector(`[data-section-panel="${section.type}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }
}

function handleNavigatorSelect(typeOrId) {
  expandedSection.value = typeOrId
  // Also tell IFrame to highlight this section!
  const activeIdx = activeSections.value.findIndex(s => s.type === typeOrId)
  if (activeIdx !== -1 && previewPanelRef.value) {
    previewPanelRef.value.selectSection(activeIdx)
  }
}

function onPreviewSectionHover({ type }) {
  // Optional: highlight the section in the left panel
}

function onPreviewSectionReorder({ fromIndex, toIndex }) {
  const fromSec = activeSections.value[fromIndex]
  const toSec = activeSections.value[toIndex]
  if (!fromSec || !toSec) return
  
  const realFrom = sections.value.indexOf(fromSec)
  const realTo = sections.value.indexOf(toSec)
  
  if (realFrom === -1 || realTo === -1) return

  pushUndo()
  const list = [...sections.value]
  const [moved] = list.splice(realFrom, 1)
  
  // To place it exactly at realTo's current position (or after)
  list.splice(realTo, 0, moved)
  
  list.forEach((s, i) => { s.order = i })
  sections.value = list
  showToast(t('admin.msg_reorder_ok', 'Đã di chuyển section'), 'success')
}

function onPreviewInlineEdit({ type, field, value }) {
  // Find section by type and update the specific field in params
  const section = sections.value.find(s => s.type === type)
  if (section && section.params) {
    section.params[field] = value
    showToast(`✏️ ${field}: "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`, 'success')
  }
}

function onPreviewSectionDelete({ type, index }) {
  if (!confirm(`Xóa section "${sectionMeta[type]?.label || type}"?`)) return
  pushUndo()
  const idx = sections.value.findIndex(s => s.type === type)
  if (idx >= 0) {
    sections.value.splice(idx, 1)
    sections.value.forEach((s, i) => { s.order = i })
    expandedSection.value = null
    showToast(t('admin.msg_section_deleted', 'Đã xóa section'), 'success')
  }
}

function onPreviewSectionToggle({ type }) {
  const section = sections.value.find(s => s.type === type)
  if (section) {
    section.enabled = !section.enabled
    showToast(section.enabled ? 'Đã bật section' : 'Đã tắt section', 'success')
  }
}

function onPreviewAddSectionAt({ index }) {
  addSectionAtInsertIndex.value = index
  activeConfig.value = 'library'
}

// ── Inline Image Editing via Builder Overlay ──
const globalImagePicker = ref(null)
const globalImagePickerTarget = ref(null)

function onPreviewEditImage(payload) {
  // payload: { type, index, key, itemIndex }
  globalImagePickerTarget.value = payload
  if (globalImagePicker.value) {
    globalImagePicker.value.openPicker()
  }
}

function onGlobalImagePicked(newUrl) {
  const target = globalImagePickerTarget.value
  if (!target || !newUrl) return
  const { type, index, key, itemIndex } = target
  
  if (type === 'header') {
    headerConfig.value[key] = newUrl
  } else if (type === 'footer') {
    // For future if footer has image/logo
    footerConfig.value[key] = newUrl
  } else {
    // Body Block Section Tracker
    const sec = sections.value[index]
    if (!sec) return
    const segments = key.split('.')
    
    // Ensure translation object exists just in case
    if (!sec.i18n) Object.assign(sec, { i18n: {} })
    const lang = window.localStorage.getItem('sf_admin_lang') || 'vi'
    if (!sec.i18n[lang]) sec.i18n[lang] = JSON.parse(JSON.stringify(sec.params || {}))
    
    if (segments[0] === 'content' && typeof itemIndex === 'number') {
      if (!sec.i18n[lang].content) sec.i18n[lang].content = []
      const contentList = sec.i18n[lang].content
      if (contentList[itemIndex]) {
        contentList[itemIndex][segments[1]] = newUrl
      }
    } else {
      sec.i18n[lang][key] = newUrl
    }
  }
  showToast(t('admin.msg_image_updated', 'Đã thay ảnh trực tiếp thành công!'), 'success')
  globalImagePickerTarget.value = null
}

// Replaced by generator
// ─── Content item helpers ───
function addContentItem(section, defaultItem) {
  if (!section.content) section.content = []
  section.content.push({ ...defaultItem })
}
function removeContentItem(section, index) {
  section.content.splice(index, 1)
}

function toggleCategoryId(section, catId) {
  if (!section.params.selectedCategoryIds) section.params.selectedCategoryIds = []
  const idx = section.params.selectedCategoryIds.indexOf(catId)
  if (idx >= 0) section.params.selectedCategoryIds.splice(idx, 1)
  else section.params.selectedCategoryIds.push(catId)
}

async function loadCategories() {
  try {
    const res = await apiFetch('/categories')
    const data = await res.json()
    allCategories.value = Array.isArray(data) ? data : (data.data || [])
  } catch { allCategories.value = [] }
}

// ─── Section Meta ───
const sectionMeta = {
  banner: { label: 'Banner', icon: Image, pvHeight: '50px' },
  image_banner: { label: 'Promo Banner', icon: Tag, pvHeight: '40px' },
  feature_links: { label: 'Tính năng nhanh', icon: Zap, pvHeight: '25px' },
  categories: { label: t('admin.msg_53d8de58', 'Danh mục'), icon: Grid3x3, pvHeight: '25px' },
  flash_sale: { label: 'Flash Sale', icon: Zap, pvHeight: '35px' },
  featured_products: { label: t('admin.msg_c90c3bbc', 'Sản phẩm nổi bật'), icon: Sparkles, pvHeight: '60px' },
  new_arrivals: { label: t('admin.msg_f0676ad7', 'Hàng mới về'), icon: Clock, pvHeight: '60px' },
  cms_pages: { label: 'Trang CMS', icon: BookOpen, pvHeight: '30px' },
  blog_posts: { label: 'Bài viết gần đây', icon: Newspaper, pvHeight: '45px' },
  trust_badges: { label: 'Trust Badges', icon: Shield, pvHeight: '25px' },
  grid: { label: 'Lưới bố cục', icon: LayoutGrid, pvHeight: '50px' },
  // Library sections (Phase 3)
  testimonials: { label: t('admin.msg_a4e1b16a', 'Đánh giá KH'), icon: MessageSquareQuote, pvHeight: '45px' },
  faq: { label: 'FAQ', icon: HelpCircle, pvHeight: '40px' },
  image_gallery: { label: t('admin.msg_c1962630', 'Thư viện ảnh'), icon: Images, pvHeight: '50px' },
  video_embed: { label: 'Video', icon: Video, pvHeight: '55px' },
  text_block: { label: t('admin.msg_ec4344e3', 'Khối văn bản'), icon: Type, pvHeight: '35px' },
  newsletter: { label: t('admin.msg_26a469cd', 'Đăng ký email'), icon: Mail, pvHeight: '30px' },
  social_feed: { label: t('admin.msg_0f1252b7', 'Mạng xã hội'), icon: Share2, pvHeight: '25px' },
  brands_slider: { label: t('admin.msg_161416d9', 'Thương hiệu'), icon: Award, pvHeight: '30px' },
  custom_block: { label: 'Visual Builder', icon: Paintbrush, pvHeight: '60px' },
  restaurant_menu: { label: 'Thực đơn Nhà Hàng', icon: BookOpen, pvHeight: '80px' },
  booking_services: { label: 'Dịch vụ Đặt lịch', icon: Clock, pvHeight: '60px' },
  salon_services: { label: 'Dịch vụ Spa & Salon', icon: Sparkles, pvHeight: '60px' },
  property_listings: { label: 'Bất Động Sản', icon: Image, pvHeight: '70px' },
  upcoming_events: { label: 'Sự Kiện Sắp Tới', icon: Zap, pvHeight: '60px' },
  system_page_content: { label: 'Lõi Trang Hệ Thống', icon: Box, pvHeight: '100px' },
  // System page sections (dynamic composition)
  page_breadcrumb:     { label: 'Breadcrumb',        icon: Target,  pvHeight: '15px' },
  page_heading:        { label: 'Tiêu đề trang',     icon: Type,    pvHeight: '25px' },
  product_grid:        { label: 'Lưới sản phẩm',     icon: LayoutGrid, pvHeight: '80px' },
  product_detail_view: { label: 'Chi tiết SP',       icon: Package, pvHeight: '100px' },
  product_reviews:     { label: 'Đánh giá SP',        icon: Star,    pvHeight: '60px' },
  related_products:    { label: 'SP liên quan',       icon: Sparkles, pvHeight: '60px' },
  cart_summary:        { label: 'Giỏ hàng',           icon: ShoppingCart, pvHeight: '80px' },
  checkout_form:       { label: 'Form thanh toán',    icon: CreditCard, pvHeight: '100px' },
  auth_form:           { label: 'Đăng nhập/ĐK',      icon: Lock,    pvHeight: '80px' },
  account_dashboard:   { label: 'Tài khoản',          icon: User,    pvHeight: '80px' },
  order_history:       { label: 'Lịch sử đơn',       icon: FileStack, pvHeight: '60px' },
  blog_listing:        { label: 'DS bài viết',       icon: BookOpen, pvHeight: '80px' },
  wishlist_grid:       { label: 'Yêu thích',          icon: Heart,   pvHeight: '60px' },
}

const defaultParams = {
  system_page_content: { title: '' },
  banner: { autoplay: true, interval: 4000, height: 'md' },
  categories: { columns: 6, showDescription: false, layoutStyle: 'grid', showCount: false, selectedCategoryIds: [] },
  flash_sale: { showTimer: true, showProgress: true, count: 8, columns: 4 },
  featured_products: { title: t('admin.msg_c90c3bbc', 'Sản phẩm nổi bật'), count: 8, columns: 4, filterCategory: '', sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 4000 },
  new_arrivals: { title: t('admin.msg_f0676ad7', 'Hàng mới về'), count: 6, columns: 4, sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 5000 },
  cms_pages: { layout: 'grid', maxPages: 6 },
  testimonials: { title: t('admin.msg_e7334e0f', 'Khách hàng nói gì'), columns: 3 },
  faq: { title: t('admin.msg_65b83ce0', 'Câu hỏi thường gặp') },
  image_gallery: { title: t('admin.msg_c1962630', 'Thư viện ảnh'), columns: 3 },
  video_embed: { title: 'Video' },
  text_block: { title: '' },
  newsletter: { title: t('admin.msg_9a76bcab', 'Đăng ký nhận tin'), subtitle: t('admin.msg_e3809562', 'Nhận thông tin khuyến mãi và sản phẩm mới nhất'), buttonText: t('admin.msg_0bb0951d', 'Đăng ký') },
  social_feed: { title: t('admin.msg_d4a4c495', 'Theo dõi chúng tôi') },
  brands_slider: { title: t('admin.msg_161416d9', 'Thương hiệu'), animationSpeed: 20 },
  custom_block: { title: '' },
  restaurant_menu: { title: 'Thực Đơn Nhà Hàng', subtitle: 'Khám phá hương vị tinh tế' },
  booking_services: { title: 'Dịch Vụ Nổi Bật', subtitle: 'Đặt lịch dễ dàng, nhanh chóng', count: 6 },
  salon_services: { title: 'Dịch Vụ Spa & Salon', subtitle: 'Thư giãn và làm mới bản thân', count: 6 },
  property_listings: { title: 'Bất Động Sản Nổi Bật', subtitle: 'Tìm ngôi nhà mơ ước của bạn', count: 6 },
  upcoming_events: { title: 'Sự Kiện Sắp Tới', subtitle: 'Đừng bỏ lỡ những trải nghiệm tuyệt vời', count: 6 },
  // System page section defaults
  page_breadcrumb: { showHome: true, separator: '»' },
  page_heading: { title: '', subtitle: '', alignment: 'left', tag: 'h1' },
  product_grid: { columns: 4, itemsPerPage: 12, sidebarPosition: 'left', showFilters_category: true, showFilters_brand: true, showFilters_price: true, sortDefault: 'newest', cardStyle: 'default' },
  product_detail_view: { galleryStyle: 'thumbnails', layoutRatio: '50-50', showBreadcrumb: true, showSKU: true, showStock: true, showShare: true },
  product_reviews: { showRatingSummary: true, showWriteReview: true, perPage: 10 },
  related_products: { title: 'Sản phẩm liên quan', count: 6, columns: 4, layoutStyle: 'carousel' },
  cart_summary: { showThumbnails: true, showQuantityControls: true, showCoupon: true, layout: 'full' },
  checkout_form: { layout: 'two-column', showCoupon: true, showNotes: true, showSteps: true },
  auth_form: { allowRegister: true, allowForgotPassword: true, cardMaxWidth: 440, showSocialLogin: false },
  account_dashboard: { sidebarPosition: 'left', showOrders: true, showAddresses: true, showPasswordChange: true },
  order_history: { perPage: 10, showStatus: true },
  blog_listing: { columns: 3, postsPerPage: 9, layout: 'grid', showSidebar: false },
  wishlist_grid: { columns: 4, emptyMessage: 'Chưa có sản phẩm yêu thích' },
}

// ─── Library (now uses sectionMeta from sectionSchemas.js) ───
function addLibrarySection(lib) {
  if (sections.value.some(s => s.type === lib.type)) {
    showToast(t('admin.msg_7dfff8', 'Section đã tồn tại'), 'error')
    return
  }
  const newSection = {
    type: lib.type,
    enabled: true,
    order: sections.value.length,
    params: { ...defaultParams[lib.type] },
    content: [],
  }
  
  // Support insert at specific index (from preview overlay "+" button)
  const insertIdx = addSectionAtInsertIndex.value
  if (insertIdx !== null && insertIdx >= 0 && insertIdx <= sections.value.length) {
    sections.value.splice(insertIdx, 0, newSection)
    sections.value.forEach((s, i) => { s.order = i })
    addSectionAtInsertIndex.value = null
  } else {
    sections.value.push(newSection)
  }
  
  showLibrary.value = false
  expandedSection.value = lib.type
  activeConfig.value = lib.type
}

// ─── Page List ───
const pageList = [
  { key: 'products', label: t('admin.msg_1d1aa192', 'Sản phẩm'), icon: ShoppingBag, path: '/products' },
  { key: 'cart', label: t('admin.msg_6b413a7c', 'Giỏ hàng'), icon: ShoppingCart, path: '/cart' },
  { key: 'account', label: t('admin.msg_7bd53616', 'Tài khoản'), icon: User, path: '/account' },
  { key: 'auth', label: t('admin.msg_9a192725', 'Đăng nhập'), icon: User, path: '/auth' },
  { key: 'order_tracking', label: t('admin.msg_45fc7ddf', 'Tra cứu đơn'), icon: Truck, path: '/order-tracking' },
]

// ─── Templates ───
const templates = [
  { key: 'pharmacy', name: 'Nhà Thuốc / Y Tế', desc: 'Bán lẻ dược phẩm', icon: Store },
  { key: 'fashion', name: 'Thời Trang', desc: 'Quần áo, phụ kiện', icon: Package },
  { key: 'restaurant', name: 'Nhà Hàng / F&B', desc: 'Menu, đặt bàn', icon: BookOpen },
  { key: 'spa', name: 'Spa & Salon', desc: 'Dịch vụ, Đặt lịch', icon: Sparkles },
  { key: 'realestate', name: 'Bất Động Sản', desc: 'Dự án, Tin tức', icon: Image },
]

const activeSections = computed(() =>
  sections.value.filter(s => s.enabled).sort((a, b) => a.order - b.order)
)

function applyTemplate(key) {
  activeTemplate.value = key
  const preset = industryTemplates[key]
  if (preset) {
    if (confirm('Áp dụng mẫu này sẽ ghi đè toàn bộ bố cục trang chủ hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
      pushUndo()
      sections.value = JSON.parse(JSON.stringify(preset))
      showToast('Đã áp dụng mẫu bố cục thành công', 'success')
    }
  }
}

// ─── Live Preview (postMessage-based) ───
const livePreviewBaseUrl = computed(() => {
  if (!storefrontUrl.value) return ''
  let path = ''
  if (activePageId.value) {
    if (String(activePageId.value).startsWith('__')) {
       const mapped = {
         '__products': '/products',
         '__productDetail': '/product/preview-demo',
         '__checkout': '/checkout',
         '__cart': '/cart',
         '__auth': '/auth',
         '__account': '/account',
         '__wishlist': '/wishlist',
         '__order_tracking': '/order-tracking',
         '__blog': '/blog',
         '__template_product_card': '/_builder/template-preview?type=card',
         '__template_blog_card': '/_builder/template-preview?type=card',
       }
       path = mapped[activePageId.value] || ''
    } else {
       const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
       path = dyn?.alias ? `/page/${dyn.alias}` : ''
    }
  }
  return `${storefrontUrl.value}${path}?preview=true`
})

// Payload sent via postMessage to the storefront iframe
const layoutPayload = ref({
  sections: [], pages: {}, customCss: '', template: 'full_store',
  pageConfigs: {}, headerConfig: {}, footerConfig: {}
})

// Debounced preview refresh
let undoTimer
watch([sections, pages, customCss, themeConfig, headerConfig, footerConfig, pageConfigs, promoConfig, activeTemplate, activePageId], () => {
  const tCfg = themeConfig.value
  
  let currentBg = tCfg.backgroundColor || '#ffffff'
  if (activePageId.value) {
    const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
    if (pageConfigs.value[id]?.backgroundColor) {
      currentBg = pageConfigs.value[id].backgroundColor
    }
  }

  // Derive lighter accent for hover/active states
  const accentHex = tCfg.primaryColor || '#6366f1'
  const rr = parseInt(accentHex.slice(1, 3), 16) || 99
  const gg = parseInt(accentHex.slice(3, 5), 16) || 102
  const bb = parseInt(accentHex.slice(5, 7), 16) || 241
  const themeCss = `:root {
  --sf-accent: ${accentHex};
  --sf-accent-light: ${tCfg.accentColor || accentHex};
  --sf-accent-glow: rgba(${rr}, ${gg}, ${bb}, 0.15);
  --sf-accent-gradient: linear-gradient(135deg, ${accentHex}, ${tCfg.accentColor || accentHex});
  --sf-shadow-accent: 0 8px 24px rgba(${rr}, ${gg}, ${bb}, 0.25);
  --sf-bg-primary: ${currentBg};
  --sf-text-primary: ${tCfg.textColor};
  --color-bg-primary: ${currentBg};
  --color-text-primary: ${tCfg.textColor};
  --sf-font-family: ${tCfg.fontFamily};
  --sf-radius: ${tCfg.borderRadius};
  --sf-radius-sm: ${parseInt(tCfg.borderRadius) > 4 ? (parseInt(tCfg.borderRadius) - 4) + 'px' : tCfg.borderRadius};
  --sf-radius-md: ${tCfg.borderRadius};
  --sf-radius-lg: ${parseInt(tCfg.borderRadius) + 4}px;
  --sf-radius-xl: ${parseInt(tCfg.borderRadius) + 8}px;
  --sf-button-radius: ${tCfg.borderRadius};
  --sf-container-width: ${tCfg.containerWidth || '1200px'};
  --sf-button-style: ${tCfg.buttonStyle || 'solid'};
}
body { background: ${currentBg}; color: ${tCfg.textColor}; font-family: ${tCfg.fontFamily}; }
.sf-container { max-width: var(--sf-container-width); margin: 0 auto; padding: 0 16px; }`

  // Update layoutPayload with deep clone to forcefully trigger re-render in LayoutPreviewPanel
  layoutPayload.value = JSON.parse(JSON.stringify({
    sections: sections.value,
    pages: pages.value,
    customCss: themeCss + '\n' + (customCss.value || ''),
    template: activeTemplate.value,
    pageConfigs: pageConfigs.value,
    headerConfig: headerConfig.value,
    footerConfig: footerConfig.value,
    promoConfig: promoConfig.value,
  }))

  // Push undo snapshot on changes (debounced)
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => pushUndo(), 1500)
}, { deep: true, immediate: true })

// ─── Load / Save ───
function ensureParams(sections) {
  return sections.map(s => ({
    ...s,
    params: { ...(defaultParams[s.type] || {}), ...(s.params || {}) },
    content: s.content || [],
  }))
}

async function loadLayout() {
  try {
    const isBuiltin = !!activeBuiltinPage.value
    const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'

    if (activePageId.value && !isBuiltin) {
      const res = await apiFetch(`/cms-pages/${activePageId.value}`)
      const data = await res.json()
      sections.value = ensureParams(data.layout_data || [])
      return
    }

    // ── Try layout-pages API first (new versioned system) ──
    let loadedFromLayoutPages = false
    try {
      const lpRes = await apiFetch('/layout-pages')
      const lpData = await lpRes.json()
      const lpList = lpData.data || []
      
      // 1. Always load Global Meta from 'home' page if it exists
      const homePage = lpList.find(p => p.slug === 'home')
      if (homePage) {
        const detailRes = await apiFetch(`/layout-pages/${homePage.id}`)
        const detail = await detailRes.json()
        const meta = (detail.data || detail).meta || {}
        
        if (meta.pages) pages.value = meta.pages
        if (meta.template) activeTemplate.value = meta.template
        if (meta.customCss) customCss.value = meta.customCss
        if (meta.pageConfigs) {
          pageConfigs.value = {
            products: { ...defaultPageConfigs.products, ...meta.pageConfigs.products, showFilters: { ...defaultPageConfigs.products.showFilters, ...(meta.pageConfigs.products?.showFilters || {}) } },
            productDetail: { ...defaultPageConfigs.productDetail, ...meta.pageConfigs.productDetail },
            checkout: { ...defaultPageConfigs.checkout, ...meta.pageConfigs.checkout },
            auth: { ...defaultPageConfigs.auth, ...meta.pageConfigs.auth },
            account: { ...defaultPageConfigs.account, ...meta.pageConfigs.account },
            blog: { ...defaultPageConfigs.blog, ...(meta.pageConfigs.blog || {}) },
          }
        }
        if (meta.headerConfig) headerConfig.value = { ...defaultHeaderConfig, ...meta.headerConfig }
        if (meta.promoConfig) promoConfig.value = { ...defaultPromoConfig, ...meta.promoConfig }
        if (meta.themeConfig) themeConfig.value = { ...themeConfig.value, ...meta.themeConfig }
        if (meta.footerConfig) {
          const fc = meta.footerConfig
          if (typeof fc.columns === 'number' || !Array.isArray(fc.columns)) {
            footerConfig.value = JSON.parse(JSON.stringify(defaultFooterConfig))
            if (fc.copyrightText) footerConfig.value.copyrightText = fc.copyrightText
          } else {
            footerConfig.value = {
              ...JSON.parse(JSON.stringify(defaultFooterConfig)), ...fc,
              columns: fc.columns || defaultFooterConfig.columns.map(c => ({ ...c })),
              social: fc.social || [], badges: fc.badges || [], paymentMethods: fc.paymentMethods || ['cod', 'bank'],
            }
          }
        }
      }

      // 2. Locate the specific page layout (e.g. 'home', 'blog', 'products')
      const targetPage = lpList.find(p => p.slug === slug)
      if (targetPage) {
        const detailRes = await apiFetch(`/layout-pages/${targetPage.id}`)
        const detail = await detailRes.json()
        const page = detail.data || detail
        layoutPageId.value = page.id
        layoutPageVersion.value = page.version || 0
        layoutPageStatus.value = page.status || 'draft'

        let layoutJson = page.layout_json || []

        if (layoutJson.length === 0 && isBuiltin) {
          // Use dynamic page composition defaults instead of legacy system_page_content
          const pageSlug = getPageSlugFromId(activePageId.value)
          const defaultSecs = getDefaultSectionsForPage(pageSlug)
          if (defaultSecs.length > 0) {
            sections.value = ensureParams(defaultSecs)
          } else {
            sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
          }
        } else {
          sections.value = ensureParams(layoutJson)
        }
        loadedFromLayoutPages = true
      } else if (isBuiltin) {
        // No saved layout yet — generate composable default sections
        layoutPageId.value = null
        const pageSlug = getPageSlugFromId(activePageId.value)
        const defaultSecs = getDefaultSectionsForPage(pageSlug)
        if (defaultSecs.length > 0) {
          sections.value = ensureParams(defaultSecs)
        } else {
          sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
        }
        loadedFromLayoutPages = true
      }
    } catch { /* layout-pages not available, fall back to system-config */ }

    if (loadedFromLayoutPages) return

    // ── Fallback: legacy system-config ──
    const res = await apiFetch('/system-config/group/storefront_layout')
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data.data || [])
    const map = {}
    items.forEach(i => { map[i.key] = i.value })

    const defaultSections = [
      { type: 'banner', enabled: true, order: 0 },
      { type: 'categories', enabled: true, order: 1 },
      { type: 'flash_sale', enabled: true, order: 2 },
      { type: 'featured_products', enabled: true, order: 3 },
      { type: 'new_arrivals', enabled: true, order: 4 },
      { type: 'cms_pages', enabled: true, order: 5 },
    ]
    const defaultPages = { cart: true, account: true, auth: true, order_tracking: true, products: true }

    const parsed = map.layout_sections ? JSON.parse(map.layout_sections) : null
    
    // Legacy fallback: If we are not on the global/home page, legacy system didn't support sections.
    // So we initialize it with default dynamic sections or a sterile fallback to prevent homepage bleed-through.
    if (isBuiltin && slug !== 'home') {
      const pageSlug = getPageSlugFromId(activePageId.value) || slug
      const defaultSecs = getDefaultSectionsForPage(pageSlug)
      if (defaultSecs && defaultSecs.length > 0) {
        sections.value = ensureParams(defaultSecs)
      } else {
        sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
      }
    } else {
      sections.value = ensureParams(parsed || defaultSections)
    }

    pages.value = map.layout_pages ? JSON.parse(map.layout_pages) : defaultPages
    activeTemplate.value = map.layout_template || 'full_store'
    customCss.value = map.layout_custom_css || ''
    // if (map.storefront_url) storefrontUrl.value = map.storefront_url
    const parsedPC = map.layout_page_configs ? JSON.parse(map.layout_page_configs) : null
    if (parsedPC) {
      pageConfigs.value = {
        products: { ...defaultPageConfigs.products, ...parsedPC.products, showFilters: { ...defaultPageConfigs.products.showFilters, ...(parsedPC.products?.showFilters || {}) } },
        productDetail: { ...defaultPageConfigs.productDetail, ...parsedPC.productDetail },
        checkout: { ...defaultPageConfigs.checkout, ...parsedPC.checkout },
        auth: { ...defaultPageConfigs.auth, ...parsedPC.auth },
        account: { ...defaultPageConfigs.account, ...parsedPC.account },
      }
    }
    const parsedHC = map.layout_header_config ? JSON.parse(map.layout_header_config) : null
    if (parsedHC) headerConfig.value = { ...defaultHeaderConfig, ...parsedHC }
    const parsedPC2 = map.layout_promo_config ? JSON.parse(map.layout_promo_config) : null
    if (parsedPC2) promoConfig.value = { ...defaultPromoConfig, ...parsedPC2 }
    const parsedFC = map.layout_footer_config ? JSON.parse(map.layout_footer_config) : null
    if (parsedFC) {
      if (typeof parsedFC.columns === 'number' || !Array.isArray(parsedFC.columns)) {
        footerConfig.value = JSON.parse(JSON.stringify(defaultFooterConfig))
        if (parsedFC.copyrightText) footerConfig.value.copyrightText = parsedFC.copyrightText
      } else {
        footerConfig.value = {
          ...JSON.parse(JSON.stringify(defaultFooterConfig)),
          ...parsedFC,
          columns: parsedFC.columns || defaultFooterConfig.columns.map(c => ({ ...c })),
          social: parsedFC.social || [],
          badges: parsedFC.badges || [],
          paymentMethods: parsedFC.paymentMethods || ['cod', 'bank'],
        }
      }
    }
  } catch {
    sections.value = ensureParams([
      { type: 'banner', enabled: true, order: 0 },
      { type: 'categories', enabled: true, order: 1 },
      { type: 'flash_sale', enabled: true, order: 2 },
      { type: 'featured_products', enabled: true, order: 3 },
      { type: 'new_arrivals', enabled: true, order: 4 },
      { type: 'cms_pages', enabled: true, order: 5 },
    ])
    pages.value = { cart: true, account: true, auth: true, order_tracking: true, products: true }
  }
}

// ─── JSON Import / Export ───
const jsonInputRef = ref(null)

function exportJson() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sections.value, null, 2))
  const downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute("href", dataStr)
  downloadAnchorNode.setAttribute("download", `storefront_sections_${activePageId.value || 'home'}.json`)
  document.body.appendChild(downloadAnchorNode)
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}

function triggerJsonImport() {
  if (jsonInputRef.value) jsonInputRef.value.click()
}

function onJsonImportFile(e) {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (evt) => {
    try {
      const parsed = JSON.parse(evt.target.result)
      if (Array.isArray(parsed)) {
        pushUndo()
        sections.value = parsed
        showToast('Nhập JSON Layout thành công!', 'success')
      } else {
        showToast('Định dạng file không hợp lệ (cần mảng array).', 'error')
      }
    } catch {
      showToast('Lỗi đọc file JSON.', 'error')
    }
  }
  reader.readAsText(file)
  e.target.value = ''
}

// Build the meta object containing all global configs
function buildMeta() {
  return {
    pages: pages.value,
    template: activeTemplate.value,
    customCss: customCss.value,
    storefrontUrl: storefrontUrl.value,
    pageConfigs: pageConfigs.value,
    headerConfig: headerConfig.value,
    footerConfig: footerConfig.value,
    promoConfig: promoConfig.value,
    themeConfig: themeConfig.value,
  }
}

// Ensure a LayoutPage record exists for the active slug, create if needed
async function ensureLayoutPage() {
  if (layoutPageId.value) return layoutPageId.value
  const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'
  try {
    const res = await apiFetch('/layout-pages', {
      method: 'POST',
      body: JSON.stringify({
        slug: slug,
        title: 'Trang ' + slug,
        layout_json: sections.value,
        status: 'draft',
        is_system: true,
        meta: slug === 'home' ? buildMeta() : {},
      }),
    })
    const data = await res.json()
    const page = data.data || data
    layoutPageId.value = page.id
    layoutPageVersion.value = page.version || 0
    layoutPageStatus.value = page.status || 'draft'
    return page.id
  } catch (e) {
    console.warn('[LayoutBuilder] Could not create LayoutPage:', e.message)
    return null
  }
}

async function saveLayout() {
  saving.value = true
  const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'
  const isBuiltin = !!activeBuiltinPage.value
  try {
    // CMS dynamic page (numeric ID) — save layout_data to CMS page
    if (activePageId.value && !activeBuiltinPage.value) {
      await apiFetch(`/cms-pages/${activePageId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ layout_data: sections.value }),
      })
      showToast(t('admin.msg_a593a4', 'Đã lưu bố cục trang CMS'), 'success')
      saving.value = false
      return
    }

    // ── Layout Pages API (versioned) ──
    const pageId = await ensureLayoutPage()
    if (pageId) {
      await apiFetch(`/layout-pages/${pageId}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          layout_json: sections.value,
          note: publishNote.value || null,
        }),
      })
      // Update meta separately, but only for home page so it acts as the global meta
      if (slug === 'home') {
        await apiFetch(`/layout-pages/${pageId}`, {
          method: 'PUT',
          body: JSON.stringify({ meta: buildMeta() }),
        })
      }
      layoutPageVersion.value++
      layoutPageStatus.value = 'published'
      publishNote.value = ''
      showToast(t('admin.msg_32ac40', 'Đã xuất bản bố cục Cửa Hàng') + ` (v${layoutPageVersion.value})`, 'success')
    } else {
      // Fallback to system-config if layout-pages is unavailable
      const itemsToSave = [
        { key: 'layout_pages', value: JSON.stringify(pages.value) },
        { key: 'layout_template', value: activeTemplate.value },
        { key: 'layout_custom_css', value: customCss.value },
        { key: 'layout_page_configs', value: JSON.stringify(pageConfigs.value) },
        { key: 'layout_header_config', value: JSON.stringify(headerConfig.value) },
        { key: 'layout_footer_config', value: JSON.stringify(footerConfig.value) },
        { key: 'layout_promo_config', value: JSON.stringify(promoConfig.value) },
        { key: 'layout_theme_config', value: JSON.stringify(themeConfig.value) },
        { key: 'storefront_url', value: storefrontUrl.value },
      ]
      
      // Legacy layout_sections only stores global homepage data.
      // Do not overwrite it with sterile system wrapper if we are on a builtin page.
      if (!isBuiltin || slug === 'home') {
        itemsToSave.push({ key: 'layout_sections', value: JSON.stringify(sections.value) })
      }

      await apiFetch('/system-config/group/storefront_layout', {
        method: 'PUT',
        body: JSON.stringify({ items: itemsToSave }),
      })
      showToast(t('admin.msg_32ac40', 'Đã xuất bản bố cục Cửa Hàng'), 'success')
    }
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu: ' + e.message, 'error')
  }
  saving.value = false
}

// Show publish dialog (with note input) before publishing
function handlePublish() {
  showPublishDialog.value = true
  publishNote.value = ''
  nextTick(() => publishNoteInput.value?.focus())
}

function confirmPublish() {
  showPublishDialog.value = false
  saveLayout()
}

async function saveDraft() {
  saving.value = true
  try {
    // CMS dynamic page (numeric ID)
    if (activePageId.value && !activeBuiltinPage.value) {
      await apiFetch(`/cms-pages/${activePageId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ layout_data: sections.value }),
      })
      showToast(t('admin.msg_d1cb5f', 'Đã lưu nháp bố cục trang CMS'), 'success')
      saving.value = false
      return
    }

    // ── Layout Pages API (draft) ──
    const pageId = await ensureLayoutPage()
    if (pageId) {
      await apiFetch(`/layout-pages/${pageId}/draft`, {
        method: 'POST',
        body: JSON.stringify({ layout_json: sections.value }),
      })
      // Update meta
      await apiFetch(`/layout-pages/${pageId}`, {
        method: 'PUT',
        body: JSON.stringify({ meta: buildMeta() }),
      })
      layoutPageStatus.value = 'draft'
      showToast(t('admin.msg_b06844', 'Đã lưu nháp'), 'success')
    } else {
      // Fallback to system-config
      await apiFetch('/system-config/group/storefront_layout', {
        method: 'PUT',
        body: JSON.stringify({
          items: [
            { key: 'layout_draft_sections', value: JSON.stringify(sections.value) },
            { key: 'layout_draft_page_configs', value: JSON.stringify(pageConfigs.value) },
            { key: 'layout_draft_header_config', value: JSON.stringify(headerConfig.value) },
            { key: 'layout_draft_footer_config', value: JSON.stringify(footerConfig.value) },
            { key: 'layout_draft_promo_config', value: JSON.stringify(promoConfig.value) },
            { key: 'layout_draft_theme_config', value: JSON.stringify(themeConfig.value) },
          ],
        }),
      })
      showToast(t('admin.msg_b06844', 'Đã lưu nháp'), 'success')
    }
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu nháp: ' + e.message, 'error')
  }
  saving.value = false
}

// Handle rollback from version history
async function onRollback() {
  await loadLayout()
}

async function loadDynamicPages() {
  try {
    const res = await apiFetch('/cms-pages')
    const data = await res.json()
    dynamicPages.value = (Array.isArray(data) ? data : (data.data || [])).filter(p => p.is_dynamic)
  } catch (e) {}
}

// ── Header Nav Links ──
const { links: navLinksRaw, fetchLinks: fetchNavLinks, createLink: createNavLink, updateLink: updateNavLink, deleteLink: deleteNavLinkApi } = useNavLinks(apiFetch)
const navLinks = computed(() => (navLinksRaw.value || []).filter(l => l.group === 'menu' || !l.group).sort((a, b) => (a.sort || 0) - (b.sort || 0)))
const collectionNavLinks = computed(() => (navLinksRaw.value || []).filter(l => l.type === 'collection'))

const showNavLinkModal = ref(false)
const navLinkEditing = ref(null)
const navLinkForm = ref({ name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: 0, group: 'menu' })
const pageSelectMode = ref('builtin')

// CMS pages for page selector
const { pages: cmsPageListRaw, fetchPages: fetchCmsPageList } = useCmsPages(apiFetch)
const cmsPageList = computed(() => (cmsPageListRaw.value || []).filter(p => p.status === 'published' || p.is_published))

function openCreateNavLink() {
  navLinkEditing.value = null
  navLinkForm.value = { name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: navLinks.value.length, group: 'menu' }
  pageSelectMode.value = 'builtin'
  showNavLinkModal.value = true
}
function openEditNavLink(link) {
  navLinkEditing.value = link.id
  navLinkForm.value = { name: link.name, url: link.url || '', type: link.type, target: link.target || '_self', collectionId: link.collectionId || null, sort: link.sort || 0, group: 'menu' }
  // Detect page select mode from URL
  const builtinUrls = ['/', '/products', '/categories', '/brands', '/cart', '/promotions', '/wishlist', '/order-tracking', '/account', '/auth']
  if (builtinUrls.includes(link.url)) pageSelectMode.value = 'builtin'
  else if (link.url?.startsWith('/page/')) pageSelectMode.value = 'cms'
  else pageSelectMode.value = 'custom'
  showNavLinkModal.value = true
}
async function saveNavLink() {
  if (!navLinkForm.value.name) { showToast(t('admin.msg_c2d389', 'Nhập tên link'), 'error'); return }
  try {
    if (navLinkEditing.value) {
      await updateNavLink(navLinkEditing.value, navLinkForm.value)
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await createNavLink(navLinkForm.value)
      showToast(t('admin.msg_a3e59f', 'Đã tạo link'), 'success')
    }
    showNavLinkModal.value = false
    fetchNavLinks()
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}
async function deleteNavLink(link) {
  if (!confirm(`${t('admin.delete', 'Xóa')} link "${link.name}"?`)) return
  await deleteNavLinkApi(link.id)
  fetchNavLinks()
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
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
.cpb-header { display: flex; align-items: center; justify-content: space-between; height: 54px; padding: 0 16px; background: #fff; border-bottom: 1px solid var(--border, #e5e7eb); z-index: 10; font-size: 13px; transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s; }
.cpb--zen .cpb-header { transform: translateY(-100%); opacity: 0; pointer-events: none; position: absolute; width: 100%; }
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
.cpb-viewport button { background: transparent; border: none; padding: 4px 10px; min-width: 32px; height: 28px; display: flex; align-items: center; justify-content: center; color: var(--text-3); border-radius: 4px; cursor: pointer; transition: 0.2s; }
.cpb-viewport button.active, .cpb-btn-icon--active { background: #fff !important; color: var(--accent, #7c3aed) !important; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.cpb-history-container { position: relative; display: flex; align-items: center; justify-content: flex-end; outline: none; }
.cpb-history__btn-group { display: flex; align-items: center; border-radius: 4px; background: transparent; transition: 0.2s; }
.cpb-history__btn-group:hover { background: var(--bg-2, #f3f4f6); }
.cpb-history__btn-group button { border-radius: 4px; }
.cpb-history__btn-group button.history-dropdown-toggle { padding: 0 4px; width: 20px; border-left: 1px solid rgba(0,0,0,0.05); border-top-left-radius: 0; border-bottom-left-radius: 0; }
.cpb-history__btn-group button:first-child { border-top-right-radius: 0; border-bottom-right-radius: 0; }

.history-dropdown-menu { position: absolute; top: 100%; right: 0; margin-top: 8px; background: #fff; width: 260px; border-radius: 8px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); border: 1px solid var(--border); z-index: 100; display: flex; flex-direction: column; overflow: hidden; }
.history-dropdown-header { padding: 12px; font-size: 11px; font-weight: 700; color: var(--text-3); text-transform: uppercase; border-bottom: 1px solid var(--border); background: var(--bg-2); }
.history-dropdown-list { max-height: 280px; overflow-y: auto; display: flex; flex-direction: column; }
.history-dropdown-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; background: none; border: none; border-bottom: 1px solid var(--border); cursor: pointer; text-align: left; transition: 0.2s; }
.history-dropdown-item:last-child { border-bottom: none; }
.history-dropdown-item:hover { background: var(--bg-2); }
.history-dropdown-info { display: flex; flex-direction: column; gap: 2px; }
.history-time { font-size: 11px; color: var(--text-3); font-family: monospace; }
.history-label { font-size: 13px; font-weight: 500; color: var(--text-1); }
.current-state { color: var(--accent); font-weight: 700; }
.history-current-icon { color: var(--accent); }

.cpb-btn-secondary { background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; color: var(--text-2); display: flex; align-items: center; gap: 6px; transition: 0.2s; white-space: nowrap; flex-shrink: 0; }
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); border-color: var(--text-3); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.cpb-btn-secondary--active { background: rgba(124, 58, 237, 0.1) !important; color: var(--accent) !important; border-color: rgba(124, 58, 237, 0.3) !important; }
.cpb-section-shortcut { display: flex; align-items: center; gap: 6px; padding: 7px 10px; margin-bottom: 10px; background: var(--color-bg-secondary, rgba(0,0,0,0.04)); border: 1px solid var(--color-border); border-radius: 8px; font-size: 12px; color: var(--color-text-muted); }
.cpb-section-shortcut span { flex: 1; }
.cpb-shortcut-btn { background: var(--accent, #7c3aed); color: #fff; border: none; padding: 3px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; cursor: pointer; white-space: nowrap; }
.cpb-shortcut-btn:hover { filter: brightness(1.12); }
.cpb-btn-save { background: var(--accent, #7c3aed); color: #fff; border: none; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; cursor: pointer; transition: 0.2s; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; }
C.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }

/* Status badge */
.cpb-status-badge { padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; border: 1px solid transparent; }
.cpb-status-badge--published { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
.cpb-status-badge--draft { background: rgba(245, 158, 11, 0.1); color: #d97706; border-color: rgba(245, 158, 11, 0.2); }
/* Body Area */
.cpb-body { display: flex; flex: 1; overflow: hidden; position: relative; }

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

/* Center Canvas */
.cpb-center { flex: 1; background: var(--bg-2, #f1f5f9); overflow-y: auto; display: flex; flex-direction: column; align-items: center; transition: padding 0.3s; }
.cpb-canvas-wrap { width: 100%; min-height: 100%; background: transparent; display: flex; flex-direction: column; transition: max-width 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); box-sizing: border-box; padding: 24px; }

/* Right Panel — always overlays canvas, never pushes layout */
.cpb-right-backdrop { position: absolute; inset: 0; z-index: 19; cursor: default; }
.cpb-right { width: 360px; background: #fff; border-left: 1px solid var(--border); display: flex; flex-direction: column; transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1); position: absolute; right: 0; top: 0; height: 100%; z-index: 20; box-shadow: -6px 0 32px rgba(0,0,0,0.10); }
.cpb-right:not(.cpb-right--open) { transform: translateX(100%); pointer-events: none; }
.cpb-prop-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); background: #fff; }
.cpb-prop-header h4 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text-1); }
.cpb-prop-header button { background: none; border: none; cursor: pointer; color: var(--text-3); padding: 4px; border-radius: 4px; }
.cpb-prop-header button:hover { background: #fff; color: var(--text-1); box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
.cpb-prop-body { flex: 1; display:flex; flex-direction: column; }

/* Shared forms */
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.param-input { width: 100%; padding: 8px 10px; font-size: 13px; border: 1px solid var(--border); border-radius: 6px; outline: none; transition: 0.2s; background: #fff; color: var(--text-1); }
.param-input:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(124,58,237,0.1); }
.param-input--wide { width: 100%; }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-1); }

/* Param Controls */
.param-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 6px 0; font-size: 13px; color: var(--text-2); }
.param-row label:first-child { font-weight: 600; white-space: nowrap; min-width: 80px; }
.param-divider { height: 1px; background: var(--border); margin: 12px 0; }
.param-select { padding: 8px 10px; border: 1px solid var(--border); border-radius: 6px; background: #fff; color: var(--text-1); font-size: 13px; width: 100%; outline: none; }
.param-select:focus { border-color: var(--accent); box-shadow: 0 0 0 2px rgba(124,58,237,0.1); }
.param-range { flex: 1; accent-color: var(--accent); }
.param-value { font-weight: 700; color: var(--accent); min-width: 24px; text-align: right; }

/* Templates Grid */
.template-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
.template-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border-radius: 12px; border: 2px solid var(--border); background: #fff; cursor: pointer; transition: all 0.2s; color: var(--text-2); text-align: center; }
.template-card:hover { border-color: var(--accent); color: var(--text-1); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.template-card.active { border-color: var(--accent); background: rgba(124,58,237,0.05); color: var(--accent); }
.template-card__name { font-size: 12px; font-weight: 700; }
.template-card__desc { font-size: 11px; color: var(--text-3); }

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
.library-grid-sidebar { display: flex; flex-direction: column; gap: 8px; }
.library-card-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 1px solid var(--border); border-radius: 8px; text-align: left; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.library-card-row:hover:not(.library-card-row--disabled) { border-color: var(--accent); background: rgba(99,102,241,0.02); }
.library-card-row__icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(99,102,241,0.08); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.library-card-row--disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }
.library-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; cursor: pointer; outline: none; position: relative; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.library-card:hover:not(.library-card--disabled) { border-color: var(--accent); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.library-card__icon { color: var(--accent); opacity: 0.8; }
.library-card strong { font-size: 13px; color: var(--text-1); }
.library-card__desc { font-size: 11px; color: var(--text-3); line-height: 1.4; }
.library-card.added { border-color: var(--accent); background: rgba(124,58,237,0.03); opacity: 0.7; }
.library-card__badge { position: absolute; top: -8px; right: -8px; font-size: 10px; font-weight: 700; background: var(--accent); color: #fff; padding: 2px 6px; border-radius: 12px; }
.library-card--disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }
.btn-close { background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-3); }

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

.spin { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }
</style>

<style>
/* 
 * Global Control Panel Utilities for Child Components 
 * Defines sleek inputs, toggles, selects, and grids for builder configs.
 */
.lb-section {
  font-family: 'Inter', sans-serif;
  color: #334155;
  margin-bottom: 24px;
}
.lb-section__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  margin: 0 0 16px 0;
  color: #0f172a;
}
.lb-section__hint {
  font-size: 13px;
  color: #64748b;
  margin: 0 0 16px 0;
  line-height: 1.5;
}
.param-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}
.param-row label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  white-space: nowrap;
}
.param-input, .param-select {
  flex: 1;
  min-width: 0;
  padding: 8px 12px;
  background: #f8fafc;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  color: #0f172a;
  transition: all 0.2s;
}
.param-input:focus, .param-select:focus {
  outline: none;
  border-color: #3b82f6;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
.param-range {
  flex: 1;
  accent-color: #3b82f6;
  height: 4px;
  border-radius: 4px;
  background: #e2e8f0;
  outline: none;
}
.param-value {
  font-size: 12px;
  font-weight: 700;
  color: #64748b;
  min-width: 24px;
  text-align: right;
}
.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  cursor: pointer;
  display: inline-block;
  margin: 0;
  flex-shrink: 0;
}
.toggle-switch--sm {
  width: 32px;
  height: 18px;
}
.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
}
.toggle-slider {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #cbd5e1;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 24px;
}
.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: #ffffff;
  transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.toggle-switch--sm .toggle-slider:before {
  height: 14px;
  width: 14px;
}
.toggle-switch input:checked + .toggle-slider {
  background-color: #3b82f6;
}
.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(18px);
}
.toggle-switch--sm input:checked + .toggle-slider:before {
  transform: translateX(14px);
}
.param-divider {
  height: 1px;
  background: #e2e8f0;
  margin: 20px 0;
}
.param-color {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  background: transparent;
  transition: transform 0.2s;
}
.param-color:hover {
  transform: scale(1.05);
}
</style>
