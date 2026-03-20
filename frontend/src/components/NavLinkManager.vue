<template>
  <div class="nav-mgr">
    <!-- Page Title -->
    <div class="nm-page-title">
      <h3><component :is="icons.Navigation" :size="18" /> {{ t('admin.msg_5544c51e', 'Điều hướng') }}</h3>
      <p>{{ t('admin.msg_3572d423', 'Quản lý Header Menu và Footer cho storefront của bạn.') }}</p>
    </div>

    <!-- Tabs: Header / Footer -->
    <div class="nm-tabs">
      <button class="nm-tab" :class="{ active: activeTab === 'header' }" @click="activeTab = 'header'">
        <component :is="icons.LayoutGrid" :size="14" />
        Header Menu
        <span class="nm-tab__count">{{ menuGroupLinks.length }}</span>
      </button>
      <button class="nm-tab" :class="{ active: activeTab === 'footer' }" @click="activeTab = 'footer'">
        <component :is="icons.PanelBottom" :size="14" />
        Footer
        <span class="nm-tab__count">{{ currentFooter.columns.length }} {{ t('admin.msg_f801f808', 'cột') }}</span>
      </button>
    </div>

    <!-- ═══════════ TAB: HEADER ═══════════ -->
    <div v-if="activeTab === 'header'" class="nm-panel">
      <div class="nm-section__header">
        <div class="nm-section__info">
          <h4>📍 Header Menu</h4>
          <p class="nm-hint">Hiển thị trên thanh điều hướng chính. Tối đa 5 link hiển thị trực tiếp, còn lại nằm trong menu "Thêm".</p>
        </div>
        <button class="btn-add" @click="openCreate('menu')">
          <component :is="icons.Plus" :size="14" /> {{ t('admin.msg_e5618ddc', 'Thêm link') }}
        </button>
      </div>

      <!-- Link list -->
      <div class="nm-list" v-if="menuGroupLinks.length">
        <div v-for="(link, idx) in menuGroupLinks" :key="link.id" class="nm-item">
          <div class="nm-item__left">
            <span class="nm-item__order">{{ idx + 1 }}</span>
            <span v-if="link.icon && icons[link.icon]" class="nm-item__icon">
              <component :is="icons[link.icon]" :size="16" />
            </span>
            <div class="nm-item__info">
              <span class="nm-item__name">{{ link.name }}</span>
              <span class="nm-item__url">{{ link.url || '#' }}</span>
            </div>
            <span v-if="link.type === 'collection'" class="nm-badge">Dropdown</span>
            <span v-if="link.target === '_blank'" class="nm-badge nm-badge--ext">
              <component :is="icons.ExternalLink" :size="10" /> {{ t('admin.msg_13d4017f', 'Tab mới') }}
            </span>
          </div>
          <div class="nm-item__actions">
            <button class="nm-action nm-action--edit" @click="openEdit(link)" :title="t('admin.msg_e1504e01', 'Chỉnh sửa')" >
              <component :is="icons.Pencil" :size="13" />{{ t('admin.msg_9026a724', 'Sửa') }}</button>
            <button class="nm-action nm-action--delete" @click="handleDelete(link)" :title="t('admin.delete', 'Xóa')">
              <component :is="icons.Trash2" :size="13" />
            </button>
          </div>
          <div v-if="link.children && link.children.length" class="nm-children">
            <div v-for="child in link.children" :key="child.id" class="nm-child">
              <div class="nm-child__left">
                <span class="nm-child__indent">↳</span>
                <span v-if="child.icon && icons[child.icon]" class="nm-item__icon nm-item__icon--sm">
                  <component :is="icons[child.icon]" :size="14" />
                </span>
                <div class="nm-item__info">
                  <span class="nm-item__name">{{ child.name }}</span>
                  <span class="nm-item__url">{{ child.url || '#' }}</span>
                </div>
              </div>
              <div class="nm-item__actions">
                <button class="nm-action nm-action--edit" @click="openEdit(child)"><component :is="icons.Pencil" :size="12" /> {{ t('admin.edit', 'Sửa') }}</button>
                <button class="nm-action nm-action--delete" @click="handleDelete(child)"><component :is="icons.Trash2" :size="12" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="nm-empty">
        <component :is="icons.Link" :size="28" />
        <p>{{ t('admin.msg_ce37bea8', 'Chưa có link nào trong Header Menu') }}</p>
        <button class="btn-add btn-add--ghost" @click="openCreate('menu')">
          <component :is="icons.Plus" :size="14" /> {{ t('admin.msg_4328a171', 'Thêm link Header') }}
        </button>
      </div>
    </div>

    <!-- ═══════════ TAB: FOOTER ═══════════ -->
    <div v-if="activeTab === 'footer'" class="nm-panel">
      <div class="nm-section__header">
        <div class="nm-section__info">
          <h4>{{ t('admin.msg_4956c7bb', '📎 Cấu hình Footer') }}</h4>
          <p class="nm-hint">{{ t('admin.msg_0019a4a0', 'Kéo thả để sắp xếp thứ tự các cột. Footer hiển thị ở cuối trang storefront.') }}</p>
        </div>
        <button class="btn-save-footer" @click="saveFooter" :disabled="savingFooter">
          <component :is="icons.Save" :size="14" />
          {{ savingFooter ? t('admin.saving', 'Đang lưu...') : t('admin.msg_ac36d344', 'Lưu Footer') }}
        </button>
      </div>
      
      <LanguageTabs v-model="currentLang" style="margin-bottom: 20px" />

      <!-- Footer Columns -->
      <div class="footer-builder">
        <div
          v-for="(col, ci) in currentFooter.columns"
          :key="'fc-' + ci"
          class="footer-col-card"
          :class="{ 'footer-col-card--dragging': footerDragIdx === ci, 'footer-col-card--drag-over': footerDragOverIdx === ci && footerDragIdx !== ci }"
          draggable="true"
          @dragstart="onFooterDragStart($event, ci)"
          @dragend="onFooterDragEnd"
          @dragover.prevent="onFooterDragOver($event, ci)"
          @dragenter.prevent="footerDragOverIdx = ci"
          @dragleave="footerDragOverIdx = -1"
          @drop.prevent="onFooterDrop(ci)"
        >
          <div class="footer-col-card__header">
            <div class="footer-col-card__label">
              <component :is="icons.GripVertical" :size="12" class="footer-col-card__grip" />
              <span class="footer-col-card__num">{{ t('admin.msg_20ec6f82', 'Cột') }} {{ ci + 1 }}</span>
            </div>
            <button class="btn-remove-item" @click="removeFooterCol(ci)" :title="t('admin.msg_7344b3f4', 'Xóa cột')">
              <component :is="icons.Trash2" :size="12" />
            </button>
          </div>
          <input v-model="col.title" class="ft-input ft-input--wide"
            :placeholder="t('admin.footer_col_title', 'Tiêu đề cột') + ' ' + (ci + 1)" />

          <div class="ft-param-row">
            <label>{{ t('admin.msg_b6451e4f', 'Loại nội dung') }}</label>
            <select v-model="col.type" class="ft-select">
              <option value="links">🔗 Links</option>
              <option value="contact">{{ t('admin.msg_e281954b', '📞 Liên hệ') }}</option>
              <option value="text">{{ t('admin.msg_5d783e26', '📝 Nội dung tự do') }}</option>
            </select>
          </div>

          <!-- Links Type -->
          <template v-if="col.type === 'links'">
            <div v-for="(link, li) in col.links" :key="li" class="footer-link-row"
              draggable="true"
              @dragstart.stop="footerItemDrag = { ci, li }; $event.dataTransfer.effectAllowed = 'move'"
              @dragover.prevent.stop
              @drop.prevent.stop="onFooterItemDrop(ci, li)"
            >
              <component :is="icons.GripVertical" :size="10" class="footer-link-row__grip" />
              <input v-model="link.label" class="ft-input" :placeholder="t('admin.msg_ed5d37', 'Nhãn')" />
              <input v-model="link.url" class="ft-input" placeholder="/page/gioi-thieu" />
              <button class="btn-remove-item" @click="col.links.splice(li, 1)"><component :is="icons.X" :size="10" /></button>
            </div>
            <button class="btn-add-item" @click="col.links.push({ label: '', url: '' })">
              <component :is="icons.Plus" :size="12" /> {{ t('admin.msg_e5618ddc', 'Thêm link') }}
            </button>
          </template>

          <!-- Contact Type -->
          <template v-if="col.type === 'contact'">
            <div v-for="(item, ii) in col.items" :key="ii" class="footer-link-row"
              draggable="true"
              @dragstart.stop="footerItemDrag = { ci, ii }; $event.dataTransfer.effectAllowed = 'move'"
              @dragover.prevent.stop
              @drop.prevent.stop="onFooterContactDrop(ci, ii)"
            >
              <component :is="icons.GripVertical" :size="10" class="footer-link-row__grip" />
              <select v-model="item.icon" class="ft-select ft-select--sm">
                <option value="phone">{{ t('admin.msg_f8c3838a', '📞 SĐT') }}</option>
                <option value="email">📧 Email</option>
                <option value="address">{{ t('admin.msg_2696d719', '📍 Địa chỉ') }}</option>
                <option value="clock">{{ t('admin.msg_d291a43e', '🕐 Giờ') }}</option>
                <option value="text">{{ t('admin.msg_075c2f8b', '💬 Ghi chú') }}</option>
              </select>
              <input v-model="item.label" class="ft-input" :placeholder="t('admin.msg_ed5d37', 'Nhãn')" />
              <input v-model="item.value" class="ft-input" :placeholder="t('admin.msg_1fc558', 'Giá trị')" />
              <button class="btn-remove-item" @click="col.items.splice(ii, 1)"><component :is="icons.X" :size="10" /></button>
            </div>
            <button class="btn-add-item" @click="col.items.push({ icon: 'phone', label: '', value: '' })">
              <component :is="icons.Plus" :size="12" /> {{ t('admin.msg_a332db0a', 'Thêm dòng') }}
            </button>
          </template>

          <!-- Text Type -->
          <template v-if="col.type === 'text'">
            <textarea v-model="col.content" class="ft-input ft-input--wide ft-textarea" rows="4" :placeholder="t('admin.msg_fb5760', 'Nội dung HTML tùy ý...')"></textarea>
          </template>
        </div>

        <button class="btn-add-col" @click="addFooterCol">
          <component :is="icons.Plus" :size="14" /> Thêm cột (hiện có {{ currentFooter.columns.length }} {{ t('admin.msg_f801f808', 'cột') }})
        </button>
      </div>

      <!-- Social Links -->
      <details class="ft-details" open>
        <summary>{{ t('admin.msg_d9fce95a', '🌐 Mạng xã hội') }}</summary>
        <div v-for="(s, si) in currentFooter.social" :key="si" class="footer-link-row">
          <select v-model="s.platform" class="ft-select ft-select--sm">
            <option value="facebook">Facebook</option>
            <option value="instagram">Instagram</option>
            <option value="youtube">YouTube</option>
            <option value="tiktok">TikTok</option>
            <option value="zalo">Zalo</option>
            <option value="twitter">Twitter/X</option>
            <option value="shopee">Shopee</option>
            <option value="lazada">Lazada</option>
          </select>
          <input v-model="s.url" class="ft-input ft-input--wide" placeholder="URL" />
          <button class="btn-remove-item" @click="currentFooter.social.splice(si, 1)"><component :is="icons.X" :size="10" /></button>
        </div>
        <button class="btn-add-item" @click="currentFooter.social.push({ platform: 'facebook', url: '' })">
          <component :is="icons.Plus" :size="12" /> {{ t('admin.msg_d9cb420e', 'Thêm') }}
        </button>
      </details>

      <!-- Payment Methods -->
      <details class="ft-details">
        <summary>{{ t('admin.msg_cb525e58', '💳 Phương thức thanh toán') }}</summary>
        <div class="footer-badges-grid">
          <label v-for="pm in allPaymentMethods" :key="pm.code" class="footer-badge-check">
            <input type="checkbox" :value="pm.code" v-model="currentFooter.paymentMethods" />
            <span>{{ pm.label }}</span>
          </label>
        </div>
      </details>

      <!-- Badges -->
      <details class="ft-details">
        <summary>{{ t('admin.msg_21b4fe91', '🏅 Chứng nhận / Badge') }}</summary>
        <div v-for="(b, bi) in currentFooter.badges" :key="bi" class="footer-link-row">
          <input v-model="b.label" class="ft-input" :placeholder="t('admin.msg_2aa8ef', 'Tên')" />
          <MediaPicker v-model="b.imageUrl" :placeholder="t('admin.msg_2204d8', 'Chọn hoặc nhập URL hình ảnh...')" accept="image/*" />
          <input v-model="b.url" class="ft-input" placeholder="Link" />
          <button class="btn-remove-item" @click="currentFooter.badges.splice(bi, 1)"><component :is="icons.X" :size="10" /></button>
        </div>
        <button class="btn-add-item" @click="currentFooter.badges.push({ label: '', imageUrl: '', url: '' })">
          <component :is="icons.Plus" :size="12" /> {{ t('admin.msg_3022302f', 'Thêm badge') }}
        </button>
      </details>

      <!-- Legal & Copyright -->
      <details class="ft-details">
        <summary>{{ t('admin.msg_9a94c383', '📋 Thông tin pháp lý') }}</summary>
        <textarea v-model="currentFooter.legalText" class="ft-input ft-input--wide ft-textarea" rows="3"
          :placeholder="t('admin.msg_40e8f5', 'VD: Công Ty TNHH ABC\nTrụ sở: 123 Đường A, Quận B, TP.HCM\nMST: 0123456789')"></textarea>
        <div class="ft-param-row" style="margin-top:8px">
          <label>Copyright</label>
          <input type="text" v-model="currentFooter.copyrightText" class="ft-input ft-input--wide" placeholder="© 2026 Shop Name" />
        </div>
      </details>

      <!-- Footer Colors -->
      <div class="footer-colors">
        <h5>{{ t('admin.msg_712a71f0', '🎨 Màu sắc Footer') }}</h5>
        <div class="footer-color-row">
          <div class="footer-color-item">
            <label>{{ t('admin.msg_8821399e', 'Nền') }}</label>
            <div class="footer-color-pick">
              <input type="color" v-model="currentFooter.bgColor" class="ft-color" />
              <button v-if="currentFooter.bgColor" class="btn-remove-item" @click="currentFooter.bgColor = ''"><component :is="icons.X" :size="10" /></button>
            </div>
          </div>
          <div class="footer-color-item">
            <label>{{ t('admin.title', 'Tiêu đề') }}</label>
            <div class="footer-color-pick">
              <input type="color" v-model="currentFooter.headingColor" class="ft-color" />
              <button v-if="currentFooter.headingColor" class="btn-remove-item" @click="currentFooter.headingColor = ''"><component :is="icons.X" :size="10" /></button>
            </div>
          </div>
          <div class="footer-color-item">
            <label>{{ t('admin.msg_aa2ec9a5', 'Chữ') }}</label>
            <div class="footer-color-pick">
              <input type="color" v-model="currentFooter.textColor" class="ft-color" />
              <button v-if="currentFooter.textColor" class="btn-remove-item" @click="currentFooter.textColor = ''"><component :is="icons.X" :size="10" /></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Preview -->
      <div class="ft-preview">
        <h5>{{ t('admin.msg_caa072ec', '👁 Xem trước Footer') }}</h5>
        <div class="pv-footer" :style="footerPreviewStyle">
          <div class="pv-footer__cols">
            <div v-for="(col, ci) in currentFooter.columns" :key="ci" class="pv-footer__col">
              <div class="pv-footer__col-title" :style="currentFooter.headingColor ? { color: currentFooter.headingColor } : {}">{{ col.title || t('admin.msg_20ec6f82', 'Cột ') + (ci + 1) }}</div>
              <template v-if="col.type === 'links'">
                <div v-for="(link, li) in col.links" :key="li" class="pv-footer__link" :style="currentFooter.textColor ? { color: currentFooter.textColor } : {}">{{ link.label || '—' }}</div>
              </template>
              <template v-else-if="col.type === 'contact'">
                <div v-for="(item, ii) in col.items" :key="ii" class="pv-footer__contact" :style="currentFooter.textColor ? { color: currentFooter.textColor } : {}">
                  <span>{{ { phone:'📞', email:'📧', address:'📍', clock:'🕐', text:'💬' }[item.icon] || '•' }}</span>
                  {{ item.value || item.label || '—' }}
                </div>
              </template>
              <template v-else>
                <div class="pv-footer__text" :style="currentFooter.textColor ? { color: currentFooter.textColor } : {}">{{ col.content ? '(HTML)' : '—' }}</div>
              </template>
            </div>
          </div>
          <div v-if="currentFooter.social?.length" class="pv-footer__social">
            <span v-for="s in currentFooter.social" :key="s.platform" class="pv-footer__social-icon">{{ { facebook:'f', instagram:'ig', youtube:'yt', tiktok:'tt', zalo:'z', twitter:'x' }[s.platform] || '?' }}</span>
          </div>
          <div v-if="currentFooter.copyrightText" class="pv-footer__copyright" :style="currentFooter.textColor ? { color: currentFooter.textColor, opacity: 0.6 } : {}">{{ currentFooter.copyrightText }}</div>
        </div>
      </div>
    </div>

    <!-- ═══════════ LINK MODAL ═══════════ -->
    <Teleport to="body">
      <div class="nm-modal-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="nm-modal">
          <div class="nm-modal__header">
            <h3>{{ isEditing ? t('admin.msg_5cd8b1e3', 'Chỉnh sửa liên kết') : t('admin.msg_e8c48573', 'Thêm liên kết mới') }}</h3>
            <button class="nm-modal__close" @click="showModal = false"><component :is="icons.X" :size="16" /></button>
          </div>
          <div class="nm-modal__body">
            <LanguageTabs v-model="currentLang" style="margin-bottom: 20px" :translations="form.translations" :fields="['name', 'url']" :baseData="form" />

            <div class="nm-form-group">
              <label>{{ t('admin.msg_6cccad8f', 'Tên hiển thị') }} <span class="req">*</span></label>
              <input v-model="fName" :placeholder="t('admin.msg_92db95', 'VD: Trang chủ, Sản phẩm...')" />
            </div>
            <div class="nm-form-group">
              <label>{{ t('admin.msg_18903fae', 'Đường dẫn (URL)') }}</label>
              <input v-model="fUrl" :placeholder="t('admin.msg_6d9634', '/ hoặc /products')" />
            </div>
            <div class="nm-form-row">
              <div class="nm-form-group">
                <label>{{ t('admin.msg_544a96b7', 'Kiểu liên kết') }}</label>
                <select v-model="form.type">
                  <option value="single">{{ t('admin.msg_32b09a9c', 'Link đơn') }}</option>
                  <option value="collection">Dropdown</option>
                </select>
              </div>
              <div class="nm-form-group">
                <label>{{ t('admin.msg_df6e28e4', 'Mở trong') }}</label>
                <select v-model="form.target">
                  <option value="_self">{{ t('admin.msg_160b89ab', 'Cùng tab') }}</option>
                  <option value="_blank">{{ t('admin.msg_18ae60d3', 'Tab mới ↗') }}</option>
                </select>
              </div>
            </div>
            <div class="nm-form-group" v-if="form.type === 'single'">
              <label>{{ t('admin.msg_c8e45989', 'Thuộc dropdown (tùy chọn)') }}</label>
              <select v-model="form.collectionId">
                <option :value="null">{{ t('admin.msg_940a4799', '— Không —') }}</option>
                <option v-for="cl in collectionLinks" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
              </select>
            </div>
            <div class="nm-form-row">
              <div class="nm-form-group nm-form-group--icon">
                <label>Icon</label>
                <div class="icon-picker">
                  <button class="icon-picker__trigger" @click="iconDropOpen = !iconDropOpen" type="button">
                    <component v-if="form.icon && icons[form.icon]" :is="icons[form.icon]" :size="16" />
                    <component v-else :is="icons.CircleDashed" :size="16" class="icon-picker__placeholder" />
                    <span>{{ form.icon || t('admin.msg_86458b51', 'Chọn icon') }}</span>
                    <component :is="icons.ChevronDown" :size="12" />
                  </button>
                  <div v-if="iconDropOpen" class="icon-picker__dropdown">
                    <input v-model="iconSearch" :placeholder="t('admin.msg_5674a4', 'Tìm icon...')" class="icon-picker__search" />
                    <div class="icon-picker__grid">
                      <button v-for="name in filteredIcons" :key="name" class="icon-picker__item" :class="{ active: form.icon === name }" @click="selectIcon(name)" type="button" :title="name">
                        <component :is="icons[name]" :size="18" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div class="nm-form-group">
                <label>{{ t('admin.order', 'Thứ tự') }}</label>
                <input v-model.number="form.sort" type="number" />
              </div>
            </div>
          </div>
          <div class="nm-modal__footer">
            <button class="btn-cancel" @click="showModal = false">{{ t('admin.cancel', 'Hủy') }}</button>
            <button class="btn-save" @click="handleSave">
              <component :is="icons.Save" :size="14" /> {{ isEditing ? t('admin.msg_3b7db4b6', 'Cập nhật') : t('admin.msg_af40c066', 'Tạo liên kết') }}
            </button>
          </div>

          <!-- Translates dynamically via Tabs -->
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useToast } from '../composables/useToast.js'
import LanguageTabs from './LanguageTabs.vue'
import MediaPicker from './MediaPicker.vue'
import {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ArrowDown, ArrowUp, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp, Navigation,
  MessageCircle, Send, Share2, ThumbsUp, Eye, Plus, Save,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon, X, Pencil, Trash2,
  GripVertical, PanelBottom
} from 'lucide-vue-next'

