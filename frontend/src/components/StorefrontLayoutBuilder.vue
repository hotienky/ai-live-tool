<template>
  <div class="layout-builder">
    <div class="layout-builder__header">
      <div style="display: flex; align-items: center; gap: 16px;">
        <h3><LayoutDashboard :size="16" /> {{ t('admin.msg_a5e87377', 'Bố cục Cửa Hàng') }}</h3>
        <!-- Custom page picker dropdown -->
        <div class="page-picker" tabindex="-1" @focusout="handlePickerFocusout">
          <button class="page-picker__trigger" @click="pageDropdownOpen = !pageDropdownOpen">
            <component :is="activePage.icon" :size="14" />
            <span>{{ activePage.label }}</span>
            <ChevronDown :size="12" :style="{ transform: pageDropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }" />
          </button>
          <div v-if="pageDropdownOpen" class="page-picker__menu">
            <!-- Homepage -->
            <button class="page-picker__item" :class="{ active: activePageId === null }" @click="selectPage(null)">
              <Home :size="14" />{{ t('admin.msg_af830e1f', 'Trang Chủ (Global)') }}</button>
            <!-- System pages -->
            <div class="page-picker__group">{{ t('admin.msg_34dfec84', 'Trang hệ thống') }}</div>
            <button v-for="pg in builtinPageOptions" :key="pg.id"
              class="page-picker__item" :class="{ active: activePageId === pg.id }"
              @click="selectPage(pg.id)">
              <component :is="pg.icon" :size="14" />
              <span>{{ pg.label }}</span>
            </button>
            <!-- CMS dynamic pages -->
            <template v-if="dynamicPages.length">
              <div class="page-picker__group">{{ t('admin.msg_a4de04ad', 'Trang CMS động') }}</div>
              <button v-for="p in dynamicPages" :key="p.id"
                class="page-picker__item" :class="{ active: activePageId === p.id }"
                @click="selectPage(p.id)">
                <FileText :size="14" /> {{ p.title }}
              </button>
            </template>
          </div>
        </div>
      </div>
      <div class="layout-builder__header-actions">
        <!-- Status badge -->
        <span v-if="layoutPageVersion" class="lb-status-badge" :class="'lb-status-badge--' + layoutPageStatus">
          v{{ layoutPageVersion }} · {{ layoutPageStatus === 'published' ? '✅ Published' : '📝 Draft' }}
        </span>
        <button v-if="layoutPageId" class="btn-preview-toggle" @click="showVersionHistory = true" :data-tooltip="t('admin.msg_vh_title', 'Lịch sử phiên bản')">
          <History :size="14" /> {{ t('admin.msg_vh_short', 'Versions') }}
        </button>
        <button class="btn-preview-toggle" @click="previewMode = previewMode === 'wireframe' ? 'live' : 'wireframe'">
          <Monitor v-if="previewMode === 'wireframe'" :size="14" />
          <Eye v-else :size="14" />
          {{ previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe' }}
        </button>
        <button class="btn-preview-toggle" @click="startTour" :data-tooltip="t('admin.tour', 'Hướng dẫn')">
          <HelpCircle :size="14" /> {{ t('admin.tour', 'Hướng dẫn') }}
        </button>
        <div class="undo-redo-group" style="display:flex; gap:4px; margin-right: 12px; border-right: 1px solid rgba(255,255,255,0.1); padding-right: 12px">
          <button class="btn-preview-toggle" @click="undo" :disabled="undoStack.length <= 1" :data-tooltip="t('admin.undo', 'Hoàn tác (Ctrl+Z)')">
            <Undo2 :size="14" />
          </button>
          <button class="btn-preview-toggle" @click="redo" :disabled="redoStack.length === 0" :data-tooltip="t('admin.redo', 'Làm lại (Ctrl+Shift+Z)')">
            <Redo2 :size="14" />
          </button>
        </div>
        <button class="btn-save btn-save--draft" @click="saveDraft" :disabled="saving" :data-tooltip="t('admin.save_draft', 'Lưu nháp')" >
          <FileEdit :size="14" /> {{ t('admin.msg_867cf3b9', 'Nháp') }}
        </button>
        <button class="btn-save" @click="handlePublish" :disabled="saving">
          <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.msg_723f4d22', 'Xuất bản') }}
        </button>
      </div>
    </div>

    <div class="layout-builder__body" :class="{ 'layout-builder__body--collapsed': controlsCollapsed }">
      <!-- Left: Controls -->
      <div class="layout-builder__controls" :class="{ 'layout-builder__controls--collapsed': controlsCollapsed }">

        <!-- Theme Config -->
        <LayoutThemeConfig v-model="themeConfig" />
        
        <!-- Templates -->
        <div class="lb-section" v-show="!activePageId">
          <h4 class="lb-section__title"><Palette :size="14" /> {{ t('admin.msg_34b3019f', 'Mẫu bố cục') }}</h4>
          <div class="template-grid">
            <button
              v-for="tpl in templates"
              :key="tpl.key"
              class="template-card"
              :class="{ active: activeTemplate === tpl.key }"
              @click="applyTemplate(tpl.key)"
            >
              <component :is="tpl.icon" :size="20" />
              <span class="template-card__name">{{ tpl.name }}</span>
              <span class="template-card__desc">{{ tpl.desc }}</span>
            </button>
          </div>
        </div>

        <!-- AI Generate Layout -->
        <div class="lb-section">
          <h4 class="lb-section__title lb-section__title--ai">
            <Sparkles :size="14" /> AI Tạo layout
            <button class="lb-ai-toggle" @click="showAiPanel = !showAiPanel">
              {{ showAiPanel ? '▲' : '▼' }}
            </button>
          </h4>
          <transition name="expand">
            <div v-if="showAiPanel" class="lb-ai-panel">
              <textarea
                v-model="aiPrompt"
                class="lb-ai-textarea"
                rows="3"
                placeholder="Mô tả trang bạn muốn tạo... VD: Trang giới thiệu công ty sản xuất nội thất, có phần về chúng tôi, đội ngũ, FAQ và form liên hệ"
              />
              <button class="lb-ai-btn" @click="generateLayout" :disabled="aiLoading || !aiPrompt.trim()">
                <component :is="aiLoading ? 'Loader2' : 'Sparkles'" :size="13" :class="{ spin: aiLoading }" style="margin-right:4px"/>
                {{ aiLoading ? 'Đang tạo...' : 'Tạo layout bằng AI' }}
              </button>
              <p class="lb-ai-hint">AI sẽ tạo các sections phù hợp. Bạn có thể chỉnh sửa sau.</p>
            </div>
          </transition>
        </div>

        <!-- Sections heading -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Rows3 :size="14" /> {{ activeBuiltinPage ? t('admin.msg_ff9d51ad', 'Cấu hình trang') : (activePageId ? (activeTemplatePage ? 'Thiết kế ' + builtinPageOptions.find(p=>p.id===activePageId)?.label : 'Sections trong trang') : t('admin.msg_f6791831', 'Sections trang chủ')) }}</h4>
          <!-- Builtin page config panel: shown instead of sections list -->
          <div v-if="activeBuiltinPage" class="builtin-page-config">
            <!-- Language Tabs for i18n -->
            <LanguageTabs v-model="builtinPageLang" :fields="['pageTitle', 'pageDescription']"
              :translations="pageConfigs[activeBuiltinPage]?.translations || {}"
              :base-data="{ pageTitle: pageConfigs[activeBuiltinPage]?.pageTitle || '', pageDescription: pageConfigs[activeBuiltinPage]?.pageDescription || '' }" />
            <!-- i18n Fields: Page Title & Description -->
            <div class="param-row"><label>{{ t('admin.msg_6a336630', 'Tiêu đề trang') }}</label>
              <input type="text" class="param-input param-input--wide"
                :value="getPageConfigI18n(activeBuiltinPage, 'pageTitle')"
                @input="setPageConfigI18n(activeBuiltinPage, 'pageTitle', $event.target.value)"
                :placeholder="t('admin.msg_4ee531', 'Nhập tiêu đề trang...')" />
            </div>
            <div class="param-row"><label>{{ t('admin.msg_4271c430', 'Mô tả trang') }}</label>
              <input type="text" class="param-input param-input--wide"
                :value="getPageConfigI18n(activeBuiltinPage, 'pageDescription')"
                @input="setPageConfigI18n(activeBuiltinPage, 'pageDescription', $event.target.value)"
                :placeholder="t('admin.msg_a5e916', 'Nhập mô tả trang (tuỳ chọn)...')" />
            </div>
            <div class="param-divider"></div>
            <!-- Products -->
            <template v-if="activeBuiltinPage === 'products'">
              <div class="param-row"><label>Sidebar</label>
                <select v-model="pageConfigs.products.sidebarPosition" class="param-select">
                  <option value="left">{{ t('admin.msg_c8b3d56a', 'Bên trái') }}</option>
                  <option value="right">{{ t('admin.msg_5fe4c314', 'Bên phải') }}</option>
                  <option value="hidden">{{ t('admin.hidden', 'Ẩn') }}</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_70c4bd9c', 'Cột sản phẩm') }}</label>
                <input type="range" v-model.number="pageConfigs.products.gridColumns" min="2" max="5" class="param-range" />
                <span class="param-value">{{ pageConfigs.products.gridColumns }}</span>
              </div>
              <div class="param-row"><label>SP / trang</label>
                <select v-model.number="pageConfigs.products.itemsPerPage" class="param-select">
                  <option :value="8">8</option>
                  <option :value="12">12</option>
                  <option :value="16">16</option>
                  <option :value="24">24</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_8b94f081', 'Filter danh mục') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.category" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_f1e9d92a', 'Filter thương hiệu') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.brand" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_5911a898', 'Filter giá') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.price" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Product Detail -->
            <template v-else-if="activeBuiltinPage === 'productDetail'">
              <div class="param-row"><label>Gallery</label>
                <select v-model="pageConfigs.productDetail.galleryStyle" class="param-select">
                  <option value="thumbnails">Thumbnail</option>
                  <option value="grid">Grid</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_ccb9de7c', 'Tỷ lệ layout') }}</label>
                <select v-model="pageConfigs.productDetail.layoutRatio" class="param-select">
                  <option value="50-50">50 / 50</option>
                  <option value="60-40">60 / 40</option>
                  <option value="40-60">40 / 60</option>
                </select>
              </div>
              <div class="param-row"><label>Breadcrumb</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showBreadcrumb" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_e13f0279', 'SP liên quan') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showRelatedProducts" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row" v-if="pageConfigs.productDetail.showRelatedProducts"><label>{{ t('admin.msg_ec3a77bd', 'Số SP liên quan') }}</label>
                <input type="range" v-model.number="pageConfigs.productDetail.relatedCount" min="4" max="8" class="param-range" />
                <span class="param-value">{{ pageConfigs.productDetail.relatedCount }}</span>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_b4292de3', 'Đánh giá') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showReviews" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Checkout -->
            <template v-else-if="activeBuiltinPage === 'checkout'">
              <div class="param-row"><label>Layout</label>
                <select v-model="pageConfigs.checkout.layout" class="param-select">
                  <option value="two-column">{{ t('admin.msg_74022a2a', '2 cột (Form + Tóm tắt)') }}</option>
                  <option value="single-column">{{ t('admin.msg_af1ea0d8', '1 cột') }}</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.coupons', 'Mã giảm giá') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showCoupon" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_4112edd6', 'Ghi chú đơn hàng') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showNotes" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_d45a2712', 'Thanh tiến trình') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showSteps" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Auth -->
            <template v-else-if="activeBuiltinPage === 'auth'">
              <div class="param-row"><label>{{ t('admin.msg_ae6ecd90', 'Cho phép đăng ký') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.auth.allowRegister" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.forgot_password', 'Quên mật khẩu') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.auth.allowForgotPassword" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_cc7930fc', 'Chiều rộng card (px)') }}</label>
                <input type="range" v-model.number="pageConfigs.auth.cardMaxWidth" min="360" max="600" step="20" class="param-range" />
                <span class="param-value">{{ pageConfigs.auth.cardMaxWidth }}px</span>
              </div>
            </template>
            <!-- Account -->
            <template v-else-if="activeBuiltinPage === 'account'">
              <div class="param-row"><label>Sidebar</label>
                <select v-model="pageConfigs.account.sidebarPosition" class="param-select">
                  <option value="left">{{ t('admin.msg_c8b3d56a', 'Bên trái') }}</option>
                  <option value="right">{{ t('admin.msg_5fe4c314', 'Bên phải') }}</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_d2cb3ed8', 'Tab đơn hàng') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showOrders" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_af2289fd', 'Tab địa chỉ') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showAddresses" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>{{ t('admin.msg_62376787', 'Tab đổi mật khẩu') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showPasswordChange" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Other built-in pages: just show a note -->
            <template v-else>
              <div class="builtin-page-note">
                <span>{{ t('admin.msg_b2562e29', 'Trang này hiện không có cấu hình tuỳ chỉnh.') }}<br/>{{ t('admin.msg_5548b9fe', 'Bật/tắt trang trong') }} <strong>{{ t('admin.msg_af830e1f', 'Trang Chủ (Global)') }}</strong> {{ t('admin.msg_ee37e787', '→ Trang sẵn có.') }}</span>
              </div>
            </template>
            <button class="btn-save" style="margin-top:16px;width:100%" @click="saveLayout" :disabled="saving">
              <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save_config', 'Lưu cấu hình') }}
            </button>
          </div>
          <!-- Structrual Page Layout -->
          <div class="lb-page-structure">
            <!-- HEADER -->
            <div class="lb-structure-item lb-structure-header" @click="showSiteConfig = true; siteConfigTab = 'header'">
              <div class="lb-structure-item__drag"></div>
              <PanelTop :size="16" class="lb-structure-item__icon" />
              <div class="lb-structure-item__content">
                <span class="lb-structure-item__title">Header</span>
                <span class="lb-structure-item__subtitle">{{ t('admin.global_element', 'Thay đổi áp dụng toàn cục') }}</span>
              </div>
              <button class="btn-icon-soft"><Settings :size="14"/></button>
            </div>

            <!-- BODY SECTIONS -->
            <div class="lb-structure-body">
              <div class="lb-structure-body__label" style="display:flex; justify-content:space-between; align-items:center;">
                <span>Nội dung trang</span>
                <div class="navigator-tabs" style="display:flex;background:var(--color-bg-card-hover, rgba(0,0,0,0.05));border-radius:4px;overflow:hidden;border:1px solid var(--color-border)">
                  <button :class="{ active: activeSidebarTab === 'elements' }" @click="activeSidebarTab = 'elements'" style="padding:4px 8px;font-size:10px;border:none;background:transparent;cursor:pointer;color:var(--color-text-muted)" :style="activeSidebarTab==='elements'?'background:#3b82f6;color:#fff':''">Elements</button>
                  <button :class="{ active: activeSidebarTab === 'navigator' }" @click="activeSidebarTab = 'navigator'" style="padding:4px 8px;font-size:10px;border:none;background:transparent;cursor:pointer;color:var(--color-text-muted)" :style="activeSidebarTab==='navigator'?'background:#a855f7;color:#fff':''">Layers</button>
                </div>
              </div>
              <LayoutSectionManager
                v-if="activeSidebarTab === 'elements'"
                v-model:sections="sections"
                :section-meta="sectionMeta"
                :all-categories="allCategories"
                @open-block-editor="s => showBlockEditorFor = s"
              />
              <LayoutNavigator
                v-if="activeSidebarTab === 'navigator'"
                :sections="sections"
                :expanded-section="expandedSection"
                @select-node="handleNavigatorSelect"
              />
              
              <!-- Add Section Button -->
              <button class="btn-add-section" @click="showLibrary = true">
                <Plus :size="14" /> {{ t('admin.msg_09acbe8c', 'Thêm section') }}
              </button>
            </div>

            <!-- FOOTER -->
            <div class="lb-structure-item lb-structure-footer" @click="showSiteConfig = true; siteConfigTab = 'footer'">
              <div class="lb-structure-item__drag"></div>
              <PanelBottom :size="16" class="lb-structure-item__icon" />
              <div class="lb-structure-item__content">
                <span class="lb-structure-item__title">Footer</span>
                <span class="lb-structure-item__subtitle">{{ t('admin.global_element', 'Thay đổi áp dụng toàn cục') }}</span>
              </div>
              <button class="btn-icon-soft"><Settings :size="14"/></button>
            </div>
          </div>
        </div>

        <!-- Page Toggles -->
        <div class="lb-section" v-show="!activePageId">
          <h4 class="lb-section__title"><FileStack :size="14" /> {{ t('admin.msg_6a466765', 'Trang sẵn có') }}</h4>
          <div class="page-toggle-list">
            <div v-for="pg in pageList" :key="pg.key" class="page-toggle-item">
              <div class="page-toggle-item__info">
                <component :is="pg.icon" :size="14" />
                <span>{{ pg.label }}</span>
                <code class="page-toggle-item__path">{{ pg.path }}</code>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" v-model="pages[pg.key]" />
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Page Configs (sub-component) -->
        <LayoutPageConfigs
          :page-configs="pageConfigs"
          :active-page-id="activePageId"
          @update:page-configs="v => pageConfigs = v"
        />

        <!-- CMS Pages Management (integrated from CMS plugin) -->
        <LayoutPageManager
          :active-page-id="activePageId"
          @select-page="selectPage"
          @pages-updated="loadDynamicPages"
        />

        <!-- PromoBar Config -->
        <div v-if="activePageId === null" class="layout-section layout-section--global">
          <div class="layout-section__header" @click="promoOpen = !promoOpen">
            <span><Megaphone :size="14" style="margin-right:4px"/> {{ t('admin.msg_223e2d8a', 'Thanh thông báo (Promo Bar)') }}</span>
            <ChevronDown :size="14" :class="{ 'rotate-180': promoOpen }" />
          </div>
          <div v-if="promoOpen" class="layout-section__body">
            <label class="toggle-row">
              <input type="checkbox" v-model="promoConfig.enabled" />
              <span>{{ t('admin.msg_59d67c84', 'Hiển thị thanh thông báo') }}</span>
            </label>
            <div class="form-group" v-if="promoConfig.enabled">
              <label>{{ t('admin.msg_ee7ca513', 'Nội dung') }}</label>
              <input v-model="promoConfig.text" :placeholder="t('admin.msg_7d1920', 'Miễn phí vận chuyển cho đơn từ 500K — Mua ngay!')" />
            </div>
            <div class="form-group" v-if="promoConfig.enabled">
              <label>Link</label>
              <input v-model="promoConfig.link" placeholder="/products" />
            </div>
            <div class="form-group" v-if="promoConfig.enabled">
              <label>{{ t('admin.msg_f4c6e2c7', 'Nút CTA') }}</label>
              <input v-model="promoConfig.ctaText" :placeholder="t('admin.msg_5176f4', 'Mua sắm')" />
            </div>
          </div>
        </div>

        <!-- Header Config (sub-component) -->
        <LayoutHeaderConfig
          :header-config="headerConfig"
          :active-page-id="activePageId"
          @update:header-config="v => headerConfig = v"
        />

        <!-- Footer Config (sub-component) -->
        <LayoutFooterConfig
          :footer-config="footerConfig"
          :active-page-id="activePageId"
          @update:footer-config="v => footerConfig = v"
        />

        <!-- Custom CSS -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Code :size="14" /> {{ t('admin.msg_95723574', 'CSS tùy chỉnh') }}</h4>
          <textarea
            v-model="customCss"
            class="css-editor"
            rows="6"
            placeholder="/* Custom CSS cho storefront */&#10;.home-page { }&#10;.product-grid { }"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Toggle button between panels -->
      <button class="lb-controls-toggle" @click="controlsCollapsed = !controlsCollapsed" :data-tooltip="controlsCollapsed ? 'Mở menu' : 'Đóng menu'">
        <ChevronLeft :size="14" :style="{ transform: controlsCollapsed ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }" />
      </button>

      <!-- Right: Preview (sub-component) -->
      <LayoutPreviewPanel
        ref="previewPanelRef"
        :preview-mode="previewMode"
        v-model:preview-width="previewWidth"
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

    <!-- Hidden MediaPicker for Inline Overlay Actions -->
    <MediaPicker
      ref="globalImagePicker"
      style="display: none"
      :modelValue="''"
      @update:modelValue="onGlobalImagePicked"
    />

    <!-- Section Library Modal (Phase 3) -->
    <div class="modal-overlay" v-if="showLibrary" @click.self="showLibrary = false">
      <div class="modal modal--library">
        <div class="modal__header">
          <h3><Layers :size="16" /> {{ t('admin.msg_c989002c', 'Thư viện Section') }}</h3>
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
                :class="{
                  added: sections.some(s => s.type === lib.type),
                  'library-card--disabled': !lib.available
                }"
                @click="lib.available ? addLibrarySection(lib) : null"
                :disabled="!lib.available"
              >
                <span class="library-card__icon"><component :is="sectionIconMap[lib.icon] || Box" :size="22" /></span>
                <strong>{{ lib.label }}</strong>
                <span class="library-card__desc">{{ lib.description }}</span>
                <span v-if="lib.moduleId && lib.available" class="library-card__module">{{ lib.moduleId }}</span>
                <span v-if="!lib.available" class="library-card__unavailable"><AlertCircle :size="12" /> Module "{{ lib.moduleId }}" chưa cài</span>
                <span v-else-if="sections.some(s => s.type === lib.type)" class="library-card__badge">{{ t('admin.msg_606e67a5', 'Đã thêm') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Visual Builder Modal -->
    <div class="modal-overlay modal-overlay--full" v-if="showBlockEditorFor" @click.self="showBlockEditorFor = null">
      <div class="modal modal--full" style="width: 100vw; height: 100vh; max-width: none; border-radius: 0; display: flex; flex-direction: column;">
        <div class="modal__header" style="flex-shrink: 0; background: var(--bg-2);">
          <h3><Paintbrush :size="16" /> Visual Builder (Custom Block)</h3>
          <button class="btn-close" @click="showBlockEditorFor = null"><X :size="18" /></button>
        </div>
        <div class="modal__body" style="padding: 0; flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-1);">
          <BlockEditor v-model="showBlockEditorFor.content" />
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

    <!-- Publish Note Dialog -->
    <div v-if="showPublishDialog" class="modal-overlay" @click.self="showPublishDialog = false">
      <div class="publish-dialog">
        <h3><Package :size="16" style="margin-right:4px"/> {{ t('admin.msg_pub_title', 'Xuất bản layout') }}</h3>
        <p class="publish-dialog__desc">{{ t('admin.msg_pub_desc', 'Ghi chú cho lần publish này (tuỳ chọn)') }}</p>
        <input
          v-model="publishNote"
          class="param-input param-input--wide"
          :placeholder="t('admin.msg_pub_placeholder', 'VD: Cập nhật banner Tết, thêm section FAQ...')"
          @keyup.enter="confirmPublish"
          ref="publishNoteInput"
        />
        <div class="publish-dialog__actions">
          <button class="btn-cancel-hl" @click="showPublishDialog = false">{{ t('admin.cancel', 'Huỷ') }}</button>
          <button class="btn-save" @click="confirmPublish" :disabled="saving">
            <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.msg_723f4d22', 'Xuất bản') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Visual Builder Library Overlay -->
    <Teleport to="body">
      <div v-if="showVisualBuilderPro" style="position:fixed;top:0;left:0;right:0;bottom:0;z-index:999999;background:#000;">
        <VisualBuilder
           :initial-data="sections"
           :canvas-url="livePreviewBaseUrl"
           @update:data="val => sections = val"
           @save="saveDraft"
        >
           <template #header-left>
             <button @click="showVisualBuilderPro = false" class="vvb-btn-text" style="color:#ef4444; font-size:13px; font-weight:700">← Đóng / Về Admin Mở Rộng</button>
           </template>
           <template #header-right>
             <button @click="saveDraft(); showVisualBuilderPro = false" class="vvb-btn-text" style="background:#6366f1;color:#fff; padding:6px 14px; font-size:13px">
               <Save :size="14" style="margin-right:2px"/> Lưu Mọi Chỉnh Sửa
             </button>
           </template>
           <template #properties="{ sectionId }">
             <div v-if="sectionId === '__header'" style="padding:16px; background:#fff; color:#000; border-radius:8px; margin:16px; overflow:auto; max-height: calc(100vh - 80px);">
                <h4 style="margin:0 0 16px;font-size:14px;border-bottom:1px solid #eee;padding-bottom:8px;">Cấu hình Header</h4>
                <LayoutHeaderConfig :header-config="headerConfig" :active-page-id="null" @update:header-config="v => headerConfig = v" />
             </div>
             <div v-else-if="sectionId === '__footer'" style="padding:16px; background:#fff; color:#000; border-radius:8px; margin:16px; overflow:auto; max-height: calc(100vh - 80px);">
                <h4 style="margin:0 0 16px;font-size:14px;border-bottom:1px solid #eee;padding-bottom:8px;">Cấu hình Footer</h4>
                <LayoutFooterConfig :footer-config="footerConfig" :active-page-id="null" @update:footer-config="v => footerConfig = v" />
             </div>
             <div v-else-if="sectionId === '__promo'" style="padding:16px; background:#fff; color:#000; border-radius:8px; margin:16px; overflow:auto; max-height: calc(100vh - 80px);">
                <h4 style="margin:0 0 16px;font-size:14px;border-bottom:1px solid #eee;padding-bottom:8px;">Cấu hình Promo Bar</h4>
                <label class="toggle-row" style="margin-bottom:12px;display:flex;align-items:center;gap:8px;">
                  <input type="checkbox" v-model="promoConfig.enabled" />
                  <span style="font-size:13px;">Hiển thị thanh thông báo</span>
                </label>
                <div v-if="promoConfig.enabled">
                  <div class="form-group" style="margin-bottom:12px;">
                    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Nội dung</label>
                    <input v-model="promoConfig.text" class="param-input" style="width:100%;padding:6px 10px;border:1px solid #ccc;border-radius:4px;" />
                  </div>
                  <div class="form-group" style="margin-bottom:12px;">
                    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Link</label>
                    <input v-model="promoConfig.link" class="param-input" style="width:100%;padding:6px 10px;border:1px solid #ccc;border-radius:4px;" />
                  </div>
                  <div class="form-group" style="margin-bottom:12px;">
                    <label style="font-size:12px;font-weight:600;display:block;margin-bottom:4px;">Nút CTA</label>
                    <input v-model="promoConfig.ctaText" class="param-input" style="width:100%;padding:6px 10px;border:1px solid #ccc;border-radius:4px;" />
                  </div>
                </div>
             </div>
             <StyleControlPanel v-else :sectionId="sectionId" />
           </template>
        </VisualBuilder>
      </div>
    </Teleport>
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
      { popover: { title: 'Chào mừng bạn đến với Mebifarm Builder', description: 'Trang bị engine nâng cấp mới nhất, giờ đây bạn có thể trực tiếp tuỳ chỉnh từng thẻ HTML (Text, Image, Button, Grid) như Webflow.' } },
      { element: '.element-palette', popover: { title: '1. Element Palette (Khối Sơ Cấp)', description: 'Đây là bộ nguyên liệu gốc. Bạn có thể kéo thả bất kỳ Container, Text, Image, Button từ đây thả ngẫu nhiên vào Canvas hoặc vào sơ đồ Layout Tree.' } },
      { element: '.lb-structure-body', popover: { title: '2. Cây Thư Mục (Layout Tree)', description: 'Nơi quản lý cấu trúc dọc của các thẻ. Bạn có thể kéo thả để re-order khối nhỏ ngẫu nhiên, hay nhấp chọn 1 phần tử.' } },
      { element: '.layout-builder__preview', popover: { title: '3. Live Canvas', description: 'Trình xem trước trang Storefront. Rê chuột vào nội dung nào sẽ tự bôi khung ngay đó. Nhấp trái 1 cái để chỉnh CSS nâng cao ngay lập tức.' } },
      { element: '.lb-controls-toggle', popover: { title: '4. Panel Thu Gọn', description: 'Bấm vào nút này để ẩn giao diện Layout dọc, nhường không gian cho Canvas to hơn.' } },
      { element: '.preview-responsive', popover: { title: '5. Responsive View', description: 'Góc tinh chỉnh Mobile / Tablet. Mọi kích thước màn hình đều có thể chỉnh sửa tại Viewport này.' } }
    ]
  });
  driverObj.drive();
}

