import { ref, nextTick } from 'vue'

export function useBuilderPreview(
  { sections, activeSections, activeConfig, expandedSection, promoOpen, previewPanelRef, headerConfig, footerConfig },
  pushUndo,
  showToast,
  sectionMeta,
  t
) {
  const addSectionAtInsertIndex = ref(null)
  const globalImagePicker = ref(null)
  const globalImagePickerTarget = ref(null)

  function onPreviewSectionSelected({ type, index, id }) {
    if (id === '__promo' || type === 'promo-bar') {
      promoOpen.value = true
      activeConfig.value = 'promo'
      return
    }
    if (id === '__header' || type === 'header') {
      activeConfig.value = 'header'
      return
    }
    if (id === '__footer' || type === 'footer') {
      activeConfig.value = 'footer'
      return
    }

    let section = null
    if (index !== undefined && index >= 0) {
      section = activeSections.value[index]
    }
    if (!section) {
      section = sections.value.find(s => s.id === id || s.type === type)
    }

    if (section) {
      activeConfig.value = section.id || section.type
      expandedSection.value = section.id || section.type
      nextTick(() => {
        const el = document.querySelector(`[data-section-panel="${section.type}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    }
  }

  function onPreviewSectionHover({ type }) {
    // Optional: highlight the section in the left panel
  }

  function onPreviewSectionReorder({ fromIndex, toIndex }) {
    const fromSec = activeSections.value[fromIndex]
    const toSec = activeSections.value[toIndex]
    if (!fromSec || !toSec) return

    const realFrom = sections.value.indexOf(fromSec)
    const realTo = sections.value.indexOf(toSec)

    if (realFrom === -1 || realTo === -1) return

    pushUndo()
    const list = [...sections.value]
    const [moved] = list.splice(realFrom, 1)
    list.splice(realTo, 0, moved)
    list.forEach((s, i) => { s.order = i })
    sections.value = list
    showToast(t('admin.msg_reorder_ok', 'Đã di chuyển section'), 'success')
  }

  function onPreviewInlineEdit({ type, field, value }) {
    const section = sections.value.find(s => s.type === type)
    if (section && section.params) {
      section.params[field] = value
      showToast(`✏️ ${field}: "${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`, 'success')
    }
  }

  function onPreviewSectionDelete({ type, index }) {
    if (!confirm(`Xóa section "${sectionMeta[type]?.label || type}"?`)) return
    pushUndo()
    const idx = sections.value.findIndex(s => s.type === type)
    if (idx >= 0) {
      sections.value.splice(idx, 1)
      sections.value.forEach((s, i) => { s.order = i })
      expandedSection.value = null
      showToast(t('admin.msg_section_deleted', 'Đã xóa section'), 'success')
    }
  }

  function onPreviewSectionToggle({ type }) {
    const section = sections.value.find(s => s.type === type)
    if (section) {
      section.enabled = !section.enabled
      showToast(section.enabled ? 'Đã bật section' : 'Đã tắt section', 'success')
    }
  }

  function onPreviewAddSectionAt({ index }) {
    addSectionAtInsertIndex.value = index
    activeConfig.value = 'library'
  }

  function onPreviewOpenConfig(payload) {
    const { type, index, targetObj } = payload || {}

    if (type === 'header') activeConfig.value = 'header'
    else if (type === 'footer') activeConfig.value = 'footer'
    else if (type === 'promo') activeConfig.value = 'promo'
    else if (type === 'promo-bar') activeConfig.value = 'promo'
    else if (type === 'section' && targetObj && targetObj.id) {
      activeConfig.value = targetObj.id
    } else if (index !== undefined && sections.value[index]) {
      const sectionId = sections.value[index].id
      activeConfig.value = sectionId || sections.value[index].type
    }
  }

  function onPreviewEditImage(payload) {
    globalImagePickerTarget.value = payload
    if (globalImagePicker.value) {
      globalImagePicker.value.openPicker()
    }
  }

  function onGlobalImagePicked(newUrl) {
    const target = globalImagePickerTarget.value
    if (!target || !newUrl) return
    const { type, index, key, itemIndex } = target

    if (type === 'header') {
      headerConfig.value[key] = newUrl
    } else if (type === 'footer') {
      footerConfig.value[key] = newUrl
    } else {
      const sec = sections.value[index]
      if (!sec) return
      const segments = key.split('.')

      if (!sec.i18n) Object.assign(sec, { i18n: {} })
      const lang = window.localStorage.getItem('sf_admin_lang') || 'vi'
      if (!sec.i18n[lang]) sec.i18n[lang] = JSON.parse(JSON.stringify(sec.params || {}))

      if (segments[0] === 'content' && typeof itemIndex === 'number') {
        if (!sec.i18n[lang].content) sec.i18n[lang].content = []
        const contentList = sec.i18n[lang].content
        if (contentList[itemIndex]) {
          contentList[itemIndex][segments[1]] = newUrl
        }
      } else {
        sec.i18n[lang][key] = newUrl
      }
    }
    showToast(t('admin.msg_image_updated', 'Đã thay ảnh trực tiếp thành công!'), 'success')
    globalImagePickerTarget.value = null
  }

  function handleNavigatorSelect(typeOrId) {
    expandedSection.value = typeOrId
    const activeIdx = activeSections.value.findIndex(s => s.type === typeOrId)
    if (activeIdx !== -1 && previewPanelRef.value) {
      previewPanelRef.value.selectSection(activeIdx)
    }
  }

  return {
    addSectionAtInsertIndex,
    globalImagePicker,
    globalImagePickerTarget,
    onPreviewSectionSelected,
    onPreviewSectionHover,
    onPreviewSectionReorder,
    onPreviewInlineEdit,
    onPreviewSectionDelete,
    onPreviewSectionToggle,
    onPreviewAddSectionAt,
    onPreviewOpenConfig,
    onPreviewEditImage,
    onGlobalImagePicked,
    handleNavigatorSelect,
  }
}
