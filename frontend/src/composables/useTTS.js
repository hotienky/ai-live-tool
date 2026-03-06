import { ref } from 'vue'

export function useTTS() {
  const isEnabled = ref(false)
  const isSpeaking = ref(false)
  const queue = ref([])

  // Get Vietnamese voice
  function getViVoice() {
    const voices = window.speechSynthesis?.getVoices() || []
    return (
      voices.find((v) => v.lang.startsWith('vi')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      voices[0]
    )
  }

  // Speak text
  function speak(text) {
    if (!isEnabled.value || !window.speechSynthesis) return
    queue.value.push(text)
    processQueue()
  }

  function processQueue() {
    if (isSpeaking.value || queue.value.length === 0) return

    const text = queue.value.shift()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = getViVoice()
    utterance.rate = 1.1
    utterance.pitch = 1
    utterance.volume = 0.8

    utterance.onstart = () => { isSpeaking.value = true }
    utterance.onend = () => {
      isSpeaking.value = false
      processQueue()
    }
    utterance.onerror = () => {
      isSpeaking.value = false
      processQueue()
    }

    window.speechSynthesis.speak(utterance)
  }

  /**
   * Announce HOT lead
   */
  function announceHotLead(lead) {
    if (!isEnabled.value) return
    const msg = `Khách nóng! ${lead.nickname} nói: ${lead.comment.substring(0, 80)}`
    speak(msg)
  }

  function toggle() {
    isEnabled.value = !isEnabled.value
    if (!isEnabled.value && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      queue.value = []
    }
  }

  // Preload voices
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices()
  }

  return {
    isEnabled,
    isSpeaking,
    toggle,
    speak,
    announceHotLead,
  }
}