import { ref, computed, onMounted, watch, nextTick, inject } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import LayoutThemeConfig from './storefront/LayoutThemeConfig.vue'
import LayoutHeaderConfig from './storefront/LayoutHeaderConfig.vue'
import LayoutFooterConfig from './storefront/LayoutFooterConfig.vue'
import LayoutPageConfigs from './storefront/LayoutPageConfigs.vue'
import LayoutSectionManager from './storefront/LayoutSectionManager.vue'
import LayoutNavigator from './storefront/LayoutNavigator.vue'
import LayoutPreviewPanel from './storefront/LayoutPreviewPanel.vue'
import LayoutVersionHistory from './storefront/LayoutVersionHistory.vue'
import LayoutPageManager from './storefront/LayoutPageManager.vue'
import LanguageTabs from './LanguageTabs.vue'
import BlockEditor from './builder/BlockEditor.vue'
import MediaPicker from './MediaPicker.vue'
import { VisualBuilder, BuilderRegistry, StyleControlPanel } from '../lib/vue-visual-builder'
import { useToast } from '../composables/useToast.js'
import {
  LayoutDashboard, Save, Palette, Rows3, GripVertical, Settings2, ChevronUp, ChevronDown,
  Eye, ShoppingBag, ShoppingCart, User, Truck, FileStack, Plus, X, Code,
  Image, Grid3x3, Zap, Sparkles, Clock, BookOpen, Store, Target, Package,
  Monitor, Tablet, Smartphone, AlertCircle, Layers, CreditCard,
  MessageSquareQuote, HelpCircle, Images, Video, Type, Mail, Share2, Award,
  Trash2, Undo2, Redo2, FileEdit, Home, Heart, Lock, FileText, Link, Pencil, Paintbrush, Loader2,
  History, Tag, Shield, LayoutGrid, Newspaper, ChevronLeft, PanelTop, PanelBottom,
  Aperture, Megaphone, FolderOpen, ShieldCheck, Star, Film, Box,
  CalendarDays, UtensilsCrossed, Flower2, Building2, PartyPopper
} from 'lucide-vue-next'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useI18n } from '../composables/useI18n.js'
import { sectionMeta as sectionMetaRegistry, getAllSectionsWithAvailability } from './storefront/sectionSchemas.js'
import { industryTemplates } from './storefront/templatePresets.js'

