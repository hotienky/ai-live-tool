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
  localStorage.setItem('master_permissions', JSON.stringify(payload.permissions || []))
  return payload
}

export async function getMe() {
  return request('GET', '/auth/me')
}

export function logout() {
  request('POST', '/auth/logout').catch(() => {})
  localStorage.removeItem('master_token')
  localStorage.removeItem('master_user')
  localStorage.removeItem('master_permissions')
  window.location.href = '/login'
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('master_user') || 'null')
  } catch {
    return null
  }
}

export function getStoredPermissions() {
  try {
    return JSON.parse(localStorage.getItem('master_permissions') || '[]')
  } catch {
    return []
  }
}

export function can(permission) {
  const perms = getStoredPermissions()
  if (perms.includes('*')) return true
  if (perms.includes(permission)) return true
  // Wildcard match: 'tenants.*' matches 'tenants.view'
  const parts = permission.split('.')
  if (perms.includes(`${parts[0]}.*`)) return true
  if (perms.includes(`*.${parts[1]}`)) return true
  return false
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
  getAiSettings: (id) => api.get(`/ai-config/tenant/${id}/settings`),
  updateAiSettings: (id, data) => api.put(`/ai-config/tenant/${id}/settings`, data),
}

// ──── Domains ────
export const domains = {
  list: (tenantId) => api.get(`/tenants/${tenantId}/domains`),
  add: (tenantId, data) => api.post(`/tenants/${tenantId}/domains`, data),
  remove: (tenantId, domainId) => api.del(`/tenants/${tenantId}/domains/${domainId}`),
}

// ──── Users ────
export const users = {
  list: (page = 1, search = '') =>
    api.get(`/users?page=${page}${search ? `&search=${encodeURIComponent(search)}` : ''}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  remove: (id) => api.del(`/users/${id}`),
}

// ──── Roles ────
export const roles = {
  list: () => api.get('/roles'),
  create: (data) => api.post('/roles', data),
  update: (id, data) => api.put(`/roles/${id}`, data),
  remove: (id) => api.del(`/roles/${id}`),
}

// ──── Modules ────
export const modules = {
  list: () => api.get('/modules'),
  create: (data) => api.post('/modules', data),
  update: (id, data) => api.put(`/modules/${id}`, data),
  remove: (id) => api.del(`/modules/${id}`),
  toggle: (id) => request('PATCH', `${BASE}/modules/${id}/toggle`),
  pendingRequests: () => api.get('/modules/requests'),
  approve: (id) => request('PATCH', `${BASE}/modules/requests/${id}/approve`),
  reject: (id, reason) => request('PATCH', `${BASE}/modules/requests/${id}/reject`, { reason }),
}
