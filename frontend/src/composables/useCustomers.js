import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useCustomers() {
  const customers = ref([])
  const customerDetail = ref(null)
  const loading = ref(false)

  async function fetchCustomers(shopId = null, search = null) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (shopId) params.set('shopId', shopId)
      if (search) params.set('search', search)
      const res = await apiFetch(`/customers?${params}`)
      customers.value = await res.json()
    } catch (err) {
      console.error('fetchCustomers error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerDetail(customerId) {
    loading.value = true
    try {
      const res = await apiFetch(`/customers/${customerId}`)
      customerDetail.value = await res.json()
    } catch (err) {
      console.error('fetchCustomerDetail error:', err)
    } finally {
      loading.value = false
    }
  }

  async function updateCustomer(customerId, updates) {
    try {
      const res = await apiFetch(`/customers/${customerId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (res.ok) return await res.json()
      throw new Error('Update failed')
    } catch (err) {
      console.error('updateCustomer error:', err)
      throw err
    }
  }

  async function deleteCustomer(customerId) {
    try {
      const res = await apiFetch(`/customers/${customerId}`, { method: 'DELETE' })
      if (res.ok) {
        customers.value = customers.value.filter(c => c.id !== customerId)
      }
    } catch (err) {
      console.error('deleteCustomer error:', err)
      throw err
    }
  }

  return {
    customers,
    customerDetail,
    loading,
    fetchCustomers,
    fetchCustomerDetail,
    updateCustomer,
    deleteCustomer,
  }
}
