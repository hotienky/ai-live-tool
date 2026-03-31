import { reactive, ref, readonly, computed } from 'vue'

/**
 * Global State Context cho Visual Builder Editor
 * Dùng thiết kế Singleton composable để chia sẻ state giữa Sidebar, Canvas và Panel.
 */
const state = reactive({
  // Danh sách các sections (blocks) trên layout hiện tại
  sections: [],
  
  // Thông tin Layout Page nếu có (như meta, status, version)
  pageMeta: {},
  
  // Section đang được chọn (focus) để hiển thị Style Panel / Config
  activeSectionId: null, // ID hoặc Type tuỳ theo kiến trúc data (nên dùng ID UUID)
  
  // Mảng Breadcrumb của các section lồng nhau (Nested selection)
  sectionBreadcrumb: [],

  // Breakpoint đang preview (desktop, tablet, mobile)
  activeBreakpoint: 'desktop', // desktop (100%), tablet (768px), mobile (375px)

  // Ngôn ngữ đang chỉnh sửa nếu Builder có tích hợp i18n bên ngoài truyền vào
  locale: 'vi',
  defaultLocale: 'vi'
})

// === System Flags ===
const isEditing = ref(false)
const isPreviewing = ref(false) // Toggle wireframe/live

// === Undo / Redo Stack ===
const MAX_HISTORY = 30
const historyStack = ref([])
const redoStack = ref([])
let _isTimeTraveling = false

/**
 * Push snapshot vào history
 */
export function pushHistorySnapshot() {
  if (_isTimeTraveling) return
  // Deep clone state.sections vội vã, cân nhắc lodash.cloneDeep hoặc JSON
  const snapshot = JSON.stringify(state.sections)
  
  const last = historyStack.value[historyStack.value.length - 1]
  if (last === snapshot) return // Same as before

  historyStack.value.push(snapshot)
  if (historyStack.value.length > MAX_HISTORY) {
    historyStack.value.shift()
  }
  // Clear redo stack upon new action
  redoStack.value = []
}

export function undo() {
  if (historyStack.value.length <= 1) return
  _isTimeTraveling = true
  const current = historyStack.value.pop()
  redoStack.value.push(current)

  const previous = historyStack.value[historyStack.value.length - 1]
  state.sections = JSON.parse(previous)
  _isTimeTraveling = false
}

export function redo() {
  if (redoStack.value.length === 0) return
  _isTimeTraveling = true
  const next = redoStack.value.pop()
  historyStack.value.push(next)
  state.sections = JSON.parse(next)
  _isTimeTraveling = false
}

export const canUndo = computed(() => historyStack.value.length > 1)
export const canRedo = computed(() => redoStack.value.length > 0)

// === Selection Hooks ===

export function selectSection(sectionId, breadcrumb = []) {
  state.activeSectionId = sectionId
  state.sectionBreadcrumb = breadcrumb
}

export function clearSelection() {
  state.activeSectionId = null
  state.sectionBreadcrumb = []
}

export function setActiveBreakpoint(device) {
  state.activeBreakpoint = device
}

export function loadLayoutFromData(sectionsData) {
  _isTimeTraveling = true
  // Reset stacks when loading new page
  historyStack.value = []
  redoStack.value = []
  
  state.sections = JSON.parse(JSON.stringify(sectionsData || []))
  
  // First state push
  historyStack.value.push(JSON.stringify(state.sections))
  clearSelection()
  _isTimeTraveling = false
}

export function useBuilderState() {
  return {
    state: readonly(state),
    draftState: state, // For direct mutation where v-model is needed
    isEditing,
    isPreviewing,
    
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistorySnapshot,
    
    selectSection,
    clearSelection,
    setActiveBreakpoint,
    loadLayoutFromData
  }
}
