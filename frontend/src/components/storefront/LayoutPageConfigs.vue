<template>
  <div class="lb-section" v-show="!activePageId">
    <h4 class="lb-section__title"><Settings2 :size="14" /> Cấu hình trang</h4>

    <!-- Products Page Config -->
    <div class="page-config" :class="{ expanded: expandedPageConfig === 'products' }">
      <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'products' ? null : 'products'">
        <ShoppingBag :size="14" /><span>Trang sản phẩm</span><ChevronDown :size="12" class="page-config__chevron" />
      </div>
      <div v-if="expandedPageConfig === 'products'" class="page-config__body">
        <div class="param-row"><label>Sidebar</label>
          <select v-model="configs.products.sidebarPosition" class="param-select">
            <option value="left">Bên trái</option><option value="right">Bên phải</option><option value="hidden">Ẩn</option>
          </select>
        </div>
        <div class="param-row"><label>Cột sản phẩm</label>
          <input type="range" v-model.number="configs.products.gridColumns" min="2" max="5" class="param-range" />
          <span class="param-value">{{ configs.products.gridColumns }}</span>
        </div>
        <div class="param-row"><label>SP mỗi trang</label>
          <select v-model.number="configs.products.itemsPerPage" class="param-select">
            <option :value="8">8</option><option :value="12">12</option><option :value="16">16</option><option :value="24">24</option>
          </select>
        </div>
        <div class="param-row"><label>Filter danh mục</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.category" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Filter thương hiệu</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.brand" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Filter giá</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.products.showFilters.price" /><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>

    <!-- Product Detail Config -->
    <div class="page-config" :class="{ expanded: expandedPageConfig === 'productDetail' }">
      <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'productDetail' ? null : 'productDetail'">
        <Package :size="14" /><span>Chi tiết sản phẩm</span><ChevronDown :size="12" class="page-config__chevron" />
      </div>
      <div v-if="expandedPageConfig === 'productDetail'" class="page-config__body">
        <div class="param-row"><label>Gallery</label>
          <select v-model="configs.productDetail.galleryStyle" class="param-select">
            <option value="thumbnails">Thumbnail</option><option value="grid">Grid</option>
          </select>
        </div>
        <div class="param-row"><label>Tỷ lệ layout</label>
          <select v-model="configs.productDetail.layoutRatio" class="param-select">
            <option value="50-50">50 / 50</option><option value="60-40">60 / 40</option><option value="40-60">40 / 60</option>
          </select>
        </div>
        <div class="param-row"><label>Breadcrumb</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showBreadcrumb" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>SP liên quan</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showRelatedProducts" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row" v-if="configs.productDetail.showRelatedProducts"><label>Số SP liên quan</label>
          <input type="range" v-model.number="configs.productDetail.relatedCount" min="4" max="8" class="param-range" />
          <span class="param-value">{{ configs.productDetail.relatedCount }}</span>
        </div>
        <div class="param-row"><label>Đánh giá</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.productDetail.showReviews" /><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>

    <!-- Checkout Config -->
    <div class="page-config" :class="{ expanded: expandedPageConfig === 'checkout' }">
      <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'checkout' ? null : 'checkout'">
        <CreditCard :size="14" /><span>Thanh toán</span><ChevronDown :size="12" class="page-config__chevron" />
      </div>
      <div v-if="expandedPageConfig === 'checkout'" class="page-config__body">
        <div class="param-row"><label>Layout</label>
          <select v-model="configs.checkout.layout" class="param-select">
            <option value="two-column">2 cột</option><option value="single-column">1 cột</option>
          </select>
        </div>
        <div class="param-row"><label>Mã giảm giá</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showCoupon" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Ghi chú</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showNotes" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Thanh tiến trình</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.checkout.showSteps" /><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>

    <!-- Auth Config -->
    <div class="page-config" :class="{ expanded: expandedPageConfig === 'auth' }">
      <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'auth' ? null : 'auth'">
        <Lock :size="14" /><span>Đăng nhập / Đăng ký</span><ChevronDown :size="12" class="page-config__chevron" />
      </div>
      <div v-if="expandedPageConfig === 'auth'" class="page-config__body">
        <div class="param-row"><label>Cho phép đăng ký</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.auth.allowRegister" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Quên mật khẩu</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.auth.allowForgotPassword" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Chiều rộng card (px)</label>
          <input type="range" v-model.number="configs.auth.cardMaxWidth" min="360" max="600" step="20" class="param-range" />
          <span class="param-value">{{ configs.auth.cardMaxWidth }}px</span>
        </div>
      </div>
    </div>

    <!-- Account Config -->
    <div class="page-config" :class="{ expanded: expandedPageConfig === 'account' }">
      <div class="page-config__header" @click="expandedPageConfig = expandedPageConfig === 'account' ? null : 'account'">
        <User :size="14" /><span>Tài khoản</span><ChevronDown :size="12" class="page-config__chevron" />
      </div>
      <div v-if="expandedPageConfig === 'account'" class="page-config__body">
        <div class="param-row"><label>Sidebar</label>
          <select v-model="configs.account.sidebarPosition" class="param-select">
            <option value="left">Bên trái</option><option value="right">Bên phải</option>
          </select>
        </div>
        <div class="param-row"><label>Tab đơn hàng</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showOrders" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Tab địa chỉ</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showAddresses" /><span class="toggle-slider"></span></label>
        </div>
        <div class="param-row"><label>Tab đổi mật khẩu</label>
          <label class="toggle-switch toggle-switch--sm" @click.stop><input type="checkbox" v-model="configs.account.showPasswordChange" /><span class="toggle-slider"></span></label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Settings2, ShoppingBag, Package, CreditCard, Lock, User, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  pageConfigs: { type: Object, required: true },
  activePageId: { default: null },
})
const emit = defineEmits(['update:pageConfigs'])

const configs = computed({
  get: () => props.pageConfigs,
  set: v => emit('update:pageConfigs', v),
})

const expandedPageConfig = ref(null)
</script>
