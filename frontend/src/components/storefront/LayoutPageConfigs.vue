<template>
  <div class="lb-section">
    <h4 class="lb-section__title"><Settings2 :size="14" /> {{ t('admin.msg_ff9d51ad', 'Cấu hình trang') }}</h4>
    
    <!-- Dynamic Composition Notice -->
    <div class="page-config-notice" v-if="activePageId">
      <div class="page-config-notice__icon">
        <LayoutGrid :size="20" />
      </div>
      <div class="page-config-notice__body">
        <p class="page-config-notice__title">Bố cục linh động</p>
        <p class="page-config-notice__desc">
          Trang này được tạo từ các <strong>section blocks</strong> có thể tùy chỉnh tự do. 
          Chuyển sang tab <strong>Cấu trúc</strong> để thêm, xóa, sắp xếp các blocks.
        </p>
        <button class="page-config-notice__btn" @click="$emit('go-to-structure')">
          <Layers :size="14" /> Mở tab Cấu trúc
        </button>
      </div>
    </div>

    <!-- Quick Setup Wizard for new pages -->
    <div v-if="activePageId && !hasExistingSections" class="page-config-wizard">
      <p class="page-config-wizard__label">Khởi tạo nhanh</p>
      <p class="page-config-wizard__hint">Chọn một cấu hình mẫu để bắt đầu:</p>
      
      <div class="page-config-wizard__presets">
        <button 
          v-for="preset in quickPresets" :key="preset.key"
          class="page-config-wizard__preset"
          @click="$emit('apply-preset', preset.key)"
        >
          <component :is="preset.icon" :size="16" />
          <span>{{ preset.label }}</span>
          <span class="page-config-wizard__preset-desc">{{ preset.desc }}</span>
        </button>
      </div>
    </div>

    <!-- Legacy Page Configs (still shown for Global page overview) -->
    <div v-if="!activePageId" class="page-config-list">
      <!-- Products Page Config -->
      <div class="page-config" :class="{ expanded: expandedPageConfig === 'products' }">
        <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'products' ? null : 'products'">
          <ShoppingBag :size="14" /><span>{{ t('admin.msg_4c779e64', 'Trang sản phẩm') }}</span><ChevronDown :size="12" class="page-config__chevron" />
        </div>
        <div v-if="expandedPageConfig === 'products'" class="page-config__body">
          <div class="param-row"><label>Sidebar</label>
            <select v-model="configs.products.sidebarPosition" class="param-select">
              <option value="left">{{ t('admin.msg_c8b3d56a', 'Bên trái') }}</option><option value="right">{{ t('admin.msg_5fe4c314', 'Bên phải') }}</option><option value="hidden">{{ t('admin.msg_f7bc96f2', 'Ẩn') }}</option>
            </select>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_70c4bd9c', 'Cột sản phẩm') }}</label>
            <input type="range" v-model.number="configs.products.gridColumns" min="2" max="5" class="param-range" />
            <span class="param-value">{{ configs.products.gridColumns }}</span>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_61e6c40e', 'SP mỗi trang') }}</label>
            <select v-model.number="configs.products.itemsPerPage" class="param-select">
              <option :value="8">8</option><option :value="12">12</option><option :value="16">16</option><option :value="24">24</option>
            </select>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_8b94f081', 'Filter danh mục') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.category" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_f1e9d92a', 'Filter thương hiệu') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.brand" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_5911a898', 'Filter giá') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.price" /><span class="toggle-slider"></span></label>
          </div>
          <div class="page-config__tip">
            <AlertCircle :size="12" />
            <span>Tip: Chuyển sang tab <strong>Cấu trúc</strong> với trang Products để tùy chỉnh chi tiết hơn (thêm banner, newsletter...)</span>
          </div>
        </div>
      </div>

      <!-- Product Detail Config -->
      <div class="page-config" :class="{ expanded: expandedPageConfig === 'productDetail' }">
        <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'productDetail' ? null : 'productDetail'">
          <Package :size="14" /><span>{{ t('admin.msg_6055caf1', 'Chi tiết sản phẩm') }}</span><ChevronDown :size="12" class="page-config__chevron" />
        </div>
        <div v-if="expandedPageConfig === 'productDetail'" class="page-config__body">
          <div class="param-row"><label>Gallery</label>
            <select v-model="configs.productDetail.galleryStyle" class="param-select">
              <option value="thumbnails">Thumbnail</option><option value="grid">Grid</option>
            </select>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_ccb9de7c', 'Tỷ lệ layout') }}</label>
            <select v-model="configs.productDetail.layoutRatio" class="param-select">
              <option value="50-50">50 / 50</option><option value="60-40">60 / 40</option><option value="40-60">40 / 60</option>
            </select>
          </div>
          <div class="param-row"><label>Breadcrumb</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showBreadcrumb" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_e13f0279', 'SP liên quan') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showRelatedProducts" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row" v-if="configs.productDetail.showRelatedProducts"><label>{{ t('admin.msg_ec3a77bd', 'Số SP liên quan') }}</label>
            <input type="range" v-model.number="configs.productDetail.relatedCount" min="4" max="8" class="param-range" />
            <span class="param-value">{{ configs.productDetail.relatedCount }}</span>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_b4292de3', 'Đánh giá') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showReviews" /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>

      <!-- Checkout Config -->
      <div class="page-config" :class="{ expanded: expandedPageConfig === 'checkout' }">
        <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'checkout' ? null : 'checkout'">
          <CreditCard :size="14" /><span>{{ t('admin.msg_d555e4bc', 'Thanh toán') }}</span><ChevronDown :size="12" class="page-config__chevron" />
        </div>
        <div v-if="expandedPageConfig === 'checkout'" class="page-config__body">
          <div class="param-row"><label>Layout</label>
            <select v-model="configs.checkout.layout" class="param-select">
              <option value="two-column">{{ t('admin.msg_144ed973', '2 cột') }}</option><option value="single-column">{{ t('admin.msg_af1ea0d8', '1 cột') }}</option>
            </select>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_1b6cfe67', 'Mã giảm giá') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showCoupon" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_f481f91e', 'Ghi chú') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showNotes" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_d45a2712', 'Thanh tiến trình') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showSteps" /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>

      <!-- Auth Config -->
      <div class="page-config" :class="{ expanded: expandedPageConfig === 'auth' }">
        <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'auth' ? null : 'auth'">
          <Lock :size="14" /><span>{{ t('admin.msg_50e04c81', 'Đăng nhập / Đăng ký') }}</span><ChevronDown :size="12" class="page-config__chevron" />
        </div>
        <div v-if="expandedPageConfig === 'auth'" class="page-config__body">
          <div class="param-row"><label>{{ t('admin.msg_ae6ecd90', 'Cho phép đăng ký') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.auth.allowRegister" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_2e9fc391', 'Quên mật khẩu') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.auth.allowForgotPassword" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_cc7930fc', 'Chiều rộng card (px)') }}</label>
            <input type="range" v-model.number="configs.auth.cardMaxWidth" min="360" max="600" step="20" class="param-range" />
            <span class="param-value">{{ configs.auth.cardMaxWidth }}px</span>
          </div>
        </div>
      </div>

      <!-- Account Config -->
      <div class="page-config" :class="{ expanded: expandedPageConfig === 'account' }">
        <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'account' ? null : 'account'">
          <User :size="14" /><span>{{ t('admin.msg_7bd53616', 'Tài khoản') }}</span><ChevronDown :size="12" class="page-config__chevron" />
        </div>
        <div v-if="expandedPageConfig === 'account'" class="page-config__body">
          <div class="param-row"><label>Sidebar</label>
            <select v-model="configs.account.sidebarPosition" class="param-select">
              <option value="left">{{ t('admin.msg_c8b3d56a', 'Bên trái') }}</option><option value="right">{{ t('admin.msg_5fe4c314', 'Bên phải') }}</option>
            </select>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_d2cb3ed8', 'Tab đơn hàng') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showOrders" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_af2289fd', 'Tab địa chỉ') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showAddresses" /><span class="toggle-slider"></span></label>
          </div>
          <div class="param-row"><label>{{ t('admin.msg_62376787', 'Tab đổi mật khẩu') }}</label>
            <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showPasswordChange" /><span class="toggle-slider"></span></label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Settings2, ShoppingBag, Package, CreditCard, Lock, User, ChevronDown, LayoutGrid, Layers, AlertCircle } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  pageConfigs: { type: Object, required: true },
  activePageId: { default: null },
  hasExistingSections: { type: Boolean, default: true },
})
const emit = defineEmits(['update:pageConfigs', 'go-to-structure', 'apply-preset'])

