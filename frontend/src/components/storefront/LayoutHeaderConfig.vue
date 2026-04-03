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
    
    <div class="param-divider"></div>
    <details class="header-extra-section">
      <summary style="display:flex;align-items:center;gap:6px;"><Megaphone :size="14"/> Thanh thông báo (Announcement Bar)</summary>
      <div class="param-row" style="margin-top: 8px;">
        <label>Hiển thị</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" v-model="config.showAnnouncement" />
          <span class="toggle-slider"></span>
        </label>
      </div>
      <template v-if="config.showAnnouncement">
        <div class="param-row">
          <label>Nội dung</label>
          <input type="text" v-model="config.announcementText" class="param-input param-input--wide" placeholder="VD: Freeship mọi đơn hàng từ 500k!" />
        </div>
        <div class="param-row">
          <label>Link (Tùy chọn)</label>
          <input type="text" v-model="config.announcementLink" class="param-input param-input--wide" placeholder="/promotions" />
        </div>
        <div class="footer-colors" style="margin-top: 10px;">
          <div class="footer-color-row">
            <div class="footer-color-item">
              <label>Màu nền</label>
              <div class="footer-color-pick">
                <input type="color" v-model="config.announcementBg" class="param-color" />
                <button v-if="config.announcementBg" @click="config.announcementBg=''" class="btn-clear-color"><X :size="10"/></button>
              </div>
            </div>
            <div class="footer-color-item">
              <label>Màu chữ</label>
              <div class="footer-color-pick">
                <input type="color" v-model="config.announcementColor" class="param-color" />
                <button v-if="config.announcementColor" @click="config.announcementColor=''" class="btn-clear-color"><X :size="10"/></button>
              </div>
            </div>
          </div>
        </div>
      </template>
    </details>
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
        <button class="btn-edit-hl" @click="openEditNavLink(link)" data-tooltip="Sửa"><Pencil :size="12" /></button>
        <button class="btn-remove-item" @click="deleteNavLink(link)" data-tooltip="Xóa"><Trash2 :size="12" /></button>
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
                <option value="/">{{ t('admin.msg_b76bc823', 'Trang chủ') }}</option>
                <option value="/products">{{ t('admin.msg_fa0ad915', 'Sản phẩm') }}</option>
                <option value="/categories">{{ t('admin.msg_03271d9c', 'Danh mục') }}</option>
                <option value="/brands">{{ t('admin.msg_d65682fb', 'Thương hiệu') }}</option>
                <option value="/cart">{{ t('admin.msg_7e22a7c7', 'Giỏ hàng') }}</option>
                <option value="/promotions">{{ t('admin.msg_e396ee81', 'Khuyến mãi') }}</option>
                <option value="/wishlist">{{ t('admin.msg_26cbb569', 'Yêu thích') }}</option>
                <option value="/order-tracking">{{ t('admin.msg_d4c1a27d', 'Theo dõi đơn hàng') }}</option>
                <option value="/account">{{ t('admin.msg_3227aedb', 'Tài khoản') }}</option>
                <option value="/auth">{{ t('admin.msg_64b10bc9', 'Đăng nhập') }}</option>
              </select>
              <select v-else-if="pageSelectMode === 'cms'" v-model="navLinkForm.url" class="page-selector__select">
                <option value="" disabled>{{ t('admin.msg_79d6ff05', '— Chọn trang CMS —') }}</option>
                <option v-for="cp in cmsPageList" :key="cp.id" :value="'/page/' + cp.slug">{{ cp.title }}</option>
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
import { LayoutDashboard, Link, Pencil, Trash2, Plus, X, Save, Megaphone } from 'lucide-vue-next'
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

<style scoped>
.header-extra-section {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin-top: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}
.header-extra-section summary {
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  list-style: none; /* Hide default arrow */
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #1e293b;
}
.header-extra-section summary::-webkit-details-marker {
  display: none;
}
.header-extra-section summary::after {
  content: '▼';
  font-size: 10px;
  color: #94a3b8;
  transition: transform 0.2s;
}
.header-extra-section[open] summary::after {
  transform: rotate(180deg);
}



