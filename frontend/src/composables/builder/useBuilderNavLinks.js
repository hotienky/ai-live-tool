import { ref, computed } from 'vue'
import { useNavLinks } from '../../composables/useNavLinks.js'
import { useCmsPages } from '../../composables/useCmsPages.js'

export function useBuilderNavLinks(apiFetch, showToast, t) {
  const { links: navLinksRaw, fetchLinks: fetchNavLinks, createLink: createNavLink, updateLink: updateNavLink, deleteLink: deleteNavLinkApi } = useNavLinks(apiFetch)

  const navLinks = computed(() => (navLinksRaw.value || []).filter(l => l.group === 'menu' || !l.group).sort((a, b) => (a.sort || 0) - (b.sort || 0)))
  const collectionNavLinks = computed(() => (navLinksRaw.value || []).filter(l => l.type === 'collection'))

  const { pages: cmsPageListRaw, fetchPages: fetchCmsPageList } = useCmsPages(apiFetch)
  const cmsPageList = computed(() => (cmsPageListRaw.value || []).filter(p => p.status === 'published' || p.is_published))

  const showNavLinkModal = ref(false)
  const navLinkEditing = ref(null)
  const navLinkForm = ref({ name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: 0, group: 'menu' })
  const pageSelectMode = ref('builtin')

  function openCreateNavLink() {
    navLinkEditing.value = null
    navLinkForm.value = { name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: navLinks.value.length, group: 'menu' }
    pageSelectMode.value = 'builtin'
    showNavLinkModal.value = true
  }

  function openEditNavLink(link) {
    navLinkEditing.value = link.id
    navLinkForm.value = { name: link.name, url: link.url || '', type: link.type, target: link.target || '_self', collectionId: link.collectionId || null, sort: link.sort || 0, group: 'menu' }
    const builtinUrls = ['/', '/products', '/categories', '/brands', '/cart', '/promotions', '/wishlist', '/order-tracking', '/account', '/auth']
    if (builtinUrls.includes(link.url)) pageSelectMode.value = 'builtin'
    else if (link.url?.startsWith('/page/')) pageSelectMode.value = 'cms'
    else pageSelectMode.value = 'custom'
    showNavLinkModal.value = true
  }

  async function saveNavLink() {
    if (!navLinkForm.value.name) { showToast(t('admin.msg_c2d389', 'Nhập tên link'), 'error'); return }
    try {
      if (navLinkEditing.value) {
        await updateNavLink(navLinkEditing.value, navLinkForm.value)
        showToast(t('admin.updated', 'Đã cập nhật'), 'success')
      } else {
        await createNavLink(navLinkForm.value)
        showToast(t('admin.msg_a3e59f', 'Đã tạo link'), 'success')
      }
      showNavLinkModal.value = false
      fetchNavLinks()
    } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
  }

  async function deleteNavLink(link) {
    if (!confirm(`${t('admin.delete', 'Xóa')} link "${link.name}"?`)) return
    await deleteNavLinkApi(link.id)
    fetchNavLinks()
    showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
  }

  return {
    navLinks,
    collectionNavLinks,
    cmsPageList,
    showNavLinkModal,
    navLinkEditing,
    navLinkForm,
    pageSelectMode,
    fetchNavLinks,
    fetchCmsPageList,
    openCreateNavLink,
    openEditNavLink,
    saveNavLink,
    deleteNavLink,
  }
}