const { t, formatCurrency } = useI18n()

const icons = {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ArrowDown, ArrowUp, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp, Navigation,
  MessageCircle, Send, Share2, ThumbsUp, Eye, Plus, Save,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon, X, Pencil, Trash2,
  GripVertical, PanelBottom
}

const availableIcons = Object.keys(icons).filter(n => !['ChevronDown', 'CircleDashed', 'Menu', 'Plus', 'X', 'Pencil', 'Trash2', 'Save', 'ArrowDown', 'ArrowUp', 'GripVertical', 'PanelBottom', 'Navigation'].includes(n))

const { showToast } = useToast()
const props = defineProps({
  languagesInstalled: { type: Boolean, default: false },
})
const { links, loading, fetchLinks, createLink, updateLink, deleteLink } = useNavLinks(apiFetch)

const activeTab = ref('header')
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const currentLang = ref(defaultLangCode.value)

const form = ref({ name: '', url: '', group: 'menu', type: 'single', collectionId: null, target: '_self', icon: '', sort: 0, translations: {} })

import { useContentTranslations } from '../composables/useContentTranslations.js'
import { useLanguages } from '../composables/useLanguages.js'
const { defaultLangCode, loadLanguages: loadLangs } = useLanguages()
loadLangs()
const { tField } = useContentTranslations(form, currentLang)

