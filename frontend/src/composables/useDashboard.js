import { ref } from 'vue'
import { apiFetch } from './useApi.js'

export function useDashboard() {
  const overview = ref(null)
  const recentLeads = ref([])
  const analytics = ref({ daily: [], conversion: {} })
  const topCustomers = ref([])
  const loading = ref(false)

  async function fetchOverview() {
    loading.value = true
    try {
      const res = await apiFetch('/dashboard/overview')
      overview.value = await res.json()
    } catch (err) {
      console.error('fetchOverview error:', err)
    } finally {
      loading.value = false
    }
  }

  async function fetchRecentLeads(limit = 20) {
    try {
      const res = await apiFetch(`/dashboard/recent-leads?limit=${limit}`)
      recentLeads.value = await res.json()
    } catch (err) {
      console.error('fetchRecentLeads error:', err)
    }
  }

  async function fetchAnalytics(days = 7) {
    try {
      const params = new URLSearchParams({ days })
      const res = await apiFetch(`/dashboard/analytics?${params}`)
      analytics.value = await res.json()
    } catch (err) {
      console.error('fetchAnalytics error:', err)
    }
  }

  async function fetchTopCustomers(limit = 10) {
    try {
      const res = await apiFetch(`/dashboard/top-customers?limit=${limit}`)
      topCustomers.value = await res.json()
    } catch (err) {
      console.error('fetchTopCustomers error:', err)
    }
  }

  return {
    overview,
    recentLeads,
    analytics,
    topCustomers,
    loading,
    fetchOverview,
    fetchRecentLeads,
    fetchAnalytics,
    fetchTopCustomers,
  }
}
