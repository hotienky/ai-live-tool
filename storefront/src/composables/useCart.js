import { reactive, computed } from 'vue'

/**
 * useCart — Cart composable with localStorage persistence
 * Supports product variants (same product, different variant = separate cart item)
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

/**
 * Generate a unique cart key from productId + variantId
 */
function cartKey(productId, variantId) {
  return variantId ? `${productId}_v${variantId}` : `${productId}`
}

export function useCart() {
  const cartItems = computed(() => state.items)
  const cartCount = computed(() => state.items.reduce((s, i) => s + i.qty, 0))
  const cartTotal = computed(() => state.items.reduce((s, i) => s + i.price * i.qty, 0))

  /**
   * Add product (with optional variant) to cart
   * @param {object} product — product data
   * @param {number} qty
   * @param {object|null} variant — { id, name, sku, price, attributes }
   */
  function addToCart(product, qty = 1, variant = null) {
    const productId = product.id
    const variantId = variant?.id || null
    const key = cartKey(productId, variantId)

    const existing = state.items.find(i => i.key === key)
    if (existing) {
      existing.qty += qty
    } else {
      const effectivePrice = variant?.price
        ? Number(variant.price)
        : Number(product.promotion_price && product.promotion_price < product.price
            ? product.promotion_price
            : product.price) || 0

      state.items.push({
        key,
        id: product.id,           // kept for backward compat
        productId,
        variantId,
        name: variant ? `${product.name} — ${variant.name}` : product.name,
        price: effectivePrice,
        originalPrice: Number(product.price) || 0,
        image: product.image_url || product.image || null,
        sku: variant?.sku || product.sku || null,
        variantName: variant?.name || null,
        unit: product.unit || 'cái',
        qty,
      })
    }
    saveCart()
  }

  function updateQty(key, qty) {
    const item = state.items.find(i => i.key === key || i.id === key)
    if (item) {
      item.qty = Math.max(1, qty)
      saveCart()
    }
  }

  function removeFromCart(key) {
    state.items = state.items.filter(i => i.key !== key && i.id !== key)
    saveCart()
  }

  function clearCart() {
    state.items = []
    saveCart()
  }

  return { cartItems, cartCount, cartTotal, addToCart, updateQty, removeFromCart, clearCart }
}
