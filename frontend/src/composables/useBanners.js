import { ref } from 'vue'

export function useBanners(apiFetch) {
  const banners = ref([])
  const loading = ref(false)

  async function fetchBanners(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams(params).toString()
      const res = await apiFetch(`/banners?${qs}`)
      banners.value = await res.json()
    } catch { banners.value = [] }
    loading.value = false
  }

  async function createBanner(data) {
    const res = await apiFetch('/banners', { method: 'POST', body: JSON.stringify(data) })
    return await res.json()
  }

  async function updateBanner(id, data) {
    const res = await apiFetch(`/banners/${id}`, { method: 'PUT', body: JSON.stringify(data) })
    return await res.json()
  }

  async function deleteBanner(id) {
    await apiFetch(`/banners/${id}`, { method: 'DELETE' })
  }

  return { banners, loading, fetchBanners, createBanner, updateBanner, deleteBanner }
}
