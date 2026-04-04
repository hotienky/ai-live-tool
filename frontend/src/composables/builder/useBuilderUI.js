import { ref, computed, inject, onMounted, onBeforeUnmount } from 'vue'
import {
  Focus, Maximize, Smartphone, Monitor, Save,
  Image, Tag, Zap, FileText, Type, Images, Film, Star, HelpCircle, Mail, Share2,
  ShieldCheck, Award, LayoutGrid, Box, FolderOpen, ShoppingBag, Sparkles, FileEdit,
  UtensilsCrossed, CalendarDays, Flower2, Building2, PartyPopper
} from 'lucide-vue-next'
import { getAllSectionsWithAvailability } from '../../components/storefront/sectionSchemas.js'

export function useBuilderUI(
  { leftCollapsed, isFullscreen, activeConfig, previewWidth, isXRayMode, showCommandPalette, previewPanelRef },
  { undo, redo, handlePublish }
) {
  function toggleZenMode() {
    if (leftCollapsed.value) {
      leftCollapsed.value = false
    } else {
      leftCollapsed.value = true
    }
  }

  function toggleXRay() {
    isXRayMode.value = !isXRayMode.value
    if (previewPanelRef.value) {
      previewPanelRef.value.postMessageToIframe('toggle-xray', isXRayMode.value)
    }
  }

  const builderCommands = computed(() => {
    return [
      { id: 'zen', title: 'Chế độ Tập trung (Zen Mode)', description: 'Ẩn toàn bộ thanh công cụ để ngắm canvas', shortcut: 'F', icon: Focus, action: toggleZenMode },
      { id: 'fs', title: 'Toàn màn hình', description: 'Mở rộng Builder lấp đầy màn hình', shortcut: 'Esc', icon: Maximize, action: () => isFullscreen.value = true },
      { id: 'mobile', title: 'Xem trước trên Mobile', description: 'Thu hẹp khung nhìn xuống 375px', icon: Smartphone, action: () => previewWidth.value = '375px' },
      { id: 'desktop', title: 'Xem trước trên Desktop', description: 'Mở rộng khung nhìn lên 100%', icon: Monitor, action: () => previewWidth.value = '100%' },
      { id: 'save', title: 'Xuất bản (Publish)', description: 'Lưu thay đổi lên Live', shortcut: 'Ctrl+S', icon: Save, action: handlePublish },
    ]
  })

  function executeCommand(cmd) {
    if (typeof cmd.action === 'function') {
      cmd.action()
    }
  }

  function handleGlobalKeydown(e) {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) || e.target.isContentEditable) return

    if (e.key === 'Escape') {
      if (isFullscreen.value) isFullscreen.value = false
      if (activeConfig.value) activeConfig.value = null
    }

    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      toggleZenMode()
    }

    if ((e.key === 'x' || e.key === 'X') && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      toggleXRay()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      showCommandPalette.value = !showCommandPalette.value
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      handlePublish()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
      if (e.shiftKey) redo()
      else undo()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault()
      redo()
    }
  }

  onMounted(() => { window.addEventListener('keydown', handleGlobalKeydown) })
  onBeforeUnmount(() => { window.removeEventListener('keydown', handleGlobalKeydown) })

  // ── Module awareness for section availability ──
  const _injectedModules = inject('installedModules', ref([]))
  const installedModules = computed(() => {
    const v = _injectedModules.value
    return Array.isArray(v) ? v : []
  })

  // ── Dynamic library items grouped by category ──
  const allLibrarySections = computed(() => getAllSectionsWithAvailability(installedModules.value))
  const groupedLibraryItems = computed(() => {
    const groups = {}
    for (const item of allLibrarySections.value) {
      const cat = item.category || 'Khác'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(item)
    }
    return groups
  })

  // ── Icon name → component map for library cards ──
  const sectionIconMap = {
    Image, Tag, Zap, FileText, Type, Images, Film, Star, HelpCircle, Mail, Share2,
    ShieldCheck, Award, LayoutGrid, Box, FolderOpen, ShoppingBag, Sparkles, FileEdit,
    UtensilsCrossed, CalendarDays, Flower2, Building2, PartyPopper
  }

  return {
    toggleZenMode,
    toggleXRay,
    builderCommands,
    executeCommand,
    installedModules,
    groupedLibraryItems,
    sectionIconMap,
  }
}
