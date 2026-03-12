/**
 * Storefront API — Multi-Tenant Mode
 * Tenant context is resolved by backend middleware (subdomain/header).
 * No storeId needed in the URL.
 */
const API_BASE = '/api/storefront'

/**
 * Fetch from storefront API (GET)
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

/**
 * POST to storefront API (for checkout)
 * @param {string} path — e.g. '/checkout'
 * @param {object} body — JSON body
 */
export async function apiPost(path, body = {}) {
  const url = `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}
