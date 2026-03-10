import { ref } from 'vue'

/**
 * useOrders — S-Cart aligned composable
 * Uses dynamic order_statuses + payment_statuses from API
 */
export function useOrders(apiFetch) {
  const orders = ref([])
  const loading = ref(false)
  const pagination = ref({})
  const orderStatuses = ref([]) // Dynamic from DB
  const paymentStatuses = ref([]) // Dynamic from DB

  async function fetchOrders(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/orders?${qs}`)
      const json = await res.json()
      orders.value = json.data || json
      pagination.value = json.meta || {}
    } catch { orders.value = [] }
    loading.value = false
  }

  async function fetchOrder(id) {
    const res = await apiFetch(`/orders/${id}`)
    return await res.json()
  }

  /** S-Cart: ShopOrderDetail */
  async function fetchOrderDetails(id) {
    const res = await apiFetch(`/orders/${id}/details`)
    return await res.json()
  }

  /** S-Cart: ShopOrderTotal */
  async function fetchOrderTotals(id) {
    const res = await apiFetch(`/orders/${id}/totals`)
    return await res.json()
  }

  /** S-Cart: ShopOrderHistory */
  async function fetchOrderHistory(id) {
    const res = await apiFetch(`/orders/${id}/history`)
    return await res.json()
  }

  /** S-Cart: order_statuses lookup table */
  async function fetchOrderStatuses() {
    try {
      const res = await apiFetch('/order-statuses')
      orderStatuses.value = await res.json()
    } catch { orderStatuses.value = [] }
  }

  /** S-Cart: payment_statuses lookup table */
  async function fetchPaymentStatuses() {
    try {
      const res = await apiFetch('/payment-statuses')
      paymentStatuses.value = await res.json()
    } catch { paymentStatuses.value = [] }
  }

  /** Update status using statusId (FK to order_statuses) */
  async function updateStatus(orderId, statusId, content = '') {
    const res = await apiFetch(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ statusId, content }),
    })
    return await res.json()
  }

  async function createOrder(data) {
    const res = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function updateOrder(id, data) {
    const res = await apiFetch(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  async function deleteOrder(id) {
    await apiFetch(`/orders/${id}`, { method: 'DELETE' })
  }

  // Helper: get status name by id
  function getStatusName(statusId) {
    const s = orderStatuses.value.find((s) => s.id === statusId)
    return s ? s.name : `#${statusId}`
  }

  function getPaymentStatusName(statusId) {
    const s = paymentStatuses.value.find((s) => s.id === statusId)
    return s ? s.name : `#${statusId}`
  }

  return {
    orders, loading, pagination,
    orderStatuses, paymentStatuses,
    fetchOrders, fetchOrder,
    fetchOrderDetails, fetchOrderTotals, fetchOrderHistory,
    fetchOrderStatuses, fetchPaymentStatuses,
    updateStatus, createOrder, updateOrder, deleteOrder,
    getStatusName, getPaymentStatusName,
  }
}