const configs = computed({
  get: () => props.pageConfigs,
  set: v => emit('update:pageConfigs', v),
})

const expandedPageConfig = ref(null)

const quickPresets = [
  { key: 'minimal', label: 'Tối giản', desc: 'Breadcrumb + nội dung chính', icon: LayoutGrid },
  { key: 'full', label: 'Đầy đủ', desc: 'Breadcrumb + heading + nội dung + newsletter', icon: Layers },
]
</script>

<style scoped>
.page-config-notice {
  display: flex;
  gap: 12px;
  padding: 14px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.06), rgba(168, 85, 247, 0.06));
  border: 1px solid rgba(99, 102, 241, 0.15);
  border-radius: 10px;
  margin-bottom: 16px;
}
.page-config-notice__icon {
  color: #6366f1;
  flex-shrink: 0;
  margin-top: 2px;
}
.page-config-notice__title {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}
.page-config-notice__desc {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.5;
}
.page-config-notice__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.page-config-notice__btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.page-config-wizard {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 14px;
  margin-bottom: 16px;
}
.page-config-wizard__label {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: #1e293b;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.page-config-wizard__hint {
  margin: 0 0 10px;
  font-size: 12px;
  color: #64748b;
}
.page-config-wizard__presets {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.page-config-wizard__preset {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  color: #334155;
  font-size: 12px;
  font-weight: 600;
}
.page-config-wizard__preset:hover {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.04);
}
.page-config-wizard__preset-desc {
  font-weight: 400;
  color: #94a3b8;
  margin-left: auto;
}

.page-config__tip {
  display: flex;
  gap: 6px;
  padding: 8px 10px;
  margin-top: 8px;
  background: rgba(59, 130, 246, 0.06);
  border-radius: 6px;
  font-size: 11px;
  color: #64748b;
  line-height: 1.4;
}
.page-config__tip strong { color: #3b82f6; }
</style>
