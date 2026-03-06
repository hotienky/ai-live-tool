import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useShops() {
  const shops = ref([])
  const currentShop = ref(null)
  const loading = ref(false)
  const error = ref(null)

  async function fetchShops() {
    loading.value = true
    error.value = null
    try {
      const res = await apiFetch('/shops')
      shops.value = await res.json()
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

  async function createShop(shopData) {
    try {
      const res = await apiFetch('/shops', {
        method: 'POST',
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

  async function updateShop(shopId, updates) {
    try {
      const res = await apiFetch(`/shops/${shopId}`, {
        method: 'PUT',
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

  async function deleteShop(shopId) {
    try {
      const res = await apiFetch(`/shops/${shopId}`, { method: 'DELETE' })
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

  async function connectShop(shopId, mock = false) {
    try {
      const res = await apiFetch(`/shops/${shopId}/connect`, {
        method: 'POST',
        body: JSON.stringify({ mock }),
      })
      const result = await res.json()
      if (res.ok) {
        await fetchShops()
        return result
      }
      throw new Error(result.error)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  async function disconnectShop(shopId) {
    try {
      await apiFetch(`/shops/${shopId}/disconnect`, { method: 'POST' })
      await fetchShops()
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

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
