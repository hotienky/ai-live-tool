import { ref, computed } from 'vue'

const API_BASE = 'http://localhost:3000/api'

// Shared state across components
const token = ref(localStorage.getItem('auth_token') || null)
const currentUser = ref(JSON.parse(localStorage.getItem('auth_user') || 'null'))

export function useAuth() {
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!token.value)

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

      token.value = data.token
      currentUser.value = data.user
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
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

      token.value = data.token
      currentUser.value = data.user
      localStorage.setItem('auth_token', data.token)
      localStorage.setItem('auth_user', JSON.stringify(data.user))
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
