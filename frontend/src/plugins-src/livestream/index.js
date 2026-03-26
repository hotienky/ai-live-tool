// Livestream Plugin — Entry Point
// Đọc bình luận từ livestream TikTok, Facebook, YouTube, Shopee
// Đăng ký sidebar items, routes và components vào hệ thống plugin

import LiveMonitorView from './components/LiveMonitorView.vue'
import SessionReplayView from './components/SessionReplay.vue'

const PLUGIN_ID = 'livestream'

// ══════════════════════════════════════
// Register sidebar nav group via hooks
// ══════════════════════════════════════
const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const Icons = window.LucideVueNext || {}

  if (hooks) {
    hooks.addFilter('sidebar_items', (items) => {
      items.unshift({
        key: 'live-group',
        label: 'Live',
        icon: Icons.MonitorPlay || 'MonitorPlay',
        featureGroup: 'livestream',
        permission: null,
        activeKeys: ['live', 'live/replay'],
        children: [
          { key: 'live', view: 'live', label: 'Live Monitor', icon: Icons.MonitorPlay || 'MonitorPlay' },
          { key: 'live-replay', view: 'live/replay', label: 'Session Replay', icon: Icons.PlayCircle || 'PlayCircle' },
        ],
      })
      return items
    }, 5) // priority 5 — renders before other plugins

    hooks.addFilter('admin_routes', (config) => {
      Object.assign(config.routeToTab, {
        'live': 'live-monitor',
        'live/replay': 'live-replay',
      })
      config.validViews = config.validViews || []
      config.validViews.push('live', 'live/replay')
      return config
    })
  }
}

// ══════════════════════════════════════
// Register plugin via registry
// ══════════════════════════════════════
const plugin = {
  id: PLUGIN_ID,
  name: 'Livestream Comment Reader',
  version: '1.0.0',
  description: 'Đọc và phân loại bình luận từ TikTok, Facebook, YouTube, Shopee livestream theo thời gian thực.',
  icon: 'MonitorPlay',
  // Components keyed by tab/view ID
  components: {
    'live-monitor': LiveMonitorView,
    'live-replay': SessionReplayView,
  },
  initHooks,
}

export default plugin
