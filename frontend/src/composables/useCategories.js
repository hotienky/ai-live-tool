import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useCategories() {
  const categories = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchCategories(shopId) {
    loading.value = true
    try {
      const params = shopId ? `?shopId=${shopId}` : ''
      const res = await apiFetch(`/categories${params}`)
      categories.value = await res.json()
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createCategory(data) {
    const res = await apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    const created = await res.json()
    categories.value.unshift(created)
    return created
  }

  async function updateCategory(id, data) {
    const res = await apiFetch(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    const updated = await res.json()
    const idx = categories.value.findIndex((c) => c.id === id)
    if (idx !== -1) categories.value[idx] = updated
    return updated
  }

  async function deleteCategory(id) {
    await apiFetch(`/categories/${id}`, { method: 'DELETE' })
    categories.value = categories.value.filter((c) => c.id !== id)
  }

  return { categories, loading, error, fetchCategories, createCategory, updateCategory, deleteCategory }
}
