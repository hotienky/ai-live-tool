const API_BASE = '/api/shop/store'

/**
 * Fetch from storefront API
 * @param {string} storeId
 * @param {string} path — e.g. '/products', '/categories'
 * @param {object} params — query params object
 */
export async function apiFetch(storeId, path, params = {}) {
  const url = new URL(`${API_BASE}/${storeId}${path}`, window.location.origin)
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
