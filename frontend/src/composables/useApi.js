/**
 * Shared API fetch helper — includes Authorization header automatically.
 * Returns a Response-like object whose .json() auto-unwraps the
 * { type, data } API envelope, so callers always get just the data.
 */
import { API_BASE } from '../config.js'

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

let isRedirecting = false

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  // Handle 401 — clear auth state
  if (res.status === 401 && !isRedirecting) {
    isRedirecting = true
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.dispatchEvent(new Event('auth:logout'))
    isRedirecting = false
  }

  // Wrap response so .json() auto-unwraps API envelope
  const originalJson = res.json.bind(res)
  res.json = async () => {
    const json = await originalJson()
    // Unwrap: { type: "success", data: ... } → data
    if (json && typeof json === 'object' && 'data' in json && json.type) {
      return json.data
    }
    return json
  }

  return res
}

export { API_BASE }
