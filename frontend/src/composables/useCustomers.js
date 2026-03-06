import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api'

export function useCustomers() {
  const customers = ref([])
  const customerDetail = ref(null)
  const loading = ref(false)

  async function fetchCustomers() {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/customers`)
      customers.value = await res.json()
    } catch (err) {
      console.error('fetchCustomers error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchCustomerHistory(customerId) {
    loading.value = true
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/history`)
      customerDetail.value = await res.json()
    } catch (err) {
      console.error('fetchCustomerHistory error:', err)
    } finally {
      loading.value = false
    }
  }

  return {
    customers,
    customerDetail,
    loading,
    fetchCustomers,
    fetchCustomerHistory,
  }
}
