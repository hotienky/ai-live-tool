/**
 * Storefront SDK — lightweight API wrapper for headless frontends.
 *
 * Usage (Vanilla JS):
 *   import { createStorefrontClient } from './storefront-sdk.js'
 *   const sf = createStorefrontClient('https://fashionvn.com')
 *   const config = await sf.getSiteConfig()
 *   const products = await sf.getProducts({ page: 1, perPage: 12, category: 'ao-thun' })
 *
 * Usage (Next.js / Nuxt / etc.):
 *   Same API — works in both server and client environments.
 */

const cache = new Map()
const CACHE_TTL = 60_000 // 1 minute

function createStorefrontClient(baseUrl, options = {}) {
  const apiBase = `${baseUrl.replace(/\/$/, '')}/api/storefront`
  const headers = { 'Accept': 'application/json', ...(options.headers || {}) }

  async function request(path, params = {}) {
    const url = new URL(`${apiBase}${path}`)
    Object.entries(params).forEach(([k, v]) => { if (v != null && v !== '') url.searchParams.set(k, v) })

    const cacheKey = url.toString()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data

    const res = await fetch(url.toString(), { headers })
    if (!res.ok) throw new Error(`Storefront API error: ${res.status} ${res.statusText}`)
    const json = await res.json()
    const data = (json && typeof json === 'object' && 'data' in json && json.type) ? json.data : json

    cache.set(cacheKey, { data, ts: Date.now() })
    return data
  }

  return {
    // ── Mega Config ──
    getSiteConfig: () => request('/site-config'),

    // ── Products ──
    getProducts: ({ page = 1, perPage = 20, category, brand, sort } = {}) =>
      request('/products', { page, per_page: perPage, category, brand, sort_by: sort }),

    getProduct: (slugOrId) => request(`/products/${slugOrId}`),
    getRelatedProducts: (slugOrId) => request(`/products/${slugOrId}/related`),
    getFeaturedProducts: () => request('/featured-products'),
    searchProducts: (q, { page = 1, perPage = 20 } = {}) =>
      request('/search', { q, page, per_page: perPage }),

    // ── Categories & Brands ──
    getCategories: () => request('/categories'),
    getBrands: () => request('/brands'),

    // ── Content ──
    getBanners: () => request('/banners'),
    getPages: () => request('/pages'),
    getPage: (slug) => request(`/pages/${slug}`),

    // ── Layout & Theme ──
    getLayout: () => request('/storefront-layout'),
    getTheme: () => request('/theme'),
    getNavLinks: () => request('/nav-links'),

    // ── Flash Sales ──
    getFlashSales: () => request('/flash-sales'),
    getActiveFlashSales: () => request('/flash-sales/active'),

    // ── Commerce ──
    checkout: (body) => fetch(`${apiBase}/checkout`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
    validateCoupon: (code, orderTotal) => fetch(`${apiBase}/coupon/validate`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ code, order_total: orderTotal }) }).then(r => r.json()),
    getPaymentMethods: () => request('/payment-methods'),

    // ── Shipping ──
    getShippingProviders: () => request('/shipping/providers'),
    calculateShipping: (body) => fetch(`${apiBase}/shipping/calculate`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),

    // ── URL Resolver ──
    resolveUrl: (path) => request('/resolve-url', { path }),

    // ── Utilities ──
    clearCache: () => cache.clear(),
    getApiBase: () => apiBase,
  }
}

export { createStorefrontClient }
export default createStorefrontClient
