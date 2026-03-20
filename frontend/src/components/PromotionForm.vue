<template>
  <div class="pf-page">
    <div class="pf-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> {{ t('admin.back', 'Quay lại') }}</button>
      <div class="pf-header__center">
        <div class="pf-header__icon"><Tag :size="15" /></div>
        <h3>{{ props.editId ? t('admin.promotion.edit', 'Sửa khuyến mãi') : t('admin.promotion.create', 'Tạo khuyến mãi') }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? t('admin.saving', 'Đang lưu...') : (props.editId ? t('admin.update', 'Cập nhật') : t('admin.create', 'Tạo')) }}
      </button>
    </div>

    <!-- Sub-tabs -->
    <div class="pf-tabs">
      <button :class="{ active: subTab === 'promotion' }" @click="subTab = 'promotion'">🏷️ {{ t('admin.promotion.product_promo', 'Giá khuyến mãi sản phẩm') }}</button>
      <button :class="{ active: subTab === 'coupon' }" @click="subTab = 'coupon'">🎟️ {{ t('admin.promotion.coupon_code', 'Mã giảm giá') }}</button>
    </div>

    <!-- Product Promotion Form -->
    <div v-if="subTab === 'promotion'" class="pf-body">
      <div class="pf-col pf-col--main">
        <LanguageTabs v-model="currentLangPromotion" :translations="promoForm.translations" :fields="['name','description']" :baseData="promoForm" />

        <div class="pf-card" style="margin-top: 16px;">
          <h4><Tag :size="13" /> {{ t('admin.promotion.product_promo', 'Giá khuyến mãi sản phẩm') }}</h4>
          
          <div class="form-group">
            <label>{{ t('admin.promotion.name', 'Tên CTKM') }} <span v-if="currentLangPromotion !== defaultLangCode" class="lang-badge">{{ currentLangPromotion.toUpperCase() }}</span></label>
            <input v-model="promoName" class="form-input" :placeholder="t('admin.msg_92ed5b', 'VD: Khuyến mãi Hè')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }} <span v-if="currentLangPromotion !== defaultLangCode" class="lang-badge">{{ currentLangPromotion.toUpperCase() }}</span></label>
            <textarea v-model="promoDesc" class="form-input" rows="2" :placeholder="t('admin.msg_dfa3f5', 'Chi tiết...')"></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('admin.promotion.product', 'Sản phẩm') }} <span class="req">*</span></label>
            <select v-model="promoForm.productId" class="form-input">
              <option value="">-- {{ t('admin.promotion.select_product', 'Chọn sản phẩm') }} --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ formatCurrency(p.price) }})</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.promotion.promo_price', 'Giá khuyến mãi') }} <span class="req">*</span></label>
            <CurrencyInput v-model="promoForm.pricePromotion" placeholder="0" input-class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.start', 'Bắt đầu') }}</label>
              <input v-model="promoForm.dateStart" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.end', 'Kết thúc') }}</label>
              <input v-model="promoForm.dateEnd" type="date" class="form-input" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Coupon Form -->
    <div v-if="subTab === 'coupon'" class="pf-body">
      <div class="pf-col pf-col--main">
        <LanguageTabs v-model="currentLangCoupon" :translations="couponForm.translations" :fields="['name','description']" :baseData="couponForm" />

        <div class="pf-card" style="margin-top: 16px;">
          <h4>🎟️ {{ props.editId ? t('admin.promotion.edit_coupon', 'Sửa mã giảm giá') : t('admin.promotion.create_coupon', 'Tạo mã giảm giá') }}</h4>

          <div class="form-group">
            <label>{{ t('admin.promotion.code_name', 'Tên mã') }} <span v-if="currentLangCoupon !== defaultLangCode" class="lang-badge">{{ currentLangCoupon.toUpperCase() }}</span></label>
            <input v-model="couponName" class="form-input" :placeholder="t('admin.msg_84ca07', 'VD: Ưu đãi tân binh')" />
          </div>
          <div class="form-group">
            <label>{{ t('admin.description', 'Mô tả') }} <span v-if="currentLangCoupon !== defaultLangCode" class="lang-badge">{{ currentLangCoupon.toUpperCase() }}</span></label>
            <textarea v-model="couponDesc" class="form-input" rows="2" :placeholder="t('admin.msg_dfa3f5', 'Chi tiết...')"></textarea>
          </div>

          <div class="form-group">
            <label>{{ t('admin.coupon_code', 'Mã code') }} <span class="req">*</span></label>
            <input v-model="couponForm.code" class="form-input" placeholder="VD: SALE20" style="text-transform:uppercase" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.promotion.type', 'Loại') }}</label>
              <select v-model="couponForm.type" class="form-input">
                <option value="percent">{{ t('admin.percent', '% Phần trăm') }}</option>
                <option value="fixed">{{ t('admin.fixed_vnd', 'Cố định (VNĐ)') }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('admin.value', 'Giá trị') }}</label>
              <input v-model.number="couponForm.value" type="number" class="form-input" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.min_order', 'Đơn tối thiểu') }}</label>
              <input v-model.number="couponForm.minOrder" type="number" class="form-input" placeholder="0" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.max_uses', 'Dùng tối đa') }}</label>
              <input v-model.number="couponForm.maxUses" type="number" class="form-input" :placeholder="t('admin.msg_07de0c', 'Không giới hạn')" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.start', 'Bắt đầu') }}</label>
              <input v-model="couponForm.dateStart" type="date" class="form-input" />
            </div>
            <div class="form-group">
              <label>{{ t('admin.end', 'Kết thúc') }}</label>
              <input v-model="couponForm.dateEnd" type="date" class="form-input" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Tag, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { usePromotions } from '../composables/usePromotions.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'
