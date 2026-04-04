import { computed } from 'vue'

/**
 * usePersonalization
 * 
 * Provides rule engine evaluation for section conditions.
 * Used to implement Personalization Engine (A/B testing, scheduled campaigns, audience targeting).
 */
export function usePersonalization() {
  
  // Try to grab auth state if available in the app context
  // Usually storefront has a useAuth() or injects user state
  const getCurrentUser = () => {
    try {
      // Default to localStorage auth standard for now
      const token = localStorage.getItem('auth_token')
      return !!token
    } catch {
      return false
    }
  }

  const evaluateConditions = (conditions) => {
    if (!conditions || Object.keys(conditions).length === 0) return true;

    // 1. Time-based Rules (Campaign Scheduling)
    const now = new Date().getTime()
    if (conditions.dateFrom) {
      const from = new Date(conditions.dateFrom).getTime()
      if (now < from) return false
    }
    
    if (conditions.dateTo) {
      const to = new Date(conditions.dateTo).getTime()
      if (now > to) return false
    }

    // 2. Audience Targeting (Login Status)
    if (conditions.userAuth) {
      const isLoggedIn = getCurrentUser()
      if (conditions.userAuth === 'logged_in' && !isLoggedIn) return false
      if (conditions.userAuth === 'guest' && isLoggedIn) return false
    }

    // 3. User Group Targeting (VIP, Wholesale, etc.) - For future use
    if (conditions.userGroup && conditions.userGroup !== 'all') {
      const userGroup = localStorage.getItem('user_group') || 'retail'
      if (conditions.userGroup !== userGroup) return false
    }

    // 4. Device Filtering is handled via CSS / getParams but we can add hard JS block here if needed
    if (conditions.device && conditions.device !== 'all') {
      const isMobile = window.innerWidth <= 768
      const isTablet = window.innerWidth > 768 && window.innerWidth <= 1024
      const isDesktop = window.innerWidth > 1024
      
      if (conditions.device === 'mobile_only' && !isMobile) return false
      if (conditions.device === 'desktop_only' && !isDesktop) return false
    }

    return true
  }

  return {
    evaluateConditions
  }
}
