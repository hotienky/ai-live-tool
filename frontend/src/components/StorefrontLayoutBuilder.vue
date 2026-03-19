<template>
  <div class="layout-builder">
    <div class="layout-builder__header">
      <div style="display: flex; align-items: center; gap: 16px;">
        <h3><LayoutDashboard :size="16" /> Bố cục Cửa Hàng</h3>
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
              <Home :size="14" /> Trang Chủ (Global)
            </button>
            <!-- System pages -->
            <div class="page-picker__group">Trang hệ thống</div>
            <button v-for="pg in builtinPageOptions" :key="pg.id"
              class="page-picker__item" :class="{ active: activePageId === pg.id }"
              @click="selectPage(pg.id)">
              <component :is="pg.icon" :size="14" />
              <span>{{ pg.label }}</span>
            </button>
            <!-- CMS dynamic pages -->
            <template v-if="dynamicPages.length">
              <div class="page-picker__group">Trang CMS động</div>
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
        <button v-if="undoStack.length" class="btn-undo" @click="undo" title="Hoàn tác">
          <Undo2 :size="14" />
        </button>
        <button class="btn-preview-toggle" @click="previewMode = previewMode === 'wireframe' ? 'live' : 'wireframe'">
          <Monitor v-if="previewMode === 'wireframe'" :size="14" />
          <Eye v-else :size="14" />
          {{ previewMode === 'wireframe' ? 'Live Preview' : 'Wireframe' }}
        </button>
        <button class="btn-save btn-save--draft" @click="saveDraft" :disabled="saving" title="Lưu nháp">
          <FileEdit :size="14" /> Nháp
        </button>
        <button class="btn-save" @click="saveLayout" :disabled="saving">
          <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : 'Xuất bản' }}
        </button>
      </div>
    </div>

    <div class="layout-builder__body">
      <!-- Left: Controls -->
      <div class="layout-builder__controls">

        <!-- Templates -->
        <div class="lb-section" v-show="!activePageId">
          <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục</h4>
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

        <!-- Sections heading -->
        <div class="lb-section">
          <h4 class="lb-section__title"><Rows3 :size="14" /> {{ activeBuiltinPage ? 'Cấu hình trang' : (activePageId ? 'Sections trong trang' : 'Sections trang chủ') }}</h4>
          <!-- Builtin page config panel: shown instead of sections list -->
          <div v-if="activeBuiltinPage" class="builtin-page-config">
            <!-- Language Tabs for i18n -->
            <LanguageTabs v-model="builtinPageLang" :fields="['pageTitle', 'pageDescription']"
              :translations="pageConfigs[activeBuiltinPage]?.translations || {}"
              :base-data="{ pageTitle: pageConfigs[activeBuiltinPage]?.pageTitle || '', pageDescription: pageConfigs[activeBuiltinPage]?.pageDescription || '' }" />
            <!-- i18n Fields: Page Title & Description -->
            <div class="param-row"><label>Tiêu đề trang</label>
              <input type="text" class="param-input param-input--wide"
                :value="getPageConfigI18n(activeBuiltinPage, 'pageTitle')"
                @input="setPageConfigI18n(activeBuiltinPage, 'pageTitle', $event.target.value)"
                placeholder="Nhập tiêu đề trang..." />
            </div>
            <div class="param-row"><label>Mô tả trang</label>
              <input type="text" class="param-input param-input--wide"
                :value="getPageConfigI18n(activeBuiltinPage, 'pageDescription')"
                @input="setPageConfigI18n(activeBuiltinPage, 'pageDescription', $event.target.value)"
                placeholder="Nhập mô tả trang (tuỳ chọn)..." />
            </div>
            <div class="param-divider"></div>
            <!-- Products -->
            <template v-if="activeBuiltinPage === 'products'">
              <div class="param-row"><label>Sidebar</label>
                <select v-model="pageConfigs.products.sidebarPosition" class="param-select">
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                  <option value="hidden">{{ t('admin.hidden', 'Ẩn') }}</option>
                </select>
              </div>
              <div class="param-row"><label>Cột sản phẩm</label>
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
              <div class="param-row"><label>Filter danh mục</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.category" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Filter thương hiệu</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.products.showFilters.brand" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Filter giá</label>
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
              <div class="param-row"><label>Tỷ lệ layout</label>
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
              <div class="param-row"><label>SP liên quan</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.productDetail.showRelatedProducts" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row" v-if="pageConfigs.productDetail.showRelatedProducts"><label>Số SP liên quan</label>
                <input type="range" v-model.number="pageConfigs.productDetail.relatedCount" min="4" max="8" class="param-range" />
                <span class="param-value">{{ pageConfigs.productDetail.relatedCount }}</span>
              </div>
              <div class="param-row"><label>Đánh giá</label>
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
                  <option value="two-column">2 cột (Form + Tóm tắt)</option>
                  <option value="single-column">1 cột</option>
                </select>
              </div>
              <div class="param-row"><label>{{ t('admin.coupons', 'Mã giảm giá') }}</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showCoupon" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Ghi chú đơn hàng</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showNotes" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Thanh tiến trình</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.checkout.showSteps" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Auth -->
            <template v-else-if="activeBuiltinPage === 'auth'">
              <div class="param-row"><label>Cho phép đăng ký</label>
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
              <div class="param-row"><label>Chiều rộng card (px)</label>
                <input type="range" v-model.number="pageConfigs.auth.cardMaxWidth" min="360" max="600" step="20" class="param-range" />
                <span class="param-value">{{ pageConfigs.auth.cardMaxWidth }}px</span>
              </div>
            </template>
            <!-- Account -->
            <template v-else-if="activeBuiltinPage === 'account'">
              <div class="param-row"><label>Sidebar</label>
                <select v-model="pageConfigs.account.sidebarPosition" class="param-select">
                  <option value="left">Bên trái</option>
                  <option value="right">Bên phải</option>
                </select>
              </div>
              <div class="param-row"><label>Tab đơn hàng</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showOrders" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Tab địa chỉ</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showAddresses" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
              <div class="param-row"><label>Tab đổi mật khẩu</label>
                <label class="toggle-switch toggle-switch--sm" @click.stop>
                  <input type="checkbox" v-model="pageConfigs.account.showPasswordChange" />
                  <span class="toggle-slider"></span>
                </label>
              </div>
            </template>
            <!-- Other built-in pages: just show a note -->
            <template v-else>
              <div class="builtin-page-note">
                <span>Trang này hiện không có cấu hình tuỳ chỉnh.<br/>Bật/tắt trang trong <strong>Trang Chủ (Global)</strong> → Trang sẵn có.</span>
              </div>
            </template>
            <button class="btn-save" style="margin-top:16px;width:100%" @click="saveLayout" :disabled="saving">
              <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save_config', 'Lưu cấu hình') }}
            </button>
          </div>
          <!-- Section List (sub-component) -->
          <LayoutSectionManager
            v-show="!activeBuiltinPage"
            v-model:sections="sections"
            :section-meta="sectionMeta"
            :all-categories="allCategories"
          />

          <!-- Add Section Button (only for homepage and CMS dynamic pages, not builtin pages) -->
          <button class="btn-add-section" @click="showLibrary = true" v-show="!activeBuiltinPage">
            <Plus :size="14" /> Thêm section
          </button>
        </div>

        <!-- Page Toggles -->
        <div class="lb-section" v-show="!activePageId">
          <h4 class="lb-section__title"><FileStack :size="14" /> Trang sẵn có</h4>
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
          <h4 class="lb-section__title"><Code :size="14" /> CSS tùy chỉnh</h4>
          <textarea
            v-model="customCss"
            class="css-editor"
            rows="6"
            placeholder="/* Custom CSS cho storefront */&#10;.home-page { }&#10;.product-grid { }"
            spellcheck="false"
          ></textarea>
        </div>
      </div>

      <!-- Right: Preview (sub-component) -->
      <LayoutPreviewPanel
        :preview-mode="previewMode"
        v-model:preview-width="previewWidth"
        :preview-key="previewKey"
        v-model:storefront-url="storefrontUrl"
        :live-preview-url="livePreviewUrl"
        :pages="pages"
        :active-builtin-page="activeBuiltinPage"
        :active-page-id="activePageId"
        :builtin-page-options="builtinPageOptions"
        :active-sections="activeSections"
        :section-meta="sectionMeta"
        :page-configs="pageConfigs"
        :footer-config="footerConfig"
        @refresh-live="previewKey++"
      />
    </div>

    <!-- Section Library Modal (Phase 3) -->
    <div class="modal-overlay" v-if="showLibrary" @click.self="showLibrary = false">
      <div class="modal modal--library">
        <div class="modal__header">
          <h3><Layers :size="16" /> Thư viện Section</h3>
          <button class="btn-close" @click="showLibrary = false"><X :size="18" /></button>
        </div>
        <div class="library-grid">
          <button
            v-for="lib in libraryItems"
            :key="lib.type"
            class="library-card"
            :class="{ added: sections.some(s => s.type === lib.type) }"
            @click="addLibrarySection(lib)"
          >
            <component :is="lib.icon" :size="24" />
            <strong>{{ lib.label }}</strong>
            <span>{{ lib.desc }}</span>
            <span v-if="sections.some(s => s.type === lib.type)" class="library-card__badge">Đã thêm</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import LayoutHeaderConfig from './storefront/LayoutHeaderConfig.vue'
