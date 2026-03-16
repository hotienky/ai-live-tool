/**
 * Browser Push Notification + Sound Alert composable
 */
import { ref } from 'vue'

const notifPermission = ref(Notification.permission || 'default')
const soundEnabled = ref(localStorage.getItem('sound_enabled') !== 'false')
const notifEnabled = ref(localStorage.getItem('notif_enabled') !== 'false')

// HOT lead sound
let audioCtx = null
function playHotSound() {
  if (!soundEnabled.value) return
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, audioCtx.currentTime)
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1)
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5)
    osc.start(audioCtx.currentTime)
    osc.stop(audioCtx.currentTime + 0.5)
  } catch { /* silent */ }
}

export function useNotifications() {
  async function requestPermission() {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      notifPermission.value = perm
    }
  }

  function notifyHotLead(lead) {
    // Sound
    playHotSound()

    // Browser notification
    if (!notifEnabled.value || notifPermission.value !== 'granted') return
    try {
      const n = new Notification(`HOT Lead: ${lead.nickname}`, {
        body: lead.comment,
        icon: '/favicon.ico',
        tag: `hot-${lead.uniqueId}`,
        requireInteraction: false,
      })
      setTimeout(() => n.close(), 5000)
    } catch { /* silent */ }
  }

  function notifyKeywordMatch(comment, keyword) {
    if (!notifEnabled.value || notifPermission.value !== 'granted') return
    try {
      new Notification(`Keyword "${keyword}" detected`, {
        body: `${comment.nickname}: ${comment.comment}`,
        tag: `kw-${keyword}-${Date.now()}`,
      })
    } catch { /* silent */ }
  }

  function toggleSound() {
    soundEnabled.value = !soundEnabled.value
    localStorage.setItem('sound_enabled', String(soundEnabled.value))
  }

  function toggleNotif() {
    notifEnabled.value = !notifEnabled.value
    localStorage.setItem('notif_enabled', String(notifEnabled.value))
    if (notifEnabled.value && notifPermission.value === 'default') {
      requestPermission()
    }
  }

  return {
    notifPermission,
    soundEnabled,
    notifEnabled,
    requestPermission,
    notifyHotLead,
    notifyKeywordMatch,
    toggleSound,
    toggleNotif,
  }
}