.footer-colors {
  background: #ffffff;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}
.footer-color-row {
  display: flex;
  gap: 16px;
}
.footer-color-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.footer-color-item label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
}
.footer-color-pick {
  display: flex;
  align-items: center;
  gap: 8px;
}
.param-color {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  cursor: pointer;
  background: none;
  transition: transform 0.2s;
}
.param-color:hover {
  transform: scale(1.05);
}
.btn-clear-color {
  background: #f1f5f9;
  border: none;
  color: #64748b;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-clear-color:hover {
  background: #e2e8f0;
  color: #ef4444;
}

/* Nav Links List */
.header-links-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hl-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  gap: 12px;
  transition: box-shadow 0.2s, border-color 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.02);
}
.hl-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.hl-item__order {
  width: 24px;
  height: 24px;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
}
.hl-item__info {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.hl-item__name {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.hl-item__url {
  font-size: 11px;
  color: #94a3b8;
  font-family: monospace;
}
.hl-badge {
  font-size: 10px;
  background: #e0e7ff;
  color: #4f46e5;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 600;
}
.btn-edit-hl, .btn-remove-item {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}
.btn-edit-hl { color: #64748b; }
.btn-edit-hl:hover { background: #f1f5f9; color: #3b82f6; }
.btn-remove-item { color: #94a3b8; }
.btn-remove-item:hover { background: #fef2f2; color: #ef4444; }

.btn-add-item {
  width: 100%;
  padding: 10px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #3b82f6;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-add-item:hover {
  background: #eff6ff;
  border-color: #93c5fd;
}

.hl-empty {
  text-align: center;
  padding: 24px;
  font-size: 13px;
  color: #94a3b8;
  background: #f8fafc;
  border-radius: 8px;
  border: 1px dashed #e2e8f0;
}

/* Modal Nav Link */
.hl-modal-overlay {
  position: fixed; inset: 0; z-index: 100000;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.hl-modal {
  width: 480px; max-width: 90vw;
  background: #fff; border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
  display: flex; flex-direction: column; overflow: hidden;
  animation: modalIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes modalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.hl-modal__header {
  padding: 16px 20px; border-bottom: 1px solid #e2e8f0;
  display: flex; align-items: center; justify-content: space-between;
}
.hl-modal__header h3 { margin: 0; font-size: 16px; font-weight: 700; color: #1e293b; }
.hl-modal__header button {
  background: none; border: none; color: #64748b; padding: 4px; border-radius: 6px; cursor: pointer; transition: 0.2s;
}
.hl-modal__header button:hover { background: #f1f5f9; color: #ef4444; }
.hl-modal__body { padding: 20px; overflow-y: auto; max-height: 70vh; }
.hl-form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; flex: 1; }
.hl-form-group label { font-size: 12px; font-weight: 600; color: #475569; }
.hl-form-group input, .hl-form-group select {
  padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 14px; color: #1e293b; background: #fff; outline: none; transition: border-color 0.2s;
}
.hl-form-group input:focus, .hl-form-group select:focus { border-color: #6366f1; box-shadow: 0 0 0 2px rgba(99,102,241,0.1); }
.hl-form-row { display: flex; gap: 16px; }

.page-selector { display: flex; gap: 8px; }
.page-selector__mode { width: 140px; }
.page-selector__select, .page-selector__input { flex: 1; }

.hl-modal__footer {
  padding: 16px 20px; border-top: 1px solid #e2e8f0; background: #f8fafc;
  display: flex; justify-content: flex-end; gap: 12px;
}
.btn-cancel-hl {
  padding: 8px 16px; background: transparent; border: 1px solid #cbd5e1; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #475569; cursor: pointer; transition: 0.2s;
}
.btn-cancel-hl:hover { background: #f1f5f9; color: #1e293b; }
.btn-save-hl {
  padding: 8px 20px; background: #6366f1; border: none; border-radius: 8px;
  font-size: 13px; font-weight: 600; color: #fff; cursor: pointer; transition: 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.btn-save-hl:hover { background: #4f46e5; box-shadow: 0 4px 12px rgba(99,102,241,0.2); }
</style>
