import { ref, nextTick } from 'vue'
import { getDefaultSectionsForPage, getPageSlugFromId } from '../../components/storefront/defaultPageSections.js'

export function useBuilderPersistence(
  {
    sections,
    pages,
    customCss,
    themeConfig,
    pageConfigs,
    headerConfig,
    footerConfig,
    promoConfig,
    activeTemplate,
    activePageId,
    storefrontUrl,
    saving,
  },
  { activeBuiltinPage, activeTemplatePage },
  apiFetch,
  showToast,
  t,
  pushUndo,
  defaultParams,
  defaultPageConfigs,
  defaultHeaderConfig,
  defaultFooterConfig,
  defaultPromoConfig
) {
  const layoutPageId = ref(null)
  const layoutPageVersion = ref(0)
  const layoutPageStatus = ref('draft')
  const showVersionHistory = ref(false)
  const showPublishDialog = ref(false)
  const publishNote = ref('')
  const publishSchedule = ref('')
  const publishNoteInput = ref(null)
  const jsonInputRef = ref(null)

  function ensureParams(secs) {
    return secs.map(s => ({
      ...s,
      params: { ...(defaultParams[s.type] || {}), ...(s.params || {}) },
      content: s.content || [],
    }))
  }

  async function loadLayout() {
    try {
      const isBuiltin = !!activeBuiltinPage.value
      const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'

      if (activePageId.value && !isBuiltin) {
        const res = await apiFetch(`/cms-pages/${activePageId.value}`)
        const data = await res.json()
        sections.value = ensureParams(data.layout_data || [])
        return
      }

      let loadedFromLayoutPages = false
      try {
        const lpRes = await apiFetch('/layout-pages')
        const lpData = await lpRes.json()
        const lpList = lpData.data || []

        const homePage = lpList.find(p => p.slug === 'home')
        if (homePage) {
          const detailRes = await apiFetch(`/layout-pages/${homePage.id}`)
          const detail = await detailRes.json()
          const meta = (detail.data || detail).meta || {}

          if (meta.pages) pages.value = meta.pages
          if (meta.template) activeTemplate.value = meta.template
          if (meta.customCss) customCss.value = meta.customCss
          if (meta.pageConfigs) {
            pageConfigs.value = {
              products: { ...defaultPageConfigs.products, ...meta.pageConfigs.products, showFilters: { ...defaultPageConfigs.products.showFilters, ...(meta.pageConfigs.products?.showFilters || {}) } },
              productDetail: { ...defaultPageConfigs.productDetail, ...meta.pageConfigs.productDetail },
              checkout: { ...defaultPageConfigs.checkout, ...meta.pageConfigs.checkout },
              auth: { ...defaultPageConfigs.auth, ...meta.pageConfigs.auth },
              account: { ...defaultPageConfigs.account, ...meta.pageConfigs.account },
              blog: { ...defaultPageConfigs.blog, ...(meta.pageConfigs.blog || {}) },
            }
          }
          if (meta.headerConfig) headerConfig.value = { ...defaultHeaderConfig, ...meta.headerConfig }
          if (meta.promoConfig) promoConfig.value = { ...defaultPromoConfig, ...meta.promoConfig }
          if (meta.themeConfig) themeConfig.value = { ...themeConfig.value, ...meta.themeConfig }
          if (meta.footerConfig) {
            const fc = meta.footerConfig
            if (typeof fc.columns === 'number' || !Array.isArray(fc.columns)) {
              footerConfig.value = JSON.parse(JSON.stringify(defaultFooterConfig))
              if (fc.copyrightText) footerConfig.value.copyrightText = fc.copyrightText
            } else {
              footerConfig.value = {
                ...JSON.parse(JSON.stringify(defaultFooterConfig)), ...fc,
                columns: fc.columns || defaultFooterConfig.columns.map(c => ({ ...c })),
                social: fc.social || [], badges: fc.badges || [], paymentMethods: fc.paymentMethods || ['cod', 'bank'],
              }
            }
          }
        }

        const targetPage = lpList.find(p => p.slug === slug)
        if (targetPage) {
          const detailRes = await apiFetch(`/layout-pages/${targetPage.id}`)
          const detail = await detailRes.json()
          const page = detail.data || detail
          layoutPageId.value = page.id
          layoutPageVersion.value = page.version || 0
          layoutPageStatus.value = page.status || 'draft'

          let layoutJson = page.layout_json || []

          if (layoutJson.length === 0 && isBuiltin) {
            const pageSlug = getPageSlugFromId(activePageId.value)
            const defaultSecs = getDefaultSectionsForPage(pageSlug)
            if (defaultSecs.length > 0) {
              sections.value = ensureParams(defaultSecs)
            } else {
              sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
            }
          } else {
            sections.value = ensureParams(layoutJson)
          }
          loadedFromLayoutPages = true
        } else if (isBuiltin) {
          layoutPageId.value = null
          const pageSlug = getPageSlugFromId(activePageId.value)
          const defaultSecs = getDefaultSectionsForPage(pageSlug)
          if (defaultSecs.length > 0) {
            sections.value = ensureParams(defaultSecs)
          } else {
            sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
          }
          loadedFromLayoutPages = true
        }
      } catch { /* layout-pages not available, fall back to system-config */ }

      if (loadedFromLayoutPages) return

      const res = await apiFetch('/system-config/group/storefront_layout')
      const data = await res.json()
      const items = Array.isArray(data) ? data : (data.data || [])
      const map = {}
      items.forEach(i => { map[i.key] = i.value })

      const defaultSections = [
        { type: 'banner', enabled: true, order: 0 },
        { type: 'categories', enabled: true, order: 1 },
        { type: 'flash_sale', enabled: true, order: 2 },
        { type: 'featured_products', enabled: true, order: 3 },
        { type: 'new_arrivals', enabled: true, order: 4 },
        { type: 'cms_pages', enabled: true, order: 5 },
      ]
      const defaultPages = { cart: true, account: true, auth: true, order_tracking: true, products: true }

      const parsed = map.layout_sections ? JSON.parse(map.layout_sections) : null

      if (isBuiltin && slug !== 'home') {
        const pageSlug = getPageSlugFromId(activePageId.value) || slug
        const defaultSecs = getDefaultSectionsForPage(pageSlug)
        if (defaultSecs && defaultSecs.length > 0) {
          sections.value = ensureParams(defaultSecs)
        } else {
          sections.value = ensureParams([{ type: 'system_page_content', enabled: true, order: 0, params: { title: '' } }])
        }
      } else {
        sections.value = ensureParams(parsed || defaultSections)
      }

      pages.value = map.layout_pages ? JSON.parse(map.layout_pages) : defaultPages
      activeTemplate.value = map.layout_template || 'full_store'
      customCss.value = map.layout_custom_css || ''
      const parsedPC = map.layout_page_configs ? JSON.parse(map.layout_page_configs) : null
      if (parsedPC) {
        pageConfigs.value = {
          products: { ...defaultPageConfigs.products, ...parsedPC.products, showFilters: { ...defaultPageConfigs.products.showFilters, ...(parsedPC.products?.showFilters || {}) } },
          productDetail: { ...defaultPageConfigs.productDetail, ...parsedPC.productDetail },
          checkout: { ...defaultPageConfigs.checkout, ...parsedPC.checkout },
          auth: { ...defaultPageConfigs.auth, ...parsedPC.auth },
          account: { ...defaultPageConfigs.account, ...parsedPC.account },
        }
      }
      const parsedHC = map.layout_header_config ? JSON.parse(map.layout_header_config) : null
      if (parsedHC) headerConfig.value = { ...defaultHeaderConfig, ...parsedHC }
      const parsedPC2 = map.layout_promo_config ? JSON.parse(map.layout_promo_config) : null
      if (parsedPC2) promoConfig.value = { ...defaultPromoConfig, ...parsedPC2 }
      const parsedFC = map.layout_footer_config ? JSON.parse(map.layout_footer_config) : null
      if (parsedFC) {
        if (typeof parsedFC.columns === 'number' || !Array.isArray(parsedFC.columns)) {
          footerConfig.value = JSON.parse(JSON.stringify(defaultFooterConfig))
          if (parsedFC.copyrightText) footerConfig.value.copyrightText = parsedFC.copyrightText
        } else {
          footerConfig.value = {
            ...JSON.parse(JSON.stringify(defaultFooterConfig)),
            ...parsedFC,
            columns: parsedFC.columns || defaultFooterConfig.columns.map(c => ({ ...c })),
            social: parsedFC.social || [],
            badges: parsedFC.badges || [],
            paymentMethods: parsedFC.paymentMethods || ['cod', 'bank'],
          }
        }
      }
    } catch {
      sections.value = ensureParams([
        { type: 'banner', enabled: true, order: 0 },
        { type: 'categories', enabled: true, order: 1 },
        { type: 'flash_sale', enabled: true, order: 2 },
        { type: 'featured_products', enabled: true, order: 3 },
        { type: 'new_arrivals', enabled: true, order: 4 },
        { type: 'cms_pages', enabled: true, order: 5 },
      ])
      pages.value = { cart: true, account: true, auth: true, order_tracking: true, products: true }
    }
  }

  function buildMeta() {
    return {
      pages: pages.value,
      template: activeTemplate.value,
      customCss: customCss.value,
      storefrontUrl: storefrontUrl.value,
      pageConfigs: pageConfigs.value,
      headerConfig: headerConfig.value,
      footerConfig: footerConfig.value,
      promoConfig: promoConfig.value,
      themeConfig: themeConfig.value,
    }
  }

  async function ensureLayoutPage() {
    if (layoutPageId.value) return layoutPageId.value
    const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'
    try {
      const res = await apiFetch('/layout-pages', {
        method: 'POST',
        body: JSON.stringify({
          slug: slug,
          title: 'Trang ' + slug,
          layout_json: sections.value,
          status: 'draft',
          is_system: true,
          meta: slug === 'home' ? buildMeta() : {},
        }),
      })
      const data = await res.json()
      const page = data.data || data
      layoutPageId.value = page.id
      layoutPageVersion.value = page.version || 0
      layoutPageStatus.value = page.status || 'draft'
      return page.id
    } catch (e) {
      console.warn('[LayoutBuilder] Could not create LayoutPage:', e.message)
      return null
    }
  }

  async function saveLayout() {
    saving.value = true
    const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'
    const isBuiltin = !!activeBuiltinPage.value
    try {
      if (activePageId.value && !activeBuiltinPage.value) {
        await apiFetch(`/cms-pages/${activePageId.value}`, {
          method: 'PUT',
          body: JSON.stringify({ layout_data: sections.value }),
        })
        showToast(t('admin.msg_a593a4', 'Đã lưu bố cục trang CMS'), 'success')
        saving.value = false
        return
      }

      const pageId = await ensureLayoutPage()
      if (pageId) {
        await apiFetch(`/layout-pages/${pageId}/publish`, {
          method: 'POST',
          body: JSON.stringify({
            layout_json: sections.value,
            note: publishNote.value || null,
            scheduled_at: publishSchedule.value || null,
          }),
        })
        if (slug === 'home') {
          await apiFetch(`/layout-pages/${pageId}`, {
            method: 'PUT',
            body: JSON.stringify({ meta: buildMeta() }),
          })
        }
        if (!publishSchedule.value) {
          layoutPageVersion.value++
          layoutPageStatus.value = 'published'
          showToast(t('admin.msg_32ac40', 'Đã xuất bản bố cục Cửa Hàng') + ` (v${layoutPageVersion.value})`, 'success')
        } else {
          showToast('Đã lên lịch xuất bản vào lúc ' + publishSchedule.value, 'success')
        }
        publishNote.value = ''
        publishSchedule.value = ''
      } else {
        const itemsToSave = [
          { key: 'layout_pages', value: JSON.stringify(pages.value) },
          { key: 'layout_template', value: activeTemplate.value },
          { key: 'layout_custom_css', value: customCss.value },
          { key: 'layout_page_configs', value: JSON.stringify(pageConfigs.value) },
          { key: 'layout_header_config', value: JSON.stringify(headerConfig.value) },
          { key: 'layout_footer_config', value: JSON.stringify(footerConfig.value) },
          { key: 'layout_promo_config', value: JSON.stringify(promoConfig.value) },
          { key: 'layout_theme_config', value: JSON.stringify(themeConfig.value) },
          { key: 'storefront_url', value: storefrontUrl.value },
        ]

        if (!isBuiltin || slug === 'home') {
          itemsToSave.push({ key: 'layout_sections', value: JSON.stringify(sections.value) })
        }

        await apiFetch('/system-config/group/storefront_layout', {
          method: 'PUT',
          body: JSON.stringify({ items: itemsToSave }),
        })
        showToast(t('admin.msg_32ac40', 'Đã xuất bản bố cục Cửa Hàng'), 'success')
      }
    } catch (e) {
      showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu: ' + e.message, 'error')
    }
    saving.value = false
  }

  function handlePublish() {
    showPublishDialog.value = true
    publishNote.value = ''
    nextTick(() => publishNoteInput.value?.focus())
  }

  function confirmPublish() {
    showPublishDialog.value = false
    saveLayout()
  }

  async function saveDraft() {
    saving.value = true
    try {
      if (activePageId.value && !activeBuiltinPage.value) {
        await apiFetch(`/cms-pages/${activePageId.value}`, {
          method: 'PUT',
          body: JSON.stringify({ layout_data: sections.value }),
        })
        showToast(t('admin.msg_d1cb5f', 'Đã lưu nháp bố cục trang CMS'), 'success')
        saving.value = false
        return
      }

      const pageId = await ensureLayoutPage()
      if (pageId) {
        await apiFetch(`/layout-pages/${pageId}/draft`, {
          method: 'POST',
          body: JSON.stringify({ layout_json: sections.value }),
        })
        await apiFetch(`/layout-pages/${pageId}`, {
          method: 'PUT',
          body: JSON.stringify({ meta: buildMeta() }),
        })
        layoutPageStatus.value = 'draft'
        showToast(t('admin.msg_b06844', 'Đã lưu nháp'), 'success')
      } else {
        await apiFetch('/system-config/group/storefront_layout', {
          method: 'PUT',
          body: JSON.stringify({
            items: [
              { key: 'layout_draft_sections', value: JSON.stringify(sections.value) },
              { key: 'layout_draft_page_configs', value: JSON.stringify(pageConfigs.value) },
              { key: 'layout_draft_header_config', value: JSON.stringify(headerConfig.value) },
              { key: 'layout_draft_footer_config', value: JSON.stringify(footerConfig.value) },
              { key: 'layout_draft_promo_config', value: JSON.stringify(promoConfig.value) },
              { key: 'layout_draft_theme_config', value: JSON.stringify(themeConfig.value) },
            ],
          }),
        })
        showToast(t('admin.msg_b06844', 'Đã lưu nháp'), 'success')
      }
    } catch (e) {
      showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' lưu nháp: ' + e.message, 'error')
    }
    saving.value = false
  }

  async function onRollback() {
    await loadLayout()
  }

  function exportJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sections.value, null, 2))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", `storefront_sections_${activePageId.value || 'home'}.json`)
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  function triggerJsonImport() {
    if (jsonInputRef.value) jsonInputRef.value.click()
  }

  function onJsonImportFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result)
        if (Array.isArray(parsed)) {
          pushUndo()
          sections.value = parsed
          showToast('Nhập JSON Layout thành công!', 'success')
        } else {
          showToast('Định dạng file không hợp lệ (cần mảng array).', 'error')
        }
      } catch {
        showToast('Lỗi đọc file JSON.', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return {
    layoutPageId,
    layoutPageVersion,
    layoutPageStatus,
    showVersionHistory,
    showPublishDialog,
    publishNote,
    publishSchedule,
    publishNoteInput,
    jsonInputRef,
    ensureParams,
    loadLayout,
    buildMeta,
    ensureLayoutPage,
    saveLayout,
    saveDraft,
    handlePublish,
    confirmPublish,
    onRollback,
    exportJson,
    triggerJsonImport,
    onJsonImportFile,
  }
}
