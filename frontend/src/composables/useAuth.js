import { ref, computed } from 'vue'
import { API_BASE } from '../config.js'

// Shared state across components — robust parsing for corrupted localStorage
function safeGetToken() {
  const t = localStorage.getItem('auth_token')
  if (!t || t === 'undefined' || t === 'null') {
    localStorage.removeItem('auth_token')
    return null
  }
  return t
}
function safeGetUser() {
  const u = localStorage.getItem('auth_user')
  if (!u || u === 'undefined' || u === 'null') {
    localStorage.removeItem('auth_user')
    return null
  }
  try { return JSON.parse(u) } catch { localStorage.removeItem('auth_user'); return null }
}
const token = ref(safeGetToken())
const currentUser = ref(safeGetUser())

export function useAuth() {
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!token.value)

  // Listen for forced logout from apiFetch 401 handler
  if (typeof window !== 'undefined') {
    window.addEventListener('auth:logout', () => {
      token.value = null
      currentUser.value = null
    })
  }

  /**
   * Đăng nhập
   */
  async function login(email, password) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()

      if (!res.ok) {
        error.value = data.error || 'Đăng nhập thất bại'
        return false
      }

      const payload = data.data || data
      token.value = payload.token
      currentUser.value = payload.user
      localStorage.setItem('auth_token', payload.token)
      localStorage.setItem('auth_user', JSON.stringify(payload.user))
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Đăng ký
   */
  async function register(email, password, name) {
    loading.value = true
    error.value = null
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()

      if (!res.ok) {
        error.value = data.error || 'Đăng ký thất bại'
        return false
      }

      const payload = data.data || data
      token.value = payload.token
      currentUser.value = payload.user
      localStorage.setItem('auth_token', payload.token)
      localStorage.setItem('auth_user', JSON.stringify(payload.user))
      return true
    } catch (err) {
      error.value = err.message
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Đăng xuất
   */
  function logout() {
    token.value = null
    currentUser.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  /**
   * Lấy auth header cho API calls
   */
  function getAuthHeaders() {
    if (!token.value) return {}
    return { Authorization: `Bearer ${token.value}` }
  }

  return {
    token,
    currentUser,
    isLoggedIn,
    loading,
    error,
    login,
    register,
    logout,
    getAuthHeaders,
  }
}
