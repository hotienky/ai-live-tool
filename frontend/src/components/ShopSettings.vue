<template>
  <div class="settings">
    <div class="settings__header">
      <h2 class="settings__title">
        <Settings :size="20" />
        {{ sectionTitle }}
      </h2>
      <span class="settings__shop-name" v-if="currentShop">{{ currentShop.shop_name || currentShop.shopName }}</span>
    </div>

    <div class="settings__layout">
      <!-- Sidebar Navigation -->
      <aside class="settings__sidebar">
        <div v-for="group in activeTabGroups" :key="group.label" class="settings__sidebar-group">
          <div class="settings__sidebar-label">{{ group.label }}</div>
          <button
            v-for="tab in group.items"
            :key="tab.key"
            class="settings__sidebar-item"
            :class="{ 'settings__sidebar-item--active': activeTab === tab.key }"
            @click="onSidebarClick(tab.key)"
          >
            <component :is="tab.icon" :size="16" />
            <span>{{ tab.label }}</span>
          </button>
        </div>
      </aside>

      <!-- Content Panel -->
      <div class="settings__content">

        <!-- ═══ Tab: Appearance ═══ -->
        <div v-if="activeTab === 'appearance'" class="settings__panel appearance-split">
          <!-- Left: Controls -->
          <div class="appearance-split__controls">
            <h3 class="settings__panel-title"><Palette :size="16" style="vertical-align:middle" /> Giao diện CMS</h3>

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
                  @click="onAccentPreset(name)"
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

            <!-- Storefront Theme Customizer -->
            <div style="margin-top: 24px">
              <h3 class="settings__panel-title"><Store :size="16" style="vertical-align:middle" /> Giao diện Cửa Hàng</h3>
              <ThemeCustomizer @saved="onThemeSaved" />
            </div>
          </div>

          <!-- Right: Live Preview -->
          <div class="appearance-split__preview">
            <div class="ap-header">
              <h4 class="ap-title"><Eye :size="14" /> Xem trước</h4>
              <div class="ap-device-btns">
                <button :class="{ active: apDevice === 'desktop' }" @click="apDevice = 'desktop'" title="Desktop">
                  <MonitorIcon :size="14" />
                </button>
                <button :class="{ active: apDevice === 'tablet' }" @click="apDevice = 'tablet'" title="Tablet">
                  <Tablet :size="14" />
                </button>
                <button :class="{ active: apDevice === 'mobile' }" @click="apDevice = 'mobile'" title="Mobile">
                  <Smartphone :size="14" />
                </button>
              </div>
              <button class="ap-refresh" @click="apPreviewKey++" title="Làm mới">
                <RotateCcw :size="13" />
              </button>
            </div>
            <div class="ap-iframe-wrap" :class="'ap-iframe-wrap--' + apDevice">
              <iframe
                v-if="apStorefrontUrl"
                :src="apStorefrontUrl"
                :key="apPreviewKey"
                class="ap-iframe"
              ></iframe>
              <div v-else class="ap-no-url">
                <AlertCircle :size="22" />
                <p>Nhập URL storefront để xem trước</p>
                <div class="ap-url-input">
                  <input
                    v-model="apUrlInput"
                    type="url"
                    placeholder="https://store.fashionvn.com"
                    @keyup.enter="apStorefrontUrl = apUrlInput; apPreviewKey++"
                  />
                  <button @click="apStorefrontUrl = apUrlInput; apPreviewKey++" :disabled="!apUrlInput">Xem</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ═══ Tab: Connection ═══ -->
        <div v-if="activeTab === 'connection'" class="settings__panel">
          <h3 class="settings__panel-title"><Link :size="16" style="vertical-align:middle" /> Kết nối nền tảng</h3>

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
        <ProductManager />
      </div>

      <!-- ═══ Tab: Categories ═══ -->
      <div v-if="activeTab === 'categories'" class="settings__panel">
        <CategoryManager />
      </div>

      <!-- ═══ Tab: Brands ═══ -->
      <div v-if="activeTab === 'brands'" class="settings__panel">
        <BrandManager />
      </div>

      <!-- ═══ Tab: Keywords ═══ -->
      <div v-if="activeTab === 'keywords'" class="settings__panel">
        <h3 class="settings__panel-title"><KeyRound :size="14" /> Keywords Alert ({{ keywords.length }})</h3>
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
        <CustomerManager />
      </div>

      <!-- ═══ Tab: Promotions + Coupons ═══ -->
      <div v-if="activeTab === 'promotions'" class="settings__panel">
        <PromotionManager />
      </div>

      <!-- ═══ Tab: Flash Sales ═══ -->
      <div v-if="activeTab === 'flash-sales'" class="settings__panel">
        <FlashSaleManager />
      </div>

      <!-- ═══ Tab: CMS Pages ═══ -->
      <div v-if="activeTab === 'cms'" class="settings__panel">
        <CmsPageForm
          v-if="activeView === 'shop/cms/create' || activeView === 'shop/cms/edit'"
          :pageId="cmsEditPageId"
          @navigate="$emit('navigate', $event)"
        />
        <CmsManager v-else @navigate="$emit('navigate', $event)" />
      </div>

      <!-- ═══ Tab: Storefront Layout ═══ -->
      <div v-if="activeTab === 'storefront-layout'" class="settings__panel">
        <StorefrontLayoutBuilder />
      </div>

      <!-- ═══ Tab: Banners ═══ -->
      <div v-if="activeTab === 'banners'" class="settings__panel">
        <BannerManager />
      </div>



      <!-- ═══ Tab: System Config ═══ -->
      <!-- Store Info -->
      <div v-if="activeTab === 'store-info'" class="settings__panel">
        <StoreInfoConfig />
      </div>

      <div v-if="activeTab === 'system-config'" class="settings__panel">
        <SystemConfigPanel />
      </div>

      <!-- ═══ Tab: API Keys ═══ -->
      <div v-if="activeTab === 'api-keys'" class="settings__panel">
        <ApiKeyManager />
      </div>

      <!-- ═══ Tab: Languages ═══ -->
      <div v-if="activeTab === 'languages'" class="settings__panel">
        <LanguageManager />
      </div>

      <!-- ═══ Tab: Custom Fields ═══ -->
      <div v-if="activeTab === 'custom-fields'" class="settings__panel">
        <CustomFieldManager />
      </div>

      <!-- ═══ Tab: Orders ═══ -->
      <div v-if="activeTab === 'orders'" class="settings__panel">
        <OrderManagement @view-order="viewOrderDetail" />
      </div>

      <!-- ═══ Tab: Order Detail ═══ -->
      <div v-if="activeTab === 'order-detail'" class="settings__panel">
        <OrderDetailPage :orderId="orderDetailId" @back="goBackToOrders" />
      </div>

      <!-- ═══ Tab: Webhooks ═══ -->
      <div v-if="activeTab === 'webhooks'" class="settings__panel">
        <WebhookManager />
      </div>

      <!-- ═══ Tab: Activity Logs ═══ -->
      <div v-if="activeTab === 'activity-logs'" class="settings__panel settings__panel--fullheight">
        <ActivityLog />
      </div>

      <!-- ═══ Tab: Roles ═══ -->
      <div v-if="activeTab === 'roles'" class="settings__panel">
        <RoleManager />
      </div><!-- /last panel -->

      <!-- ═══ Tab: Payment Settings ═══ -->
      <div v-if="activeTab === 'payment'" class="settings__panel">
        <PaymentSettings />
      </div>

      <!-- ═══ Tab: Shipping Settings ═══ -->
      <div v-if="activeTab === 'shipping'" class="settings__panel">
        <ShippingSettings />
      </div>

      <!-- ═══ Tab: Tax Management ═══ -->
      <div v-if="activeTab === 'tax'" class="settings__panel">
        <TaxManagement @navigate-to-accounting="navigateTab('accounting')" />
      </div>

      <!-- ═══ Tab: Accounting Dashboard ═══ -->
      <div v-if="activeTab === 'accounting'" class="settings__panel">
        <AccountingDashboard
          @navigate-to-tax="navigateTab('tax')"
          @navigate-to-order="(orderId) => { navigateTab('orders'); }"
        />
      </div>

      <!-- ═══ Tab: Stock Receipts ═══ -->
      <div v-if="activeTab === 'stock-receipts'" class="settings__panel">
        <StockReceiptManager />
      </div>

      <!-- ═══ Tab: Suppliers ═══ -->
      <div v-if="activeTab === 'suppliers'" class="settings__panel">
        <SupplierManager />
      </div>

      <!-- ═══ Tab: Payment Vouchers ═══ -->
      <div v-if="activeTab === 'payment-vouchers'" class="settings__panel">
        <PaymentVoucherManager />
      </div>

      <!-- ═══ Tab: Purchase Orders ═══ -->
      <div v-if="activeTab === 'purchase-orders'" class="settings__panel">
        <PurchaseOrderManager />
      </div>

      <!-- ═══ Tab: Inventory Reports ═══ -->
      <div v-if="activeTab === 'inventory-reports'" class="settings__panel">
        <InventoryReportPanel />
      </div>

      </div><!-- /settings__content -->
    </div><!-- /settings__layout -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  Settings, Store, Save, Plus, Trash2, Minus,
  Link, ShoppingBag, Key, MessageCircle, Shield, Package,
  Palette, Sun, Moon, Monitor as MonitorIcon, Lock, CreditCard,
  Music, BookOpen, Video, ShoppingCart, ClipboardList,
  FolderTree, Award, Users, Tag, Zap, BarChart2,
  Cog, KeyRound, Globe, LayoutList, DollarSign, Briefcase, Wallet,
  ShieldCheck, Webhook, ScrollText, Receipt, Truck,
  Eye, Tablet, Smartphone, RotateCcw, AlertCircle,
} from 'lucide-vue-next'
import CustomerManager from './CustomerManager.vue'
import PromotionManager from './PromotionManager.vue'
import FlashSaleManager from './FlashSaleManager.vue'
import CmsManager from './CmsManager.vue'
import CmsPageForm from './CmsPageForm.vue'
import BannerManager from './BannerManager.vue'
import NavLinkManager from './NavLinkManager.vue'
import StockReceiptManager from './StockReceiptManager.vue'
import SupplierManager from './SupplierManager.vue'
import PaymentVoucherManager from './PaymentVoucherManager.vue'
import PurchaseOrderManager from './PurchaseOrderManager.vue'
import InventoryReportPanel from './InventoryReportPanel.vue'
import ProductManager from './ProductManager.vue'
import CategoryManager from './CategoryManager.vue'
import BrandManager from './BrandManager.vue'
import RoleManager from './RoleManager.vue'
import SystemConfigPanel from './SystemConfigPanel.vue'
import ApiKeyManager from './ApiKeyManager.vue'
import LanguageManager from './LanguageManager.vue'
import CustomFieldManager from './CustomFieldManager.vue'
import OrderManagement from './OrderManagement.vue'
import OrderDetailPage from './OrderDetailPage.vue'
import WebhookManager from './WebhookManager.vue'
import ActivityLog from './ActivityLog.vue'
import ThemeCustomizer from './ThemeCustomizer.vue'
import PaymentSettings from './PaymentSettings.vue'
import ShippingSettings from './ShippingSettings.vue'
import TaxManagement from './TaxManagement.vue'
import AccountingDashboard from './AccountingDashboard.vue'
import StorefrontLayoutBuilder from './StorefrontLayoutBuilder.vue'
import StoreInfoConfig from './StoreInfoConfig.vue'
import { apiFetch } from '../composables/useApi.js'
import { useCategories } from '../composables/useCategories.js'
import { useBrands } from '../composables/useBrands.js'
import { useTheme } from '../composables/useTheme.js'
import { usePermissions } from '../composables/usePermissions.js'
import { useUrlParam } from '../composables/useUrlFilter.js'
import { useToast } from '../composables/useToast.js'
import { logger } from '../utils/logger.js'
const { showToast } = useToast()

