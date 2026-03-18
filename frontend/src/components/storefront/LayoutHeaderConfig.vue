<template>
  <div class="lb-section" v-show="!activePageId">
    <h4 class="lb-section__title"><LayoutDashboard :size="14" /> Cấu hình Header</h4>
    <div class="param-row">
      <label>Vị trí logo</label>
      <select v-model="config.logoPosition" class="param-select">
        <option value="left">Trái</option>
        <option value="center">Giữa</option>
      </select>
    </div>
    <div class="param-row">
      <label>Max nav links</label>
      <input type="range" v-model.number="config.maxNavLinks" min="3" max="10" class="param-range" />
      <span class="param-value">{{ config.maxNavLinks }}</span>
    </div>
    <div class="param-row">
      <label>Hiện Search</label>
      <label class="toggle-switch toggle-switch--sm" @click.stop>
        <input type="checkbox" v-model="config.showSearch" />
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div class="param-row">
      <label>Sticky</label>
      <label class="toggle-switch toggle-switch--sm" @click.stop>
        <input type="checkbox" v-model="config.sticky" />
        <span class="toggle-slider"></span>
      </label>
    </div>
    <div class="param-row">
      <label>Theme toggle</label>
      <label class="toggle-switch toggle-switch--sm" @click.stop>
        <input type="checkbox" v-model="config.showThemeToggle" />
        <span class="toggle-slider"></span>
      </label>
    </div>
  </div>

  <!-- Header Navigation Links -->
  <div class="lb-section lb-section--header-links" v-show="!activePageId">
    <h4 class="lb-section__title"><Link :size="14" /> Menu điều hướng Header</h4>
    <p class="lb-section__hint">Quản lý các liên kết hiển thị trên thanh điều hướng chính.</p>
    <div class="header-links-list">
      <div v-for="(link, idx) in navLinks" :key="link.id" class="hl-item">
        <span class="hl-item__order">{{ idx + 1 }}</span>
        <div class="hl-item__info">
          <span class="hl-item__name">{{ link.name }}</span>
          <span class="hl-item__url">{{ link.url || '#' }}</span>
        </div>
        <span v-if="link.type === 'collection'" class="hl-badge">Dropdown</span>
        <button class="btn-edit-hl" @click="openEditNavLink(link)" title="Sửa"><Pencil :size="12" /></button>
        <button class="btn-remove-item" @click="deleteNavLink(link)" title="Xóa"><Trash2 :size="12" /></button>
      </div>
      <div v-if="!navLinks.length" class="hl-empty">Chưa có link nào. Thêm link bên dưới.</div>
    </div>
    <button class="btn-add-item" style="margin-top:8px" @click="openCreateNavLink">
      <Plus :size="12" /> Thêm link Header
    </button>
  </div>

  <!-- Nav Link Modal -->
  <Teleport to="body">
    <div v-if="showNavLinkModal" class="hl-modal-overlay" @click.self="showNavLinkModal = false">
      <div class="hl-modal">
        <div class="hl-modal__header">
          <h3>{{ navLinkEditing ? 'Chỉnh sửa liên kết' : 'Thêm liên kết' }}</h3>
          <button @click="showNavLinkModal = false"><X :size="16" /></button>
        </div>
        <div class="hl-modal__body">
          <div class="hl-form-group">
            <label>Tên hiển thị <span style="color:#ef4444">*</span></label>
            <input v-model="navLinkForm.name" placeholder="VD: Trang chủ, Sản phẩm..." />
          </div>
          <div class="hl-form-group">
            <label>Đường dẫn</label>
            <div class="page-selector">
              <select v-model="pageSelectMode" class="page-selector__mode">
                <option value="builtin">Trang có sẵn</option>
                <option value="cms">Trang CMS</option>
                <option value="custom">Nhập tùy chỉnh</option>
              </select>
              <select v-if="pageSelectMode === 'builtin'" v-model="navLinkForm.url" class="page-selector__select">
                <option value="/">🏠 Trang chủ</option>
                <option value="/products">🛍️ Sản phẩm</option>
                <option value="/categories">📂 Danh mục</option>
                <option value="/brands">🏷️ Thương hiệu</option>
                <option value="/cart">🛒 Giỏ hàng</option>
                <option value="/promotions">🎁 Khuyến mãi</option>
                <option value="/wishlist">❤️ Yêu thích</option>
                <option value="/order-tracking">📦 Theo dõi đơn hàng</option>
                <option value="/account">👤 Tài khoản</option>
                <option value="/auth">🔐 Đăng nhập</option>
              </select>
              <select v-else-if="pageSelectMode === 'cms'" v-model="navLinkForm.url" class="page-selector__select">
                <option value="" disabled>— Chọn trang CMS —</option>
                <option v-for="cp in cmsPageList" :key="cp.id" :value="'/page/' + cp.slug">📄 {{ cp.title }}</option>
              </select>
              <input v-else v-model="navLinkForm.url" class="page-selector__input" placeholder="/custom-url hoặc https://..." />
            </div>
          </div>
          <div class="hl-form-row">
            <div class="hl-form-group">
              <label>Kiểu</label>
              <select v-model="navLinkForm.type">
                <option value="single">Link đơn</option>
                <option value="collection">Dropdown</option>
              </select>
            </div>
            <div class="hl-form-group">
              <label>Mở trong</label>
              <select v-model="navLinkForm.target">
                <option value="_self">Cùng tab</option>
                <option value="_blank">Tab mới ↗</option>
              </select>
            </div>
          </div>
          <div class="hl-form-group" v-if="navLinkForm.type === 'single'">
            <label>Thuộc dropdown</label>
            <select v-model="navLinkForm.collectionId">
              <option :value="null">— Không —</option>
              <option v-for="cl in collectionNavLinks" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
            </select>
          </div>
          <div class="hl-form-group">
            <label>Thứ tự</label>
            <input type="number" v-model.number="navLinkForm.sort" />
          </div>
        </div>
        <div class="hl-modal__footer">
          <button class="btn-cancel-hl" @click="showNavLinkModal = false">Hủy</button>
          <button class="btn-save-hl" @click="saveNavLink"><Save :size="14" /> {{ navLinkEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LayoutDashboard, Link, Pencil, Trash2, Plus, X, Save } from 'lucide-vue-next'
import { apiFetch } from '../../composables/useApi.js'
import { useNavLinks } from '../../composables/useNavLinks.js'
import { useCmsPages } from '../../composables/useCmsPages.js'
import { useToast } from '../../composables/useToast.js'

const props = defineProps({
  headerConfig: { type: Object, required: true },
  activePageId: { default: null },
})
const emit = defineEmits(['update:headerConfig'])

const { showToast } = useToast()
const config = computed({
  get: () => props.headerConfig,
  set: v => emit('update:headerConfig', v),
})

// Nav Links
const { links: navLinksRaw, fetchLinks: fetchNavLinks, createLink: createNavLink, updateLink: updateNavLink, deleteLink: deleteNavLinkApi } = useNavLinks(apiFetch)
const navLinks = computed(() => (navLinksRaw.value || []).filter(l => l.group === 'menu' || !l.group).sort((a, b) => (a.sort || 0) - (b.sort || 0)))
const collectionNavLinks = computed(() => (navLinksRaw.value || []).filter(l => l.type === 'collection'))

const showNavLinkModal = ref(false)
const navLinkEditing = ref(null)
const navLinkForm = ref({ name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: 0, group: 'menu' })
const pageSelectMode = ref('builtin')

// CMS pages
const { pages: cmsPageListRaw, fetchPages: fetchCmsPageList } = useCmsPages(apiFetch)
const cmsPageList = computed(() => (cmsPageListRaw.value || []).filter(p => p.status === 'published' || p.is_published))

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
  if (!navLinkForm.value.name) { showToast('Nhập tên link', 'error'); return }
  try {
    if (navLinkEditing.value) {
      await updateNavLink(navLinkEditing.value, navLinkForm.value)
      showToast('Đã cập nhật', 'success')
    } else {
      await createNavLink(navLinkForm.value)
      showToast('Đã tạo link', 'success')
    }
    showNavLinkModal.value = false
    fetchNavLinks()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function deleteNavLink(link) {
  if (!confirm(`Xóa link "${link.name}"?`)) return
  await deleteNavLinkApi(link.id)
  fetchNavLinks()
  showToast('Đã xóa', 'success')
}

onMounted(() => { fetchNavLinks(); fetchCmsPageList() })
</script>
