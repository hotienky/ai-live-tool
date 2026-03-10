import { ref } from 'vue'

/**
 * usePromotions — Composable for product promotions + coupons
 */
export function usePromotions(apiFetch) {
  const promotions = ref([])
  const coupons = ref([])
  const loading = ref(false)

  // ── Product Promotions ──
  async function fetchPromotions(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/promotions?${qs}`)
      promotions.value = await res.json()
    } catch { promotions.value = [] }
    loading.value = false
  }

  async function savePromotion(data) {
    const res = await apiFetch('/promotions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function deletePromotion(productId) {
    await apiFetch(`/promotions/${productId}`, { method: 'DELETE' })
  }

  // ── Coupons ──
  async function fetchCoupons(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/coupons?${qs}`)
      const json = await res.json()
      coupons.value = json.data || json
    } catch { coupons.value = [] }
    loading.value = false
  }

  async function createCoupon(data) {
    const res = await apiFetch('/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function updateCoupon(id, data) {
    const res = await apiFetch(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function deleteCoupon(id) {
    await apiFetch(`/coupons/${id}`, { method: 'DELETE' })
  }

  async function validateCoupon(code, shopId, subtotal) {
    const res = await apiFetch('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, shopId, subtotal }),
    })
    return await res.json()
  }

  return {
    promotions, coupons, loading,
    fetchPromotions, savePromotion, deletePromotion,
    fetchCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon,
  }
}
