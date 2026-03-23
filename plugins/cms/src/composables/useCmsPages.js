import { ref } from 'vue'

export function useCmsPages(apiFetch) {
  const pages = ref([])
  const loading = ref(false)

  async function fetchPages(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/cms-pages?${qs}`)
      const json = await res.json()
      // API wraps response as { type, message, code, data }
      pages.value = Array.isArray(json) ? json : (json.data || [])
    } catch { pages.value = [] }
    loading.value = false
  }

  async function fetchPage(id) {
    const res = await apiFetch(`/cms-pages/${id}`)
    const json = await res.json()
    return json.data || json
  }

  /** Tìm trang theo alias — dùng cho page builder và storefront */
  async function fetchPageByAlias(alias) {
    const res = await apiFetch(`/cms-pages/by-alias/${alias}`)
    const json = await res.json()
    return json.data || json
  }

  /** Lấy danh sách trang hệ thống (home, about, contact) */
  async function fetchSystemPages() {
    const res = await apiFetch('/cms-pages/system')
    const json = await res.json()
    return Array.isArray(json) ? json : (json.data || [])
  }

  async function createPage(data) {
    const res = await apiFetch('/cms-pages', { method: 'POST', body: JSON.stringify(data) })
    return await res.json()
  }

  async function updatePage(id, data) {
    const res = await apiFetch(`/cms-pages/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return await res.json()
  }

  /**
   * Lưu layout_data cho trang dynamic.
   * Tách riêng khỏi updatePage để tránh vô tình ghi đè các field khác.
   * @param {number} id
   * @param {Object} layoutData - { version, blocks: [...] }
   * @param {boolean} [isDynamic]
   */
  async function saveLayout(id, layoutData, isDynamic = true) {
    const res = await apiFetch(`/cms-pages/${id}/layout`, {
      method: 'PUT',
      body: JSON.stringify({ layout_data: layoutData, is_dynamic: isDynamic }),
    })
    return await res.json()
  }

  async function deletePage(id) {
    await apiFetch(`/cms-pages/${id}`, { method: 'DELETE' })
  }

  return {
    pages, loading,
    fetchPages, fetchPage, fetchPageByAlias, fetchSystemPages,
    createPage, updatePage, saveLayout, deletePage,
  }
}
