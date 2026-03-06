/**
 * Shared API fetch helper — includes Authorization header automatically
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
    // Dispatch event so useAuth can react without reload
    window.dispatchEvent(new Event('auth:logout'))
    isRedirecting = false
  }

  return res
}

export { API_BASE }
