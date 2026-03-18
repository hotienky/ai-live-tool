<template>
  <div class="nav-mgr">
    <!-- Setup Guide Banner -->
    <div v-if="links.length === 0 && !loading" class="nm-guide">
      <div class="nm-guide__icon">🚀</div>
      <h3>Thiết lập Menu & Liên kết</h3>
      <p>Tạo menu điều hướng cho cửa hàng của bạn. Gồm 2 phần:</p>
      <div class="nm-guide__steps">
        <div class="nm-guide__step">
          <span class="nm-guide__step-num">1</span>
          <div>
            <strong>Menu Header</strong>
            <p>Các link hiện trên thanh điều hướng chính (Trang chủ, Sản phẩm, Danh mục...)</p>
          </div>
        </div>
        <div class="nm-guide__step">
          <span class="nm-guide__step-num">2</span>
          <div>
            <strong>Footer Links</strong>
            <p>Các link ở cuối trang (Giới thiệu, Chính sách, Liên hệ...)</p>
          </div>
        </div>
      </div>
      <button class="btn-primary" @click="openCreate('menu')">
        <component :is="icons.Plus" :size="14" /> Bắt đầu tạo Menu Header
      </button>
    </div>

    <!-- Header Section -->
    <div v-else>
      <div class="nm-header">
        <h3><component :is="icons.Menu" :size="16" /> Menu & Liên kết</h3>
      </div>

      <!-- Tabs: Header / Footer -->
      <div class="nm-tabs">
        <button class="nm-tab" :class="{ active: activeGroup === 'menu' }" @click="activeGroup = 'menu'">
          <component :is="icons.LayoutGrid" :size="14" />
          Header Menu
          <span class="nm-tab__count">{{ menuGroupLinks.length }}</span>
        </button>
        <button class="nm-tab" :class="{ active: activeGroup === 'footer' }" @click="activeGroup = 'footer'">
          <component :is="icons.ArrowRight" :size="14" />
          Footer Links
          <span class="nm-tab__count">{{ footerGroupLinks.length }}</span>
        </button>
      </div>

      <!-- Active Group Content -->
      <div class="nm-section">
        <div class="nm-section__header">
          <div class="nm-section__info">
            <h4>{{ activeGroup === 'menu' ? '📍 Header Menu' : '📎 Footer Links' }}</h4>
            <p class="nm-section__hint" v-if="activeGroup === 'menu'">
              Hiển thị trên thanh điều hướng chính. Link đầu tiên nên là "Trang chủ".
              <br>Tối đa {{ maxVisible }} link hiển thị trực tiếp, còn lại sẽ nằm trong menu "Thêm".
            </p>
            <p class="nm-section__hint" v-else>
              Hiển thị ở cuối trang (footer). Thường là: Giới thiệu, Liên hệ, Chính sách, Điều khoản...
            </p>
          </div>
          <button class="btn-add" @click="openCreate(activeGroup)">
            <component :is="icons.Plus" :size="14" /> Thêm link
          </button>
        </div>

        <!-- Link list -->
        <div class="nm-list" v-if="activeLinks.length">
          <div v-for="link in activeLinks" :key="link.id" class="nm-item">
            <div class="nm-item__main">
              <span class="nm-item__drag">⠿</span>
              <span v-if="link.icon && icons[link.icon]" class="nm-icon">
                <component :is="icons[link.icon]" :size="16" />
              </span>
              <strong>{{ link.name }}</strong>
              <span class="nm-url">{{ link.url || '#' }}</span>
              <span v-if="link.type === 'collection'" class="nm-badge nm-badge--collection">Dropdown</span>
              <span class="nm-sort">sort: {{ link.sort }}</span>
            </div>
            <div class="nm-item__actions">
              <button class="btn-sm btn-edit" @click="openEdit(link)">Sửa</button>
              <button class="btn-sm btn-move" @click="moveLink(link)" :title="activeGroup === 'menu' ? 'Chuyển xuống Footer' : 'Chuyển lên Header'">
                {{ activeGroup === 'menu' ? '↓ Footer' : '↑ Header' }}
              </button>
              <button class="btn-sm btn-del" @click="handleDelete(link)">×</button>
            </div>
            <!-- Children -->
            <div v-if="link.children && link.children.length" class="nm-children">
              <div v-for="child in link.children" :key="child.id" class="nm-item nm-item--child">
                <div class="nm-item__main">
                  <span v-if="child.icon && icons[child.icon]" class="nm-icon">
                    <component :is="icons[child.icon]" :size="16" />
                  </span>
                  <strong>{{ child.name }}</strong>
                  <span class="nm-url">{{ child.url || '#' }}</span>
                </div>
                <div class="nm-item__actions">
                  <button class="btn-sm btn-edit" @click="openEdit(child)">Sửa</button>
                  <button class="btn-sm btn-del" @click="handleDelete(child)">×</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div v-else class="nm-empty">
          <p>Chưa có link nào trong {{ activeGroup === 'menu' ? 'Header Menu' : 'Footer' }}</p>
          <button class="btn-add btn-add--ghost" @click="openCreate(activeGroup)">
            <component :is="icons.Plus" :size="14" /> Thêm link {{ activeGroup === 'menu' ? 'Header' : 'Footer' }}
          </button>
        </div>

        <!-- Next Step Hint -->
        <div v-if="activeGroup === 'menu' && menuGroupLinks.length > 0 && footerGroupLinks.length === 0" class="nm-next-step">
          <component :is="icons.ArrowRight" :size="14" />
          <span><strong>Bước tiếp theo:</strong> Thêm link cho Footer (Giới thiệu, Liên hệ, Chính sách...)</span>
          <button class="btn-sm btn-next" @click="activeGroup = 'footer'">Đến Footer →</button>
        </div>
        <div v-if="activeGroup === 'footer' && footerGroupLinks.length > 0 && menuGroupLinks.length === 0" class="nm-next-step">
          <component :is="icons.ArrowRight" :size="14" />
          <span><strong>Bước tiếp theo:</strong> Thiết lập Header Menu (Trang chủ, Sản phẩm...)</span>
          <button class="btn-sm btn-next" @click="activeGroup = 'menu'">Đến Header →</button>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>{{ isEditing ? 'Sửa liên kết' : 'Thêm liên kết' }}</h3>
        <div class="form-group"><label>Tên</label><input v-model="form.name" /></div>
        <div class="form-group"><label>URL</label><input v-model="form.url" placeholder="https:// hoặc /page-slug" /></div>
        <div class="form-row">
          <div class="form-group">
            <label>Vị trí</label>
            <select v-model="form.group">
              <option value="menu">📍 Header Menu</option>
              <option value="footer">📎 Footer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Kiểu</label>
            <select v-model="form.type"><option value="single">Single</option><option value="collection">Collection (dropdown)</option></select>
          </div>
        </div>
        <div class="form-group" v-if="form.type === 'single'">
          <label>Thuộc dropdown (tùy chọn)</label>
          <select v-model="form.collectionId">
            <option :value="null">— Không —</option>
            <option v-for="cl in collectionLinks" :key="cl.id" :value="cl.id">{{ cl.name }}</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Target</label>
            <select v-model="form.target"><option value="_self">Cùng tab</option><option value="_blank">Tab mới</option></select>
          </div>
          <div class="form-group form-group--icon">
            <label>Icon</label>
            <div class="icon-picker">
              <button class="icon-picker__trigger" @click="iconDropOpen = !iconDropOpen" type="button">
                <component v-if="form.icon && icons[form.icon]" :is="icons[form.icon]" :size="16" />
                <component v-else :is="icons.CircleDashed" :size="16" class="icon-picker__placeholder" />
                <span>{{ form.icon || 'Chọn icon' }}</span>
                <component :is="icons.ChevronDown" :size="12" />
              </button>
              <div v-if="iconDropOpen" class="icon-picker__dropdown">
                <input v-model="iconSearch" placeholder="Tìm icon..." class="icon-picker__search" />
                <div class="icon-picker__grid">
                  <button
                    v-for="name in filteredIcons" :key="name"
                    class="icon-picker__item"
                    :class="{ active: form.icon === name }"
                    @click="selectIcon(name)"
                    type="button"
                    :title="name"
                  >
                    <component :is="icons[name]" :size="18" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group"><label>Thứ tự</label><input v-model.number="form.sort" type="number" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-save" @click="handleSave">{{ isEditing ? 'Cập nhật' : 'Tạo' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useNavLinks } from '../composables/useNavLinks.js'
import { useToast } from '../composables/useToast.js'
import {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye, Plus,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon
} from 'lucide-vue-next'

const icons = {
  Menu, Home, ShoppingBag, ShoppingCart, Tag, Star, Phone, Info,
  Search, Heart, User, Settings, Bell, Mail, MapPin, Globe,
  BookOpen, FileText, Image, Video, Music, Calendar, Clock,
  Zap, Award, Gift, Bookmark, Grid, List, LayoutGrid,
  ArrowRight, ExternalLink, Link, Folder, FolderOpen,
  Package, Truck, CreditCard, Percent, TrendingUp,
  MessageCircle, Send, Share2, ThumbsUp, Eye, Plus,
  ChevronDown, CircleDashed, Sparkles, Flame, BadgePercent,
  Store, Layers, Coffee, Shirt, Gem, Crown, Palette,
  Headphones, Camera, Monitor, Smartphone, Watch,
  Car, Plane, Building2, Trees, Sun, Moon
}

const availableIcons = Object.keys(icons).filter(n => !['ChevronDown', 'CircleDashed', 'Menu', 'Plus'].includes(n))

const { showToast } = useToast()
const { links, loading, fetchLinks, createLink, updateLink, deleteLink } = useNavLinks(apiFetch)

const activeGroup = ref('menu')
const maxVisible = 5
const showModal = ref(false)
const isEditing = ref(false)
const editId = ref(null)
const form = ref({ name: '', url: '', group: 'menu', type: 'single', collectionId: null, target: '_self', icon: '', sort: 0 })
const iconDropOpen = ref(false)
const iconSearch = ref('')

const menuGroupLinks = computed(() =>
  links.value.filter(l => l.group === 'menu' || (!l.group)).sort((a, b) => (a.sort || 0) - (b.sort || 0))
)
const footerGroupLinks = computed(() =>
  links.value.filter(l => l.group === 'footer').sort((a, b) => (a.sort || 0) - (b.sort || 0))
)
const activeLinks = computed(() => activeGroup.value === 'menu' ? menuGroupLinks.value : footerGroupLinks.value)
const collectionLinks = computed(() => links.value.filter(l => l.type === 'collection'))

const filteredIcons = computed(() => {
  const q = iconSearch.value.toLowerCase()
  if (!q) return availableIcons
  return availableIcons.filter(n => n.toLowerCase().includes(q))
})

function selectIcon(name) {
  form.value.icon = name
  iconDropOpen.value = false
  iconSearch.value = ''
}

function reload() { fetchLinks() }
onMounted(reload)

function openCreate(group) {
  isEditing.value = false; editId.value = null
  form.value = { name: '', url: '', group: group || activeGroup.value, type: 'single', collectionId: null, target: '_self', icon: '', sort: 0 }
  showModal.value = true
}
function openEdit(l) {
  isEditing.value = true; editId.value = l.id
  form.value = { name: l.name, url: l.url || '', group: l.group, type: l.type, collectionId: l.collectionId, target: l.target, icon: l.icon || '', sort: l.sort }
  showModal.value = true
}

async function handleSave() {
  if (!form.value.name) return showToast('Nhập tên link', 'error')
  try {
    if (isEditing.value) {
      await updateLink(editId.value, form.value)
      showToast('Đã cập nhật', 'success')
    } else {
      await createLink({ ...form.value })
      showToast(`Đã tạo link trong ${form.value.group === 'menu' ? 'Header' : 'Footer'}`, 'success')
    }
    showModal.value = false; reload()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function handleDelete(l) {
  if (!confirm(`Xóa link "${l.name}"?`)) return
  await deleteLink(l.id); reload()
  showToast('Đã xóa', 'success')
}

async function moveLink(link) {
  const newGroup = link.group === 'menu' ? 'footer' : 'menu'
  try {
    await updateLink(link.id, { ...link, group: newGroup })
    showToast(`Đã chuyển "${link.name}" sang ${newGroup === 'menu' ? 'Header' : 'Footer'}`, 'success')
    reload()
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}
</script>

<style scoped>
.nav-mgr { padding: 0; }

/* Setup Guide */
.nm-guide {
  text-align: center; padding: 40px 24px;
  background: var(--color-bg-card-solid, var(--bg-2));
  border: 2px dashed var(--color-border, var(--border));
  border-radius: 16px;
}
.nm-guide__icon { font-size: 40px; margin-bottom: 8px; }
.nm-guide h3 { font-size: 18px; font-weight: 800; margin: 0 0 8px; color: var(--color-text-primary, var(--text-1)); }
.nm-guide > p { font-size: 13px; color: var(--color-text-muted, var(--text-3)); margin: 0 0 20px; }
.nm-guide__steps {
  display: flex; gap: 16px; justify-content: center; margin-bottom: 24px;
  text-align: left;
}
.nm-guide__step {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 14px 16px; border-radius: 12px;
  background: var(--glass-bg, rgba(255,255,255,0.05));
  border: 1px solid var(--color-border, var(--border));
  max-width: 260px;
}
.nm-guide__step-num {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 800; color: #fff;
  background: var(--color-accent-primary, var(--accent));
}
.nm-guide__step strong { font-size: 14px; color: var(--color-text-primary, var(--text-1)); }
.nm-guide__step p { font-size: 12px; color: var(--color-text-muted, var(--text-3)); margin: 4px 0 0; }

.btn-primary {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 700;
  background: var(--accent-gradient, var(--accent)); color: #fff; border: none;
  cursor: pointer; box-shadow: var(--accent-shadow); transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-1px); }

/* Header */
.nm-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.nm-header h3 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: .4rem; color: var(--color-text-primary, var(--text-1)); }

/* Tabs */
.nm-tabs {
  display: flex; gap: 4px; margin-bottom: 16px;
  background: var(--glass-bg, rgba(255,255,255,0.03));
  border-radius: 10px; padding: 4px;
}
.nm-tab {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 16px; border: none; border-radius: 8px;
  background: transparent; color: var(--color-text-secondary, var(--text-2));
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.nm-tab:hover { background: var(--color-bg-card-solid, var(--bg-2)); }
.nm-tab.active {
  background: var(--color-accent-primary, var(--accent)); color: #fff;
  box-shadow: var(--accent-shadow);
}
.nm-tab__count {
  font-size: 11px; font-weight: 800;
  padding: 1px 6px; border-radius: 10px;
  background: rgba(255,255,255,0.2);
}

/* Section */
.nm-section {
  background: var(--color-bg-card-solid, var(--bg-2));
  border: 1px solid var(--color-border, var(--border));
  border-radius: 12px; padding: 16px;
}
.nm-section__header {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  margin-bottom: 14px;
}
.nm-section__info h4 { margin: 0 0 4px; font-size: 14px; color: var(--color-text-primary, var(--text-1)); }
.nm-section__hint { font-size: 12px; color: var(--color-text-muted, var(--text-3)); margin: 0; line-height: 1.5; }

/* List */
.nm-list { display: flex; flex-direction: column; gap: 6px; }
.nm-item { background: var(--glass-bg, rgba(255,255,255,0.03)); border: 1px solid var(--color-border, var(--border)); border-radius: 8px; padding: .5rem .7rem; }
.nm-item--child { margin-left: 1.5rem; border-style: dashed; }
.nm-item__main { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
.nm-item__drag { color: var(--color-text-muted, var(--text-3)); cursor: grab; font-size: 12px; }
.nm-icon { display: flex; align-items: center; color: var(--color-accent-primary, var(--accent)); }
.nm-url { font-size: .7rem; color: var(--color-text-muted, var(--text-3)); font-family: monospace; }
.nm-badge { padding: 1px 6px; border-radius: 4px; font-size: .65rem; font-weight: 600; text-transform: uppercase; }
.nm-badge--collection { background: rgba(245,158,11,.15); color: #f59e0b; }
.nm-sort { font-size: .7rem; color: var(--color-text-muted, var(--text-3)); margin-left: auto; }
.nm-item__actions { display: flex; gap: .3rem; margin-top: .3rem; }
.nm-children { margin-top: .3rem; display: flex; flex-direction: column; gap: .2rem; }

/* Buttons */
.btn-add {
  background: var(--color-accent-primary, var(--accent)); color: #fff; border: none;
  padding: .4rem .8rem; border-radius: 6px; cursor: pointer; font-size: .8rem;
  display: flex; align-items: center; gap: 4px; white-space: nowrap; flex-shrink: 0;
}
.btn-add--ghost {
  background: transparent; color: var(--color-accent-primary, var(--accent));
  border: 1px dashed var(--color-accent-primary, var(--accent));
}
.btn-sm { padding: 2px 8px; border-radius: 4px; border: 1px solid var(--color-border, var(--border)); background: var(--color-bg-card-solid, var(--bg-2)); cursor: pointer; font-size: .75rem; color: var(--color-text-primary, var(--text-1)); }
.btn-edit:hover { border-color: var(--color-accent-primary, var(--accent)); color: var(--color-accent-primary, var(--accent)); }
.btn-move { color: var(--color-accent-primary, var(--accent)); font-weight: 600; }
.btn-move:hover { background: var(--color-accent-glow, rgba(99,102,241,.1)); }
.btn-del { color: #ef4444; }
.btn-del:hover { background: rgba(239,68,68,.1); }

/* Empty state */
.nm-empty { 
  text-align: center; padding: 24px; color: var(--color-text-muted, var(--text-3));
}
.nm-empty p { margin: 0 0 12px; font-size: 13px; }

/* Next step hint */
.nm-next-step {
  display: flex; align-items: center; gap: 10px;
  margin-top: 14px; padding: 12px 16px;
  border-radius: 10px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  color: #10b981;
  font-size: 13px;
}
.nm-next-step span { flex: 1; }
.nm-next-step strong { color: var(--color-text-primary, var(--text-1)); }
.btn-next {
  background: #10b981; color: #fff; border: none;
  padding: 6px 14px; border-radius: 6px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
}
.btn-next:hover { background: #059669; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.form-row { display: flex; gap: .5rem; }
.form-row .form-group { flex: 1; }
.form-group { margin-bottom: .5rem; }
.form-group label { display: block; font-size: .75rem; color: var(--color-text-secondary, var(--text-2)); margin-bottom: 2px; }
.form-group input, .form-group select { width: 100%; padding: .4rem .5rem; border: 1px solid var(--color-border, var(--border)); border-radius: 6px; background: var(--color-bg-card-solid, var(--bg-2)); color: var(--color-text-primary, var(--text-1)); font-size: .85rem; }
.modal-actions { display: flex; gap: .5rem; justify-content: flex-end; margin-top: .8rem; }
.btn-cancel { padding: .4rem .8rem; border: 1px solid var(--color-border, var(--border)); border-radius: 6px; background: transparent; color: var(--color-text-secondary, var(--text-2)); cursor: pointer; }
.btn-save { padding: .4rem .8rem; border: none; border-radius: 6px; background: var(--color-accent-primary, var(--accent)); color: #fff; cursor: pointer; }

/* Icon Picker */
.form-group--icon { position: relative; }
.icon-picker { position: relative; }
.icon-picker__trigger {
  display: flex; align-items: center; gap: 6px; width: 100%;
  padding: .4rem .5rem; border: 1px solid var(--color-border, var(--border)); border-radius: 6px;
  background: var(--color-bg-card-solid, var(--bg-2)); color: var(--color-text-primary, var(--text-1)); font-size: .85rem;
  cursor: pointer; text-align: left;
}
.icon-picker__trigger:hover { border-color: var(--color-accent-primary, var(--accent)); }
.icon-picker__trigger span { flex: 1; font-size: .8rem; }
.icon-picker__placeholder { opacity: 0.3; }
.icon-picker__dropdown {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  z-index: 200; background: var(--color-bg-page, var(--bg-1)); border: 1px solid var(--color-border, var(--border));
  border-radius: 10px; box-shadow: 0 8px 30px rgba(0,0,0,.2);
  padding: 8px; max-height: 280px; overflow: hidden;
  display: flex; flex-direction: column;
}
.icon-picker__search {
  width: 100%; padding: 6px 10px; margin-bottom: 6px;
  border: 1px solid var(--color-border, var(--border)); border-radius: 6px;
  background: var(--color-bg-card-solid, var(--bg-2)); color: var(--color-text-primary, var(--text-1)); font-size: .8rem;
  outline: none;
}
.icon-picker__search:focus { border-color: var(--color-accent-primary, var(--accent)); }
.icon-picker__grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  overflow-y: auto; max-height: 210px; padding: 2px;
}
.icon-picker__item {
  display: flex; align-items: center; justify-content: center;
  width: 100%; aspect-ratio: 1; border: 1px solid transparent;
  border-radius: 6px; background: none; cursor: pointer;
  color: var(--color-text-secondary, var(--text-2)); transition: all .15s;
}
.icon-picker__item:hover {
  background: var(--color-accent-primary, var(--accent)); color: #fff;
  border-color: var(--color-accent-primary, var(--accent)); transform: scale(1.1);
}
.icon-picker__item.active {
  background: rgba(99,102,241,.15); color: var(--color-accent-primary, var(--accent));
  border-color: var(--color-accent-primary, var(--accent));
}

@media (max-width: 640px) {
  .nm-guide__steps { flex-direction: column; align-items: center; }
}
</style>
