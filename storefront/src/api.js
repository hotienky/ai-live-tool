/**
 * Storefront API — Multi-Tenant Mode
 * Tenant context is resolved by backend middleware (subdomain/header).
 * No storeId needed in the URL.
 */
const API_BASE = '/api/storefront'

/**
 * Fetch from storefront API
 * @param {string} path — e.g. '/products', '/categories'
 * @param {object} params — query params object
 */
export async function apiFetch(path, params = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  for (const [k, v] of Object.entries(params)) {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  }
  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}
