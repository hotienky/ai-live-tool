<template>
  <div class="lb-section" v-show="!activePageId">
    <h4 class="lb-section__title"><LayoutDashboard :size="14" /> {{ t('admin.msg_2e55ee70', 'Cấu hình Header') }}</h4>
    <div class="param-row">
      <label>{{ t('admin.msg_d719bccf', 'Vị trí logo') }}</label>
      <select v-model="config.logoPosition" class="param-select">
        <option value="left">{{ t('admin.msg_b61cc9c7', 'Trái') }}</option>
        <option value="center">{{ t('admin.msg_129af9c7', 'Giữa') }}</option>
      </select>
    </div>
    <div class="param-row">
      <label>Max nav links</label>
      <input type="range" v-model.number="config.maxNavLinks" min="3" max="10" class="param-range" />
      <span class="param-value">{{ config.maxNavLinks }}</span>
    </div>
    <div class="param-row">
      <label>{{ t('admin.msg_1b3cae87', 'Hiện Search') }}</label>
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
    <h4 class="lb-section__title"><Link :size="14" /> {{ t('admin.msg_3b414f3e', 'Menu điều hướng Header') }}</h4>
    <p class="lb-section__hint">{{ t('admin.msg_b49c25b2', 'Quản lý các liên kết hiển thị trên thanh điều hướng chính.') }}</p>
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
      <div v-if="!navLinks.length" class="hl-empty">{{ t('admin.msg_6f5a17e0', 'Chưa có link nào. Thêm link bên dưới.') }}</div>
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
          <h3>{{ navLinkEditing ? t('admin.msg_5cd8b1e3', 'Chỉnh sửa liên kết') : t('admin.msg_fcf3aa73', 'Thêm liên kết') }}</h3>
          <button @click="showNavLinkModal = false"><X :size="16" /></button>
        </div>
        <div class="hl-modal__body">
          <LanguageTabs v-model="currentLang" style="margin-bottom: 20px" :translations="navLinkForm.translations" :fields="['name']" :baseData="navLinkForm" />
          <div class="hl-form-group">
            <label>{{ t('admin.msg_6cccad8f', 'Tên hiển thị') }} <span style="color:#ef4444">*</span></label>
            <input v-model="navLinkForm.name" :placeholder="t('admin.msg_92db95', 'VD: Trang chủ, Sản phẩm...')" />
          </div>
          <div class="hl-form-group">
            <label>{{ t('admin.msg_e81c94dc', 'Đường dẫn') }}</label>
            <div class="page-selector">
              <select v-model="pageSelectMode" class="page-selector__mode">
                <option value="builtin">{{ t('admin.msg_523d051f', 'Trang có sẵn') }}</option>
                <option value="cms">Trang CMS</option>
                <option value="custom">{{ t('admin.msg_5874029a', 'Nhập tùy chỉnh') }}</option>
              </select>
              <select v-if="pageSelectMode === 'builtin'" v-model="navLinkForm.url" class="page-selector__select">
                <option value="/">{{ t('admin.msg_b76bc823', '🏠 Trang chủ') }}</option>
                <option value="/products">{{ t('admin.msg_fa0ad915', '🛍️ Sản phẩm') }}</option>
                <option value="/categories">{{ t('admin.msg_03271d9c', '📂 Danh mục') }}</option>
                <option value="/brands">{{ t('admin.msg_d65682fb', '🏷️ Thương hiệu') }}</option>
                <option value="/cart">{{ t('admin.msg_7e22a7c7', '🛒 Giỏ hàng') }}</option>
                <option value="/promotions">{{ t('admin.msg_e396ee81', '🎁 Khuyến mãi') }}</option>
                <option value="/wishlist">{{ t('admin.msg_26cbb569', '❤️ Yêu thích') }}</option>
                <option value="/order-tracking">{{ t('admin.msg_d4c1a27d', '📦 Theo dõi đơn hàng') }}</option>
                <option value="/account">{{ t('admin.msg_3227aedb', '👤 Tài khoản') }}</option>
                <option value="/auth">{{ t('admin.msg_64b10bc9', '🔐 Đăng nhập') }}</option>
              </select>
              <select v-else-if="pageSelectMode === 'cms'" v-model="navLinkForm.url" class="page-selector__select">
                <option value="" disabled>{{ t('admin.msg_79d6ff05', '— Chọn trang CMS —') }}</option>
                <option v-for="cp in cmsPageList" :key="cp.id" :value="'/page/' + cp.slug">📄 {{ cp.title }}</option>
              </select>
              <input v-else v-model="navLinkForm.url" class="page-selector__input" :placeholder="t('admin.msg_d910f3', '/custom-url hoặc https://...')" />
            </div>
          </div>
          <div class="hl-form-row">
            <div class="hl-form-group">
              <label>{{ t('admin.msg_37b1db11', 'Kiểu') }}</label>
              <select v-model="navLinkForm.type">
                <option value="single">{{ t('admin.msg_32b09a9c', 'Link đơn') }}</option>
                <option value="collection">Dropdown</option>
              </select>
            </div>
            <div class="hl-form-group">
              <label>{{ t('admin.msg_df6e28e4', 'Mở trong') }}</label>
              <select v-model="navLinkForm.target">
                <option value="_self">{{ t('admin.msg_160b89ab', 'Cùng tab') }}</option>
                <option value="_blank">{{ t('admin.msg_18ae60d3', 'Tab mới ↗') }}</option>
              </select>
            </div>
          </div>
          <div class="hl-form-group" v-if="navLinkForm.type === 'single'">
            <label>{{ t('admin.msg_962ff100', 'Thuộc dropdown') }}</label>
            <select v-model="navLinkForm.collectionId">
              <option :value="null">{{ t('admin.msg_940a4799', '— Không —') }}</option>
              <option v-for="cl in collectionNavLinks" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
            </select>
          </div>
          <div class="hl-form-group">
            <label>{{ t('admin.msg_3e4f6b98', 'Thứ tự') }}</label>
            <input type="number" v-model.number="navLinkForm.sort" />
          </div>
        </div>
        <div class="hl-modal__footer">
          <button class="btn-cancel-hl" @click="showNavLinkModal = false">{{ t('admin.msg_1e405035', 'Hủy') }}</button>
          <button class="btn-save-hl" @click="saveNavLink"><Save :size="14" /> {{ navLinkEditing ? t('admin.msg_3b7db4b6', 'Cập nhật') : t('admin.msg_808b9546', 'Tạo') }}</button>
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
import { useI18n } from '../../composables/useI18n.js'
import LanguageTabs from '../LanguageTabs.vue'
import { useLanguages } from '../../composables/useLanguages.js'

