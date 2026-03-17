/**
 * API Service — Centralized HTTP client for Master Panel.
 * All requests are prefixed with /api/master and include Bearer token.
 */
const BASE = '/api/master'

function getHeaders() {
  const token = localStorage.getItem('master_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(method, path, body) {
  const url = path.startsWith('/api/') ? path : `${BASE}${path}`
  const opts = { method, headers: getHeaders() }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(url, opts)
  const data = await res.json().catch(() => ({}))

  if (res.status === 401) {
    localStorage.removeItem('master_token')
    localStorage.removeItem('master_user')
    window.location.href = '/login'
    throw new Error('Unauthorized')
  }

  if (!res.ok) throw new Error(data.error || data.message || `HTTP ${res.status}`)
  return data.data !== undefined ? data.data : data
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  put: (path, body) => request('PUT', path, body),
  del: (path) => request('DELETE', path),
}

// ──── Auth ────
export async function login(email, password) {
  const res = await request('POST', '/api/master/auth/login', { email, password })
  const payload = res.data || res
  localStorage.setItem('master_token', payload.token)
  localStorage.setItem('master_user', JSON.stringify(payload.user))
  return payload
}

export async function getMe() {
  return request('GET', '/auth/me')
}

export function logout() {
  request('POST', '/auth/logout').catch(() => {})
  localStorage.removeItem('master_token')
  localStorage.removeItem('master_user')
  window.location.href = '/login'
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('master_user') || 'null')
  } catch {
    return null
  }
}

// ──── Tenants ────
export const tenants = {
  list: (page = 1, search = '') =>
    api.get(`/tenants?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  get: (id) => api.get(`/tenants/${id}`),
  create: (data) => api.post('/tenants', data),
  update: (id, data) => api.put(`/tenants/${id}`, data),
  remove: (id) => api.del(`/tenants/${id}`),
  suspend: (id) => api.post(`/tenants/${id}/suspend`),
  activate: (id) => api.post(`/tenants/${id}/activate`),
  migrate: (id) => api.post(`/tenants/${id}/migrate`),
  seed: (id) => api.post(`/tenants/${id}/seed`),
}

// ──── Domains ────
export const domains = {
  list: (tenantId) => api.get(`/tenants/${tenantId}/domains`),
  add: (tenantId, data) => api.post(`/tenants/${tenantId}/domains`, data),
  remove: (tenantId, domainId) => api.del(`/tenants/${tenantId}/domains/${domainId}`),
}
