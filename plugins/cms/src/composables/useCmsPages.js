import { ref } from 'vue'

export function useCmsPages(apiFetch) {
  const pages = ref([])
  const loading = ref(false)

  async function fetchPages(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/cms-pages?${qs}`)
      pages.value = await res.json()
    } catch { pages.value = [] }
    loading.value = false
  }

  async function fetchPage(id) {
    const res = await apiFetch(`/cms-pages/${id}`)
    return await res.json()
  }

  async function createPage(data) {
    const res = await apiFetch('/cms-pages', { method: 'POST', body: JSON.stringify(data) })
    return await res.json()
  }

  async function updatePage(id, data) {
    const res = await apiFetch(`/cms-pages/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return await res.json()
  }

  async function deletePage(id) {
    await apiFetch(`/cms-pages/${id}`, { method: 'DELETE' })
  }

  return { pages, loading, fetchPages, fetchPage, createPage, updatePage, deletePage }
}