const props = defineProps({
  currentShop: { type: Object, default: null },
  initialTab: { type: String, default: '' },
  activeView: { type: String, default: '' },
  cmsEditPageId: { type: String, default: null },
})

const emit = defineEmits(['openShopSelector', 'navigate'])

const { theme, accentColor, fontSize: fontSizePref, accentPresets, setTheme, setAccent, setFontSize } = useTheme()
const { can, canAny, isSuperAdmin } = usePermissions()

// Sync "Màu nhấn" preset with CMS admin panel UI only
// NOTE: This does NOT affect storefront colors. Storefront accents are configured
// separately in ThemeCustomizer (per dark/light mode) and saved as dark_accent/light_accent
async function onAccentPreset(name) {
  setAccent(name) // Update CMS local theme
  const preset = accentPresets[name]
  if (!preset) return
  const hex = preset.primary
  // Apply CSS vars immediately (CMS admin only)
  const root = document.documentElement
  let h = hex.replace('#', '')
  if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]
  const r = parseInt(h.substring(0,2), 16), g = parseInt(h.substring(2,4), 16), b = parseInt(h.substring(4,6), 16)
  const darken = (v) => Math.max(0, Math.round(v * 0.8))
  const lighten = (v) => Math.min(255, Math.round(v + (255 - v) * 0.3))
  const dr = darken(r), dg = darken(g), db = darken(b)
  const lr = lighten(r), lg = lighten(g), lb = lighten(b)
  root.style.setProperty('--accent', hex)
  root.style.setProperty('--color-accent-primary', hex)
  root.style.setProperty('--color-accent-glow', `rgba(${r},${g},${b},0.2)`)
  root.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${hex}, #${dr.toString(16).padStart(2,'0')}${dg.toString(16).padStart(2,'0')}${db.toString(16).padStart(2,'0')})`)
  root.style.setProperty('--accent-light', `#${lr.toString(16).padStart(2,'0')}${lg.toString(16).padStart(2,'0')}${lb.toString(16).padStart(2,'0')}`)
  root.style.setProperty('--accent-shadow', `0 4px 15px rgba(${r},${g},${b},0.25)`)
  root.style.setProperty('--accent-rgb', `${r},${g},${b}`)
}

