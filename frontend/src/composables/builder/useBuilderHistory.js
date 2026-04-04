import { ref, nextTick } from 'vue'

export function useBuilderHistory({ sections, pageConfigs, headerConfig, footerConfig, promoConfig }, showToast) {
  const undoStack = ref([])
  const redoStack = ref([])
  const MAX_UNDO = 30
  let isTrackingHistory = false
  let pushUndoTimer = null

  const historyDropdownOpen = ref(false)

  function getSnapshot() {
    return JSON.stringify({
      sections: sections.value,
      pageConfigs: pageConfigs.value,
      headerConfig: headerConfig.value,
      footerConfig: footerConfig.value,
      promoConfig: promoConfig.value,
    })
  }

  function pushUndo() {
    if (isTrackingHistory) return
    if (pushUndoTimer) clearTimeout(pushUndoTimer)
    pushUndoTimer = setTimeout(() => {
      const item = {
        snap: getSnapshot(),
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        label: 'Thay đổi cấu trúc',
      }
      undoStack.value.push(item)
      if (undoStack.value.length > MAX_UNDO) undoStack.value.shift()
      redoStack.value = []
    }, 250)
  }

  function undo() {
    if (undoStack.value.length <= 1) return
    isTrackingHistory = true
    redoStack.value.push(undoStack.value.pop())
    const item = undoStack.value[undoStack.value.length - 1]
    const snap = JSON.parse(item.snap)

    sections.value = snap.sections || []
    if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
    if (snap.headerConfig) headerConfig.value = snap.headerConfig
    if (snap.footerConfig) footerConfig.value = snap.footerConfig
    if (snap.promoConfig) promoConfig.value = snap.promoConfig

    showToast('Đã hoàn tác (Undo)', 'info')
    nextTick(() => { isTrackingHistory = false })
  }

  function redo() {
    if (redoStack.value.length === 0) return
    isTrackingHistory = true
    const nextItem = redoStack.value.pop()
    undoStack.value.push(nextItem)
    const snap = JSON.parse(nextItem.snap)

    sections.value = snap.sections || []
    if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
    if (snap.headerConfig) headerConfig.value = snap.headerConfig
    if (snap.footerConfig) footerConfig.value = snap.footerConfig
    if (snap.promoConfig) promoConfig.value = snap.promoConfig

    showToast('Đã làm lại (Redo)', 'info')
    nextTick(() => { isTrackingHistory = false })
  }

  function restoreHistory(index) {
    if (index < 0 || index >= undoStack.value.length) return
    isTrackingHistory = true

    while (undoStack.value.length - 1 > index) {
      redoStack.value.push(undoStack.value.pop())
    }

    const item = undoStack.value[index]
    const snap = JSON.parse(item.snap)

    sections.value = snap.sections || []
    if (snap.pageConfigs) pageConfigs.value = snap.pageConfigs
    if (snap.headerConfig) headerConfig.value = snap.headerConfig
    if (snap.footerConfig) footerConfig.value = snap.footerConfig
    if (snap.promoConfig) promoConfig.value = snap.promoConfig

    historyDropdownOpen.value = false
    showToast('Đã khôi phục trạng thái', 'info')
    nextTick(() => { isTrackingHistory = false })
  }

  function handleHistoryFocusout(e) {
    const next = e.relatedTarget
    if (!e.currentTarget.contains(next)) historyDropdownOpen.value = false
  }

  return {
    undoStack,
    redoStack,
    historyDropdownOpen,
    handleHistoryFocusout,
    pushUndo,
    undo,
    redo,
    restoreHistory,
  }
}
