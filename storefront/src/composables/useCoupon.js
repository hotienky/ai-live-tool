import { ref, computed, watch } from 'vue'
import { apiPost } from '../api.js'

/**
 * Shared coupon/voucher state persisted via localStorage.
 * Import in both CartPage and CheckoutPage for consistent state.
 */

const STORAGE_KEY = 'sf_coupon'

// Shared reactive state (module-level singleton)
const couponCode = ref('')
const couponDiscount = ref(0)
const couponApplied = ref(false)
const couponError = ref('')
const couponLoading = ref(false)

// Restore from localStorage on first load
try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
  if (saved && saved.applied) {
    couponCode.value = saved.code || ''
    couponDiscount.value = saved.discount || 0
    couponApplied.value = true
  }
} catch { /* ignore */ }

function persist() {
  if (couponApplied.value) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      code: couponCode.value,
      discount: couponDiscount.value,
      applied: true,
    }))
  } else {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function useCoupon() {
  async function applyCoupon(orderTotal) {
    if (!couponCode.value.trim()) return
    couponLoading.value = true
    couponError.value = ''
    try {
      const result = await apiPost('/coupon/validate', {
        code: couponCode.value.trim(),
        order_total: orderTotal,
      })
      if (result.valid) {
        couponDiscount.value = result.discount
        couponApplied.value = true
        couponError.value = ''
        persist()
      } else {
        couponError.value = result.message || 'Mã giảm giá không hợp lệ'
        couponDiscount.value = 0
        couponApplied.value = false
        persist()
      }
    } catch (err) {
      couponError.value = err.message || 'Không thể kiểm tra mã giảm giá'
    }
    couponLoading.value = false
  }

  function removeCoupon() {
    couponCode.value = ''
    couponDiscount.value = 0
    couponApplied.value = false
    couponError.value = ''
    persist()
  }

  /** Re-validate the saved coupon against the current cart total */
  async function revalidateCoupon(orderTotal) {
    if (!couponApplied.value || !couponCode.value) return
    try {
      const result = await apiPost('/coupon/validate', {
        code: couponCode.value.trim(),
        order_total: orderTotal,
      })
      if (result.valid) {
        couponDiscount.value = result.discount
        persist()
      } else {
        // Coupon no longer valid — clear it silently
        removeCoupon()
      }
    } catch {
      // Network error — keep saved state
    }
  }

  return {
    couponCode,
    couponDiscount,
    couponApplied,
    couponError,
    couponLoading,
    applyCoupon,
    removeCoupon,
    revalidateCoupon,
  }
}
