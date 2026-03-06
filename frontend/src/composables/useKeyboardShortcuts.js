import { onMounted, onUnmounted } from 'vue'

/**
 * useKeyboardShortcuts — Keyboard shortcuts cho livestream seller
 *
 * Shortcuts:
 * - Ctrl+1..5: Chuyển tab (Dashboard, Live, CRM, Reports, Settings)
 * - Ctrl+K: Toggle search trong ChatStream
 * - Ctrl+M: Start mock data
 * - Esc: Đóng modal / panel
 * - ?: Show shortcuts help
 */
export function useKeyboardShortcuts({
  onSwitchTab,
  onToggleSearch,
  onStartMock,
  onCloseModal,
  onToggleHelp,
}) {
  function handler(e) {
    // Don't trigger shortcuts when typing in inputs
    const tag = e.target.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
      // Only allow Escape in inputs
      if (e.key === 'Escape') {
        e.target.blur()
        onCloseModal?.()
      }
      return
    }

    // Ctrl/Cmd + Number → Switch tab
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      const tabMap = {
        '1': 'dashboard',
        '2': 'live',
        '3': 'crm',
        '4': 'reports',
        '5': 'settings',
        '6': 'orders',
        '7': 'schedule',
      }
      if (tabMap[e.key]) {
        e.preventDefault()
        onSwitchTab?.(tabMap[e.key])
        return
      }

      // Ctrl+K → Toggle search
      if (e.key === 'k' || e.key === 'K') {
        e.preventDefault()
        onToggleSearch?.()
        return
      }

      // Ctrl+M → Start mock
      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        onStartMock?.()
        return
      }
    }

    // Escape → Close modal
    if (e.key === 'Escape') {
      onCloseModal?.()
      return
    }

    // ? → Show shortcuts help
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
      onToggleHelp?.()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handler)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handler)
  })

  return {
    shortcuts: [
      { keys: 'Ctrl+1', desc: 'Dashboard' },
      { keys: 'Ctrl+2', desc: 'Live Monitor' },
      { keys: 'Ctrl+3', desc: 'CRM Pipeline' },
      { keys: 'Ctrl+4', desc: 'Reports' },
      { keys: 'Ctrl+5', desc: 'Settings' },
      { keys: 'Ctrl+6', desc: 'Orders' },
      { keys: 'Ctrl+7', desc: 'Schedule' },
      { keys: 'Ctrl+K', desc: 'Tìm kiếm comment' },
      { keys: 'Ctrl+M', desc: 'Start mock data' },
      { keys: 'Esc', desc: 'Đóng modal / panel' },
      { keys: '?', desc: 'Hiện shortcuts' },
    ],
  }
}
