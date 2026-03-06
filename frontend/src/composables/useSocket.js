import { ref, onMounted, onUnmounted, watch } from 'vue'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config.js'
import { useToast } from './useToast.js'

export function useSocket() {
  const socket = ref(null)
  const isConnected = ref(false)
  const leads = ref([])         // HOT + WARM only
  const allComments = ref([])   // All comments
  const stats = ref({ hot: 0, warm: 0, cold: 0, total: 0 })
  const crawlerStatus = ref({ status: 'connecting' })
  const viewerCount = ref(0)
  const currentShopId = ref(null)
  const autoReplies = ref([])

  // Sound notification
  function playNotificationSound() {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.frequency.value = 880
      oscillator.type = 'sine'
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5)
      oscillator.start(audioCtx.currentTime)
      oscillator.stop(audioCtx.currentTime + 0.5)
    } catch (e) {
      // Silent fail
    }
  }

  const connectionLost = ref(false)

  function connect() {
    socket.value = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      connectionLost.value = false
      if (currentShopId.value) {
        socket.value.emit('join_shop', { shopId: currentShopId.value })
      }
    })

    socket.value.on('disconnect', () => {
      isConnected.value = false
      connectionLost.value = true
    })

    socket.value.io.on('reconnect_attempt', () => {})

    socket.value.io.on('reconnect', () => {
      connectionLost.value = false
    })

    // New comment from server (scoped to shop room)
    socket.value.on('new_comment', (data) => {
      allComments.value.unshift(data)
      if (allComments.value.length > 200) {
        allComments.value = allComments.value.slice(0, 200)
      }

      if (data.label === '[HOT]' || data.label === '[WARM]') {
        leads.value.unshift(data)
        if (leads.value.length > 100) {
          leads.value = leads.value.slice(0, 100)
        }
        if (data.label === '[HOT]') {
          playNotificationSound()
        }
      }
    })

    socket.value.on('stats_update', (data) => {
      stats.value = data
    })

    socket.value.on('crawler_status', (data) => {
      crawlerStatus.value = data
    })

    socket.value.on('viewer_count', (data) => {
      viewerCount.value = data.count
    })

    socket.value.on('auto_reply', (data) => {
      autoReplies.value.unshift(data)
      if (autoReplies.value.length > 50) autoReplies.value = autoReplies.value.slice(0, 50)
      try {
        const { showToast } = useToast()
        showToast(`🤖 Auto Reply → @${data.nickname}: ${data.replyText}`, 'info', 5000)
      } catch { /* silent */ }
    })
  }

  /**
   * Join Socket.io room cho shop cụ thể
   * Khi chuyển shop, comments + leads sẽ được clear
   */
  function joinShop(shopId) {
    currentShopId.value = shopId

    // Clear data khi chuyển shop
    leads.value = []
    allComments.value = []
    stats.value = { hot: 0, warm: 0, cold: 0, total: 0 }
    crawlerStatus.value = { status: 'waiting' }
    viewerCount.value = 0

    if (socket.value && isConnected.value) {
      socket.value.emit('join_shop', { shopId })
    }
  }

  function startMock(shopId, shopName) {
    if (socket.value) {
      socket.value.emit('start_mock', { shopId, shopName })
    }
  }

  function resetStats(shopId) {
    if (socket.value) {
      socket.value.emit('reset_stats', { shopId })
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect()
    }
  })

  return {
    socket,
    isConnected,
    connectionLost,
    leads,
    allComments,
    stats,
    crawlerStatus,
    viewerCount,
    currentShopId,
    autoReplies,
    joinShop,
    startMock,
    resetStats,
  }
}
