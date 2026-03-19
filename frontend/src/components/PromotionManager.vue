<template>
  <div class="promo-manager">
    <div class="pm-header">
      <h3><Tag :size="16" /> Khuyến mãi & Mã giảm giá</h3>
    </div>

    <!-- Tabs: Promotions / Coupons -->
    <div class="pm-tabs">
      <button :class="{ active: subTab === 'promotions' }" @click="subTab = 'promotions'">🏷️ Giá KM sản phẩm</button>
      <button :class="{ active: subTab === 'coupons' }" @click="subTab = 'coupons'">🎟️ Mã giảm giá</button>
    </div>

    <!-- Product Promotions -->
    <div v-if="subTab === 'promotions'">
      <div class="pm-form">
        <h4>{{ t('admin.add_edit_promo_price', 'Thêm/Sửa giá khuyến mãi') }}</h4>
        <div class="form-row">
          <div class="form-group" style="flex:2">
            <label>{{ t('admin.product', 'Sản phẩm') }}</label>
            <select v-model="promoForm.productId">
              <option value="">-- Chọn sản phẩm --</option>
              <option v-for="p in products" :key="p.id" :value="p.id">{{ p.name }} ({{ formatCurrency(p.price) }})</option>
            </select>
          </div>
          <div class="form-group">
            <label>Giá KM</label>
            <CurrencyInput v-model="promoForm.pricePromotion" placeholder="0" input-class="form-input" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.start', 'Bắt đầu') }}</label><input v-model="promoForm.dateStart" type="date" /></div>
          <div class="form-group"><label>{{ t('admin.end', 'Kết thúc') }}</label><input v-model="promoForm.dateEnd" type="date" /></div>
          <div class="form-group"><label>&nbsp;</label><button class="btn-save" @click="handleSavePromo">{{ t('admin.save_promo', 'Lưu KM') }}</button></div>
        </div>
      </div>

      <table class="pm-table" v-if="promotions.length">
        <thead><tr><th>{{ t('admin.product', 'Sản phẩm') }}</th><th>{{ t('admin.original_price', 'Giá gốc') }}</th><th>Giá KM</th><th>{{ t('admin.time', 'Thời gian') }}</th><th></th></tr></thead>
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
      <p v-else class="empty">Chưa có khuyến mãi</p>
    </div>

    <!-- Coupons -->
    <div v-if="subTab === 'coupons'">
      <div class="pm-form">
        <h4>{{ editCouponId ? 'Sửa mã giảm giá' : 'Tạo mã giảm giá' }}</h4>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.coupon_code', 'Mã code') }}</label><input v-model="couponForm.code" placeholder="VD: SALE20" style="text-transform: uppercase" /></div>
          <div class="form-group">
            <label>Loại</label>
            <select v-model="couponForm.type"><option value="percent">{{ t('admin.percent', '% Phần trăm') }}</option><option value="fixed">{{ t('admin.fixed_vnd', 'Cố định (VNĐ)') }}</option></select>
          </div>
          <div class="form-group"><label>{{ t('admin.value', 'Giá trị') }}</label><input v-model.number="couponForm.value" type="number" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.min_order', 'Đơn tối thiểu') }}</label><input v-model.number="couponForm.minOrder" type="number" placeholder="0" /></div>
          <div class="form-group"><label>{{ t('admin.max_uses', 'Dùng tối đa') }}</label><input v-model.number="couponForm.maxUses" type="number" placeholder="Không giới hạn" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>{{ t('admin.start', 'Bắt đầu') }}</label><input v-model="couponForm.dateStart" type="date" /></div>
          <div class="form-group"><label>{{ t('admin.end', 'Kết thúc') }}</label><input v-model="couponForm.dateEnd" type="date" /></div>
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
              <button class="btn-sm btn-edit" @click="editCoupon(c)">Sửa</button>
              <button class="btn-sm btn-del" @click="handleDeleteCoupon(c.id)">×</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">Chưa có mã giảm giá</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { usePromotions } from '../composables/usePromotions.js'
import { useToast } from '../composables/useToast.js'
import { Tag } from 'lucide-vue-next'
import CurrencyInput from './CurrencyInput.vue'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
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
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function handleDeletePromo(productId) {
  if (!confirm('Xóa khuyến mãi?')) return
  await deletePromotion(productId)
  fetchPromotions({  })
  showToast('Đã xóa', 'success')
}

async function handleSaveCoupon() {
  if (!couponForm.value.code) return showToast('Nhập mã code', 'error')
  try {
    if (editCouponId.value) {
      await updateCoupon(editCouponId.value, couponForm.value)
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await createCoupon({ ...couponForm.value,  })
      showToast('Đã tạo mã', 'success')
    }
    editCouponId.value = null
    couponForm.value = { code: '', type: 'percent', value: 0, minOrder: 0, maxUses: null, dateStart: '', dateEnd: '' }
    fetchCoupons({  })
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

function editCoupon(c) {
  editCouponId.value = c.id
  couponForm.value = { code: c.code, type: c.type, value: c.value, minOrder: c.minOrder, maxUses: c.maxUses, dateStart: c.dateStart?.slice(0,10) || '', dateEnd: c.dateEnd?.slice(0,10) || '' }
}

async function handleDeleteCoupon(id) {
  if (!confirm('Xóa mã giảm giá?')) return
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
