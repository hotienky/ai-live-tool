/**
 * Composable quản lý Layout Pages API.
 * Tương tự useCmsPages nhưng cho /layout-pages endpoint.
 */
export function useLayoutPages(fetchFn) {
  async function fetchLayoutPages() {
    const res = await fetchFn('/layout-pages')
    const json = await res.json()
    return Array.isArray(json) ? json : (json.data || [])
  }

  async function fetchLayoutPage(id) {
    const res = await fetchFn(`/layout-pages/${id}`)
    const json = await res.json()
    return json.data || json
  }

  /**
   * Tìm layout page theo slug (ví dụ: 'home').
   * Gọi list rồi lọc client-side.
   */
  async function fetchLayoutPageBySlug(slug) {
    const list = await fetchLayoutPages()
    const found = list.find(p => p.slug === slug)
    if (!found) throw new Error(`Layout page '${slug}' không tồn tại`)
    return fetchLayoutPage(found.id)
  }

  /**
   * Lưu nháp layout (sections array).
   */
  async function saveDraft(id, sections) {
    const res = await fetchFn(`/layout-pages/${id}/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_json: sections }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Lưu thất bại')
    return json
  }

  /**
   * Xuất bản layout (tạo version snapshot).
   */
  async function publishLayout(id, sections) {
    const res = await fetchFn(`/layout-pages/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ layout_json: sections }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Xuất bản thất bại')
    return json
  }

  return { fetchLayoutPages, fetchLayoutPage, fetchLayoutPageBySlug, saveDraft, publishLayout }
}
