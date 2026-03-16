import { ref, computed } from 'vue'

/**
 * Storefront Customer Auth — S-Cart pattern
 * Uses /api/shop/auth/* endpoints for customer register/login/profile
 */

const customer = ref(JSON.parse(localStorage.getItem('sf_customer') || 'null'))
const token = ref(localStorage.getItem('sf_token') || '')
const loading = ref(false)
const error = ref('')

const isLoggedIn = computed(() => !!customer.value && !!token.value)

function saveSession(cust, tok) {
  customer.value = cust
  token.value = tok
  localStorage.setItem('sf_customer', JSON.stringify(cust))
  localStorage.setItem('sf_token', tok)
}

function clearSession() {
  customer.value = null
  token.value = ''
  localStorage.removeItem('sf_customer')
  localStorage.removeItem('sf_token')
}

/**
 * Unwrap API envelope: { type: "success", data: ... } → data
 */
function unwrap(json) {
  if (json && typeof json === 'object' && 'data' in json && json.type) {
    return json.data
  }
  return json
}

/**
 * Make authenticated API call with customer headers
 */
async function authFetch(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(token.value ? { 'Authorization': `Bearer ${token.value}` } : {}),
    ...options.headers,
  }
  const res = await fetch(`/api/shop/auth${path}`, { ...options, headers })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || `HTTP ${res.status}`)
  return unwrap(data)
}

export function useAuth() {
  async function login(email, password) {
    loading.value = true
    error.value = ''
    try {
      const data = await authFetch('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      saveSession(data.customer, data.token)
      return true
    } catch (e) {
      error.value = e.message || 'Đăng nhập thất bại'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(form) {
    loading.value = true
    error.value = ''
    try {
      const data = await authFetch('/register', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      saveSession(data.customer, data.token)
      return true
    } catch (e) {
      error.value = e.message || 'Đăng ký thất bại'
      return false
    } finally {
      loading.value = false
    }
  }

  async function forgotPassword(email) {
    loading.value = true
    error.value = ''
    try {
      await authFetch('/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      })
      return true
    } catch (e) {
      error.value = e.message
      return false
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(data) {
    return authFetch('/profile', { method: 'PUT', body: JSON.stringify(data) })
  }

  async function changePassword(currentPassword, newPassword) {
    return authFetch('/password', {
      method: 'PUT',
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    })
  }

  async function fetchProfile() {
    try {
      const data = await authFetch('/me')
      customer.value = data
      return data
    } catch {
      clearSession()
      return null
    }
  }

  function logout() {
    clearSession()
  }

  return {
    customer,
    token,
    isLoggedIn,
    loading,
    error,
    authFetch,
    login,
    register,
    forgotPassword,
    updateProfile,
    changePassword,
    fetchProfile,
    logout,
  }
}