Object.keys(sectionMetaRegistry).forEach(type => {
  BuilderRegistry.registerBlock(type, {
    label: sectionMetaRegistry[type].label,
    icon: sectionMetaRegistry[type].icon,
    category: sectionMetaRegistry[type].category || 'General',
    schema: [] // Expand this iteratively
  })
})

const showVisualBuilderPro = ref(false)
const { t, formatCurrency } = useI18n()

// Keyboard shortcuts for Undo/Redo
onMounted(() => {
  window.addEventListener('keydown', (e) => {
    // Ignore input fields so we don't interfere with standard text undo
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT' || e.target.isContentEditable)) {
      return
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      redo()
    }
  })
})

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
const previewKey = ref(0)
const storefrontUrl = ref(window.location.origin.replace('.cms.', '.'))
const expandedPageConfig = ref(null)
const allCategories = ref([])
const showBlockEditorFor = ref(null)

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
  { id: '__products',       label: 'Danh sách Sản phẩm',                            icon: ShoppingBag },
  { id: '__productDetail',  label: 'Chi tiết Sản phẩm',                             icon: Tag },
  { id: '__cart',           label: 'Giỏ hàng & Checkout',                           icon: ShoppingCart },
  { id: '__account',        label: 'Tài khoản, Đăng nhập, Đăng ký',               icon: User },
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
    undoStack.value.push(getSnapshot())
    if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
    redoStack.value = [] // Clear redo
  }, 250)
}

