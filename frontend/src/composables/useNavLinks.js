import { ref } from 'vue'

export function useNavLinks(apiFetch) {
  const links = ref([])
  const loading = ref(false)

  async function fetchLinks(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/nav-links?${qs}`)
      links.value = await res.json()
    } catch { links.value = [] }
    loading.value = false
  }

  async function createLink(data) {
    const res = await apiFetch('/nav-links', { method: 'POST', body: JSON.stringify(data) })
    return await res.json()
  }

  async function updateLink(id, data) {
    const res = await apiFetch(`/nav-links/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return await res.json()
  }

  async function deleteLink(id) {
    await apiFetch(`/nav-links/${id}`, { method: 'DELETE' })
  }

  async function reorderLinks(items) {
    await apiFetch('/nav-links/reorder', { method: 'POST', body: JSON.stringify({ items }) })
  }

  return { links, loading, fetchLinks, createLink, updateLink, deleteLink, reorderLinks }
}
