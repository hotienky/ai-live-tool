import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useLeads() {
  const leads = ref([])
  const leadStats = ref({ New: 0, Contacting: 0, Closed: 0, Ignored: 0, total: 0 })
  const loading = ref(false)
  const error = ref(null)

  const toCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
  function mapKeys(obj) {
    if (!obj || typeof obj !== 'object') return obj
    if (Array.isArray(obj)) return obj.map(mapKeys)
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamel(k), v]))
  }

  async function fetchLeads(shopId = null, status = null) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (shopId) params.set('shopId', shopId)
      if (status) params.set('status', status)
      params.set('limit', '100')

      const res = await apiFetch(`/leads?${params}`)
      const data = await res.json()
      const raw = data.data || data.leads || data || []
      leads.value = Array.isArray(raw) ? raw.map(mapKeys) : []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  async function fetchLeadStats(shopId = null) {
    try {
      const params = shopId ? `?shopId=${shopId}` : ''
      const res = await apiFetch(`/leads/stats${params}`)
      leadStats.value = await res.json()
    } catch (err) {
      error.value = err.message
    }
  }

  async function updateLead(leadId, updates) {
    try {
      const res = await apiFetch(`/leads/${leadId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      const updated = await res.json()
      if (res.ok) {
        const idx = leads.value.findIndex((l) => l.id === leadId)
        if (idx !== -1) {
          leads.value[idx] = { ...leads.value[idx], ...updated }
        }
        return updated
      }
      throw new Error(updated.error)
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  return {
    leads,
    leadStats,
    loading,
    error,
    fetchLeads,
    fetchLeadStats,
    updateLead,
  }
}
