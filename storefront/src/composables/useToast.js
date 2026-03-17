import { reactive } from 'vue'

/**
 * Minimal Toast system for storefront
 * Usage: const { showToast } = useToast()
 *        showToast('Đã thêm vào giỏ hàng!', 'success')
 */
const toasts = reactive([])
let nextId = 1

export function useToast() {
  function showToast(message, type = 'success', duration = 3000) {
    const id = nextId++
    toasts.push({ id, message, type })
    setTimeout(() => {
      const idx = toasts.findIndex(t => t.id === id)
      if (idx !== -1) toasts.splice(idx, 1)
    }, duration)
  }

  function removeToast(id) {
    const idx = toasts.findIndex(t => t.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return { toasts, showToast, removeToast }
}
