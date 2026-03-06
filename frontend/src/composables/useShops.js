import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api'

export function useShops() {
  const shops = ref([])
  const currentShop = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Lấy danh sách shops
   */
  async function fetchShops() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/shops`)
      shops.value = await res.json()

      // Auto-select first shop nếu chưa chọn
      if (!currentShop.value && shops.value.length > 0) {
        currentShop.value = shops.value[0]
      }
    } catch (err) {
      error.value = err.message
      console.error('❌ fetchShops error:', err)
    } finally {
      loading.value = false
    }
  }

  /**
   * Tạo shop mới
   */
  async function createShop(shopData) {
    try {
      const res = await fetch(`${API_BASE}/shops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      })
      const newShop = await res.json()
      if (res.ok) {
        shops.value.unshift(newShop)
        return newShop
      }
      throw new Error(newShop.error)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Cập nhật shop
   */
  async function updateShop(shopId, updates) {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const updated = await res.json()
      if (res.ok) {
        const idx = shops.value.findIndex((s) => s.id === shopId)
        if (idx !== -1) shops.value[idx] = updated
        if (currentShop.value?.id === shopId) currentShop.value = updated
        return updated
      }
      throw new Error(updated.error)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Xóa shop
   */
  async function deleteShop(shopId) {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        shops.value = shops.value.filter((s) => s.id !== shopId)
        if (currentShop.value?.id === shopId) {
          currentShop.value = shops.value[0] || null
        }
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Kết nối TikTok cho shop
   */
  async function connectShop(shopId, mock = false) {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mock }),
      })
      const result = await res.json()
      if (res.ok) {
        await fetchShops() // Refresh trạng thái
        return result
      }
      throw new Error(result.error)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Ngắt kết nối shop
   */
  async function disconnectShop(shopId) {
    try {
      await fetch(`${API_BASE}/shops/${shopId}/disconnect`, {
        method: 'POST',
      })
      await fetchShops()
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * Chọn shop hiện tại
   */
  function selectShop(shop) {
    currentShop.value = shop
  }

  return {
    shops,
    currentShop,
    loading,
    error,
    fetchShops,
    createShop,
    updateShop,
    deleteShop,
    connectShop,
    disconnectShop,
    selectShop,
  }
}
