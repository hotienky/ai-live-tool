import { ref } from 'vue'
import { apiFetch } from './useApi.js'

/**
 * useMedia composable — API wrapper for media management.
 */
export function useMedia() {
  const mediaList = ref([])
  const loading = ref(false)
  const pagination = ref({ page: 1, lastPage: 1, total: 0, perPage: 24 })

  /**
   * Fetch media list with pagination, search, type filter.
   */
  async function fetchMedia(params = {}) {
    loading.value = true
    try {
      const qs = new URLSearchParams({
        page: params.page || pagination.value.page,
        limit: params.limit || pagination.value.perPage,
        ...(params.search ? { search: params.search } : {}),
        ...(params.type ? { type: params.type } : {}),
      })
      const res = await apiFetch(`/media?${qs}`)
      const json = await res.json()
      const data = json?.data ?? json
      if (data?.data && data?.meta) {
        mediaList.value = data.data
        pagination.value = {
          page: data.meta.current_page,
          lastPage: data.meta.last_page,
          total: data.meta.total,
          perPage: data.meta.per_page,
        }
      } else if (Array.isArray(data)) {
        mediaList.value = data
      }
    } catch (e) {
      console.error('fetchMedia error:', e)
      mediaList.value = []
    }
    loading.value = false
  }

  /**
   * Upload files. Returns array of uploaded media records.
   * Uses native fetch (not apiFetch) to avoid forcing Content-Type: application/json.
   */
  async function uploadMedia(files) {
    const { API_BASE } = await import('../config.js')
    const formData = new FormData()
    for (const f of files) {
      formData.append('files[]', f)
    }
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      body: formData,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type — browser sets multipart boundary automatically
      },
    })
    const json = await res.json()
    if (!res.ok || json?.type === 'error') {
      throw new Error(json?.message || `Upload failed (${res.status})`)
    }
    return json // { type: 'success', message: '...', data: [...] }
  }

  /**
   * Update media metadata (alt, title).
   */
  async function updateMedia(id, data) {
    const res = await apiFetch(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return await res.json()
  }

  /**
   * Delete media by ID.
   */
  async function deleteMedia(id) {
    await apiFetch(`/media/${id}`, { method: 'DELETE' })
  }

  return {
    mediaList,
    loading,
    pagination,
    fetchMedia,
    uploadMedia,
    updateMedia,
    deleteMedia,
  }
}
