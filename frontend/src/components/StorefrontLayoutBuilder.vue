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

import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, inject, provide } from 'vue'
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
import BuilderHeader from './builder/BuilderHeader.vue'
import BuilderLeftSidebar from './builder/BuilderLeftSidebar.vue'
import BuilderRightPanel from './builder/BuilderRightPanel.vue'
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
import { useI18n } from '../composables/useI18n.js'
import { sectionMeta as sectionMetaRegistry, getAllSectionsWithAvailability } from './storefront/sectionSchemas.js'
import { industryTemplates } from './storefront/templatePresets.js'
import { useLanguages } from '../composables/useLanguages.js'

import { useBuilderHistory } from '../composables/builder/useBuilderHistory.js'
import { useBuilderPreview } from '../composables/builder/useBuilderPreview.js'
import { useBuilderPersistence } from '../composables/builder/useBuilderPersistence.js'
import { useBuilderSections } from '../composables/builder/useBuilderSections.js'
import { useBuilderNavLinks } from '../composables/builder/useBuilderNavLinks.js'

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

// ─── Defaults ───
const defaultHeaderConfig = { logoPosition: 'left', maxNavLinks: 5, showSearch: true, sticky: true, showThemeToggle: true, translations: {} }
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
  translations: {}
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

// ─── Builtin page options ───
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

function toggleZenMode() {
  if (leftCollapsed.value) {
    leftCollapsed.value = false
  } else {
    leftCollapsed.value = true
  }
}

function toggleXRay() {
  isXRayMode.value = !isXRayMode.value
  if (previewPanelRef.value) {
    previewPanelRef.value.postMessageToIframe('toggle-xray', isXRayMode.value)
  }
}

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

function handleGlobalKeydown(e) {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return

  if (e.key === 'Escape') {
    if (isFullscreen.value) isFullscreen.value = false
    if (activeConfig.value) activeConfig.value = null
  }

  if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    toggleZenMode()
  }

  if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey) {
    e.preventDefault()
    toggleXRay()
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    showCommandPalette.value = !showCommandPalette.value
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handlePublish()
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
}
onMounted(() => { window.addEventListener('keydown', handleGlobalKeydown) })
onBeforeUnmount(() => { window.removeEventListener('keydown', handleGlobalKeydown) })

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
    pageConfigs.value = { ...pageConfigs.value }
  }
})

// ─── Builtin Page i18n ───
const { defaultLangCode: dfLangCode, loadLanguages: loadLangs2 } = useLanguages()
loadLangs2()
const builtinPageLang = ref(dfLangCode.value)

function getPageConfigI18n(pageName, field) {
  if (builtinPageLang.value === dfLangCode.value) return pageConfigs.value[pageName]?.[field] || ''
  const tObj = pageConfigs.value[pageName]?.translations?.[builtinPageLang.value]
  return tObj?.[field] || ''
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
  pageConfigs: {}, headerConfig: {}, footerConfig: {},
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

  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => pushUndo(), 1500)
}, { deep: true, immediate: true })

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
