import { ref } from 'vue'
import { apiFetch } from '../../composables/useApi.js'

export function useBuilderSections(
  { sections, expandedSection, activeConfig, addSectionAtInsertIndex, activeTemplate },
  showToast,
  defaultParams,
  sectionMeta,
  t,
  pushUndo,
  industryTemplates
) {
  const dragIndex = ref(null)
  const dragOverIndex = ref(null)
  const showLibrary = ref(false)
  const allCategories = ref([])
  const showBlockEditorFor = ref(null)

  const showAiPanel = ref(false)
  const aiPrompt = ref('')
  const aiLoading = ref(false)

  function addLibrarySection(lib) {
    if (sections.value.some(s => s.type === lib.type)) {
      showToast(t('admin.msg_7dfff8', 'Section đã tồn tại'), 'error')
      return
    }
    const newSection = {
      type: lib.type,
      enabled: true,
      order: sections.value.length,
      params: { ...defaultParams[lib.type] },
      content: [],
    }

    const insertIdx = addSectionAtInsertIndex.value
    if (insertIdx !== null && insertIdx >= 0 && insertIdx <= sections.value.length) {
      sections.value.splice(insertIdx, 0, newSection)
      sections.value.forEach((s, i) => { s.order = i })
      addSectionAtInsertIndex.value = null
    } else {
      sections.value.push(newSection)
    }

    showLibrary.value = false
    expandedSection.value = lib.type
    activeConfig.value = lib.type
  }

  function applyTemplate(key) {
    activeTemplate.value = key
    const preset = industryTemplates[key]
    if (preset) {
      if (confirm('Áp dụng mẫu này sẽ ghi đè toàn bộ bố cục trang chủ hiện tại. Bạn có chắc chắn muốn tiếp tục?')) {
        pushUndo()
        sections.value = JSON.parse(JSON.stringify(preset))
        showToast('Đã áp dụng mẫu bố cục thành công', 'success')
      }
    }
  }

  function addContentItem(section, defaultItem) {
    if (!section.content) section.content = []
    section.content.push({ ...defaultItem })
  }

  function removeContentItem(section, index) {
    section.content.splice(index, 1)
  }

  function toggleCategoryId(section, catId) {
    if (!section.params.selectedCategoryIds) section.params.selectedCategoryIds = []
    const idx = section.params.selectedCategoryIds.indexOf(catId)
    if (idx >= 0) section.params.selectedCategoryIds.splice(idx, 1)
    else section.params.selectedCategoryIds.push(catId)
  }

  async function loadCategories() {
    try {
      const res = await apiFetch('/categories')
      const data = await res.json()
      allCategories.value = Array.isArray(data) ? data : (data.data || [])
    } catch { allCategories.value = [] }
  }

  function onDragStart(e, idx) {
    dragIndex.value = idx
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }

  function onDragEnd() { dragIndex.value = null; dragOverIndex.value = null }

  function onDragOver(e) { e.dataTransfer.dropEffect = 'move' }

  function onDragEnter(idx) {
    if (dragIndex.value !== null && dragIndex.value !== idx) dragOverIndex.value = idx
  }

  function onDragLeave(idx) {
    if (dragOverIndex.value === idx) dragOverIndex.value = null
  }

  function onDrop(targetIdx) {
    const fromIdx = dragIndex.value
    dragOverIndex.value = null
    dragIndex.value = null
    if (fromIdx === null || fromIdx === targetIdx) return
    const list = [...sections.value]
    const [moved] = list.splice(fromIdx, 1)
    list.splice(targetIdx, 0, moved)
    list.forEach((s, i) => { s.order = i })
    sections.value = list
  }

  function toggleExpand(type) {
    expandedSection.value = expandedSection.value === type ? null : type
  }

  async function generateLayout() {
    if (!aiPrompt.value.trim()) return
    aiLoading.value = true
    try {
      const res = await apiFetch('/ai/generate', {
        method: 'POST',
        body: JSON.stringify({ type: 'layout', prompt: aiPrompt.value }),
      })
      const data = await res.json()
      if (!data.success) { showToast(data.message || 'AI chưa cấu hình', 'error'); return }

      const raw = (data.data?.content || '').replace(/```json\n?|```\n?/g, '').trim()
      let generated
      try { generated = JSON.parse(raw) } catch { showToast('AI trả về định dạng không hợp lệ', 'error'); return }
      if (!Array.isArray(generated)) { showToast('Kết quả không phải JSON array', 'error'); return }

      pushUndo()
      const base = sections.value.length
      const newSections = generated.map((s, i) => ({
        type: s.type || 'text_block',
        enabled: s.enabled !== false,
        order: base + i,
        params: { ...(defaultParams[s.type] || {}), ...(s.params || {}) },
        content: s.content ?? [],
      })).filter(s => sectionMeta[s.type])

      sections.value = [...sections.value, ...newSections]
      aiPrompt.value = ''
      showAiPanel.value = false
      showToast(`✨ Đã tạo ${newSections.length} section từ AI`, 'success')
    } catch (e) {
      showToast('Lỗi AI: ' + e.message, 'error')
    } finally {
      aiLoading.value = false
    }
  }

  return {
    dragIndex,
    dragOverIndex,
    showLibrary,
    allCategories,
    showBlockEditorFor,
    showAiPanel,
    aiPrompt,
    aiLoading,
    addLibrarySection,
    applyTemplate,
    addContentItem,
    removeContentItem,
    toggleCategoryId,
    loadCategories,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    toggleExpand,
    generateLayout,
  }
}