const fName = tField('name')
const fUrl = tField('url')
const iconDropOpen = ref(false)
const iconSearch = ref('')

// ── Header Links ──
const menuGroupLinks = computed(() =>
  links.value.filter(l => l.group === 'menu' || (!l.group)).sort((a, b) => (a.sort || 0) - (b.sort || 0))
)
const collectionLinks = computed(() => links.value.filter(l => l.type === 'collection'))

const filteredIcons = computed(() => {
  const q = iconSearch.value.toLowerCase()
  if (!q) return availableIcons
  return availableIcons.filter(n => n.toLowerCase().includes(q))
})

function selectIcon(name) { form.value.icon = name; iconDropOpen.value = false; iconSearch.value = '' }

function openCreate(group) {
  isEditing.value = false; editId.value = null; currentLang.value = defaultLangCode.value
  form.value = { name: '', url: '', group: group || 'menu', type: 'single', collectionId: null, target: '_self', icon: '', sort: 0, translations: {} }
  showModal.value = true
}
async function openEdit(l) {
  isEditing.value = true; editId.value = l.id; currentLang.value = defaultLangCode.value
  form.value = { name: l.name, url: l.url || '', group: l.group, type: l.type, collectionId: l.collectionId, target: l.target, icon: l.icon || '', sort: l.sort, translations: {} }
  
  try {
    const transRes = await apiFetch(`/languages/content/nav_links/${l.id}`)
    const transData = await transRes.json()
    if (transData?.grouped) {
      form.value.translations = Array.isArray(transData.grouped) ? {} : transData.grouped
    }
  } catch (e) {
    console.warn('Could not load nav link translations:', e)
  }

  showModal.value = true
}

