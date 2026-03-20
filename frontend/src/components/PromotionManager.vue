<template>
  <!-- Form view -->
  <PromotionForm v-if="showForm" :editId="editId" :editType="editType" :editData="editData" @saved="onSaved" @back="showForm = false" />

  <!-- List view -->
  <div v-else class="promo-manager">
    <div class="pm-header">
      <h3><Tag :size="16" /> {{ t('admin.msg_f4593f51', 'Khuyến mãi &amp; Mã giảm giá') }}</h3>
    </div>

    <!-- Sub-tabs -->
    <div class="pm-tabs">
      <button :class="{ active: subTab === 'promotions' }" @click="subTab = 'promotions'">{{ t('admin.msg_bef41a50', '🏷️ Giá KM sản phẩm') }}</button>
      <button :class="{ active: subTab === 'coupons' }" @click="subTab = 'coupons'">{{ t('admin.msg_0aff132a', '🎟️ Mã giảm giá') }}</button>
      <button class="btn-add-right" @click="openCreate">+ {{ subTab === 'coupons' ? t('admin.msg_340587e4', 'Tạo mã') : t('admin.msg_98689f8e', 'Thêm KM') }}</button>
    </div>

    <!-- Product Promotions list -->
    <div v-if="subTab === 'promotions'">
      <table class="pm-table" v-if="promotions.length">
        <thead><tr><th>{{ t('admin.product', 'Sản phẩm') }}</th><th>{{ t('admin.original_price', 'Giá gốc') }}</th><th>{{ t('admin.msg_8ad259c6', 'Giá KM') }}</th><th>{{ t('admin.time', 'Thời gian') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="p in promotions" :key="p.productId">
            <td>{{ p.product?.name || '—' }}</td>
            <td>{{ formatCurrency(p.product?.price) }}</td>
            <td class="promo-price">{{ formatCurrency(p.pricePromotion) }}</td>
            <td class="date-range">{{ p.dateStart?.slice(0,10) || '∞' }} → {{ p.dateEnd?.slice(0,10) || '∞' }}</td>
            <td><button class="btn-sm btn-del" @click="handleDeletePromo(p.productId)">{{ t('admin.msg_63922286', '×') }}</button></td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">{{ t('admin.msg_f445e325', 'Chưa có khuyến mãi.') }} <button class="link-btn" @click="openCreate">{{ t('admin.msg_68fb957c', '+ Thêm ngay') }}</button></p>
    </div>

    <!-- Coupons list -->
    <div v-if="subTab === 'coupons'">
      <table class="pm-table" v-if="coupons.length">
        <thead><tr><th>{{ t('admin.code', 'Mã') }}</th><th>{{ t('admin.type', 'Loại') }}</th><th>{{ t('admin.value', 'Giá trị') }}</th><th>{{ t('admin.min_order', 'Đơn tối thiểu') }}</th><th>{{ t('admin.used', 'Đã dùng') }}</th><th>{{ t('admin.time', 'Thời gian') }}</th><th></th></tr></thead>
        <tbody>
          <tr v-for="c in coupons" :key="c.id">
            <td class="coupon-code">{{ c.code }}</td>
            <td>{{ c.type === 'percent' ? '%' : t('admin.msg_7c9af3bb', 'VNĐ') }}</td>
            <td>{{ c.type === 'percent' ? c.value + '%' : formatCurrency(c.value) }}</td>
            <td>{{ formatCurrency(c.minOrder) }}</td>
            <td>{{ c.usedCount }}/{{ c.maxUses || '∞' }}</td>
            <td class="date-range">{{ c.dateStart?.slice(0,10) || '∞' }} → {{ c.dateEnd?.slice(0,10) || '∞' }}</td>
            <td class="actions-cell">
              <button class="btn-sm btn-edit" @click="editCoupon(c)">{{ t('admin.msg_9026a724', 'Sửa') }}</button>
              <button class="btn-sm btn-del" @click="handleDeleteCoupon(c.id)">{{ t('admin.msg_63922286', '×') }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="empty">{{ t('admin.msg_3e36e25f', 'Chưa có mã giảm giá.') }} <button class="link-btn" @click="openCreate">{{ t('admin.msg_62f81d1b', '+ Tạo ngay') }}</button></p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { usePromotions } from '../composables/usePromotions.js'
import { useToast } from '../composables/useToast.js'
import { Tag } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import PromotionForm from './PromotionForm.vue'

const { t } = useI18n()
const { showToast } = useToast()
const { promotions, coupons, fetchPromotions, deletePromotion, fetchCoupons, deleteCoupon } = usePromotions(apiFetch)

const subTab = ref('promotions')
const showForm = ref(false)
const editId = ref(null)
const editType = ref('coupon')
const editData = ref(null)

onMounted(() => { fetchPromotions({}); fetchCoupons({}) })

function openCreate() {
  editId.value = null
  editData.value = null
  editType.value = subTab.value === 'coupons' ? 'coupon' : 'promotion'
  showForm.value = true
}

function editCoupon(c) {
  editId.value = c.id
  editData.value = c
  editType.value = 'coupon'
  showForm.value = true
}

function onSaved() {
  showForm.value = false
  fetchPromotions({})
  fetchCoupons({})
}

async function handleDeletePromo(productId) {
  if (!confirm(t('admin.msg_95d234ff', 'Xóa khuyến mãi?'))) return
  await deletePromotion(productId)
  fetchPromotions({})
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
}

async function handleDeleteCoupon(id) {
  if (!confirm(t('admin.msg_69b3f275', 'Xóa mã giảm giá?'))) return
  await deleteCoupon(id)
  fetchCoupons({})
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
}

function formatCurrency(v) { return Number(v || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.promo-manager { padding: 0; }
.pm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
.pm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; }
.pm-tabs { display: flex; gap: .3rem; margin-bottom: 1rem; align-items: center; }
.pm-tabs button { padding: .4rem .8rem; border: 1px solid var(--border); border-radius: 6px; background: var(--bg-2); color: var(--text-2); cursor: pointer; font-size: .8rem; }
.pm-tabs button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.btn-add-right { margin-left: auto; background: var(--accent); color: #fff; border: none; padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem; }
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
.link-btn { background: none; border: none; color: var(--accent); cursor: pointer; font-size: .9rem; text-decoration: underline; }
</style>
