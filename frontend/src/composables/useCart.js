import { ref } from 'vue'

/**
 * useCart — S-Cart aligned composable
 * Manages shopping cart with JSON storage in shopping_carts table
 */
export function useCart(apiFetch) {
  const items = ref([])
  const loading = ref(false)

  async function fetchCart() {
    loading.value = true
    try {
      const res = await apiFetch('/cart')
      const json = await res.json()
      items.value = json.items || []
    } catch { items.value = [] }
    loading.value = false
  }

  async function addItem({ productId, name, sku, qty = 1, price, attribute }) {
    const res = await apiFetch('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, name, sku, qty, price, attribute }),
    })
    const json = await res.json()
    items.value = json.items || []
    return json
  }

  async function updateItem(productId, qty) {
    const res = await apiFetch(`/cart/items/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ qty }),
    })
    const json = await res.json()
    items.value = json.items || []
    return json
  }

  async function removeItem(productId) {
    const res = await apiFetch(`/cart/items/${productId}`, {
      method: 'DELETE',
    })
    const json = await res.json()
    items.value = json.items || []
    return json
  }

  /**
   * Checkout — S-Cart: createOrder pattern
   * Creates Order + OrderDetail + OrderTotal + OrderHistory in DB transaction
   */
  async function checkout({ customerName, customerPhone, customerAddress, paymentMethod, notes, shippingFee, discount }) {
    const res = await apiFetch('/cart/checkout', {
      method: 'POST',
      body: JSON.stringify({
        customerName, customerPhone, customerAddress,
        paymentMethod, notes, shippingFee, discount,
      }),
    })
    const json = await res.json()
    if (res.ok) items.value = [] // Clear local cart
    return json
  }

  // Computed-like getters
  function cartTotal() {
    return items.value.reduce((sum, i) => sum + (i.price * i.qty), 0)
  }

  function cartCount() {
    return items.value.reduce((sum, i) => sum + i.qty, 0)
  }

  return {
    items, loading,
    fetchCart, addItem, updateItem, removeItem, checkout,
    cartTotal, cartCount,
  }
}
