import { ref } from 'vue'
import { useApi } from './useApi'

const STORAGE_KEY = 'shop_customer'

export function useShopAuth() {
  const api = useApi()
  const customer = ref(null)
  const loading = ref(false)
  const error = ref(null)

  // Restore from localStorage
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try { customer.value = JSON.parse(stored) } catch { /* ignore */ }
  }

  const isLoggedIn = () => !!customer.value

  async function login(email, password, storeId) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/shop/auth/login', { email, password, storeId })
      customer.value = res.customer
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.customer))
      return res
    } catch (e) {
      error.value = e.response?.data?.error || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function register(data) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/shop/auth/register', data)
      customer.value = res.customer
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.customer))
      return res
    } catch (e) {
      error.value = e.response?.data?.error || 'Registration failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchProfile() {
    if (!customer.value?.id) return null
    loading.value = true
    try {
      const res = await api.get('/shop/auth/me', {
        headers: { 'X-Customer-Id': customer.value.id }
      })
      customer.value = res
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res))
      return res
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(data) {
    if (!customer.value?.id) return
    loading.value = true
    error.value = null
    try {
      const res = await api.put('/shop/auth/profile', data, {
        headers: { 'X-Customer-Id': customer.value.id }
      })
      customer.value = { ...customer.value, ...res }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customer.value))
      return res
    } catch (e) {
      error.value = e.response?.data?.error || 'Update failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function changePassword(currentPassword, newPassword) {
    if (!customer.value?.id) return
    loading.value = true
    error.value = null
    try {
      await api.put('/shop/auth/password', { currentPassword, newPassword }, {
        headers: { 'X-Customer-Id': customer.value.id }
      })
    } catch (e) {
      error.value = e.response?.data?.error || 'Password change failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    customer.value = null
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    customer,
    loading,
    error,
    isLoggedIn,
    login,
    register,
    fetchProfile,
    updateProfile,
    changePassword,
    logout,
  }
}
