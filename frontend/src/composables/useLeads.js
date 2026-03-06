import { ref } from 'vue'

const API_BASE = 'http://localhost:3000/api'

export function useLeads() {
  const leads = ref([])
  const leadStats = ref({ New: 0, Contacting: 0, Closed: 0, Ignored: 0, total: 0 })
  const loading = ref(false)
  const error = ref(null)

  /**
   * Lấy danh sách leads
   */
  async function fetchLeads(shopId = null, status = null) {
    loading.value = true
    try {
      const params = new URLSearchParams()
      if (shopId) params.set('shopId', shopId)
      if (status) params.set('status', status)
      params.set('limit', '100')

      const res = await fetch(`${API_BASE}/leads?${params}`)
      const data = await res.json()
      leads.value = data.leads || []
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  /**
   * Lấy thống kê pipeline
   */
  async function fetchLeadStats(shopId = null) {
    try {
      const params = shopId ? `?shopId=${shopId}` : ''
      const res = await fetch(`${API_BASE}/leads/stats${params}`)
      leadStats.value = await res.json()
    } catch (err) {
      error.value = err.message
    }
  }

  /**
   * Cập nhật trạng thái lead
   */
  async function updateLead(leadId, updates) {
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
