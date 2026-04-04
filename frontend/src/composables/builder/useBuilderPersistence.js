import { ref, nextTick } from 'vue'
import { getDefaultSectionsForPage, getPageSlugFromId } from '../../components/storefront/defaultPageSections.js'

export function useBuilderPersistence(
  {
    sections,
    pages,
    customCss,
    themeConfig,
    globalSettings,
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
          if (meta.globalSettings && typeof meta.globalSettings === 'object') globalSettings.value = meta.globalSettings
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
      globalSettings: globalSettings.value,
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

  // ── Version migration ────────────────────────────────────────────────────
  function migrate_v1_to_v2(parsed) {
    // v1 files have no theme/globalSettings — builder will fall back to current defaults
    // Just normalize the schema identifier and version field
    return {
      ...parsed,
      _schema: 'storefront-layout-template',
      _version: 2,
      version: 2,
    }
  }

  function resolveImportVersion(parsed) {
    const v = parsed.version ?? (parsed._schema === 'storefront-layout-template-v1' ? 1 : undefined)
    if (v === undefined || v === 1) return { data: migrate_v1_to_v2(parsed), migrated: v === 1 }
    if (v > 2) return { data: parsed, migrated: false, tooNew: true }
    return { data: parsed, migrated: false }
  }

  // ── Export: full config template (sections + all meta) ────────────────────
  function exportJson() {
    const slug = activeBuiltinPage.value || activeTemplatePage.value || 'home'
    const fullTemplate = {
      _schema: 'storefront-layout-template',
      _version: 2,
      _exported_at: new Date().toISOString(),
      _page: slug,
      version: 2,
      sections: sections.value,
      ...buildMeta(),
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullTemplate, null, 2))
    const a = document.createElement('a')
    a.setAttribute('href', dataStr)
    a.setAttribute('download', `layout_template_${slug}_${Date.now()}.json`)
    document.body.appendChild(a)
    a.click()
    a.remove()
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
        pushUndo()

        // Legacy: plain array of sections
        if (Array.isArray(parsed)) {
          sections.value = ensureParams(parsed)
          showToast('Nhập JSON sections thành công!', 'success')
          e.target.value = ''
          return
        }

        // Full template format (v1 or v2)
        if (parsed?._schema === 'storefront-layout-template-v1' || parsed?._schema === 'storefront-layout-template' || parsed?.sections) {
          const { data: tpl, migrated, tooNew } = resolveImportVersion(parsed)

          if (tooNew) {
            showToast(`File này được tạo từ phiên bản builder mới hơn (v${parsed.version}). Một số tính năng có thể không được áp dụng.`, 'warning')
          }

          if (Array.isArray(tpl.sections)) sections.value = ensureParams(tpl.sections)
          if (tpl.headerConfig && typeof tpl.headerConfig === 'object')
            headerConfig.value = { ...defaultHeaderConfig, ...tpl.headerConfig }
          if (tpl.footerConfig && typeof tpl.footerConfig === 'object') {
            const fc = tpl.footerConfig
            footerConfig.value = Array.isArray(fc.columns)
              ? { ...JSON.parse(JSON.stringify(defaultFooterConfig)), ...fc, columns: fc.columns, social: fc.social || [], badges: fc.badges || [], paymentMethods: fc.paymentMethods || ['cod', 'bank'] }
              : JSON.parse(JSON.stringify(defaultFooterConfig))
          }
          if (tpl.promoConfig && typeof tpl.promoConfig === 'object')
            promoConfig.value = { ...defaultPromoConfig, ...tpl.promoConfig }
          if (tpl.pages && typeof tpl.pages === 'object') pages.value = tpl.pages
          if (tpl.pageConfigs && typeof tpl.pageConfigs === 'object') {
            pageConfigs.value = {
              products: { ...defaultPageConfigs.products, ...(tpl.pageConfigs.products || {}), showFilters: { ...defaultPageConfigs.products.showFilters, ...(tpl.pageConfigs.products?.showFilters || {}) } },
              productDetail: { ...defaultPageConfigs.productDetail, ...(tpl.pageConfigs.productDetail || {}) },
              checkout: { ...defaultPageConfigs.checkout, ...(tpl.pageConfigs.checkout || {}) },
              auth: { ...defaultPageConfigs.auth, ...(tpl.pageConfigs.auth || {}) },
              account: { ...defaultPageConfigs.account, ...(tpl.pageConfigs.account || {}) },
              blog: { ...defaultPageConfigs.blog, ...(tpl.pageConfigs.blog || {}) },
            }
          }
          if (tpl.customCss && typeof tpl.customCss === 'string') customCss.value = tpl.customCss
          if (tpl.template && typeof tpl.template === 'string') activeTemplate.value = tpl.template
          if (tpl.storefrontUrl && typeof tpl.storefrontUrl === 'string') storefrontUrl.value = tpl.storefrontUrl
          // Support both `themeConfig` (builder export) and `theme` (doc spec alias)
          const importedTheme = tpl.themeConfig ?? tpl.theme
          if (importedTheme && typeof importedTheme === 'object') themeConfig.value = { ...themeConfig.value, ...importedTheme }
          if (tpl.globalSettings && typeof tpl.globalSettings === 'object') globalSettings.value = tpl.globalSettings

          const migratedNote = migrated ? ' (đã migrate từ v1)' : ''
          showToast(`Nhập template JSON thành công${migratedNote}! Nhớ xuất bản để áp dụng.`, 'success')
        } else {
          showToast('File JSON không đúng định dạng. Cần có trường "sections" hoặc "_schema".', 'error')
        }
      } catch {
        showToast('Lỗi đọc file JSON — kiểm tra cú pháp.', 'error')
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
