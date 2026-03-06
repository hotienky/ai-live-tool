/**
 * Shared API fetch helper — includes Authorization header automatically
 */
const API_BASE = 'http://localhost:3000/api'

function getAuthHeaders() {
  const token = localStorage.getItem('auth_token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  })

  // Auto-redirect to login on 401
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.reload()
    throw new Error('Unauthorized')
  }

  return res
}

export { API_BASE }