// ── Tab → Permission mapping ──
const tabPermissions = {
  'products': 'products.view',
  'categories': 'products.view',
  'brands': 'products.view',
  'orders': 'orders.view',
  'shop-customers': 'customers.view',
  'promotions': 'promotions.view',
  'flash-sales': 'promotions.view',
  'cms': 'cms.view',
  'banners': 'banners.view',

  'appearance': 'settings.view',
  'storefront-layout': 'settings.view',
  'store-info': 'settings.edit',
  'system-config': 'settings.view',
  'payment': 'settings.edit',
  'shipping': 'settings.edit',
  'api-keys': 'system.api_keys',
  'webhooks': 'system.webhooks',
  'languages': 'settings.view',
  'custom-fields': 'settings.edit',
  'activity-logs': 'system.activity_logs',
  'roles': 'system.roles',
}

// ── Appearance Live Preview ──
const apDevice = ref('desktop')
const apPreviewKey = ref(0)
const apStorefrontUrl = ref('')
const apUrlInput = ref('')

function onThemeSaved() {
  apPreviewKey.value++
}

async function loadStorefrontUrl() {
  try {
    const res = await apiFetch('/system-config/group/storefront_layout')
    const map = res?.data || res || {}
    if (typeof map === 'object') {
      for (const [k, v] of Object.entries(map)) {
        if (k === 'storefront_url' && v) {
          apStorefrontUrl.value = v
          apUrlInput.value = v
          return
        }
      }
    }
  } catch { /* ignore */ }
}

