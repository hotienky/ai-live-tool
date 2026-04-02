<template>
  <div class="sf-mock-section" :data-builder-id="section.id" :data-section-type="section.type" :data-section-index="index">
    <div class="sf-mock-content">
      <div class="sf-mock-icon-wrap">
        <Box :size="24" class="sf-mock-icon" />
      </div>
      <h3 class="sf-mock-title">{{ title || sectionLabel }}</h3>
      <p class="sf-mock-desc">{{ t('admin.msg_mock_data', 'Khu vực này sẽ hiển thị nội dung thực khi storefront hoạt động.') }}</p>
      <span class="sf-mock-badge">{{ section.type }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Box } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  section: { type: Object, required: true },
  index: { type: Number, required: true },
  title: { type: String, default: '' }
})

const typeLabels = {
  cart_summary: 'Giỏ hàng',
  checkout_form: 'Thanh toán',
  auth_form: 'Đăng nhập / Đăng ký',
  account_dashboard: 'Tài khoản',
  order_history: 'Lịch sử đơn hàng',
  wishlist_grid: 'Yêu thích',
  blog_listing: 'Bài viết',
  product_reviews: 'Đánh giá sản phẩm',
  related_products: 'Sản phẩm liên quan',
  page_breadcrumb: 'Đường dẫn (Breadcrumb)',
  page_heading: 'Tiêu đề trang',
}

const sectionLabel = computed(() => typeLabels[props.section.type] || props.section.type)
</script>

<style scoped>
.sf-mock-section {
  padding: 48px 24px;
  margin: 16px 24px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%);
  border: 2px dashed #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sf-mock-section:hover {
  border-color: #818cf8;
  background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.06);
}
.sf-mock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  max-width: 360px;
}
.sf-mock-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(99, 102, 241, 0.08);
  display: flex; align-items: center; justify-content: center;
}
.sf-mock-icon {
  color: #6366f1;
}
.sf-mock-title {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
  color: #1e293b;
  text-transform: capitalize;
}
.sf-mock-desc {
  font-size: 13px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}
.sf-mock-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 6px;
  background: rgba(99, 102, 241, 0.06);
  color: #818cf8;
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
  letter-spacing: 0.5px;
}
</style>