async function handleSave() {
  if (!form.value.name) return showToast(t('admin.msg_c2d389', 'Nhập tên link'), 'error')
  try {
    if (isEditing.value) {
      await updateLink(editId.value, form.value)
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await createLink({ ...form.value })
      showToast(t('admin.msg_a3e59f', 'Đã tạo link'), 'success')
    }
    showModal.value = false; fetchLinks()
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
}

async function handleDelete(l) {
  if (!confirm(`${t('admin.delete', 'Xóa')} link "${l.name}"?`)) return
  await deleteLink(l.id); fetchLinks()
  showToast(t('admin.msg_ce5fa6', 'Đã xóa'), 'success')
}

// ── Footer Config ──
const defaultFooterConfig = {
  columns: [
    { title: t('admin.msg_1437f79c', 'Về chúng tôi'), type: 'links', links: [{ label: t('admin.msg_33f0741f', 'Giới thiệu'), url: '/page/gioi-thieu' }, { label: t('admin.msg_98b31963', 'Chính sách bảo mật'), url: '/page/chinh-sach-bao-mat' }] },
    { title: t('admin.msg_c1513256', 'Hỗ trợ'), type: 'links', links: [{ label: t('admin.msg_6aba341e', 'Chính sách vận chuyển'), url: '/page/chinh-sach-van-chuyen' }, { label: t('admin.msg_0ea7d28b', 'Đổi trả & Hoàn tiền'), url: '/page/doi-tra' }] },
    { title: t('admin.msg_9276b119', 'Liên hệ'), type: 'contact', items: [{ icon: 'phone', label: 'Hotline', value: '' }, { icon: 'email', label: 'Email', value: '' }] },
  ],
  social: [],
  paymentMethods: ['cod', 'bank'],
  badges: [],
  legalText: '',
  copyrightText: '',
  bgColor: '',
  textColor: '',
  headingColor: '',
  translations: {}
}
const footerConfig = ref(JSON.parse(JSON.stringify(defaultFooterConfig)))
const savingFooter = ref(false)

const currentFooter = computed(() => {
  if (currentLang.value === defaultLangCode.value) return footerConfig.value;
  if (!footerConfig.value.translations) footerConfig.value.translations = {};
  if (!footerConfig.value.translations[currentLang.value]) {
    footerConfig.value.translations[currentLang.value] = JSON.parse(JSON.stringify(footerConfig.value));
    delete footerConfig.value.translations[currentLang.value].translations; 
  }
  return footerConfig.value.translations[currentLang.value];
});

const footerPreviewStyle = computed(() => {
  const s = {}
  if (currentFooter.value.bgColor) s.background = currentFooter.value.bgColor
  return s
})

const allPaymentMethods = [
  { code: 'cod', label: 'COD' }, { code: 'bank', label: 'Bank Transfer' },
  { code: 'momo', label: 'MoMo' }, { code: 'vnpay', label: 'VNPay' },
  { code: 'zalopay', label: 'ZaloPay' }, { code: 'visa', label: 'Visa/MC' },
]

// Drag & Drop
const footerDragIdx = ref(-1)
const footerDragOverIdx = ref(-1)
const footerItemDrag = ref(null)

function onFooterDragStart(e, idx) { footerDragIdx.value = idx; e.dataTransfer.effectAllowed = 'move' }
function onFooterDragEnd() { footerDragIdx.value = -1; footerDragOverIdx.value = -1 }
function onFooterDragOver(e, idx) { footerDragOverIdx.value = idx }
function onFooterDrop(targetIdx) {
  const srcIdx = footerDragIdx.value
  if (srcIdx < 0 || srcIdx === targetIdx) return
  const cols = currentFooter.value.columns
  const [moved] = cols.splice(srcIdx, 1)
  cols.splice(targetIdx, 0, moved)
  footerDragIdx.value = -1; footerDragOverIdx.value = -1
}
function onFooterItemDrop(ci, li) {
  if (!footerItemDrag.value || footerItemDrag.value.ci !== ci) return
  const arr = currentFooter.value.columns[ci].links
  const from = footerItemDrag.value.li; if (from === li) return
  const [item] = arr.splice(from, 1); arr.splice(li, 0, item)
  footerItemDrag.value = null
}
function onFooterContactDrop(ci, ii) {
  if (!footerItemDrag.value || footerItemDrag.value.ci !== ci) return
  const arr = currentFooter.value.columns[ci].items
  const from = footerItemDrag.value.ii; if (from === ii) return
  const [item] = arr.splice(from, 1); arr.splice(ii, 0, item)
  footerItemDrag.value = null
}
function addFooterCol() { currentFooter.value.columns.push({ title: '', type: 'links', links: [], items: [], content: '' }) }
function removeFooterCol(idx) { currentFooter.value.columns.splice(idx, 1) }

// Load/Save Footer via system-config API (same as StorefrontLayoutBuilder)
async function loadFooterConfig() {
  try {
    const res = await apiFetch('/system-config/group/storefront_layout')
    const data = await res.json()
    const items = Array.isArray(data) ? data : (data.data || [])
    const map = {}
    items.forEach(i => { map[i.key] = i.value })
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
          translations: parsedFC.translations || {}
        }
      }
    }
    
    // Load translations
    const transRes = await apiFetch('/languages/content/configs/storefront_layout')
    if (transRes.ok) {
      const transData = await transRes.json()
      const d = transData?.grouped?.layout_footer_config
      if (d) {
        footerConfig.value.translations = {}
        for (const [lang, jsonStr] of Object.entries(d)) {
          footerConfig.value.translations[lang] = JSON.parse(jsonStr)
        }
      }
    }
  } catch (e) { console.error('loadFooterConfig error:', e) }
}

