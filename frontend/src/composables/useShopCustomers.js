import { ref } from 'vue'

/**
 * useShopCustomers — Composable for e-commerce customer CRUD
 * S-Cart: ShopCustomer (separate from live-commerce customers)
 */
export function useShopCustomers(apiFetch) {
  const customers = ref([])
  const loading = ref(false)
  const pagination = ref({})

  async function fetchCustomers(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/shop-customers?${qs}`)
      const json = await res.json()
      customers.value = json.data || json
      pagination.value = json.meta || {}
    } catch { customers.value = [] }
    loading.value = false
  }

  async function fetchCustomer(id) {
    const res = await apiFetch(`/shop-customers/${id}`)
    return await res.json()
  }

  async function createCustomer(data) {
    const res = await apiFetch('/shop-customers', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function updateCustomer(id, data) {
    const res = await apiFetch(`/shop-customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function deleteCustomer(id) {
    await apiFetch(`/shop-customers/${id}`, { method: 'DELETE' })
  }

  // Address management
  async function fetchAddresses(customerId) {
    const res = await apiFetch(`/shop-customers/${customerId}/addresses`)
    return await res.json()
  }

  async function addAddress(customerId, data) {
    const res = await apiFetch(`/shop-customers/${customerId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function updateAddress(customerId, addressId, data) {
    const res = await apiFetch(`/shop-customers/${customerId}/addresses/${addressId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function deleteAddress(customerId, addressId) {
    await apiFetch(`/shop-customers/${customerId}/addresses/${addressId}`, { method: 'DELETE' })
  }

  return {
    customers, loading, pagination,
    fetchCustomers, fetchCustomer, createCustomer, updateCustomer, deleteCustomer,
    fetchAddresses, addAddress, updateAddress, deleteAddress,
  }
}
