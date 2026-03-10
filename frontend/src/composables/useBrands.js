import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useBrands() {
  const brands = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchBrands(shopId) {
    loading.value = true
    try {
      const params = shopId ? `?shopId=${shopId}` : ''
      const res = await apiFetch(`/brands${params}`)
      brands.value = await res.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createBrand(data) {
    const res = await apiFetch('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const created = await res.json()
    brands.value.unshift(created)
    return created
  }

  async function updateBrand(id, data) {
    const res = await apiFetch(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    const idx = brands.value.findIndex((b) => b.id === id)
    if (idx !== -1) brands.value[idx] = updated
    return updated
  }

  async function deleteBrand(id) {
    await apiFetch(`/brands/${id}`, { method: 'DELETE' })
    brands.value = brands.value.filter((b) => b.id !== id)
  }

  return { brands, loading, error, fetchBrands, createBrand, updateBrand, deleteBrand }
}