async function saveFooter() {
  savingFooter.value = true
  try {
    const { translations, ...baseConfig } = footerConfig.value;
    
    const transSave = {};
    if (translations) {
      for (const [lang, obj] of Object.entries(translations)) {
        transSave[lang] = { layout_footer_config: JSON.stringify(obj) };
      }
    }

    await apiFetch('/system-config/group/storefront_layout', {
      method: 'PUT',
      body: JSON.stringify({
        items: [
          { key: 'layout_footer_config', value: JSON.stringify(baseConfig) },
        ],
      }),
    })
    
    // Save translations
    await apiFetch('/languages/content/configs/storefront_layout', {
      method: 'POST',
      body: JSON.stringify({ translations: transSave }),
    })
    
    showToast(t('admin.msg_c28060', 'Đã lưu cấu hình Footer'), 'success')
  } catch (e) { showToast(t('admin.msg_aaf377aa', 'Lỗi') + ': ' + e.message, 'error') }
  finally { savingFooter.value = false }
}

onMounted(() => {
  fetchLinks()
  loadFooterConfig()
})
</script>

<style scoped>
.nav-mgr { padding: 0; }

/* Page Title */
.nm-page-title { margin-bottom: 16px; }
.nm-page-title h3 { margin: 0 0 4px; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; color: var(--color-text-primary); }
.nm-page-title p { margin: 0; font-size: 12px; color: var(--color-text-muted); }

