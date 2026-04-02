<template>
  <div class="sp">
    <!-- Back button -->
    <button class="sp-back" @click="$emit('back')">
      <ArrowLeft :size="16" />{{ t('admin.msg_0033aa16', 'Quay lại') }}</button>

    <div class="sp-wrap" v-if="product">
      <!-- Layout loop for dynamic section management -->
      <template v-for="(section, idx) in enabledSections" :key="section.id || section.type">
        <div :data-builder-id="section.id" :data-section-type="section.type" :data-section-index="idx" class="sf-section-wrapper">
          
          <SfMockSection v-if="section.type === 'page_breadcrumb'" :section="section" :index="idx" title="Đường dẫn (Breadcrumb)" />
          
          <SfProductDetailView 
            v-else-if="section.type === 'product_detail_view' || section.type === 'system_page_content'"
            :product="product"
            :qty="qty"
            @update:qty="qty = $event"
            @addToCart="(payload) => $emit('addToCart', payload)"
            @buyNow="(payload) => $emit('buyNow', payload)"
            :config="section.params || {}"
          />
          
          <SfMockSection v-else-if="section.type === 'product_reviews'" :section="section" :index="idx" title="Đánh giá sản phẩm" />
          
          <SfMockSection v-else-if="section.type === 'related_products'" :section="section" :index="idx" title="Sản phẩm liên quan" />
          
          <SfMockSection v-else :section="section" :index="idx" />

        </div>
      </template>

      <!-- Fallback when accessed directly without customized layout -->
      <div v-if="!enabledSections.length" class="sf-section-wrapper" data-section-type="system_page_content" data-section-index="0">
        <SfProductDetailView 
          :product="product"
          :qty="qty"
          @update:qty="qty = $event"
          @addToCart="(payload) => $emit('addToCart', payload)"
          @buyNow="(payload) => $emit('buyNow', payload)"
        />
      </div>
    </div>

    <!-- Loading -->
    <div class="sp-loading" v-else-if="loading">
      <Loader2 :size="24" class="spin" />{{ t('admin.msg_d5fe42f6', 'Đang tải...') }}</div>
    <div class="sp-error" v-else>
      <PackageX :size="40" />
      <p>{{ t('admin.msg_5e1cab5b', 'Không tìm thấy sản phẩm') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { ArrowLeft, PackageX, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useI18n } from '../composables/useI18n.js'
import SfProductDetailView from './storefront/SfProductDetailView.vue'
import SfMockSection from './storefront/SfMockSection.vue'

const { t } = useI18n()


const props = defineProps({
  storeId: { type: [String, Number], required: true },
  productId: { type: [String, Number], required: true },
})
const emit = defineEmits(['back', 'addToCart', 'buyNow'])

const product = ref(null)
const loading = ref(true)
const qty = ref(1)

const sections = ref([])
const enabledSections = computed(() => {
  return sections.value.filter(s => s.enabled !== false).sort((a,b) => (a.order || 0) - (b.order || 0))
})

// Listen to Visual Builder live layout updates
function handleBuilderMessage(evt) {
  const { type, payload } = evt.data || {}
  if (type === 'layout-preview-update' && payload?.sections) {
    sections.value = payload.sections
  }
}

const isOnPromotion = computed(() => {
  const p = product.value
  if (!p || !p.promotion_price || p.promotion_price >= p.price) return false
  const now = Date.now()
  if (p.promotion_start && new Date(p.promotion_start).getTime() > now) return false
  if (p.promotion_end && new Date(p.promotion_end).getTime() < now) return false
  return true
})

function formatCurrency(amount) {
  if (!amount) return '0đ'
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ'
}
function formatPrice(v) { return formatCurrency(v || 0) }

async function loadProduct() {
  loading.value = true
  try {
    const data = await apiFetch(`/storefront/products/${props.productId}`)
    product.value = await data.json()
  } catch { product.value = null }
  loading.value = false
}

onMounted(() => {
  loadProduct()
  window.addEventListener('message', handleBuilderMessage)
})
onUnmounted(() => {
  window.removeEventListener('message', handleBuilderMessage)
})
watch(() => props.productId, () => { qty.value = 1; loadProduct() })
</script>

<style scoped>
.sp { min-height: 100vh; background: var(--color-bg-primary); color: var(--color-text-primary); padding: 20px 24px; }
.sp-back {
  display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 10px;
  border: 1px solid var(--color-border); background: var(--color-bg-card);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s; margin-bottom: 20px;
}
.sp-back:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

.sp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }

/* Gallery */
/* Gallery */
.sp-main-img {
  position: relative; border-radius: 16px; overflow: hidden; background: var(--color-bg-card);
  border: 1px solid var(--color-border); aspect-ratio: 1;
  display: flex; align-items: center; justify-content: center;
}
.sp-img { width: 100%; height: 100%; object-fit: cover; }
.sp-img-placeholder { color: var(--color-text-muted); }
.sp-promo-badge {
  position: absolute; top: 12px; right: 12px; padding: 6px 14px; border-radius: 10px;
  background: linear-gradient(135deg, #ef4444, #dc2626); color: #fff;
  font-size: 14px; font-weight: 800;
}

/* Info */
.sp-info { display: flex; flex-direction: column; gap: 16px; }
.sp-brand { font-size: 13px; font-weight: 600; color: var(--color-accent-primary); text-transform: uppercase; letter-spacing: 1px; }
.sp-name { font-size: 28px; font-weight: 800; line-height: 1.2; margin: 0; }
.sp-prices { display: flex; align-items: baseline; gap: 12px; }
.sp-price { font-size: 28px; font-weight: 800; color: var(--color-accent-primary); }
.sp-price--old { text-decoration: line-through; color: var(--color-text-muted); font-size: 18px; font-weight: 500; }
.sp-price--sale { color: var(--color-accent-hot); }

.sp-meta { display: flex; gap: 20px; flex-wrap: wrap; padding: 16px 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); }
.sp-meta-item { display: flex; flex-direction: column; gap: 2px; }
.sp-meta-label { font-size: 11px; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; }
.sp-meta-value { font-size: 14px; font-weight: 600; }
.in-stock { color: #10b981; }
.out-stock { color: #ef4444; }

.sp-qty { display: flex; align-items: center; gap: 12px; }
.sp-qty label { font-size: 13px; font-weight: 600; color: var(--color-text-secondary); }
.sp-qty-ctrl {
  display: flex; align-items: center; border: 1px solid var(--color-border);
  border-radius: 10px; overflow: hidden;
}
.sp-qty-ctrl button {
  display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;
  border: none; background: var(--color-bg-card); color: var(--color-text-secondary);
  cursor: pointer; transition: background 0.15s;
}
.sp-qty-ctrl button:hover { background: var(--color-bg-card-hover); color: var(--color-accent-primary); }
.sp-qty-ctrl input {
  width: 50px; text-align: center; border: none; border-left: 1px solid var(--color-border);
  border-right: 1px solid var(--color-border); background: var(--color-bg-primary);
  color: var(--color-text-primary); font-size: 14px; font-weight: 600;
  outline: none; -moz-appearance: textfield; appearance: textfield;
}
.sp-qty-ctrl input::-webkit-outer-spin-button,
.sp-qty-ctrl input::-webkit-inner-spin-button { -webkit-appearance: none; appearance: none; }

.sp-actions { display: flex; gap: 12px; }
.sp-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 12px 28px;
  border-radius: 12px; border: none; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: all 0.25s;
}
.sp-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.sp-btn--cart { background: var(--color-bg-card); border: 2px solid var(--color-accent-primary); color: var(--color-accent-primary); }
.sp-btn--cart:hover:not(:disabled) { background: var(--color-accent-glow); }
.sp-btn--buy { background: var(--color-accent-primary); color: #fff; }
.sp-btn--buy:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); box-shadow: var(--accent-shadow); }

.sp-desc h3 { font-size: 16px; font-weight: 700; margin: 0 0 8px; }
.sp-desc-content { font-size: 14px; line-height: 1.7; color: var(--color-text-secondary); }

.sp-loading, .sp-error { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 80px; color: var(--color-text-muted); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .sp-grid { grid-template-columns: 1fr; gap: 24px; }
  .sp-name { font-size: 22px; }
  .sp-price { font-size: 22px; }
}
</style>