import LayoutFooterConfig from './storefront/LayoutFooterConfig.vue'
import LayoutPageConfigs from './storefront/LayoutPageConfigs.vue'
import LayoutSectionManager from './storefront/LayoutSectionManager.vue'
import LayoutPreviewPanel from './storefront/LayoutPreviewPanel.vue'
import LanguageTabs from './LanguageTabs.vue'
import { useToast } from '../composables/useToast.js'
import {
  LayoutDashboard, Save, Palette, Rows3, GripVertical, Settings2, ChevronUp, ChevronDown,
  Eye, ShoppingBag, ShoppingCart, User, Truck, FileStack, Plus, X, Code,
  Image, Grid3x3, Zap, Sparkles, Clock, BookOpen, Store, Target, Package,
  Monitor, Tablet, Smartphone, AlertCircle, Layers, CreditCard,
  MessageSquareQuote, HelpCircle, Images, Video, Type, Mail, Share2, Award,
  Trash2, Undo2, FileEdit, Home, Heart, Lock, FileText, Link, Pencil
} from 'lucide-vue-next'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useCmsPages } from '../composables/useCmsPages.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const { showToast } = useToast()

const sections = ref([])
const pages = ref({})
const customCss = ref('')
const activeTemplate = ref('full_store')
const saving = ref(false)
const expandedSection = ref(null)
const showLibrary = ref(false)
const previewMode = ref('wireframe')
const previewWidth = ref('100%')
const previewKey = ref(0)
const storefrontUrl = ref('')
const expandedPageConfig = ref(null)
const allCategories = ref([])

