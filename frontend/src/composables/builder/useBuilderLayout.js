import { ref, computed, watch } from 'vue'
import { useLanguages } from '../useLanguages.js'

export function useBuilderLayout(
  { sections, pages, customCss, themeConfig, headerConfig, footerConfig, promoConfig, pageConfigs, activeTemplate, activePageId, storefrontUrl, dynamicPages },
  { activeBuiltinPage },
  pushUndo,
  t
) {
  // ─── Footer preview style ───
  const footerPreviewStyle = computed(() => {
    const s = {}
    if (footerConfig.value.bgColor) s.background = footerConfig.value.bgColor
    return s
  })

  // ─── Payment methods list ───
  const allPaymentMethods = [
    { code: 'cod', label: 'COD' },
    { code: 'bank', label: 'Bank Transfer' },
    { code: 'visa', label: 'VISA' },
    { code: 'mastercard', label: 'Mastercard' },
    { code: 'jcb', label: 'JCB' },
    { code: 'momo', label: 'MoMo' },
    { code: 'zalopay', label: 'ZaloPay' },
    { code: 'vnpay', label: 'VNPay' },
    { code: 'napas', label: 'Napas' },
    { code: 'applepay', label: 'Apple Pay' },
  ]

  function addFooterCol() {
    footerConfig.value.columns.push({ title: '', type: 'links', links: [], items: [], content: '' })
  }
  function removeFooterCol(idx) {
    footerConfig.value.columns.splice(idx, 1)
  }

  // Footer column drag-drop
  const footerDragIdx = ref(-1)
  const footerDragOverIdx = ref(-1)
  const footerItemDrag = ref(null)

  function onFooterDragStart(e, idx) {
    footerDragIdx.value = idx
    e.dataTransfer.effectAllowed = 'move'
  }
  function onFooterDragEnd() {
    footerDragIdx.value = -1
    footerDragOverIdx.value = -1
  }
  function onFooterDragOver(e, idx) {
    footerDragOverIdx.value = idx
  }
  function onFooterDrop(idx) {
    const from = footerDragIdx.value
    if (from < 0 || from === idx) { onFooterDragEnd(); return }
    const cols = footerConfig.value.columns
    const [moved] = cols.splice(from, 1)
    cols.splice(idx, 0, moved)
    onFooterDragEnd()
  }
  function onFooterItemDrop(ci, targetLi) {
    const src = footerItemDrag.value
    if (!src || src.ci !== ci || src.li === targetLi) { footerItemDrag.value = null; return }
    const arr = footerConfig.value.columns[ci].links
    const [moved] = arr.splice(src.li, 1)
    arr.splice(targetLi, 0, moved)
    footerItemDrag.value = null
  }
  function onFooterContactDrop(ci, targetIi) {
    const src = footerItemDrag.value
    if (!src || src.ci !== ci || src.ii === targetIi) { footerItemDrag.value = null; return }
    const arr = footerConfig.value.columns[ci].items
    const [moved] = arr.splice(src.ii, 1)
    arr.splice(targetIi, 0, moved)
    footerItemDrag.value = null
  }

  // ─── Current page background ───
  const currentPageBg = computed({
    get() {
      if (!activePageId.value) return ''
      const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
      return pageConfigs.value[id]?.backgroundColor || ''
    },
    set(val) {
      if (!activePageId.value) return
      const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
      if (!pageConfigs.value[id]) pageConfigs.value[id] = {}
      pageConfigs.value[id].backgroundColor = val
      pageConfigs.value = { ...pageConfigs.value }
    }
  })

  // ─── Builtin Page i18n ───
  const { defaultLangCode: dfLangCode, loadLanguages: loadLangs2 } = useLanguages()
  loadLangs2()
  const builtinPageLang = ref(dfLangCode.value)

  function getPageConfigI18n(pageName, field) {
    if (builtinPageLang.value === dfLangCode.value) return pageConfigs.value[pageName]?.[field] || ''
    const tObj = pageConfigs.value[pageName]?.translations?.[builtinPageLang.value]
    return tObj?.[field] || ''
  }
  function setPageConfigI18n(pageName, field, value) {
    if (builtinPageLang.value === dfLangCode.value) {
      if (pageConfigs.value[pageName]) pageConfigs.value[pageName][field] = value
      return
    }
    if (!pageConfigs.value[pageName].translations) pageConfigs.value[pageName].translations = {}
    if (!pageConfigs.value[pageName].translations[builtinPageLang.value]) {
      pageConfigs.value[pageName].translations[builtinPageLang.value] = { pageTitle: '', pageDescription: '' }
    }
    pageConfigs.value[pageName].translations[builtinPageLang.value][field] = value
  }

  // ─── Live Preview base URL ───
  const livePreviewBaseUrl = computed(() => {
    if (!storefrontUrl.value) return ''
    let path = ''
    if (activePageId.value) {
      if (String(activePageId.value).startsWith('__')) {
         const mapped = {
           '__products': '/products',
           '__productDetail': '/product/preview-demo',
           '__checkout': '/checkout',
           '__cart': '/cart',
           '__auth': '/auth',
           '__account': '/account',
           '__wishlist': '/wishlist',
           '__order_tracking': '/order-tracking',
           '__blog': '/blog',
           '__template_product_card': '/_builder/template-preview?type=card',
           '__template_blog_card': '/_builder/template-preview?type=card',
         }
         path = mapped[activePageId.value] || ''
      } else {
         const dyn = dynamicPages.value.find(p => p.id === activePageId.value)
         path = dyn?.alias ? `/page/${dyn.alias}` : ''
      }
    }
    return `${storefrontUrl.value}${path}?preview=true`
  })

  // ─── Layout payload (postMessage to iframe) ───
  const layoutPayload = ref({
    sections: [], pages: {}, customCss: '', template: 'full_store',
    pageConfigs: {}, headerConfig: {}, footerConfig: {},
  })

  // Debounced preview refresh + undo
  let undoTimer
  watch([sections, pages, customCss, themeConfig, headerConfig, footerConfig, pageConfigs, promoConfig, activeTemplate, activePageId], () => {
    const tCfg = themeConfig.value

    let currentBg = tCfg.backgroundColor || '#ffffff'
    if (activePageId.value) {
      const id = String(activePageId.value).startsWith('__') ? activePageId.value.slice(2) : activePageId.value
      if (pageConfigs.value[id]?.backgroundColor) {
        currentBg = pageConfigs.value[id].backgroundColor
      }
    }

    const accentHex = tCfg.primaryColor || '#6366f1'
    const rr = parseInt(accentHex.slice(1, 3), 16) || 99
    const gg = parseInt(accentHex.slice(3, 5), 16) || 102
    const bb = parseInt(accentHex.slice(5, 7), 16) || 241
    const themeCss = `:root {
  --sf-accent: ${accentHex};
  --sf-accent-light: ${tCfg.accentColor || accentHex};
  --sf-accent-glow: rgba(${rr}, ${gg}, ${bb}, 0.15);
  --sf-accent-gradient: linear-gradient(135deg, ${accentHex}, ${tCfg.accentColor || accentHex});
  --sf-shadow-accent: 0 8px 24px rgba(${rr}, ${gg}, ${bb}, 0.25);
  --sf-bg-primary: ${currentBg};
  --sf-text-primary: ${tCfg.textColor};
  --color-bg-primary: ${currentBg};
  --color-text-primary: ${tCfg.textColor};
  --sf-font-family: ${tCfg.fontFamily};
  --sf-radius: ${tCfg.borderRadius};
  --sf-radius-sm: ${parseInt(tCfg.borderRadius) > 4 ? (parseInt(tCfg.borderRadius) - 4) + 'px' : tCfg.borderRadius};
  --sf-radius-md: ${tCfg.borderRadius};
  --sf-radius-lg: ${parseInt(tCfg.borderRadius) + 4}px;
  --sf-radius-xl: ${parseInt(tCfg.borderRadius) + 8}px;
  --sf-button-radius: ${tCfg.borderRadius};
  --sf-container-width: ${tCfg.containerWidth || '1200px'};
  --sf-button-style: ${tCfg.buttonStyle || 'solid'};
}
body { background: ${currentBg}; color: ${tCfg.textColor}; font-family: ${tCfg.fontFamily}; }
.sf-container { max-width: var(--sf-container-width); margin: 0 auto; padding: 0 16px; }`

    layoutPayload.value = JSON.parse(JSON.stringify({
      sections: sections.value,
      pages: pages.value,
      customCss: themeCss + '\n' + (customCss.value || ''),
      template: activeTemplate.value,
      pageConfigs: pageConfigs.value,
      headerConfig: headerConfig.value,
      footerConfig: footerConfig.value,
      promoConfig: promoConfig.value,
      themeConfig: tCfg // Fix: Missing themeConfig was preventing live colors/fonts updates
    }))

    clearTimeout(undoTimer)
    undoTimer = setTimeout(() => pushUndo(), 1500)
  }, { deep: true, immediate: true })

  return {
    allPaymentMethods,
    addFooterCol,
    removeFooterCol,
    footerDragIdx,
    footerDragOverIdx,
    footerItemDrag,
    onFooterDragStart,
    onFooterDragEnd,
    onFooterDragOver,
    onFooterDrop,
    onFooterItemDrop,
    onFooterContactDrop,
    currentPageBg,
    builtinPageLang,
    getPageConfigI18n,
    setPageConfigI18n,
    livePreviewBaseUrl,
    layoutPayload,
    footerPreviewStyle,
  }
}