const validTabKeys = ['connection', 'products', 'categories', 'brands', 'keywords', 'replies', 'moderation', 'appearance', 'shop-customers', 'promotions', 'flash-sales', 'orders', 'order-detail', 'cms', 'banners', 'system-config', 'store-info', 'api-keys', 'webhooks', 'languages', 'custom-fields', 'activity-logs', 'roles', 'payment', 'shipping', 'tax', 'accounting', 'storefront-layout', 'stock-receipts', 'suppliers', 'payment-vouchers', 'purchase-orders', 'inventory-reports']
const activeTab = useUrlParam('tab', 'connection')
// Order detail
const orderDetailId = ref(null)
function extractOrderId() {
  const m = window.location.pathname.match(/orders\/detail\/(\d+)/)
  return m ? m[1] : null
}
orderDetailId.value = extractOrderId()
function viewOrderDetail(orderId) {
  orderDetailId.value = orderId
  history.pushState({}, '', `/orders/detail/${orderId}`)
  activeTab.value = 'order-detail'
}
function goBackToOrders() {
  history.pushState({}, '', '/orders')
  activeTab.value = 'orders'
}
function navigateTab(tabKey) {
  activeTab.value = tabKey
  const route = tabToRoute[tabKey]
  if (route) {
    history.pushState({}, '', route)
    emit('navigate', route)
  }
}
// Validate tab value from URL
if (!validTabKeys.includes(activeTab.value)) activeTab.value = 'connection'
// Sync with parent initialTab prop
watch(() => props.initialTab, (newTab) => {
  if (newTab && validTabKeys.includes(newTab)) {
    activeTab.value = newTab
  }
}, { immediate: true })
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

]
const allTabs = [
  ...tabs,
  { key: 'store-info', label: 'Cửa hàng', icon: Store },
  { key: 'appearance', label: 'Giao diện', icon: Palette },
]
const tabGroups = [
  {
    label: 'Sản phẩm',
    items: [
      { key: 'products', label: 'Sản phẩm', icon: ShoppingBag },
      { key: 'categories', label: 'Danh mục', icon: FolderTree },
      { key: 'brands', label: 'Thương hiệu', icon: Award },
    ],
  },
  {
    label: 'Bán hàng',
    items: [
      { key: 'orders', label: 'Đơn hàng', icon: Receipt },
      { key: 'shop-customers', label: 'Khách hàng', icon: Users },
      { key: 'accounting', label: 'Kế toán', icon: DollarSign },
      { key: 'payment', label: 'Thanh toán', icon: CreditCard },
      { key: 'shipping', label: 'Vận chuyển', icon: Truck },
      { key: 'tax', label: 'Thuế', icon: Receipt },
    ],
  },
  {
    label: 'Kho & Tài chính',
    items: [
      { key: 'stock-receipts', label: 'Phiếu kho', icon: ClipboardList },
      { key: 'suppliers', label: 'Nhà cung cấp', icon: Briefcase },
      { key: 'payment-vouchers', label: 'Thu/Chi', icon: Wallet },
      { key: 'purchase-orders', label: 'Đơn mua hàng', icon: ShoppingCart },
      { key: 'inventory-reports', label: 'Báo cáo kho', icon: BarChart2 },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { key: 'promotions', label: 'Khuyến mãi', icon: Tag },
      { key: 'flash-sales', label: 'Flash Sale', icon: Zap },
    ],
  },
  {
    label: 'Giao diện',
    items: [
      { key: 'cms', label: 'Trang CMS', icon: BookOpen },
      { key: 'banners', label: 'Banner', icon: Video },

      { key: 'appearance', label: 'Theme', icon: Palette },
      { key: 'storefront-layout', label: 'Bố cục Cửa Hàng', icon: LayoutList },
    ],
  },
  {
    label: 'Cửa hàng',
    items: [
      { key: 'store-info', label: 'Thông tin', icon: Store },
      { key: 'system-config', label: 'Cấu hình', icon: Cog },
      { key: 'languages', label: 'Ngôn ngữ', icon: Globe },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { key: 'api-keys', label: 'API Keys', icon: KeyRound },
      { key: 'webhooks', label: 'Webhooks', icon: Webhook },
      { key: 'custom-fields', label: 'Custom Fields', icon: LayoutList },
      { key: 'activity-logs', label: 'Nhật ký', icon: ScrollText },
      { key: 'roles', label: 'Phân quyền', icon: ShieldCheck },
    ],
  },
]