watch(sections, () => pushUndo(), { deep: true })

function undo() {
  if (undoStack.value.length <= 1) return
  isTrackingHistory = true
  redoStack.value.push(undoStack.value.pop()) // Save current for redo
  const snap = JSON.parse(undoStack.value[undoStack.value.length - 1])
  
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
  const nextSnapStr = redoStack.value.pop()
  undoStack.value.push(nextSnapStr)
  const snap = JSON.parse(nextSnapStr)
  
  sections.value = snap.sections || []
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
  if (snap.promoConfig) promoConfig.value = snap.promoConfig

  showToast('Đã làm lại (Redo)', 'info')
  nextTick(() => { isTrackingHistory = false })
}

function handleGlobalKeydown(e) {
  if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return
  if (e.metaKey || e.ctrlKey) {
    if (e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    } else if (e.key === 'y') {
      e.preventDefault()
      redo()
    }
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
const defaultPromoConfig = { enabled: true, text: '', link: '/products', ctaText: '' }
const promoConfig = ref({ ...defaultPromoConfig })
const promoOpen = ref(false)

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
    return
  }
  if (id === '__header' || type === 'header') return
  if (id === '__footer' || type === 'footer') return
  
  // Use index to find the exact section in activeSections
  const section = activeSections.value[index] || sections.value.find(s => s.type === type)
  
  if (section) {
    expandedSection.value = section.type
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
  showLibrary.value = true
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

function onPreviewOpenConfig({ type }) {
  expandedSection.value = type
  nextTick(() => {
    const el = document.querySelector(`[data-section-panel="${type}"]`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

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
watch([sections, pages, customCss, themeConfig, headerConfig, footerConfig, pageConfigs, promoConfig, activeTemplate], () => {
  const tCfg = themeConfig.value
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
  --sf-bg-primary: ${tCfg.backgroundColor};
  --sf-text-primary: ${tCfg.textColor};
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
body { background: ${tCfg.backgroundColor}; color: ${tCfg.textColor}; font-family: ${tCfg.fontFamily}; }
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

        const layoutJson = page.layout_json || []
        if (layoutJson.length === 0 && isBuiltin) {
          sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
        } else {
          sections.value = ensureParams(layoutJson)
        }
        loadedFromLayoutPages = true
      } else if (isBuiltin) {
        // Build an empty wrapper layout for a system page if it doesn't exist yet
        layoutPageId.value = null
        sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
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
    sections.value = ensureParams(parsed || defaultSections)
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
      await apiFetch('/system-config/group/storefront_layout', {
        method: 'PUT',
        body: JSON.stringify({
          items: [
            { key: 'layout_sections', value: JSON.stringify(sections.value) },
            { key: 'layout_pages', value: JSON.stringify(pages.value) },
            { key: 'layout_template', value: activeTemplate.value },
            { key: 'layout_custom_css', value: customCss.value },
            { key: 'layout_page_configs', value: JSON.stringify(pageConfigs.value) },
            { key: 'layout_header_config', value: JSON.stringify(headerConfig.value) },
            { key: 'layout_footer_config', value: JSON.stringify(footerConfig.value) },
            { key: 'layout_promo_config', value: JSON.stringify(promoConfig.value) },
            { key: 'layout_theme_config', value: JSON.stringify(themeConfig.value) },
            { key: 'storefront_url', value: storefrontUrl.value },
          ],
        }),
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
</script>

<style>
.layout-builder__header {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;
}
.layout-builder__header h3 {
  margin: 0; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px;
}
.layout-builder__header-actions { display: flex; gap: 8px; align-items: center; }

/* Status badge */
.lb-status-badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 700;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  color: var(--color-text-muted);
}
.lb-status-badge--published { border-color: rgba(34,197,94,0.3); color: #22c55e; background: rgba(34,197,94,0.08); }
.lb-status-badge--draft { border-color: rgba(245,158,11,0.3); color: #f59e0b; background: rgba(245,158,11,0.08); }

/* Publish note dialog */
.publish-dialog {
  background: var(--color-bg-primary, #1a1a2e); border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 24px; width: 100%; max-width: 440px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.4); animation: hlSlideUp 0.2s ease;
}
.publish-dialog h3 { margin: 0 0 4px; font-size: 16px; font-weight: 800; }
.publish-dialog__desc { margin: 0 0 12px; font-size: 12px; color: var(--color-text-muted); }
.publish-dialog__actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }

.btn-preview-toggle {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--glass-border);
  background: var(--glass-bg); color: var(--color-text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; gap: 5px; transition: all 0.2s;
}
.btn-preview-toggle:hover { border-color: var(--color-accent-primary); color: var(--accent-light); }

.btn-save {
  padding: 8px 18px; border-radius: 10px; border: none;
  background: var(--accent-gradient); color: #fff;
  font-weight: 700; font-size: 13px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  transition: all 0.2s; box-shadow: var(--accent-shadow);
}
.btn-save:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.layout-builder__body { display: grid; grid-template-columns: 440px 20px 1fr; gap: 0 8px; min-height: calc(100vh - 130px); align-items: start; transition: grid-template-columns 0.25s ease; }
.layout-builder__body--collapsed { grid-template-columns: 0px 20px 1fr; }
.layout-builder__controls { display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; max-height: calc(100vh - 130px); padding-right: 12px; transition: opacity 0.2s; min-width: 0; }
.layout-builder__controls--collapsed { opacity: 0; pointer-events: none; }

.lb-controls-toggle { position: sticky; top: 8px; width: 20px; height: 36px; border-radius: 6px; border: 1px solid var(--glass-border); background: var(--glass-bg); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--color-text-muted); transition: background 0.15s, color 0.15s; padding: 0; flex-shrink: 0; }
.lb-controls-toggle:hover { background: var(--accent-color, #6366f1); color: #fff; border-color: var(--accent-color, #6366f1); }

/* Scrollbar for controls */
.layout-builder__controls::-webkit-scrollbar { width: 6px; }
.layout-builder__controls::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 4px; }

.lb-section { margin-bottom: 24px; }
.lb-section__title {
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
}
.lb-section__hint { font-size: 11px; color: var(--color-text-muted); margin: -8px 0 12px; line-height: 1.4; }
.lb-section__title--ai { justify-content: space-between; color: var(--color-accent-primary); }
.lb-ai-toggle { background: none; border: none; cursor: pointer; color: var(--color-text-muted); font-size: 11px; padding: 2px 4px; }
.lb-ai-panel { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.lb-ai-textarea { width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 12px; resize: vertical; font-family: inherit; line-height: 1.5; outline: none; }
.lb-ai-textarea:focus { border-color: var(--color-accent-primary); }
.lb-ai-btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; border-radius: 8px; border: none; background: var(--color-accent-primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
.lb-ai-btn:hover { opacity: .88; }
.lb-ai-btn:disabled { opacity: .5; cursor: not-allowed; }
.lb-ai-hint { font-size: 11px; color: var(--color-text-muted); margin: 0; }

/* Footer color pickers */
.footer-color-row { display: flex; gap: 12px; }
.footer-color-item { flex: 1; }
.footer-color-item label { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; }
.footer-color-pick { display: flex; align-items: center; gap: 6px; }

/* Builtin page config panel */
.builtin-page-config {
  display: flex; flex-direction: column; gap: 2px;
}
.builtin-page-note {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 10px; padding: 16px; font-size: 13px;
  color: var(--color-text-muted); line-height: 1.7; text-align: center;
}

/* Custom page picker dropdown */
.page-picker {
  position: relative; outline: none;
}
.page-picker__trigger {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-primary); font-size: 13px; font-weight: 600;
  cursor: pointer; min-width: 210px; transition: all 0.2s;
}
.page-picker__trigger:hover { border-color: var(--color-accent-primary); }
.page-picker__trigger span { flex: 1; text-align: left; }
.page-picker__menu {
  position: absolute; top: calc(100% + 6px); left: 0; z-index: 9999;
  background: var(--color-bg-primary, #1a1a2e);
  border: 1px solid var(--glass-border); border-radius: 12px;
  padding: 6px; min-width: 240px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  max-height: 320px; overflow-y: auto;
}
.page-picker__group {
  padding: 8px 10px 4px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px;
  color: var(--color-text-muted); text-transform: uppercase;
}
.page-picker__item {
  display: flex; align-items: center; gap: 8px;
  width: 100%; padding: 8px 10px; border: none; border-radius: 8px;
  background: transparent; color: var(--color-text-primary);
  font-size: 13px; font-weight: 500; cursor: pointer; text-align: left;
  transition: all 0.15s;
}
.page-picker__item:hover { background: var(--glass-bg); color: var(--accent-light); }
.page-picker__item.active {
  background: var(--color-accent-glow); color: var(--accent-light); font-weight: 700;
}

/* Templates */
.template-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.template-card {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 14px 10px; border-radius: 12px;
  border: 2px solid var(--glass-border); background: var(--glass-bg);
  cursor: pointer; transition: all 0.2s; color: var(--color-text-secondary);
}
.template-card:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }
.template-card.active { border-color: var(--color-accent-primary); background: var(--color-accent-glow); color: var(--accent-light); }
.template-card__name { font-size: 12px; font-weight: 700; }
.template-card__desc { font-size: 10px; color: var(--color-text-muted); text-align: center; }

/* Section list with drag-and-drop */
.section-list {
  display: flex; flex-direction: column; gap: 6px;
  counter-reset: section-counter;
  padding: 4px 0;
}
.section-item-wrap {
  display: flex; flex-direction: column;
  counter-increment: section-counter;
}
.section-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  transition: all 0.25s cubic-bezier(.4, 0, .2, 1);
  cursor: grab;
  border-left: 3px solid transparent;
  position: relative;
}
.section-item:not(.disabled) {
  border-left-color: var(--color-accent-primary);
}
.section-item:active { cursor: grabbing; }
.section-item.disabled {
  opacity: 0.45;
  border-left-color: var(--color-text-muted);
}
.section-item.dragging {
  opacity: 0.3; transform: scale(0.96); border-color: var(--color-accent-primary);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.section-item.drag-over {
  border: 2px dashed var(--color-accent-primary); transform: scale(1.02);
  box-shadow: 0 0 0 4px var(--color-accent-glow);
  background: var(--color-accent-glow);
}
.section-item.expanded {
  border-color: var(--color-accent-primary);
  border-left-color: var(--color-accent-primary);
  border-bottom-left-radius: 0; border-bottom-right-radius: 0;
  background: var(--color-accent-glow);
}
.section-item__left {
  display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
}
.section-item__left::before {
  content: counter(section-counter);
  display: inline-flex; align-items: center; justify-content: center;
  width: 20px; height: 20px; border-radius: 6px;
  background: var(--color-accent-glow, rgba(99,102,241,0.12));
  color: var(--color-accent-primary, #6366f1);
  font-size: 10px; font-weight: 800;
  flex-shrink: 0;
}
.section-item.disabled .section-item__left::before {
  background: rgba(128,128,128,0.1); color: var(--color-text-muted);
}
.section-item__drag-handle {
  color: var(--color-text-muted); opacity: 0.3; transition: opacity 0.2s; cursor: grab;
}
.section-item:hover .section-item__drag-handle { opacity: 1; }
.section-item__right { display: flex; align-items: center; gap: 8px; }
.btn-params {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 6px;
  border: 1px solid var(--glass-border); background: transparent;
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-params:hover { border-color: var(--color-accent-primary); color: var(--accent-light); }

/* Section params panel */
.section-params {
  padding: 12px 16px; border: 1px solid var(--color-accent-primary); border-top: none;
  border-radius: 0 0 10px 10px;
  background: var(--color-accent-glow);
}
.param-row {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 6px 0; font-size: 12px; color: var(--color-text-secondary);
}
.param-row label:first-child { font-weight: 600; white-space: nowrap; min-width: 80px; }
.param-input {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 6px;
  background: var(--glass-bg); color: var(--color-text-primary);
  font-size: 12px; width: 80px;
}
.param-input--wide { width: 100%; flex: 1; }
.param-divider { height: 1px; background: var(--glass-border); margin: 8px 0; }
.param-select {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 6px;
  background: var(--glass-bg); color: var(--color-text-primary); font-size: 12px;
}
.param-range { flex: 1; accent-color: var(--color-accent-primary); }
.param-value {
  font-weight: 700; color: var(--accent-light); min-width: 20px; text-align: center;
}

/* Expand animation */
.expand-enter-active, .expand-leave-active { transition: all 0.3s ease; overflow: hidden; }
.expand-enter-from, .expand-leave-to { opacity: 0; max-height: 0; padding-top: 0; padding-bottom: 0; }
.expand-enter-to, .expand-leave-from { opacity: 1; max-height: 1200px; }

/* Content editor */
.content-editor { margin-top: 6px; }
.content-editor__label {
  display: block; font-size: 11px; font-weight: 700; color: var(--color-text-muted);
  margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;
}
.content-item {
  display: flex; gap: 8px; align-items: flex-start;
  padding: 10px; margin-bottom: 6px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
}
.content-item__fields { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.content-item__row { display: flex; gap: 6px; }
.content-item__row .param-select { min-width: 110px; }
.content-textarea {
  resize: vertical; min-height: 40px; line-height: 1.4;
  font-family: inherit;
}
.content-html-editor {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 11px; line-height: 1.5; resize: vertical; min-height: 100px;
}
.btn-add-item {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  width: 100%; padding: 7px; margin-top: 4px;
  border: 1px dashed var(--glass-border); border-radius: 6px;
  background: transparent; color: var(--color-text-muted);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-add-item:hover { border-color: var(--color-accent-primary); color: var(--accent-light); background: var(--color-accent-glow); }
.btn-remove-item {
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px; min-width: 24px; margin-top: 4px;
  border-radius: 6px; border: 1px solid transparent;
  background: transparent; color: var(--color-text-muted);
  cursor: pointer; transition: all 0.15s;
}
.btn-remove-item:hover { border-color: #ef4444; color: #ef4444; background: rgba(239, 68, 68, 0.06); }

/* Page config */
.page-config { margin-bottom: 6px; border-radius: 10px; border: 1px solid var(--glass-border); overflow: hidden; }
.page-config.expanded { border-color: var(--color-accent-primary); }
.page-config__header {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  background: var(--glass-bg); cursor: pointer; font-size: 13px; font-weight: 600;
  transition: all 0.15s;
}
.page-config__header:hover { background: var(--color-accent-glow); }
.page-config__header span { flex: 1; }
.page-config__chevron { transition: transform 0.2s; color: var(--color-text-muted); }
.page-config.expanded .page-config__chevron { transform: rotate(180deg); color: var(--accent-light); }
.page-config__body { padding: 10px 14px; background: var(--color-accent-glow); border-top: 1px solid var(--glass-border); }

/* Section style */
.section-style-divider { height: 1px; background: var(--glass-border); margin: 10px 0; }
.section-style-details { font-size: 12px; }
.section-style-details summary {
  cursor: pointer; font-weight: 600; color: var(--color-text-muted);
  padding: 6px 0; user-select: none; font-size: 11px;
}
.section-style-details summary:hover { color: var(--accent-light); }
.section-style-details[open] summary { color: var(--color-accent-primary); }
.param-color {
  width: 32px; height: 24px; border: 1px solid var(--glass-border);
  border-radius: 6px; cursor: pointer; padding: 0;
}
.btn-clear-color {
  display: flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 4px;
  border: none; background: rgba(239,68,68,0.1); color: #ef4444;
  cursor: pointer; font-size: 10px;
}

/* Undo & Draft */
.btn-undo {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
  color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.btn-undo:hover { border-color: var(--color-accent-primary); color: var(--accent-light); }
.btn-save--draft {
  background: var(--glass-bg) !important;
  border: 1px solid var(--glass-border) !important;
  color: var(--color-text-muted) !important;
}
.btn-save--draft:hover { border-color: var(--color-accent-primary) !important; color: var(--accent-light) !important; }

/* Add section */
.btn-add-section {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 10px; margin-top: 8px;
  border: 2px dashed var(--glass-border); border-radius: 10px;
  background: transparent; color: var(--color-text-muted);
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-add-section:hover { border-color: var(--color-accent-primary); color: var(--accent-light); background: var(--color-accent-glow); }

/* Toggle switch */
.toggle-switch { position: relative; display: inline-block; width: 36px; height: 20px; cursor: pointer; flex-shrink: 0; }
.toggle-switch--sm { width: 32px; height: 18px; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-slider {
  position: absolute; inset: 0; background: var(--glass-border); border-radius: 20px; transition: all 0.2s;
}
.toggle-slider::before {
  content: ''; position: absolute; width: 16px; height: 16px;
  left: 2px; bottom: 2px; background: #fff; border-radius: 50%; transition: all 0.2s;
}
.toggle-switch--sm .toggle-slider::before { width: 14px; height: 14px; }
.toggle-switch input:checked + .toggle-slider { background: var(--color-accent-primary); }
.toggle-switch input:checked + .toggle-slider::before { transform: translateX(16px); }
.toggle-switch--sm input:checked + .toggle-slider::before { transform: translateX(14px); }

/* Page toggles */
.page-toggle-list { display: flex; flex-direction: column; gap: 6px; }
.page-toggle-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px;
  border: 1px solid var(--glass-border); background: var(--glass-bg);
}
.page-toggle-item__info { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; }
.page-toggle-item__path {
  font-size: 11px; color: var(--color-text-muted);
  background: var(--color-accent-glow); padding: 1px 6px; border-radius: 4px;
}

/* CSS Editor */
.css-editor {
  width: 100%; padding: 12px; border: 1px solid var(--glass-border); border-radius: 10px;
  background: var(--glass-bg); color: var(--color-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace; font-size: 12px;
  resize: vertical; min-height: 80px; line-height: 1.5;
}
.css-editor:focus { outline: none; border-color: var(--color-accent-primary); box-shadow: 0 0 0 3px var(--color-accent-glow); }

/* Preview */
.layout-builder__preview { align-self: flex-start; }
.preview-toolbar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;
}
.preview-toolbar .lb-section__title { margin: 0; }
.preview-responsive { display: flex; gap: 2px; }
.preview-responsive button {
  padding: 4px 8px; border: 1px solid var(--glass-border); border-radius: 4px;
  background: transparent; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.preview-responsive button.active { background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary); }

.preview-frame {
  border: 1px solid var(--glass-border); border-radius: 12px;
  overflow: hidden; background: var(--color-bg-primary);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.pv-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-bottom: 1px solid var(--glass-border); background: var(--glass-bg);
}
.pv-logo { width: 50px; height: 10px; border-radius: 4px; background: var(--color-text-muted); opacity: 0.3; }
.pv-nav { display: flex; gap: 6px; }
.pv-nav-item { width: 30px; height: 8px; border-radius: 3px; background: var(--color-text-muted); opacity: 0.2; }
.pv-nav-item--sm { width: 16px; }
.pv-body { padding: 8px; display: flex; flex-direction: column; gap: 6px; }
.pv-section { border-radius: 6px; padding: 6px 8px; border: 1px dashed var(--glass-border); background: var(--glass-bg); }
.pv-section__label { font-size: 9px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 4px; }
.pv-section__visual { border-radius: 4px; background: var(--color-border); opacity: 0.3; }
.pv-section--banner .pv-section__visual { background: linear-gradient(135deg, var(--color-accent-glow), rgba(236, 72, 153, 0.2)); opacity: 0.6; }
.pv-section--flash_sale .pv-section__visual { background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(249, 115, 22, 0.2)); opacity: 0.6; }
.pv-section--featured_products .pv-section__visual { background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(16, 185, 129, 0.15)); opacity: 0.6; }
.pv-section--testimonials .pv-section__visual { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(99, 102, 241, 0.15)); opacity: 0.6; }
.pv-section--faq .pv-section__visual { background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(234, 88, 12, 0.15)); opacity: 0.6; }
.pv-footer { padding: 20px 16px 14px; border-top: 2px solid var(--glass-border); background: #1e293b; border-radius: 0 0 10px 10px; }
.pv-footer__cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 16px; margin-bottom: 12px; }
.pv-footer__col-title { font-size: 11px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.3px; }
.pv-footer__link, .pv-footer__contact, .pv-footer__text { font-size: 10px; color: #94a3b8; line-height: 1.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-footer__link:hover { color: #e2e8f0; }
.pv-footer__contact { display: flex; align-items: center; gap: 4px; }
.pv-footer__contact span { font-size: 10px; }
.pv-footer__social { display: flex; gap: 6px; justify-content: center; margin: 10px 0 6px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); }
.pv-footer__social-icon { width: 22px; height: 22px; border-radius: 50%; background: var(--color-accent-primary, var(--accent)); color: #fff; font-size: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; text-transform: uppercase; }
.pv-footer__copyright { font-size: 9px; text-align: center; color: #64748b; margin-top: 6px; }

/* Page-specific preview: Products page */
.pv-page-layout { display: grid; grid-template-columns: 80px 1fr; gap: 8px; min-height: 120px; }
.pv-page-layout--sidebar-right { grid-template-columns: 1fr 80px; }
.pv-page-layout--sidebar-right .pv-sidebar { order: 2; }
.pv-page-layout--sidebar-right .pv-product-grid { order: 1; }
.pv-page-layout--sidebar-hidden { grid-template-columns: 1fr; }
.pv-sidebar { border-radius: 6px; padding: 6px; border: 1px dashed var(--glass-border); background: var(--glass-bg); }
.pv-sidebar__label { font-size: 8px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 4px; }
.pv-sidebar__block { height: 18px; border-radius: 3px; background: var(--color-border); opacity: 0.3; margin-bottom: 4px; }
.pv-sidebar__block--sm { height: 12px; }
.pv-product-grid { border-radius: 6px; padding: 6px; border: 1px dashed var(--glass-border); background: var(--glass-bg); }
.pv-product-grid__label { font-size: 8px; color: var(--color-text-muted); font-weight: 700; margin-bottom: 4px; }
.pv-product-grid__items { display: grid; gap: 4px; }
.pv-product-item { aspect-ratio: 1; border-radius: 4px; background: linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.12)); }

/* Page-specific preview: Product Detail */
.pv-page-layout--detail { display: grid; gap: 8px; min-height: 100px; }
.pv-detail-gallery { border-radius: 6px; padding: 6px; border: 1px dashed var(--glass-border); background: var(--glass-bg); }
.pv-detail-gallery__main { height: 60px; border-radius: 4px; background: linear-gradient(135deg, var(--color-accent-glow), rgba(236,72,153,0.15)); margin-bottom: 4px; }
.pv-detail-gallery__thumbs { display: flex; gap: 3px; }
.pv-thumb { width: 16px; height: 16px; border-radius: 3px; background: var(--color-border); opacity: 0.3; }
.pv-detail-info { border-radius: 6px; padding: 8px; border: 1px dashed var(--glass-border); background: var(--glass-bg); display: flex; flex-direction: column; gap: 6px; }
.pv-detail-info__title { height: 10px; width: 70%; border-radius: 3px; background: var(--color-border); opacity: 0.4; }
.pv-detail-info__price { height: 10px; width: 40%; border-radius: 3px; background: linear-gradient(90deg, rgba(52,211,153,0.3), rgba(16,185,129,0.3)); }
.pv-detail-info__btn { height: 14px; width: 60%; border-radius: 4px; background: var(--color-accent-glow); opacity: 0.6; }

/* Live preview */
.preview-live {
  border: 1px solid var(--glass-border); border-radius: 12px; overflow: hidden;
  transition: max-width 0.3s ease; margin: 0 auto;
}
.preview-iframe { width: 100%; height: calc(100vh - 130px); border: none; background: #fff; }
.preview-no-url {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 20px; color: var(--color-text-muted); text-align: center;
}
.preview-no-url p { font-size: 12px; }
.preview-url-input { display: flex; gap: 6px; width: 100%; max-width: 320px; margin-top: 4px; }
.preview-url-input input { flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-2); color: var(--text-1); font-size: 12px; }
.preview-url-input input:focus { outline: none; border-color: var(--accent); }
.preview-url-input .btn-sm { padding: 6px 14px; border-radius: 6px; border: none; background: var(--accent); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
.preview-url-input .btn-sm:disabled { opacity: .4; cursor: not-allowed; }

/* Library Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal--library { background: var(--bg-1, #1a1a2e); border-radius: 16px; padding: 24px; max-height: 80vh; overflow-y: auto; }
.modal__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal__header h3 { margin: 0; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.btn-close { background: none; border: none; color: var(--color-text-muted); cursor: pointer; padding: 4px; }

.library-grouped { display: flex; flex-direction: column; gap: 20px; }
.library-group__title {
  font-size: 13px; font-weight: 700; margin: 0 0 10px;
  padding-bottom: 8px; border-bottom: 1px solid var(--glass-border);
  color: var(--color-text-secondary);
}
.library-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.library-card {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px 14px; border-radius: 12px;
  border: 2px solid var(--glass-border); background: var(--glass-bg);
  cursor: pointer; transition: all 0.2s; color: var(--color-text-secondary);
  text-align: center; position: relative;
}
.library-card:hover { border-color: var(--color-accent-primary); color: var(--color-text-primary); transform: translateY(-2px); }
.library-card.added { opacity: 0.5; cursor: default; }
.library-card strong { font-size: 13px; }
.library-card span { font-size: 11px; color: var(--color-text-muted); }
.library-card__badge {
  position: absolute; top: 8px; right: 8px;
  background: rgba(34, 197, 94, 0.15); color: #22c55e;
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
}
.library-card--disabled {
  opacity: 0.4; cursor: not-allowed !important;
  border-style: dashed;
}
.library-card--disabled:hover { transform: none; border-color: var(--glass-border); }
.library-card__icon { color: var(--color-accent-primary); display: flex; align-items: center; justify-content: center; }
.library-card__desc { font-size: 11px; color: var(--color-text-muted); }
.library-card__module {
  position: absolute; top: 6px; left: 6px;
  background: rgba(99, 102, 241, 0.12); color: #818cf8;
  font-size: 9px; font-weight: 700; padding: 2px 5px; border-radius: 3px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.library-card__unavailable {
  font-size: 10px; color: #f97316; font-weight: 600;
}

@media (max-width: 768px) {
  .layout-builder__body { grid-template-columns: 1fr; }
  .template-grid { grid-template-columns: repeat(2, 1fr); }
  .library-grid { grid-template-columns: 1fr; }
}

/* ── Footer Builder ── */
.footer-builder {
  display: flex; flex-direction: column; gap: 12px;
  margin-bottom: 12px;
}
.footer-col-card {
  background: var(--color-bg-primary); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 12px;
}
.footer-col-card__header {
  display: flex; gap: 8px; align-items: center; margin-bottom: 10px;
}
.footer-link-row {
  display: flex; gap: 6px; align-items: center; margin-bottom: 6px;
}
.footer-link-row .param-input { flex: 1; font-size: 12px; padding: 6px 8px; }
.footer-link-row .param-select { font-size: 12px; padding: 5px 6px; }
.param-select--sm { max-width: 110px; }
.footer-textarea {
  font-size: 12px; resize: vertical; font-family: monospace;
}
.footer-add-col {
  border-style: dashed; opacity: 0.7;
}
.footer-add-col:hover { opacity: 1; }
.footer-extra-section {
  background: var(--color-bg-primary); border: 1px solid var(--color-border);
  border-radius: 10px; padding: 10px 12px; margin-bottom: 8px;
}
.footer-extra-section summary {
  font-size: 13px; font-weight: 600; cursor: pointer;
  color: var(--color-text-primary); margin-bottom: 8px;
  user-select: none;
}
.footer-extra-section[open] summary { margin-bottom: 10px; }
.footer-badges-grid {
  display: flex; flex-wrap: wrap; gap: 8px;
}
.footer-badge-check {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; color: var(--color-text-secondary);
  cursor: pointer; padding: 4px 8px;
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 6px; transition: all 0.15s;
}
.footer-badge-check:has(input:checked) {
  background: var(--color-accent-glow); border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
}
.footer-badge-check input { display: none; }
.lb-section__desc {
  font-size: 12px; color: var(--color-text-muted); margin: 0 0 12px;
}
/* Header Links */
.header-links-list { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.hl-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 10px;
  border-radius: 8px; border: 1px solid var(--color-border); background: var(--glass-bg); transition: all 0.15s;
}
.hl-item:hover { border-color: var(--color-accent-primary); }
.hl-item__order { width: 20px; height: 20px; border-radius: 5px; background: var(--color-bg-card-solid); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: var(--color-text-muted); flex-shrink: 0; }
.hl-item__info { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.hl-item__name { font-size: 12px; font-weight: 700; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hl-item__url { font-size: 10px; color: var(--color-text-muted); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hl-badge { font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 10px; background: rgba(245,158,11,0.12); color: #f59e0b; text-transform: uppercase; flex-shrink: 0; }
.btn-edit-hl { display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border: 1px solid var(--color-border); border-radius: 5px; background: none; color: var(--color-text-muted); cursor: pointer; flex-shrink: 0; transition: all 0.15s; }
.btn-edit-hl:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

/* ── Page Structure (Header -> Body -> Footer) ── */
.lb-page-structure {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}
.lb-structure-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.lb-structure-item:hover {
  border-color: var(--accent-light);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.lb-structure-item__drag {
  width: 4px; height: 16px;
  border-radius: 2px;
  background: var(--border-color);
  opacity: 0.5;
}
.lb-structure-item__icon {
  color: var(--accent-color);
  background: var(--bg-hover);
  padding: 6px;
  border-radius: 6px;
  width: 28px; height: 28px;
}
.lb-structure-item__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.lb-structure-item__title {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
}
.lb-structure-item__subtitle {
  font-size: 11px; color: var(--text-muted);
}
.lb-structure-body {
  border: 1px dashed var(--border-color);
  border-radius: 8px;
  padding: 12px;
  background: rgba(0,0,0,0.01);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.lb-structure-body__label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-muted);
  letter-spacing: 0.5px;
  margin-bottom: 4px;
  text-align: center;
}
.hl-empty { text-align: center; padding: 16px; font-size: 12px; color: var(--color-text-muted); }
/* Page Selector */
.page-selector { display: flex; gap: 6px; }
.page-selector__mode { flex-shrink: 0; padding: 7px 8px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 11px; cursor: pointer; font-weight: 600; }
.page-selector__select, .page-selector__input { flex: 1; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 12px; }
.page-selector__select:focus, .page-selector__input:focus { outline: none; border-color: var(--color-accent-primary); }
/* Nav Link Modal */
.hl-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.hl-modal { background: var(--color-bg-card-solid); border: 1px solid var(--color-border); border-radius: 14px; width: 100%; max-width: 480px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); animation: hlSlideUp 0.2s ease; }
@keyframes hlSlideUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
.hl-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px 0; }
.hl-modal__header h3 { font-size: 15px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.hl-modal__header button { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 6px; }
.hl-modal__header button:hover { background: var(--color-bg-card-hover); }
.hl-modal__body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.hl-modal__footer { display: flex; gap: 8px; justify-content: flex-end; padding: 0 20px 16px; }
.hl-form-group { display: flex; flex-direction: column; gap: 4px; }
.hl-form-group label { font-size: 11px; font-weight: 600; color: var(--color-text-secondary); }
.hl-form-group input, .hl-form-group select { width: 100%; padding: 8px 10px; border-radius: 7px; border: 1px solid var(--color-border); background: var(--color-bg-secondary); color: var(--color-text-primary); font-size: 12px; box-sizing: border-box; }
.hl-form-group input:focus, .hl-form-group select:focus { outline: none; border-color: var(--color-accent-primary); }
.hl-form-row { display: flex; gap: 10px; }
.hl-form-row .hl-form-group { flex: 1; }
.btn-cancel-hl { padding: 8px 16px; border-radius: 7px; border: 1px solid var(--color-border); background: none; color: var(--color-text-secondary); font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-save-hl { display: flex; align-items: center; gap: 5px; padding: 8px 20px; border-radius: 7px; border: none; background: var(--accent-gradient, var(--accent)); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: var(--accent-shadow); }
.btn-save-hl:hover { transform: translateY(-1px); }

/* Custom Tooltip for Action Buttons */
[data-tooltip] {
  position: relative;
}

[data-tooltip]::before {
  content: attr(data-tooltip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%) translateY(4px) scale(0.95);
  background: var(--color-bg-inverse, #1f2937);
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 99999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

[data-tooltip]::after {
  content: '';
  position: absolute;
  bottom: calc(100% + 2px);
  left: 50%;
  transform: translateX(-50%) translateY(4px);
  border-width: 4px;
  border-style: solid;
  border-color: var(--color-bg-inverse, #1f2937) transparent transparent transparent;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
  z-index: 99999;
}

[data-tooltip]:hover::before,
[data-tooltip]:hover::after {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) translateY(0) scale(1);
}
</style>