const activePageId = ref(null)
const dynamicPages = ref([])
const pageDropdownOpen = ref(false)

// Builtin page options with proper lucide icons
const builtinPageOptions = [
  { id: '__products',       label: 'Trang sản phẩm',    icon: ShoppingBag },
  { id: '__productDetail',  label: 'Chi tiết sản phẩm', icon: Package },
  { id: '__checkout',       label: 'Thanh toán',          icon: CreditCard },
  { id: '__auth',           label: 'Đăng nhập / Đăng ký', icon: Lock },
  { id: '__account',        label: 'Tài khoản',           icon: User },
  { id: '__wishlist',       label: 'Yêu thích',          icon: Heart },
  { id: '__cart',           label: 'Giỏ hàng',           icon: ShoppingCart },
  { id: '__order_tracking', label: 'Tra cứu đơn',        icon: Truck },
]

// Computed: current active page display (icon + label)
const activePage = computed(() => {
  if (activePageId.value === null) return { icon: Home, label: 'Trang Chủ (Global)' }
  const builtin = builtinPageOptions.find(p => p.id === activePageId.value)
  if (builtin) return builtin
  const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
  if (dyn) return { icon: FileText, label: dyn.title }
  return { icon: Home, label: 'Trang Chủ (Global)' }
})

// Extracts 'products'/'productDetail'/etc from '__products'/'__productDetail'
// Returns null if not a builtin __key selection
const activeBuiltinPage = computed(() => {
  if (typeof activePageId.value === 'string' && activePageId.value.startsWith('__')) {
    return activePageId.value.slice(2) // strip the '__'
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

// Undo stack
const undoStack = ref([])
const MAX_UNDO = 20
function pushUndo() {
  const snap = JSON.stringify({ sections: sections.value, pageConfigs: pageConfigs.value, headerConfig: headerConfig.value, footerConfig: footerConfig.value })
  undoStack.value.push(snap)
  if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
}
function undo() {
  if (!undoStack.value.length) return
  const snap = JSON.parse(undoStack.value.pop())
  sections.value = ensureParams(snap.sections || [])
  if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
  if (snap.headerConfig) headerConfig.value = snap.headerConfig
  if (snap.footerConfig) footerConfig.value = snap.footerConfig
}

// Header / Footer config
const defaultHeaderConfig = { logoPosition: 'left', maxNavLinks: 5, showSearch: true, sticky: true, showThemeToggle: true }
const headerConfig = ref({ ...defaultHeaderConfig })
const defaultFooterConfig = {
  columns: [
    { title: 'Về chúng tôi', type: 'links', links: [{ label: 'Giới thiệu', url: '/page/gioi-thieu' }, { label: 'Chính sách bảo mật', url: '/page/chinh-sach-bao-mat' }] },
    { title: 'Hỗ trợ', type: 'links', links: [{ label: 'Chính sách vận chuyển', url: '/page/chinh-sach-van-chuyen' }, { label: 'Đổi trả & Hoàn tiền', url: '/page/doi-tra' }] },
    { title: 'Liên hệ', type: 'contact', items: [{ icon: 'phone', label: 'Hotline', value: '' }, { icon: 'email', label: 'Email', value: '' }] },
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
    pageTitle: 'Sản phẩm',
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
    pageTitle: 'Chi tiết sản phẩm',
    pageDescription: '',
    translations: {},
  },
  checkout: {
    showCoupon: true,
    showNotes: true,
    showSteps: true,
    layout: 'two-column',
    pageTitle: 'Thanh toán',
    pageDescription: '',
    translations: {},
  },
  auth: {
    allowRegister: true,
    allowForgotPassword: true,
    showSocialLogin: false,
    cardMaxWidth: 440,
    pageTitle: 'Đăng nhập / Đăng ký',
    pageDescription: '',
    translations: {},
  },
  account: {
    showOrders: true,
    showAddresses: true,
    showPasswordChange: true,
    sidebarPosition: 'left',
    pageTitle: 'Tài khoản',
    pageDescription: '',
    translations: {},
  },
}
const pageConfigs = ref(JSON.parse(JSON.stringify(defaultPageConfigs)))

// ─── Builtin Page i18n ───
const builtinPageLang = ref('vi')

function getPageConfigI18n(pageName, field) {
  if (builtinPageLang.value === 'vi') return pageConfigs.value[pageName]?.[field] || ''
  const t = pageConfigs.value[pageName]?.translations?.[builtinPageLang.value]
  return t?.[field] || ''
}
function setPageConfigI18n(pageName, field, value) {
  if (builtinPageLang.value === 'vi') {
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
  categories: { label: 'Danh mục', icon: Grid3x3, pvHeight: '25px' },
  flash_sale: { label: 'Flash Sale', icon: Zap, pvHeight: '35px' },
  featured_products: { label: 'Sản phẩm nổi bật', icon: Sparkles, pvHeight: '60px' },
  new_arrivals: { label: 'Hàng mới về', icon: Clock, pvHeight: '60px' },
  cms_pages: { label: 'Trang CMS', icon: BookOpen, pvHeight: '30px' },
  // Library sections (Phase 3)
  testimonials: { label: 'Đánh giá KH', icon: MessageSquareQuote, pvHeight: '45px' },
  faq: { label: 'FAQ', icon: HelpCircle, pvHeight: '40px' },
  image_gallery: { label: 'Thư viện ảnh', icon: Images, pvHeight: '50px' },
  video_embed: { label: 'Video', icon: Video, pvHeight: '55px' },
  text_block: { label: 'Khối văn bản', icon: Type, pvHeight: '35px' },
  newsletter: { label: 'Đăng ký email', icon: Mail, pvHeight: '30px' },
  social_feed: { label: 'Mạng xã hội', icon: Share2, pvHeight: '25px' },
  brands_slider: { label: 'Thương hiệu', icon: Award, pvHeight: '30px' },
}

const defaultParams = {
  banner: { autoplay: true, interval: 4000, height: 'md' },
  categories: { columns: 6, showDescription: false, layoutStyle: 'grid', showCount: false, selectedCategoryIds: [] },
  flash_sale: { showTimer: true, showProgress: true, count: 8, columns: 4 },
  featured_products: { title: 'Sản phẩm nổi bật', count: 8, columns: 4, filterCategory: '', sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 4000 },
  new_arrivals: { title: 'Hàng mới về', count: 6, columns: 4, sortOrder: 'newest', slidesPerView: 2, autoplay: true, autoplaySpeed: 5000 },
  cms_pages: { layout: 'grid', maxPages: 6 },
  testimonials: { title: 'Khách hàng nói gì', columns: 3 },
  faq: { title: 'Câu hỏi thường gặp' },
  image_gallery: { title: 'Thư viện ảnh', columns: 3 },
  video_embed: { title: 'Video' },
  text_block: { title: '' },
  newsletter: { title: 'Đăng ký nhận tin', subtitle: 'Nhận thông tin khuyến mãi và sản phẩm mới nhất', buttonText: 'Đăng ký' },
  social_feed: { title: 'Theo dõi chúng tôi' },
  brands_slider: { title: 'Thương hiệu', animationSpeed: 20 },
}

// ─── Library ───
const libraryItems = [
  { type: 'testimonials', label: 'Đánh giá KH', desc: 'Hiện testimonials khách hàng', icon: MessageSquareQuote },
  { type: 'faq', label: 'FAQ', desc: 'Câu hỏi thường gặp', icon: HelpCircle },
  { type: 'image_gallery', label: 'Thư viện ảnh', desc: 'Gallery ảnh sản phẩm', icon: Images },
  { type: 'video_embed', label: 'Video', desc: 'Embed YouTube/TikTok', icon: Video },
  { type: 'text_block', label: 'Khối văn bản', desc: 'Nội dung HTML tùy ý', icon: Type },
  { type: 'newsletter', label: 'Đăng ký email', desc: 'Form đăng ký nhận tin', icon: Mail },
  { type: 'social_feed', label: 'Mạng xã hội', desc: 'Links social media', icon: Share2 },
  { type: 'brands_slider', label: 'Thương hiệu', desc: 'Logo thương hiệu', icon: Award },
]

function addLibrarySection(lib) {
  if (sections.value.some(s => s.type === lib.type)) {
    showToast('Section đã tồn tại', 'error')
    return
  }
  sections.value.push({
    type: lib.type,
    enabled: true,
    order: sections.value.length,
    params: { ...defaultParams[lib.type] },
    content: [],
  })
  showLibrary.value = false
  expandedSection.value = lib.type
}

// ─── Page List ───
const pageList = [
  { key: 'products', label: 'Sản phẩm', icon: ShoppingBag, path: '/products' },
  { key: 'cart', label: 'Giỏ hàng', icon: ShoppingCart, path: '/cart' },
  { key: 'account', label: 'Tài khoản', icon: User, path: '/account' },
  { key: 'auth', label: 'Đăng nhập', icon: User, path: '/auth' },
  { key: 'order_tracking', label: 'Tra cứu đơn', icon: Truck, path: '/order-tracking' },
]

// ─── Templates ───
const templates = [
  { key: 'full_store', name: 'Full Store', desc: 'Tất cả sections', icon: Store },
  { key: 'catalog', name: 'Catalog', desc: 'Danh mục + SP', icon: Package },
  { key: 'minimal', name: 'Minimal', desc: 'Banner + SP nổi bật', icon: Target },
  { key: 'landing', name: 'Landing Page', desc: 'Banner + CMS', icon: BookOpen },
]
const templatePresets = {
  full_store: { sections: ['banner', 'categories', 'flash_sale', 'featured_products', 'new_arrivals', 'cms_pages'] },
  catalog: { sections: ['banner', 'categories', 'featured_products', 'new_arrivals'] },
  minimal: { sections: ['banner', 'featured_products'] },
  landing: { sections: ['banner', 'cms_pages'] },
}

const activeSections = computed(() =>
  sections.value.filter(s => s.enabled).sort((a, b) => a.order - b.order)
)

function applyTemplate(key) {
  activeTemplate.value = key
  const preset = templatePresets[key]
  if (!preset) return
  // Keep only built-in sections for template, preserve custom sections
  const builtIn = ['banner', 'categories', 'flash_sale', 'featured_products', 'new_arrivals', 'cms_pages']
  sections.value.forEach(s => {
    if (builtIn.includes(s.type)) {
      s.enabled = preset.sections.includes(s.type)
    }
  })
  const order = preset.sections
  sections.value.sort((a, b) => {
    const aIdx = order.indexOf(a.type)
    const bIdx = order.indexOf(b.type)
    return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx)
  })
  sections.value.forEach((s, i) => { s.order = i })
}

// ─── Live Preview ───
const livePreviewUrl = computed(() => {
  if (!storefrontUrl.value) return ''
  const config = {
    sections: sections.value,
    pages: pages.value,
    customCss: customCss.value,
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(config))))
  const path = activePageId.value ? `/page/${dynamicPages.value.find(p => p.id === activePageId.value)?.alias}` : ''
  return `${storefrontUrl.value}${path}?preview_layout=${encoded}`
})

// Debounced preview refresh
let previewTimer
let undoTimer
watch([sections, pages, customCss, headerConfig, footerConfig, pageConfigs], () => {
  clearTimeout(previewTimer)
  previewTimer = setTimeout(() => { previewKey.value++ }, 800)
  // Push undo snapshot on changes (debounced)
  clearTimeout(undoTimer)
  undoTimer = setTimeout(() => pushUndo(), 1500)
}, { deep: true })

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
    // Skip load for builtin __key pages — they use shared pageConfigs
    if (activeBuiltinPage.value) return

    if (activePageId.value) {
      const res = await apiFetch(`/cms-pages/${activePageId.value}`)
      const data = await res.json()
      sections.value = ensureParams(data.layout_data || [])
      return
    }

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
    storefrontUrl.value = map.storefront_url || ''
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
    const parsedFC = map.layout_footer_config ? JSON.parse(map.layout_footer_config) : null
    if (parsedFC) {
      // Backward compat: old format had columns as a number
      if (typeof parsedFC.columns === 'number' || !Array.isArray(parsedFC.columns)) {
        // Use default column-based structure
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

async function saveLayout() {
  saving.value = true
  try {
    // CMS dynamic page (numeric ID) — save layout_data to CMS page
    if (activePageId.value && !activeBuiltinPage.value) {
      await apiFetch(`/cms-pages/${activePageId.value}`, {
        method: 'PUT',
        body: JSON.stringify({ layout_data: sections.value }),
      })
      showToast('Đã lưu bố cục trang CMS', 'success')
      saving.value = false
      return
    }

    // Built-in pages (__products, __productDetail) and Homepage
    // All share the same system-config storefront_layout group

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
          { key: 'storefront_url', value: storefrontUrl.value },
        ],
      }),
    })
    showToast('Đã xuất bản bố cục Cửa Hàng', 'success')
  } catch (e) {
    showToast('Lỗi lưu: ' + e.message, 'error')
  }
  saving.value = false
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
      showToast('Đã lưu nháp bố cục trang CMS', 'success')
      saving.value = false
      return
    }

    // Built-in pages and Homepage — save to system-config
    await apiFetch('/system-config/group/storefront_layout', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { key: 'layout_draft_sections', value: JSON.stringify(sections.value) },
          { key: 'layout_draft_page_configs', value: JSON.stringify(pageConfigs.value) },
          { key: 'layout_draft_header_config', value: JSON.stringify(headerConfig.value) },
          { key: 'layout_draft_footer_config', value: JSON.stringify(footerConfig.value) },
        ],
      }),
    })
    showToast('Đã lưu nháp', 'success')
  } catch (e) {
    showToast('Lỗi lưu nháp: ' + e.message, 'error')
  }
  saving.value = false
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
  if (!navLinkForm.value.name) { showToast('Nhập tên link', 'error'); return }
  try {
    if (navLinkEditing.value) {
      await updateNavLink(navLinkEditing.value, navLinkForm.value)
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await createNavLink(navLinkForm.value)
      showToast('Đã tạo link', 'success')
    }
    showNavLinkModal.value = false
    fetchNavLinks()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function deleteNavLink(link) {
  if (!confirm(`Xóa link "${link.name}"?`)) return
  await deleteNavLinkApi(link.id)
  fetchNavLinks()
  showToast('Đã xóa', 'success')
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

.layout-builder__body { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }

.lb-section { margin-bottom: 24px; }
.lb-section__title {
  font-size: 13px; font-weight: 700; color: var(--color-text-secondary);
  margin: 0 0 12px; display: flex; align-items: center; gap: 6px;
}
.lb-section__hint { font-size: 11px; color: var(--color-text-muted); margin: -8px 0 12px; line-height: 1.4; }

/* Footer color pickers */
.footer-color-row { display: flex; gap: 12px; }
.footer-color-item { flex: 1; }
.footer-color-item label { display: block; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; }
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
.preview-iframe { width: 100%; height: 600px; border: none; background: #fff; }
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
</style>