// ── Tab → Route mapping for sidebar navigation ──
const tabToRoute = {
  // Live
  'connection': 'live/connection', 'keywords': 'live/keywords', 'replies': 'live/replies', 'moderation': 'live/moderation',
  // Sản phẩm
  'products': 'shop/products', 'categories': 'shop/categories', 'brands': 'shop/brands',
  // Bán hàng
  'orders': 'orders', 'shop-customers': 'orders/customers', 'accounting': 'orders/accounting',
  'stock-receipts': 'warehouse/stock-receipts', 'suppliers': 'warehouse/suppliers', 'payment-vouchers': 'warehouse/payment-vouchers', 'purchase-orders': 'warehouse/purchase-orders', 'inventory-reports': 'warehouse/inventory-reports',
  'payment': 'shop/payment', 'shipping': 'shop/shipping', 'tax': 'shop/tax',
  // Marketing
  'promotions': 'shop/promotions', 'flash-sales': 'shop/flash-sales',
  // Giao diện
  'cms': 'shop/cms', 'banners': 'shop/banners',
  'appearance': 'shop/appearance', 'storefront-layout': 'shop/layout',
  // Cửa hàng
  'store-info': 'shop/info', 'system-config': 'shop/config', 'languages': 'shop/languages',
  // Hệ thống
  'api-keys': 'system/api-keys', 'webhooks': 'system/webhooks', 'custom-fields': 'shop/custom-fields',
  'activity-logs': 'system/logs', 'roles': 'system/roles',
}

