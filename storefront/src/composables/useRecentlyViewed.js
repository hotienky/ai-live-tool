import { ref, watch } from 'vue'

const STORAGE_KEY = 'sf_recently_viewed'
const MAX_ITEMS = 12

const recentlyViewed = ref([])

function loadFromStorage() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    recentlyViewed.value = data ? JSON.parse(data) : []
  } catch { recentlyViewed.value = [] }
}

function saveToStorage() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(recentlyViewed.value)) } catch {}
}

export function useRecentlyViewed() {
  if (recentlyViewed.value.length === 0) loadFromStorage()

  function addProduct(product) {
    if (!product || !product.id) return
    const item = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      promotion_price: product.promotion_price,
      image: product.image || (product.images?.[0]) || '',
    }
    // Remove duplicate, add to front
    recentlyViewed.value = [item, ...recentlyViewed.value.filter(p => p.id !== item.id)].slice(0, MAX_ITEMS)
    saveToStorage()
  }

  function clearAll() {
    recentlyViewed.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return { recentlyViewed, addProduct, clearAll }
}