const { t } = useI18n()

const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const currentLang = ref(defaultLangCode.value)

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
const navLinkForm = ref({ name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: 0, group: 'menu', translations: {} })
const pageSelectMode = ref('builtin')

// CMS pages
const { pages: cmsPageListRaw, fetchPages: fetchCmsPageList } = useCmsPages(apiFetch)
const cmsPageList = computed(() => (cmsPageListRaw.value || []).filter(p => p.status === 'published' || p.is_published))

function openCreateNavLink() {
  navLinkEditing.value = null
  navLinkForm.value = { name: '', url: '/', type: 'single', target: '_self', collectionId: null, sort: navLinks.value.length, group: 'menu', translations: {} }
  pageSelectMode.value = 'builtin'
  currentLang.value = defaultLangCode.value
  showNavLinkModal.value = true
}
function openEditNavLink(link) {
  navLinkEditing.value = link.id
  navLinkForm.value = { name: link.name, url: link.url || '', type: link.type, target: link.target || '_self', collectionId: link.collectionId || null, sort: link.sort || 0, group: 'menu', translations: link.translations ? JSON.parse(JSON.stringify(link.translations)) : {} }
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
      showToast(t('admin.msg_c0c3aa', 'Đã cập nhật'), 'success')
    } else {
      await createNavLink(navLinkForm.value)
      showToast(t('admin.msg_a3e59f', 'Đã tạo link'), 'success')
    }
    showNavLinkModal.value = false
    fetchNavLinks()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
async function deleteNavLink(link) {
  if (!confirm(`Xóa link "${link.name}"?`)) return
  await deleteNavLinkApi(link.id)
  fetchNavLinks()
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
}

onMounted(() => { fetchNavLinks(); fetchCmsPageList() })
</script>