// Section-specific sidebar groups
const liveTabs = ['connection', 'keywords', 'replies', 'moderation']
const shopTabs = ['products', 'categories', 'brands', 'orders', 'shop-customers', 'accounting', 'promotions', 'flash-sales', 'banners', 'cms', 'appearance', 'storefront-layout', 'store-info', 'system-config', 'payment', 'shipping', 'tax', 'api-keys', 'webhooks', 'languages', 'custom-fields', 'activity-logs', 'roles', 'stock-receipts', 'suppliers', 'payment-vouchers', 'purchase-orders', 'inventory-reports']

const activeTabGroups = computed(() => {
  const tab = activeTab.value
  let allowedTabs
  if (liveTabs.includes(tab)) allowedTabs = liveTabs
  else allowedTabs = shopTabs
  return tabGroups
    .map(g => ({
      ...g,
      items: g.items.filter(i => {
        if (!allowedTabs.includes(i.key)) return false
        const requiredPerm = tabPermissions[i.key]
        if (!requiredPerm) return true
        return can(requiredPerm)
      }),
    }))
    .filter(g => g.items.length > 0)
})

const sectionTitle = computed(() => {
  const tab = activeTab.value
  if (liveTabs.includes(tab)) return 'Cài đặt Live'
  return 'Cửa hàng'
})

function onSidebarClick(tabKey) {
  activeTab.value = tabKey
  const route = tabToRoute[tabKey]
  if (route) emit('navigate', route)
}

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

