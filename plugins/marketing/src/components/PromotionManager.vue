<template>
  <div class="promo-manager">
    <div class="pm-header">
      <h3><Tag :size="16" />{{ t('admin.msg_58d08e12', 'Khuyến mãi & Mã giảm giá') }}</h3>
    </div>

    <!-- Tabs: Promotions / Coupons -->
    <div class="pm-tabs">
      <button :class="{ active: subTab === 'promotions' }" @click="subTab = 'promotions'">{{ t('admin.msg_bef41a50', '🏷️ Giá KM sản phẩm') }}</button>
      <button :class="{ active: subTab === 'coupons' }" @click="subTab = 'coupons'">{{ t('admin.msg_0aff132a', '🎟️ Mã giảm giá') }}</button>
    </div>

    <!-- Product Promotions -->
    <div v-if="subTab === 'promotions'">
      <div class="pm-form">
        <h4>{{ t('admin.msg_6e01affe', 'Thêm/Sửa giá khuyến mãi') }}</h4>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>{{ t('admin.promotion.product', 'Sản phẩm') }}</label>
            <select v-model="promoForm.productId">
              <option value="">{{ t('admin.msg_63b32e26', '-- Chọn sản phẩm --') }}</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ formatCurrency(p.price) }})</option>
            </select>
          </div>
          <div class="form-group">
            <label>{{ t('admin.msg_8ad259c6', 'Giá KM') }}</label>
            <CurrencyInput v-model="promoForm.pricePromotion" placeholder="0" input-class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.start', 'Bắt đầu') }}</label><input v-model="promoForm.dateStart" type="date" /></div>
          <div class="form-group"><label>{{ t('admin.msg_144f8bdc', 'Kết thúc') }}</label><input v-model="promoForm.dateEnd" type="date" /></div>
          <div class="form-group"><label>&nbsp;</label><button class="btn-save" @click="handleSavePromo">{{ t('admin.msg_c949b760', 'Lưu KM') }}</button></div>
        </div>
      </div>

      <table class="pm-table" v-if="promotions.length">
        <thead><tr><th>{{ t('admin.promotion.product', 'Sản phẩm') }}</th><th>{{ t('admin.original_price', 'Giá gốc') }}</th><th>{{ t('admin.msg_8ad259c6', 'Giá KM') }}</th><th>{{ t('admin.time', 'Thời gian') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="p in promotions" :key="p.productId">
            <td>{{ p.product?.name || '—' }}</td>
            <td>{{ formatCurrency(p.product?.price) }}</td>
            <td class="promo-price">{{ formatCurrency(p.pricePromotion) }}</td>
            <td class="date-range">{{ p.dateStart?.slice(0,10) || '∞' }} → {{ p.dateEnd?.slice(0,10) || '∞' }}</td>
            <td><button class="btn-sm btn-del" @click="handleDeletePromo(p.productId)">×</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">{{ t('admin.msg_47d3d2f1', 'Chưa có khuyến mãi') }}</p>
    </div>

    <!-- Coupons -->
    <div v-if="subTab === 'coupons'">
      <div class="pm-form">
        <h4>{{ editCouponId ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá' }}</h4>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.coupon_code', 'Mã code') }}</label><input v-model="couponForm.code" placeholder="VD: SALE20" style="text-transform: uppercase" /></div>
          <div class="form-group">
            <label>{{ t('admin.type', 'Loại') }}</label>
            <select v-model="couponForm.type"><option value="percent">{{ t('admin.percent', '% Phần trăm') }}</option><option value="fixed">{{ t('admin.fixed_vnd', 'Cố định (VNĐ)') }}</option></select>
          </div>
          <div class="form-group"><label>{{ t('admin.value', 'Giá trị') }}</label><input v-model.number="couponForm.value" type="number" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.min_order', 'Đơn tối thiểu') }}</label><input v-model.number="couponForm.minOrder" type="number" placeholder="0" /></div>
          <div class="form-group"><label>{{ t('admin.max_uses', 'Dùng tối đa') }}</label><input v-model.number="couponForm.maxUses" type="number" :placeholder="t('admin.msg_07de0c', 'Không giới hạn')"  /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.start', 'Bắt đầu') }}</label><input v-model="couponForm.dateStart" type="date" /></div>
          <div class="form-group"><label>{{ t('admin.msg_144f8bdc', 'Kết thúc') }}</label><input v-model="couponForm.dateEnd" type="date" /></div>
          <div class="form-group"><label>&nbsp;</label>
            <button class="btn-save" @click="handleSaveCoupon">{{ editCouponId ? 'Cập nhật' : 'Tạo mã' }}</button>
          </div>
        </div>
      </div>

      <table class="pm-table" v-if="coupons.length">
        <thead><tr><th>{{ t('admin.code', 'Mã') }}</th><th>{{ t('admin.type', 'Loại') }}</th><th>{{ t('admin.value', 'Giá trị') }}</th><th>{{ t('admin.min_order', 'Đơn tối thiểu') }}</th><th>{{ t('admin.used', 'Đã dùng') }}</th><th>{{ t('admin.time', 'Thời gian') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id">
            <td class="coupon-code">{{ c.code }}</td>
            <td>{{ c.type === 'percent' ? '%' : 'VNĐ' }}</td>
            <td>{{ c.type === 'percent' ? c.value + '%' : formatCurrency(c.value) }}</td>
            <td>{{ formatCurrency(c.minOrder) }}</td>
            <td>{{ c.usedCount }}/{{ c.maxUses || '∞' }}</td>
            <td class="date-range">{{ c.dateStart?.slice(0,10) || '∞' }} → {{ c.dateEnd?.slice(0,10) || '∞' }}</td>
            <td class="actions-cell">
              <button class="btn-sm btn-edit" @click="editCoupon(c)">{{ t('admin.edit', 'Sửa') }}</button>
              <button class="btn-sm btn-del" @click="handleDeleteCoupon(c.id)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">{{ t('admin.msg_2a949349', 'Chưa có mã giảm giá') }}</p>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from '../helpers.js'
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../helpers.js'
import { usePromotions } from '../composables/usePromotions.js'
import { useToast } from '../helpers.js'
import { Tag } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'
const { showToast } = useToast()
const { t } = useI18n()
const { promotions, coupons, loading, fetchPromotions, savePromotion, deletePromotion, fetchCoupons, createCoupon, updateCoupon, deleteCoupon } = usePromotions(apiFetch)

const props = defineProps({ /* tenant-scoped */ })

const subTab = ref('promotions')
const products = ref([])

// Promo form
const promoForm = ref({ productId: '', pricePromotion: 0, dateStart: '', dateEnd: '' })

// Coupon form
const editCouponId = ref(null)
const couponForm = ref({ code: '', type: 'percent', value: 0, minOrder: 0, maxUses: null, dateStart: '', dateEnd: '' })

onMounted(() => { fetchPromotions({  }); fetchCoupons({  }); fetchProducts() })

async function fetchProducts() {
  try {
    let url = `/products`
    const res = await apiFetch(url)
    const data = await res.json()
    products.value = Array.isArray(data) ? data : (data.data || [])
  } catch { products.value = [] }
}

async function handleSavePromo() {
  if (!promoForm.value.productId) return showToast('Chọn sản phẩm', 'error')
  try {
    await savePromotion(promoForm.value)
    showToast('Đã lưu KM', 'success')
    promoForm.value = { productId: '', pricePromotion: 0, dateStart: '', dateEnd: '' }
    fetchPromotions({  })
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}

async function handleDeletePromo(productId) {
  if (!confirm(`${t('admin.delete', 'Xóa')} khuyến mãi?`)) return
  await deletePromotion(productId)
  fetchPromotions({  })
  showToast('Đã xóa', 'success')
}

async function handleSaveCoupon() {
  if (!couponForm.value.code) return showToast('Nhập mã code', 'error')
  try {
    if (editCouponId.value) {
      await updateCoupon(editCouponId.value, couponForm.value)
      showToast('Đã cập nhật', 'success')
    } else {
      await createCoupon({ ...couponForm.value,  })
      showToast('Đã tạo mã', 'success')
    }
    editCouponId.value = null
    couponForm.value = { code: '', type: 'percent', value: 0, minOrder: 0, maxUses: null, dateStart: '', dateEnd: '' }
    fetchCoupons({  })
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}

function editCoupon(c) {
  editCouponId.value = c.id
  couponForm.value = { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxUses: c.maxUses, dateStart: c.dateStart?.slice(0,10) || '', dateEnd: c.dateEnd?.slice(0,10) || '' }
}

async function handleDeleteCoupon(id) {
  if (!confirm(`${t('admin.delete', 'Xóa')} mã giảm giá?`)) return
  await deleteCoupon(id)
  fetchCoupons({  })
  showToast('Đã xóa', 'success')
}

function formatCurrency(v) {
  return Number(v || 0).toLocaleString('vi-VN') + 'đ'
}
</script>

<style scoped>
.promo-manager { padding: 0; }
.pm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.pm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.pm-tabs { display: flex; gap: .3rem; margin-bottom: 1rem; }
.pm-tabs button { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-2); cursor: pointer; font-size: .8rem; }
.pm-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.pm-form { background: var(--bg-2); border: 1px solid var(--border); border-radius: 8px; padding: .8rem; margin-bottom: 1rem; }
.pm-form h4 { margin: 0 0 .5rem; font-size: .85rem; }
.form-row { display: flex; gap: .5rem; flex-wrap: wrap; }
.form-row .form-group { flex: 1; min-width: 120px; }
.form-group { margin-bottom: .4rem; }
.form-group label { display: block; font-size: .7rem; color: var(--text-3); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .35rem .5rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-1); color: var(--text-1); font-size: .8rem; }
.btn-save { padding: .35rem .7rem; border: none; border-radius: 6px; background: var(--accent); color: #fff; cursor: pointer; font-size: .8rem; white-space: nowrap; }
.pm-table { width: 100%; border-collapse: collapse; font-size: .82rem; }
.pm-table th, .pm-table td { padding: .45rem .5rem; border-bottom: 1px solid var(--border); text-align: left; }
.pm-table th { font-weight: 600; color: var(--text-3); font-size: .72rem; text-transform: uppercase; }
.promo-price { color: #ef4444; font-weight: 600; }
.coupon-code { font-family: monospace; font-weight: 700; color: var(--accent); }
.date-range { font-size: .75rem; color: var(--text-3); }
.actions-cell { display: flex; gap: .3rem; }
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border); background: var(--bg-2); cursor: pointer; font-size: .75rem; color: var(--text-1); }
.btn-edit:hover { border-color: var(--accent); color: var(--accent); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }
.empty { color: var(--text-3); text-align: center; padding: 2rem 0; font-size: .9rem; }
</style>