import LanguageTabs from './LanguageTabs.vue'
import CurrencyInput from './CurrencyInput.vue'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()
const { savePromotion, createCoupon, updateCoupon } = usePromotions(apiFetch)

const props = defineProps({
  editId: { type: [String, Number], default: null },
  editType: { type: String, default: 'coupon' }, // 'coupon' | 'promotion'
  editData: { type: Object, default: null },     // pre-filled data
})
const emit = defineEmits(['saved', 'back'])

const saving = ref(false)
const subTab = ref(props.editType || 'coupon')
const products = ref([])

const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLangPromotion = ref(defaultLangCode.value)
const currentLangCoupon = ref(defaultLangCode.value)

const promoForm = ref({ name: '', description: '', productId: '', pricePromotion: 0, dateStart: '', dateEnd: '', translations: {} })
const couponForm = ref({ name: '', description: '', code: '', type: 'percent', value: 0, minOrder: 0, maxUses: null, dateStart: '', dateEnd: '', translations: {} })

const { tField: tFieldPromo } = useContentTranslations(promoForm, currentLangPromotion)
const promoName = tFieldPromo('name')
const promoDesc = tFieldPromo('description')

const { tField: tFieldCoupon } = useContentTranslations(couponForm, currentLangCoupon)
const couponName = tFieldCoupon('name')
const couponDesc = tFieldCoupon('description')

onMounted(async () => {
  // Load products for promo tab
  try {
    const res = await apiFetch('/products')
    const data = await res.json()
    products.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { products.value = [] }

  // Pre-fill if editing
  if (props.editData && props.editId) {
    if (subTab.value === 'coupon') {
      const c = props.editData
      couponForm.value = { ...couponForm.value, code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxUses: c.maxUses, dateStart: c.dateStart?.slice(0,10) || '', dateEnd: c.dateEnd?.slice(0,10) || '' }
      apiFetch(`/languages/content/coupons/${props.editId}`).then(r => r.json()).then(td => {
        if (td?.grouped && !Array.isArray(td.grouped)) {
          couponForm.value.translations = td.grouped
          if (td.grouped[defaultLangCode.value]) {
             couponForm.value.name = td.grouped[defaultLangCode.value].name || ''
             couponForm.value.description = td.grouped[defaultLangCode.value].description || ''
          }
        }
      }).catch(()=>{})
    } else {
      const p = props.editData
      promoForm.value = { ...promoForm.value, productId: p.productId, pricePromotion: p.pricePromotion, dateStart: p.dateStart?.slice(0,10) || '', dateEnd: p.dateEnd?.slice(0,10) || '' }
      apiFetch(`/languages/content/promotions/${p.productId}`).then(r => r.json()).then(td => {
        if (td?.grouped && !Array.isArray(td.grouped)) {
          promoForm.value.translations = td.grouped
          if (td.grouped[defaultLangCode.value]) {
             promoForm.value.name = td.grouped[defaultLangCode.value].name || ''
             promoForm.value.description = td.grouped[defaultLangCode.value].description || ''
          }
        }
      }).catch(()=>{})
    }
  }
})

async function handleSave() {
  saving.value = true
  try {
    if (subTab.value === 'promotion') {
      if (!promoForm.value.productId) { showToast(t('admin.promotion.select_product', 'Chọn sản phẩm'), 'error'); saving.value = false; return }
      const payload = { ...promoForm.value }
      payload.translations = { ...payload.translations, [defaultLangCode.value]: { name: payload.name, description: payload.description } }
      await savePromotion(payload)
      showToast(t('admin.promotion.saved', 'Đã lưu khuyến mãi'), 'success')
    } else {
      if (!couponForm.value.code) { showToast(t('admin.promotion.enter_code', 'Nhập mã code'), 'error'); saving.value = false; return }
      const payload = { ...couponForm.value }
      payload.translations = { ...payload.translations, [defaultLangCode.value]: { name: payload.name, description: payload.description } }
      
      // Remove name and description from payload directly to prevent SQL errors if they exist
      delete payload.name
      delete payload.description

      if (props.editId) {
        await updateCoupon(props.editId, payload)
        showToast(t('admin.updated', 'Đã cập nhật'), 'success')
      } else {
        await createCoupon(payload)
        showToast(t('admin.promotion.coupon_created', 'Đã tạo mã giảm giá'), 'success')
      }
    }
    emit('saved')
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
  saving.value = false
}

// formatCurrency from useI18n
</script>

<style scoped>
.pf-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.pf-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 0; margin-bottom: 16px; border-bottom: 1px solid var(--color-border); }
.pf-header__center { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.pf-header__icon { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.pf-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.pf-tabs { display: flex; gap: .3rem; margin-bottom: 16px; }
.pf-tabs button { padding: .4rem .8rem; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-secondary); color: var(--color-text-secondary); cursor: pointer; font-size: .8rem; }
.pf-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pf-body { display: flex; gap: 20px; }
.pf-col--main { flex: 1; }
.pf-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.pf-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.req { color: #ef4444; }
.form-input { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; box-sizing: border-box; transition: border-color .2s; }
.form-input:focus { border-color: var(--accent); }
</style>