// Roles
const roles = ref([])

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
  await Promise.all([loadProducts(), loadKeywords(shop.id), loadTemplates(shop.id), loadRoles()])
}

async function loadRoles() {
  try {
    const res = await apiFetch('/roles')
    const data = await res.json()
    roles.value = Array.isArray(data) ? data : (data.data || [])
  } catch { roles.value = [] }
}

async function loadProducts() {
  try {
    const res = await apiFetch('/products')
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
      body: JSON.stringify(newProduct.value),
    })
    newProduct.value = { name: '', price: '', keywords: '', category: '' }
    await loadProducts()
    showToast('Đã thêm sản phẩm', 'success')
  } catch (e) {
    showToast('Lỗi thêm sản phẩm: ' + (e.message || 'Unknown'), 'error')
  }
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' })
    await loadProducts()
    showToast('Đã xóa sản phẩm', 'success')
  } catch (e) {
    showToast('Lỗi xóa sản phẩm: ' + (e.message || 'Unknown'), 'error')
  }
}

// ── Category handlers ──
async function addCategory() {
  if (!newCategory.value.name || !props.currentShop) return
  try {
    await createCategory(newCategory.value)
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
    await createBrand(newBrand.value)
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
  loadStorefrontUrl()
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
.settings { display: flex; flex-direction: column; overflow: hidden; height: 100%; }
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
  display: flex; align-items: center; gap: 12px; padding: 16px 20px;
  border-bottom: 1px solid var(--color-border); flex-shrink: 0;
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
  background: var(--accent-gradient);
  display: flex; align-items: center; justify-content: center;
  color: white; margin-bottom: 8px;
  box-shadow: var(--accent-shadow);
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
  background: var(--accent-gradient);
  color: white; font-size: 14px; font-weight: 600;
  cursor: pointer; margin-top: 8px;
  transition: all 0.2s; box-shadow: var(--accent-shadow);
}
.settings__empty-cta:hover {
  transform: translateY(-1px); box-shadow: var(--accent-shadow);
}
.settings__empty-hint {
  font-size: 12px; color: var(--color-text-muted); margin-top: 4px;
}
.settings__empty-hint strong { color: var(--color-accent-primary); }
.settings__tab-lock { opacity: 0.5; margin-left: -2px; }

/* ── Sidebar Layout ── */
.settings__layout {
  display: flex;
  gap: 0;
  flex: 1;
  overflow: hidden;
}
.settings__sidebar {
  width: 200px;
  min-width: 200px;
  background: var(--color-bg-sidebar, var(--color-bg-primary));
  border-right: 1px solid var(--color-border);
  padding: 12px 8px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.settings__sidebar-group {
  margin-bottom: 8px;
}
.settings__sidebar-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-muted);
  padding: 8px 12px 4px;
  margin-bottom: 2px;
}
.settings__sidebar-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.settings__sidebar-item:hover {
  color: var(--color-text-primary);
  background: var(--color-bg-card-hover);
}
.settings__sidebar-item--active {
  color: var(--color-accent-primary);
  background: var(--color-accent-glow);
  font-weight: 600;
}
.settings__sidebar-item--active svg {
  color: var(--color-accent-primary);
}
.settings__content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}
.settings__content--full {
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.settings__panel {
  background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid var(--color-border); padding: 20px;
}
.settings__panel--fullheight {
  flex: 1; display: flex; flex-direction: column; min-height: 0;
}

/* ═══ Appearance Split Layout ═══ */
.appearance-split {
  display: flex !important; gap: 20px; padding: 0 !important;
  background: transparent !important; border: none !important;
}
.appearance-split__controls {
  flex: 1; min-width: 0; max-height: calc(100vh - 140px); overflow-y: auto;
  padding: 20px; background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border);
}
.appearance-split__preview {
  width: 420px; flex-shrink: 0; display: flex; flex-direction: column;
  background: var(--color-bg-secondary); border-radius: 12px;
  border: 1px solid var(--color-border); overflow: hidden;
}
.ap-header {
  display: flex; align-items: center; gap: 8px; padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
}
.ap-title {
  font-size: 13px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px;
  color: var(--color-text-primary); flex: 1;
}
.ap-device-btns {
  display: flex; gap: 2px;
}
.ap-device-btns button {
  display: flex; align-items: center; justify-content: center;
  width: 30px; height: 28px; border-radius: 6px; border: 1px solid transparent;
  background: none; color: var(--color-text-muted); cursor: pointer; transition: all 0.15s;
}
.ap-device-btns button:hover { color: var(--color-text-primary); }
.ap-device-btns button.active {
  background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary);
}
.ap-refresh {
  display: flex; align-items: center; justify-content: center;
  width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--color-border);
  background: var(--color-bg-card-solid); color: var(--color-text-muted); cursor: pointer;
  transition: all 0.2s;
}
.ap-refresh:hover { color: var(--color-text-primary); border-color: var(--color-text-muted); }
.ap-iframe-wrap {
  flex: 1; display: flex; justify-content: center; background: var(--color-bg-inset, #0006);
  padding: 8px; overflow: hidden; transition: all 0.3s;
}
.ap-iframe-wrap--desktop .ap-iframe { width: 100%; }
.ap-iframe-wrap--tablet .ap-iframe { width: 768px; max-width: 100%; }
.ap-iframe-wrap--mobile .ap-iframe { width: 375px; max-width: 100%; }
.ap-iframe {
  border: none; border-radius: 8px; background: #fff;
  height: calc(100vh - 200px); transition: width 0.3s;
}
.ap-no-url {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: 40px 20px; color: var(--color-text-muted); text-align: center;
  width: 100%;
}
.ap-no-url p { font-size: 12px; margin: 0; }
.ap-url-input {
  display: flex; gap: 6px; width: 100%; max-width: 300px; margin-top: 4px;
}
.ap-url-input input {
  flex: 1; padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border);
  background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 12px;
}
.ap-url-input input:focus { outline: none; border-color: var(--color-accent-primary); }
.ap-url-input button {
  padding: 6px 14px; border-radius: 6px; border: none;
  background: var(--color-accent-primary); color: #fff;
  font-size: 12px; font-weight: 600; cursor: pointer;
}
.ap-url-input button:disabled { opacity: .4; cursor: not-allowed; }
@media (max-width: 1024px) {
  .appearance-split { flex-direction: column; }
  .appearance-split__preview { width: 100%; }
  .ap-iframe { height: 400px; }
}
.settings__panel-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.settings__field { margin-bottom: 14px; }
.settings__field label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.settings__input {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary);
  font-size: 13px; outline: none; box-sizing: border-box; width: 100%;
}
.settings__input:focus { border-color: var(--color-accent-primary); box-shadow: 0 0 0 3px var(--color-accent-glow); }
.settings__input--flex { flex: 1; }
.settings__input--sm { width: 120px; flex: none; }
.settings__textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px;
  font-family: inherit; outline: none; resize: vertical; box-sizing: border-box;
}
.settings__textarea:focus { border-color: var(--color-accent-primary); box-shadow: 0 0 0 3px var(--color-accent-glow); }
.settings__color-picker { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; }
.settings__add-row { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.settings__add-btn {
  display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px;
  border: none; background: var(--accent-gradient); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: all 0.2s; box-shadow: var(--accent-shadow);
}
.settings__add-btn:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
.settings__save-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px;
  border: none; background: var(--accent-gradient); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 12px;
  transition: all 0.2s; box-shadow: var(--accent-shadow);
}
.settings__save-btn:hover { transform: translateY(-1px); box-shadow: var(--accent-shadow); }
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
  box-shadow: 0 0 0 3px var(--color-accent-glow), 0 4px 12px rgba(0,0,0,0.15);
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

