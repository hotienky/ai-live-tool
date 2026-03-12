import { reactive, computed } from 'vue'

/**
 * useCart — Cart composable with localStorage persistence
 * Shared across storefront components
 */
const STORAGE_KEY = 'sf_cart'

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

const state = reactive({
  items: loadCart(),
})

function saveCart() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

export function useCart() {
  const cartItems = computed(() => state.items)
  const cartCount = computed(() => state.items.reduce((s, i) => s + i.qty, 0))
  const cartTotal = computed(() => state.items.reduce((s, i) => s + i.price * i.qty, 0))

  function addToCart(product, qty = 1) {
    const existing = state.items.find(i => i.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      state.items.push({
        id: product.id,
        name: product.name,
        price: Number(product.promotion_price && product.promotion_price < product.price ? product.promotion_price : product.price) || 0,
        originalPrice: Number(product.price) || 0,
        image: product.image_url || product.image || null,
        sku: product.sku || null,
        unit: product.unit || 'cái',
        qty,
      })
    }
    saveCart()
  }

  function updateQty(productId, qty) {
    const item = state.items.find(i => i.id === productId)
    if (item) {
      item.qty = Math.max(1, qty)
      saveCart()
    }
  }

  function removeFromCart(productId) {
    state.items = state.items.filter(i => i.id !== productId)
    saveCart()
  }

  function clearCart() {
    state.items = []
    saveCart()
  }

  return { cartItems, cartCount, cartTotal, addToCart, updateQty, removeFromCart, clearCart }
}
