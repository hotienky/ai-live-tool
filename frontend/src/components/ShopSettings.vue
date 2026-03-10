<template>
  <div class="settings">
    <div class="settings__header">
      <h2 class="settings__title">
        <Settings :size="20" />
        Cài đặt Shop
      </h2>
      <span class="settings__shop-name" v-if="currentShop">{{ currentShop.shop_name || currentShop.shopName }}</span>
    </div>



    <!-- Appearance — always visible -->
    <div class="settings__body" v-if="activeTab === 'appearance'">
      <div class="settings__tabs">
        <button
          v-for="tab in allTabs"
          :key="tab.key"
          class="settings__tab"
          :class="{ 'settings__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </div>

      <div class="settings__panel">
        <h3 class="settings__panel-title"><Palette :size="16" style="vertical-align:middle" /> Giao diện</h3>

        <!-- Theme Mode -->
        <div class="settings__section">
          <label class="settings__field-label">Chế độ</label>
          <div class="theme-mode-selector">
            <button class="theme-mode-btn" :class="{ active: theme === 'light' }" @click="setTheme('light')">
              <Sun :size="16" /> Sáng
            </button>
            <button class="theme-mode-btn" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">
              <Moon :size="16" /> Tối
            </button>
            <button class="theme-mode-btn" :class="{ active: theme === 'system' }" @click="setTheme('system')">
              <MonitorIcon :size="16" /> Hệ thống
            </button>
          </div>
        </div>

        <!-- Accent Color -->
        <div class="settings__section">
          <label class="settings__field-label">Màu nhấn</label>
          <div class="accent-picker">
            <button
              v-for="(preset, name) in accentPresets"
              :key="name"
              class="accent-swatch"
              :class="{ active: accentColor === name }"
              :style="{ '--swatch': preset.primary }"
              @click="setAccent(name)"
              :title="name"
            >
              <span class="accent-swatch__dot"></span>
            </button>
          </div>
        </div>

        <!-- Font Size -->
        <div class="settings__section">
          <label class="settings__field-label">Cỡ chữ</label>
          <div class="font-size-selector">
            <button class="font-size-btn" :class="{ active: fontSizePref === 'compact' }" @click="setFontSize('compact')">
              <span style="font-size:12px">A</span> Nhỏ gọn
            </button>
            <button class="font-size-btn" :class="{ active: fontSizePref === 'normal' }" @click="setFontSize('normal')">
              <span style="font-size:14px">A</span> Bình thường
            </button>
            <button class="font-size-btn" :class="{ active: fontSizePref === 'comfortable' }" @click="setFontSize('comfortable')">
              <span style="font-size:16px">A</span> Thoải mái
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="activeTab !== 'appearance'" class="settings__body">
      <!-- Tab Switcher -->
      <div class="settings__tabs">
        <button
          v-for="tab in allTabs"
          :key="tab.key"
          class="settings__tab"
          :class="{ 'settings__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ═══ Tab: Connection ═══ -->
      <div v-if="activeTab === 'connection'" class="settings__panel">
        <h3 class="settings__panel-title">🔗 Kết nối nền tảng</h3>

        <!-- TikTok -->
        <div class="settings__platform-group">
          <h4 class="settings__platform-label">
            <Music :size="14" style="vertical-align:middle" /> TikTok Live
            <span class="settings__conn-badge" :class="shopForm.tiktokUsername ? 'settings__conn-badge--ok' : ''">
              {{ shopForm.tiktokUsername ? '✓ Đã cấu hình' : '○ Chưa cấu hình' }}
            </span>
          </h4>
          <div class="settings__field">
            <label>Username</label>
            <input v-model="shopForm.tiktokUsername" type="text" placeholder="@username" class="settings__input" />
          </div>
        </div>

        <!-- Facebook -->
        <div class="settings__platform-group">
          <h4 class="settings__platform-label">
            <BookOpen :size="14" style="vertical-align:middle" /> Facebook Live
            <span class="settings__conn-badge" :class="shopForm.facebookPageId && shopForm.facebookAccessToken ? 'settings__conn-badge--ok' : ''">
              {{ shopForm.facebookPageId && shopForm.facebookAccessToken ? '✓ Đã cấu hình' : '○ Chưa cấu hình' }}
            </span>
          </h4>
          <div class="settings__field">
            <label>Page ID</label>
            <input v-model="shopForm.facebookPageId" type="text" placeholder="Page ID (VD: 123456789)" class="settings__input" />
          </div>
          <div class="settings__field">
            <label>Access Token</label>
            <input v-model="shopForm.facebookAccessToken" type="password" placeholder="Page Access Token" class="settings__input" />
          </div>
          <p class="settings__help-text">Lấy token tại: Facebook Developer → Graph API Explorer → Get Page Access Token</p>
        </div>

        <!-- YouTube -->
        <div class="settings__platform-group">
          <h4 class="settings__platform-label">
            <Video :size="14" style="vertical-align:middle" /> YouTube Live
            <span class="settings__conn-badge" :class="shopForm.youtubeChannel && shopForm.youtubeApiKey ? 'settings__conn-badge--ok' : ''">
              {{ shopForm.youtubeChannel && shopForm.youtubeApiKey ? '✓ Đã cấu hình' : '○ Chưa cấu hình' }}
            </span>
          </h4>
          <div class="settings__field">
            <label>Channel ID</label>
            <input v-model="shopForm.youtubeChannel" type="text" placeholder="Channel ID (VD: UC...)" class="settings__input" />
          </div>
          <div class="settings__field">
            <label>API Key</label>
            <input v-model="shopForm.youtubeApiKey" type="password" placeholder="YouTube Data API Key" class="settings__input" />
          </div>
          <p class="settings__help-text">Lấy API Key tại: Google Cloud Console → APIs &amp; Services → Credentials</p>
        </div>

        <!-- Shopee -->
        <div class="settings__platform-group">
          <h4 class="settings__platform-label">
            <ShoppingCart :size="14" style="vertical-align:middle" /> Shopee Live
            <span class="settings__conn-badge" :class="shopForm.shopeeShopIdApi && shopForm.shopeePartnerId ? 'settings__conn-badge--ok' : ''">
              {{ shopForm.shopeeShopIdApi && shopForm.shopeePartnerId ? '✓ Đã cấu hình' : '○ Chưa cấu hình' }}
            </span>
          </h4>
          <div class="settings__field">
            <label>Shop ID (API)</label>
            <input v-model="shopForm.shopeeShopIdApi" type="text" placeholder="Shopee Shop ID" class="settings__input" />
          </div>
          <div class="settings__field">
            <label>Partner ID</label>
            <input v-model="shopForm.shopeePartnerId" type="text" placeholder="Partner ID" class="settings__input" />
          </div>
          <div class="settings__field">
            <label>Partner Key</label>
            <input v-model="shopForm.shopeePartnerKey" type="password" placeholder="Partner Key (Secret)" class="settings__input" />
          </div>
          <p class="settings__help-text">Cần đăng ký Shopee Open Platform để lấy credentials</p>
        </div>

        <button class="settings__save-btn" @click="saveShopInfo">
          <Save :size="14" /> Lưu cấu hình
        </button>
      </div>

      <!-- ═══ Tab: Products ═══ -->
      <div v-if="activeTab === 'products'" class="settings__panel">
        <h3 class="settings__panel-title"><ShoppingBag :size="16" style="vertical-align:middle" /> Sản phẩm ({{ products.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newProduct.name" placeholder="Tên sản phẩm" class="settings__input settings__input--flex" />
          <input v-model="newProduct.price" type="number" placeholder="Giá" class="settings__input settings__input--sm" />
          <input v-model="newProduct.category" placeholder="Danh mục" class="settings__input settings__input--sm" />
          <input v-model="newProduct.keywords" placeholder="Keywords (phân cách bằng dấu phẩy)" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addProduct">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <div class="settings__list">
          <div v-for="p in products" :key="p.id" class="settings__list-item">
            <span class="settings__item-name">{{ p.name }}</span>
            <span class="settings__item-category" v-if="p.category">{{ p.category }}</span>
            <span class="settings__item-price">{{ Number(p.price || 0).toLocaleString() }}đ</span>
            <span class="settings__item-kw">{{ Array.isArray(p.keywords) ? p.keywords.join(', ') : (p.keywords || '') }}</span>
            <span class="settings__item-sku" v-if="p.sku">SKU: {{ p.sku }}</span>
            <span class="settings__item-stock" :class="{ 'low-stock': (p.stock || 0) <= (p.lowStockThreshold || p.low_stock_threshold || 5) }">
              <Package :size="12" />
              {{ p.stock ?? 0 }}
              <span v-if="(p.stock || 0) <= (p.lowStockThreshold || p.low_stock_threshold || 5)" class="low-badge">Sắp hết</span>
            </span>
            <div class="settings__stock-btns">
              <button class="stock-btn stock-btn--minus" @click="adjustStock(p.id, 'deduct', 1)" title="Trừ 1">
                <Minus :size="12" />
              </button>
              <button class="stock-btn stock-btn--plus" @click="adjustStock(p.id, 'add', 1)" title="Thêm 1">
                <Plus :size="12" />
              </button>
            </div>
            <button class="settings__del-btn" @click="deleteProduct(p.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="products.length === 0" class="settings__empty-list">Chưa có sản phẩm</p>
        </div>
      </div>

      <!-- ═══ Tab: Categories ═══ -->
      <div v-if="activeTab === 'categories'" class="settings__panel">
        <h3 class="settings__panel-title"><FolderTree :size="16" style="vertical-align:middle" /> Danh mục ({{ categoryList.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newCategory.name" placeholder="Tên danh mục" class="settings__input settings__input--flex" />
          <input v-model="newCategory.description" placeholder="Mô tả (tuỳ chọn)" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addCategory">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <div class="settings__list">
          <div v-for="cat in categoryList" :key="cat.id" class="settings__list-item">
            <span class="settings__item-name">{{ cat.name }}</span>
            <span class="settings__item-slug">{{ cat.slug }}</span>
            <span v-if="cat.description" class="settings__item-desc">{{ cat.description }}</span>
            <span class="settings__item-badge" :class="cat.isActive || cat.is_active ? 'badge--active' : 'badge--inactive'">
              {{ (cat.isActive || cat.is_active) ? 'Hiện' : 'Ẩn' }}
            </span>
            <button class="settings__del-btn" @click="removeCategory(cat.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="categoryList.length === 0" class="settings__empty-list">Chưa có danh mục</p>
        </div>
      </div>

      <!-- ═══ Tab: Brands ═══ -->
      <div v-if="activeTab === 'brands'" class="settings__panel">
        <h3 class="settings__panel-title"><Award :size="16" style="vertical-align:middle" /> Thương hiệu ({{ brandList.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newBrand.name" placeholder="Tên thương hiệu" class="settings__input settings__input--flex" />
          <input v-model="newBrand.description" placeholder="Mô tả (tuỳ chọn)" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addBrand">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <div class="settings__list">
          <div v-for="br in brandList" :key="br.id" class="settings__list-item">
            <span class="settings__item-name">{{ br.name }}</span>
            <span class="settings__item-slug">{{ br.slug }}</span>
            <span v-if="br.description" class="settings__item-desc">{{ br.description }}</span>
            <button class="settings__del-btn" @click="removeBrand(br.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="brandList.length === 0" class="settings__empty-list">Chưa có thương hiệu</p>
        </div>
      </div>

      <!-- ═══ Tab: Keywords ═══ -->
      <div v-if="activeTab === 'keywords'" class="settings__panel">
        <h3 class="settings__panel-title">🔑 Keywords Alert ({{ keywords.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newKeyword.keyword" placeholder="Keyword" class="settings__input settings__input--flex" />
          <select v-model="newKeyword.alert_type" class="settings__input settings__input--sm">
            <option value="highlight">Highlight</option>
            <option value="notify">Thông báo</option>
            <option value="auto_reply">Auto Reply</option>
          </select>
          <input v-model="newKeyword.color" type="color" class="settings__color-picker" />
          <button class="settings__add-btn" @click="addKeyword">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <input
          v-if="newKeyword.alert_type === 'auto_reply'"
          v-model="newKeyword.auto_reply_text"
          placeholder="Nội dung auto reply..."
          class="settings__input"
          style="margin-top: 8px"
        />
        <div class="settings__list">
          <div v-for="kw in keywords" :key="kw.id" class="settings__list-item">
            <span class="settings__kw-badge" :style="{ background: kw.color + '22', color: kw.color, borderColor: kw.color }">
              {{ kw.keyword }}
            </span>
            <span class="settings__item-type">{{ kw.alert_type }}</span>
            <span v-if="kw.auto_reply_text" class="settings__item-reply">{{ kw.auto_reply_text }}</span>
            <button class="settings__del-btn" @click="deleteKeyword(kw.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="keywords.length === 0" class="settings__empty-list">Chưa có keyword nào</p>
        </div>
      </div>

      <!-- ═══ Tab: Auto Reply ═══ -->
      <div v-if="activeTab === 'replies'" class="settings__panel">
        <h3 class="settings__panel-title"><MessageCircle :size="16" style="vertical-align:middle" /> Mẫu trả lời tự động</h3>

        <!-- Master Toggle -->
        <div class="settings__toggle-row">
          <label class="settings__switch">
            <input type="checkbox" v-model="autoReplyEnabled" @change="toggleAutoReply" />
            <span class="settings__switch-slider"></span>
          </label>
          <span class="settings__toggle-label">
            Auto-Reply {{ autoReplyEnabled ? 'Đang bật' : 'Đang tắt' }}
          </span>
          <span class="settings__toggle-hint">Tự động reply cho comment HOT/WARM</span>
        </div>

        <div class="settings__add-row">
          <select v-model="newTemplate.trigger_label" class="settings__input settings__input--sm">
            <option value="HOT">Khi HOT</option>
            <option value="WARM">Khi WARM</option>
            <option value="keyword">Theo keyword</option>
          </select>
          <input v-model="newTemplate.template_text" placeholder="VD: Cảm ơn {{nickname}}, mình inbox bạn nhé!" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addTemplate">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <p class="settings__variable-hint">
          Biến hỗ trợ: <code>{{nickname}}</code> <code>{{product}}</code> <code>{{shop}}</code>
          — Cooldown: 1 reply/user/5 phút
        </p>
        <div class="settings__list">
          <div v-for="t in templates" :key="t.id" class="settings__list-item">
            <span class="settings__kw-badge" :style="labelStyle(t.trigger_label)">
              {{ t.trigger_label }}
            </span>
            <span class="settings__item-reply">{{ t.template_text }}</span>
            <span v-if="t.is_active" class="settings__active-badge">Active</span>
            <button class="settings__del-btn" @click="deleteTemplate(t.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="templates.length === 0" class="settings__empty-list">Chưa có mẫu trả lời</p>
        </div>

        <!-- Auto-reply Log -->
        <div v-if="autoReplyLog.length > 0" class="settings__log">
          <h4 class="settings__log-title"><ClipboardList :size="14" style="vertical-align:middle" /> Lịch sử auto-reply gần nhất</h4>
          <div v-for="(log, i) in autoReplyLog" :key="i" class="settings__log-item">
            <span class="settings__log-user">@{{ log.nickname }}</span>
            <span class="settings__log-label" :class="'label--' + (log.triggerLabel || '').toLowerCase()">{{ log.triggerLabel }}</span>
            <span class="settings__log-text">→ {{ log.replyText }}</span>
            <span class="settings__log-time">{{ formatTime(log.time) }}</span>
          </div>
        </div>
      </div>

      <!-- ═══ Tab: Moderation ═══ -->
      <div v-if="activeTab === 'moderation'" class="settings__panel">
        <h3 class="settings__panel-title"><Shield :size="16" style="vertical-align:middle" /> Quản lý bình luận</h3>
        <div class="settings__field">
          <label>Danh sách từ cấm (mỗi dòng 1 từ)</label>
          <textarea v-model="moderationConfig.blacklist" rows="5" class="settings__textarea"
            placeholder="spam&#10;quảng cáo&#10;đối thủ"></textarea>
        </div>
        <div class="settings__field">
          <label>
            <input type="checkbox" v-model="moderationConfig.hideSpam" />
            Tự động ẩn comment spam
          </label>
        </div>
        <div class="settings__field">
          <label>
            <input type="checkbox" v-model="moderationConfig.rateLimitEnabled" />
            Giới hạn tốc độ comment (max {{ moderationConfig.maxPerMinute }}/phút/user)
          </label>
          <input v-if="moderationConfig.rateLimitEnabled" v-model.number="moderationConfig.maxPerMinute" type="number" min="1" max="30" class="settings__input settings__input--sm" style="margin-top:4px" />
        </div>
        <button class="settings__save-btn" @click="saveModerationConfig">
          <Save :size="14" /> Lưu cấu hình
        </button>
      </div>

      <!-- ═══ Tab: Shop Customers ═══ -->
      <div v-if="activeTab === 'shop-customers'" class="settings__panel">
        <CustomerManager :shopId="currentShop?.id" />
      </div>

      <!-- ═══ Tab: Promotions + Coupons ═══ -->
      <div v-if="activeTab === 'promotions'" class="settings__panel">
        <PromotionManager :shopId="currentShop?.id" />
      </div>

      <!-- ═══ Tab: CMS Pages ═══ -->
      <div v-if="activeTab === 'cms'" class="settings__panel">
        <CmsManager :shopId="currentShop?.id" />
      </div>

      <!-- ═══ Tab: Banners ═══ -->
      <div v-if="activeTab === 'banners'" class="settings__panel">
        <BannerManager :shopId="currentShop?.id" />
      </div>

      <!-- ═══ Tab: Nav Links ═══ -->
      <div v-if="activeTab === 'nav-links'" class="settings__panel">
        <NavLinkManager :shopId="currentShop?.id" />
      </div>


    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  Settings, Store, Save, Plus, Trash2, Minus,
  Link, ShoppingBag, Key, MessageCircle, Shield, Package,
  Palette, Sun, Moon, Monitor as MonitorIcon, Lock,
  Music, BookOpen, Video, ShoppingCart, ClipboardList,
  FolderTree, Award, Users, Tag
} from 'lucide-vue-next'
import CustomerManager from './CustomerManager.vue'
import PromotionManager from './PromotionManager.vue'
import CmsManager from './CmsManager.vue'
import BannerManager from './BannerManager.vue'
import NavLinkManager from './NavLinkManager.vue'
import { apiFetch } from '../composables/useApi.js'
import { useCategories } from '../composables/useCategories.js'
import { useBrands } from '../composables/useBrands.js'
import { useTheme } from '../composables/useTheme.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useToast } from '../composables/useToast.js'
import { logger } from '../utils/logger.js'
const { showToast } = useToast()

const props = defineProps({
  currentShop: { type: Object, default: null },
})

const emit = defineEmits(['openShopSelector'])

const { theme, accentColor, fontSize: fontSizePref, accentPresets, setTheme, setAccent, setFontSize } = useTheme()

const validTabKeys = ['connection', 'products', 'categories', 'brands', 'keywords', 'replies', 'moderation', 'appearance', 'shop-customers', 'promotions', 'cms', 'banners', 'nav-links']
const activeTab = useUrlParam('tab', 'connection')
// Validate tab value from URL
if (!validTabKeys.includes(activeTab.value)) activeTab.value = 'connection'
const tabs = [
  { key: 'connection', label: 'Kết nối', icon: Link },
  { key: 'products', label: 'Sản phẩm', icon: ShoppingBag },
  { key: 'categories', label: 'Danh mục', icon: FolderTree },
  { key: 'brands', label: 'Thương hiệu', icon: Award },
  { key: 'keywords', label: 'Keywords', icon: Key },
  { key: 'replies', label: 'Auto Reply', icon: MessageCircle },
  { key: 'moderation', label: 'Moderation', icon: Shield },
  { key: 'shop-customers', label: 'Khách hàng', icon: Users },
  { key: 'promotions', label: 'Khuyến mãi', icon: Tag },
  { key: 'cms', label: 'Trang CMS', icon: BookOpen },
  { key: 'banners', label: 'Banner', icon: Video },
  { key: 'nav-links', label: 'Menu', icon: ClipboardList },
]
const allTabs = [
  ...tabs,
  { key: 'appearance', label: 'Giao diện', icon: Palette },
]

// Connection form
const shopForm = ref({
  tiktokUsername: '',
  facebookPageId: '', facebookAccessToken: '',
  youtubeChannel: '', youtubeApiKey: '',
  shopeeShopIdApi: '', shopeePartnerId: '', shopeePartnerKey: '',
})

// Products
const products = ref([])
const newProduct = ref({ name: '', price: '', keywords: '', category: '' })

// Categories
const { categories: categoryList, fetchCategories, createCategory, deleteCategory: deleteCategoryApi } = useCategories()
const newCategory = ref({ name: '', description: '' })

// Brands
const { brands: brandList, fetchBrands, createBrand, deleteBrand: deleteBrandApi } = useBrands()
const newBrand = ref({ name: '', description: '' })

// Keywords
const keywords = ref([])
const newKeyword = ref({ keyword: '', alert_type: 'highlight', color: '#ff3b5c', auto_reply_text: '' })

// Templates
const templates = ref([])
const newTemplate = ref({ trigger_label: 'HOT', template_text: '' })

// Moderation
const moderationConfig = ref({
  blacklist: '',
  hideSpam: true,
  rateLimitEnabled: false,
  maxPerMinute: 5,
})

// Auto-reply state
const autoReplyEnabled = ref(false)
const autoReplyLog = ref([])

watch(() => props.currentShop, (shop) => {
  if (shop) loadAll(shop)
}, { immediate: true })

async function loadAll(shop) {
  if (!shop) return
  shopForm.value = {
    tiktokUsername: shop.tiktok_username || '',
    facebookPageId: shop.facebook_page_id || '',
    facebookAccessToken: shop.facebook_access_token || '',
    youtubeChannel: shop.youtube_channel || '',
    youtubeApiKey: shop.youtube_api_key || '',
    shopeeShopIdApi: shop.shopee_shop_id_api || '',
    shopeePartnerId: shop.shopee_partner_id || '',
    shopeePartnerKey: shop.shopee_partner_key || '',
  }
  autoReplyEnabled.value = !!shop.auto_reply_enabled
  await Promise.all([loadProducts(shop.id), loadKeywords(shop.id), loadTemplates(shop.id)])
}

async function loadProducts(shopId) {
  try {
    const res = await apiFetch(`/products?shopId=${shopId}`)
    products.value = await res.json()
  } catch { products.value = [] }
}

async function loadKeywords(shopId) {
  try {
    const res = await apiFetch(`/shops/${shopId}/keywords`)
    keywords.value = await res.json()
  } catch { keywords.value = [] }
}

async function loadTemplates(shopId) {
  try {
    const res = await apiFetch(`/shops/${shopId}/templates`)
    templates.value = await res.json()
  } catch { templates.value = [] }
}

async function saveShopInfo() {
  if (!props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}`, {
      method: 'PUT',
      body: JSON.stringify(shopForm.value),
    })
    showToast('Đã lưu cấu hình shop', 'success')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function addProduct() {
  if (!newProduct.value.name || !props.currentShop) return
  try {
    await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({ ...newProduct.value, shopId: props.currentShop.id }),
    })
    newProduct.value = { name: '', price: '', keywords: '', category: '' }
    await loadProducts(props.currentShop.id)
    showToast('Đã thêm sản phẩm', 'success')
  } catch (e) {
    showToast('Lỗi thêm sản phẩm: ' + (e.message || 'Unknown'), 'error')
  }
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' })
    await loadProducts(props.currentShop.id)
    showToast('Đã xóa sản phẩm', 'success')
  } catch (e) {
    showToast('Lỗi xóa sản phẩm: ' + (e.message || 'Unknown'), 'error')
  }
}

// ── Category handlers ──
async function addCategory() {
  if (!newCategory.value.name || !props.currentShop) return
  try {
    await createCategory({ ...newCategory.value, shopId: props.currentShop.id })
    newCategory.value = { name: '', description: '' }
    showToast('Đã thêm danh mục', 'success')
  } catch (e) {
    showToast('Lỗi thêm danh mục: ' + (e.message || 'Unknown'), 'error')
  }
}
async function removeCategory(id) {
  if (!confirm('Xóa danh mục này?')) return
  try {
    await deleteCategoryApi(id)
    showToast('Đã xóa danh mục', 'success')
  } catch (e) {
    showToast('Lỗi xóa danh mục: ' + (e.message || 'Unknown'), 'error')
  }
}

// ── Brand handlers ──
async function addBrand() {
  if (!newBrand.value.name || !props.currentShop) return
  try {
    await createBrand({ ...newBrand.value, shopId: props.currentShop.id })
    newBrand.value = { name: '', description: '' }
    showToast('Đã thêm thương hiệu', 'success')
  } catch (e) {
    showToast('Lỗi thêm thương hiệu: ' + (e.message || 'Unknown'), 'error')
  }
}
async function removeBrand(id) {
  if (!confirm('Xóa thương hiệu này?')) return
  try {
    await deleteBrandApi(id)
    showToast('Đã xóa thương hiệu', 'success')
  } catch (e) {
    showToast('Lỗi xóa thương hiệu: ' + (e.message || 'Unknown'), 'error')
  }
}

async function adjustStock(productId, action, quantity) {
  try {
    const res = await apiFetch(`/products/${productId}/adjust-stock`, {
      method: 'POST',
      body: JSON.stringify({ action, quantity })
    })
    const updated = await res.json()
    if (updated) {
      const idx = products.value.findIndex(p => p.id === productId)
      if (idx !== -1) {
        products.value[idx].stock = updated.stock
      }
      showToast(action === 'add' ? `+${quantity} tồn kho` : `-${quantity} tồn kho`, 'success')
    }
  } catch (e) {
    showToast(e.message || 'Lỗi cập nhật tồn kho', 'error')
  }
}

async function addKeyword() {
  if (!newKeyword.value.keyword || !props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/keywords`, {
      method: 'POST',
      body: JSON.stringify(newKeyword.value),
    })
    newKeyword.value = { keyword: '', alert_type: 'highlight', color: '#ff3b5c', auto_reply_text: '' }
    await loadKeywords(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function deleteKeyword(id) {
  if (!confirm('Xóa keyword này?')) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/keywords/${id}`, { method: 'DELETE' })
    await loadKeywords(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function addTemplate() {
  if (!newTemplate.value.template_text || !props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/templates`, {
      method: 'POST',
      body: JSON.stringify(newTemplate.value),
    })
    newTemplate.value = { trigger_label: 'HOT', template_text: '' }
    await loadTemplates(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function deleteTemplate(id) {
  if (!confirm('Xóa mẫu trả lời này?')) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/templates/${id}`, { method: 'DELETE' })
    await loadTemplates(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function saveModerationConfig() {
  if (!props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        moderationBlacklist: moderationConfig.value.blacklist,
        moderationHideSpam: moderationConfig.value.hideSpam,
        moderationRateLimit: moderationConfig.value.rateLimitEnabled,
        moderationMaxPerMinute: moderationConfig.value.maxPerMinute,
      }),
    })
    showToast('Đã lưu cấu hình moderation', 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
  }
}
onMounted(() => {
  if (props.currentShop) {
    // Load moderation config from shop data
    moderationConfig.value = {
      blacklist: props.currentShop.moderation_blacklist || '',
      hideSpam: props.currentShop.moderation_hide_spam ?? true,
      rateLimitEnabled: props.currentShop.moderation_rate_limit ?? false,
      maxPerMinute: props.currentShop.moderation_max_per_minute ?? 5,
    }
    // Load categories & brands
    fetchCategories(props.currentShop.id)
    fetchBrands(props.currentShop.id)
  }
})


async function toggleAutoReply() {
  if (!props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}`, {
      method: 'PUT',
      body: JSON.stringify({ autoReplyEnabled: autoReplyEnabled.value }),
    })
    showToast(autoReplyEnabled.value ? 'Auto-reply đã bật' : 'Auto-reply đã tắt', 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
    autoReplyEnabled.value = !autoReplyEnabled.value
  }
}

function labelStyle(label) {
  const colors = { HOT: '#ef4444', WARM: '#f59e0b', keyword: '#3b82f6' }
  const c = colors[label] || '#6b7280'
  return { background: c + '18', color: c, borderColor: c }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Listen for auto_reply events from socket
function handleAutoReplyEvent(data) {
  autoReplyLog.value.unshift({ ...data, time: new Date().toISOString() })
  if (autoReplyLog.value.length > 20) autoReplyLog.value.pop()
}

defineExpose({ handleAutoReplyEvent })
</script>

<style scoped>
.settings { padding: 20px; overflow-y: auto; height: 100%; }
.settings__body { padding: 0 4px; }
.settings__platform-group {
  padding: 14px 16px; border-radius: 10px; background: var(--color-bg-primary);
  border: 1px solid var(--color-border); margin-bottom: 12px;
}
.settings__platform-label { font-size: 14px; font-weight: 700; margin-bottom: 10px; display: flex; align-items: center; gap: 10px; }
.settings__conn-badge {
  font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 12px;
  background: var(--color-bg-card-hover); color: var(--color-text-muted);
  border: 1px solid var(--color-border);
}
.settings__conn-badge--ok {
  background: rgba(16, 185, 129, 0.12); color: #10b981;
  border-color: rgba(16, 185, 129, 0.25);
}
.settings__help-text { font-size: 11px; color: var(--color-text-muted); margin-top: 4px; }
.settings__header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.settings__title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.settings__shop-name { font-size: 14px; color: var(--color-text-muted); padding: 4px 12px; background: var(--color-bg-secondary); border-radius: 6px; }
.settings__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 400px; color: var(--color-text-muted); gap: 8px; font-size: 14px;
  text-align: center; padding: 40px 20px;
}
.settings__empty-icon {
  width: 80px; height: 80px; border-radius: 20px;
  background: linear-gradient(135deg, var(--color-accent, #7c3aed) 0%, #a78bfa 100%);
  display: flex; align-items: center; justify-content: center;
  color: white; margin-bottom: 8px;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.25);
}
.settings__empty-title {
  font-size: 18px; font-weight: 700; color: var(--color-text-primary); margin: 0;
}
.settings__empty-desc {
  font-size: 13px; color: var(--color-text-secondary); max-width: 360px;
  line-height: 1.6; margin: 0;
}
.settings__empty-cta {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 10px 24px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, var(--color-accent, #7c3aed), #a78bfa);
  color: white; font-size: 14px; font-weight: 600;
  cursor: pointer; margin-top: 8px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.3);
}
.settings__empty-cta:hover {
  transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124, 58, 237, 0.4);
}
.settings__empty-hint {
  font-size: 12px; color: var(--color-text-muted); margin-top: 4px;
}
.settings__empty-hint strong { color: var(--color-accent, #7c3aed); }
.settings__tab-lock { opacity: 0.5; margin-left: -2px; }
.settings__tabs {
  display: flex; gap: 2px; background: var(--color-bg-primary); border-radius: 8px; padding: 2px; margin-bottom: 20px;
}
.settings__tab {
  display: flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 6px;
  border: none; background: transparent; color: var(--color-text-muted);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
  position: relative;
}
.settings__tab:hover { color: var(--color-text-primary); }
.settings__tab:disabled { opacity: 0.4; cursor: not-allowed; }
.settings__tab:disabled:hover { color: var(--color-text-muted); }
.settings__tab--active {
  background: var(--color-bg-secondary); color: var(--color-text-primary); font-weight: 600;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}
.settings__tab--active::after {
  content: ''; position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%);
  width: 20px; height: 2px; border-radius: 1px;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
}

.settings__panel {
  background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid var(--color-border); padding: 20px;
}
.settings__panel-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.settings__field { margin-bottom: 14px; }
.settings__field label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.settings__input {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary);
  font-size: 13px; outline: none; box-sizing: border-box; width: 100%;
}
.settings__input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
.settings__input--flex { flex: 1; }
.settings__input--sm { width: 120px; flex: none; }
.settings__textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px;
  font-family: inherit; outline: none; resize: vertical; box-sizing: border-box;
}
.settings__textarea:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
.settings__color-picker { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; }
.settings__add-row { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.settings__add-btn {
  display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px;
  border: none; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(124,58,237,0.25);
}
.settings__add-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(124,58,237,0.35); }
.settings__save-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px;
  border: none; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 12px;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(124,58,237,0.25);
}
.settings__save-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.35); }
.settings__list { display: flex; flex-direction: column; gap: 6px; }
.settings__list-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: var(--color-bg-primary); border-radius: 8px; font-size: 13px;
}
.settings__item-name { font-weight: 600; flex: 1; }
.settings__item-price { color: #10b981; font-weight: 700; }
.settings__item-kw { color: var(--color-text-muted); font-size: 12px; flex: 1; }
.settings__item-category {
  font-size: 11px; font-weight: 600; color: #818cf8;
  background: rgba(129, 140, 248, 0.1); padding: 2px 8px; border-radius: 4px;
}
.settings__item-slug {
  font-size: 11px; color: var(--color-text-muted); font-family: 'SF Mono', monospace;
  background: var(--color-bg-secondary); padding: 2px 6px; border-radius: 4px;
}
.settings__item-desc {
  font-size: 12px; color: var(--color-text-secondary); flex: 1;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px;
}
.settings__item-badge {
  font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
}
.badge--active { background: rgba(16, 185, 129, 0.1); color: #10b981; }
.badge--inactive { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
.settings__item-type { font-size: 11px; color: var(--color-text-muted); text-transform: capitalize; }
.settings__item-reply { flex: 1; font-size: 12px; color: var(--color-text-secondary); }
.settings__item-sku {
  font-size: 11px; color: var(--color-text-muted);
  background: var(--color-bg-secondary); padding: 1px 6px; border-radius: 4px;
}
.settings__item-stock {
  display: flex; align-items: center; gap: 4px;
  font-size: 12px; font-weight: 600; color: var(--color-text-primary);
}
.settings__item-stock.low-stock { color: #e74c3c; }
.low-badge {
  font-size: 9px; font-weight: 700;
  background: rgba(231, 76, 60, 0.15); color: #e74c3c;
  padding: 1px 5px; border-radius: 4px;
}
.settings__stock-btns { display: flex; gap: 2px; }
.stock-btn {
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px; border: 1px solid var(--color-border);
  background: none; cursor: pointer; color: var(--color-text-muted);
  transition: all 0.15s;
}
.stock-btn:hover { background: var(--color-bg-secondary); color: var(--color-text-primary); }
.stock-btn--plus:hover { color: #2ecc71; border-color: #2ecc71; }
.stock-btn--minus:hover { color: #e74c3c; border-color: #e74c3c; }
.settings__kw-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid; font-weight: 600;
}
.settings__del-btn {
  background: none; border: 1px solid var(--color-border); border-radius: 4px;
  padding: 4px 6px; cursor: pointer; color: var(--color-text-muted);
}
.settings__del-btn:hover { color: #ff3b5c; border-color: #ff3b5c; }
.settings__empty-list { text-align: center; padding: 16px; color: var(--color-text-muted); font-size: 13px; }

/* Responsive */
@media (max-width: 768px) {
  .settings__tabs { flex-wrap: wrap; }
  .settings__tab { flex: 1; min-width: 80px; justify-content: center; font-size: 11px; padding: 6px 8px; }
  .settings__add-row { flex-wrap: wrap; }
  .settings__input--sm { width: 100%; }
  .settings__input--flex { width: 100%; }
  .settings__list-item { flex-wrap: wrap; gap: 4px; }
}

/* Auto-reply Toggle */
.settings__toggle-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: var(--color-bg-primary); border-radius: 10px;
  margin-bottom: 16px; border: 1px solid var(--color-border);
}
.settings__switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.settings__switch input { opacity: 0; width: 0; height: 0; }
.settings__switch-slider {
  position: absolute; inset: 0; background: #555; border-radius: 24px;
  cursor: pointer; transition: 0.3s;
}
.settings__switch-slider::before {
  content: ''; position: absolute; width: 18px; height: 18px;
  left: 3px; top: 3px; background: white; border-radius: 50%;
  transition: 0.3s;
}
.settings__switch input:checked + .settings__switch-slider { background: #10b981; }
.settings__switch input:checked + .settings__switch-slider::before { transform: translateX(20px); }
.settings__toggle-label { font-size: 14px; font-weight: 700; }
.settings__toggle-hint { font-size: 11px; color: var(--color-text-muted); margin-left: auto; }
.settings__variable-hint {
  font-size: 11px; color: var(--color-text-muted); margin: -8px 0 14px;
}
.settings__variable-hint code {
  background: var(--color-bg-primary); padding: 1px 5px; border-radius: 3px;
  font-size: 10px; border: 1px solid var(--color-border);
}
.settings__active-badge {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: rgba(16,185,129,0.15); color: #10b981; font-weight: 600;
}

/* Auto-reply Log */
.settings__log { margin-top: 20px; }
.settings__log-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.settings__log-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: var(--color-bg-primary); border-radius: 6px; font-size: 12px;
  margin-bottom: 4px;
}
.settings__log-user { font-weight: 600; color: var(--color-text-primary); }
.settings__log-label { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.label--hot { background: rgba(239,68,68,0.15); color: #ef4444; }
.label--warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
.settings__log-text { flex: 1; color: var(--color-text-secondary); }
.settings__log-time { font-size: 10px; color: var(--color-text-muted); }

/* ── Appearance Tab ── */
.settings__section { margin-bottom: 24px; }
.settings__field-label {
  display: block; font-size: 13px; font-weight: 700;
  color: var(--color-text-secondary); margin-bottom: 10px;
  text-transform: uppercase; letter-spacing: 0.5px;
}

/* Theme Mode Selector */
.theme-mode-selector { display: flex; gap: 8px; }
.theme-mode-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px; border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
}
.theme-mode-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
.theme-mode-btn.active {
  background: var(--color-accent-primary);
  color: #fff;
  border-color: var(--color-accent-primary);
  box-shadow: 0 4px 12px var(--color-accent-glow);
}

/* Accent Color Picker */
.accent-picker { display: flex; gap: 10px; flex-wrap: wrap; }
.accent-swatch {
  width: 42px; height: 42px; border-radius: 50%;
  border: 2px solid var(--color-border);
  background: transparent;
  cursor: pointer; transition: all 0.25s;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.accent-swatch__dot {
  width: 26px; height: 26px; border-radius: 50%;
  background: var(--swatch);
  transition: transform 0.2s;
}
.accent-swatch:hover {
  border-color: var(--swatch);
  transform: scale(1.1);
}
.accent-swatch.active {
  border-color: var(--swatch);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.15), 0 4px 12px rgba(0,0,0,0.15);
}
.accent-swatch.active .accent-swatch__dot {
  transform: scale(1.15);
}

/* Font Size Selector */
.font-size-selector { display: flex; gap: 8px; }
.font-size-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 16px; border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.25s;
}
.font-size-btn:hover {
  border-color: var(--color-border-hover);
  color: var(--color-text-primary);
}
.font-size-btn.active {
  background: var(--color-accent-primary);
  color: #fff;
  border-color: var(--color-accent-primary);
  box-shadow: 0 4px 12px var(--color-accent-glow);
}

/* ─── Carrier Integration Tab ─── */
.settings__panel-desc {
  color: var(--color-text-secondary);
  font-size: 0.85rem;
  margin-bottom: 18px;
  line-height: 1.6;
}
.carrier-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin-bottom: 12px;
}
.carrier-card {
  background: var(--color-surface-secondary);
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 16px;
  transition: all 0.25s ease;
}
.carrier-card--connected {
  border-color: #22c55e;
  box-shadow: 0 0 0 1px rgba(34, 197, 94, 0.2), 0 4px 16px rgba(34, 197, 94, 0.08);
}
.carrier-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.carrier-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}
.carrier-card__name {
  font-weight: 600;
  font-size: 0.95rem;
  color: var(--color-text-primary);
  margin: 0;
}
.carrier-card__status { font-size: 0.75rem; }
.status--ok { color: #22c55e; }
.status--off { color: var(--color-text-secondary); opacity: 0.6; }
.carrier-card__body .form-group { margin-bottom: 10px; }
.carrier-card__body .form-group label {
  display: block;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}
.carrier-card__body .form-group input {
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.85rem;
}
.carrier-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  flex-wrap: wrap;
}
.btn-test {
  padding: 6px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-accent-primary);
  background: transparent;
  color: var(--color-accent-primary);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-test:hover:not(:disabled) {
  background: var(--color-accent-primary);
  color: #fff;
}
.btn-test:disabled { opacity: 0.4; cursor: not-allowed; }
.test-result { font-size: 0.78rem; font-weight: 500; }
.test--ok { color: #22c55e; }
.test--fail { color: #ef4444; }

.sender-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.carrier-select {
  width: 100%;
  max-width: 320px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-size: 0.85rem;
}
.btn-save-shipping {
  margin-top: 20px;
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, var(--color-accent-primary), var(--color-accent-secondary, var(--color-accent-primary)));
  color: #fff;
  font-weight: 600;
  font-size: 0.88rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px var(--color-accent-glow);
}
.btn-save-shipping:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px var(--color-accent-glow);
}
.btn-save-shipping:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

