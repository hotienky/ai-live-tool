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
      const data = await res.json()
      // Map snake_case from backend to camelCase for frontend
      promotions.value = (Array.isArray(data) ? data : []).map(p => ({
        ...p,
        productId: p.product_id || p.productId,
        pricePromotion: p.price_promotion || p.pricePromotion || 0,
        dateStart: p.date_start || p.dateStart,
        dateEnd: p.date_end || p.dateEnd,
      }))
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
      const raw = json.data || json
      // Map snake_case from backend to camelCase for frontend (defensive)
      coupons.value = (Array.isArray(raw) ? raw : []).map(c => ({
        ...c,
        minOrder: c.minOrder ?? c.min_order ?? c.min_order_amount ?? 0,
        maxUses: c.maxUses ?? c.max_uses ?? c.usage_limit ?? null,
        usedCount: c.usedCount ?? c.used_count ?? c.times_used ?? 0,
        dateStart: c.dateStart ?? c.date_start ?? c.start_date ?? null,
        dateEnd: c.dateEnd ?? c.date_end ?? c.end_date ?? c.expires_at ?? null,
        type: c.type === 'percentage' ? 'percent' : (c.type || 'percent'),
      }))
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

  async function validateCoupon(code, subtotal) {
    const res = await apiFetch('/coupons/validate', {
      method: 'POST',
      body: JSON.stringify({ code, subtotal }),
    })
    return await res.json()
  }

  return {
    promotions, coupons, loading,
    fetchPromotions, savePromotion, deletePromotion,
    fetchCoupons, createCoupon, updateCoupon, deleteCoupon, validateCoupon,
  }
}
