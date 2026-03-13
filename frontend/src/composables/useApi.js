/**
 * Shared API fetch helper — includes Authorization header automatically.
 * Auto-parses JSON and unwraps the { type, data } API envelope.
 * Returns the unwrapped data directly (not a Response object).
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

  // Handle 401 — clear auth state but don't reload (let the app handle it)
  if (res.status === 401 && !isRedirecting) {
    isRedirecting = true
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.dispatchEvent(new Event('auth:logout'))
    isRedirecting = false
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}))
    throw new Error(errorBody.message || `API error ${res.status}`)
  }

  const json = await res.json().catch(() => null)
  // Unwrap API envelope: { type: "success", data: ... } → return data
  if (json && typeof json === 'object' && 'data' in json && json.type) {
    return json.data
  }
  return json
}

export { API_BASE }