/* Tabs */
.nm-tabs { display: flex; gap: 4px; margin-bottom: 16px; background: var(--glass-bg); border-radius: 10px; padding: 4px; }
.nm-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 16px; border: none; border-radius: 8px;
  background: transparent; color: var(--color-text-secondary);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.nm-tab:hover { background: var(--color-bg-card-solid); }
.nm-tab.active { background: var(--color-accent-primary, var(--accent)); color: #fff; box-shadow: var(--accent-shadow); }
.nm-tab__count { font-size: 11px; font-weight: 800; padding: 1px 6px; border-radius: 10px; background: rgba(255,255,255,0.2); }

/* Panel */
.nm-panel { background: var(--color-bg-card-solid); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.nm-section__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.nm-section__info h4 { margin: 0 0 4px; font-size: 14px; color: var(--color-text-primary); }
.nm-hint { font-size: 12px; color: var(--color-text-muted); margin: 0; line-height: 1.5; }

/* Link List */
.nm-list { display: flex; flex-direction: column; gap: 4px; }
.nm-item { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 10px; padding: 12px 16px; transition: all 0.15s; }
.nm-item:hover { border-color: var(--color-accent-primary); }
.nm-item__left { display: flex; align-items: center; gap: 10px; }
.nm-item__order { width: 24px; height: 24px; border-radius: 6px; background: var(--glass-bg); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: var(--color-text-muted); flex-shrink: 0; }
.nm-item__icon { display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 8px; background: var(--color-accent-glow); color: var(--color-accent-primary); flex-shrink: 0; }
.nm-item__icon--sm { width: 24px; height: 24px; border-radius: 6px; }
.nm-item__info { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.nm-item__name { font-size: 13px; font-weight: 700; color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nm-item__url { font-size: 11px; color: var(--color-text-muted); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.nm-badge { padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; flex-shrink: 0; background: rgba(245,158,11,0.12); color: #f59e0b; display: inline-flex; align-items: center; gap: 3px; }
.nm-badge--ext { background: rgba(59,130,246,0.1); color: #3b82f6; }
.nm-item__actions { display: flex; gap: 4px; margin-top: 8px; }
.nm-action { display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid var(--color-border); background: none; color: var(--color-text-secondary); cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.nm-action:hover { background: var(--color-bg-card-hover); }
.nm-action--edit:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.nm-action--delete { border-color: rgba(239,68,68,0.2); color: #ef4444; padding: 5px 8px; }
.nm-action--delete:hover { background: rgba(239,68,68,0.06); border-color: #ef4444; }
.nm-children { margin-top: 8px; padding-left: 24px; display: flex; flex-direction: column; gap: 4px; }
.nm-child { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 8px 12px; border-radius: 8px; border: 1px dashed var(--color-border); background: var(--glass-bg); }
.nm-child__left { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.nm-child__indent { color: var(--color-text-muted); font-size: 12px; flex-shrink: 0; }
.nm-child .nm-item__actions { margin-top: 0; }

/* Buttons */
.btn-add { background: var(--color-accent-primary); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; transition: all 0.2s; box-shadow: var(--accent-shadow); }
.btn-add:hover { transform: translateY(-1px); }
.btn-add--ghost { background: transparent; color: var(--color-accent-primary); border: 2px dashed var(--color-accent-primary); box-shadow: none; }
.btn-save-footer { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent-gradient, var(--accent)); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: var(--accent-shadow); }
.btn-save-footer:hover { transform: translateY(-1px); }
.btn-save-footer:disabled { opacity: 0.5; cursor: wait; transform: none; }
.nm-empty { text-align: center; padding: 32px 24px; color: var(--color-text-muted); display: flex; flex-direction: column; align-items: center; gap: 8px; }
.nm-empty p { margin: 0; font-size: 13px; }

/* Footer Builder */
.footer-builder { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.footer-col-card { background: var(--color-bg-secondary); border: 1px solid var(--color-border); border-radius: 10px; padding: 14px; transition: all 0.15s; }
.footer-col-card:hover { border-color: var(--color-accent-primary); }
.footer-col-card--dragging { opacity: 0.4; }
.footer-col-card--drag-over { border-color: var(--color-accent-primary); box-shadow: 0 0 0 2px var(--color-accent-glow); }
.footer-col-card__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.footer-col-card__label { display: flex; align-items: center; gap: 6px; }
.footer-col-card__grip { cursor: grab; color: var(--color-text-muted); }
.footer-col-card__num { font-size: 12px; font-weight: 800; color: var(--color-accent-primary); text-transform: uppercase; letter-spacing: 0.03em; }

/* Footer inputs */
.ft-input { width: 100%; padding: 7px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 12px; box-sizing: border-box; }
.ft-input:focus { outline: none; border-color: var(--color-accent-primary); }
.ft-input--wide { flex: 1; }
.ft-select { padding: 7px 10px; border-radius: 6px; border: 1px solid var(--color-border); background: var(--color-bg-card-solid); color: var(--color-text-primary); font-size: 12px; cursor: pointer; }
.ft-select--sm { max-width: 110px; }
.ft-textarea { resize: vertical; }
.ft-param-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
.ft-param-row label { font-size: 11px; color: var(--color-text-muted); white-space: nowrap; }
.ft-color { width: 32px; height: 28px; border: 1px solid var(--color-border); border-radius: 4px; cursor: pointer; padding: 0; }

/* Footer link rows */
.footer-link-row { display: flex; align-items: center; gap: 6px; margin-top: 6px; }
.footer-link-row__grip { cursor: grab; color: var(--color-text-muted); flex-shrink: 0; }
.btn-remove-item { display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; border-radius: 4px; border: none; background: none; color: #ef4444; cursor: pointer; flex-shrink: 0; }
.btn-remove-item:hover { background: rgba(239,68,68,0.08); }
.btn-add-item { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; border: 1px dashed var(--color-border); background: none; color: var(--color-text-muted); font-size: 11px; cursor: pointer; margin-top: 6px; }
.btn-add-item:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
.btn-add-col { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px; border-radius: 8px; border: 2px dashed var(--color-border); background: none; color: var(--color-text-muted); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.btn-add-col:hover { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }

/* Extras */
.ft-details { margin-bottom: 10px; border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; }
.ft-details summary { padding: 10px 14px; font-size: 13px; font-weight: 700; color: var(--color-text-primary); cursor: pointer; background: var(--color-bg-secondary); }
.ft-details summary:hover { background: var(--color-bg-card-hover); }
.ft-details > *:not(summary) { padding: 0 14px; }
.ft-details > *:last-child { padding-bottom: 12px; }
.footer-badges-grid { display: flex; flex-wrap: wrap; gap: 8px; padding-top: 8px; }
.footer-badge-check { display: flex; align-items: center; gap: 4px; font-size: 12px; cursor: pointer; }
.footer-badge-check input { accent-color: var(--color-accent-primary); }

/* Colors */
.footer-colors { margin-bottom: 16px; }
.footer-colors h5 { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px; }
.footer-color-row { display: flex; gap: 12px; }
.footer-color-item { flex: 1; }
.footer-color-item label { display: block; font-size: 11px; color: var(--color-text-muted); margin-bottom: 4px; }
.footer-color-pick { display: flex; align-items: center; gap: 6px; }

/* Preview */
.ft-preview { margin-top: 16px; }
.ft-preview h5 { font-size: 13px; font-weight: 700; color: var(--color-text-primary); margin: 0 0 8px; }
.pv-footer { background: #1e293b; border-radius: 8px; padding: 16px; color: #e2e8f0; }
.pv-footer__cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 12px; }
.pv-footer__col-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.04em; color: #f1f5f9; margin-bottom: 6px; }
.pv-footer__link { font-size: 10px; color: #94a3b8; line-height: 1.8; }
.pv-footer__contact { font-size: 10px; color: #94a3b8; line-height: 1.8; display: flex; align-items: center; gap: 4px; }
.pv-footer__text { font-size: 10px; color: #94a3b8; }
.pv-footer__social { display: flex; gap: 6px; justify-content: center; margin-bottom: 8px; }
.pv-footer__social-icon { width: 22px; height: 22px; border-radius: 50%; background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; color: #cbd5e1; }
.pv-footer__copyright { text-align: center; font-size: 9px; color: rgba(148,163,184,0.6); }

/* Modal */
.nm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
.nm-modal { background: var(--color-bg-card-solid); border: 1px solid var(--color-border); border-radius: 16px; width: 100%; max-width: 520px; box-shadow: 0 24px 64px rgba(0,0,0,0.4); animation: nmSlideUp 0.2s ease; }
@keyframes nmSlideUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
.nm-modal__header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 0; }
.nm-modal__header h3 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 0; }
.nm-modal__close { background: none; border: none; cursor: pointer; color: var(--color-text-muted); padding: 4px; border-radius: 6px; }
.nm-modal__close:hover { background: var(--color-bg-card-hover); }
.nm-modal__body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
.nm-modal__footer { display: flex; gap: 8px; justify-content: flex-end; padding: 0 24px 20px; }
.nm-form-group { display: flex; flex-direction: column; gap: 5px; }
.nm-form-group label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); }
.nm-form-group input, .nm-form-group select { width: 100%; padding: 9px 12px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-secondary); color: var(--color-text-primary); font-size: 13px; box-sizing: border-box; }
.nm-form-group input:focus, .nm-form-group select:focus { outline: none; border-color: var(--color-accent-primary); }
.nm-form-row { display: flex; gap: 12px; }
.nm-form-row .nm-form-group { flex: 1; }
.req { color: #ef4444; }
.btn-cancel { padding: 9px 20px; border-radius: 8px; border: 1px solid var(--color-border); background: none; color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 9px 24px; border-radius: 8px; border: none; background: var(--accent-gradient, var(--accent)); color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s; box-shadow: var(--accent-shadow); }
.btn-save:hover { transform: translateY(-1px); }

/* Icon Picker */
.nm-form-group--icon { position: relative; }
.icon-picker { position: relative; }
.icon-picker__trigger { display: flex; align-items: center; gap: 6px; width: 100%; padding: 9px 12px; border: 1px solid var(--color-border); border-radius: 8px; background: var(--color-bg-secondary); color: var(--color-text-primary); font-size: 13px; cursor: pointer; text-align: left; }
.icon-picker__trigger:hover { border-color: var(--color-accent-primary); }
.icon-picker__trigger span { flex: 1; font-size: 12px; }
.icon-picker__placeholder { opacity: 0.3; }
.icon-picker__dropdown { position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 200; background: var(--color-bg-page, var(--color-bg-card-solid)); border: 1px solid var(--color-border); border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,0.2); padding: 8px; max-height: 280px; overflow: hidden; display: flex; flex-direction: column; }
.icon-picker__search { width: 100%; padding: 6px 10px; margin-bottom: 6px; border: 1px solid var(--color-border); border-radius: 6px; background: var(--color-bg-secondary); color: var(--color-text-primary); font-size: 12px; outline: none; }
.icon-picker__search:focus { border-color: var(--color-accent-primary); }
.icon-picker__grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; overflow-y: auto; max-height: 210px; padding: 2px; }
.icon-picker__item { display: flex; align-items: center; justify-content: center; width: 100%; aspect-ratio: 1; border: 1px solid transparent; border-radius: 6px; background: none; cursor: pointer; color: var(--color-text-secondary); transition: all 0.15s; }
.icon-picker__item:hover { background: var(--color-accent-primary); color: #fff; border-color: var(--color-accent-primary); transform: scale(1.1); }
.icon-picker__item.active { background: var(--color-accent-glow); color: var(--color-accent-primary); border-color: var(--color-accent-primary); }

@media (max-width: 640px) {
  .nm-form-row { flex-direction: column; gap: 10px; }
  .nm-item__actions { flex-wrap: wrap; }
  .footer-color-row { flex-direction: column; gap: 8px; }
}
</style>
