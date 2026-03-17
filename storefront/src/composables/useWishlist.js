import { reactive, computed } from 'vue'

/**
 * useWishlist — Wishlist composable with localStorage persistence
 * Guest: saved in localStorage (sf_wishlist)
 * Auth: synced to backend /api/storefront/wishlist when logged in
 */
const STORAGE_KEY = 'sf_wishlist'

function loadWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

const state = reactive({
  items: loadWishlist(), // Array of { id, name, price, image, slug }
})

function saveWishlist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
}

async function syncToBackend(productId, action = 'add') {
  try {
    const token = localStorage.getItem('sf_token')
    if (!token) return
    const method = action === 'add' ? 'POST' : 'DELETE'
    await fetch(`/api/storefront/wishlist/${productId}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
  } catch (e) {
    console.warn('[Wishlist] Backend sync failed:', e.message)
  }
}

export function useWishlist() {
  const wishlistItems = computed(() => state.items)
  const wishlistCount = computed(() => state.items.length)

  function isLiked(productId) {
    return state.items.some(i => i.id === productId)
  }

  function toggleWishlist(product) {
    const idx = state.items.findIndex(i => i.id === product.id)
    if (idx === -1) {
      // Add
      state.items.push({
        id: product.id,
        name: product.name,
        price: Number(product.promotion_price && product.promotion_price < product.price
          ? product.promotion_price
          : product.price) || 0,
        originalPrice: Number(product.price) || 0,
        image: product.image_url || product.image || null,
        slug: product.slug || null,
        category: product.category || null,
      })
      syncToBackend(product.id, 'add')
    } else {
      // Remove
      state.items.splice(idx, 1)
      syncToBackend(product.id, 'remove')
    }
    saveWishlist()
    return !isLiked(product.id) // returns new state (false = was just removed)
  }

  function removeFromWishlist(productId) {
    const idx = state.items.findIndex(i => i.id === productId)
    if (idx !== -1) {
      state.items.splice(idx, 1)
      saveWishlist()
      syncToBackend(productId, 'remove')
    }
  }

  function clearWishlist() {
    state.items = []
    saveWishlist()
  }

  /**
   * Load wishlist from backend (called after login)
   */
  async function fetchFromBackend() {
    try {
      const token = localStorage.getItem('sf_token')
      if (!token) return
      const res = await fetch('/api/storefront/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` },
      })
      if (!res.ok) return
      const data = await res.json()
      const items = data?.data || data || []
      // Merge remote + local (remote takes precedence)
      const remoteIds = new Set(items.map(i => i.id))
      const localOnly = state.items.filter(i => !remoteIds.has(i.id))
      state.items = [...items, ...localOnly]
      saveWishlist()
    } catch (e) {
      console.warn('[Wishlist] Fetch from backend failed:', e.message)
    }
  }

  return {
    wishlistItems,
    wishlistCount,
    isLiked,
    toggleWishlist,
    removeFromWishlist,
    clearWishlist,
    fetchFromBackend,
  }
}
